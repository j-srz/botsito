const isAdmin = async (chat, userSerialized) => {
    if (!chat.isGroup) return false;
    const part = chat.participants.find(p => p.id._serialized === userSerialized);
    return part && (part.isAdmin || part.isSuperAdmin);
};

// Función para la leyenda: Rex bot | DD/MM/AAAA
const getLegend = () => {
    const date = new Date().toLocaleDateString('es-MX');
    return `\n\n> Rex bot | ${date}`;
};

module.exports = { isAdmin, getLegend };