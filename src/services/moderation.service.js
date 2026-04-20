const db = require('../data/db');
const logger = require('../core/logger');

/**
 * Servicio centralizado de moderación.
 * Gestiona logs de mensajes y mensajes fijados con persistencia JSON.
 */
class ModerationService {

    // ─── MESSAGE LOGS ────────────────────────────────────

    async logMessage(groupJid, userJid, messageKey = null) {
        try {
            const data = await db.messageLogs.read();
            if (!data[groupJid]) data[groupJid] = {};
            if (!data[groupJid][userJid]) {
                data[groupJid][userJid] = { count: 0, lastMessage: 0, recentKeys: [] };
            }
            const entry = data[groupJid][userJid];
            entry.count++;
            entry.lastMessage = Date.now();
            if (messageKey) {
                if (!entry.recentKeys) entry.recentKeys = [];
                entry.recentKeys.push(messageKey);
                if (entry.recentKeys.length > 20) entry.recentKeys.shift();
            }
            await db.messageLogs.write(data);
        } catch (e) {
            logger.error('ModerationService.logMessage error:', e);
        }
    }

    async getRecentKeys(groupJid, userJid) {
        try {
            const data = await db.messageLogs.read();
            return data[groupJid]?.[userJid]?.recentKeys || [];
        } catch (e) {
            logger.error('ModerationService.getRecentKeys error:', e);
            return [];
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
