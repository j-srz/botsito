const BaseCommand = require('../base.command');
const queueManager = require('../../core/queue.manager');

class CancelCommand extends BaseCommand {
    constructor() {
        super('.cancel', [], 'Cancela la cola de procesamiento de medios.');
    }

    async execute(sock, m, ctx) {
        await queueManager.cancelAll(sock, m);
    }
}

module.exports = CancelCommand;
