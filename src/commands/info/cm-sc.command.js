const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class CmScCommand extends BaseCommand {
    constructor() {
        super('.cm-sc', [], 'Menú de comandos REX secretos.');
    }

    async execute(sock, m, ctx) {
        let commandsList = "*📜 MENÚ DE COMANDOS REX SECRETOS*\n\n";

        commandsList += "• `.n` - Reenvía/Edita texto de multimedia.\n";
        commandsList += "• `.id` - Obtener ID del chat para la consola.\n\n";

        commandsList += "*🛡️ SEGURIDAD (ANTILINK)*\n";
        commandsList += "• `.antilink on` - Activa escudo (2 Strikes = Ban).\n";
        commandsList += "• `.antilink off` - Desactiva el escudo.\n";
        commandsList += "• `.antilink logs` - Ver quién ha mandado links.\n\n";

        commandsList += "*🎟️ RULETA (RIFAS)*\n";
        commandsList += "• `.ruleta all/admin` - Sorteo rápido ✨\n";
        commandsList += "• `.ruleta add m` - 🎟️ Inscripción por reacciones.\n";
        commandsList += "• `.ruleta cs` - Sorteo de los inscritos.\n";
        commandsList += "• `.ruleta cs add/remove @user` - Gestiona la tómbola.\n";
        commandsList += "• `.ruleta cs show/reset` - Ver o vaciar la tómbola.\n\n";

        commandsList += "*🎲 RULETABAN*\n";
        commandsList += "• `.ruletaban all/admin [soyjoto]` - Ban al azar (Usa 'soyjoto' para salvarte) 🎲💥\n";
        commandsList += "• `.ruletaban cs` - Inicia sorteo de la lista negra.\n";
        commandsList += "• `.ruletaban cs add @user1 @user2...` - Agrega a la lista.\n";
        commandsList += "• `.ruletaban cs remove @user1...` - Perdona a alguien de la lista.\n";
        commandsList += "• `.ruletaban cs show` - Mira quiénes están en la mira.\n";
        commandsList += "• `.ruletaban cs reset` - Vacía la lista negra por completo.\n\n";
        commandsList += "*👑 PANEL DE OPERADORES (Mando a Distancia)*\n";
        commandsList += "• `.operators set @user` - Define al owner remoto (Solo Admins).\n";
        commandsList += "• `.operators add/remove @user` - Otorga/Quita permisos de operador.\n";
        commandsList += "• `.operators get/reset` - Ver/Limpiar lista de sub-operadores.\n";
        commandsList += "_Mando desde el PRIVADO:_\n";
        commandsList += "• `.remote <alias/tag/jid> <comando>` - Ejecución suplantada PRO.\n\n";

        commandsList += "*🗂️ DIRECTORIO DE GRUPOS*\n";
        commandsList += "• `.group list` - Lista de grupos indizados.\n";
        commandsList += "• `.group setalias <alias>` - Aplica apodo inteligente.\n";
        commandsList += "• `.group addtag <tag>` - Añade número o tag identificador.\n";
        commandsList += "• `.group name` - Refresca el nombre público capturado.\n\n";

        commandsList += "*🔧 MULTIMEDIA ( NO USAR )*\n";
        commandsList += "_Calidades: superlow (defecto), low, medium, high, superhigh_\n";
        commandsList += "• `.s [calidad]` - Crea sticker (Imagen/Video/GIF).\n";
        commandsList += "• `.img [calidad]` - Sticker a Imagen o Video (Animados).\n";
        commandsList += "• `.cancel` - 🚮 Vacía la cola y detiene el motor.\n\n";

        await sock.sendMessage(ctx.jid, { text: commandsList + getLegend(sock) }, { quoted: m });
    }
}

module.exports = CmScCommand;
