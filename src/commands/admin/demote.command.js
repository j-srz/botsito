const BaseCommand = require('../base.command');

class DemoteCommand extends BaseCommand {
    constructor() {
        super('.demote', [], 'Quita rango de administrador a la persona citada.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const quotedInfo = this.getQuotedInfo(m);
        if (quotedInfo && quotedInfo.quotedMessage) {
            const target = quotedInfo.participant;
            await sock.groupParticipantsUpdate(ctx.jid, [target], "demote");
            await sock.sendMessage(ctx.jid, { react: { text: "⬇️", key: m.key } });
        }
    }
}

module.exports = DemoteCommand;
