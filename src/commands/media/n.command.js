const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');
const groupService = require('../../services/group.service');

class NCommand extends BaseCommand {
    constructor() {
        super('.n', [], 'Reenvía / Edita texto de multimedia.');
    }

    async execute(sock, m, ctx) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const customText = ctx.rawBody.substring(3).trim();
        const legend = getLegend(sock);

        const addLegend = (text) => {
            if (!text) return legend;
            return text.endsWith(legend) ? text : text + legend;
        };

        let mentions = [];
        if (ctx.isGroup) {
            const groupMetadata = await groupService.getGroupMetadata(sock, ctx.jid);
            if (groupMetadata) mentions = groupMetadata.participants.map(v => v.id);
        }

        try {
            if (!quoted) {
                if (!customText) return await sock.sendMessage(ctx.jid, { react: { text: '❌', key: m.key } });
                return await sock.sendMessage(ctx.jid, { text: addLegend(customText), mentions }, { quoted: m });
            }

            const type = Object.keys(quoted)[0];

            if (type === 'conversation' || type === 'extendedTextMessage') {
                const originalText = quoted.conversation || quoted.extendedTextMessage?.text || "";
                return await sock.sendMessage(ctx.jid, { text: addLegend(customText || originalText), mentions }, { quoted: m });
            }

            if (type === 'stickerMessage') {
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                
                await sock.sendMessage(ctx.jid, { sticker: buffer }, { quoted: m });
                
                if (customText || ctx.isGroup) {
                    await sock.sendMessage(ctx.jid, { text: addLegend(customText || '¡Atención! 👆'), mentions }, { quoted: m });
                }
                return await sock.sendMessage(ctx.jid, { react: { text: '✅', key: m.key } });
            }

            if (type === 'imageMessage' || type === 'videoMessage') {
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                const typeKey = type.replace('Message', ''); 
                
                const finalCaption = customText || quoted[type]?.caption || "";

                await sock.sendMessage(ctx.jid, { 
                    [typeKey]: buffer, 
                    caption: addLegend(finalCaption),
                    mentions 
                }, { quoted: m });
                
                return await sock.sendMessage(ctx.jid, { react: { text: '✅', key: m.key } });
            }

            await sock.sendMessage(ctx.jid, { react: { text: '❓', key: m.key } });

        } catch (e) {
            console.error("Error en .n:", e);
            await sock.sendMessage(ctx.jid, { react: { text: '❌', key: m.key } });
        }
    }
}

module.exports = NCommand;
