/**
 * Verifica si un usuario es administrador en un grupo usando Baileys
 * @param {import('@whiskeysockets/baileys').WASocket} sock - La instancia del bot
 * @param {string} jid - El ID del grupo (ej: 12345@g.us)
 * @param {string} user - El ID del usuario a verificar (ej: 521...@s.whatsapp.net)
 */
const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        const participant = participants.find(p => p.id === user);

        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
            return true;
        }

        return false;
    } catch (e) {
        console.error('Error en isAdmin:', e);
        return false;
    }
};

/**
 * Genera la leyenda dinámica con el nombre del bot y fecha natural
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Para extraer el nombre del bot
 */
const getLegend = (sock) => {
    // Extraemos el nombre configurado en el WhatsApp del bot
    const botName = sock?.user?.name || 'Rex Bot';

    // Formato de fecha natural: "9 de abril de 2026"
    const fechaNatural = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `\n\n> ${botName} | ${fechaNatural}`;
};

module.exports = { isAdmin, getLegend };