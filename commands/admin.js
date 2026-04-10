const path = require("path");
const fs = require("fs");
const { isAdmin, getLegend } = require("../utils/helpers");

const pinDataPath = path.join(__dirname, "../data/current_pin.json");

module.exports = [
  {
    name: ".kick",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      if (!jid.endsWith("@g.us")) return;

      const sender = m.key.participant || m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

      if (quotedInfo && quotedInfo.quotedMessage) {
        const target = quotedInfo.participant;
        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        if (target === botId) {
          await sock.groupParticipantsUpdate(jid, [sender], "remove");
          return await sock.sendMessage(jid, { text: "Intentaste kickearme... ¡Adiós!" });
        }

        if (await isAdmin(sock, jid, sender)) {
          await sock.groupParticipantsUpdate(jid, [target], "remove");
          await sock.sendMessage(jid, { react: { text: "👢", key: m.key } });
        }
      }
    },
  },
  {
    name: ".promote",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

      if (quotedInfo && quotedInfo.quotedMessage && (await isAdmin(sock, jid, sender))) {
        const target = quotedInfo.participant;
        await sock.groupParticipantsUpdate(jid, [target], "promote");
        await sock.sendMessage(jid, { react: { text: "🆙", key: m.key } });
      }
    },
  },
  {
    name: ".demote",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

      if (quotedInfo && quotedInfo.quotedMessage && (await isAdmin(sock, jid, sender))) {
        const target = quotedInfo.participant;
        await sock.groupParticipantsUpdate(jid, [target], "demote");
        await sock.sendMessage(jid, { react: { text: "⬇️", key: m.key } });
      }
    },
  },
  {
    name: ".close",
    execute: async (sock, m, body) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      if (!(await isAdmin(sock, jid, sender))) return;

      const args = body.split(" ");
      const timeStr = args[1];

      if (!timeStr) {
        await sock.groupSettingUpdate(jid, "announcement");
        await sock.sendMessage(jid, { react: { text: "🔒", key: m.key } });
        const text = `_Grupo Cerrado_ 🔒\n_por_ @${sender.split("@")[0]}${getLegend(sock)}`;
        return await sock.sendMessage(jid, { text, mentions: [sender] });
      }

      let timerMs = 0;
      if (timeStr.endsWith("m")) timerMs = parseInt(timeStr) * 60000;
      else if (timeStr.endsWith("s")) timerMs = parseInt(timeStr) * 1000;

      if (timerMs > 0) {
        await sock.sendMessage(jid, { react: { text: "⏳", key: m.key } });
        await sock.sendMessage(jid, { text: `*Cierre programado:* Este grupo se cerrará en ${timeStr}. 🛡️` }, { quoted: m });

        setTimeout(async () => {
          await sock.groupSettingUpdate(jid, "announcement");
          await sock.sendMessage(jid, { text: `_Cierre Automático_ 🔒\n_Tiempo cumplido (${timeStr})_${getLegend(sock)}` });
        }, timerMs);
      } else {
        await sock.sendMessage(jid, { text: "❌ Tiempo no válido. Usa ej: `.close 5m` o `.close 30s`" }, { quoted: m });
      }
    },
  },
  {
    name: ".open",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      if (!(await isAdmin(sock, jid, sender))) return;

      await sock.groupSettingUpdate(jid, "not_announcement");
      await sock.sendMessage(jid, { react: { text: "🔓", key: m.key } });
      const text = `_Grupo Abierto_ 🔓\n_por_ @${sender.split("@")[0]}${getLegend(sock)}`;
      await sock.sendMessage(jid, { text, mentions: [sender] });
    },
  },
  {
    name: ".shh",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
      if (!quotedInfo || !quotedInfo.participant) return;

      const targetJid = quotedInfo.participant;
      const targetNumber = targetJid.split("@")[0].split(":")[0];

      await sock.sendMessage(jid, { text: `@${targetNumber} Callese alv o ban 🦖`, mentions: [targetJid] });
      await sock.sendMessage(jid, { react: { text: "⚠️", key: { remoteJid: jid, fromMe: false, id: quotedInfo.stanzaId, participant: targetJid } } });
    },
  },
{
    name: ".ruletaban",
    execute: async (sock, m, body) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      
      console.log("==== INICIO RULETABAN ====");
      const args = body.split(" ");
      const modo = args[1]?.toLowerCase();

      if (modo !== 'admin' && modo !== 'all') {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return await sock.sendMessage(jid, { 
          text: "⚠️ *Si los pendejos brillaran tú serías el sol.*\n\nUsa: `.ruletaban all` o `.ruletaban admin`" 
        }, { quoted: m });
      }

      if (!jid.endsWith("@g.us") || !(await isAdmin(sock, jid, sender))) return;

      try {
        const groupMetadata = await sock.groupMetadata(jid);
        
        // --- IDENTIDADES DEL BOT PARA INMUNIDAD ---
        const botPn = sock.user.id.split('@')[0].split(':')[0];
        const botLid = sock.user.lid ? sock.user.lid.split('@')[0] : null;
        const creator = groupMetadata.owner || "";

        console.log("Debug IDs - Bot PN:", botPn, "Bot LID:", botLid, "Creator:", creator);

        // FILTRO: El bot se saca a sí mismo al 100%
        const filtroParticipantes = (p) => {
            const pId = p.id.split('@')[0];
            const esElBot = pId.includes(botPn) || (botLid && pId.includes(botLid));
            return !esElBot;
        };

        let participantes = [];
        if (modo === 'all') {
          participantes = groupMetadata.participants.filter(filtroParticipantes);
        } else {
          participantes = groupMetadata.participants.filter(p => 
            filtroParticipantes(p) && (p.admin === 'admin' || p.admin === 'superadmin')
          );
        }

        if (participantes.length === 0) return await sock.sendMessage(jid, { text: "❌ No hay víctimas válidas." });

        // Menciones técnicas y visuales
        const mentions = participantes.map(p => p.id);
        const listaMenciones = participantes.map(p => `@${p.id.split('@')[0]}`).join(' ');

        const drawMsg = await sock.sendMessage(jid, {
          text: `🎲 *Participantes en la mira:*\n${listaMenciones}\n\n_Sorteando en 10 segundos..._` + getLegend(sock),
          mentions: mentions
        }, { quoted: m });

        // Cuenta regresiva con reacciones
        const emojis = ['9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣', '0️⃣'];
        for (const emoji of emojis) {
          await sock.sendMessage(jid, { react: { text: emoji, key: drawMsg.key } });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // SELECCIÓN FINAL
        const victima = participantes[Math.floor(Math.random() * participantes.length)].id;
        const victimaNum = victima.split('@')[0];
        
        console.log("Víctima elegida:", victima);

        // Lógica de Ban vs Inmunidad de Creador
        if (victima === creator) {
            await sock.sendMessage(jid, {
                text: `💥 ¡BOOM! La bala le dio a @${victimaNum}... pero es el *Creador del Grupo*. El Rex no banea a su Dios. 👑✨`,
                mentions: [victima]
            }, { quoted: drawMsg });
        } else {
            // Descomenta la línea de abajo cuando termines las pruebas
            // await sock.groupParticipantsUpdate(jid, [victima], "remove");

            await sock.sendMessage(jid, {
                text: `💥 ¡BOOM! @${victimaNum} la suerte te abandonó.\n(No te eliminé por estar en modo prueba, pero ya estarías fuera). 👢`,
                mentions: [victima]
            }, { quoted: drawMsg });
        }

        console.log("==== FIN RULETABAN (ÉXITO) ====");

      } catch (e) {
        console.error("❌ ERROR EN RULETABAN:", e);
      }
    },
  },
];