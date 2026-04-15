const BaseCommand = require('../base.command');

class PromoteCommand extends BaseCommand {
    constructor() {
        super('.promote', [], 'Otorga rango de administrador a la persona citada.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const quotedInfo = this.getQuotedInfo(m);
        if (quotedInfo && quotedInfo.quotedMessage) {
            const target = quotedInfo.participant;
            await sock.groupParticipantsUpdate(ctx.jid, [target], "promote");
            await sock.sendMessage(ctx.jid, { react: { text: "🆙", key: m.key } });
        }
    }
}

module.exports = PromoteCommand;
