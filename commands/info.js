const { getLegend } = require("../utils/helpers");


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

      await sock.sendMessage(
        jid,
        { text: info + getLegend(sock) },
        { quoted: m },
      );
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

      commandsList += "• `.papoi` - papoii 👉👈 🍆\n";
      commandsList += "• `.joto` - Test 🏳️‍🌈.\n";
      commandsList += "• `.1500` - Milquinientos 💋\n";
      commandsList += "• `.ping` - Estado del bot.\n";
      commandsList += "• `.smoke` - 🚬\n";
      commandsList += "• `.kiss` / `.tickle` - Interacción social.\n\n";

      commandsList += "*🔧 MULTIMEDIA (Cola de Procesos)*\n";
      commandsList +=
        "_Calidades: superlow (defecto), low, medium, high, superhigh_\n";
      commandsList += "_Calidades: superlow, low, medium, high, superhigh_\n";
      commandsList += "• `.s [calidad]` - Crea sticker (Imagen/Video/GIF).\n";
      commandsList +=
        "• `.img [calidad]` - Sticker a Imagen o Video (Animados).\n";
      commandsList += "• `.cancel` - 🚮 Vacía la cola y detiene el motor.\n\n";

      commandsList += "*🛠️ GRUPO & SUBASTAS*\n";
      commandsList += "• `.todos` - Menciona a todos los rexitos 🦖.\n";
      commandsList += "• `.gg` - Registra ganador de subasta.\n\n";

      commandsList += "*🛡️ ADMINS (Solo con Rango)*\n";
      commandsList += "• `.shh` - Alerta de NO SPAM ⚠️.\n";
      commandsList += "• `.promote` - Dar administrador.\n";
      commandsList += "• `.demote` - Quitar administrador.\n";
      commandsList +=
        "• `.close [tiempo]` - Cerrar el grupo (Solo admins) (ej: .close 1m).\n";
      commandsList += "• `.open` - Abrir el grupo (Todos).\n";
      commandsList += "• `.resumen` - Ranking de subastas.";


      await sock.sendMessage(
        jid,
        { text: commandsList + getLegend(sock) },
        { quoted: m },
      );
    },
  },

  {
    name: ".cm-sc",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      let commandsList = "*📜 MENÚ DE COMANDOS REX SECRETOS*\n\n";

      commandsList += "• `.n` - Reenvía/Edita texto de multimedia.\n";
      
      commandsList += "• `.ruletaban [all/admin]` - Ban al azar con sorteo y reacciones. 🎲💥\n";
      commandsList += "• `.id` - Obtener ID del chat para la consola.\n";


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
      console.log("====================================");
      console.log(`🆔 ID SOLICITADO: ${jid}`);
      console.log("====================================");

      await sock.sendMessage(jid, {
        react: {
          text: "💋",
          key: m.key,
        },
      });
    },
  },
];
