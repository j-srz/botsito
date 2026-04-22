const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');
const groupService = require('../../services/group.service');

class NCommand extends BaseCommand {
    constructor() {
        super('.n', [], 'Reenvía / Edita texto de multimedia.');
    }

    async execute(sock, m, ctx) {
        // 1. Detectar si la multimedia está en el citado o en el mensaje actual
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        // Detectamos si el mensaje actual es imagen, video o "ver una vez"
        const currentMsg = m.message?.imageMessage || m.message?.videoMessage || m.message?.viewOnceMessageV2 ? m.message : null;
        const target = quoted || currentMsg;

        // 2. Extraer el texto nuevo (limpiando el .n)
        const customText = ctx.rawBody.replace(/^\.n\s*/i, '').trim();
        const legend = getLegend(sock);

        const addLegend = (text) => {
            if (!text) return legend;
            return text.endsWith(legend) ? text : `${text}\n\n${legend}`;
        };

        let mentions = [];
        if (ctx.isGroup) {
            const groupMetadata = await groupService.getGroupMetadata(sock, ctx.jid);
            if (groupMetadata) mentions = groupMetadata.participants.map(v => v.id);
        }

        try {
            if (!target) {
                if (!customText) return await sock.sendMessage(ctx.jid, { react: { text: '❌', key: m.key } });
                return await sock.sendMessage(ctx.jid, { text: addLegend(customText), mentions }, { quoted: m });
            }

            // 3. Extraer el tipo real de contenido (manejando View Once)
            let type = Object.keys(target)[0];
            let mediaData = target;

            if (type === 'viewOnceMessageV2') {
                mediaData = target.viewOnceMessageV2.message;
                type = Object.keys(mediaData)[0];
            }

            const { downloadMediaMessage } = await import('@whiskeysockets/baileys');

            // CASO: IMAGEN O VIDEO
            if (type === 'imageMessage' || type === 'videoMessage') {
                const buffer = await downloadMediaMessage({ message: target }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                const typeKey = type.replace('Message', ''); 

                // LÓGICA DE CAPTION SOLICITADA:
                let finalCaption = "";

                if (customText) {
                    // Si el usuario puso ".n Texto", usamos "Texto"
                    finalCaption = customText;
                } else if (quoted) {
                    // Si solo puso ".n" respondiendo a otro, usamos el texto del mensaje citado
                    finalCaption = mediaData[type]?.caption || "";
                } else {
                    // Si mandó una imagen con ".n" (sin texto extra), el caption queda vacío (solo leyenda)
                    finalCaption = "";
                }

                await sock.sendMessage(ctx.jid, { 
                    [typeKey]: buffer, 
                    caption: addLegend(finalCaption),
                    mentions 
                }, { quoted: m });

                return await sock.sendMessage(ctx.jid, { react: { text: '✅', key: m.key } });
            }

            // CASO: TEXTO (Solo si es citado)
            if (type === 'conversation' || type === 'extendedTextMessage') {
                const originalText = mediaData.conversation || mediaData.extendedTextMessage?.text || "";
                return await sock.sendMessage(ctx.jid, { text: addLegend(customText || originalText), mentions }, { quoted: m });
            }

            // CASO: STICKER
            if (type === 'stickerMessage') {
                const buffer = await downloadMediaMessage({ message: target }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                await sock.sendMessage(ctx.jid, { sticker: buffer }, { quoted: m });
                if (customText) await sock.sendMessage(ctx.jid, { text: addLegend(customText), mentions }, { quoted: m });
                return await sock.sendMessage(ctx.jid, { react: { text: '✅', key: m.key } });
            }

        } catch (e) {
            console.error("Error en .n:", e);
            await sock.sendMessage(ctx.jid, { react: { text: '❌', key: m.key } });
        }
    }
}

module.exports = NCommand;