const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const { cleanID, getLegend } = require('../../utils/formatter');

class TotalchatCommand extends BaseCommand {
    constructor() {
        super('.totalchat', [], 'Muestra estadísticas de mensajes del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        try {
            const logs = await moderationService.getMessageLogs(ctx.jid);
            const entries = Object.entries(logs);

            if (entries.length === 0) {
                return await ctx.reply('📊 Aún no hay registros de mensajes para este grupo.');
            }

            // Calcular totales
            let totalMessages = 0;
            entries.forEach(([, data]) => { totalMessages += data.count; });

            // Ordenar por count descendente
            const sorted = entries.sort((a, b) => b[1].count - a[1].count);

            // Top 5
            const top5 = sorted.slice(0, 5);
            // Menos activo
            const leastActive = sorted[sorted.length - 1];

            let msg = `📊 *ESTADÍSTICAS DEL GRUPO*\n\n`;
            msg += `📨 *Total de mensajes:* ${totalMessages.toLocaleString()}\n`;
            msg += `👥 *Usuarios registrados:* ${entries.length}\n\n`;

            msg += `🏆 *Top 5 más activos:*\n`;
            const mentions = [];
            top5.forEach(([userId, data], i) => {
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                msg += `${medals[i]} @${cleanID(userId)} — ${data.count.toLocaleString()} msgs\n`;
                mentions.push(userId);
            });

            msg += `\n💤 *Menos activo:*\n`;
            msg += `└ @${cleanID(leastActive[0])} — ${leastActive[1].count.toLocaleString()} msgs`;
            mentions.push(leastActive[0]);

            await sock.sendMessage(ctx.jid, {
                text: msg + getLegend(sock),
                mentions
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ Error al obtener estadísticas de chat.');
        }
    }
}

module.exports = TotalchatCommand;
