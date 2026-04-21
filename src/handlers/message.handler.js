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

        const jid = m.key.remoteJid;
        const isPrivate = !jid.endsWith('@g.us');

        // ─── GUARD CLAUSE: Chats privados sin prefijo ni sesión remota → ignorar ──
        // Evita construir contexto completo para mensajes privados irrelevantes
        if (isPrivate) {
            const quickBody = this._extractBody(m);
            if (!quickBody.trim().startsWith(PREFIX)) {
                const sessions = await db.remoteSessions.read();
                if (!sessions[jid]) return;
            }
        }

        let ctx = await this._buildContext(sock, m);

        if (ctx.isGroup) {
            require('../services/group.registry').registerActivity(ctx.jid)
                .catch(e => logger.error(`[group.registry] ${e.message}`));
        }

        // Remote middleware — intercepta .remote y genera ctx/sock suplantados
        const remoteResult = await require('../middlewares/remote.middleware').handle(sock, m, ctx);
        if (remoteResult?.intercepted) {
            if (!remoteResult.allowed) return;
            ctx.isAdmin = true;
            if (remoteResult.spoofedSock) sock = remoteResult.spoofedSock;
        }

        // License check — auto-salida si el grupo no tiene licencia activa
        if (ctx.isGroup) {
            const licenseOk = await commercialMiddleware.handle(sock, m, ctx);
            if (!licenseOk) return;
        }

        // Moderation logging — alimenta .totalchat y .fantasmas (corre en todos los mensajes)
        if (ctx.isGroup) {
            moderationService.logMessage(ctx.jid, ctx.sender, m.key)
                .catch(e => logger.error(`[moderation] ${e.message}`));
        }

        // Antilink — corre sobre todos los mensajes del grupo, incluyendo no-comandos
        const isSafeFromLinks = await antilinkMiddleware.handle(sock, m, ctx);
        if (!isSafeFromLinks) return;

        // ─── GUARD CLAUSE DE PREFIJO ─────────────────────────────────────────────
        // Mensajes sin prefijo no activan el pipeline de comandos — retorno silencioso
        if (!ctx.text.startsWith(PREFIX)) return;

        // ─── FIREWALL DE SEGURIDAD ────────────────────────────────────────────────
        // Solo se loggea si alguien intentó usar un comando real sin permiso
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
