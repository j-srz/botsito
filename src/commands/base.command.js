/**
 * @typedef {Object} CommandContext
 * @property {string} jid Chat ID
 * @property {string} sender User ID
 * @property {string} pushName Display name
 * @property {string} text Normalized text body
 * @property {string} rawBody Original text body
 * @property {boolean} isGroup True if message is from a group
 * @property {string[]} args Space-separated arguments
 */

class BaseCommand {
    constructor(name, alias = [], description = '') {
        this.name = name;
        this.alias = alias;
        this.description = description;
    }

    /**
     * Virtual method to be implemented by child classes
     * @param {Object} sock Baileys socket instance
     * @param {Object} m Original message object
     * @param {CommandContext} ctx Simplified context
     */
    async execute(sock, m, ctx) {
        throw new Error(`Command '${this.name}' has not implemented the execute method.`);
    }
}

module.exports = BaseCommand;
