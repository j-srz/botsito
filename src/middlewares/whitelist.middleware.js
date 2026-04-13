const env = require('../config/env.config');
const logger = require('../core/logger');

class WhitelistMiddleware {
    async handle(ctx) {
        if (!ctx.isGroup) return true; // Private chats are allowed (assuming from the architecture, or we can block private)
        // Original code:
        // if (isGroup && !gruposAdmitidos.includes(jid)) return;

        if (env.ALLOWED_GROUPS.length > 0 && !env.ALLOWED_GROUPS.includes(ctx.jid)) {
            logger.debug(`🚫 Grupo no autorizado intentó usar el bot: ${ctx.jid}`);
            return false;
        }

        return true;
    }
}

module.exports = new WhitelistMiddleware();
