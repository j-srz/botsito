const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const participant = participants.find(p => p.id === user);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        console.error('Error en isAdmin:', e);
        return false;
    }
};

const getLegend = (sock) => {
    // Extraemos el nombre configurado en el WhatsApp del bot
    const botName = sock?.user?.name || 'Rex Bot';

    // Formato de fecha natural sin año: "9 de abril"
    const fechaNatural = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long'
    });

    return `\n\n> ${botName} | ${fechaNatural}`;
};

module.exports = { isAdmin, getLegend };