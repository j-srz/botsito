const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');

class ListGroupsCommand extends BaseCommand {
    constructor() {
        super('/list-groups', [], 'Listar todos los grupos con estado de licencia');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        const groups = await commercialService.listAllGroups();

        if (groups.length === 0) return ctx.reply('📭 No hay grupos registrados aún.');

        const lines = groups.map((g, i) => {
            const alias = g.aliases.length > 0 ? g.aliases.join(', ') : '—';
            let licLine;
            if (!g.license.active) {
                const reason = g.license.reason === 'expired' ? '🔴 Vencida' : '⚫ Sin licencia';
                licLine = reason;
            } else if (g.license.type === 'unlimited') {
                licLine = '🟢 Ilimitada';
            } else {
                licLine = `🟢 Activa · ${g.license.daysLeft}d restantes`;
            }

            return `${i + 1}. *${g.name}*\n   Alias: ${alias}\n   JID: \`${g.jid}\`\n   Licencia: ${licLine}`;
        });

        const header = `📋 *GRUPOS REGISTRADOS (${groups.length})*\n${'─'.repeat(30)}\n\n`;
        await ctx.reply(header + lines.join('\n\n'));
    }
}

module.exports = ListGroupsCommand;
