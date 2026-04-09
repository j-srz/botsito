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

// Nota: Necesitaremos ajustar tu helper 'isAdmin' después para Baileys
const { isAdmin } = require('./utils/helpers'); 

async function startBot() {
    // 1. Gestión de Sesión (Guardará la conexión en la carpeta 'auth_info')
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // Esto reemplaza tu lógica de qrcode-terminal manual
        browser: ["Rex Bot", "MacOS", "3.0.0"],
    });

    // 2. Carga de Comandos (Mantenemos tu lógica modular)
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

    // 3. Manejo de Conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. ¿Reconectando?:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ REX BOT ONLINE (BAILEYS) - SIN CHROMIUM');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 4. Procesamiento de Mensajes
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        // Extraer texto del mensaje (Baileys maneja varios tipos)
        const messageType = Object.keys(m.message)[0];
        const body = (messageType === 'conversation') ? m.message.conversation : 
                     (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (messageType === 'imageMessage') ? m.message.imageMessage.caption : 
                     (messageType === 'videoMessage') ? m.message.videoMessage.caption : '';

        const text = body.toLowerCase().trim();
        const jid = m.key.remoteJid; // El ID del chat (grupo o usuario)
        const isGroup = jid.endsWith('@g.us');

        // Whitelist desde .env
        const gruposAdmitidos = process.env.ALLOWED_GROUPS 
            ? process.env.ALLOWED_GROUPS.split(',').map(id => id.trim()) 
            : [];

        // Buscamos el comando
        const cmdName = Array.from(commands.keys()).find(n => text === n || text.startsWith(n + ' '));

        if (cmdName) {
            try {
                // El sender es quien envía el mensaje
                const sender = m.key.participant || m.key.remoteJid;

                if (isGroup) {
                    // A. BLOQUEO ADMIN (Ajustaremos isAdmin en el siguiente paso)
                    const authorized = await isAdmin(sock, jid, sender);
                    if (!authorized) return;

                    // B. FILTRO DE WHITELIST
                    if (cmdName !== '.id' && !gruposAdmitidos.includes(jid)) {
                        return;
                    }
                }

                // Ejecutamos pasándole 'sock' (el cliente) y 'm' (el mensaje crudo)
                await commands.get(cmdName).execute(sock, m, body);
                
            } catch (err) {
                console.error('Error en comando:', err);
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }
        }
    });
}

startBot();