const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: '.n',
    execute: async (sock, m, body) => {
        const jid = m.key.remoteJid;

        // 1. Verificar si hay un mensaje citado
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return await sock.sendMessage(jid, { text: 'Responde a un mensaje.' }, { quoted: m });
        }

        // 2. Extraer el texto personalizado (lo que escribes después de .n)
        const customText = body.substring(2).trim();

        // 3. Detectar si el mensaje citado tiene multimedia
        const type = Object.keys(quoted)[0]; // Obtiene el tipo (imageMessage, videoMessage, etc.)
        const isMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage'].includes(type);

        if (isMedia) {
            try {
                // 4. Descargar la media (esto es lo que consume RAM, pero solo cuando se solicita)
                const buffer = await downloadMediaMessage(
                    { message: quoted },
                    'buffer',
                    {},
                    { 
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage 
                    }
                );

                // 5. Preparar el contenido a enviar
                const caption = customText || quoted[type]?.caption || '';
                const messageOptions = { quoted: m };

                if (type === 'imageMessage') {
                    await sock.sendMessage(jid, { image: buffer, caption }, messageOptions);
                } else if (type === 'videoMessage') {
                    await sock.sendMessage(jid, { video: buffer, caption }, messageOptions);
                } else if (type === 'stickerMessage') {
                    await sock.sendMessage(jid, { sticker: buffer }, messageOptions);
                } else {
                    // Para otros archivos (documentos, etc.)
                    await sock.sendMessage(jid, { document: buffer, caption, mimetype: quoted[type].mimetype, fileName: 'archivo' }, messageOptions);
                }

            } catch (err) {
                console.error('Error al descargar media:', err);
                await sock.sendMessage(jid, { text: '❌ Error al procesar la multimedia.' }, { quoted: m });
            }
        } else {
            // 6. Si solo es texto
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
            const caption = customText || quotedText || '';
            await sock.sendMessage(jid, { text: caption }, { quoted: m });
        }
    }
};