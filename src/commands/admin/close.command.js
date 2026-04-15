const BaseCommand = require('../base.command');

class CloseCommand extends BaseCommand {
    constructor() {
        super('.close', [], 'Cierra el grupo para que solo admins puedan hablar. (Ej: .close 1m)');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const timeStr = ctx.args[1];

        if (!timeStr) {
            await sock.groupSettingUpdate(ctx.jid, "announcement");
            return await sock.sendMessage(ctx.jid, { text: "🔒" });
        }

        let timerMs = 0;
        if (timeStr.endsWith("m")) timerMs = parseInt(timeStr) * 60000;
        else if (timeStr.endsWith("s")) timerMs = parseInt(timeStr) * 1000;

        if (timerMs >= 4000) {
            await sock.sendMessage(ctx.jid, { react: { text: "⏳", key: m.key } });
            const sentMsg = await sock.sendMessage(ctx.jid, {
                text: `> _Cierre programado: El grupo se cerrará en ${timeStr}_`,
            }, { quoted: m });

            setTimeout(() => sock.sendMessage(ctx.jid, { react: { text: "3️⃣", key: sentMsg.key } }), timerMs - 3000);
            setTimeout(() => sock.sendMessage(ctx.jid, { react: { text: "2️⃣", key: sentMsg.key } }), timerMs - 2000);
            setTimeout(() => sock.sendMessage(ctx.jid, { react: { text: "1️⃣", key: sentMsg.key } }), timerMs - 1000);

            setTimeout(async () => {
                await sock.groupSettingUpdate(ctx.jid, "announcement");
                await sock.sendMessage(ctx.jid, { react: { text: "🔒", key: sentMsg.key } });
            }, timerMs);
        } else if (timerMs > 0) {
            await sock.sendMessage(ctx.jid, { react: { text: "⏳", key: m.key } });
            setTimeout(async () => {
                await sock.groupSettingUpdate(ctx.jid, "announcement");
                await sock.sendMessage(ctx.jid, { react: { text: "🔒", key: m.key } });
            }, timerMs);
        } else {
            await sock.sendMessage(ctx.jid, { react: { text: "❌", key: m.key } });
        }
    }
}

module.exports = CloseCommand;
