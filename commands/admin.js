const path = require("path");
const fs = require("fs");
const { isAdmin, getLegend } = require("../utils/helpers");

const pinDataPath = path.join(__dirname, "../data/current_pin.json");

const customListPath = path.join(__dirname, "../data/ruleta_custom.json");
const friendlyListPath = path.join(__dirname, "../data/ruleta_friendly.json");

// Función para leer la lista custom
const readCustomList = () => {
  if (!fs.existsSync(customListPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(customListPath, "utf-8"));
  } catch (e) {
    return [];
  }
};



const readFriendlyList = () => {
    if (!fs.existsSync(friendlyListPath)) return { messageId: null, participants: [] };
    try {
        return JSON.parse(fs.readFileSync(friendlyListPath, 'utf-8'));
    } catch (e) { return { messageId: null, participants: [] }; }
};

const saveFriendlyList = (data) => {
    fs.writeFileSync(friendlyListPath, JSON.stringify(data, null, 2));
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
      const modo = args[1]?.toLowerCase(); // all, admin, cs
      const subModo = args[2]?.toLowerCase(); // add, remove, show, reset
      const proteccion = args[2]?.toLowerCase(); // 'soyjoto'

      if (!jid.endsWith("@g.us") || !(await isAdmin(sock, jid, sender))) return;

      const cleanID = (id) => (id ? id.split("@")[0].split(":")[0] : "");
      const botPnBase = cleanID(sock.user.id);
      const botLidBase = cleanID(sock.user.lid || "");

      // --- MANEJO DE SUBCOMANDOS CS (LISTA PERSONALIZADA) ---
      if (modo === "cs") {
        let currentList = readCustomList();
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // 1. .ruletaban cs add @user1 @user2...
        if (subModo === "add") {
          if (mentions.length === 0) return await sock.sendMessage(jid, { text: "⚠️ Menciona a los pendejos para el registro." });
          let agregados = 0;
          mentions.forEach((id) => {
            if (!currentList.includes(id)) {
              currentList.push(id);
              agregados++;
            }
          });
          saveCustomList(currentList);
          await sock.sendMessage(jid, { react: { text: "📝", key: m.key } });
          return await sock.sendMessage(jid, { text: `✅ *${agregados}* agregados. Total en lista: ${currentList.length}` });
        }

        // 2. .ruletaban cs remove @user1 @user2...
        if (subModo === "remove") {
          if (mentions.length === 0) return await sock.sendMessage(jid, { text: "⚠️ Menciona a quiénes quieres perdonar." });
          const inicial = currentList.length;
          currentList = currentList.filter(id => !mentions.includes(id));
          const borrados = inicial - currentList.length;
          saveCustomList(currentList);
          await sock.sendMessage(jid, { react: { text: "🚮", key: m.key } });
          return await sock.sendMessage(jid, { text: `🗑️ Se eliminaron *${borrados}* de la lista negra.` });
        }

        // 3. .ruletaban cs show
        if (subModo === "show" || subModo === "showlist") {
          if (currentList.length === 0) return await sock.sendMessage(jid, { text: "La lista está limpia... por ahora. 🦖" });
          const listaTexto = currentList.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
          return await sock.sendMessage(jid, { text: `💀 *LISTA NEGRA (cs):*\n\n${listaTexto}`, mentions: currentList });
        }

        // 4. .ruletaban cs reset
        if (subModo === "reset") {
          saveCustomList([]);
          await sock.sendMessage(jid, { react: { text: "🧹", key: m.key } });
          return await sock.sendMessage(jid, { text: "🧹 *Lista reseteada. Todos son inocentes de nuevo.*" });
        }
      }

      // --- VALIDACIÓN DE INICIO ---
      if (!["all", "admin", "cs"].includes(modo)) {
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        const helpMsg = `┌── [ 🎲 RULETA REX ] ──┐
• \`.ruletaban all [soyjoto]\`
• \`.ruletaban admin [soyjoto]\`

*MODO CS (CUSTOM):*
• \`.ruletaban cs\` (Sorteo)
• \`.ruletaban cs add @user1 @user2...\`
• \`.ruletaban cs remove @user1...\`
• \`.ruletaban cs show\`
• \`.ruletaban cs reset\`
└────────────────────┘`;
        return await sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
      }

      try {
        const groupMetadata = await sock.groupMetadata(jid);
        const creatorBase = cleanID(groupMetadata.owner || "");
        let participantes = [];

        const esInmune = (pId) => {
          const pIdBase = cleanID(pId);
          return pIdBase === botPnBase || (botLidBase && pIdBase === botLidBase);
        };

        if (modo === "cs") {
          const customList = readCustomList();
          participantes = groupMetadata.participants.filter(p => customList.includes(p.id) && !esInmune(p.id));
        } else {
          const filtroGral = (p) => {
            const pIdBase = cleanID(p.id);
            const senderBase = cleanID(sender);
            if (esInmune(p.id)) return false;
            if (proteccion === "soyjoto" && pIdBase === senderBase) return false;
            return true;
          };

          if (modo === "all") {
            participantes = groupMetadata.participants.filter(filtroGral);
          } else if (modo === "admin") {
            participantes = groupMetadata.participants.filter(p => 
                filtroGral(p) && (p.admin === "admin" || p.admin === "superadmin")
            );
          }
        }

        if (participantes.length === 0) return await sock.sendMessage(jid, { text: `❌ No hay nadie en la mira (${modo}).` });

        // --- SORTEO 9 A 0 ---
        const mentions = participantes.map(p => p.id);
        const listaMenciones = participantes.map(p => `@${p.id.split("@")[0]}`).join(" ");
        const drawMsg = await sock.sendMessage(jid, {
            text: `🎲 *Participantes en la mira (${modo.toUpperCase()}):*\n${listaMenciones}\n\n_Sorteando..._` + getLegend(sock),
            mentions: mentions,
          }, { quoted: m });

        for (const emoji of ["9️⃣","8️⃣","7️⃣","6️⃣","5️⃣","4️⃣","3️⃣","2️⃣","1️⃣","0️⃣"]) {
          await sock.sendMessage(jid, { react: { text: emoji, key: drawMsg.key } });
          await new Promise(res => setTimeout(res, 1000));
        }

        // --- ÚLTIMAS PALABRAS ---
        const victima = participantes[Math.floor(Math.random() * participantes.length)].id;
        const victimaBase = cleanID(victima);

        const lastWordsMsg = await sock.sendMessage(jid, {
            text: `🎯 ¡TE TOCÓ @${victimaBase}! \n\nTienes *5 SEGUNDOS* para tus últimas palabras... ⏳`,
            mentions: [victima],
          }, { quoted: drawMsg });

        for (const emoji of ["5️⃣", "4️⃣", "3️⃣", "2️⃣", "1️⃣", "💥"]) {
          await sock.sendMessage(jid, { react: { text: emoji, key: lastWordsMsg.key } });
          await new Promise(res => setTimeout(res, 1000));
        }

        // --- EJECUCIÓN ---
        if (victimaBase === creatorBase) {
          await sock.sendMessage(jid, { text: `💥 ¡BOOM! @${victimaBase} Ups... se salvó el jefe.`, mentions: [victima] }, { quoted: lastWordsMsg });
        } else {
          await sock.groupParticipantsUpdate(jid, [victima], "remove");
          await sock.sendMessage(jid, { text: `💥 ¡BOOM! @${victimaBase} bye bay alv. 👢`, mentions: [victima] }, { quoted: lastWordsMsg });
        }
      } catch (e) {
        console.error("❌ ERROR EN RULETABAN:", e);
      }
    },
  },
  {
    name: ".ruleta",
    execute: async (sock, m, body) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const args = body.split(" ");
      const modo = args[1]?.toLowerCase(); 
      const subModo = args[2]?.toLowerCase(); 

      if (!jid.endsWith("@g.us")) return;

      const cleanID = (id) => (id ? id.split("@")[0].split(":")[0] : "");
      const botPnBase = cleanID(sock.user.id);
      const botLidBase = cleanID(sock.user.lid || "");

      // --- MODO: ADD M (REACCIONES) ---
      if (modo === "add" && subModo === "m") {
          const sentMsg = await sock.sendMessage(jid, { 
              text: "🦖 *¡RIFA REX ACTIVA!* 🦖\n\nReaccionen a este mensaje con cualquier emoji para participar." 
          });
          
          // Guardamos el ID de este mensaje para saber a cuál deben reaccionar
          saveFriendlyList({ messageId: sentMsg.key.id, participants: [] });
          await sock.sendMessage(jid, { react: { text: "🎟️", key: m.key } });
          return;
      }

      // --- MODO CS (GESTIÓN MANUAL) ---
      if (modo === "cs") {
        let data = readFriendlyList();
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (subModo === "add") {
          if (mentions.length === 0) return await sock.sendMessage(jid, { text: "⚠️ Etiqueta a los que entran a la rifa." });
          mentions.forEach(id => { if (!data.participants.includes(id)) data.participants.push(id); });
          saveFriendlyList(data);
          return await sock.sendMessage(jid, { text: `✅ Agregados. Total en tómbola: ${data.participants.length}` });
        }

        if (subModo === "remove") {
          data.participants = data.participants.filter(id => !mentions.includes(id));
          saveFriendlyList(data);
          return await sock.sendMessage(jid, { text: "🗑️ Lista actualizada." });
        }

        if (subModo === "show") {
          if (data.participants.length === 0) return await sock.sendMessage(jid, { text: "La tómbola está vacía. 🎟️" });
          const lista = data.participants.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
          return await sock.sendMessage(jid, { text: `🎟️ *PARTICIPANTES ACTUALES:*\n\n${lista}`, mentions: data.participants });
        }

        if (subModo === "reset") {
          saveFriendlyList({ messageId: null, participants: [] });
          return await sock.sendMessage(jid, { text: "🧹 *Tómbola reseteada.*" });
        }
      }

      // --- INICIO DE SORTEO AMIGABLE ---
      if (!["all", "admin", "cs"].includes(modo)) {
        const helpMsg = `┌── [ 🎲 RULETA ] ──┐
• \`.ruleta all\` (Todos)
• \`.ruleta admin\` (Admins)

*MODO CS (PERSONALIZADO):*
• \`.ruleta add m\` (Inscribirse con reacción)
• \`.ruleta cs\` (Sorteo de inscritos)
• \`.ruleta cs add @user\`
• \`.ruleta cs show\`
• \`.ruleta cs reset\`
└──────────────────────┘`;
        return await sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
      }

      try {
        const groupMetadata = await sock.groupMetadata(jid);
        let participantes = [];

        const esInmune = (pId) => {
          const pIdBase = cleanID(pId);
          return pIdBase === botPnBase || (botLidBase && pIdBase === botLidBase);
        };

        if (modo === "cs") {
          const data = readFriendlyList();
          participantes = groupMetadata.participants.filter(p => data.participants.includes(p.id) && !esInmune(p.id));
        } else {
          const filtro = (p) => !esInmune(p.id);
          if (modo === "all") participantes = groupMetadata.participants.filter(filtro);
          else if (modo === "admin") participantes = groupMetadata.participants.filter(p => filtro(p) && (p.admin));
        }

        if (participantes.length === 0) return await sock.sendMessage(jid, { text: "❌ No hay nadie en la lista." });

        const mentions = participantes.map(p => p.id);
        const drawMsg = await sock.sendMessage(jid, {
            text: `🎲 *Iniciando sorteo...* \n_Suerte a los ${participantes.length} participantes._` + getLegend(sock),
            mentions: mentions
        }, { quoted: m });

        for (const emoji of ["9️⃣","8️⃣","7️⃣","6️⃣","5️⃣","4️⃣","3️⃣","2️⃣","1️⃣","0️⃣"]) {
          await sock.sendMessage(jid, { react: { text: emoji, key: drawMsg.key } });
          await new Promise(res => setTimeout(res, 1000));
        }

        const ganador = participantes[Math.floor(Math.random() * participantes.length)].id;
        const ganadorBase = cleanID(ganador);

        await sock.sendMessage(jid, {
            text: `🎉 *¡TENEMOS UN GANADOR!* 🎉\n\nFelicidades @${ganadorBase}`,
            mentions: [ganador]
        }, { quoted: drawMsg });

      } catch (e) { console.error(e); }
    },
  },




];
