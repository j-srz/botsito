const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');
const { cleanID, getLegend } = require('../../utils/formatter');

class GroupinfoCommand extends BaseCommand {
    constructor() {
        super('.groupinfo', ['.ginfo'], 'Muestra información detallada del grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        try {
            const metadata = await groupService.getGroupMetadata(sock, ctx.jid);

            if (!metadata) {
                return await ctx.reply('❌ No se pudo obtener la información del grupo.');
            }

            const admins = metadata.participants.filter(
                p => p.admin === 'admin' || p.admin === 'superadmin'
            );

            let msg = `ℹ️ *INFORMACIÓN DEL GRUPO*\n\n`;
            msg += `📛 *Nombre:* ${metadata.subject || 'Sin nombre'}\n`;
            msg += `📝 *Descripción:*\n${metadata.desc || '_Sin descripción_'}\n\n`;
            msg += `👥 *Participantes:* ${metadata.participants.length}\n`;
            msg += `👑 *Admins (${admins.length}):*\n`;

            const mentions = [];
            admins.forEach(admin => {
                const role = admin.admin === 'superadmin' ? '👑' : '🛡️';
                msg += `${role} @${cleanID(admin.id)}\n`;
                mentions.push(admin.id);
            });

            await sock.sendMessage(ctx.jid, {
                text: msg + getLegend(sock),
                mentions
            }, { quoted: m });
        } catch (e) {
            await ctx.reply('❌ Error al obtener información del grupo.');
        }
    }
}

module.exports = GroupinfoCommand;
