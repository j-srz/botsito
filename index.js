require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.platform === 'linux' ? '/usr/bin/chromium' : undefined,
        headless: true,
        protocolTimeout: 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
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
client.on('ready', () => console.log('✅ BOTSITO ONLINE'));

client.on('message_create', async (msg) => {
    if (!msg.body || typeof msg.body !== 'string') return;
    const text = msg.body.toLowerCase().trim();

    // Comando Global de Metadata (Sin validaciones)
    if (text === '!get_internal_metadata_id_x77') {
        const chat = await msg.getChat();
        return await msg.reply(`ID: ${chat.id._serialized}`);
    }

    const cmdName = Array.from(client.commands.keys()).find(n => text === n || text.startsWith(n + ' '));
    if (cmdName) {
        try {
            await client.commands.get(cmdName).execute(msg, client);
        } catch (err) {
            console.error(`Error en ${cmdName}:`, err);
        }
    }
});

client.initialize();