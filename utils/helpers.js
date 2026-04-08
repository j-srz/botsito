const isAdmin = async (chat, userSerialized) => {
    if (!chat.isGroup) return false;
    const part = chat.participants.find(p => p.id._serialized === userSerialized);
    return part && (part.isAdmin || part.isSuperAdmin);
};
module.exports = { isAdmin };