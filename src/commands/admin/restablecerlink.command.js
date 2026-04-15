const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class RestablecerlinkCommand extends BaseCommand {
    constructor() {
        super('.restablecerlink', [], 'Revoca el link actual y genera uno nuevo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        this.requireBotAdmin(ctx);
        await ctx.react('🔄');

        try {
            const newCode = await sock.groupRevokeInvite(ctx.jid);
            const newUrl = `https://chat.whatsapp.com/${newCode}`;

            await sock.sendMessage(ctx.jid, {
                text: `✅ *Link restablecido exitosamente.*\n\n🔗 Nuevo link:\n${newUrl}` + getLegend(sock)
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ No se pudo restablecer el link del grupo.');
        }
    }
}

module.exports = RestablecerlinkCommand;
