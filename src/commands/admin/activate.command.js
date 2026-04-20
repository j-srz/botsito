const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');
const groupRegistry = require('../../services/group.registry');

class ActivateCommand extends BaseCommand {
    constructor() {
        super('/activate', [], 'Activar licencia de un grupo');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        // /activate <grupo> <tipo> [cantidad]
        // Ej: /activate ventas days 30
        //     /activate ventas unlimited
        const [, identifier, type, amountStr] = ctx.args;

        if (!identifier || !type) {
            return ctx.reply(
                '⚠️ Uso: /activate <grupo> <tipo> [cantidad]\n\n' +
                'Tipos:\n' +
                '  days <N>    → N días\n' +
                '  weeks <N>   → N semanas\n' +
                '  months <N>  → N meses\n' +
                '  unlimited   → Sin vencimiento\n\n' +
                'Ej: /activate ventas days 30'
            );
        }

        const resolvedJid = await groupRegistry.resolveIdentifier(identifier);
        if (!resolvedJid) return ctx.reply(`❌ No encontré el grupo: *${identifier}*`);

        const amount = amountStr ? Number(amountStr) : null;
        const result = await commercialService.activateLicense(resolvedJid, type, amount, ctx.sender);

        if (!result.success) {
            const msgs = {
                invalid_type: '❌ Tipo inválido. Usa: days, weeks, months, unlimited',
                invalid_amount: '❌ Cantidad inválida. Debe ser un número positivo.',
                group_not_found: '❌ Grupo no encontrado en el directorio.'
            };
            return ctx.reply(msgs[result.reason] || '❌ Error activando licencia.');
        }

        const lic = result.license;
        const expStr = lic.expiresAt
            ? `📅 Vence: ${new Date(lic.expiresAt).toLocaleDateString('es-MX')}`
            : '♾️ Sin vencimiento';

        await ctx.reply(`✅ *Licencia activada*\n\nGrupo: \`${resolvedJid}\`\nTipo: ${lic.type}\n${expStr}`);
    }
}

module.exports = ActivateCommand;
