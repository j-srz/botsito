const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');

class NotifyCommand extends BaseCommand {
    constructor() {
        super('.notify', [], 'Envía un aviso mencionando a todos los participantes.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const msgText = ctx.rawBody.slice(ctx.rawBody.indexOf(' ') + 1).trim();
        if (!msgText || msgText.toLowerCase() === '.notify') {
            return await ctx.reply('⚠️ Uso: `.notify <mensaje>`\nEjemplo: `.notify Subasta a las 9pm`');
        }

        const metadata = await groupService.getGroupMetadata(sock, ctx.jid);
        if (!metadata || !metadata.participants) {
            return await ctx.reply('❌ No se pudo obtener la lista de participantes.');
        }

        const mentions = metadata.participants.map(p => p.id);

        await sock.sendMessage(ctx.jid, {
            text: `📢 *AVISO*\n\n${msgText}`,
            mentions
        });
    }
}

module.exports = NotifyCommand;
