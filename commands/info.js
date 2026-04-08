module.exports = {
    name: '!user',
    execute: async (msg) => {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        let info = `*Usuario:* ${contact.pushname || 'Sin nombre'}\n*Número:* ${contact.number}\n`;
        if (chat.isGroup) {
            const part = chat.participants.find(p => p.id._serialized === contact.id._serialized);
            let rol = part?.isAdmin ? 'Administrador' : (part?.isSuperAdmin ? 'Super Administrador' : 'Miembro');
            info += `*Rol:* ${rol}`;
        }
        await msg.reply(info);
    }
};