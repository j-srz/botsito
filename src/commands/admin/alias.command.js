const BaseCommand = require('../base.command');
const groupRegistry = require('../../services/group.registry');

class AliasCommand extends BaseCommand {
    constructor() {
        super('/alias', [], 'Asignar alias a un grupo para gestionarlo fácilmente');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        // /alias <jid_o_alias_actual> <nuevo_alias>
        const [, identifier, newAlias] = ctx.args;
        if (!identifier || !newAlias) {
            return ctx.reply('⚠️ Uso: /alias <jid_o_alias> <nuevo_alias>\nEj: /alias 120363...@g.us ventas-norte');
        }

        if (!/^[a-z0-9\-_]+$/.test(newAlias)) {
            return ctx.reply('❌ El alias solo puede tener letras minúsculas, números, guiones y guiones bajos.');
        }

        const resolvedJid = await groupRegistry.resolveIdentifier(identifier);
        if (!resolvedJid) return ctx.reply(`❌ No encontré el grupo: *${identifier}*`);

        const ok = await groupRegistry.addAlias(resolvedJid, newAlias);
        if (!ok) return ctx.reply(`❌ El alias *${newAlias}* ya está en uso por otro grupo.`);

        await ctx.reply(`✅ Alias *${newAlias}* asignado al grupo \`${resolvedJid}\``);
    }
}

module.exports = AliasCommand;
