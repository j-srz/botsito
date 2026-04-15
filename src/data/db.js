const path = require('path');
const JsonRepository = require('./repositories/json.repository');

const dataDir = path.join(__dirname, '..', '..', 'data');

const db = {
    settings: new JsonRepository(path.join(dataDir, 'group_settings.json'), {}),
    antilinkLogs: new JsonRepository(path.join(dataDir, 'antilink_logs.json'), []),
    warnings: new JsonRepository(path.join(dataDir, 'antilink_warnings.json'), {}),
    subastas: new JsonRepository(path.join(dataDir, 'subastas_registro.json'), []),
    groupsDirectory: new JsonRepository(path.join(dataDir, 'groups_directory.json'), {}),
    remoteSessions: new JsonRepository(path.join(dataDir, 'remote_sessions.json'), {}),
    messageLogs: new JsonRepository(path.join(dataDir, 'message_logs.json'), {}),
    pinnedMessages: new JsonRepository(path.join(dataDir, 'pinned_messages.json'), {}),
    kissData: new JsonRepository(path.join(dataDir, 'kissData.json'), {}),
    disabledCommands: new JsonRepository(path.join(dataDir, 'disabled_commands.json'), {}),
};

module.exports = db;
