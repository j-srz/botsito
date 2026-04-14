const db = require('../data/db');
const { cleanID } = require('../utils/formatter');

class GroupRegistry {
    async getAll() {
        return await db.groupsDirectory.read();
    }

    async getGroupRecord(jid) {
        const root = await this.getAll();
        if (!root[jid]) {
            root[jid] = {
                jid,
                name: "Desconocido",
                aliases: [],
                tags: [],
                operators: { owner: null, list: [] },
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            await db.groupsDirectory.write(root);
        }
        return root[jid];
    }

    async updateGroupRecord(jid, payload) {
        const root = await this.getAll();
        const record = root[jid] || await this.getGroupRecord(jid);
        
        Object.assign(record, payload);
        record.lastUsed = new Date().toISOString();
        
        root[jid] = record;
        await db.groupsDirectory.write(root);
        return record;
    }

    async registerActivity(jid, groupName) {
        const root = await this.getAll();
        let record = root[jid];
        let needsSave = false;
        
        if (!record) {
            record = await this.getGroupRecord(jid); // Crea e inicializa
            needsSave = true;
        }

        if (groupName && record.name !== groupName) {
           record.name = groupName;
           needsSave = true;
        }

        if (needsSave) {
            record.lastUsed = new Date().toISOString();
            await db.groupsDirectory.write(root);
        }
    }

    async resolveIdentifier(query) {
        const q = String(query).toLowerCase().trim();
        if (q.endsWith('@g.us')) return q; // Literal JID

        const root = await this.getAll();

        // 1er pase: alias explícitos (Prioridad Alta)
        for (const [jid, data] of Object.entries(root)) {
            if (data.aliases && data.aliases.map(a=>a.toLowerCase()).includes(q)) return jid;
        }

        // 2do pase: Tags exactos (Prioridad Media)
        for (const [jid, data] of Object.entries(root)) {
            if (data.tags && data.tags.map(t=>String(t).toLowerCase()).includes(q)) return jid;
        }

        // 3er pase: Nombre parcial del grupo (Fallback de conveniencia)
        // Buscamos cuál hace match primero
        for (const [jid, data] of Object.entries(root)) {
            if (data.name && data.name.toLowerCase() === q) return jid;
        }

        return null;
    }

    async saveOperators(jid, operatorsObj) {
        return await this.updateGroupRecord(jid, { operators: operatorsObj });
    }

    async addAlias(jid, alias) {
        // [AUDIT FIX]: Validación GLOBAL de colisión cruzada
        const currentCheck = await this.resolveIdentifier(alias);
        if (currentCheck && currentCheck !== jid) return false;

        const record = await this.getGroupRecord(jid);
        if (!record.aliases.includes(alias)) {
            record.aliases.push(alias);
            await this.updateGroupRecord(jid, { aliases: record.aliases });
        }
        return true;
    }

    async addTag(jid, tag) {
        // [AUDIT FIX]: Validación GLOBAL de colisión cruzada
        const currentCheck = await this.resolveIdentifier(tag);
        if (currentCheck && currentCheck !== jid) return false;

        const record = await this.getGroupRecord(jid);
        if (!record.tags.includes(tag)) {
            record.tags.push(tag);
            await this.updateGroupRecord(jid, { tags: record.tags });
        }
        return true;
    }
}

module.exports = new GroupRegistry();
