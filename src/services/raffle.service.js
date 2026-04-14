/**
 * Manejador de la lógica pura de la Ruleta delegada por el Mutex,
 * ya no accede al JSON genérico usando DB sino que mutará su propio estado de argumento aislado.
 */
class RaffleService {
    
    // --- FRIENDLY LIST (Por Reacciones) ---
    /**
     * @param {Object} groupState Context state dictionary for a specific group
     */
    addFriendlyParticipant(groupState, participant) {
        if (!groupState.raffle.participants.includes(participant)) {
            groupState.raffle.participants.push(participant);
            return true;
        }
        return false;
    }

    startFriendlyRaffle(groupState, messageId) {
        groupState.raffle.messageId = messageId;
        groupState.raffle.participants = [];
    }

    removeFriendlyParticipants(groupState, participants) {
        groupState.raffle.participants = groupState.raffle.participants.filter(id => !participants.includes(id));
    }

    resetFriendlyRaffle(groupState) {
        groupState.raffle.messageId = null;
        groupState.raffle.participants = [];
    }


    // --- CUSTOM LIST (Ruletaban CS) ---
    addCustomParticipants(groupState, participants) {
        let agregados = 0;
        participants.forEach(id => {
            if (!groupState.customRaffle.includes(id)) {
                groupState.customRaffle.push(id);
                agregados++;
            }
        });
        return { agregados, total: groupState.customRaffle.length };
    }

    removeCustomParticipants(groupState, participants) {
        const inicial = groupState.customRaffle.length;
        groupState.customRaffle = groupState.customRaffle.filter(id => !participants.includes(id));
        return inicial - groupState.customRaffle.length;
    }

    resetCustomList(groupState) {
        groupState.customRaffle = [];
    }
}

module.exports = new RaffleService();
