const db = require('../data/db');
const logger = require('../core/logger');

/**
 * Servicio centralizado de moderación.
 * Gestiona mutes, logs de mensajes y mensajes fijados con persistencia JSON.
 */
class ModerationService {

    // ─── MUTE ────────────────────────────────────────────

    async isMuted(groupJid, userJid) {
        try {
            const data = await db.mutedUsers.read();
            const list = data[groupJid];
            return Array.isArray(list) && list.includes(userJid);
        } catch (e) {
            logger.error('ModerationService.isMuted error:', e);
            return false;
        }
    }

    async muteUser(groupJid, userJid) {
        try {
            const data = await db.mutedUsers.read();
            if (!data[groupJid]) data[groupJid] = [];
            if (!data[groupJid].includes(userJid)) {
                data[groupJid].push(userJid);
                await db.mutedUsers.write(data);
            }
            return true;
        } catch (e) {
            logger.error('ModerationService.muteUser error:', e);
            return false;
        }
    }

    async unmuteUser(groupJid, userJid) {
        try {
            const data = await db.mutedUsers.read();
            if (!data[groupJid]) return false;
            const idx = data[groupJid].indexOf(userJid);
            if (idx === -1) return false;
            data[groupJid].splice(idx, 1);
            await db.mutedUsers.write(data);
            return true;
        } catch (e) {
            logger.error('ModerationService.unmuteUser error:', e);
            return false;
        }
    }

    async getMutedUsers(groupJid) {
        try {
            const data = await db.mutedUsers.read();
            return data[groupJid] || [];
        } catch (e) {
            logger.error('ModerationService.getMutedUsers error:', e);
            return [];
        }
    }

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
