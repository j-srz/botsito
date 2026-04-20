const BaseCommand = require('../base.command');
const moderationService = require('../../services/moderation.service');

class DelCommand extends BaseCommand {
    constructor() {
        super('.del', [], 'Elimina el mensaje citado. Usa .del all para borrar los últimos 20 mensajes de un usuario.');
    }

    async execute(sock, m, ctx) {
        this.requireAdmin(ctx);
        this.requireBotAdmin(ctx);

        const isDelAll = ctx.args[1] === 'all';

        if (isDelAll) {
            return await this._handleDelAll(sock, m, ctx);
        }

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
            // Borrar también el mensaje del comando
            await sock.sendMessage(ctx.jid, { delete: m.key });
        } catch (e) {
            await ctx.reply('❌ No se pudo eliminar el mensaje.');
        }
    }

    async _handleDelAll(sock, m, ctx) {
        const targetJid = this.getTargetUser(m);
        if (!targetJid) {
            return await ctx.reply('⚠️ Debes *citar* o *mencionar* al usuario cuyos mensajes quieres borrar.');
        }

        const recentKeys = await moderationService.getRecentKeys(ctx.jid, targetJid);
        if (!recentKeys.length) {
            return await ctx.reply('⚠️ No hay mensajes recientes registrados de ese usuario.');
        }

        let deleted = 0;
        for (const key of recentKeys) {
            try {
                await sock.sendMessage(ctx.jid, {
                    delete: { remoteJid: ctx.jid, fromMe: false, id: key.id, participant: targetJid }
                });
                deleted++;
            } catch (_) {
                // mensaje ya eliminado o inaccesible, continuar
            }
        }

        // Borrar el mensaje del comando
        try { await sock.sendMessage(ctx.jid, { delete: m.key }); } catch (_) {}

        await ctx.reply(`🗑️ Se eliminaron *${deleted}* mensajes de @${targetJid.split('@')[0]}.`);
    }
}

module.exports = DelCommand;
