const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Usaremos sharp para procesar el WebP

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
                } catch (err) { await sock.sendMessage(jid, { text: '❌ Error multimedia.' }); }
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
                        quality: 40 // Bajamos un poco más para la Rasp 3
                    });
                    await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });
                } catch (e) { await sock.sendMessage(jid, { text: '❌ Error sticker.' }); }
            } else { await sock.sendMessage(jid, { text: 'Etiqueta una imagen/video.' }); }
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
                        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
                        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
                        
                        // 1. Usamos SHARP para convertir WebP animado a GIF (Sharp sí tiene el codec)
                        await sharp(buffer, { animated: true }).toFile(tempGif);

                        // 2. Usamos FFmpeg para pasar de GIF a MP4 (WhatsApp prefiere MP4)
                        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -movflags faststart -pix_fmt yuv420p -vf "scale=truncate(iw/2)*2:truncate(ih/2)*2" "${tempMp4}"`;

                        exec(ffmpegCmd, async (error) => {
                            if (error) {
                                // Si FFmpeg falla, intentamos mandar el GIF directamente
                                await sock.sendMessage(jid, { video: fs.readFileSync(tempGif), gifPlayback: true, caption: '> Convertido a GIF 🦖' }, { quoted: m });
                            } else {
                                await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Sticker animado convertido 🦖' }, { quoted: m });
                            }
                            
                            // Limpieza
                            if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                            if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                        });
                    } else {
                        // Sticker estático: Sharp lo convierte a JPG/PNG rápido
                        const imgBuffer = await sharp(buffer).jpeg().toBuffer();
                        await sock.sendMessage(jid, { image: imgBuffer, caption: '> Sticker convertido a imagen 🦖' }, { quoted: m });
                    }
                } catch (e) { 
                    console.error(e);
                    await sock.sendMessage(jid, { text: '❌ Error al procesar (Sticker muy pesado).' }); 
                }
            } else {
                await sock.sendMessage(jid, { text: 'Responde a un sticker.' });
            }
        }
    }
];