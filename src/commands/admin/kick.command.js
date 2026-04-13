const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');

class KickCommand extends BaseCommand {
    constructor() {
        super('.kick', [], 'Elimina a un usuario del grupo mediante mención de su mensaje.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup) return;

        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (quotedInfo && quotedInfo.quotedMessage) {
            const target = quotedInfo.participant;
            const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

            if (target === botId) {
                await sock.groupParticipantsUpdate(ctx.jid, [ctx.sender], "remove");
                return await sock.sendMessage(ctx.jid, { text: "Intentaste kickearme... ¡Adiós!" });
            }

            if (await groupService.isAdmin(sock, ctx.jid, ctx.sender)) {
                await sock.groupParticipantsUpdate(ctx.jid, [target], "remove");
                await sock.sendMessage(ctx.jid, { react: { text: "👢", key: m.key } });
            }
        }
    }
}

module.exports = KickCommand;
