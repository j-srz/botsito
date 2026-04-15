const BaseCommand = require('../base.command');
const raffleService = require('../../services/raffle.service');
const { cleanID, getLegend } = require('../../utils/formatter');
const logger = require('../../core/logger');

class RuletaCommand extends BaseCommand {
    constructor() {
        super('.ruleta', [], 'Comando general de subastas y sorteos amistosos.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const modo = ctx.args[1]?.toLowerCase(); // all, admin, cs, add
        const subModo = ctx.args[2]?.toLowerCase(); // m, add, remove, reset, show

        const botPnBase = cleanID(sock.user.id);
        const botLidBase = cleanID(sock.user.lid || "");

        // --- MODO: REGISTRO POR MENSAJE ---
        if (modo === "add" && subModo === "m") {
            const sentMsg = await sock.sendMessage(ctx.jid, {
                text: "🦖 *¡RIFA REX ACTIVA!* 🦖\n\nReaccionen a este mensaje con cualquier emoji para entrar al sorteo.\n\n_Usa .ruleta cs para rifar entre los que se anoten._",
            });
            raffleService.startFriendlyRaffle(ctx.groupState, sentMsg.key.id);
            await ctx.react("🎟️");
            return;
        }

        // --- MODO CS (LISTA AMIGABLE) ---
        if (modo === "cs") {
            const data = ctx.groupState.raffle;
            const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (subModo === "add") {
                if (mentions.length === 0) return await ctx.reply("⚠️ Etiqueta a alguien.");
                for (const participant of mentions) {
                    raffleService.addFriendlyParticipant(ctx.groupState, participant);
                }
                return await ctx.reply(`✅ Se agregaron *${mentions.length}* a la tómbola.`);
            }

            if (subModo === "remove") {
                if (mentions.length === 0) return await ctx.reply("⚠️ Etiqueta a quién quitar.");
                raffleService.removeFriendlyParticipants(ctx.groupState, mentions);
                return await ctx.reply("🗑️ Tómbola actualizada.");
            }

            if (subModo === "reset") {
                raffleService.resetFriendlyRaffle(ctx.groupState);
                return await ctx.reply("🧹 *Tómbola vaciada.*");
            }

            if (subModo === "show") {
                if (data.participants.length === 0) return await ctx.reply("La tómbola está vacía.");
                const lista = data.participants.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
                return await sock.sendMessage(ctx.jid, { text: `🎟️ *LISTA PARA SORTEO:*\n\n${lista}`, mentions: data.participants });
            }
        }

        // --- EJECUCIÓN DEL SORTEO ---
        if (!["all", "admin", "cs"].includes(modo)) {
            return await ctx.reply("Usa: `.ruleta all`, `.ruleta admin` o `.ruleta cs`");
        }

        try {
            const groupMetadata = await sock.groupMetadata(ctx.jid);
            let participantes = [];
            const esInmune = (pId) => cleanID(pId) === botPnBase || (botLidBase && cleanID(pId) === botLidBase);

            if (modo === "cs") {
                const data = ctx.groupState.raffle;
                participantes = groupMetadata.participants.filter(p => data.participants.includes(p.id) && !esInmune(p.id));
            } else {
                const filtro = (p) => !esInmune(p.id);
                if (modo === "all") participantes = groupMetadata.participants.filter(filtro);
                else if (modo === "admin") participantes = groupMetadata.participants.filter(p => filtro(p) && p.admin);
            }

            if (participantes.length === 0) return await ctx.reply("❌ No hay nadie para el sorteo.");

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
            logger.error('Error en ruleta:', e);
        }
    }
}

module.exports = RuletaCommand;
