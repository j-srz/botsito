const { isAdmin } = require('../utils/helpers');

module.exports = [
    {
        name: '.kick',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!chat.isGroup) return;

            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                // Si intentan kickear al bot, se va el que mandó el mensaje
                if (quoted.fromMe) {
                    await chat.removeParticipants([contact.id._serialized]);
                    return await msg.reply('Intentaste kickearme... ¡Adiós!');
                }
                // Si el que manda el comando es admin, kickea al citado
                if (await isAdmin(chat, contact.id._serialized)) {
                    await chat.removeParticipants([quoted.author || quoted.from]);
                    await msg.reply('👢 Eliminado.');
                }
            }
        }
    },
    {
        name: '.promote',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (msg.hasQuotedMsg && await isAdmin(chat, contact.id._serialized)) {
                const quoted = await msg.getQuotedMessage();
                await chat.promoteParticipants([quoted.author || quoted.from]);
                await msg.reply('✅ Ahora es admin.');
            }
        }
    },
    {
        name: '.unpromote',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (msg.hasQuotedMsg && await isAdmin(chat, contact.id._serialized)) {
                const quoted = await msg.getQuotedMessage();
                await chat.demoteParticipants([quoted.author || quoted.from]);
                await msg.reply('❌ Ya no es admin.');
            }
        }
    },
    {
        name: '.open',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            await msg.react('🔓');
            await chat.setMessagesAdminsOnly(false);
            
            const text = `_Grupo Abierto_ 🔓\n_por_ @${contact.id.user}${getLegend()}`;
            await chat.sendMessage(text, { mentions: [contact.id._serialized] });
        }
    },
    {
        name: '.close',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            const args = msg.body.split(' ');
            let timerMs = 0;

            // Lógica de temporizador (.close 4m o .close 30s)
            if (args[1]) {
                const time = args[1];
                if (time.endsWith('m')) timerMs = parseInt(time) * 60000;
                else if (time.endsWith('s')) timerMs = parseInt(time) * 1000;
            }

            await msg.react('🔒');
            await chat.setMessagesAdminsOnly(true);
            
            const text = `_Grupo Cerrado_ 🔒\n_por_ @${contact.id.user}${getLegend()}`;
            await chat.sendMessage(text, { mentions: [contact.id._serialized] });

            if (timerMs > 0) {
                setTimeout(async () => {
                    await chat.setMessagesAdminsOnly(false);
                    await chat.sendMessage(`_Grupo Abierto automáticamente (Timer finalizado)_ 🔓${getLegend()}`);
                }, timerMs);
            }
        }
    }
];