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
        name: '.close',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            const args = msg.body.split(' ');
            const timeStr = args[1]; // Aquí puede no haber nada

            // CASO 1: Cierre instantáneo (Si no escribiste tiempo)
            if (!timeStr) {
                await chat.setMessagesAdminsOnly(true);
                await msg.react('🔒');
                const text = `_Grupo Cerrado_ 🔒\n_por_ @${contact.id.user}${getLegend()}`;
                return await chat.sendMessage(text, { mentions: [contact.id._serialized] });
            }

            // CASO 2: Cierre programado (Si pusiste algo como 5m)
            let timerMs = 0;
            if (timeStr.endsWith('m')) timerMs = parseInt(timeStr) * 60000;
            else if (timeStr.endsWith('s')) timerMs = parseInt(timeStr) * 1000;

            if (timerMs > 0) {
                await msg.react('⏳');
                await msg.reply(`*Cierre programado:* Este grupo se cerrará en ${timeStr}. 🛡️`);

                setTimeout(async () => {
                    // Verificamos de nuevo el chat por si acaso
                    const freshChat = await msg.getChat();
                    await freshChat.setMessagesAdminsOnly(true);
                    await freshChat.sendMessage(`_Cierre Automático_ 🔒\n_Tiempo cumplido (${timeStr})_${getLegend()}`);
                }, timerMs);
            } else {
                await msg.reply('❌ Tiempo no válido. Usa ej: `.close 5m` o `.close 30s`');
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
    }
];