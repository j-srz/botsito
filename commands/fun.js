const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
// IMPORTANTE: Aquí importamos ambos helpers
const { isAdmin, getLegend } = require('../utils/helpers'); 

module.exports = [
    { name: '.ping', execute: async (msg) => msg.reply('pong') },
    { name: '.1500', execute: async (msg) => msg.reply('milquinientos') },
    {
        name: '.vtalv',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return msg.reply('Responde a un mensaje.');
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            const target = qCon.pushname || qCon.number;
            const sender = sCon.pushname || sCon.number;
            await msg.reply(`\`${sender}\` _dice:_ \`${target}\` vtalv ⊂(◉‿◉)つ`);
        }
    },
    {
        name: '.wassaa',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const target = qCon.pushname || qCon.number;
            const videoUrl = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4';
            try {
                const media = await MessageMedia.fromUrl(videoUrl);
                await msg.reply(media, undefined, { sendVideoAsGif: true, caption: `\`${target}\` wassaaa!!!` });
            } catch (e) { await msg.reply('Error con el video.'); }
        }
    },
    {
        name: '.kiss',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return msg.reply('Pendejo');
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            const target = qCon.pushname || qCon.number;
            const sender = sCon.pushname || sCon.number;
            try {
                const media = MessageMedia.fromFilePath(path.join(__dirname, '../media/kiss.mp4'));
                await msg.reply(media, undefined, { sendVideoAsGif: true, caption: `\`${sender}\` _besó a_ \`${target}\` 💋` });
            } catch (e) { await msg.reply(`\`${sender}\` _besó a_ \`${target}\` 💋`); }
        }
    },
    {
        name: '.tickle',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return;
            const quoted = await msg.getQuotedMessage();
            const qCon = await quoted.getContact();
            const sCon = await msg.getContact();
            await msg.reply(`*${sCon.pushname} hace cosquillas a ${qCon.pushname || qCon.number}*`);
        }
    },
    {
        name: '.todos',
        execute: async (msg) => {
            const chat = await msg.getChat();
            if (!chat.isGroup) return;
            await msg.react('📣');

            // Forzamos IDs como strings para evitar error t.replace
            const mentions = chat.participants.map(p => String(p.id._serialized));
            let list = `*Llamando rexitos*\n╔ ========\n`;

            for (let participant of chat.participants) {
                list += `║ 🦖 @${participant.id.user}\n`;
            }

            list += `╚ ========\n*Llamados*${getLegend()}`;
            await chat.sendMessage(list, { mentions });
        }
    }, 
    {
        name: '.smoke',
        execute: async (msg) => {
            await msg.react('🚬');
            const contact = await msg.getContact();
            const gifUrl = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExank0a3B5ODl2dTJlbm5rMGw1MzVvcWswbzVnY2twYmNneDF2NmZkaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpAPQVW9lWnWU/giphy.gif';
            try {
                const media = await MessageMedia.fromUrl(gifUrl);
                await msg.reply(media, undefined, { 
                    sendVideoAsGif: true, 
                    caption: `💨 @${contact.id.user}  ${getLegend()}`,
                    mentions: [String(contact.id._serialized)]
                });
            } catch (e) { await msg.reply(`💨 @${contact.id.user} dándose un toque...`); }
        }
    },
    {
        name: '.gg',
        execute: async (msg) => {
            if (!msg.hasQuotedMsg) return; 
            const quoted = await msg.getQuotedMessage();
            const winnerCon = await quoted.getContact();
            const adminCon = await msg.getContact();
            const chat = await msg.getChat();
            
            const amountMatch = quoted.body.match(/\d+/);
            const amount = amountMatch ? parseInt(amountMatch[0]) : 0;

            await quoted.react('🏆');
            //await msg.react('💾'); 

            const winnerEntry = {
                fecha: new Date().toLocaleString('es-MX'),
                admin_nombre: adminCon.pushname || adminCon.number,
                admin_id: adminCon.id._serialized,
                ganador_nombre: winnerCon.pushname || winnerCon.number,
                ganador_id: winnerCon.id._serialized,
                monto: amount,
                grupo: chat.name
            };

            const dataPath = path.join(__dirname, '../data');
            const filePath = path.join(dataPath, 'subastas_registro.json');

            try {
                if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
                let registro = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : [];
                registro.push(winnerEntry);
                fs.writeFileSync(filePath, JSON.stringify(registro, null, 2));
            } catch (err) { console.error(err); }
        }
    },
    {
        name: '.resumen',
        execute: async (msg) => {
            const chat = await msg.getChat();
            const contact = await msg.getContact();
            // Ahora isAdmin sí funcionará porque lo importamos arriba
            if (!(await isAdmin(chat, contact.id._serialized))) return;

            const filePath = path.join(__dirname, '../data/subastas_registro.json');
            if (!fs.existsSync(filePath)) return await msg.reply('Sin registros aún.');

            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const stats = {};
                data.forEach(p => {
                    if (!stats[p.ganador_id]) {
                        stats[p.ganador_id] = { nombre: p.ganador_nombre, victorias: 0, total: 0 };
                    }
                    stats[p.ganador_id].victorias += 1;
                    stats[p.ganador_id].total += p.monto;
                });

                const ranking = Object.values(stats).sort((a, b) => b.victorias - a.victorias);
                let res = `*📊 RESUMEN DE SUBASTAS*\n_Top Ganadores_\n\n`;
                ranking.forEach((user, i) => {
                    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤';
                    res += `${medalla} *${user.nombre}*\n`;
                    res += `   └ Wins: ${user.victorias} | Total: $${user.total}\n`;
                });

                await msg.reply(res + getLegend());
            } catch (err) { await msg.reply('Error al procesar resumen.'); }
        }
    },
];