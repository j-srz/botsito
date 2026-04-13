const path = require('path');
const JsonRepository = require('./repositories/json.repository');

const dataDir = path.join(__dirname, '..', '..', 'data');

const db = {
    settings: new JsonRepository(path.join(dataDir, 'group_settings.json'), {}),
    antilinkLogs: new JsonRepository(path.join(dataDir, 'antilink_logs.json'), []),
    warnings: new JsonRepository(path.join(dataDir, 'antilink_warnings.json'), {}),
    ruletaCustom: new JsonRepository(path.join(dataDir, 'ruleta_custom.json'), []),
    ruletaFriendly: new JsonRepository(path.join(dataDir, 'ruleta_friendly.json'), { messageId: null, participants: [] }),
    subastas: new JsonRepository(path.join(dataDir, 'subastas_registro.json'), []),
};

module.exports = db;
