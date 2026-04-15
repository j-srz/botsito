const BaseCommand = require('../base.command');

class MuteallCommand extends BaseCommand {
    constructor() {
        super('.muteall', [], 'Cierra el grupo para que solo hablen admins.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        this.requireBotAdmin(ctx);

        await sock.groupSettingUpdate(ctx.jid, 'announcement');
        await sock.sendMessage(ctx.jid, {
            text: '🔇 *Grupo silenciado.* Solo los administradores pueden enviar mensajes.'
        }, { quoted: m });
    }
}

module.exports = MuteallCommand;
