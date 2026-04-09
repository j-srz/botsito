require('dotenv').config();
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('./utils/helpers'); 

// 1. CARGA SEGURA DE GRUPOS (Fuera de la función para mayor velocidad)
const rawGroups = process.env.ALLOWED_GROUPS || ""; 
const gruposAdmitidos = rawGroups.length > 0 
    ? rawGroups.split(',').map(id => id.trim()) 
    : [];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        // Eliminamos printQRInTerminal para evitar el aviso de "deprecated"
        // y lo manejamos abajo con el evento 'qr'
        browser: ["Rex Bot", "MacOS", "3.0.0"],
    });

    const commands = new Map();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const cmd = require(`./commands/${file}`);
        if (Array.isArray(cmd)) {
            cmd.forEach(c => commands.set(c.name, c));
        } else {
            commands.set(cmd.name, cmd);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Manejo manual del QR
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ REX BOT ONLINE');
            console.log('Grupos autorizados:', gruposAdmitidos.length);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        // 2. EXTRACCIÓN DE TEXTO MEJORADA
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || '';

        const text = body.toLowerCase().trim();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        const cmdName = Array.from(commands.keys()).find(n => text === n || text.startsWith(n + ' '));

        if (cmdName) {
            try {
                // Obtenemos el sender (quien envía el mensaje)
                const sender = m.key.participant || m.key.remoteJid;

                if (isGroup) {
                    // A. Verificación de Admin
                    const authorized = await isAdmin(sock, jid, sender);
                    if (!authorized) return;

                    // B. Filtro de Whitelist (Excepto para el comando .id)
                    if (cmdName !== '.id' && !gruposAdmitidos.includes(jid)) {
                        return;
                    }
                }

                await commands.get(cmdName).execute(sock, m, body);
                
            } catch (err) {
                console.error('Error:', err);
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }
        }
    });
}

startBot();