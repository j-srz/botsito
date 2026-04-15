const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const { cleanID } = require('../../utils/formatter');

const INACTIVITY_DAYS = 7;

class FantasmasCommand extends BaseCommand {
    constructor() {
        super('.fantasmas', [], 'Detecta usuarios inactivos en el grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        await ctx.react('🔍');

        const groupService = require('../../services/group.service');
        const metadata = await groupService.getGroupMetadata(sock, ctx.jid);
        if (!metadata || !metadata.participants) {
            return await ctx.reply('❌ No se pudo obtener info del grupo.');
        }

        const logs = await moderationService.getMessageLogs(ctx.jid);
        const threshold = Date.now() - (INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
        const ghosts = [];

        for (const participant of metadata.participants) {
            const userLog = logs[participant.id];
            if (!userLog || userLog.lastMessage < threshold) {
                ghosts.push(participant.id);
            }
        }

        if (ghosts.length === 0) {
            return await ctx.reply('✅ No se detectaron fantasmas. Todos los participantes han tenido actividad reciente.');
        }

        let msg = `👻 *FANTASMAS DETECTADOS (${ghosts.length})*\n`;
        msg += `_Sin actividad en los últimos ${INACTIVITY_DAYS} días_\n\n`;

        ghosts.forEach((jid, i) => {
            msg += `${i + 1}. @${cleanID(jid)}\n`;
        });

        await sock.sendMessage(ctx.jid, {
            text: msg,
            mentions: ghosts
        }, { quoted: m });
    }
}

module.exports = FantasmasCommand;
