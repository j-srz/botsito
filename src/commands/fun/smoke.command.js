const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class SmokeCommand extends BaseCommand {
    constructor() {
        super('.smoke', [], '🚬');
    }

    async execute(sock, m, ctx) {
        await sock.sendMessage(ctx.jid, { react: { text: "🚬", key: m.key } });

        const senderJid = ctx.sender;
        const senderNumber = senderJid.split("@")[0].split(":")[0];
        const gifUrl = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExank0a3B5ODl2dTJlbm5rMGw1MzVvcWswbzVnY2twYmNneDF2NmZkaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpAPQVW9lWnWU/giphy.gif";

        try {
            await sock.sendMessage(ctx.jid, {
                video: { url: gifUrl },
                gifPlayback: true,
                caption: `💨 @${senderNumber} ` + getLegend(sock),
                mentions: [senderJid],
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(ctx.jid, {
                text: `💨 @${senderNumber} dándose un toque...`,
                mentions: [senderJid],
            });
        }
    }
}

module.exports = SmokeCommand;
