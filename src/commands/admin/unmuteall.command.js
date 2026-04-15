const BaseCommand = require('../base.command');

class UnmuteallCommand extends BaseCommand {
    constructor() {
        super('.unmuteall', [], 'Abre el grupo para que todos puedan hablar.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        this.requireBotAdmin(ctx);

        await sock.groupSettingUpdate(ctx.jid, 'not_announcement');
        await sock.sendMessage(ctx.jid, {
            text: '🔊 *Grupo abierto.* Todos los participantes pueden enviar mensajes.'
        }, { quoted: m });
    }
}

module.exports = UnmuteallCommand;
