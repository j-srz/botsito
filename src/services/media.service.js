const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class MediaService {

    get qualityMap() {
        return {
            'superlow': { crf: 50, scale: 128 },
            'low':      { crf: 40, scale: 160 },
            'medium':   { crf: 32, scale: 256 },
            'high':     { crf: 24, scale: 384 },
            'superhigh':{ crf: 18, scale: 512 }
        };
    }

    async stickerTask(sock, m, mediaData, qConfig) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        const type = Object.keys(mediaData)[0];
        const duration = mediaData[type]?.seconds || 0;

        if (type === 'videoMessage' && duration > 10) {
            throw new Error('El video es muy largo (+10s).');
        }

        const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

        if (type === 'videoMessage') {
            const tempIn = path.resolve(__dirname, `../../../media/s_in_${Date.now()}.mp4`);
            const tempOut = path.resolve(__dirname, `../../../media/s_out_${Date.now()}.webp`);
            
            // Ensure dir exists
            const dir = path.dirname(tempIn);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(tempIn, buffer);

            const cmd = `ffmpeg -y -t 10 -i "${tempIn}" -vf "fps=15,scale=${qConfig.scale}:${qConfig.scale}:force_original_aspect_ratio=decrease,pad=${qConfig.scale}:${qConfig.scale}:(ow-iw)/2:(oh-ih)/2:color=black@0" -loop 0 -an "${tempOut}"`;
            
            return new Promise((resolve, reject) => {
                const child = exec(cmd, async (err) => {
                    if (!err) {
                        await sock.sendMessage(jid, { sticker: fs.readFileSync(tempOut) }, { quoted: m });
                        resolve(child);
                    } else reject(err);
                    if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
                    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
                });
                return child; // returning child process for cancellation tracking
            });
        } else {
            const sticker = new Sticker(buffer, {
                pack: 'Rex Bot Pack 🦖', author: sock.user.name || 'Rex Bot', type: StickerTypes.FULL, quality: qConfig.crf
            });
            await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });
            return null; // no child process
        }
    }

    async imageTask(sock, m, mediaData, qConfig) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        const isAnimated = mediaData.stickerMessage?.isAnimated;
        const buffer = await downloadMediaMessage({ message: mediaData }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });

        if (isAnimated) {
            const tempGif = path.resolve(__dirname, `../../../media/temp_${Date.now()}.gif`);
            const tempMp4 = path.resolve(__dirname, `../../../media/temp_${Date.now()}.mp4`);
            
            const dir = path.dirname(tempGif);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            await sharp(buffer, { animated: true }).resize(qConfig.scale, qConfig.scale, { fit: 'contain' }).gif().toFile(tempGif);
            
            const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -threads 2 -movflags faststart -pix_fmt yuv420p -vf "fps=12,scale=${qConfig.scale}:-2" -c:v libx264 -preset ultrafast -crf ${qConfig.crf} "${tempMp4}"`;
            
            return new Promise((resolve, reject) => {
                const child = exec(ffmpegCmd, { timeout: 45000 }, async (error) => {
                    if (!error) {
                        await sock.sendMessage(jid, { video: fs.readFileSync(tempMp4), gifPlayback: true, caption: '> Convertido 🦖' }, { quoted: m });
                        resolve(child);
                    } else reject(error);
                    if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif);
                    if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
                });
                return child;
            });
        } else {
            const imgBuffer = await sharp(buffer).jpeg().toBuffer();
            await sock.sendMessage(jid, { image: imgBuffer, caption: '> Sticker a imagen 🦖' }, { quoted: m });
            return null;
        }
    }
}

module.exports = new MediaService();
