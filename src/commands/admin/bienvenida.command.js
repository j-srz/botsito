const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const BaseCommand = require('../base.command');
const communityService = require('../../services/community.service');
const logger = require('../../core/logger');

class BienvenidaCommand extends BaseCommand {
    constructor() {
        super('.bienvenida', [], 'Configura el mensaje de bienvenida del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const action = ctx.args[1];

        if (action === 'on' || action === 'off') {
            const enabled = action === 'on';
            await communityService.setWelcomeEnabled(ctx.jid, enabled);
            await sock.sendMessage(ctx.jid, { react: { text: enabled ? '👋' : '🔕', key: m.key } });
            await ctx.reply(`✅ Bienvenidas ${enabled ? 'activadas' : 'desactivadas'}.`);
            return;
        }

        if (action === 'set') {
            const msgText = ctx.rawBody.split(' ').slice(2).join(' ').trim();
            const hasImage = !!m.message?.imageMessage;
            const hasVideo = !!m.message?.videoMessage;

            if (!msgText && !hasImage && !hasVideo) {
                throw {
                    reply: '⚠️ Uso: `.bienvenida set <mensaje>`\n\n*Placeholders disponibles:*\n• `{{user}}` — mención del nuevo miembro\n• `{{group}}` — nombre del grupo\n• `{{desc}}` — descripción del grupo\n• `{{community}}` — nombre de comunidad\n\n_También puedes enviar este comando como descripción de una imagen/video._'
                };
            }

            let mediaPath = null;
            let mediaType = null;

            if (hasImage || hasVideo) {
                try {
                    const ext = hasVideo ? 'mp4' : 'jpg';
                    mediaType = hasVideo ? 'video' : 'image';
                    mediaPath = communityService.getAssetPath(ctx.jid, 'welcome', ext);
                    const buffer = await downloadMediaMessage(m, 'buffer', {});
                    communityService.saveAsset(mediaPath, buffer);
                } catch (err) {
                    logger.error('[BienvenidaCommand] Error descargando media:', err);
                    throw { reply: '❌ No se pudo descargar el archivo multimedia. Intenta de nuevo.' };
                }
            }

            const finalText = msgText || '👋 Bienvenido/a {{user}} al grupo *{{group}}*!';
            await communityService.setWelcomeContent(ctx.jid, finalText, mediaPath, mediaType);

            let resp = `✅ Mensaje de bienvenida configurado:\n\n_${finalText}_`;
            if (mediaPath) resp += `\n\n📎 Multimedia guardado (${mediaType}).`;
            await ctx.reply(resp);
            return;
        }

        if (action === 'ver' || action === 'view') {
            const welcome = await communityService.getWelcome(ctx.jid);
            if (!welcome.message) {
                await ctx.reply('❌ No hay mensaje de bienvenida configurado.');
            } else {
                let resp = `👋 *BIENVENIDA*\n\n*Estado:* ${welcome.enabled ? '✅ Activa' : '❌ Inactiva'}\n*Mensaje:* _${welcome.message}_`;
                if (welcome.mediaPath) resp += `\n*Media:* ${welcome.mediaType}`;
                await ctx.reply(resp);
            }
            return;
        }

        throw { reply: '⚠️ Uso: `.bienvenida on/off` | `.bienvenida set <mensaje>` | `.bienvenida ver`' };
    }
}

module.exports = BienvenidaCommand;
