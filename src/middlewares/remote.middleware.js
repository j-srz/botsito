const sessionManager = require('../core/session/group.session.manager');
const groupRegistry = require('../services/group.registry');
const { cleanID } = require('../utils/formatter');

class RemoteMiddleware {
    async handle(sock, m, ctx) {
        if (ctx.isGroup || !ctx.text.startsWith('.remote')) return { intercepted: false };

        const parts = ctx.rawBody.split(' '); 
        if (parts.length < 3) {
            await ctx.reply('⚠️ Formato inválido.\nUso: `.remote <identificador> <comando>`\n\n_El identificador puede ser un alias, tag, JID o nombre de grupo._');
            return { intercepted: true, allowed: false };
        }

        const identifier = parts[1];
        const subCommandRaw = parts.slice(2).join(' ');
        
        // Búsqueda inteligente PRO
        const targetGroupId = await groupRegistry.resolveIdentifier(identifier);
        
        if (!targetGroupId) {
            await ctx.reply(`❌ No encontré ningún grupo localizador con el alias, tag, o ID: *${identifier}*. Usa \`.group list\` en un grupo para auditar.`);
            return { intercepted: true, allowed: false };
        }

        const rootRecord = await groupRegistry.getGroupRecord(targetGroupId);
        const ops = rootRecord.operators || { owner: null, list: [] };
        const senderCheck = cleanID(ctx.sender) + "@s.whatsapp.net";

        const isOwner = cleanID(ops.owner || "") === cleanID(senderCheck);
        const isOp = ops.list.some(j => cleanID(j) === cleanID(senderCheck));

        if (!isOwner && !isOp) {
            await ctx.reply(`❌ Privilegios insuficientes en "${rootRecord.name || targetGroupId}".`);
            return { intercepted: true, allowed: false };
        }

        // === OVERRIDE DEL CONTEXTO (SPOOFING) ===
        const groupState = await sessionManager.getSession(targetGroupId);
        
        ctx.isGroup = true;
        ctx.jid = targetGroupId;
        ctx.rawBody = subCommandRaw;
        ctx.text = subCommandRaw.toLowerCase();
        ctx.args = ctx.text.split(' ');
        ctx.groupState = groupState; 

        // La función Reply manda el mensaje al grupo objetivo, no al privado.
        ctx.reply = async (replyText) => sock.sendMessage(targetGroupId, { text: replyText });
        ctx.react = async (emoji) => sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });

        await ctx.react("✅");

        return { intercepted: true, allowed: true };
    }
}

module.exports = new RemoteMiddleware();
