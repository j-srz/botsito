const BaseCommand = require('../base.command');
const path = require('path');
const fs = require('fs');
const { getLegend } = require('../../utils/formatter');

class PapoiCommand extends BaseCommand {
    constructor() {
        super('.papoi', [], 'papoii 👉👈');
    }

    async execute(sock, m, ctx) {
        const imgPath = path.resolve(__dirname, "../../../../media/papoi.jpg");

        if (!fs.existsSync(imgPath)) {
            return await sock.sendMessage(ctx.jid, { 
                text: "❌ No encontré papoi.jpg en la carpeta media." 
            });
        }

        await sock.sendMessage(ctx.jid, { 
            image: fs.readFileSync(imgPath), 
            caption: "papoii 👉👈" + getLegend(sock) 
        }, { quoted: m });

        await sock.sendMessage(ctx.jid, { 
            react: { text: '🍆', key: m.key } 
        });
    }
}

module.exports = PapoiCommand;
