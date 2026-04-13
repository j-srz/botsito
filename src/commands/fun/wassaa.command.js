const BaseCommand = require('../base.command');

class WassaaCommand extends BaseCommand {
    constructor() {
        super('.wassaa', [], 'Wassssaaa');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedInfo || !quotedInfo.participant) return;

        const targetJid = quotedInfo.participant;
        const targetNumber = targetJid.split("@")[0].split(":")[0];
        const videoUrl = "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4";

        try {
            await sock.sendMessage(ctx.jid, {
                video: { url: videoUrl },
                gifPlayback: true,
                caption: `@${targetNumber} wassaaa!!!`,
                mentions: [targetJid],
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(ctx.jid, { text: "Error con el video." });
        }
    }
}

module.exports = WassaaCommand;
