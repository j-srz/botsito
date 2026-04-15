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
        commandsList += "• `.wassaa` - Wassssaaa\n";
        commandsList += "• `.vtalv` - Mandas un saludo a alguien.\n";
        commandsList += "• `.kiss` - Manda un beso a alguien.\n";
        commandsList += "• `.mylastkiss` - Quien fue la ultima persona que te deso.\n\n";

        commandsList += "*🛠️ GRUPO & SUBASTAS*\n";
        commandsList += "• `.todos` - Menciona a todos los rexitos 🦖.\n";
        commandsList += "• `.gg` - Registra ganador de subasta.\n\n";

        commandsList += "*📡 INFO & UTILIDADES*\n";
        commandsList += "• `.link` - 🔗 Obtiene el link de invitación.\n";
        commandsList += "• `.damelink` - 🔗 Solo el link, sin texto.\n";
        commandsList += "• `.groupinfo` - ℹ️ Info del grupo (nombre, admins, etc).\n";
        commandsList += "• `.totalchat` - 📊 Ranking de mensajes del grupo.\n";
        commandsList += "• `.listonline` - 🟢 Usuarios con actividad reciente.\n";
        commandsList += "• `.verpin` - 📌 Muestra el mensaje fijado.\n";
        commandsList += "• `.runtime` - ⏱️ Uptime del bot.\n\n";

        commandsList += "*🛡️ ADMINS (Solo con Rango)*\n";
        commandsList += "• `.shh` - Alerta de NO SPAM ⚠️.\n";
        commandsList += "• `.promote` - Dar administrador.\n";
        commandsList += "• `.demote` - Quitar administrador.\n";
        commandsList += "• `.kick` - Elimina a un usuario del grupo.\n";
        commandsList += "• `.del` - 🗑️ Eliminar mensaje citado.\n";
        commandsList += "• `.notify <msg>` - 📢 Aviso mencionando a todos.\n";
        commandsList += "• `.hidetag <msg>` - 🕶️ Mención invisible a todos.\n";
        commandsList += "• `.fantasmas` - 👻 Detectar inactivos.\n";
        commandsList += "• `.restablecerlink` - 🔄 Revocar y generar nuevo link.\n";
        commandsList += "• `.close [tiempo]` - Cerrar el grupo (ej: .close 1m).\n";
        commandsList += "• `.open` - Abrir el grupo (Todos).\n";
        commandsList += "• `.resumen` - Ranking de subastas.";

        await sock.sendMessage(ctx.jid, { text: commandsList + getLegend(sock) }, { quoted: m });
    }
}

module.exports = CmCommand;
