const db = require('../data/db');
const logger = require('../core/logger');

/**
 * Servicio centralizado de moderación.
 * Gestiona logs de mensajes y mensajes fijados con persistencia JSON.
 */
class ModerationService {

    // ─── MESSAGE LOGS ────────────────────────────────────

    async logMessage(groupJid, userJid) {
        try {
            const data = await db.messageLogs.read();
            if (!data[groupJid]) data[groupJid] = {};
            if (!data[groupJid][userJid]) {
                data[groupJid][userJid] = { count: 0, lastMessage: 0 };
            }
            data[groupJid][userJid].count++;
            data[groupJid][userJid].lastMessage = Date.now();
            await db.messageLogs.write(data);
        } catch (e) {
            logger.error('ModerationService.logMessage error:', e);
        }
    }

    async getMessageLogs(groupJid) {
        try {
            const data = await db.messageLogs.read();
            return data[groupJid] || {};
        } catch (e) {
            logger.error('ModerationService.getMessageLogs error:', e);
            return {};
        }
    }

    // ─── PINNED MESSAGES ─────────────────────────────────

    async setPinnedMessage(groupJid, text, authorJid) {
        try {
            const data = await db.pinnedMessages.read();
            data[groupJid] = {
                text,
                author: authorJid,
                timestamp: Date.now()
            };
            await db.pinnedMessages.write(data);
            return true;
        } catch (e) {
            logger.error('ModerationService.setPinnedMessage error:', e);
            return false;
        }
    }

    async getPinnedMessage(groupJid) {
        try {
            const data = await db.pinnedMessages.read();
            return data[groupJid] || null;
        } catch (e) {
            logger.error('ModerationService.getPinnedMessage error:', e);
            return null;
        }
    }
}

module.exports = new ModerationService();
