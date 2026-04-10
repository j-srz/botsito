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
    name: ".pin",
    execute: async (sock, m, body) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      if (!jid.endsWith("@g.us") || !(await isAdmin(sock, jid, sender))) return;

      const quoted = m.message?.extendedTextMessage?.contextInfo;
      if (!quoted || !quoted.stanzaId) {
        return await sock.sendMessage(jid, { text: "❌ Responde al mensaje que quieres fijar." });
      }

      const args = body.split(" ");
      let durationIndex = 1; // 1: 24h, 2: 7d, 3: 30d
      if (args[1] === "7d") durationIndex = 2;
      if (args[1] === "30d") durationIndex = 3;

      const pinKey = {
        remoteJid: jid,
        fromMe: quoted.participant === (sock.user.id.split(":")[0] + "@s.whatsapp.net"),
        id: quoted.stanzaId,
        participant: quoted.participant,
      };

      try {
        // USANDO RELAYMESSAGE (TIPO 14 ES PIN)
        await sock.relayMessage(jid, {
          protocolMessage: {
            key: pinKey,
            type: 14,
            pinMessage: { duration: durationIndex }
          }
        }, {});

        if (!fs.existsSync(path.join(__dirname, "../data"))) fs.mkdirSync(path.join(__dirname, "../data"));
        fs.writeFileSync(pinDataPath, JSON.stringify(pinKey));

        await sock.sendMessage(jid, { react: { text: "📌", key: m.key } });
      } catch (err) {
        console.error("Error al fijar:", err);
        await sock.sendMessage(jid, { text: "❌ Error de protocolo. ¿Soy admin?" });
      }
    },
  },
  {
    name: ".unpin",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      if (!(await isAdmin(sock, jid, sender))) return;

      if (!fs.existsSync(pinDataPath)) {
        return await sock.sendMessage(jid, { text: "❌ No tengo registro de mensajes fijados." });
      }

      try {
        const lastPinKey = JSON.parse(fs.readFileSync(pinDataPath, "utf-8"));
        await sock.relayMessage(jid, {
          protocolMessage: {
            key: lastPinKey,
            type: 14,
            pinMessage: { duration: 0 } // 0 suele ser para quitar
          }
        }, {});

        fs.unlinkSync(pinDataPath);
        await sock.sendMessage(jid, { react: { text: "🔓", key: m.key } });
      } catch (err) {
        await sock.sendMessage(jid, { text: "❌ No pude quitar el fijado." });
      }
    },
  },
];