const db = require('../data/db');

class AuctionService {
    async getAuctions() {
        return await db.subastas.read();
    }

    async getSummary() {
        const data = await this.getAuctions();
        if (data.length === 0) return null;

        const stats = {};
        data.forEach(p => {
            if (!stats[p.ganador_id]) {
                stats[p.ganador_id] = { victorias: 0, total: 0 };
            }
            stats[p.ganador_id].victorias += 1;
            stats[p.ganador_id].total += p.monto;
        });

        // Retorna un array ordenado por victorias
        return Object.entries(stats).sort((a, b) => b[1].victorias - a[1].victorias);
    }
}

module.exports = new AuctionService();
