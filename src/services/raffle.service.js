const db = require('../data/db');

class RaffleService {
    
    // --- FRIENDLY LIST (Por Reacciones) ---
    async getFriendlyData() {
        return await db.ruletaFriendly.read();
    }

    async saveFriendlyData(data) {
        await db.ruletaFriendly.write(data);
    }

    async addFriendlyParticipant(participant) {
        const data = await this.getFriendlyData();
        if (!data.participants.includes(participant)) {
            data.participants.push(participant);
            await this.saveFriendlyData(data);
            return true;
        }
        return false;
    }

    // --- CUSTOM LIST (Ruletaban CS) ---
    async getCustomList() {
        return await db.ruletaCustom.read();
    }

    async saveCustomList(list) {
        await db.ruletaCustom.write(list);
    }

    async addCustomParticipants(participants) {
        let currentList = await this.getCustomList();
        let agregados = 0;
        participants.forEach(id => {
            if (!currentList.includes(id)) {
                currentList.push(id);
                agregados++;
            }
        });
        await this.saveCustomList(currentList);
        return { agregados, total: currentList.length };
    }

    async removeCustomParticipants(participants) {
        let currentList = await this.getCustomList();
        const inicial = currentList.length;
        currentList = currentList.filter(id => !participants.includes(id));
        const borrados = inicial - currentList.length;
        await this.saveCustomList(currentList);
        return borrados;
    }

    async resetCustomList() {
        await this.saveCustomList([]);
    }
}

module.exports = new RaffleService();
