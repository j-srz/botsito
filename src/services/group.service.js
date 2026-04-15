const logger = require('../core/logger');

class GroupService {
    async isAdmin(sock, jid, user) {
        try {
            if (!jid.endsWith('@g.us')) return false;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;
            const participant = participants.find(p => p.id === user);
            return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {
            logger.error('Error verificando admin en GroupService:', e);
            return false;
        }
    }

    async isBotAdmin(sock, jid) {
        try {
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            return await this.isAdmin(sock, jid, botId);
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
