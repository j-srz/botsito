const BaseCommand = require('../base.command');
const groupRegistry = require('../../services/group.registry');
const { cleanID } = require('../../utils/formatter');

class OperatorsCommand extends BaseCommand {
    constructor() {
        super('.operators', [], 'Gestión PERMANENTE de operadores remotos del bot en el grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const action = ctx.args[1]?.toLowerCase();
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        // El estado ahora es persistente
        const rootRecord = await groupRegistry.getGroupRecord(ctx.jid);
        const state = rootRecord.operators || { owner: null, list: [] };

        const isAdmin = ctx.isAdmin;

        if (action === "set") {
            if (!isAdmin) return await ctx.reply("⚠️ Solo administradores de WhatsApp pueden asignar al owner de operators.");
            if (mentions.length !== 1) return await ctx.reply("Menciona a 1 usuario para asignarlo como owner de control remoto.");
            
            state.owner = cleanID(mentions[0]) + "@s.whatsapp.net";
            await groupRegistry.saveOperators(ctx.jid, state);
            return await ctx.reply(`👑 Owner de los operators registrado permanentemente.`);
        }

        if (action === "get") {
            let info = `*📋 SISTEMA .OPERATORS (PRO)*\n\n*Propietario:* ${state.owner ? `@${state.owner.split("@")[0]}` : "Ninguno"}\n`;
            if (state.list.length > 0) {
                info += `*Lista de Operadores:*\n` + state.list.map((o, i) => `${i + 1}. @${o.split("@")[0]}`).join("\n");
            } else {
                info += `\n(Sin operadores adicionales registrados)`;
            }
            return await sock.sendMessage(ctx.jid, { text: info, mentions: [state.owner, ...state.list].filter(Boolean) });
        }

        const isOwner = cleanID(ctx.sender) === cleanID(state.owner || "");

        if (action === "add") {
            if (!isOwner) return await ctx.reply("❌ Solo el owner definido (con .operators set) puede agregar operadores.");
            if (mentions.length === 0) return await ctx.reply("Menciona a usuarios para agregarlos.");

            mentions.forEach(p => {
                const jid = cleanID(p) + "@s.whatsapp.net";
                if (!state.list.includes(jid) && jid !== state.owner) state.list.push(jid);
            });
            await groupRegistry.saveOperators(ctx.jid, state);
            return await ctx.reply(`➕ Operadores añadidos. Total: ${state.list.length}`);
        }

        if (action === "remove") {
            if (!isOwner) return await ctx.reply("❌ Solo el owner puede remover operadores.");
            if (mentions.length === 0) return await ctx.reply("Menciona a los operadores a remover.");

            const ment = mentions.map(m => cleanID(m) + "@s.whatsapp.net");
            state.list = state.list.filter(id => !ment.includes(id));
            await groupRegistry.saveOperators(ctx.jid, state);
            return await ctx.reply(`➖ Operadores removidos en BD.`);
        }

        if (action === "reset") {
            if (!isOwner && !isAdmin) return await ctx.reply("❌ Sin permisos para resetear.");
            state.list = [];
            await groupRegistry.saveOperators(ctx.jid, state);
            return await ctx.reply("🔄 Todos los operadores auxiliares fueron purgados del disco.");
        }

        const helpMsg = `*Comandos de Control Remoto (.operators)*\n\n• \`.operators set @user\` (Solo Admins)\n• \`.operators add @user\`\n• \`.operators remove @user\`\n• \`.operators get\`\n• \`.operators reset\``;
        await ctx.reply(helpMsg);
    }
}

module.exports = OperatorsCommand;
