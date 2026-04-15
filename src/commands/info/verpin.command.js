const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const { cleanID, getLegend } = require('../../utils/formatter');

class VerpinCommand extends BaseCommand {
    constructor() {
        super('.verpin', [], 'Muestra el mensaje fijado del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        try {
            const pinned = await moderationService.getPinnedMessage(ctx.jid);

            if (!pinned) {
                return await ctx.reply('📌 No hay ningún mensaje fijado en este grupo.\nUsa `.tachuela` para fijar uno.');
            }

            const date = new Date(pinned.timestamp).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let msg = `📌 *MENSAJE FIJADO*\n\n`;
            msg += `${pinned.text}\n\n`;
            msg += `👤 Fijado por: @${cleanID(pinned.author)}\n`;
            msg += `📅 ${date}`;

            await sock.sendMessage(ctx.jid, {
                text: msg + getLegend(sock),
                mentions: [pinned.author]
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ Error al mostrar el mensaje fijado.');
        }
    }
}

module.exports = VerpinCommand;
