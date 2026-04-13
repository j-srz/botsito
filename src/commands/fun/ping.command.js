const BaseCommand = require('../base.command');

class PingCommand extends BaseCommand {
    constructor() {
        super('.ping', [], 'Comprueba la latencia y si el bot está en línea.');
    }

    async execute(sock, m, ctx) {
        await sock.sendMessage(ctx.jid, { text: "pong" }, { quoted: m });
    }
}

module.exports = PingCommand;
