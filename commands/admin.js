const { isAdmin } = require('../utils/helpers');

module.exports = [
    {
        name: '.kick',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                if (quoted.fromMe) {
                    await chat.removeParticipants([contact.id._serialized]);
                    return await msg.reply('Por intentar kickear al bot te vas tú.');
                }
                await chat.removeParticipants([quoted.author || quoted.from]);
            }
        }
    },
    {
        name: '.promote',
        execute: async (msg) => {
            const chat = await msg.getChat();
            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                await chat.promoteParticipants([quoted.author || quoted.from]);
            }
        }
    },
    {
        name: '.open',
        execute: async (msg) => {
            const chat = await msg.getChat();
            await chat.setMessagesAdminsOnly(false);
        }
    },
    {
        name: '.close',
        execute: async (msg) => {
            const chat = await msg.getChat();
            await chat.setMessagesAdminsOnly(true);
        }
    }
];