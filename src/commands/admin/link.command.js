const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class LinkCommand extends BaseCommand {
    constructor() {
        super('.link', [], 'Obtiene el link de invitación del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);
        this.requireBotAdmin(ctx);

        try {
            const code = await sock.groupInviteCode(ctx.jid);
            const url = `https://chat.whatsapp.com/${code}`;

            await sock.sendMessage(ctx.jid, {
                text: `🔗 *Link de invitación del grupo:*\n\n${url}` + getLegend(sock)
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ No se pudo obtener el link del grupo. Verifica que el bot sea admin.');
        }
    }
}

module.exports = LinkCommand;
