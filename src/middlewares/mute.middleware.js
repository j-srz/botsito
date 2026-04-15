const moderationService = require('../services/moderation.service');
const logger = require('../core/logger');

/**
 * Middleware interceptor de mute.
 * Si el usuario está muteado, elimina su mensaje y bloquea el pipeline.
 */
class MuteMiddleware {
    async handle(sock, m, ctx) {
        if (!ctx.isGroup) return true;

        try {
            const isMuted = await moderationService.isMuted(ctx.jid, ctx.sender);
            if (!isMuted) return true;

            // Intentar eliminar el mensaje del usuario muteado
            try {
                await sock.sendMessage(ctx.jid, { delete: m.key });
            } catch (delErr) {
                logger.debug(`No se pudo eliminar mensaje de usuario muteado (bot sin permisos): ${delErr.message}`);
            }

            return false;
        } catch (e) {
            logger.error('MuteMiddleware.handle error:', e);
            return true; // En caso de error, no bloquear
        }
    }
}

module.exports = new MuteMiddleware();
