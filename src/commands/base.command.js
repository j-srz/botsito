/**
 * @typedef {Object} CommandContext
 * @property {string} jid Chat ID
 * @property {string} sender User ID
 * @property {string} pushName Display name
 * @property {string} text Normalized text body
 * @property {string} rawBody Original text body
 * @property {boolean} isGroup True if message is from a group
 * @property {string[]} args Space-separated arguments
 * @property {Object} groupState Group RAM state
 * @property {Function} reply ctx.reply(text) sends msg formatted to current chat
 * @property {Function} react ctx.react(emoji) reacts to current message
 */

class BaseCommand {
    constructor(name, alias = [], description = '') {
        this.name = name;
        this.alias = alias;
        this.description = description;
    }

    /**
     * @param {Object} sock Baileys socket instance
     * @param {Object} m Original message object
     * @param {CommandContext} ctx Contexto aislado robusto
     */
    async execute(sock, m, ctx) {
        throw new Error(`Command '${this.name}' has not implemented the execute method.`);
    }
}

module.exports = BaseCommand;
