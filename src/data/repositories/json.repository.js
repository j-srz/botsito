const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const logger = require('../../core/logger');

/**
 * Repositorio genérico para persistencia en archivos JSON sin bloquear el hilo
 */
class JsonRepository {
    constructor(filepath, defaultData = {}) {
        this.filepath = filepath;
        this.defaultData = defaultData;
        this.cache = null;

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
        if (this.cache) return this.cache;
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
     * @param {any} data 
     */
    async write(data) {
        this.cache = data;
        try {
            await fs.writeFile(this.filepath, JSON.stringify(data, null, 2));
        } catch (e) {
            logger.error(`Error escribiendo JSON repo: ${this.filepath}`, e);
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
