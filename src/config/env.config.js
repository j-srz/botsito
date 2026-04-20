require('dotenv').config();

const env = {
    ALLOWED_GROUPS: (process.env.ALLOWED_GROUPS || "")
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0),
    OWNER_JID: process.env.OWNER_JID || '524492842300@s.whatsapp.net',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;
