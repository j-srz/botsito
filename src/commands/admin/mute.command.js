const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');
const { cleanID } = require('../../utils/formatter');

class MuteCommand extends BaseCommand {
    constructor() {
        super('.mute', [], 'Silencia a un usuario mencionado en el grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const targetJid = this.getTargetUser(m);
        if (!targetJid) {
            return await ctx.reply('⚠️ Debes *mencionar* a un usuario.\nUso: `.mute @usuario`');
        }

        // No permitir mutear al bot
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetJid === botId) {
            return await ctx.reply('🤖 No puedo silenciarme a mí mismo.');
        }

        // No permitir mutear a admins
        const groupService = require('../../services/group.service');
        const targetIsAdmin = await groupService.isAdmin(sock, ctx.jid, targetJid);
        if (targetIsAdmin) {
            return await ctx.reply('⚠️ No se puede silenciar a un administrador.');
        }

        const success = await moderationService.muteUser(ctx.jid, targetJid);
        if (success) {
            await sock.sendMessage(ctx.jid, {
                text: `🔇 @${cleanID(targetJid)} ha sido *silenciado*.\nSus mensajes serán eliminados automáticamente.`,
                mentions: [targetJid]
            }, { quoted: m });
        } else {
            await ctx.reply('❌ Error al silenciar al usuario.');
        }
    }
}

module.exports = MuteCommand;
