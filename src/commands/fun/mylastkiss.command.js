'use strict';

const BaseCommand = require('../base.command');
const { loadKissData, cleanJid } = require('./kiss.command');

// ---------------------------------------------------------------------------
// Comando .mylastkiss
// ---------------------------------------------------------------------------
class MyLastKissCommand extends BaseCommand {
    constructor() {
        super('.mylastkiss', [], 'Muestra quién fue la última persona que te besó.');
    }

    async execute(sock, m, ctx) {
        const myNumber = cleanJid(ctx.sender);
        const data     = loadKissData();
        const record   = data[myNumber];

        if (!record || record.history.length === 0) {
            return await sock.sendMessage(
                ctx.jid,
                { text: 'Nadie te ha besado aún 😔' },
                { quoted: m }
            );
        }

        const lastKiss  = record.history[record.history.length - 1];
        const kisserJid = `${lastKiss.from}@s.whatsapp.net`;
        const kisserNum = lastKiss.from;

        await sock.sendMessage(
            ctx.jid,
            {
                text: `Aún recuerdo la última vez que me besó @${kisserNum} 💋`,
                mentions: [kisserJid],
            },
            { quoted: m }
        );
    }
}

module.exports = MyLastKissCommand;
