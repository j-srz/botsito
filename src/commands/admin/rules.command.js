const BaseCommand = require('../base.command');
const communityService = require('../../services/community.service');
const { getLegend } = require('../../utils/formatter');

class RulesCommand extends BaseCommand {
    constructor() {
        super('.rules', [], 'Muestra o configura las reglas del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const action = ctx.args[1];

        if (action === 'set') {
            this.requireAdmin(ctx);

            // Allow text from quoted message OR inline text
            let rulesText = ctx.rawBody.split(' ').slice(2).join(' ').trim();
            if (!rulesText) {
                rulesText = this.getQuotedText(m);
            }

            if (!rulesText) {
                throw { reply: '⚠️ Uso: `.rules set <texto>`\nTambién puedes citar un mensaje con las reglas.' };
            }

            await communityService.setRules(ctx.jid, rulesText);
            await sock.sendMessage(ctx.jid, { react: { text: '📋', key: m.key } });
            await ctx.reply('✅ Reglas del grupo actualizadas.');
            return;
        }

        // Show rules
        const rules = await communityService.getRules(ctx.jid);
        if (!rules) {
            await ctx.reply('❌ Este grupo no tiene reglas configuradas. (Admin: `.rules set <texto>`)');
            return;
        }

        await sock.sendMessage(ctx.jid, {
            text: `*📋 REGLAMENTO DEL GRUPO*\n\n${rules}` + getLegend(sock)
        }, { quoted: m });
    }
}

module.exports = RulesCommand;
