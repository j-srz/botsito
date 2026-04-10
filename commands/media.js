const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// --- CONTROL DE PROCESOS ---
let processingQueue = [];
let isProcessing = false;
let currentChildProcess = null; // Para guardar el FFmpeg actual

const qualityMap = {
    'superlow': 10, 'low': 25, 'medium': 45, 'high': 70, 'superhigh': 95
};

const generarBarraFila = (posicion) => {
    const limiteVisual = 7;
    let barra = "";
    for (let i = 1; i <= limiteVisual; i++) {
        if (i < posicion) barra += "🟥";
        else if (i === posicion) barra += "🚺";
        else barra += "🟩";
    }
    return barra;
};

// --- GESTIÓN DE LA COLA ---
const processNext = async () => {
    if (processingQueue.length === 0 || isProcessing) return;

    isProcessing = true;
    const { task, sock, m, body, mediaData, quality } = processingQueue[0];

    try {
        await task(sock, m, body, mediaData, quality);
        // REACCIÓN DE ÉXITO ✅
        await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
    } catch (err) {
        console.error('❌ Error:', err.message);
        // REACCIÓN DE ERROR ❌
        await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    } finally {
        processingQueue.shift();
        isProcessing = false;
        currentChildProcess = null;
        setTimeout(processNext, 1000);
    }
};

const addToQueue = async (sock, m, body, mediaData, task, quality = 40) => {
    const jid = m.key.remoteJid;
    processingQueue.push({ task, sock, m, body, mediaData, quality });

    if (isProcessing || processingQueue.length > 1) {
        const pos = processingQueue.length;
        const barraVisual = generarBarraFila(pos);
        const fecha = new Date().toLocaleDateString('es-MX');
        const mensajeEspera = `┌── [ 🦖 REX COLA ] ──┐\n🚨 *¡PERESE!* 🚨\n${barraVisual}\nPosición: ${pos} | Total: ${pos}\n└─────────────────────┘\n_Rex Bot | ${fecha}_`;
        await sock.sendMessage(jid, { text: mensajeEspera }, { quoted: m });
    }
    processNext();
};

// --- TAREAS ---

const stickerTask = async (sock, m, body, mediaData, quality) => {
    const jid = m.key.remoteJid;
    const type = Object.keys(mediaData)[0];
    let buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (type === 'videoMessage') {
        const tempIn = path.resolve(__dirname, `../media/s_in_${Date.now()}.mp4`);
        const tempOut = path.resolve(__dirname, `../media/s_out_${Date.now()}.webp`);
        fs.writeFileSync(tempIn, buffer);

        const cmd = `ffmpeg -y -i "${tempIn}" -vcodec libwebp -filter:v "fps=15,scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=black@0" -lossless 0 -compression_level 4 -q:v ${quality} -loop 0 -an -vsync 0 "${tempOut}"`;
        
        return new Promise((resolve, reject) => {
            currentChildProcess = exec(cmd, async (err) => {
                if (!err) {
                    await sock.sendMessage(jid, { sticker: fs.readFileSync(tempOut) }, { quoted: m });
                    resolve();
                } else {
                    reject(err);
                }
                if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
                if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
            });
        });
    }

    const sticker = new Sticker(buffer, {
        pack: 'Rex Bot Pack 🦖', author: 'Jesús Suarez', type: StickerTypes.FULL, quality: quality
    });
    await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });
};

const imageTask = async (sock, m, body, mediaData) => {
    const jid = m.key.remoteJid;
    const isAnimated = mediaData.stickerMessage?.isAnimated;
    const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (isAnimated) {
        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
        await sharp(buffer, { animated: true }).resize(256, 256, { fit: 'contain' }).gif().toFile(tempGif);
        
        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=256:-2" -c:v libx264 -preset ultrafast -crf 35 "${tempMp4}"`;
        
        return new Promise((resolve, reject) => {
            currentChildProcess = exec(ffmpegCmd, { timeout: 45000 }, async (error) => {
                if (!error) {
                    await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Sticker animado convertido 🦖' }, { quoted: m });
                    resolve();
                } else {
                    reject(error);
                }
                if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
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
        name: '.cancel',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            
            // 1. Limpiar la cola
            processingQueue = [];
            
            // 2. Matar proceso actual si existe
            if (currentChildProcess) {
                currentChildProcess.kill('SIGKILL');
                currentChildProcess = null;
            }
            
            isProcessing = false;
            await sock.sendMessage(jid, { text: '🚮 *PROCESOS CANCELADOS*\nSe ha vaciado la cola y detenido el motor de renderizado. 🦖' });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        }
    },
    {
        name: '.n',
        execute: async (sock, m, body) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) return;
            const customText = body.substring(2).trim();
            const type = Object.keys(quoted)[0];
            try {
                const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                const caption = customText || quoted[type]?.caption || '';
                await sock.sendMessage(m.key.remoteJid, { [type.replace('Message', '')]: buffer, caption }, { quoted: m });
                await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
            } catch (e) { await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } }); }
        }
    },
    {
        name: '.s',
        execute: async (sock, m, body) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = Object.keys(quoted)[0];
            if (type !== 'imageMessage' && type !== 'videoMessage') return;
            const args = body.split(' ');
            const quality = qualityMap[args[1]?.toLowerCase()] || 40;
            await addToQueue(sock, m, body, { [type]: quoted[type] }, stickerTask, quality);
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