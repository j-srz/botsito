const groupService = require('../services/group.service');
const antilinkService = require('../services/antilink.service');

class AntilinkMiddleware {
    async handle(sock, m, ctx) {
        if (!ctx.isGroup) return true;

        const isLink = /https?:\/\/|chat.whatsapp.com/gi.test(ctx.rawBody);
        if (!isLink) return true;

        const isEnabled = await antilinkService.checkSettings(ctx.jid);
        if (!isEnabled) return true;

        const isAdmin = await groupService.isAdmin(sock, ctx.jid, ctx.sender);
        
        const timestamp = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
        const groupMetadata = await groupService.getGroupMetadata(sock, ctx.jid);
        const groupName = groupMetadata ? groupMetadata.subject : "Desconocido";
        const senderNumber = ctx.sender.split('@')[0].split(':')[0];

        if (isAdmin) {
            await sock.sendMessage(ctx.jid, { react: { text: '✅', key: m.key } });
            await antilinkService.registerLog({
                groupId: ctx.jid, groupName, message: ctx.rawBody,
                name: ctx.pushName, num: senderNumber, id: ctx.sender, date: timestamp, action: "ADMIN_VERIFICADO"
            });
            return true; // Validated link from Admin, let it pass to commands if needed
        }

        // NO ES ADMIN -> ELIMINAR / ADVERTIR / BANEAR
        await sock.sendMessage(ctx.jid, { delete: m.key });
        const strikes = await antilinkService.addWarningStrike(ctx.jid, ctx.sender);

        if (strikes >= 2) {
            // BAN
            await sock.sendMessage(ctx.jid, { 
                text: `🚫 *@${senderNumber}* expulsado por reincidir con enlaces.`, 
                mentions: [ctx.sender] 
            });
            await sock.groupParticipantsUpdate(ctx.jid, [ctx.sender], "remove");
            await antilinkService.resetWarningStrike(ctx.jid, ctx.sender);
            
            await antilinkService.registerLog({ 
                groupId: ctx.jid, groupName, message: ctx.rawBody, 
                name: ctx.pushName, num: senderNumber, id: ctx.sender, date: timestamp, action: "BAN" 
            });
        } else {
            // ADVERTENCIA
            await sock.sendMessage(ctx.jid, { 
                text: `⚠️ *@${senderNumber}*, los enlaces no están permitidos.\n\n*ÚLTIMA ADVERTENCIA.* Si mandas otro, vas pa' fuera.`, 
                mentions: [ctx.sender] 
            });

            await antilinkService.registerLog({ 
                groupId: ctx.jid, groupName, message: ctx.rawBody, 
                name: ctx.pushName, num: senderNumber, id: ctx.sender, date: timestamp, action: "ADVERTENCIA" 
            });
        }

        return false; // Blocks the pipeline, the message was an illegal link
    }
}

module.exports = new AntilinkMiddleware();
