const BaseCommand = require('../base.command');

class KickCommand extends BaseCommand {
    constructor() {
        super('.kick', [], 'Elimina a un usuario del grupo mediante mención de su mensaje.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const quotedInfo = this.getQuotedInfo(m);
        if (quotedInfo && quotedInfo.quotedMessage) {
            const target = quotedInfo.participant;
            const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

            if (target === botId) {
                await sock.groupParticipantsUpdate(ctx.jid, [ctx.sender], "remove");
                return await sock.sendMessage(ctx.jid, { text: "Intentaste kickearme... ¡Adiós!" });
            }

            if (ctx.isAdmin) {
                await sock.groupParticipantsUpdate(ctx.jid, [target], "remove");
                await sock.sendMessage(ctx.jid, { react: { text: "👢", key: m.key } });
            }
        }
    }
}

module.exports = KickCommand;
