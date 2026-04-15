const BaseCommand = require('../base.command');
const groupRegistry = require('../../services/group.registry');

class GroupCommand extends BaseCommand {
    constructor() {
        super('.group', [], 'Gestión PRO de identificación de grupos (Alias/Tags).');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const action = ctx.args[1]?.toLowerCase();
        const value = ctx.args[2]?.toLowerCase();
        
        const rootRecord = await groupRegistry.getGroupRecord(ctx.jid);

        if (action === "list") {
            const allGroups = await groupRegistry.getAll();
            const keys = Object.keys(allGroups);
            if (keys.length === 0) return await ctx.reply("No hay grupos indexados en la DB.");

            let msg = `*📂 DIRECTORIO GLOBAL DE GRUPOS*\n_Solo los últimos 20 visibles_\n\n`;
            let count = 0;
            for (const [jid, data] of Object.entries(allGroups)) {
                if (count >= 20) break;
                msg += `📌 *${data.name || "Sin nombre"}*\n`;
                msg += `   └ Alias: [${data.aliases?.join(', ') || ''}]\n`;
                msg += `   └ Tags: [${data.tags?.join(', ') || ''}]\n`;
                count++;
            }
            return await ctx.reply(msg);
        }

        if (!ctx.isAdmin) return await ctx.reply("❌ Necesitas ser Admin de WhatsApp para modificar los indices del grupo.");

        if (action === "setalias") {
            if (!value) return await ctx.reply("Uso: `.group setalias <nombre_alianza>` (sin espacios)");
            if (rootRecord.aliases.includes(value)) return await ctx.reply("⚠️ Ese alias ya está en este grupo.");
            
            const success = await groupRegistry.addAlias(ctx.jid, value);
            if (!success) return await ctx.reply("❌ Error Global: Ese alias ya fue reclamado por otro grupo en el ecosistema.");

            return await ctx.reply(`🔖 *Alias asignado permanentemente:* \`${value}\``);
        }

        if (action === "addtag") {
            if (!value) return await ctx.reply("Uso: `.group addtag <etiqueta>` (ej: sop)");
            if (rootRecord.tags.includes(value)) return await ctx.reply("⚠️ Ese tag ya existe.");

            const success = await groupRegistry.addTag(ctx.jid, value);
            if (!success) return await ctx.reply("❌ Error Global: Ese identificador corto ya ha sido reclamado.");

            return await ctx.reply(`🏷️ *Tag agregado permanentemente:* \`${value}\``);
        }

        if (action === "name") {
            const groupService = require('../../services/group.service');
            const mdata = await groupService.getGroupMetadata(sock, ctx.jid);
            if (mdata) await groupRegistry.updateGroupRecord(ctx.jid, { name: mdata.subject });
            return await ctx.reply(`Nombre actual capturado en DB: *${rootRecord.name || (mdata ? mdata.subject : "Desconocido")}*`);
        }

        const helpMsg = `*Comandos de Identificación de Grupo (.group)*\n\n• \`.group setalias <alias>\`\n• \`.group addtag <tag>\`\n• \`.group name\`\n• \`.group list\` (Global)`;
        await ctx.reply(helpMsg);
    }
}

module.exports = GroupCommand;
