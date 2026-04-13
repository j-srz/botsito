const BaseCommand = require('../base.command');
const raffleService = require('../../services/raffle.service');
const { cleanID, getLegend } = require('../../utils/formatter');

class RuletaCommand extends BaseCommand {
    constructor() {
        super('.ruleta', [], 'Comando general de subastas y sorteos amistosos.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup) return;

        const modo = ctx.args[1]?.toLowerCase(); // all, admin, cs, add
        const subModo = ctx.args[2]?.toLowerCase(); // m, add, remove, reset, show

        const botPnBase = cleanID(sock.user.id);
        const botLidBase = cleanID(sock.user.lid || "");

        // --- MODO: REGISTRO POR MENSAJE ---
        if (modo === "add" && subModo === "m") {
            const sentMsg = await sock.sendMessage(ctx.jid, {
                text: "🦖 *¡RIFA REX ACTIVA!* 🦖\n\nReaccionen a este mensaje con cualquier emoji para entrar al sorteo.\n\n_Usa .ruleta cs para rifar entre los que se anoten._",
            });
            await raffleService.saveFriendlyData({ messageId: sentMsg.key.id, participants: [] });
            await sock.sendMessage(ctx.jid, { react: { text: "🎟️", key: m.key } });
            return;
        }

        // --- MODO CS (LISTA AMIGABLE) ---
        if (modo === "cs") {
            let data = await raffleService.getFriendlyData();
            const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (subModo === "add") {
                if (mentions.length === 0) return await sock.sendMessage(ctx.jid, { text: "⚠️ Etiqueta a alguien." });
                for (const participant of mentions) {
                    await raffleService.addFriendlyParticipant(participant);
                }
                return await sock.sendMessage(ctx.jid, { text: `✅ Se agregaron *${mentions.length}* a la tómbola.` });
            }

            if (subModo === "remove") {
                if (mentions.length === 0) return await sock.sendMessage(ctx.jid, { text: "⚠️ Etiqueta a quién quitar." });
                data.participants = data.participants.filter(id => !mentions.includes(id));
                await raffleService.saveFriendlyData(data);
                return await sock.sendMessage(ctx.jid, { text: "🗑️ Tómbola actualizada." });
            }

            if (subModo === "reset") {
                await raffleService.saveFriendlyData({ messageId: null, participants: [] });
                return await sock.sendMessage(ctx.jid, { text: "🧹 *Tómbola vaciada.*" });
            }

            if (subModo === "show") {
                if (data.participants.length === 0) return await sock.sendMessage(ctx.jid, { text: "La tómbola está vacía." });
                const lista = data.participants.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
                return await sock.sendMessage(ctx.jid, { text: `🎟️ *LISTA PARA SORTEO:*\n\n${lista}`, mentions: data.participants });
            }
        }

        // --- EJECUCIÓN DEL SORTEO ---
        if (!["all", "admin", "cs"].includes(modo)) {
            return await sock.sendMessage(ctx.jid, { text: "Usa: `.ruleta all`, `.ruleta admin` o `.ruleta cs`" });
        }

        try {
            const groupMetadata = await sock.groupMetadata(ctx.jid);
            let participantes = [];
            const esInmune = (pId) => cleanID(pId) === botPnBase || (botLidBase && cleanID(pId) === botLidBase);

            if (modo === "cs") {
                const data = await raffleService.getFriendlyData();
                participantes = groupMetadata.participants.filter(p => data.participants.includes(p.id) && !esInmune(p.id));
            } else {
                const filtro = (p) => !esInmune(p.id);
                if (modo === "all") participantes = groupMetadata.participants.filter(filtro);
                else if (modo === "admin") participantes = groupMetadata.participants.filter(p => filtro(p) && p.admin);
            }

            if (participantes.length === 0) return await sock.sendMessage(ctx.jid, { text: "❌ No hay nadie para el sorteo." });

            const mentions = participantes.map(p => p.id);
            const listaMenciones = participantes.map(p => `@${p.id.split("@")[0]}`).join(" ");

            const drawMsg = await sock.sendMessage(ctx.jid, {
                text: `🎲 *Iniciando Sorteo (${modo.toUpperCase()})* 🦖\n\n*Participantes:*\n${listaMenciones}\n\n_Eligiendo ganador..._` + getLegend(sock),
                mentions
            }, { quoted: m });

            for (const emoji of ["3️⃣", "2️⃣", "1️⃣", "🎉"]) {
                await sock.sendMessage(ctx.jid, { react: { text: emoji, key: drawMsg.key } });
                await new Promise(res => setTimeout(res, 1000));
            }

            const ganador = participantes[Math.floor(Math.random() * participantes.length)].id;
            await sock.sendMessage(ctx.jid, {
                text: `🎉 *¡FELICIDADES @${ganador.split("@")[0]}!* \n\nHas ganado el sorteo. ✨`,
                mentions: [ganador],
            }, { quoted: drawMsg });

        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = RuletaCommand;
