const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./logger');
const env = require('../config/env.config');
const messageHandler = require('../handlers/message.handler');
const reactionHandler = require('../handlers/reaction.handler');

class BotClient {
    constructor() {
        this.sock = null;
    }

    async init() {
        // Inicializar handlers y dependencias
        await messageHandler.init();

        // Iniciar conexión
        await this._connectToWhatsApp();
    }

    async _connectToWhatsApp() {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const { version } = await fetchLatestBaileysVersion();

        this.sock = makeWASocket({
            version,
            auth: state,
            browser: ["Rex Bot V2", "MacOS", "3.0.0"],
            // Sync restrictions to optimize Raspberry Pi
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            linkPreview: false,
            markOnlineOnConnect: true,
        });

        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                logger.info('Generando QR, por favor escanea con tu celular:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn('Conexión cerrada. ¿Debe reconectar?', shouldReconnect);
                if (shouldReconnect) {
                    this._connectToWhatsApp();
                } else {
                    logger.error('Desconectado permanentemente (Logged Out). Borra la carpeta auth_info y escanea de nuevo.');
                }
            } else if (connection === 'open') {
                logger.info('✅ REX BOT V2 ONLINE (Arquitectura Limpia)');
                logger.info('Grupos en Whitelist:', env.ALLOWED_GROUPS);
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            const m = messages[0];

            if (m.message?.reactionMessage) {
                await reactionHandler.handle(this.sock, m);
                return;
            }

            await messageHandler.handle(this.sock, m);
        });
    }
}

module.exports = new BotClient();
