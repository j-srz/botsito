module.exports = {
    name: '.n',
    execute: async (msg) => {
        if (!msg.hasQuotedMsg) return;
        const quoted = await msg.getQuotedMessage();
        const customText = msg.body.substring(2).trim();
        const caption = customText || quoted.body || '';

        if (quoted.hasMedia) {
            const media = await quoted.downloadMedia();
            await msg.reply(media, undefined, { caption });
        } else {
            await msg.reply(caption);
        }
    }
};