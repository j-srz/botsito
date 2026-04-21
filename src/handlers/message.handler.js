'use strict';
const logger = require('../core/logger');
const CommandRegistry = require('../commands/command.registry');
const antilinkMiddleware = require('../middlewares/antilink.middleware');
const commercialMiddleware = require('../middlewares/commercial.middleware');
const moderationService = require('../services/moderation.service');
const groupService = require('../services/group.service');
const sessionManager = require('../core/session/group.session.manager');
const db = require('../data/db');
const path = require('path');

const PREFIX = '.';

class MessageHandler {
    constructor() {
        this.registry = new CommandRegistry();
    }

    async init() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        this.registry.loadCommands(commandsPath);
    }

    _extractBody(m) {
        return m.message?.conversation ||
               m.message?.extendedTextMessage?.text ||
               m.message?.imageMessage?.caption ||
               m.message?.videoMessage?.caption || '';
    }

    async _buildContext(sock, m) {
        const rawBody = this._extractBody(m);
        const text = rawBody.toLowerCase().trim();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = m.key.participant || m.key.remoteJid;
        const groupState = isGroup ? await sessionManager.getSession(jid) : null;

        const commercialService = require('../services/commercial.service');
        const isAdmin = isGroup ? await groupService.isAdmin(sock, jid, sender) : false;
        const isBotAdmin = isGroup ? await groupService.isBotAdmin(sock, jid) : false;
        const isOwner = commercialService.isOwner(sender) || await commercialService.isCommercialAdmin(sender);

        return {
            jid,
            sender,
            pushName: m.pushName || 'Usuario Desconocido',
            isGroup,
            isAdmin,
            isOwner,
            isBotAdmin,
            rawBody,
            text,
            args: text.split(' '),
            groupState,
            reply: async (replyText) => sock.sendMessage(jid, { text: replyText }, { quoted: m }),
            react: async (emoji) => sock.sendMessage(jid, { react: { text: emoji, key: m.key } })
        };
    }

    async handle(sock, m) {
        if (!m.message || m.key.fromMe) return;

        const rawBody = this._extractBody(m);
        const text = rawBody.toLowerCase().trim();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = m.key.participant || jid;
        const hasPrefix = text.startsWith(PREFIX);

        // ─── GUARD #1: Descarte inmediato por prefijo — cero overhead ──────────────
        if (!hasPrefix) {
            if (isGroup) {
                // Antilink y logging deben correr aunque no sea un comando
                const minCtx = {
                    jid, sender, isGroup: true, text, rawBody,
                    args: text.split(' '), groupState: null,
                    reply: async (t) => sock.sendMessage(jid, { text: t }, { quoted: m }),
                    react: async (e) => sock.sendMessage(jid, { react: { text: e, key: m.key } })
                };
                moderationService.logMessage(jid, sender, m.key).catch(() => {});
                await antilinkMiddleware.handle(sock, m, minCtx);
            } else {
                // DM sin prefijo: continuar solo si hay sesión remota activa
                const sessions = await db.remoteSessions.read();
                if (!sessions[jid]) return;
            }
            return;
        }

        // ─── Mensaje tiene prefijo → construir contexto completo ──────────────────
        let ctx = await this._buildContext(sock, m);

        if (isGroup) {
            require('../services/group.registry').registerActivity(jid)
                .catch(e => logger.error(`[group.registry] ${e.message}`));
        }

        // Remote middleware — intercepta .remote y sesiones sticky
        const remoteResult = await require('../middlewares/remote.middleware').handle(sock, m, ctx);
        if (remoteResult?.intercepted) {
            if (!remoteResult.allowed) return;
            ctx.isAdmin = true;
            if (remoteResult.spoofedSock) sock = remoteResult.spoofedSock;
        }

        // License check
        if (ctx.isGroup) {
            const licenseOk = await commercialMiddleware.handle(sock, m, ctx);
            if (!licenseOk) return;
        }

        // Moderation logging para mensajes con prefijo (no-prefijo ya logueó arriba)
        if (ctx.isGroup) {
            moderationService.logMessage(ctx.jid, ctx.sender, m.key)
                .catch(e => logger.error(`[moderation] ${e.message}`));
        }

        // Antilink para mensajes con prefijo (no-prefijo ya lo procesó arriba)
        const isSafeFromLinks = await antilinkMiddleware.handle(sock, m, ctx);
        if (!isSafeFromLinks) return;

        // ─── FIREWALL: Solo Admins o Owner ────────────────────────────────────────
        if (!ctx.isAdmin && !ctx.isOwner) {
            logger.warn(`[SECURITY] Comando bloqueado: "${ctx.text}" | sender=${ctx.sender}`);
            return;
        }

        const command = this.registry.findCommand(ctx.text);
        if (!command) return;

        if (ctx.isGroup) {
            const commandControlService = require('../services/command-control.service');
            const cmdName = command.name.replace(/^\./, '');
            if (await commandControlService.isDisabled(ctx.jid, cmdName)) {
                return await ctx.reply('📴 Este comando está desactivado en este grupo.');
            }
        }

        logger.info(`📩 ${command.name} | ${ctx.jid}`);
        try {
            await command.execute(sock, m, ctx);
        } catch (err) {
            if (err?.silent) return;
            if (err?.reply) return await ctx.reply(err.reply);
            logger.error(`❌ Error en ${command.name}:`, err);
            await ctx.react('❌');
        }
    }
}

module.exports = new MessageHandler();
