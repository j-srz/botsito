/**
 * Verifica si un usuario es administrador en un grupo usando Baileys
 * @param {import('@whiskeysockets/baileys').WASocket} sock - La instancia del bot
 * @param {string} jid - El ID del grupo (ej: 12345@g.us)
 * @param {string} user - El ID del usuario a verificar (ej: 521... @s.whatsapp.net)
 */
const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;

        // "Limpiamos" el ID del usuario (quitamos el :1, :2, etc. de Baileys)
        const cleanUser = user.split(':')[0] + (user.includes('@') ? '@' + user.split('@')[1] : '');

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        // Buscamos al usuario limpio en la lista
        const participant = participants.find(p => p.id === cleanUser);

        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        return false;
    }
};

const getLegend = () => {
    const date = new Date().toLocaleDateString('es-MX');
    return `\n\n> Rex bot | ${date}`;
};

module.exports = { isAdmin, getLegend };