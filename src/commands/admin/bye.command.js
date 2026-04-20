const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const BaseCommand = require('../base.command');
const communityService = require('../../services/community.service');
const logger = require('../../core/logger');

class ByeCommand extends BaseCommand {
    constructor() {
        super('.bye', [], 'Configura el mensaje de despedida del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const action = ctx.args[1];

        if (action === 'on' || action === 'off') {
            const enabled = action === 'on';
            await communityService.setByeEnabled(ctx.jid, enabled);
            await sock.sendMessage(ctx.jid, { react: { text: enabled ? '👋' : '🔕', key: m.key } });
            await ctx.reply(`✅ Despedidas ${enabled ? 'activadas' : 'desactivadas'}.`);
            return;
        }

        if (action === 'set') {
            const msgText = ctx.rawBody.split(' ').slice(2).join(' ').trim();
            const hasImage = !!m.message?.imageMessage;
            const hasVideo = !!m.message?.videoMessage;

            if (!msgText && !hasImage && !hasVideo) {
                throw {
                    reply: '⚠️ Uso: `.bye set <mensaje>`\n\n*Placeholders:*\n• `{{user}}` — usuario que salió\n• `{{community}}` — nombre de comunidad\n\n_También puedes enviar este comando como descripción de una imagen/video._'
                };
            }

            let mediaPath = null;
            let mediaType = null;

            if (hasImage || hasVideo) {
                try {
                    const ext = hasVideo ? 'mp4' : 'jpg';
                    mediaType = hasVideo ? 'video' : 'image';
                    mediaPath = communityService.getAssetPath(ctx.jid, 'bye', ext);
                    const buffer = await downloadMediaMessage(m, 'buffer', {});
                    communityService.saveAsset(mediaPath, buffer);
                } catch (err) {
                    logger.error('[ByeCommand] Error descargando media:', err);
                    throw { reply: '❌ No se pudo descargar el archivo multimedia. Intenta de nuevo.' };
                }
            }

            const finalText = msgText || '👋 {{user}} ha salido del grupo. ¡Hasta pronto!';
            await communityService.setByeContent(ctx.jid, finalText, mediaPath, mediaType);

            let resp = `✅ Mensaje de despedida configurado:\n\n_${finalText}_`;
            if (mediaPath) resp += `\n\n📎 Multimedia guardado (${mediaType}).`;
            await ctx.reply(resp);
            return;
        }

        if (action === 'ver' || action === 'view') {
            const bye = await communityService.getBye(ctx.jid);
            if (!bye.message) {
                await ctx.reply('❌ No hay mensaje de despedida configurado.');
            } else {
                let resp = `🚪 *DESPEDIDA*\n\n*Estado:* ${bye.enabled ? '✅ Activa' : '❌ Inactiva'}\n*Mensaje:* _${bye.message}_`;
                if (bye.mediaPath) resp += `\n*Media:* ${bye.mediaType}`;
                await ctx.reply(resp);
            }
            return;
        }

        throw { reply: '⚠️ Uso: `.bye on/off` | `.bye set <mensaje>` | `.bye ver`' };
    }
}

module.exports = ByeCommand;
