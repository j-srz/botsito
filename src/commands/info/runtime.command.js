const BaseCommand = require('../base.command');

class RuntimeCommand extends BaseCommand {
    constructor() {
        super('.runtime', ['.uptime'], 'Muestra el tiempo de actividad del bot.');
    }

    async execute(sock, m, ctx) {
        try {
            const uptime = process.uptime();

            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            let timeStr = '';
            if (days > 0) timeStr += `${days}d `;
            timeStr += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            await ctx.reply(`⏱️ *Uptime del Bot:* ${timeStr}`);
        } catch (e) {
            await ctx.reply('❌ Error al obtener el runtime.');
        }
    }
}

module.exports = RuntimeCommand;
