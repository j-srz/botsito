const BaseCommand = require('../base.command');
const queueManager = require('../../core/queue.manager');
const mediaService = require('../../services/media.service');

class ImgCommand extends BaseCommand {
    constructor() {
        super('.img', [], 'Convierte el sticker a imagen/video.');
    }

    async execute(sock, m, ctx) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) return;

        const qConfig = mediaService.qualityMap[ctx.args[1]?.toLowerCase()] || mediaService.qualityMap['superlow'];
        
        await queueManager.add({
            sock, m,
            executeTask: async () => await mediaService.imageTask(sock, m, { stickerMessage: quoted.stickerMessage }, qConfig)
        });
    }
}

module.exports = ImgCommand;
