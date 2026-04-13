const db = require('../data/db');
const logger = require('../core/logger');

class AntilinkService {
    
    async checkSettings(jid) {
        const settings = await db.settings.read();
        return settings[jid]?.antilink || false;
    }

    async registerLog(data) {
        await db.antilinkLogs.pushWithLimit(data, 500);
    }

    async addWarningStrike(jid, sender) {
        let warnings = await db.warnings.read();
        if (!warnings[jid]) warnings[jid] = {};
        
        let userStrikes = warnings[jid][sender] || 0;
        userStrikes++;
        
        warnings[jid][sender] = userStrikes;
        await db.warnings.write(warnings);
        
        return userStrikes;
    }

    async resetWarningStrike(jid, sender) {
        let warnings = await db.warnings.read();
        if (warnings[jid]) {
            warnings[jid][sender] = 0;
            await db.warnings.write(warnings);
        }
    }

    async setAntilinkState(jid, state) {
        let settings = await db.settings.read();
        settings[jid] = { ...settings[jid], antilink: state };
        await db.settings.write(settings);
    }

    async getLogs(jid, limit = 10) {
        const logs = await db.antilinkLogs.read();
        return logs.filter(l => l.groupId === jid).slice(-limit);
    }
}

module.exports = new AntilinkService();
