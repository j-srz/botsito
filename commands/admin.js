const { isAdmin, getLegend } = require('../utils/helpers');

module.exports = [
    {
        name: '.kick',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            if (!jid.endsWith('@g.us')) return;

            const sender = m.key.participant;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

            if (quotedInfo && quotedInfo.quotedMessage) {
                const target = quotedInfo.participant;
                const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                // Autodefensa: Si el objetivo es el bot, saca al que envió el comando
                if (target === botId) {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    return await sock.sendMessage(jid, { text: 'Intentaste kickearme... ¡Adiós!' });
                }

                if (await isAdmin(sock, jid, sender)) {
                    await sock.groupParticipantsUpdate(jid, [target], 'remove');
                    await sock.sendMessage(jid, { react: { text: '👢', key: m.key } });
                }
            }
        }
    },
    {
        name: '.promote',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

            if (quotedInfo && quotedInfo.quotedMessage && await isAdmin(sock, jid, sender)) {
                const target = quotedInfo.participant;
                await sock.groupParticipantsUpdate(jid, [target], 'promote');
                await sock.sendMessage(jid, { react: { text: '🆙', key: m.key } });
            }
        }
    },
    {
        name: '.demote',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

            if (quotedInfo && quotedInfo.quotedMessage && await isAdmin(sock, jid, sender)) {
                const target = quotedInfo.participant;
                await sock.groupParticipantsUpdate(jid, [target], 'demote');
                await sock.sendMessage(jid, { react: { text: '⬇️', key: m.key } });
            }
        }
    },
    {
        name: '.close',
        execute: async (sock, m, body) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant;

            if (!(await isAdmin(sock, jid, sender))) return;

            const args = body.split(' ');
            const timeStr = args[1];

            // CASO 1: Cierre instantáneo
            if (!timeStr) {
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { react: { text: '🔒', key: m.key } });
                const text = `_Grupo Cerrado_ 🔒\n_por_ @${sender.split('@')[0]}${getLegend()}`;
                return await sock.sendMessage(jid, { text, mentions: [sender] });
            }

            // CASO 2: Cierre programado
            let timerMs = 0;
            if (timeStr.endsWith('m')) timerMs = parseInt(timeStr) * 60000;
            else if (timeStr.endsWith('s')) timerMs = parseInt(timeStr) * 1000;

            if (timerMs > 0) {
                await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
                await sock.sendMessage(jid, { text: `*Cierre programado:* Este grupo se cerrará en ${timeStr}. 🛡️` }, { quoted: m });

                setTimeout(async () => {
                    await sock.groupSettingUpdate(jid, 'announcement');
                    await sock.sendMessage(jid, { text: `_Cierre Automático_ 🔒\n_Tiempo cumplido (${timeStr})_${getLegend()}` });
                }, timerMs);
            } else {
                await sock.sendMessage(jid, { text: '❌ Tiempo no válido. Usa ej: `.close 5m` o `.close 30s`' }, { quoted: m });
            }
        }
    },
    {
        name: '.open',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant;

            if (!(await isAdmin(sock, jid, sender))) return;

            await sock.groupSettingUpdate(jid, 'not_announcement');
            await sock.sendMessage(jid, { react: { text: '🔓', key: m.key } });
            const text = `_Grupo Abierto_ 🔓\n_por_ @${sender.split('@')[0]}${getLegend()}`;
            await sock.sendMessage(jid, { text, mentions: [sender] });
        }
    },
    {
        name: '.shh',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
            if (!quotedInfo || !quotedInfo.participant) return;

            const targetJid = quotedInfo.participant;
            const targetNumber = targetJid.split('@')[0].split(':')[0];

            // 1. Manda el mensaje con mención
            await sock.sendMessage(jid, { 
                text: `@${targetNumber} Callese alv o ban 🦖`, 
                mentions: [targetJid] 
            });

            // 2. Reacciona al mensaje del usuario pesado
            await sock.sendMessage(jid, { 
                react: { 
                    text: '⚠️', 
                    key: { 
                        remoteJid: jid, 
                        fromMe: false, 
                        id: quotedInfo.stanzaId, 
                        participant: targetJid 
                    } 
                } 
            });
        }
    },
];