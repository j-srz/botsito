const BaseCommand = require('../base.command');
const logger = require('../../core/logger');

class IdCommand extends BaseCommand {
    constructor() {
        super('.id', [], 'Imprime el ID del chat en la consola.');
    }

    async execute(sock, m, ctx) {
        logger.info("====================================");
        logger.info(`🆔 ID SOLICITADO: ${ctx.jid}`);
        logger.info("====================================");

        await sock.sendMessage(ctx.jid, { react: { text: "💋", key: m.key } });
    }
}

module.exports = IdCommand;
