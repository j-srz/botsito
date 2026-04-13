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
const { isAdmin, registrarLog } = require('./utils/helpers'); 
const { readFriendlyList, saveFriendlyList } = require('./commands/admin');

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

        // --- 1. DETECCIÓN DE REACCIONES (EL "OÍDO" DEL BOT) ---
        const reaction = m.message?.reactionMessage;
        if (reaction) {
            try {
                let data = readFriendlyList(); // Esta función viene de admin.js
                
                // Verificamos si están reaccionando al mensaje de la rifa activa
                if (data.messageId && reaction.key.id === data.messageId) {
                    const reactor = m.key.participant || m.key.remoteJid;
                    
                    // Si el usuario no está en la lista, lo metemos
                    if (!data.participants.includes(reactor)) {
                        data.participants.push(reactor);
                        saveFriendlyList(data);
                        console.log(`✅ Participante anotado por reacción: ${reactor}`);
                    }
                }
            } catch (e) {
                console.error("❌ Error en el listener de reacciones:", e);
            }
            return; // Muy importante: detenemos el proceso aquí porque las reacciones no son comandos
        }

        // --- 2. LÓGICA ORIGINAL DE COMANDOS ---
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


        const settingsPath = path.join(__dirname, 'data', 'group_settings.json');
        const warningsPath = path.join(__dirname, 'data', 'antilink_warnings.json');
        const logsPath = path.join(__dirname, 'data', 'antilink_logs.json');

        if (isGroup && /https?:\/\/|chat.whatsapp.com/gi.test(body)) {
            let settings = {};
            if (fs.existsSync(settingsPath)) settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

            if (settings[jid]?.antilink) {
                const authorized = await isAdmin(sock, jid, sender);

                // --- DATOS PARA EL REGISTRO ---
                const groupMetadata = await sock.groupMetadata(jid);
                const senderName = m.pushName || "Usuario Desconocido";
                const senderNumber = sender.split('@')[0].split(':')[0];
                const timestamp = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

                if (authorized) {
                    // SI ES ADMIN: Solo palomita y log de "Verificado"
                    await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
                    registrarLog(logsPath, { 
                        groupId: jid, groupName: groupMetadata.subject, message: body, 
                        name: senderName, num: senderNumber, id: sender, date: timestamp, action: "ADMIN_VERIFICADO" 
                    });
                } else {
                    // SI NO ES ADMIN: Borramos y aplicamos sistema de strikes
                    await sock.sendMessage(jid, { delete: m.key });

                    let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf-8')) : {};
                    if (!warnings[jid]) warnings[jid] = {};
                    
                    let userStrikes = warnings[jid][sender] || 0;
                    userStrikes++;

                    if (userStrikes >= 2) {
                        // ACCIÓN: BAN
                        await sock.sendMessage(jid, { 
                            text: `🚫 *@${senderNumber}* expulsado por reincidir con enlaces.`, 
                            mentions: [sender] 
                        });
                        await sock.groupParticipantsUpdate(jid, [sender], "remove");
                        warnings[jid][sender] = 0; // Reset
                        
                        registrarLog(logsPath, { 
                            groupId: jid, groupName: groupMetadata.subject, message: body, 
                            name: senderName, num: senderNumber, id: sender, date: timestamp, action: "BAN" 
                        });
                    } else {
                        // ACCIÓN: ADVERTENCIA
                        warnings[jid][sender] = userStrikes;
                        await sock.sendMessage(jid, { 
                            text: `⚠️ *@${senderNumber}*, los enlaces no están permitidos.\n\n*ÚLTIMA ADVERTENCIA.* Si mandas otro, vas pa' fuera.`, 
                            mentions: [sender] 
                        });

                        registrarLog(logsPath, { 
                            groupId: jid, groupName: groupMetadata.subject, message: body, 
                            name: senderName, num: senderNumber, id: sender, date: timestamp, action: "ADVERTENCIA" 
                        });
                    }
                    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
                    return; // Detenemos aquí para que no intente ejecutar el link como comando
                }
            }
        }


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