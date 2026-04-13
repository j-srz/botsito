const BaseCommand = require('../base.command');
const queueManager = require('../../core/queue.manager');
const mediaService = require('../../services/media.service');

class SCommand extends BaseCommand {
    constructor() {
        super('.s', [], 'Convierte la imagen/video a sticker.');
    }

    async execute(sock, m, ctx) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
        const type = Object.keys(quoted)[0];
        if (type !== 'imageMessage' && type !== 'videoMessage') return;

        const qConfig = mediaService.qualityMap[ctx.args[1]?.toLowerCase()] || mediaService.qualityMap['superlow'];
        
        await queueManager.add({
            sock, m,
            executeTask: async () => await mediaService.stickerTask(sock, m, { [type]: quoted[type] }, qConfig)
        });
    }
}

module.exports = SCommand;
