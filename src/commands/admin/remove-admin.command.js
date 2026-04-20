const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');

class RemoveAdminCommand extends BaseCommand {
    constructor() {
        super('/remove-admin', [], 'Revocar acceso de administrador comercial (solo Owner)');
    }

    async execute(sock, m, ctx) {
        this.requireOwner(ctx);
        this.requirePrivate(ctx);

        const number = ctx.args[1];
        if (!number) return ctx.reply('⚠️ Uso: /remove-admin <número>');

        const jid = number.includes('@') ? number : `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        const result = await commercialService.removeAdmin(jid);

        if (!result.success) return ctx.reply('❌ Ese número no es admin.');
        await ctx.reply(`✅ *Admin eliminado:* ${jid}`);
    }
}

module.exports = RemoveAdminCommand;
