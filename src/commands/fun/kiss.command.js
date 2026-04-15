'use strict';

const BaseCommand = require('../base.command');
const path = require('path');
const fs = require('fs');
const db = require('../../data/db');
const { cleanID } = require('../../utils/formatter');

class KissCommand extends BaseCommand {
    constructor() {
        super('.kiss', [], 'Besa a alguien y lleva un contador global de besos.');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = this.getQuotedInfo(m);
        if (!quotedInfo || !quotedInfo.participant) {
            return await sock.sendMessage(
                ctx.jid,
                { text: 'Pendejo, responde a alguien.' },
                { quoted: m }
            );
        }

        const targetJid    = quotedInfo.participant;
        const targetNumber = cleanID(targetJid);
        const senderNumber = cleanID(ctx.sender);

        // ── Actualizar persistencia ──────────────────────────────────────────
        const data = await db.kissData.read();

        if (!data[targetNumber]) {
            data[targetNumber] = { count: 0, history: [] };
        }

        data[targetNumber].count += 1;
        data[targetNumber].history.push({
            from: senderNumber,
            date: new Date().toISOString(),
        });

        await db.kissData.write(data);

        const totalKisses = data[targetNumber].count;

        // ── Enviar mensaje ───────────────────────────────────────────────────
        const caption =
            `\`${ctx.pushName}\` _besó a_ @${targetNumber} 💋` +
            ` ya he sido besado *${totalKisses}* ${totalKisses === 1 ? 'vez' : 'veces'}`;

        const videoPath = path.join(__dirname, '../../../media/kiss.mp4');

        try {
            await sock.sendMessage(
                ctx.jid,
                {
                    video: fs.readFileSync(videoPath),
                    gifPlayback: true,
                    caption,
                    mentions: [targetJid],
                },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(
                ctx.jid,
                { text: caption, mentions: [targetJid] },
                { quoted: m }
            );
        }
    }
}

module.exports = KissCommand;
