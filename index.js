require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const { isAdmin } = require('./utils/helpers'); 

const gruposAdmitidos = process.env.ALLOWED_GROUPS 
    ? process.env.GRUPOS_ADMITIDOS.split(',').map(id => id.trim()) 
    : [];

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.platform === 'linux' ? '/usr/bin/chromium' : undefined,
        headless: true,
        protocolTimeout: 60000,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-gpu', 
            '--no-zygote', 
            '--single-process'
        ]
    }
});

client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    if (Array.isArray(cmd)) {
        cmd.forEach(c => client.commands.set(c.name, c));
    } else {
        client.commands.set(cmd.name, cmd);
    }
}

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ REX BOT ONLINE - FILTROS ACTIVADOS'));

client.on('message_create', async (msg) => {
    if (!msg.body || typeof msg.body !== 'string') return;
    const text = msg.body.toLowerCase().trim();

    // Comando de Metadata (También protegido)
    if (text === '!get_internal_metadata_id_x77') {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        if (chat.isGroup && !(await isAdmin(chat, contact.id._serialized))) return;
        return await msg.reply(`ID: ${chat.id._serialized}`);
    }

    const cmdName = Array.from(client.commands.keys()).find(n => text === n || text.startsWith(n + ' '));
    
    if (cmdName) {
        try {
            const chat = await msg.getChat();
            const contact = await msg.getContact();

            if (chat.isGroup) {
                // A. BLOQUEO GENERAL: Solo admins usan el bot
                const authorized = await isAdmin(chat, contact.id._serialized);
                if (!authorized) return; 

                // B. FILTRO DE WHITELIST (.env)
                // Si NO es el comando '.id' y el grupo NO está en tu lista, se ignora.
                if (cmdName !== '.id' && !gruposAdmitidos.includes(chat.id._serialized)) {
                    return; 
                }
            }

            // Si pasó los filtros de arriba, se ejecuta el comando
            await client.commands.get(cmdName).execute(msg, client);
        } catch (err) {
            console.error(err);
            await msg.react('❌');
        }
    }
});

client.initialize();