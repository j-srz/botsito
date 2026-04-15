const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const groupService = require('../../services/group.service');
const { cleanID } = require('../../utils/formatter');

const ONLINE_MINUTES = 15;

class ListonlineCommand extends BaseCommand {
    constructor() {
        super('.listonline', [], 'Muestra usuarios con actividad reciente.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        try {
            const logs = await moderationService.getMessageLogs(ctx.jid);
            const threshold = Date.now() - (ONLINE_MINUTES * 60 * 1000);

            const recentUsers = [];
            for (const [userId, data] of Object.entries(logs)) {
                if (data.lastMessage >= threshold) {
                    recentUsers.push(userId);
                }
            }

            if (recentUsers.length === 0) {
                return await ctx.reply(`🟢 No se detectó actividad en los últimos ${ONLINE_MINUTES} minutos.`);
            }

            let msg = `🟢 *ACTIVIDAD RECIENTE (${recentUsers.length})*\n`;
            msg += `_Usuarios con mensajes en los últimos ${ONLINE_MINUTES} min_\n\n`;

            recentUsers.forEach((jid, i) => {
                msg += `${i + 1}. @${cleanID(jid)}\n`;
            });

            msg += `\n> ⚠️ _Esto refleja actividad reciente, no conexión en tiempo real._`;

            await sock.sendMessage(ctx.jid, {
                text: msg,
                mentions: recentUsers
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ Error al consultar actividad reciente.');
        }
    }
}

module.exports = ListonlineCommand;
