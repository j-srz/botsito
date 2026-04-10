const { getLegend } = require("../utils/helpers"); // Asegúrate de que la ruta apunte a tus utilidades

module.exports = [
  {
    name: ".user",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const pushName = m.pushName || "Sin nombre";
      const number = sender.split("@")[0];

      let info = `*👤 INFO DE USUARIO*\n\n`;
      info += `*Usuario:* ${pushName}\n`;
      info += `*Número:* ${number}\n`;

      if (jid.endsWith("@g.us")) {
        const groupMetadata = await sock.groupMetadata(jid);
        const participant = groupMetadata.participants.find(
          (p) => p.id === sender,
        );

        let rol = "Miembro";
        if (participant?.admin === "admin") rol = "Administrador";
        if (participant?.admin === "superadmin") rol = "Super Administrador";

        info += `*Rol:* ${rol}`;
      }

      await sock.sendMessage(jid, { text: info + getLegend(sock) }, { quoted: m });
    },
  },

  {
    name: ".cm",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      let commandsList = "*📜 MENÚ DE COMANDOS REX*\n\n";

      commandsList += "*✨ INTERACCIÓN*\n";
      commandsList += "• `.n` - Reenvía/Edita texto de multimedia.\n";
      commandsList += "• `.user` - Muestra tu info y rango.\n";
      commandsList += "• `.id` - Obtiene ID del chat (Consola).\n";
      commandsList += "• `.joto` - Test de jotez al azar 🏳️‍🌈.\n";
      commandsList += "• `.ping` - Estado del bot.\n";
      commandsList += "• `.smoke` - 🚬\n";
      commandsList += "• `.kiss` / `.tickle` - Interacción social.\n\n";

      commandsList += "*🔧 MULTIMEDIA (Cola de Procesos)*\n";
      commandsList += "_Calidades: superlow (defecto), low, medium, high, superhigh_\n";
      commandsList += "• `.s [calidad]` - Crea sticker (Imagen/Video/GIF).\n";
      commandsList += "• `.img [calidad]` - Sticker a Imagen o Video (Animados).\n";
      commandsList += "• `.cancel` - 🚮 Vacía la cola y detiene el motor.\n\n";

      commandsList += "*🛠️ GRUPO & SUBASTAS*\n";
      commandsList += "• `.todos` - Menciona a todos los rexitos 🦖.\n";
      commandsList += "• `.gg` - Registra ganador de subasta.\n\n";

      commandsList += "*🛡️ ADMINS (Solo con Rango)*\n";
      commandsList += "• `.shh` - Alerta de NO SPAM ⚠️.\n";
      commandsList += "• `.kick` / `.promote` / `.demote`.\n";
      commandsList += "• `.close` / `.open` - Control del grupo.\n";
      commandsList += "• `.resumen` - Ranking de subastas.\n";

      await sock.sendMessage(
        jid,
        { text: commandsList + getLegend(sock) },
        { quoted: m },
      );
    },
  },

  {
    name: ".id",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;

      // Log en consola para tu monitoreo en la Rasp
      console.log('====================================');
      console.log(`🆔 ID SOLICITADO: ${jid}`);
      console.log('====================================');

      await sock.sendMessage(jid, {
        react: {
          text: '💋',
          key: m.key
        }
      });
    },
  },
];