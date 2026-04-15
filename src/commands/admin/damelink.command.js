const BaseCommand = require('../base.command');

class DameLinkCommand extends BaseCommand {
    constructor() {
        super('.damelink', [], 'Envía solo el link de invitación del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);
        this.requireBotAdmin(ctx);

        try {
            const code = await sock.groupInviteCode(ctx.jid);
            await sock.sendMessage(ctx.jid, {
                text: `https://chat.whatsapp.com/${code}`
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ No se pudo obtener el link.');
        }
    }
}

module.exports = DameLinkCommand;
