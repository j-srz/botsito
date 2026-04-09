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
                        const tempWebp = path.resolve(__dirname, `../media/temp_${Date.now()}.webp`);
                        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
                        
                        if (!fs.existsSync(path.dirname(tempWebp))) fs.mkdirSync(path.dirname(tempWebp), { recursive: true });
                        fs.writeFileSync(tempWebp, buffer);

                        // COMANDO SIMPLIFICADO: Quitamos el -vcodec libwebp que daba error
                        // Dejamos que FFmpeg detecte el formato solo, pero forzamos el output compatible
                        const ffmpegCmd = `ffmpeg -y -i "${tempWebp}" -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -preset ultrafast "${tempMp4}"`;

                        exec(ffmpegCmd, async (error, stdout, stderr) => {
                            if (error) {
                                console.error('FFmpeg Error Detallado:', stderr);
                                return await sock.sendMessage(jid, { text: '❌ El sticker es muy pesado para la Rasp.' });
                            }

                            await sock.sendMessage(jid, { 
                                video: fs.readFileSync(tempMp4), 
                                gifPlayback: true, 
                                caption: '> Sticker animado convertido 🦖' 
                            }, { quoted: m });
                            
                            setTimeout(() => {
                                if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
                                if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                            }, 5000);
                        });
                    } else {
                        await sock.sendMessage(jid, { image: buffer, caption: '> Sticker convertido a imagen 🦖' }, { quoted: m });
                    }
                } catch (e) { 
                    console.error(e);
                    await sock.sendMessage(jid, { text: '❌ Error al procesar sticker.' }); 
                }
            } else {
                await sock.sendMessage(jid, { text: 'Responde a un sticker.' });
            }
        }
    }
];