const BaseCommand = require('../base.command');
const auctionService = require('../../services/auction.service');
const { getLegend } = require('../../utils/formatter');

class ResumenCommand extends BaseCommand {
    constructor() {
        super('.resumen', [], 'Ranking de subastas.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        try {
            const ranking = await auctionService.getSummary();
            if (!ranking) return await sock.sendMessage(ctx.jid, { text: "Sin registros aún." });

            let res = `*📊 RESUMEN DE SUBASTAS*\n_Top Ganadores_\n\n`;
            const allMentions = [];

            ranking.forEach(([id, user], i) => {
                const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
                const num = id.split("@")[0].split(":")[0];
                res += `${medalla} @${num}\n`;
                res += `   └ Wins: ${user.victorias} | Total: $${user.total}\n`;
                allMentions.push(id);
            });

            await sock.sendMessage(ctx.jid, { text: res + getLegend(sock), mentions: allMentions }, { quoted: m });
        } catch (err) {
            await sock.sendMessage(ctx.jid, { text: "Error al procesar resumen." });
        }
    }
}

module.exports = ResumenCommand;
