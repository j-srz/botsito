require('dotenv').config();

if (!process.env.OWNER_JID) {
    throw new Error('[FATAL] OWNER_JID no está definido en el .env. El bot no puede arrancar sin un owner configurado.');
}

const env = {
    OWNER_JID: process.env.OWNER_JID,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;
