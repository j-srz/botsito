const commercialService = require('../services/commercial.service');
const logger = require('../core/logger');

// Comandos de gestión que el Owner/Admin pueden usar sin licencia activa
const BYPASS_COMMANDS = new Set([
    '/activate', '/list-groups', '/add-admin', '/remove-admin',
    '/anuncio', '/alias', '.cm-admin', '.remote'
]);

class CommercialMiddleware {
    async handle(sock, m, ctx) {
        if (!ctx.isGroup) return true;

        // Comandos de gestión siempre pasan
        const firstWord = ctx.text.split(' ')[0];
        if (BYPASS_COMMANDS.has(firstWord)) return true;

        const active = await commercialService.isLicenseActive(ctx.jid);
        if (active) return true;

        logger.warn(`[COMMERCIAL] Licencia inactiva/vencida en ${ctx.jid}. Ejecutando auto-salida.`);

        try {
            const ownerNumber = commercialService.getOwnerJid().replace('@s.whatsapp.net', '');
            await sock.sendMessage(ctx.jid, {
                text: `⚠️ *La licencia de REX para este grupo ha vencido o no está activa.*\n\nPara renovar o contratar el servicio, contacta al administrador:\n📱 wa.me/${ownerNumber}`
            });
            await sock.groupLeave(ctx.jid);
        } catch (e) {
            logger.error(`[COMMERCIAL] Error en auto-salida de ${ctx.jid}: ${e.message}`);
        }

        return false;
    }
}

module.exports = new CommercialMiddleware();
