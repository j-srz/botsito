const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class CmCommand extends BaseCommand {
    constructor() {
        super('.cm', [], 'Menú principal de comandos REX.');
    }

    async execute(sock, m, ctx) {
        let commandsList = "*📜 MENÚ DE COMANDOS REX*\n\n";

        commandsList += "*✨ INTERACCIÓN*\n";
        commandsList += "• `.n` - Reenvía/Edita texto de multimedia.\n";
        commandsList += "• `.user` - Muestra tu info y rango.\n";
        commandsList += "• `.id` - Obtiene ID del chat (Consola).\n";

        commandsList += "• `.papoi` - papoii 👉👈 🍆\n";
        commandsList += "• `.joto` - Test 🏳️‍🌈.\n";
        commandsList += "• `.1500` - Milquinientos 💋\n";
        commandsList += "• `.ping` - Estado del bot.\n";
        commandsList += "• `.smoke` - 🚬\n";
        commandsList += "• `.kiss` / `.tickle` - Interacción social.\n\n";

        commandsList += "*🛠️ GRUPO & SUBASTAS*\n";
        commandsList += "• `.todos` - Menciona a todos los rexitos 🦖.\n";
        commandsList += "• `.gg` - Registra ganador de subasta.\n\n";

        commandsList += "*🛡️ ADMINS (Solo con Rango)*\n";
        commandsList += "• `.shh` - Alerta de NO SPAM ⚠️.\n";
        commandsList += "• `.promote` - Dar administrador.\n";
        commandsList += "• `.demote` - Quitar administrador.\n";
        commandsList += "• `.close [tiempo]` - Cerrar el grupo (Solo admins) (ej: .close 1m).\n";
        commandsList += "• `.open` - Abrir el grupo (Todos).\n";
        commandsList += "• `.resumen` - Ranking de subastas.";

        await sock.sendMessage(ctx.jid, { text: commandsList + getLegend(sock) }, { quoted: m });
    }
}

module.exports = CmCommand;
