require('dotenv').config();

const env = {
    OWNER_JID: process.env.OWNER_JID || '524492842300@s.whatsapp.net',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;
