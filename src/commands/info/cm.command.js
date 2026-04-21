const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class CmCommand extends BaseCommand {
    constructor() {
        super('.cm', [], 'Menú general de comandos REX.');
    }

    async execute(sock, m, ctx) {
        const menu = `*📜 REX BOT — Comandos Generales*

*🎮 INTERACCIÓN & DIVERSIÓN*
• \`.ping\` — Estado y latencia del bot
• \`.user\` — Tu info y rango en el grupo
• \`.todos\` — Menciona a todos los rexitos 🦖
• \`.kiss @user\` — Manda un beso
• \`.mylastkiss\` — Último beso recibido
• \`.vtalv @user\` — Saludo especial
• \`.shh\` — Alerta de silencio ⚠️
• \`.papoi\` — 👉👈 🍆
• \`.joto\` — 🏳️‍🌈
• \`.1500\` — Milquinientos 💋
• \`.smoke\` — 🚬
• \`.wassaa\` — Wassssaaa

*📊 INFORMACIÓN DEL GRUPO*
• \`.groupinfo\` / \`.ginfo\` — Datos del grupo
• \`.totalchat\` — Ranking de mensajes
• \`.listonline\` — Actividad reciente
• \`.fantasmas\` — Inactivos 7+ días
• \`.verpin\` — Mensaje fijado 📌
• \`.resumen\` — Ranking de subastas
• \`.runtime\` — Uptime del bot
• \`.id\` — ID del chat (consola)

*🎰 SUBASTAS & SORTEOS*
• \`.gg @user <monto>\` — Registra ganador
• \`.n\` — Reenvía/edita texto de multimedia

*🛡️ ADMINISTRACIÓN (Solo Admins)*
• \`.promote\` — Dar admin
• \`.demote\` — Quitar admin
• \`.kick\` — Expulsar usuario
• \`.del\` — Eliminar mensaje citado 🗑️
• \`.notify <msg>\` — Aviso a todos 📢
• \`.hidetag <msg>\` — Mención invisible
• \`.close [tiempo]\` — Cerrar grupo
• \`.open\` — Abrir grupo
• \`.link\` / \`.damelink\` — Link de invitación 🔗
• \`.restablecerlink\` — Revocar y generar nuevo link
• \`.disable / .enable <cmd>\` — Control de comandos
• \`.disabled\` — Ver comandos desactivados

> Ver más: *.cm-sc* (Social) · *.cm-admin* (Sistema)`;

        await sock.sendMessage(ctx.jid, { text: menu + getLegend(sock) }, { quoted: m });
    }
}

module.exports = CmCommand;
