const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');

class AddAdminCommand extends BaseCommand {
    constructor() {
        super('/add-admin', [], 'Dar acceso de administrador comercial (solo Owner)');
    }

    async execute(sock, m, ctx) {
        this.requireOwner(ctx);
        this.requirePrivate(ctx);

        const number = ctx.args[1];
        if (!number) return ctx.reply('⚠️ Uso: /add-admin <número>\nEj: /add-admin 5215512345678');

        const jid = number.includes('@') ? number : `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        const result = await commercialService.addAdmin(jid);

        if (!result.success) {
            const msgs = { is_owner: '⚠️ Ese número ya es el Owner.', already_admin: '⚠️ Ya es admin.' };
            return ctx.reply(msgs[result.reason] || '❌ Error desconocido.');
        }

        await ctx.reply(`✅ *Admin agregado:* ${jid}`);
    }
}

module.exports = AddAdminCommand;
