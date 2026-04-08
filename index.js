const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const allowedGroupIds = [
    // Agrega aquí los IDs de los grupos donde el bot debe responder
    "120363409112798858@g.us"
];

// 1. Configuración e instanciación
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        headless: true,
        protocolTimeout: 60000, // <--- AGREGA ESTA LÍNEA (Aumenta el tiempo de espera)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process' // <--- IMPORTANTE: Ayuda a la RAM de la Pi
        ]
    }
});

// 2. Generación de QR
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR para iniciar sesión.');
});

// 3. Confirmación de conexión
client.on('ready', () => {
    console.log('--- BOT ACTIVO Y ESCUCHANDO ---');
});

// 4. Lógica de comandos
client.on('message_create', async (msg) => {
    // Validar que el mensaje tenga texto
    if (!msg.body || typeof msg.body !== 'string') {
        return;
    }

    const text = msg.body.toLowerCase().trim();

    // Verificar permisos de admin en grupos
    const contact = await msg.getContact();
    const chat = await msg.getChat();

    if (text === '.groupid') {
        if (chat.isGroup) {
            await msg.reply(`Group ID: ${chat.id._serialized}`);
        } else {
            await msg.reply('Este comando solo funciona en grupos.');
        }
        return; // Interrumpe la cascada para no procesar las siguientes validaciones
    }

    // Solo responder en grupos permitidos
    //if (!chat.isGroup || !allowedGroupIds.includes(chat.id._serialized)) {
    //    return;

    // Especial para .kick: si responden al bot, kickear al remitente
    if (text === '.kick' && msg.hasQuotedMsg) {
        const quoted = await msg.getQuotedMessage();
        if (quoted.fromMe) {
            await chat.removeParticipants([contact.id._serialized]);
            await msg.reply('Has sido expulsado por intentar kickear al bot.');
            return;
        }
    }

    if (chat.isGroup) {
        const authorSerialized = contact.id._serialized;
        const participant = chat.participants.find(p => p.id._serialized === authorSerialized);
        if (!participant || (!participant.isAdmin && !participant.isSuperAdmin)) {
            return; // No tiene permisos, ignorar
        }
    }

    // Comando !ping
    if (text === '!ping') {
        await msg.reply('pong');
    }

    // Comando .1500
    if (text === '.1500') {
        await msg.reply('milquinientos');
    }


    // Comando .vtalv
    if (text === '.vtalv') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const quotedContact = await quotedMsg.getContact();
            const userName = quotedContact.pushname || quotedContact.number;
            
            const senderContact = await msg.getContact();
            const senderName = senderContact.pushname || senderContact.number;

            await msg.reply(`\`${senderName}\` _dice:_ \`${userName}\` vtalv ⊂(◉‿◉)つ`);
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }

// Requiere: const { MessageMedia } = require('whatsapp-web.js');

if (text === '.wassaa') {
    if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        const quotedContact = await quotedMsg.getContact();
        const userName = quotedContact.pushname || quotedContact.number;
        
        const senderContact = await msg.getContact();
        const senderName = senderContact.pushname || senderContact.number;

        // Modificación a .mp4 para satisfacer la propiedad sendVideoAsGif
        const videoUrl = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhzbTZjNTk0N3o0aXQ4bTRmaTV2djFvYm04N3Y1MzVxOTFkNjF4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3hxk2aOwWmfOU/giphy.mp4';
        
        try {
            const media = await MessageMedia.fromUrl(videoUrl);
            const captionText = `\`${userName}\` wassaaa!!!`;
            
            await msg.reply(media, undefined, { 
                sendVideoAsGif: true, 
                caption: captionText 
            });
        } catch (error) {
            await msg.reply('Error: Imposible resolver el recurso multimedia remoto.');
        }
    } else {
        await msg.reply('Responde a un mensaje para usar este comando.');
    }
}

    // Comando !user
    if (text === '!user') {
        let info = `*Usuario:* ${contact.pushname || 'Sin nombre'}\n`;
        info += `*Número:* ${contact.number}\n`;

        if (chat.isGroup) {
            const authorSerialized = contact.id._serialized;
            const participant = chat.participants.find(p => p.id._serialized === authorSerialized);
            
            if (participant) {
                let rol = 'Miembro';
                if (participant.isAdmin) rol = 'Administrador';
                if (participant.isSuperAdmin) rol = 'Super Administrador';
                info += `*Rol:* ${rol}`;
            } else {
                info += `*Rol:* Indeterminado (Reintenta en un momento)`;
            }
        } else {
            info += `*Rol:* N/A (Chat privado)`;
        }

        await msg.reply(info);
    }

    // Comando .open
    if (text === '.open') {
        await chat.setMessagesAdminsOnly(false);
        await msg.reply('Grupo abierto: todos pueden enviar mensajes.');
    }

    // Comando .close
    if (text === '.close') {
        await chat.setMessagesAdminsOnly(true);
        await msg.reply('Grupo cerrado: solo administradores pueden enviar mensajes.');
    }

    // Comando .promote
    if (text === '.promote') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            try {
                await chat.promoteParticipants([targetContact.id._serialized]);
                await msg.reply(`${targetContact.pushname || targetContact.number} ha sido promovido a administrador.`);
            } catch (error) {
                await msg.reply('Error al promover al usuario.');
            }
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }

    // Comando .unpromote
    if (text === '.unpromote') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            try {
                await chat.demoteParticipants([targetContact.id._serialized]);
                await msg.reply(`${targetContact.pushname || targetContact.number} ha sido degradado de administrador.`);
            } catch (error) {
                await msg.reply('Error al degradar al usuario.');
            }
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }

    // Comando .kick
    if (text === '.kick') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            await chat.removeParticipants([targetContact.id._serialized]);
            await msg.reply(`${targetContact.pushname || targetContact.number} ha sido expulsado del grupo.`);
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }

    // Comando .promote
    if (text === '.promote') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            try {
                await chat.promoteParticipants([targetContact.id._serialized]);
                await msg.reply(`${targetContact.pushname || targetContact.number} ha sido promovido a administrador.`);
            } catch (error) {
                await msg.reply('Error al promover al usuario.');
            }
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }

    // Comando .kiss
    if (text === '.kiss') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            try {
                const filePath = path.join(__dirname, 'media', 'kiss.mp4');
                const fileData = fs.readFileSync(filePath);
                const media = new MessageMedia('video/mp4', fileData.toString('base64'), 'kiss.mp4');
                const senderName = contact.pushname || contact.number;
                const targetName = targetContact.pushname || targetContact.number;
                const caption = `\`${senderName}\` _besó a_ \`${targetName}\` 💋`;
                await chat.sendMessage(media, {
                    caption,
                    sendMediaAsDocument: false,
                    sendVideoAsGif: true
                });
            } catch (error) {
                console.log('Error al enviar kiss.mp4:', error);
                const senderName = contact.pushname || contact.number;
                const targetName = targetContact.pushname || targetContact.number;
                await msg.reply(`\`${senderName}\` _besó a_ \`${targetName}\` 💋`);
            }
        } else {
            await msg.reply('Pendejo');
        }
    }
    // Comando .tickle
    if (text === '.tickle') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const targetContact = await quotedMsg.getContact();
            await msg.reply(`*${contact.pushname} hace cosquillas a ${targetContact.pushname || targetContact.number}*`);
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }
    // Comando .todos
    if (text === '.todos') {
        const mentions = chat.participants
            .map(p => p.id && p.id._serialized)
            .filter(Boolean);
        const names = chat.participants
            .map(p => `@${p.id && p.id.user}`)
            .join('\n');
        await chat.sendMessage(
            `*Llamando rexitos*
${names}

*Llamados*`,
            { mentions }
        );
    }

    // Comando .n
    if (text === '.n' || text.startsWith('.n ')) {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            
            // Extracción del argumento omitiendo los primeros 2 caracteres (".n")
            const customText = msg.body.substring(2).trim();
            // Lógica de jerarquía: Argumento de usuario sobreescribe el texto original
            const finalText = customText !== '' ? customText : (quotedMsg.body || '');

            console.log('Comando .n ejecutado');
            console.log('hasMedia:', quotedMsg.hasMedia);
            
            if (quotedMsg.hasMedia) {
                try {
                    console.log('Descargando media...');
                    const media = await quotedMsg.downloadMedia();
                    console.log('Media descargada, enviando...');
                    
                    await msg.reply(media, undefined, { caption: finalText });
                    
                    console.log('Media enviada exitosamente');
                } catch (error) {
                    console.log('Error al enviar media:', error);
                    await msg.reply('Error: No se pudo reenviar el recurso multimedia.');
                }
            } else {
                console.log('No tiene media, enviando solo texto');
                await msg.reply(finalText);
            }
        } else {
            await msg.reply('Responde a un mensaje para usar este comando.');
        }
    }
});



// 5. Inicialización
client.initialize();
