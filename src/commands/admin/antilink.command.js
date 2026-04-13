const BaseCommand = require('../base.command');
const antilinkService = require('../../services/antilink.service');
const groupService = require('../../services/group.service');
const { getLegend } = require('../../utils/formatter');

class AntilinkCommand extends BaseCommand {
    constructor() {
        super('.antilink', [], 'Gestiona el estado y logs del antilink.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup || !(await groupService.isAdmin(sock, ctx.jid, ctx.sender))) return;

        const action = ctx.args[1];

        if (action === "logs") {
            const logs = await antilinkService.getLogs(ctx.jid, 10);
            
            if (logs.length === 0) return await sock.sendMessage(ctx.jid, { text: "Sin actividad sospechosa en este grupo." });

            let res = `*📋 REGISTRO DE ANTILINK*\n\n`;
            logs.forEach((l, i) => {
                const senderName = l.senderName || l.name || 'Usuario desconocido';
                res += `${i+1}. 👤 *${senderName}*\n📅 ${l.date}\n🚫 Acción: ${l.action}\n\n`;
            });
            return await sock.sendMessage(ctx.jid, { text: res + getLegend(sock) });
        }

        if (action === "on" || action === "off") {
            await antilinkService.setAntilinkState(ctx.jid, action === "on");
            await sock.sendMessage(ctx.jid, { react: { text: action === "on" ? "🛡️" : "🔓", key: m.key } });
            return await sock.sendMessage(ctx.jid, { text: `✅ Antilink ${action === "on" ? "activado (2 strikes = Ban)" : "desactivado"}.` });
        }

        await sock.sendMessage(ctx.jid, { text: "⚠️ Uso: `.antilink on/off` o `.antilink logs`" });
    }
}

module.exports = AntilinkCommand;
