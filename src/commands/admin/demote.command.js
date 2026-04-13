const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');

class DemoteCommand extends BaseCommand {
    constructor() {
        super('.demote', [], 'Quita el rango de administrador a la persona citada.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup) return;
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

        if (quotedInfo && quotedInfo.quotedMessage && (await groupService.isAdmin(sock, ctx.jid, ctx.sender))) {
            const target = quotedInfo.participant;
            await sock.groupParticipantsUpdate(ctx.jid, [target], "demote");
            await sock.sendMessage(ctx.jid, { react: { text: "⬇️", key: m.key } });
        }
    }
}

module.exports = DemoteCommand;
