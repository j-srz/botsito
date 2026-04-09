const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = [
    {
        name: '.n',
        execute: async (sock, m, body) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) return await sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });

            const customText = body.substring(2).trim();
            const type = Object.keys(quoted)[0];
            const isMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage'].includes(type);

            if (isMedia) {
                try {
                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    const caption = customText || quoted[type]?.caption || '';
                    if (type === 'imageMessage') await sock.sendMessage(jid, { image: buffer, caption }, { quoted: m });
                    else if (type === 'videoMessage') await sock.sendMessage(jid, { video: buffer, caption }, { quoted: m });
                    else if (type === 'stickerMessage') await sock.sendMessage(jid, { sticker: buffer }, { quoted: m });
                    else await sock.sendMessage(jid, { document: buffer, caption, mimetype: quoted[type].mimetype, fileName: 'archivo' }, { quoted: m });
                } catch (err) {
                    await sock.sendMessage(jid, { text: '❌ Error al procesar multimedia.' }, { quoted: m });
                }
            } else {
                const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
                await sock.sendMessage(jid, { text: customText || quotedText || '' }, { quoted: m });
            }
        }
    },
    {
        name: '.s',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = Object.keys(quoted)[0];

            if (type === 'imageMessage' || type === 'videoMessage') {
                try {
                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    const sticker = new Sticker(buffer, {
                        pack: 'Rex Bot Pack 🦖',
                        author: 'Jesús Suarez',
                        type: StickerTypes.FULL,
                        quality: 50
                    });
                    await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });
                } catch (e) {
                    await sock.sendMessage(jid, { text: '❌ Error al crear sticker.' });
                }
            } else {
                await sock.sendMessage(jid, { text: 'Responde a una imagen o video.' });
            }
        }
    },
    {
        name: '.img', 
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (quoted?.stickerMessage) {
                const isAnimated = quoted.stickerMessage.isAnimated;
                try {
                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

                    if (isAnimated) {
                        const tempWebp = path.join(__dirname, `../media/temp_${Date.now()}.webp`);
                        const tempMp4 = path.join(__dirname, `../media/temp_${Date.now()}.mp4`);
                        fs.writeFileSync(tempWebp, buffer);

                        const ffmpegCmd = `ffmpeg -i ${tempWebp} -pix_fmt yuv420p -vf "scale=truncate(iw/2)*2:truncate(ih/2)*2" ${tempMp4}`;
                        exec(ffmpegCmd, async (error) => {
                            if (error) return await sock.sendMessage(jid, { text: '❌ Error en conversión animada.' });

                            await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Sticker animado convertido 🦖' }, { quoted: m });
                            if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
                            if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                        });
                    } else {
                        await sock.sendMessage(jid, { image: buffer, caption: '> Sticker convertido a imagen 🦖' }, { quoted: m });
                    }
                } catch (e) { await sock.sendMessage(jid, { text: '❌ Error al procesar sticker.' }); }
            } else {
                await sock.sendMessage(jid, { text: 'Responde a un sticker.' });
            }
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

            await sock.sendMessage(jid, { text: `@${targetNumber} NO SPAM O BAN!! 🤫`, mentions: [targetJid] });
            await sock.sendMessage(jid, { 
                react: { text: '⚠️', key: { remoteJid: jid, fromMe: false, id: quotedInfo.stanzaId, participant: targetJid } } 
            });
        }
    },
    {
        name: '.joto',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

            if (!quotedInfo || !quotedInfo.participant) {
                const senderName = m.pushName || 'Alguien';
                return await sock.sendMessage(jid, { text: `che joto \`${senderName}\` mejor responde a alguien.` }, { quoted: m });
            }

            const targetJid = quotedInfo.participant;
            const groupMetadata = await sock.groupMetadata(jid);
            const participant = groupMetadata.participants.find(p => p.id === targetJid);
            const targetName = participant?.name || participant?.notify || targetJid.split('@')[0].split(':')[0];
            const porcentaje = Math.floor(Math.random() * 100) + 1;

            await sock.sendMessage(jid, { text: `🏳️‍🌈 El usuario \`${targetName}\` es un **${porcentaje}%** gei.` }, { quoted: m });
        }
    }
];