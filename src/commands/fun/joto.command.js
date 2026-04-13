const BaseCommand = require('../base.command');

class JotoCommand extends BaseCommand {
    constructor() {
        super('.joto', [], 'Mide la geidad 🏳️‍🌈');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

        if (!quotedInfo || !quotedInfo.participant) {
            return await sock.sendMessage(ctx.jid, { text: `che \`${ctx.pushName}\` joto mejor responde a alguien.` }, { quoted: m });
        }

        const targetJid = quotedInfo.participant;
        const targetNumber = targetJid.split("@")[0].split(":")[0];
        const porcentaje = Math.floor(Math.random() * 100) + 1;

        await sock.sendMessage(ctx.jid, { text: `🏳️‍🌈 El usuario @${targetNumber} es un **${porcentaje}%** gei.`, mentions: [targetJid] }, { quoted: m });
    }
}

module.exports = JotoCommand;
