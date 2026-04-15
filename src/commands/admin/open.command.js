const BaseCommand = require('../base.command');

class OpenCommand extends BaseCommand {
    constructor() {
        super('.open', [], 'Abre el grupo para que todos los participantes puedan hablar.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        await sock.groupSettingUpdate(ctx.jid, "not_announcement");
        await sock.sendMessage(ctx.jid, { react: { text: "🔓", key: m.key } });
    }
}

module.exports = OpenCommand;
