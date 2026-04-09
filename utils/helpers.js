/**
 * Verifica si un usuario es administrador en un grupo usando Baileys
 * @param {import('@whiskeysockets/baileys').WASocket} sock - La instancia del bot
 * @param {string} jid - El ID del grupo (ej: 12345@g.us)
 * @param {string} user - El ID del usuario a verificar (ej: 521... @s.whatsapp.net)
 */
const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;

        // Obtenemos la metadata del grupo (participantes y sus rangos)
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        // Buscamos al usuario en la lista de participantes
        const participant = participants.find(p => p.id === user);

        // En Baileys, el rango es 'admin' o 'superadmin'
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        console.error('Error en isAdmin:', e);
        return false;
    }
};

/**
 * Genera la firma del bot con la fecha actual
 */
const getLegend = () => {
    const date = new Date().toLocaleDateString('es-MX');
    return `\n\n> Rex bot | ${date}`;
};

module.exports = { isAdmin, getLegend };