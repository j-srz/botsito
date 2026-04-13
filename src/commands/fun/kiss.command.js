const BaseCommand = require('../base.command');
const path = require('path');
const fs = require('fs');

class KissCommand extends BaseCommand {
    constructor() {
        super('.kiss', [], 'Besa a alguien.');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedInfo || !quotedInfo.participant) {
            return await sock.sendMessage(ctx.jid, { text: "Pendejo, responde a alguien." }, { quoted: m });
        }

        const targetJid = quotedInfo.participant;
        const targetNumber = targetJid.split("@")[0].split(":")[0];
        const videoPath = path.join(__dirname, "../../../../media/kiss.mp4");

        try {
            await sock.sendMessage(ctx.jid, {
                video: fs.readFileSync(videoPath),
                gifPlayback: true,
                caption: `\`${ctx.pushName}\` _besó a_ @${targetNumber} 💋`,
                mentions: [targetJid],
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(ctx.jid, {
                text: `\`${ctx.pushName}\` _besó a_ @${targetNumber} 💋`,
                mentions: [targetJid],
            }, { quoted: m });
        }
    }
}

module.exports = KissCommand;
