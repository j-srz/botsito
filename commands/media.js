const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// --- SISTEMA DE COLA (QUEUE) ---
let processingQueue = [];
let isProcessing = false;

const processNext = async () => {
    if (processingQueue.length === 0 || isProcessing) return;

    isProcessing = true;
    const { task, sock, m, body, mediaData } = processingQueue[0];

    try {
        await task(sock, m, body, mediaData);
    } catch (err) {
        console.error('❌ Error en la tarea:', err.message);
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Hubo un error al procesar este archivo.' });
    } finally {
        processingQueue.shift(); 
        isProcessing = false;
        // Pequeño delay para que la Rasp respire entre procesos
        setTimeout(processNext, 1000); 
    }
};

const addToQueue = async (sock, m, body, mediaData, task) => {
    const jid = m.key.remoteJid;
    
    processingQueue.push({ task, sock, m, body, mediaData });

    // Si ya hay algo procesándose o hay gente en fila, avisamos
    if (isProcessing || processingQueue.length > 1) {
        const posicion = processingQueue.length - 1;
        await sock.sendMessage(jid, { 
            text: `⏳ *Petición en espera...*\n\n*Posición:* ${posicion}\n*Cola total:* ${processingQueue.length}\n\n_Tu turno llegará automáticamente. 🦖_` 
        }, { quoted: m });
    }

    processNext();
};

// --- TAREAS ---

// .n (Directo, sin cola para no trabar el chat)
const executeN = async (sock, m, body) => {
    const jid = m.key.remoteJid;
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return await sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });

    const customText = body.substring(2).trim();
    const type = Object.keys(quoted)[0];
    
    try {
        const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        const caption = customText || quoted[type]?.caption || '';

        if (type === 'imageMessage') await sock.sendMessage(jid, { image: buffer, caption }, { quoted: m });
        else if (type === 'videoMessage') await sock.sendMessage(jid, { video: buffer, caption }, { quoted: m });
        else if (type === 'stickerMessage') await sock.sendMessage(jid, { sticker: buffer }, { quoted: m });
        else await sock.sendMessage(jid, { document: buffer, caption, mimetype: quoted[type].mimetype, fileName: 'archivo' }, { quoted: m });
    } catch (e) {
        await sock.sendMessage(jid, { text: '❌ Error en .n (Media caducada o inválida).' });
    }
};

// .s (Sticker)
const stickerTask = async (sock, m, body, mediaData) => {
    const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
    const sticker = new Sticker(buffer, {
        pack: 'Rex Bot Pack 🦖',
        author: 'Jesús Suarez',
        type: StickerTypes.FULL,
        quality: 40
    });
    await sock.sendMessage(m.key.remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
};

// .img (Imagen/GIF)
const imageTask = async (sock, m, body, mediaData) => {
    const jid = m.key.remoteJid;
    const isAnimated = mediaData.stickerMessage?.isAnimated;
    
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (isAnimated) {
        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
        
        await sharp(buffer, { animated: true }).resize(256, 256, { fit: 'contain' }).gif().toFile(tempGif);

        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=256:-2" -c:v libx264 -preset ultrafast -crf 35 "${tempMp4}"`;

        return new Promise((resolve) => {
            exec(ffmpegCmd, { timeout: 45000 }, async (error) => {
                if (!error) {
                    await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Sticker animado convertido 🦖' }, { quoted: m });
                } else {
                    await sock.sendMessage(jid, { video: fs.readFileSync(tempGif), gifPlayback: true, caption: '> Enviado como GIF 🦖' }, { quoted: m });
                }
                if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                resolve();
            });
        });
    } else {
        const imgBuffer = await sharp(buffer).jpeg().toBuffer();
        await sock.sendMessage(jid, { image: imgBuffer, caption: '> Sticker convertido a imagen 🦖' }, { quoted: m });
    }
};

// --- EXPORTACIÓN ---
module.exports = [
    {
        name: '.n',
        execute: async (sock, m, body) => { await executeN(sock, m, body); }
    },
    {
        name: '.s',
        execute: async (sock, m) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = Object.keys(quoted)[0];
            if (type !== 'imageMessage' && type !== 'videoMessage') return;
            
            // Pasamos el mensaje de media formateado correctamente
            await addToQueue(sock, m, null, { [type]: quoted[type] }, stickerTask);
        }
    },
    {
        name: '.img',
        execute: async (sock, m) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) return;
            
            await addToQueue(sock, m, null, { stickerMessage: quoted.stickerMessage }, imageTask);
        }
    }
];