const { getLegend } = require('../utils/helpers');

module.exports = [
    {
        name: '.user',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            const pushName = m.pushName || 'Sin nombre';
            const number = sender.split('@')[0];

            let info = `*Usuario:* ${pushName}\n*Número:* ${number}\n`;

            if (jid.endsWith('@g.us')) {
                const groupMetadata = await sock.groupMetadata(jid);
                const participant = groupMetadata.participants.find(p => p.id === sender);
                
                let rol = 'Miembro';
                if (participant.admin === 'admin') rol = 'Administrador';
                if (participant.admin === 'superadmin') rol = 'Super Administrador';
                
                info += `*Rol:* ${rol}`;
            }

            await sock.sendMessage(jid, { text: info }, { quoted: m });
        }
    },

    {
        name: '.cm',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
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
            commandsList += '• `.open` - Abre el grupo para todos.\n\n';
            
            commandsList += `*ID del Chat:* \`${jid}\``;

            await sock.sendMessage(jid, { text: commandsList + getLegend() }, { quoted: m });
        }
    },

    {
        name: '.id',
        execute: async (sock, m) => {
            const jid = m.key.remoteJid;
            await sock.sendMessage(jid, { 
                text: `*🆔 ID DE ESTE CHAT:*\n\n\`${jid}\`` 
            }, { quoted: m });
        }
    }
];