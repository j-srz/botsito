const BaseCommand = require('../base.command');
const commandControlService = require('../../services/command-control.service');

class EnableCommand extends BaseCommand {
    constructor() {
        super('.enable', [], 'Reactiva un comando desactivado en este grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const targetCmd = ctx.args[1];
        if (!targetCmd) {
            return await ctx.reply('⚠️ Uso: `.enable <comando>`\nEjemplo: `.enable ruletaban`');
        }

        const normalized = targetCmd.replace(/^\./, '');

        const result = await commandControlService.enableCommand(ctx.jid, normalized);

        if (result.success) {
            await ctx.react('✅');
            await ctx.reply(`✅ Comando \`.${normalized}\` **reactivado** en este grupo.`);
        } else if (result.reason === 'not_disabled') {
            await ctx.reply(`⚠️ El comando \`.${normalized}\` no estaba desactivado.`);
        } else {
            await ctx.reply('❌ Error al reactivar el comando.');
        }
    }
}

module.exports = EnableCommand;
