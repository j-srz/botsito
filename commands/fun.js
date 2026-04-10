const path = require("path");
const fs = require("fs");
const { isAdmin, getLegend } = require("../utils/helpers");

module.exports = [
  {
    name: ".ping",
    execute: async (sock, m) => {
      await sock.sendMessage(m.key.remoteJid, { text: "pong" }, { quoted: m });
    },
  },
  {
    name: ".1500",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const videoPath = path.resolve(__dirname, "../media/milquinientos.mp4");

      // 1. Verificamos que el video exista en la carpeta media
      if (!fs.existsSync(videoPath)) {
        return await sock.sendMessage(jid, {
          text: "❌ No encontré milquinientos.mp4 en la carpeta media.",
        });
      }

      // 2. Mandamos el video como GIF (gifPlayback: true)
      await sock.sendMessage(
        jid,
        {
          video: fs.readFileSync(videoPath),
          gifPlayback: true,
          caption: "*milquinientos*" + getLegend(sock), // Tu leyenda con fecha natural
        },
        { quoted: m },
      );

      // 3. Reaccionamos al mensaje del usuario con un besito
      await sock.sendMessage(jid, {
        react: { text: "💋", key: m.key },
      });
    },
  },
  {
    name: ".vtalv",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
      if (!quotedInfo || !quotedInfo.participant)
        return sock.sendMessage(
          jid,
          { text: "Responde a un mensaje." },
          { quoted: m },
        );

      const targetJid = quotedInfo.participant;
      const targetNumber = targetJid.split("@")[0].split(":")[0];
      const senderName = m.pushName || "Alguien";

      await sock.sendMessage(
        jid,
        {
          text: `\`${senderName}\` _dice:_ @${targetNumber} vtalv ⊂(◉‿◉)つ`,
          mentions: [targetJid],
        },
        { quoted: m },
      );
    },
  },
  {
    name: ".wassaa",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
      if (!quotedInfo || !quotedInfo.participant) return;

      const targetJid = quotedInfo.participant;
      const targetNumber = targetJid.split("@")[0].split(":")[0];
      const videoUrl =
        "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4";

      try {
        await sock.sendMessage(
          jid,
          {
            video: { url: videoUrl },
            gifPlayback: true,
            caption: `@${targetNumber} wassaaa!!!`,
            mentions: [targetJid],
          },
          { quoted: m },
        );
      } catch (e) {
        await sock.sendMessage(jid, { text: "Error con el video." });
      }
    },
  },
  {
    name: ".kiss",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

      if (!quotedInfo || !quotedInfo.participant) {
        return await sock.sendMessage(
          jid,
          { text: "Pendejo, responde a alguien." },
          { quoted: m },
        );
      }

      const targetJid = quotedInfo.participant;
      const targetNumber = targetJid.split("@")[0].split(":")[0];
      const senderName = m.pushName || "Alguien";
      const videoPath = path.join(__dirname, "../media/kiss.mp4");

      try {
        await sock.sendMessage(
          jid,
          {
            video: fs.readFileSync(videoPath),
            gifPlayback: true,
            caption: `\`${senderName}\` _besó a_ @${targetNumber} 💋`,
            mentions: [targetJid],
          },
          { quoted: m },
        );
      } catch (e) {
        await sock.sendMessage(
          jid,
          {
            text: `\`${senderName}\` _besó a_ @${targetNumber} 💋`,
            mentions: [targetJid],
          },
          { quoted: m },
        );
      }
    },
  },
  {
    name: ".tickle",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
      if (!quotedInfo || !quotedInfo.participant) return;

      const targetJid = quotedInfo.participant;
      const targetNumber = targetJid.split("@")[0].split(":")[0];
      const senderName = m.pushName || "Alguien";

      await sock.sendMessage(
        jid,
        {
          text: `*${senderName} hace cosquillas a* @${targetNumber}`,
          mentions: [targetJid],
        },
        { quoted: m },
      );
    },
  },
  {
    name: ".todos",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      if (!jid.endsWith("@g.us")) return;

      await sock.sendMessage(jid, { react: { text: "📣", key: m.key } });

      const groupMetadata = await sock.groupMetadata(jid);
      const mentions = groupMetadata.participants.map((p) => p.id);
      let list = `*Llamando rexitos*\n╔ ========\n`;

      for (let participant of groupMetadata.participants) {
        const num = participant.id.split("@")[0].split(":")[0];
        list += `║ 🦖 @${num}\n`;
      }

      list += `╚ ========\n*Llamados*${getLegend()}`;
      await sock.sendMessage(jid, { text: list, mentions }, { quoted: m });
    },
  },
  {
    name: ".smoke",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      await sock.sendMessage(jid, { react: { text: "🚬", key: m.key } });

      const senderJid = m.key.participant || jid;
      const senderNumber = senderJid.split("@")[0].split(":")[0];
      const gifUrl =
        "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExank0a3B5ODl2dTJlbm5rMGw1MzVvcWswbzVnY2twYmNneDF2NmZkaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpAPQVW9lWnWU/giphy.gif";

      try {
        await sock.sendMessage(
          jid,
          {
            video: { url: gifUrl },
            gifPlayback: true,
            caption: `💨 @${senderNumber} ${getLegend()}`,
            mentions: [senderJid],
          },
          { quoted: m },
        );
      } catch (e) {
        await sock.sendMessage(jid, {
          text: `💨 @${senderNumber} dándose un toque...`,
          mentions: [senderJid],
        });
      }
    },
  },
  {
    name: ".gg",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
      if (!quotedInfo) return;

      const quotedMsg = quotedInfo.quotedMessage;
      const quotedBody =
        quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";

      const amountMatch = quotedBody.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

      await sock.sendMessage(jid, {
        react: {
          text: "🏆",
          key: {
            ...m.key,
            id: quotedInfo.stanzaId,
            participant: quotedInfo.participant,
          },
        },
      });

      const winnerEntry = {
        fecha: new Date().toLocaleString("es-MX"),
        admin_nombre: m.pushName || "Admin",
        admin_id: m.key.participant || jid,
        ganador_nombre: "Usuario",
        ganador_id: quotedInfo.participant,
        monto: amount,
        grupo: (await sock.groupMetadata(jid)).subject,
      };

      const dataPath = path.join(__dirname, "../data");
      const filePath = path.join(dataPath, "subastas_registro.json");

      try {
        if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
        let registro = fs.existsSync(filePath)
          ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
          : [];
        registro.push(winnerEntry);
        await fs.promises.writeFile(
          filePath,
          JSON.stringify(registro, null, 2),
        );
      } catch (err) {
        console.error(err);
      }
    },
  },
  {
    name: ".resumen",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || jid;

      if (!(await isAdmin(sock, jid, sender))) return;

      const filePath = path.join(__dirname, "../data/subastas_registro.json");
      if (!fs.existsSync(filePath))
        return await sock.sendMessage(jid, { text: "Sin registros aún." });

      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const stats = {};
        data.forEach((p) => {
          if (!stats[p.ganador_id]) {
            stats[p.ganador_id] = { victorias: 0, total: 0 };
          }
          stats[p.ganador_id].victorias += 1;
          stats[p.ganador_id].total += p.monto;
        });

        const ranking = Object.entries(stats).sort(
          (a, b) => b[1].victorias - a[1].victorias,
        );
        let res = `*📊 RESUMEN DE SUBASTAS*\n_Top Ganadores_\n\n`;
        const allMentions = [];

        ranking.forEach(([id, user], i) => {
          const medalla =
            i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
          const num = id.split("@")[0].split(":")[0];
          res += `${medalla} @${num}\n`;
          res += `   └ Wins: ${user.victorias} | Total: $${user.total}\n`;
          allMentions.push(id);
        });

        await sock.sendMessage(
          jid,
          { text: res + getLegend(), mentions: allMentions },
          { quoted: m },
        );
      } catch (err) {
        await sock.sendMessage(jid, { text: "Error al procesar resumen." });
      }
    },
  },
  {
    name: ".joto",
    execute: async (sock, m) => {
      const jid = m.key.remoteJid;
      const quotedInfo = m.message?.extendedTextMessage?.contextInfo;

      // 1. CASO: NO RESPONDIÓ A NADIE (Se la regresa al que mandó el comando)
      if (!quotedInfo || !quotedInfo.participant) {
        const senderName = m.pushName || "Alguien";
        return await sock.sendMessage(
          jid,
          {
            text: `che \`${senderName}\` joto mejor responde a alguien.`,
          },
          { quoted: m },
        );
      }

      // 2. CASO: SÍ RESPONDIÓ A ALGUIEN
      const targetJid = quotedInfo.participant;
      const groupMetadata = await sock.groupMetadata(jid);
      const participant = groupMetadata.participants.find(
        (p) => p.id === targetJid,
      );

      // Obtenemos el nombre del objetivo (Target)
      const targetName =
        participant?.name ||
        participant?.notify ||
        targetJid.split("@")[0].split(":")[0];

      // Generamos un número al azar entre 1 y 100
      const porcentaje = Math.floor(Math.random() * 100) + 1;

      await sock.sendMessage(
        jid,
        {
          text: `🏳️‍🌈 El usuario \`${targetName}\` es un **${porcentaje}%** gei.`,
        },
        { quoted: m },
      );
    },
  },
];
