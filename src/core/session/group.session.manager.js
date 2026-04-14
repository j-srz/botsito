const db = require('../../data/db');
const groupMutex = require('../mutex/group.mutex');

class GroupSessionManager {
    constructor() {
        /** @type {Map<string, Object>} */
        this.sessions = new Map();
        /** @type {Map<string, number>} */
        this.timers = new Map();
        this.TTL = 1000 * 60 * 60; // 1 hora de inactividad antes de limpiar la RAM
    }

    getDefaultState() {
        return {
            raffle: { messageId: null, participants: [] }, // Estado temporal (solo RAM)
            customRaffle: [] // Estado temporal (ruletaban)
        };
    }

    _refreshTTL(jid) {
        if (this.timers.has(jid)) {
            clearTimeout(this.timers.get(jid));
        }

        const timer = setTimeout(() => {
            // El grupo estuvo inactivo 1 hora, liberamos la sesión de la RAM
            this.sessions.delete(jid);
            this.timers.delete(jid);
        }, this.TTL);

        this.timers.set(jid, timer);
    }

    /**
     * @param {string} jid 
     */
    async getSession(jid) {
        return groupMutex.executeLocked(jid, async () => {
            this._refreshTTL(jid);
            if (!this.sessions.has(jid)) {
                // Al crearse la sesión temporal en RAM, cargamos los defaults
                this.sessions.set(jid, this.getDefaultState());
            }
            return this.sessions.get(jid);
        });
    }

    /**
     * Hook para guardar persistencia de manera diferida si agregamos Redis
     */
    async saveSession(jid) {
        // En esta arquitectura la mayoría del estado del GroupSession
        // es temporal (rifas en curso). Guardados a disco se manejan
        // por repositorios puros.
    }
}

module.exports = new GroupSessionManager();
