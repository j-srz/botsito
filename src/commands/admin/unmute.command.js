const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const { cleanID } = require('../../utils/formatter');

class UnmuteCommand extends BaseCommand {
    constructor() {
        super('.unmute', [], 'Dessilencia a un usuario mencionado.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const targetJid = this.getTargetUser(m);
        if (!targetJid) {
            return await ctx.reply('⚠️ Debes *mencionar* al usuario a dessilenciar.\nUso: `.unmute @usuario`');
        }

        const removed = await moderationService.unmuteUser(ctx.jid, targetJid);
        if (removed) {
            await sock.sendMessage(ctx.jid, {
                text: `🔊 @${cleanID(targetJid)} ha sido *dessilenciado*.`,
                mentions: [targetJid]
            }, { quoted: m });
        } else {
            await ctx.reply('⚠️ Ese usuario no estaba silenciado.');
        }
    }
}

module.exports = UnmuteCommand;
