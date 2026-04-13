const BaseCommand = require('../base.command');

class ShhCommand extends BaseCommand {
    constructor() {
        super('.shh', [], 'Manda a callar a la persona citada.');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedInfo || !quotedInfo.participant) return;

        const targetJid = quotedInfo.participant;
        const targetNumber = targetJid.split("@")[0].split(":")[0];

        await sock.sendMessage(ctx.jid, {
            text: `@${targetNumber} Callese alv o ban 🦖`,
            mentions: [targetJid],
        });
        await sock.sendMessage(ctx.jid, {
            react: {
                text: "⚠️",
                key: {
                    remoteJid: ctx.jid,
                    fromMe: false,
                    id: quotedInfo.stanzaId,
                    participant: targetJid,
                },
            },
        });
    }
}

module.exports = ShhCommand;
