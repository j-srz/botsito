const BaseCommand = require('../base.command');
const communityService = require('../../services/community.service');

class CommunityCommand extends BaseCommand {
    constructor() {
        super('.community', [], 'Gestiona el nombre de la comunidad del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const action = ctx.args[1];

        if (action === 'set') {
            const name = ctx.rawBody.split(' ').slice(2).join(' ').trim();
            if (!name) throw { reply: '⚠️ Uso: `.community set <nombre>`\nEjemplo: `.community set Rexitos 🦖`' };

            await communityService.setCommunityName(ctx.jid, name);
            await ctx.reply(`✅ Nombre de comunidad configurado: *${name}*`);
            return;
        }

        if (action === 'view' || !action) {
            const name = await communityService.getCommunityName(ctx.jid);
            await ctx.reply(name
                ? `🏘️ *Nombre de comunidad:* ${name}`
                : '❌ No hay nombre de comunidad configurado. Usa `.community set <nombre>`'
            );
            return;
        }

        throw { reply: '⚠️ Uso: `.community set <nombre>` | `.community view`' };
    }
}

module.exports = CommunityCommand;
