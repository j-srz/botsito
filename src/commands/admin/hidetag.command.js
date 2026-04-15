const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');

class HidetagCommand extends BaseCommand {
    constructor() {
        super('.hidetag', [], 'Menciona a todos sin mostrar las menciones visualmente.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const msgText = ctx.rawBody.slice(ctx.rawBody.indexOf(' ') + 1).trim();
        if (!msgText || msgText.toLowerCase() === '.hidetag') {
            return await ctx.reply('⚠️ Uso: `.hidetag <mensaje>`');
        }

        const metadata = await groupService.getGroupMetadata(sock, ctx.jid);
        if (!metadata || !metadata.participants) {
            return await ctx.reply('❌ No se pudo obtener la lista de participantes.');
        }

        const mentions = metadata.participants.map(p => p.id);

        await sock.sendMessage(ctx.jid, {
            text: msgText,
            mentions
        });
    }
}

module.exports = HidetagCommand;
