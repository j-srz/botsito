const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

module.exports = [
    { name: '!ping', execute: async (msg) => msg.reply('pong') },
    { name: '.1500', execute: async (msg) => msg.reply('milquinientos') },
    {
        name: '.vtalv',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return msg.reply('Responde a un mensaje.');
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            const target = qCon.pushname || qCon.number;
            const sender = sCon.pushname || sCon.number;
            await msg.reply(`\`${sender}\` _dice:_ \`${target}\` vtalv ⊂(◉‿◉)つ`);
        }
    },
    {
        name: '.wassaa',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const target = qCon.pushname || qCon.number;
            const videoUrl = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4';
            try {
                const media = await MessageMedia.fromUrl(videoUrl);
                await msg.reply(media, undefined, { sendVideoAsGif: true, caption: `\`${target}\` wassaaa!!!` });
            } catch (e) { await msg.reply('Error con el video.'); }
        }
    },
    {
        name: '.kiss',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return msg.reply('Pendejo');
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            const target = qCon.pushname || qCon.number;
            const sender = sCon.pushname || sCon.number;
            try {
                const media = MessageMedia.fromFilePath(path.join(__dirname, '../media/kiss.mp4'));
                await msg.reply(media, undefined, { sendVideoAsGif: true, caption: `\`${sender}\` _besó a_ \`${target}\` 💋` });
            } catch (e) { await msg.reply(`\`${sender}\` _besó a_ \`${target}\` 💋`); }
        }
    },
    {
        name: '.tickle',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            await msg.reply(`*${sCon.pushname} hace cosquillas a ${qCon.pushname || qCon.number}*`);
        }
    },
    {
        name: '.todos',
        execute: async (msg) => {
            const chat = await msg.getChat();
            if (!chat.isGroup) return;
            const mentions = chat.participants.map(p => p.id._serialized);
            const names = chat.participants.map(p => `@${p.id.user}`).join('\n');
            await chat.sendMessage(`*Llamando rexitos*\n${names}\n\n*Llamados*`, { mentions });
        }
    }
];