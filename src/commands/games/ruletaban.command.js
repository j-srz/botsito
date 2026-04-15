const BaseCommand = require('../base.command');
const raffleService = require('../../services/raffle.service');
const { cleanID, getLegend } = require('../../utils/formatter');
const logger = require('../../core/logger');

class RuletabanCommand extends BaseCommand {
    constructor() {
        super('.ruletaban', [], 'Baneos al azar o guiados.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);

        const modo = ctx.args[1]?.toLowerCase();
        const subModo = ctx.args[2]?.toLowerCase();
        const proteccion = ctx.args[2]?.toLowerCase();

        const botPnBase = cleanID(sock.user.id);
        const botLidBase = cleanID(sock.user.lid || "");

        if (modo === "cs") {
            const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (subModo === "add") {
                if (mentions.length === 0) return await ctx.reply("⚠️ Menciona a los pendejos para el registro.");
                const { agregados, total } = raffleService.addCustomParticipants(ctx.groupState, mentions);
                await ctx.react("📝");
                return await ctx.reply(`✅ *${agregados}* agregados. Total en lista: ${total}`);
            }
            if (subModo === "remove") {
                if (mentions.length === 0) return await ctx.reply("⚠️ Menciona a quiénes quieres perdonar.");
                const borrados = raffleService.removeCustomParticipants(ctx.groupState, mentions);
                await ctx.react("🚮");
                return await ctx.reply(`🗑️ Se eliminaron *${borrados}* de la lista negra.`);
            }
            if (subModo === "show" || subModo === "showlist") {
                const currentList = ctx.groupState.customRaffle;
                if (currentList.length === 0) return await ctx.reply("La lista está limpia... por ahora. 🦖");
                const listaTexto = currentList.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
                return await sock.sendMessage(ctx.jid, { text: `💀 *LISTA NEGRA (cs):*\n\n${listaTexto}`, mentions: currentList });
            }
            if (subModo === "reset") {
                raffleService.resetCustomList(ctx.groupState);
                await ctx.react("🧹");
                return await ctx.reply("🧹 *Lista reseteada. Todos son inocentes de nuevo.*");
            }
        }

        if (!["all", "admin", "cs"].includes(modo)) {
            await ctx.react("❌");
            const helpMsg = `┌── [ 🎲 RULETA REX ] ──┐\n• \`.ruletaban all [soyjoto]\`\n• \`.ruletaban admin [soyjoto]\`\n\n*MODO CS (CUSTOM):*\n• \`.ruletaban cs\` (Sorteo)\n• \`.ruletaban cs add @user1 @user2...\`\n• \`.ruletaban cs remove @user1...\`\n• \`.ruletaban cs show\`\n• \`.ruletaban cs reset\`\n└────────────────────┘`;
            return await ctx.reply(helpMsg);
        }

        try {
            const groupMetadata = await sock.groupMetadata(ctx.jid);
            const creatorBase = cleanID(groupMetadata.owner || "");
            let participantes = [];
            const esInmune = (pId) => cleanID(pId) === botPnBase || (botLidBase && cleanID(pId) === botLidBase);

            if (modo === "cs") {
                const customList = ctx.groupState.customRaffle;
                participantes = groupMetadata.participants.filter(p => customList.includes(p.id) && !esInmune(p.id));
            } else {
                const filtroGral = (p) => {
                    const pIdBase = cleanID(p.id);
                    const senderBase = cleanID(ctx.sender);
                    if (esInmune(p.id)) return false;
                    if (proteccion === "soyjoto" && pIdBase === senderBase) return false;
                    return true;
                };
                if (modo === "all") participantes = groupMetadata.participants.filter(filtroGral);
                else if (modo === "admin") participantes = groupMetadata.participants.filter(p => filtroGral(p) && (p.admin === "admin" || p.admin === "superadmin"));
            }

            if (participantes.length === 0) return await ctx.reply(`❌ No hay nadie en la mira (${modo}).`);

            const mentions = participantes.map(p => p.id);
            const listaMenciones = participantes.map(p => `@${p.id.split("@")[0]}`).join(" ");
            const drawMsg = await sock.sendMessage(ctx.jid, {
                text: `🎲 *Participantes en la mira (${modo.toUpperCase()}):*\n${listaMenciones}\n\n_Sorteando..._` + getLegend(sock),
                mentions
            }, { quoted: m });

            for (const emoji of ["9️⃣", "8️⃣", "7️⃣", "6️⃣", "5️⃣", "4️⃣", "3️⃣", "2️⃣", "1️⃣", "0️⃣"]) {
                await sock.sendMessage(ctx.jid, { react: { text: emoji, key: drawMsg.key } });
                await new Promise(res => setTimeout(res, 1000));
            }

            const victima = participantes[Math.floor(Math.random() * participantes.length)].id;
            const victimaBase = cleanID(victima);
            const lastWordsMsg = await sock.sendMessage(ctx.jid, {
                text: `🎯 ¡TE TOCÓ @${victimaBase}! \n\nTienes *5 SEGUNDOS* para tus últimas palabras... ⏳`,
                mentions: [victima],
            }, { quoted: drawMsg });

            for (const emoji of ["5️⃣", "4️⃣", "3️⃣", "2️⃣", "1️⃣", "💥"]) {
                await sock.sendMessage(ctx.jid, { react: { text: emoji, key: lastWordsMsg.key } });
                await new Promise(res => setTimeout(res, 1000));
            }

            if (victimaBase === creatorBase) {
                await sock.sendMessage(ctx.jid, {
                    text: `💥 ¡BOOM! @${victimaBase} Ups... se salvó el jefe.`,
                    mentions: [victima],
                }, { quoted: lastWordsMsg });
            } else {
                await sock.groupParticipantsUpdate(ctx.jid, [victima], "remove");
                await sock.sendMessage(ctx.jid, {
                    text: `💥 ¡BOOM! @${victimaBase} bye bay alv. 👢`,
                    mentions: [victima],
                }, { quoted: lastWordsMsg });
            }
        } catch (e) {
            logger.error('Error en ruletaban:', e);
        }
    }
}

module.exports = RuletabanCommand;
