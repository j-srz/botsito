const { isAdmin, getLegend } = require('../utils/helpers');

module.exports = [
    {
        name: '.kick',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!chat.isGroup) return;

            if (msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                if (quoted.fromMe) {
                    await chat.removeParticipants([contact.id._serialized]);
                    return await msg.reply('Intentaste kickearme... ¡Adiós!');
                }
                if (await isAdmin(chat, contact.id._serialized)) {
                    await chat.removeParticipants([quoted.author || quoted.from]);
                    await msg.react('👢');
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
                await msg.react('🆙');
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
                await msg.react('⬇️');
            }
        }
    },
    {
        name: '.open',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            await chat.setMessagesAdminsOnly(false);
            await msg.react('🔓');
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
            
            // Si NO pones tiempo, se cierra al instante
            if (!args[1]) {
                await chat.setMessagesAdminsOnly(true);
                await msg.react('🔒');
                const text = `_Grupo Cerrado_ 🔒\n_por_ @${contact.id.user}${getLegend()}`;
                return await chat.sendMessage(text, { mentions: [contact.id._serialized] });
            }

            // Si hay tiempo (ej: .close 5m)
            const timeStr = args[1];
            let timerMs = 0;
            if (timeStr.endsWith('m')) timerMs = parseInt(timeStr) * 60000;
            else if (timeStr.endsWith('s')) timerMs = parseInt(timeStr) * 1000;

            if (timerMs > 0) {
                await msg.react('⏳');
                await msg.reply(`*Cierre programado:* Este grupo se cerrará en ${timeStr}. 🛡️`);

                // PROGRAMACIÓN: Solo hace el cierre DESPUÉS del tiempo
                setTimeout(async () => {
                    await chat.setMessagesAdminsOnly(true);
                    const text = `_Cierre Automático_ 🔒\n_Tiempo cumplido (${timeStr})_${getLegend()}`;
                    await chat.sendMessage(text);
                }, timerMs);
            }
        }
    }
];