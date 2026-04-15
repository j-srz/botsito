const BaseCommand = require('../base.command');
const commandControlService = require('../../services/command-control.service');

class DisableCommand extends BaseCommand {
    constructor() {
        super('.disable', [], 'Desactiva un comando en este grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const targetCmd = ctx.args[1];
        if (!targetCmd) {
            return await ctx.reply('⚠️ Uso: `.disable <comando>`\nEjemplo: `.disable ruletaban`');
        }

        // Normalizar — permitir ".disable ruletaban" o ".disable .ruletaban"
        const normalized = targetCmd.replace(/^\./, '');

        if (commandControlService.isProtected(normalized)) {
            return await ctx.reply(`🛡️ El comando \`.${normalized}\` no se puede desactivar.`);
        }

        const result = await commandControlService.disableCommand(ctx.jid, normalized);

        if (result.success) {
            await ctx.react('🚫');
            await ctx.reply(`📴 Comando \`.${normalized}\` **desactivado** en este grupo.`);
        } else if (result.reason === 'already_disabled') {
            await ctx.reply(`⚠️ El comando \`.${normalized}\` ya está desactivado.`);
        } else {
            await ctx.reply('❌ Error al desactivar el comando.');
        }
    }
}

module.exports = DisableCommand;
