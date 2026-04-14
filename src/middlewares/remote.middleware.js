const sessionManager = require('../core/session/group.session.manager');
const groupRegistry = require('../services/group.registry');
const { cleanID } = require('../utils/formatter');
const db = require('../data/db');

class RemoteMiddleware {
    async handle(sock, m, ctx) {
        if (ctx.isGroup) return { intercepted: false }; 

        const senderID = m.key.remoteJid;
        
        // 1. Cargar Punteros Activos en Persistencia (Sticky Session)
        const activeSessions = await db.remoteSessions.read();
        let boundGroupId = activeSessions[senderID]; 

        // 2. Gestionar Comandos Base de Remote
        if (ctx.text.startsWith('.remote')) {
            const parts = ctx.rawBody.split(' '); 
            
            if (parts[1] === "unbind") {
                delete activeSessions[senderID];
                await db.remoteSessions.write(activeSessions);
                await ctx.reply("❌ Conexión Remota Finalizada. Estás de vuelta en local.");
                return { intercepted: true, allowed: false };
            }

            if (parts[1] === "bind") {
                const identifier = parts[2];
                if (!identifier) {
                    await ctx.reply('⚠️ Formato inválido.\nUso: `.remote bind <alias/tag/jid>`');
                    return { intercepted: true, allowed: false };
                }
                const targetGroupId = await groupRegistry.resolveIdentifier(identifier);
                if (!targetGroupId) {
                    await ctx.reply(`❌ No encontré el grupo: *${identifier}*.`);
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

                activeSessions[senderID] = targetGroupId;
                await db.remoteSessions.write(activeSessions);
                await ctx.reply(`📡 *Conexión Remota Activa*\n\nAnclado perpetuamente a: *${rootRecord.name || targetGroupId}*.\nTodo lo que escribas en este chat a partir de ahora se ejecutará allá.\nUsa \`.remote unbind\` para salir.`);
                return { intercepted: true, allowed: false };
            }

            // Normal one-shot execution
            if (parts.length < 3) {
                await ctx.reply('⚠️ Formato: `.remote <identificador> <comando>` o `.remote bind <identificador>`');
                return { intercepted: true, allowed: false };
            }

            const identifier = parts[1];
            const targetGroupId = await groupRegistry.resolveIdentifier(identifier);
            if (!targetGroupId) {
                await ctx.reply(`❌ Grupo no encontrado: *${identifier}*.`);
                return { intercepted: true, allowed: false };
            }
            boundGroupId = targetGroupId;
            ctx.rawBody = parts.slice(2).join(' ');
            ctx.text = ctx.rawBody.toLowerCase();
            ctx.args = ctx.text.split(' ');
            // NO se guarda en base de datos porque es de un solo uso
        } else if (!boundGroupId) {
            // No es comando remote y tampoco está atado a ninguna sesión
            return { intercepted: false };
        }

        // --- VERIFICACIÓN FINAL DE PRIVILEGIOS CADA VEZ QUE SE DISPARA ---
        const rootRecord = await groupRegistry.getGroupRecord(boundGroupId);
        const ops = rootRecord.operators || { owner: null, list: [] };
        const senderCheck = cleanID(ctx.sender) + "@s.whatsapp.net";

        const isOwner = cleanID(ops.owner || "") === cleanID(senderCheck);
        const isOp = ops.list.some(j => cleanID(j) === cleanID(senderCheck));

        if (!isOwner && !isOp) {
            await ctx.reply(`❌ Tus privilegios en el grupo anclado "${rootRecord.name || boundGroupId}" fueron revocados o el grupo se reseteó.`);
            delete activeSessions[senderID];
            await db.remoteSessions.write(activeSessions);
            return { intercepted: true, allowed: false };
        }

        // === OVERRIDE DEL CONTEXTO Y PROXY SOCK ===
        const groupState = await sessionManager.getSession(boundGroupId);
        ctx.isGroup = true;
        ctx.jid = boundGroupId;
        ctx.groupState = groupState; 

        // [AUDIT FIX]: SOCK Proxy que ignora { quoted: m } 
        // Porque citar un mensaje del DM dentro del Grupo colgaría Baileys E2EE.
        const proxySock = Object.create(sock);
        proxySock.sendMessage = async (targetJid, content, options) => {
            if (options && options.quoted) {
                delete options.quoted;
            }
            return sock.sendMessage(targetJid, content, options);
        };
        
        ctx.reply = async (replyText) => proxySock.sendMessage(boundGroupId, { text: replyText });
        ctx.react = async (emoji) => sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });

        // Aviso visual permanente (Trial UI)
        await sock.sendMessage(m.key.remoteJid, { text: `[📡 Remoto: ${rootRecord.name || boundGroupId} - Ejecutando]` });

        return { intercepted: true, allowed: true, spoofedSock: proxySock };
    }
}

module.exports = new RemoteMiddleware();
