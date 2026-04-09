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

// 1. CARGA SEGURA DE GRUPOS
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
        browser: ["Rex Bot", "MacOS", "3.0.0"],
        // --- CONFIGURACIÓN PARA RASPBERRY PI (ALTA VELOCIDAD) ---
        syncFullHistory: false,            // No descargar mensajes viejos
        shouldSyncHistoryMessage: () => false, // Bloquear sincronización de historial
        linkPreview: false,                // Ahorrar CPU no procesando links
        markOnlineOnConnect: true,
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
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ REX BOT ONLINE (BAILEYS OPTIMIZADO)');
            console.log('Grupos en Whitelist:', gruposAdmitidos);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        // Extraer texto
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || '';

        const text = body.toLowerCase().trim();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = m.key.participant || m.key.remoteJid;

        const cmdName = Array.from(commands.keys()).find(n => text === n || text.startsWith(n + ' '));

        if (cmdName) {
            // LOG DE DEBUG (Aparecerá en pm2 logs)
            console.log(`📩 Comando detectado: ${cmdName} | Chat: ${jid} | Sender: ${sender}`);

            try {
                // EXCEPCIÓN DE SEGURIDAD: .id siempre responde
                if (cmdName === '.id') {
                    return await commands.get('.id').execute(sock, m, body);
                }

                if (isGroup) {
                    // A. Filtro de Whitelist (.env)
                    if (!gruposAdmitidos.includes(jid)) {
                        console.log(`🚫 Grupo no autorizado: ${jid}`);
                        return;
                    }

                    // B. Verificación de Admin
                    const authorized = await isAdmin(sock, jid, sender);
                    if (!authorized) {
                        console.log(`⚠️ Intento de uso sin ser admin: ${sender}`);
                        return;
                    }
                }

                // Si pasó los filtros, ejecutar
                await commands.get(cmdName).execute(sock, m, body);
                
            } catch (err) {
                console.error('❌ Error ejecutando comando:', err);
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }
        }
    });
}

startBot();