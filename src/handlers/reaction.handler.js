const raffleService = require('../services/raffle.service');
const logger = require('../core/logger');

class ReactionHandler {
    async handle(sock, m) {
        const reaction = m.message?.reactionMessage;
        if (!reaction) return;

        try {
            const data = await raffleService.getFriendlyData();
            
            if (data.messageId && reaction.key.id === data.messageId) {
                const reactor = m.key.participant || m.key.remoteJid;
                
                const wasAdded = await raffleService.addFriendlyParticipant(reactor);
                if (wasAdded) {
                    logger.debug(`✅ Participante anotado por reacción: ${reactor}`);
                }
            }
        } catch (e) {
            logger.error("❌ Error en el listener de reacciones:", e);
        }
    }
}

module.exports = new ReactionHandler();
