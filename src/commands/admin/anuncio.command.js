const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');
const logger = require('../../core/logger');

class AnuncioCommand extends BaseCommand {
    constructor() {
        super('/anuncio', [], 'Enviar anuncio a todos los grupos con licencia activa');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        const message = ctx.args.slice(1).join(' ').trim();
        if (!message) return ctx.reply('⚠️ Uso: /anuncio <mensaje>');

        const groups = await commercialService.listAllGroups();
        const activeGroups = groups.filter(g => g.license.active);

        if (activeGroups.length === 0) return ctx.reply('📭 No hay grupos con licencia activa.');

        await ctx.reply(`📢 Enviando a ${activeGroups.length} grupos...`);

        let sent = 0, failed = 0;
        for (const group of activeGroups) {
            try {
                await sock.sendMessage(group.jid, { text: `📢 *ANUNCIO*\n\n${message}` });
                sent++;
            } catch (e) {
                logger.error(`[anuncio] Falló en ${group.jid}: ${e.message}`);
                failed++;
            }
            // Pequeño delay para no saturar la API de WhatsApp
            await new Promise(r => setTimeout(r, 500));
        }

        await ctx.reply(`✅ Anuncio enviado\n📤 Exitosos: ${sent}\n❌ Fallidos: ${failed}`);
    }
}

module.exports = AnuncioCommand;
