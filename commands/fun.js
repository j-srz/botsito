const path = require('path');
const fs = require('fs');
const { isAdmin, getLegend } = require('../utils/helpers');

module.exports = [
    { 
        name: '.ping', 
        execute: async (sock, m) => {
            await sock.sendMessage(m.key.remoteJid, { text: 'pong' }, { quoted: m });
        } 
    },
    { 
        name: '.1500', 
        execute: async (sock, m) => {
            await sock.sendMessage(m.key.remoteJid, { text: 'milquinientos' }, { quoted: m });
        } 
    },
    {
        name: '.vtalv',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            if (!quoted) return sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });

            const target = quoted.participant.split('@')[0];
            const sender = m.pushName || m.key.participant?.split('@')[0] || 'Alguien';
            
            await sock.sendMessage(jid, { 
                text: `\`${sender}\` _dice:_ \`${target}\` vtalv ⊂(◉‿◉)つ` 
            }, { quoted: m });
        }
    },
    {
        name: '.wassaa',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            if (!quoted) return;

            const target = quoted.participant.split('@')[0];
            const videoUrl = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4';
            
            try {
                await sock.sendMessage(jid, { 
                    video: { url: videoUrl }, 
                    gifPlayback: true, 
                    caption: `\`${target}\` wassaaa!!!` 
                }, { quoted: m });
            } catch (e) { await sock.sendMessage(jid, { text: 'Error con el video.' }); }
        }
    },
    {
        name: '.kiss',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
            if (!quotedInfo) return sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });

            const targetJid = quotedInfo.participant; // ID del que recibe el beso
            const targetNumber = targetJid.split('@')[0].split(':')[0]; // Número limpio
            const senderName = m.pushName || 'Alguien';
            const videoPath = path.join(__dirname, '../media/kiss.mp4');

            try {
                await sock.sendMessage(jid, { 
                    video: fs.readFileSync(videoPath), 
                    gifPlayback: true, 
                    // Usamos @número y lo metemos en 'mentions' para que se vea el nombre
                    caption: `\`${senderName}\` _besó a_ @${targetNumber} 💋`,
                    mentions: [targetJid] 
                }, { quoted: m });
            } catch (e) { 
                await sock.sendMessage(jid, { 
                    text: `\`${senderName}\` _besó a_ @${targetNumber} 💋`,
                    mentions: [targetJid]
                }, { quoted: m }); 
            }
        }
    },
    {
        name: '.tickle',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            if (!quoted) return;

            const target = quoted.participant.split('@')[0];
            const sender = m.pushName || 'Alguien';
            await sock.sendMessage(jid, { text: `*${sender} hace cosquillas a ${target}*` }, { quoted: m });
        }
    },
    {
        name: '.todos',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            if (!jid.endsWith('@g.us')) return;

            await sock.sendMessage(jid, { react: { text: '📣', key: m.key } });

            const groupMetadata = await sock.groupMetadata(jid);
            const mentions = groupMetadata.participants.map(p => p.id);
            let list = `*Llamando rexitos*\n╔ ========\n`;

            for (let participant of groupMetadata.participants) {
                list += `║ 🦖 @${participant.id.split('@')[0]}\n`;
            }

            list += `╚ ========\n*Llamados*${getLegend()}`;
            await sock.sendMessage(jid, { text: list, mentions }, { quoted: m });
        }
    },
    {
        name: '.smoke',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            await sock.sendMessage(jid, { react: { text: '🚬', key: m.key } });

            const sender = m.key.participant || jid;
            const gifUrl = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExank0a3B5ODl2dTJlbm5rMGw1MzVvcWswbzVnY2twYmNneDF2NmZkaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpAPQVW9lWnWU/giphy.gif';
            
            try {
                await sock.sendMessage(jid, { 
                    video: { url: gifUrl }, 
                    gifPlayback: true, 
                    caption: `💨 @${sender.split('@')[0]} ${getLegend()}`,
                    mentions: [sender]
                }, { quoted: m });
            } catch (e) { 
                await sock.sendMessage(jid, { text: `💨 @${sender.split('@')[0]} dándose un toque...` }); 
            }
        }
    },
    {
        name: '.gg',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
            if (!quotedInfo) return;

            const quotedMsg = quotedInfo.quotedMessage;
            const quotedBody = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";
            
            const amountMatch = quotedBody.match(/\d+/);
            const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

            await sock.sendMessage(jid, { react: { text: '🏆', key: { ...m.key, id: quotedInfo.stanzaId, participant: quotedInfo.participant } } });

            const winnerEntry = {
                fecha: new Date().toLocaleString('es-MX'),
                admin_nombre: m.pushName || 'Admin',
                admin_id: m.key.participant || jid,
                ganador_nombre: 'Usuario', // Baileys no trae el pushname del citado fácilmente sin store
                ganador_id: quotedInfo.participant,
                monto: amount,
                grupo: (await sock.groupMetadata(jid)).subject
            };

            const dataPath = path.join(__dirname, '../data');
            const filePath = path.join(dataPath, 'subastas_registro.json');

            try {
                if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
                let registro = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : [];
                registro.push(winnerEntry);
                await fs.promises.writeFile(filePath, JSON.stringify(registro, null, 2));
            } catch (err) { console.error(err); }
        }
    },
    {
        name: '.resumen',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant || jid;

            if (!(await isAdmin(sock, jid, sender))) return;

            const filePath = path.join(__dirname, '../data/subastas_registro.json');
            if (!fs.existsSync(filePath)) return await sock.sendMessage(jid, { text: 'Sin registros aún.' });

            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const stats = {};
                data.forEach(p => {
                    if (!stats[p.ganador_id]) {
                        stats[p.ganador_id] = { victorias: 0, total: 0 };
                    }
                    stats[p.ganador_id].victorias += 1;
                    stats[p.ganador_id].total += p.monto;
                });

                const ranking = Object.entries(stats).sort((a, b) => b[1].victorias - a[1].victorias);
                let res = `*📊 RESUMEN DE SUBASTAS*\n_Top Ganadores_\n\n`;
                
                ranking.forEach(([id, user], i) => {
                    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤';
                    res += `${medalla} *${id.split('@')[0]}*\n`;
                    res += `   └ Wins: ${user.victorias} | Total: $${user.total}\n`;
                });

                await sock.sendMessage(jid, { text: res + getLegend() }, { quoted: m });
            } catch (err) { await sock.sendMessage(jid, { text: 'Error al procesar resumen.' }); }
        }
    }
];