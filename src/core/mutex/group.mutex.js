/**
 * Implementación Simple de Queue-Based Mutex para Aislar Bloques de Concurrencia por JID
 */
class GroupMutex {
    constructor() {
        this.locks = new Map();
    }

    /**
     * @param {string} jid
     * @param {Function} callback Función asíncrona a ejecutar protegida del Event Loop race
     */
    async executeLocked(jid, callback) {
        if (!this.locks.has(jid)) {
            this.locks.set(jid, Promise.resolve());
        }

        let release;
        const currentLock = this.locks.get(jid);
        const nextLock = new Promise(res => release = res);

        this.locks.set(jid, currentLock.then(async () => {
            try {
                return await callback();
            } finally {
                release(); // Siempre libera para no hacer dead-lock en el grupo
            }
        }));

        // Para evitar fugas de memoria con promises apiladas si no hay actividad
        // Idealmente en sistemas extremos se limpia el lock map cuando se resuelve todo
        return this.locks.get(jid);
    }
}

module.exports = new GroupMutex();
