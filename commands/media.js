const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// --- SISTEMA DE COLA (QUEUE) SOLO PARA PROCESOS PESADOS ---
let processingQueue = [];
let isProcessing = false;

const processNext = async () => {
    if (processingQueue.length === 0 || isProcessing) return;

    isProcessing = true;
    const { task, sock, m, body } = processingQueue[0];

    try {
        await task(sock, m, body);
    } catch (err) {
        console.error('Error en la tarea de la cola:', err);
    } finally {
        processingQueue.shift(); 
        isProcessing = false;
        processNext(); 
    }
};

const addToQueue = async (sock, m, body, task) => {
    const jid = m.key.remoteJid;
    processingQueue.push({ task, sock, m, body });

    if (processingQueue.length > 1) {
        const espera = processingQueue.length - 1;
        await sock.sendMessage(jid, { 
            text: `⏳ *Petición añadida a la cola.*\n\n*Posición:* ${espera}\n*En espera:* ${espera}\n\n_Procesando uno a la vez para cuidar el CPU. 🦖_` 
        }, { quoted: m });
    }
    processNext();
};

// --- FUNCIONES DE TAREAS ---

// .n AHORA ES INDEPENDIENTE Y DIRECTO
const executeN = async (sock, m, body) => {
    const jid = m.key.remoteJid;
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return await sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });

    const customText = body.substring(2).trim();
    const type = Object.keys(quoted)[0];
    const isMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage'].includes(type);

    try {
        if (isMedia) {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const caption = customText || quoted[type]?.caption || '';
            const messageOptions = { quoted: m };

            if (type === 'imageMessage') await sock.sendMessage(jid, { image: buffer, caption }, messageOptions);
            else if (type === 'videoMessage') await sock.sendMessage(jid, { video: buffer, caption }, messageOptions);
            else if (type === 'stickerMessage') await sock.sendMessage(jid, { sticker: buffer }, messageOptions);
            else await sock.sendMessage(jid, { document: buffer, caption, mimetype: quoted[type].mimetype, fileName: 'archivo' }, messageOptions);
        } else {
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
            await sock.sendMessage(jid, { text: customText || quotedText || '' }, { quoted: m });
        }
    } catch (e) {
        await sock.sendMessage(jid, { text: '❌ Error al procesar .n' });
    }
};

const stickerTask = async (sock, m) => {
    const buffer = await downloadMediaMessage({ message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
    const sticker = new Sticker(buffer, {
        pack: 'Rex Bot Pack 🦖',
        author: 'Jesús Suarez',
        type: StickerTypes.FULL,
        quality: 40
    });
    await sock.sendMessage(m.key.remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
};

const imageTask = async (sock, m) => {
    const jid = m.key.remoteJid;
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isAnimated = quoted?.stickerMessage?.isAnimated;
    
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (isAnimated) {
        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
        await sharp(buffer, { animated: true }).resize(256, 256, { fit: 'contain' }).gif().toFile(tempGif);
        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=256:-2" -c:v libx264 -preset ultrafast -crf 35 "${tempMp4}"`;

        return new Promise((resolve) => {
            exec(ffmpegCmd, { timeout: 40000 }, async (error) => {
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
        execute: async (sock, m, body) => {
            // Se ejecuta de inmediato, sin cola
            await executeN(sock, m, body);
        }
    },
    {
        name: '.s',
        execute: async (sock, m) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = Object.keys(quoted)[0];
            if (type !== 'imageMessage' && type !== 'videoMessage') return await sock.sendMessage(m.key.remoteJid, { text: 'Etiqueta imagen o video.' });
            await addToQueue(sock, m, null, stickerTask);
        }
    },
    {
        name: '.img',
        execute: async (sock, m) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) return await sock.sendMessage(m.key.remoteJid, { text: 'Responde a un sticker.' });
            await addToQueue(sock, m, null, imageTask);
        }
    }
];