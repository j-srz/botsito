const BaseCommand = require('../base.command');

class VtalvCommand extends BaseCommand {
    constructor() {
        super('.vtalv', [], 'Mandas a la v a alguien.');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedInfo || !quotedInfo.participant)
            return sock.sendMessage(ctx.jid, { text: "Responde a un mensaje." }, { quoted: m });

        const targetJid = quotedInfo.participant;
        const targetNumber = targetJid.split("@")[0].split(":")[0];

        await sock.sendMessage(ctx.jid, {
            text: `\`${ctx.pushName}\` _dice:_ @${targetNumber} vtalv ⊂(◉‿◉)つ`,
            mentions: [targetJid],
        }, { quoted: m });
    }
}

module.exports = VtalvCommand;
