const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');

class OpenCommand extends BaseCommand {
    constructor() {
        super('.open', [], 'Abre el grupo para que todos los participantes puedan hablar.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup || !(await groupService.isAdmin(sock, ctx.jid, ctx.sender))) return;

        await sock.groupSettingUpdate(ctx.jid, "not_announcement");
        await sock.sendMessage(ctx.jid, { react: { text: "🔓", key: m.key } });
    }
}

module.exports = OpenCommand;
