const BaseCommand = require('../base.command');
const path = require('path');
const fs = require('fs');
const { getLegend } = require('../../utils/formatter');

class MilquinientosCommand extends BaseCommand {
    constructor() {
        super('.1500', [], 'Milquinientos 💋');
    }

    async execute(sock, m, ctx) {
        const videoPath = path.resolve(__dirname, "../../../media/milquinientos.mp4");
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        
        if (!quotedInfo || !quotedInfo.participant)
            return sock.sendMessage(ctx.jid, { text: "Responde a un mensaje." }, { quoted: m });

        if (!fs.existsSync(videoPath)) {
            return await sock.sendMessage(ctx.jid, { text: "❌ No encontré milquinientos.mp4 en la carpeta media." });
        }

        await sock.sendMessage(ctx.jid, {
            video: fs.readFileSync(videoPath),
            gifPlayback: true,
            caption: `\`${ctx.pushName}\` _dice:_ *Milquinientos*` + getLegend(sock),
        }, { quoted: m });

        await sock.sendMessage(ctx.jid, { react: { text: "💋", key: m.key } });
    }
}

module.exports = MilquinientosCommand;
