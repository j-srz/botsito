require('dotenv').config();

const env = {
    ALLOWED_GROUPS: (process.env.ALLOWED_GROUPS || "")
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0),
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;
