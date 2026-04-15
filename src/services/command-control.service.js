const db = require('../data/db');
const logger = require('../core/logger');

/**
 * Servicio de control de comandos por grupo.
 * Gestiona la activación/desactivación dinámica de comandos con persistencia JSON.
 */

// Comandos que NUNCA se pueden desactivar (protección del sistema)
const PROTECTED_COMMANDS = new Set([
    'disable', 'enable', 'disabled', 'cm', 'cm-sc', 'id'
]);

class CommandControlService {

    /**
     * Verifica si un comando está desactivado en un grupo.
     * @param {string} groupJid - ID del grupo
     * @param {string} commandName - Nombre del comando sin punto (ej: "ruletaban")
     * @returns {Promise<boolean>}
     */
    async isDisabled(groupJid, commandName) {
        try {
            const data = await db.disabledCommands.read();
            const group = data[groupJid];
            if (!group || !Array.isArray(group.disabledCommands)) return false;
            return group.disabledCommands.includes(commandName);
        } catch (e) {
            logger.error('CommandControlService.isDisabled error:', e);
            return false;
        }
    }

    /**
     * Desactiva un comando en un grupo.
     * @returns {{ success: boolean, reason?: string }}
     */
    async disableCommand(groupJid, commandName) {
        const normalized = commandName.toLowerCase().replace(/^\./, '');

        if (PROTECTED_COMMANDS.has(normalized)) {
            return { success: false, reason: 'protected' };
        }

        try {
            const data = await db.disabledCommands.read();
            if (!data[groupJid]) data[groupJid] = { disabledCommands: [] };
            if (!Array.isArray(data[groupJid].disabledCommands)) data[groupJid].disabledCommands = [];

            if (data[groupJid].disabledCommands.includes(normalized)) {
                return { success: false, reason: 'already_disabled' };
            }

            data[groupJid].disabledCommands.push(normalized);
            await db.disabledCommands.write(data);
            return { success: true };
        } catch (e) {
            logger.error('CommandControlService.disableCommand error:', e);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Reactiva un comando en un grupo.
     * @returns {{ success: boolean, reason?: string }}
     */
    async enableCommand(groupJid, commandName) {
        const normalized = commandName.toLowerCase().replace(/^\./, '');

        try {
            const data = await db.disabledCommands.read();
            if (!data[groupJid] || !Array.isArray(data[groupJid].disabledCommands)) {
                return { success: false, reason: 'not_disabled' };
            }

            const idx = data[groupJid].disabledCommands.indexOf(normalized);
            if (idx === -1) {
                return { success: false, reason: 'not_disabled' };
            }

            data[groupJid].disabledCommands.splice(idx, 1);
            await db.disabledCommands.write(data);
            return { success: true };
        } catch (e) {
            logger.error('CommandControlService.enableCommand error:', e);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Obtiene la lista de comandos desactivados en un grupo.
     * @returns {Promise<string[]>}
     */
    async getDisabledList(groupJid) {
        try {
            const data = await db.disabledCommands.read();
            const group = data[groupJid];
            if (!group || !Array.isArray(group.disabledCommands)) return [];
            return group.disabledCommands;
        } catch (e) {
            logger.error('CommandControlService.getDisabledList error:', e);
            return [];
        }
    }

    /**
     * Verifica si un nombre de comando está protegido.
     */
    isProtected(commandName) {
        return PROTECTED_COMMANDS.has(commandName.toLowerCase().replace(/^\./, ''));
    }
}

module.exports = new CommandControlService();
