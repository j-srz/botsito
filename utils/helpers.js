/**
 * Verifica si un usuario es administrador en un grupo usando Baileys
 * @param {import('@whiskeysockets/baileys').WASocket} sock - La instancia del bot
 * @param {string} jid - El ID del grupo (ej: 12345@g.us)
 * @param {string} user - El ID del usuario a verificar (ej: 521... @s.whatsapp.net)
 */
const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        // Buscamos al participante que coincida con el ID enviado (sea LID o Número)
        const participant = participants.find(p => p.id === user);

        // Verificamos si tiene rango de admin
        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
            return true;
        }

        return false;
    } catch (e) {
        console.error('Error en isAdmin:', e);
        return false;
    }
};

const getLegend = () => {
    const date = new Date().toLocaleDateString('es-MX');
    return `\n\n> Rex bot | ${date}`;
};

module.exports = { isAdmin, getLegend };