const BaseCommand = require('../base.command');
const auctionService = require('../../services/auction.service');
const groupService = require('../../services/group.service');

class GgCommand extends BaseCommand {
    constructor() {
        super('.gg', [], 'Registra ganador de subasta.');
    }

    async execute(sock, m, ctx) {
        if (!ctx.isGroup) return;

        const isAdmin = await groupService.isAdmin(sock, ctx.jid, ctx.sender);
        if (!isAdmin) {
            return await ctx.reply("Acceso denegado.");
        }

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) {
            return await ctx.reply("Menciona al ganador.");
        }

        const targetJid = mentions[0];
        
        let monto = 0;
        for (let i = 1; i < ctx.args.length; i++) {
            const val = parseInt(ctx.args[i], 10);
            if (!isNaN(val) && !ctx.args[i].includes('@')) {
                monto = val;
                break;
            }
        }

        if (monto <= 0) {
            return await ctx.reply("Falta monto válido.");
        }

        try {
            await auctionService.registerWinner(targetJid, monto, ctx.sender);
            await sock.sendMessage(ctx.jid, { 
                text: ` @${targetJid.split('@')[0]} ($${monto}).`,
                mentions: [targetJid]
            }, { quoted: m });
        } catch (err) {
            await ctx.reply("Error al registrar subasta.");
        }
    }
}

module.exports = GgCommand;
