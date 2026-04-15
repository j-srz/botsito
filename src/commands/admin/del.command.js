const BaseCommand = require('../base.command');

class DelCommand extends BaseCommand {
    constructor() {
        super('.del', [], 'Elimina el mensaje citado.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        this.requireBotAdmin(ctx);

        const quotedInfo = this.getQuotedInfo(m);
        if (!quotedInfo || !quotedInfo.stanzaId) {
            return await ctx.reply('⚠️ Debes *citar* (responder) el mensaje que quieres eliminar.');
        }

        try {
            const deleteKey = {
                remoteJid: ctx.jid,
                fromMe: false,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            };

            await sock.sendMessage(ctx.jid, { delete: deleteKey });
            await ctx.react('🗑️');
        } catch (e) {
            await ctx.reply('❌ No se pudo eliminar el mensaje.');
        }
    }
}

module.exports = DelCommand;
