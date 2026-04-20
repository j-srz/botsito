/**
 * Implementación Simple de Queue-Based Mutex para Aislar Bloques de Concurrencia por JID
 */
class GroupMutex {
    constructor() {
        this.locks = new Map();
        this.pending = new Map(); // contador de operaciones activas por jid
    }

    /**
     * @param {string} jid
     * @param {Function} callback Función asíncrona a ejecutar protegida del Event Loop race
     */
    async executeLocked(jid, callback) {
        if (!this.locks.has(jid)) {
            this.locks.set(jid, Promise.resolve());
            this.pending.set(jid, 0);
        }

        this.pending.set(jid, this.pending.get(jid) + 1);

        const currentLock = this.locks.get(jid);

        const nextLock = currentLock.then(async () => {
            try {
                return await callback();
            } finally {
                const remaining = this.pending.get(jid) - 1;
                this.pending.set(jid, remaining);
                if (remaining === 0) {
                    this.locks.delete(jid);
                    this.pending.delete(jid);
                }
            }
        });

        this.locks.set(jid, nextLock.catch(() => {}));

        return nextLock;
    }
}

module.exports = new GroupMutex();
