const logger = require('../core/logger');
const CommandRegistry = require('../commands/command.registry');
const whitelistMiddleware = require('../middlewares/whitelist.middleware');
const antilinkMiddleware = require('../middlewares/antilink.middleware');
const sessionManager = require('../core/session/group.session.manager');
const path = require('path');

class MessageHandler {
    constructor() {
        this.registry = new CommandRegistry();
    }

    async init() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        this.registry.loadCommands(commandsPath);
    }

    async _buildContext(sock, m) {
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || '';
        
        const rawBody = body;
        const text = rawBody.toLowerCase().trim();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
                     
        // Inyectar Session Proxy
        const groupState = isGroup ? await sessionManager.getSession(jid) : null;

        return {
            jid,
            sender: m.key.participant || m.key.remoteJid,
            pushName: m.pushName || "Usuario Desconocido",
            isGroup,
            rawBody,
            text,
            args: text.split(' '),
            groupState,
            // Helpers
            reply: async (replyText) => sock.sendMessage(jid, { text: replyText }, { quoted: m }),
            react: async (emoji) => sock.sendMessage(jid, { react: { text: emoji, key: m.key } })
        };
    }

    async handle(sock, m) {
        if (!m.message || m.key.fromMe) return;

        const ctx = await this._buildContext(sock, m);

        // Security Middlewares
        if (ctx.isGroup) {
            const isAllowed = await whitelistMiddleware.handle(ctx);
            if (!isAllowed) {
                if (ctx.text === '.id') {
                    const idCmd = this.registry.findCommand('.id');
                    if (idCmd) await idCmd.execute(sock, m, ctx);
                }
                return;
            }
        }

        // Antilink verification
        const isSafeFromLinks = await antilinkMiddleware.handle(sock, m, ctx);
        if (!isSafeFromLinks) return;

        // Command matching
        const command = this.registry.findCommand(ctx.text);
        if (command) {
            logger.info(`📩 Comando detectado: ${command.name} | Chat: ${ctx.jid}`);
            try {
                await command.execute(sock, m, ctx);
            } catch (err) {
                logger.error(`❌ Error ejecutando comando ${command.name}:`, err);
                await ctx.react('❌');
            }
        }
    }
}

module.exports = new MessageHandler();
