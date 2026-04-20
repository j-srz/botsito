const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const logger = require('../../core/logger');

/**
 * Repositorio genérico para persistencia en archivos JSON sin bloquear el hilo.
 * Escrituras serializadas via write queue + escritura atómica (tmp → rename).
 */
class JsonRepository {
    constructor(filepath, defaultData = {}) {
        this.filepath = filepath;
        this.tmpPath = filepath + '.tmp';
        this.defaultData = defaultData;
        this.cache = null;
        this._writeQueue = Promise.resolve();

        const dir = path.dirname(this.filepath);
        if (!fsSync.existsSync(dir)) {
            fsSync.mkdirSync(dir, { recursive: true });
        }

        if (!fsSync.existsSync(this.filepath)) {
           fsSync.writeFileSync(this.filepath, JSON.stringify(this.defaultData, null, 2));
        }
    }

    /**
     * @returns {Promise<any>}
     */
    async read() {
        if (this.cache !== null) return this.cache;
        try {
            const data = await fs.readFile(this.filepath, 'utf-8');
            this.cache = JSON.parse(data);
            return this.cache;
        } catch (e) {
            logger.error(`Error leyendo JSON repo: ${this.filepath}`, e);
            return typeof this.defaultData === 'object' ? { ...this.defaultData } : this.defaultData;
        }
    }

    /**
     * Encola la escritura para que nunca haya dos writes simultáneos.
     * Usa escritura atómica: escribe en .tmp y luego renombra al archivo real.
     * @param {any} data
     */
    async write(data) {
        this.cache = data;
        this._writeQueue = this._writeQueue.then(() => this._atomicWrite(data));
        return this._writeQueue;
    }

    async _atomicWrite(data) {
        try {
            await fs.writeFile(this.tmpPath, JSON.stringify(data, null, 2));
            await fs.rename(this.tmpPath, this.filepath);
        } catch (e) {
            logger.error(`Error escribiendo JSON repo: ${this.filepath}`, e);
            try { await fs.unlink(this.tmpPath); } catch {}
        }
    }

    /**
     * Útil para arreglos de logs (mantiene sólo los ultimos 'limit' elementos)
     */
    async pushWithLimit(item, limit = 500) {
        let current = await this.read();
        if (!Array.isArray(current)) {
            current = [];
        }
        current.push(item);
        if (current.length > limit) {
            current.shift();
        }
        await this.write(current);
    }
}

module.exports = JsonRepository;
