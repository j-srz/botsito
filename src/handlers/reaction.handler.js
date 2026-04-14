const logger = require('../core/logger');
const sessionManager = require('../core/session/group.session.manager');

class ReactionHandler {
    async handle(sock, m) {
        const reaction = m.message?.reactionMessage;
        if (!reaction) return;

        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        try {
            // Obtenemos el contexto reactivo del grupo
            const state = await sessionManager.getSession(jid);
            
            if (state.raffle.messageId && reaction.key.id === state.raffle.messageId) {
                const reactor = m.key.participant || m.key.remoteJid;
                
                if (!state.raffle.participants.includes(reactor)) {
                    state.raffle.participants.push(reactor);
                    logger.debug(`✅ Participante aislado anotado por reacción: ${reactor} en Grupo: ${jid}`);
                }
            }
        } catch (e) {
            logger.error("❌ Error en el listener de reacciones aislado:", e);
        }
    }
}

module.exports = new ReactionHandler();
