'use strict';

const BaseCommand = require('../base.command');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Ruta al archivo de persistencia global (compartido entre todos los grupos)
// ---------------------------------------------------------------------------
const DATA_FILE = path.join(__dirname, '../../../data/kissData.json');

/**
 * Lee el JSON de besos desde disco.
 * Si el archivo no existe o está corrupto, retorna un objeto vacío.
 * @returns {Object}
 */
function loadKissData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/**
 * Escribe el JSON de besos en disco de forma segura (write-then-rename).
 * @param {Object} data
 */
function saveKissData(data) {
    const tmp = DATA_FILE + '.tmp';
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
}

/**
 * Limpia un JID dejando solo el número (sin dominio ni recurso).
 * @param {string} jid
 * @returns {string}
 */
function cleanJid(jid) {
    return jid.split('@')[0].split(':')[0];
}

// ---------------------------------------------------------------------------
// Comando .kiss
// ---------------------------------------------------------------------------
class KissCommand extends BaseCommand {
    constructor() {
        super('.kiss', [], 'Besa a alguien y lleva un contador global de besos.');
    }

    async execute(sock, m, ctx) {
        const quotedInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedInfo || !quotedInfo.participant) {
            return await sock.sendMessage(
                ctx.jid,
                { text: 'Pendejo, responde a alguien.' },
                { quoted: m }
            );
        }

        const targetJid    = quotedInfo.participant;
        const targetNumber = cleanJid(targetJid);
        const senderNumber = cleanJid(ctx.sender);

        // ── Actualizar persistencia ──────────────────────────────────────────
        const data = loadKissData();

        if (!data[targetNumber]) {
            data[targetNumber] = { count: 0, history: [] };
        }

        data[targetNumber].count += 1;
        data[targetNumber].history.push({
            from: senderNumber,
            date: new Date().toISOString(),
        });

        saveKissData(data);

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
module.exports.loadKissData = loadKissData;
module.exports.cleanJid     = cleanJid;
