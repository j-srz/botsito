const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');

module.exports = [
    {
        name: '.wassaa',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const videoUrl = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4';
            try {
                const media = await MessageMedia.fromUrl(videoUrl);
                await msg.reply(media, undefined, { sendVideoAsGif: true });
            } catch (e) { console.error(e); }
        }
    },
    {
        name: '.kiss',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return msg.reply('Pendejo');
            try {
                const media = MessageMedia.fromFilePath(path.join(__dirname, '../media/kiss.mp4'));
                await msg.reply(media, undefined, { sendVideoAsGif: true, caption: '💋' });
            } catch (e) { await msg.reply('💋'); }
        }
    },
    {
        name: '.vtalv',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const quotedMsg = await msg.getQuotedMessage();
            const quotedContact = await quotedMsg.getContact();
            const senderContact = await msg.getContact();
            const target = quotedContact.pushname || quotedContact.number;
            const sender = senderContact.pushname || senderContact.number;
            await msg.reply(`\`${sender}\` _dice:_ \`${target}\` vtalv ⊂(◉‿◉)つ`);
        }
    },
    {
        name: '.todos',
        execute: async (msg) => {
            const chat = await msg.getChat();
            if (!chat.isGroup) return;
            const mentions = chat.participants.map(p => p.id._serialized);
            await chat.sendMessage('Llamando a todos los rexitos...', { mentions });
        }
    }
];