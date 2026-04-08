const { getLegend } = require('../utils/helpers');

module.exports = [
    {
        name: '.user',
        execute: async (msg) => {
            const contact = await msg.getContact();
            const chat = await msg.getChat();
            let info = `*Usuario:* ${contact.pushname || 'Sin nombre'}\n*Número:* ${contact.number}\n`;
            if (chat.isGroup) {
                const part = chat.participants.find(p => p.id._serialized === contact.id._serialized);
                let rol = part?.isAdmin ? 'Administrador' : (part?.isSuperAdmin ? 'Super Administrador' : 'Miembro');
                info += `*Rol:* ${rol}`;
            }
            await msg.reply(info);
        }
    },

    {
        name: '.cm',
        execute: async (msg) => {
            let commandsList = '*📜 LISTA DE COMANDOS ACTUALES*\n\n';

            commandsList += '*✨ INTERACCIÓN*\n';
            commandsList += '• `.n` - Reenvía/Edita texto de imagen o video.\n';
            commandsList += '• `.user` - Muestra tu info y rango.\n';
            commandsList += '• `.info` - Datos técnicos del chat.\n';
            commandsList += '• `.ping` - Verifica si el bot está activo.\n';
            commandsList += '• `.vtalv` - Envía un saludo.\n';
            commandsList += '• `.wassaa` - wassaa.\n';
            commandsList += '• `.kiss` - Dale un beso a alguien.\n';
            commandsList += '• `.tickle` - Hazle cosquillas a un usuario.\n';
            commandsList += '• `.smoke` - 🚬\n';
            commandsList += '• `.1500` - Milquinientos.\n\n';

            commandsList += '*🛠️ GRUPO & SUBASTAS*\n';
            commandsList += '• `.todos` - Menciona a todos los rexitos 🦖.\n';
            commandsList += '• `.gg` - Registra al ganador y el monto.\n\n';

            commandsList += '*🛡️ ADMINISTRACIÓN (Solo Admins)*\n';
            commandsList += '• `.resumen` - Ranking de ganadores de subastas.\n';
            commandsList += '• `.kick` - Expulsa a un usuario del grupo.\n';
            commandsList += '• `.promote` - Sube a alguien a Administrador.\n';
            commandsList += '• `.demote` - Quita el rango de Administrador.\n';
            commandsList += '• `.close [tiempo]` - Cierra el grupo (ej: .close 5m).\n';
            commandsList += '• `.open` - Abre el grupo para todos.\n';

            await msg.reply(commandsList);
        }
    },
    {
        name: '.id',
        execute: async (msg) => {
            const chat = await msg.getChat();
            // Esto te responde con el ID exacto que debes copiar a tu .env
            await msg.reply(`*🆔 ID DE ESTE CHAT:*\n\n\`${chat.id._serialized}\``);
        }
    },
];