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
                    // Reaccionamos para avisar que está en proceso
                    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

                    if (isAnimated) {
                        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
                        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
                        
                        // 1. SHARP OPTIMIZADO: Reducimos el tamaño a la mitad para que sea 4 veces más rápido
                        await sharp(buffer, { animated: true })
                            .resize(256, 256, { fit: 'contain' }) 
                            .gif()
                            .toFile(tempGif);

                        // 2. FFMPEG TURBO: 
                        // -threads 2: No satures todos los núcleos
                        // -crf 35: Bajamos un poco la calidad para ganar velocidad
                        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=256:-2" -c:v libx264 -preset ultrafast -crf 35 "${tempMp4}"`;

                        exec(ffmpegCmd, { timeout: 30000 }, async (error, stdout, stderr) => {
                            if (error) {
                                console.error('FFmpeg Error:', stderr);
                                // Plan B: Mandar el GIF si el MP4 falla o tarda mucho
                                await sock.sendMessage(jid, { video: fs.readFileSync(tempGif), gifPlayback: true, caption: '> Enviado como GIF (Raspberry lenta) 🦖' }, { quoted: m });
                            } else {
                                await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Sticker animado convertido 🦖' }, { quoted: m });
                            }
                            
                            // Borrado de archivos
                            setTimeout(() => {
                                if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                                if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                            }, 5000);
                        });
                    } else {
                        const imgBuffer = await sharp(buffer).jpeg().toBuffer();
                        await sock.sendMessage(jid, { image: imgBuffer, caption: '> Sticker convertido a imagen 🦖' }, { quoted: m });
                    }
                } catch (e) { 
                    console.error(e);
                    await sock.sendMessage(jid, { text: '❌ Error: El sticker es demasiado complejo para mi procesador.' }); 
                }
            } else {
                await sock.sendMessage(jid, { text: 'Responde a un sticker.' });
            }
        }
    }
];