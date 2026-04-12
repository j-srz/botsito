const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { getLegend } = require('../utils/helpers'); 

// --- CONTROL DE PROCESOS ---
let processingQueue = [];
let isProcessing = false;
let currentChildProcess = null;

const qualityMap = {
    'superlow': { crf: 50, scale: 128 },
    'low':      { crf: 40, scale: 160 },
    'medium':   { crf: 32, scale: 256 },
    'high':     { crf: 24, scale: 384 },
    'superhigh':{ crf: 18, scale: 512 }
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
    const { task, sock, m, body, mediaData, qConfig } = processingQueue[0];

    try {
        await task(sock, m, body, mediaData, qConfig);
        // REACCIÓN DE ÉXITO ✅ (Se envía al terminar)
        await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
    } catch (err) {
        console.error('❌ Error:', err.message);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ ERROR: ${err.message}` });
        await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    } finally {
        processingQueue.shift();
        isProcessing = false;
        currentChildProcess = null;
        setTimeout(processNext, 1000);
    }
};

const addToQueue = async (sock, m, body, mediaData, task, qConfig) => {
    const jid = m.key.remoteJid;
    processingQueue.push({ task, sock, m, body, mediaData, qConfig });

    if (isProcessing || processingQueue.length > 1) {
        const pos = processingQueue.length;
        const barraVisual = generarBarraFila(pos);
        const mensajeEspera = 
`┌── [ 🦖 REX COLA ] ──┐
🚨 *¡PERESE!* 🚨
${barraVisual}
Posición: ${pos} | Total: ${pos}
└─────────────────────┘
${getLegend(sock)}`;

        await sock.sendMessage(jid, { text: mensajeEspera }, { quoted: m });
    }
    processNext();
};

// --- TAREAS ---

const stickerTask = async (sock, m, body, mediaData, qConfig) => {
    const jid = m.key.remoteJid;
    // REACCIÓN INICIAL: Avisamos que empezamos a trabajar
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    const type = Object.keys(mediaData)[0];
    const duration = mediaData[type]?.seconds || 0;

    if (type === 'videoMessage' && duration > 10) {
        throw new Error('El video es muy largo (+10s).');
    }

    const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (type === 'videoMessage') {
        const tempIn = path.resolve(__dirname, `../media/s_in_${Date.now()}.mp4`);
        const tempOut = path.resolve(__dirname, `../media/s_out_${Date.now()}.webp`);
        fs.writeFileSync(tempIn, buffer);

        const cmd = `ffmpeg -y -t 10 -i "${tempIn}" -vf "fps=15,scale=${qConfig.scale}:${qConfig.scale}:force_original_aspect_ratio=decrease,pad=${qConfig.scale}:${qConfig.scale}:(ow-iw)/2:(oh-ih)/2:color=black@0" -loop 0 -an "${tempOut}"`;
        
        return new Promise((resolve, reject) => {
            currentChildProcess = exec(cmd, async (err) => {
                if (!err) {
                    await sock.sendMessage(jid, { sticker: fs.readFileSync(tempOut) }, { quoted: m });
                    resolve();
                } else reject(err);
                if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
                if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
            });
        });
    }

    const sticker = new Sticker(buffer, {
        pack: 'Rex Bot Pack 🦖', author: sock.user.name || 'Rex Bot', type: StickerTypes.FULL, quality: qConfig.crf
    });
    await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });
};

const imageTask = async (sock, m, body, mediaData, qConfig) => {
    const jid = m.key.remoteJid;
    // REACCIÓN INICIAL: Avisamos que empezamos a trabajar
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    const isAnimated = mediaData.stickerMessage?.isAnimated;
    const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

    if (isAnimated) {
        const tempGif = path.resolve(__dirname, `../media/temp_${Date.now()}.gif`);
        const tempMp4 = path.resolve(__dirname, `../media/temp_${Date.now()}.mp4`);
        
        await sharp(buffer, { animated: true }).resize(qConfig.scale, qConfig.scale, { fit: 'contain' }).gif().toFile(tempGif);
        
        const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=${qConfig.scale}:-2" -c:v libx264 -preset ultrafast -crf ${qConfig.crf} "${tempMp4}"`;
        
        return new Promise((resolve, reject) => {
            currentChildProcess = exec(ffmpegCmd, { timeout: 45000 }, async (error) => {
                if (!error) {
                    await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Convertido 🦖' }, { quoted: m });
                    resolve();
                } else reject(error);
                if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
            });
        });
    } else {
        const imgBuffer = await sharp(buffer).jpeg().toBuffer();
        await sock.sendMessage(jid, { image: imgBuffer, caption: '> Sticker a imagen 🦖' }, { quoted: m });
    }
};

// --- EL RESTO DE LAS TAREAS (.cancel, .n, .s, .img) QUEDAN IGUAL ---
module.exports = [
    {
        name: '.cancel',
        execute: async (sock, m) => {
            processingQueue = [];
            if (currentChildProcess) { currentChildProcess.kill('SIGKILL'); currentChildProcess = null; }
            isProcessing = false;
            await sock.sendMessage(m.key.remoteJid, { text: '🚮 *COLA VACIA* - Se detuvieron los procesos.' });
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
        }
    },
{
        name: '.n',
        execute: async (sock, m, body) => {
            const jid = m.key.remoteJid;
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const customText = body.substring(3).trim();
            const isGroup = jid.endsWith('@g.us');

            // --- LÓGICA DE HIDETAG (Menciones) ---
            let mentions = [];
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(jid);
                mentions = groupMetadata.participants.map(v => v.id);
            }

            try {
                // --- CASO 0: NO HAY MENSAJE CITADO (Manda texto directo) ---
                if (!quoted) {
                    if (!customText) {
                        return await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
                    }
                    return await sock.sendMessage(jid, { 
                        text: customText + getLegend(sock), 
                        mentions 
                    }, { quoted: m });
                }

                const type = Object.keys(quoted)[0];

                // --- CASO 1: TEXTO CITADO ---
                if (type === 'conversation' || type === 'extendedTextMessage') {
                    const originalText = quoted.conversation || quoted.extendedTextMessage?.text;
                    return await sock.sendMessage(jid, { 
                        text: (customText || originalText) + getLegend(sock),
                        mentions
                    }, { quoted: m });
                }

                // --- CASO 2: STICKERS CITADOS ---
                if (type === 'stickerMessage') {
                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    // Mandamos el sticker
                    await sock.sendMessage(jid, { sticker: buffer }, { quoted: m });
                    // Como el sticker no lleva texto, mandamos el hidetag en un mensaje invisible o con el customText si pusiste algo
                    if (customText || isGroup) {
                        await sock.sendMessage(jid, { text: (customText || '¡Atención! 👆') + getLegend(sock), mentions }, { quoted: m });
                    }
                    return await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
                }

                // --- CASO 3: MULTIMEDIA CITADA (Imagen / Video) ---
                if (type === 'imageMessage' || type === 'videoMessage') {
                    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    const typeKey = type.replace('Message', ''); // 'image' o 'video'
                    
                    await sock.sendMessage(jid, { 
                        [typeKey]: buffer, 
                        caption: (customText || quoted[type]?.caption || '') + getLegend(sock),
                        mentions 
                    }, { quoted: m });
                    
                    return await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
                }

                // Si es un tipo no soportado
                await sock.sendMessage(jid, { react: { text: '❓', key: m.key } });

            } catch (e) {
                console.error("Error en .n:", e);
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }
        }
    },
    {
        name: '.s',
        execute: async (sock, m, body) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = Object.keys(quoted)[0];
            if (type !== 'imageMessage' && type !== 'videoMessage') return;
            const args = body.split(' ');
            const qConfig = qualityMap[args[1]?.toLowerCase()] || qualityMap['superlow'];
            await addToQueue(sock, m, body, { [type]: quoted[type] }, stickerTask, qConfig);
        }
    },
    {
        name: '.img',
        execute: async (sock, m, body) => {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) return;
            const args = body.split(' ');
            const qConfig = qualityMap[args[1]?.toLowerCase()] || qualityMap['superlow'];
            await addToQueue(sock, m, body, { stickerMessage: quoted.stickerMessage }, imageTask, qConfig);
        }
    }
];