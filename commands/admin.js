const path = require("path");
const fs = require("fs");
const { isAdmin, getLegend } = require("../utils/helpers");

const pinDataPath = path.join(__dirname, "../data/current_pin.json");

const customListPath = path.join(__dirname, "../data/ruleta_custom.json");

// Función para leer la lista custom
const readCustomList = () => {
  if (!fs.existsSync(customListPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(customListPath, "utf-8"));
  } catch (e) {
    return [];
  }
};

// Función para guardar la lista custom
const saveCustomList = (list) => {
  fs.writeFileSync(customListPath, JSON.stringify(list, null, 2));
};

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
          return await sock.sendMessage(jid, {
            text: "Intentaste kickearme... ¡Adiós!",
          });
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

      if (
        quotedInfo &&
        quotedInfo.quotedMessage &&
        (await isAdmin(sock, jid, sender))
      ) {
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

      if (
        quotedInfo &&
        quotedInfo.quotedMessage &&
        (await isAdmin(sock, jid, sender))
      ) {
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
        await sock.sendMessage(
          jid,
          {
            text: `*Cierre programado:* Este grupo se cerrará en ${timeStr}. 🛡️`,
          },
          { quoted: m },
        );

        setTimeout(async () => {
          await sock.groupSettingUpdate(jid, "announcement");
          await sock.sendMessage(jid, {
            text: `_Cierre Automático_ 🔒\n_Tiempo cumplido (${timeStr})_${getLegend(sock)}`,
          });
        }, timerMs);
      } else {
        await sock.sendMessage(
          jid,
          { text: "❌ Tiempo no válido. Usa ej: `.close 5m` o `.close 30s`" },
          { quoted: m },
        );
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

      await sock.sendMessage(jid, {
        text: `@${targetNumber} Callese alv o ban 🦖`,
        mentions: [targetJid],
      });
      await sock.sendMessage(jid, {
        react: {
          text: "⚠️",
          key: {
            remoteJid: jid,
            fromMe: false,
            id: quotedInfo.stanzaId,
            participant: targetJid,
          },
        },
      });
    },
  },
  {
    name: ".ruletaban",
    execute: async (sock, m, body) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const args = body.split(" ");
      const modo = args[1]?.toLowerCase(); // all, admin, custom
      const subModo = args[2]?.toLowerCase(); // add, show, restart (si modo es custom)
      const proteccion = args[2]?.toLowerCase(); // 'soyjoto' (si modo es all/admin)

      if (!jid.endsWith("@g.us") || !(await isAdmin(sock, jid, sender))) return;

      const cleanID = (id) => (id ? id.split("@")[0].split(":")[0] : "");
      const botPnBase = cleanID(sock.user.id);
      const botLidBase = cleanID(sock.user.lid || "");

      // --- MANEJO DE SUBCOMANDOS CUSTOM ---
      if (modo === "custom") {
        const customList = readCustomList();

        // 1. .ruletaban custom add @user
        if (subModo === "add") {
          const mentions =
            m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          if (mentions.length === 0)
            return await sock.sendMessage(jid, {
              text: "⚠️ Menciona a los pendejos que quieres agregar.",
            });

          let agregados = 0;
          mentions.forEach((id) => {
            if (!customList.includes(id)) {
              customList.push(id);
              agregados++;
            }
          });

          saveCustomList(customList);
          await sock.sendMessage(jid, { react: { text: "📝", key: m.key } });
          return await sock.sendMessage(jid, {
            text: `✅ Se agregaron *${agregados}* a la lista negra. Total: ${customList.length}`,
          });
        }

        // 2. .ruletaban custom show (o showlist)
        if (subModo === "show" || subModo === "showlist") {
          if (customList.length === 0)
            return await sock.sendMessage(jid, {
              text: "La lista está vacía.",
            });
          const listaTexto = customList
            .map((id, i) => `${i + 1}. @${id.split("@")[0]}`)
            .join("\n");
          return await sock.sendMessage(jid, {
            text: `💀 *LISTA NEGRA:*\n\n${listaTexto}`,
            mentions: customList,
          });
        }

        // 3. .ruletaban custom restart
        if (subModo === "restart") {
          saveCustomList([]);
          await sock.sendMessage(jid, { react: { text: "🚮", key: m.key } });
          return await sock.sendMessage(jid, {
            text: "🚮 *Lista vaciada correctamente.*",
          });
        }
      }

      // --- VALIDACIÓN DE INICIO DE RULETA ---
      if (!["all", "admin", "custom"].includes(modo)) {
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        const helpMsg = `┌── [ 🎲 RULETA REX ] ──┐
• \`.ruletaban all [soyjoto]\`
• \`.ruletaban admin [soyjoto]\`

*GESTIÓN CUSTOM:*
• \`.ruletaban custom\` (Inicia sorteo)
• \`.ruletaban custom add @user\`
• \`.ruletaban custom show\`
• \`.ruletaban custom restart\`
└────────────────────┘`;
        return await sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
      }

      try {
        const groupMetadata = await sock.groupMetadata(jid);
        const creatorBase = cleanID(groupMetadata.owner || "");
        let participantes = [];

        // Filtro base de inmunidad (Bot)
        const esInmune = (pId) => {
          const pIdBase = cleanID(pId);
          return (
            pIdBase === botPnBase || (botLidBase && pIdBase === botLidBase)
          );
        };

        if (modo === "custom") {
          const customList = readCustomList();
          // Solo entran los de la lista que sigan en el grupo y NO sean el bot
          participantes = groupMetadata.participants.filter(
            (p) => customList.includes(p.id) && !esInmune(p.id),
          );
        } else {
          const filtroGral = (p) => {
            const pIdBase = cleanID(p.id);
            const senderBase = cleanID(sender);
            if (esInmune(p.id)) return false;
            if (proteccion === "soyjoto" && pIdBase === senderBase)
              return false;
            return true;
          };

          if (modo === "all") {
            participantes = groupMetadata.participants.filter(filtroGral);
          } else if (modo === "admin") {
            participantes = groupMetadata.participants.filter(
              (p) =>
                filtroGral(p) &&
                (p.admin === "admin" || p.admin === "superadmin"),
            );
          }
        }

        if (participantes.length === 0)
          return await sock.sendMessage(jid, {
            text: `❌ No hay víctimas para el modo: ${modo}`,
          });

        // --- SORTEO 9 A 0 ---
        const mentions = participantes.map((p) => p.id);
        const listaMenciones = participantes
          .map((p) => `@${p.id.split("@")[0]}`)
          .join(" ");

        const drawMsg = await sock.sendMessage(
          jid,
          {
            text:
              `🎲 *Participantes en la mira (${modo.toUpperCase()}):*\n${listaMenciones}\n\n_Sorteando..._` +
              getLegend(sock),
            mentions: mentions,
          },
          { quoted: m },
        );

        for (const emoji of [
          "9️⃣",
          "8️⃣",
          "7️⃣",
          "6️⃣",
          "5️⃣",
          "4️⃣",
          "3️⃣",
          "2️⃣",
          "1️⃣",
          "0️⃣",
        ]) {
          await sock.sendMessage(jid, {
            react: { text: emoji, key: drawMsg.key },
          });
          await new Promise((res) => setTimeout(res, 1000));
        }

        // --- ÚLTIMAS PALABRAS ---
        const victima =
          participantes[Math.floor(Math.random() * participantes.length)].id;
        const victimaBase = cleanID(victima);

        const lastWordsMsg = await sock.sendMessage(
          jid,
          {
            text: `🎯 ¡TE TOCÓ @${victimaBase}! \n\nTienes *5 SEGUNDOS* para tus últimas palabras... ⏳`,
            mentions: [victima],
          },
          { quoted: drawMsg },
        );

        for (const emoji of ["5️⃣", "4️⃣", "3️⃣", "2️⃣", "1️⃣", "💥"]) {
          await sock.sendMessage(jid, {
            react: { text: emoji, key: lastWordsMsg.key },
          });
          await new Promise((res) => setTimeout(res, 1000));
        }

        // --- EJECUCIÓN ---
        if (victimaBase === creatorBase) {
          await sock.sendMessage(
            jid,
            {
              text: `💥 ¡BOOM! @${victimaBase} Salvado.`,
              mentions: [victima],
            },
            { quoted: lastWordsMsg },
          );
        } else {
          await sock.groupParticipantsUpdate(jid, [victima], "remove");
          await sock.sendMessage(
            jid,
            {
              text: `💥 ¡BOOM! @${victimaBase} bye bay alv.`,
              mentions: [victima],
            },
            { quoted: lastWordsMsg },
          );
        }
      } catch (e) {
        console.error("❌ ERROR EN RULETABAN:", e);
      }
    },
  },
];
