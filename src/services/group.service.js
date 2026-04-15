const logger = require('../core/logger');

/**
 * Normaliza un JID para comparación confiable.
 * Baileys devuelve JIDs en formatos inconsistentes:
 *   - "5215512345678:42@s.whatsapp.net" (con recurso)
 *   - "5215512345678@s.whatsapp.net" (sin recurso)
 *   - "12345678901234:42@lid" (Linked ID)
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

    /**
     * Verifica si el bot es admin del grupo.
     * 
     * PUNTO CRÍTICO: Baileys usa DOS identidades para el bot:
     *   - sock.user.id  → Phone Number JID (ej: 5215512345678:42@s.whatsapp.net)
     *   - sock.user.lid  → Linked ID (ej: 12345678901234:42@lid)
     * 
     * Los participantes del grupo pueden estar listados con CUALQUIERA de las dos.
     * En versiones recientes de Baileys, predomina el LID.
     * Debemos comparar contra AMBAS identidades.
     */
    async isBotAdmin(sock, jid) {
        try {
            if (!jid.endsWith('@g.us')) return false;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;

            // Construir el set de identidades conocidas del bot
            const botIdentities = new Set();
            if (sock.user.id) botIdentities.add(normalizeJid(sock.user.id));
            if (sock.user.lid) botIdentities.add(normalizeJid(sock.user.lid));

            // Buscar cualquier participante cuyo ID base coincida con alguna identidad del bot
            const botParticipant = participants.find(p => botIdentities.has(normalizeJid(p.id)));

            return botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
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
