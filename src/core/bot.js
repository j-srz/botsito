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

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 2000;

class BotClient {
    constructor() {
        this.sock = null;
        this._reconnectAttempts = 0;
        this._reconnectTimer = null;
    }

    async init() {
        // Inicializar handlers y dependencias
        await messageHandler.init();

        // Iniciar conexión
        await this._connectToWhatsApp();
    }

    _scheduleReconnect() {
        if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Reconexión fallida tras ${MAX_RECONNECT_ATTEMPTS} intentos. Reinicia el proceso manualmente.`);
            process.exit(1);
        }

        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this._reconnectAttempts);
        this._reconnectAttempts++;
        logger.warn(`Reintentando conexión en ${delay}ms (intento ${this._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = setTimeout(() => this._connectToWhatsApp(), delay);
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
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                logger.warn(`Conexión cerrada. Código: ${statusCode}. LoggedOut: ${isLoggedOut}`);

                if (isLoggedOut) {
                    logger.error('Desconectado permanentemente (Logged Out). Borra la carpeta auth_info y escanea de nuevo.');
                } else {
                    this._scheduleReconnect();
                }
            } else if (connection === 'open') {
                this._reconnectAttempts = 0; // reset al reconectar exitosamente
                clearTimeout(this._reconnectTimer);
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
