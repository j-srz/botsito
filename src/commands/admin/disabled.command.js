const BaseCommand = require('../base.command');
const commandControlService = require('../../services/command-control.service');

class DisabledCommand extends BaseCommand {
    constructor() {
        super('.disabled', [], 'Lista los comandos desactivados en este grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const list = await commandControlService.getDisabledList(ctx.jid);

        if (list.length === 0) {
            return await ctx.reply('✅ No hay comandos desactivados en este grupo.');
        }

        let msg = `📴 *Comandos desactivados (${list.length}):*\n\n`;
        list.forEach(cmd => {
            msg += `• \`.${cmd}\`\n`;
        });

        await ctx.reply(msg);
    }
}

module.exports = DisabledCommand;
