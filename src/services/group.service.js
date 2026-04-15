const logger = require('../core/logger');

/**
 * Normaliza un JID para comparación confiable.
 * Baileys devuelve JIDs en formatos inconsistentes:
 *   - "5215512345678:42@s.whatsapp.net" (con recurso)
 *   - "5215512345678@s.whatsapp.net" (sin recurso)
 *   - formatos LID con @lid
 *
 * Esta función extrae solo el número base para comparación estable.
 */
function normalizeJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

class GroupService {
    async isAdmin(sock, jid, user) {
        try {
            if (!jid.endsWith('@g.us')) return false;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;
            const userBase = normalizeJid(user);
            const participant = participants.find(p => normalizeJid(p.id) === userBase);
            return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {
            logger.error('Error verificando admin en GroupService:', e);
            return false;
        }
    }

    async isBotAdmin(sock, jid) {
        try {
            const botJid = sock.user.id;
            return await this.isAdmin(sock, jid, botJid);
        } catch (e) {
            logger.error('Error verificando bot admin:', e);
            return false;
        }
    }

    async getGroupMetadata(sock, jid) {
        try {
            return await sock.groupMetadata(jid);
        } catch (e) {
            logger.error(`No se pudo obtener metadata de ${jid}`, e);
            return null;
        }
    }
}

module.exports = new GroupService();
