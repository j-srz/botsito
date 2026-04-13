const logger = require('../core/logger');
const CommandRegistry = require('../commands/command.registry');
const whitelistMiddleware = require('../middlewares/whitelist.middleware');
const antilinkMiddleware = require('../middlewares/antilink.middleware');
const path = require('path');

class MessageHandler {
    constructor() {
        this.registry = new CommandRegistry();
    }

    async init() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        this.registry.loadCommands(commandsPath);
    }

    _buildContext(m) {
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || '';
        
        const rawBody = body;
        const text = rawBody.toLowerCase().trim();
                     
        return {
            jid: m.key.remoteJid,
            sender: m.key.participant || m.key.remoteJid,
            pushName: m.pushName || "Usuario Desconocido",
            isGroup: m.key.remoteJid.endsWith('@g.us'),
            rawBody,
            text,
            args: text.split(' ')
        };
    }

    async handle(sock, m) {
        if (!m.message || m.key.fromMe) return;

        const ctx = this._buildContext(m);

        // Security Middlewares
        if (ctx.isGroup) {
            const isAllowed = await whitelistMiddleware.handle(ctx);
            if (!isAllowed) {
                // To allow ".id" to bypass whitelist (from the old logic):
                if (ctx.text === '.id') {
                    const idCmd = this.registry.findCommand('.id');
                    if (idCmd) await idCmd.execute(sock, m, ctx);
                }
                return;
            }
        }

        // Antilink verification (deletes message if true and applies strikes)
        const isSafeFromLinks = await antilinkMiddleware.handle(sock, m, ctx);
        if (!isSafeFromLinks) return;

        // Command matching
        const command = this.registry.findCommand(ctx.text);
        if (command) {
            logger.info(`📩 Comando detectado: ${command.name} | Chat: ${ctx.jid} | Sender: ${ctx.sender}`);
            try {
                await command.execute(sock, m, ctx);
            } catch (err) {
                logger.error(`❌ Error ejecutando comando ${command.name}:`, err);
                await sock.sendMessage(ctx.jid, { react: { text: '❌', key: m.key } });
            }
        }
    }
}

module.exports = new MessageHandler();
