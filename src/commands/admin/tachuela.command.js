const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');

class TachuelaCommand extends BaseCommand {
    constructor() {
        super('.tachuela', ['.pin'], 'Fija un mensaje citado en la memoria del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const pinnedText = this.getQuotedText(m);
        if (!pinnedText) {
            return await ctx.reply('⚠️ Debes *citar* (responder) un mensaje de texto para fijarlo.');
        }

        const quotedInfo = this.getQuotedInfo(m);
        const author = quotedInfo.participant || ctx.sender;
        const success = await moderationService.setPinnedMessage(ctx.jid, pinnedText, author);

        if (success) {
            await ctx.react('📌');
            await ctx.reply(`📌 *Mensaje fijado exitosamente.*\nUsa \`.verpin\` para verlo.`);
        } else {
            await ctx.reply('❌ Error al fijar el mensaje.');
        }
    }
}

module.exports = TachuelaCommand;
