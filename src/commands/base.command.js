/**
 * @typedef {Object} CommandContext
 * @property {string} jid Chat ID
 * @property {string} sender User ID
 * @property {string} pushName Display name
 * @property {string} text Normalized text body
 * @property {string} rawBody Original text body
 * @property {boolean} isGroup True if message is from a group
 * @property {boolean} isAdmin True if sender is group admin
 * @property {boolean} isBotAdmin True if bot is group admin
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

    // ─── GUARDS ──────────────────────────────────────────

    /**
     * Lanza si el mensaje no proviene de un grupo.
     */
    requireGroup(ctx) {
        if (!ctx.isGroup) {
            throw { silent: true };
        }
    }

    /**
     * Lanza si el mensaje NO es un chat privado (DM).
     */
    requirePrivate(ctx) {
        if (ctx.isGroup) {
            throw { silent: true };
        }
    }

    /**
     * Lanza si el sender no es el Owner del bot.
     */
    requireOwner(ctx) {
        const commercialService = require('../services/commercial.service');
        const logger = require('../core/logger');
        if (!commercialService.isOwner(ctx.sender)) {
            logger.warn(`[SECURITY] Intento no autorizado de comando Owner: ${this.name} | Sender: ${ctx.sender}`);
            throw { reply: '❌ Este comando es exclusivo del propietario del sistema.' };
        }
    }

    /**
     * Lanza si el sender no es Owner ni Admin comercial (async).
     * Usar con: await this.requireCommercialAdmin(ctx)
     */
    async requireCommercialAdmin(ctx) {
        const commercialService = require('../services/commercial.service');
        const logger = require('../core/logger');
        const isAdmin = await commercialService.isCommercialAdmin(ctx.sender);
        if (!isAdmin) {
            logger.warn(`[SECURITY] Acceso denegado a comando admin: ${this.name} | Sender: ${ctx.sender}`);
            throw { reply: '❌ No tienes permisos para usar este comando.' };
        }
    }

    /**
     * Lanza si el sender no es admin del grupo.
     * Envía feedback automático al usuario.
     */
    requireAdmin(ctx) {
        this.requireGroup(ctx);
        if (!ctx.isAdmin) {
            throw { reply: '❌ Solo los *administradores* pueden usar este comando.' };
        }
    }

    /**
     * Lanza si el bot no es admin del grupo.
     * Envía feedback automático al usuario.
     */
    requireBotAdmin(ctx) {
        this.requireGroup(ctx);
        if (!ctx.isBotAdmin) {
            throw { reply: '❌ Necesito ser *administrador* del grupo para ejecutar este comando.' };
        }
    }

    // ─── MESSAGE HELPERS ─────────────────────────────────

    /**
     * Extrae contextInfo del mensaje citado (quoted).
     * @returns {Object|null}
     */
    getQuotedInfo(m) {
        return m.message?.extendedTextMessage?.contextInfo || null;
    }

    /**
     * Extrae el JID del usuario objetivo — primero busca menciones, luego quoted.
     * @returns {string|null}
     */
    getTargetUser(m) {
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        if (!ctx) return null;
        const mentioned = ctx.mentionedJid;
        if (mentioned && mentioned.length > 0) return mentioned[0];
        return ctx.participant || null;
    }

    /**
     * Extrae el texto del mensaje citado.
     * @returns {string|null}
     */
    getQuotedText(m) {
        const quotedInfo = this.getQuotedInfo(m);
        if (!quotedInfo || !quotedInfo.quotedMessage) return null;
        const q = quotedInfo.quotedMessage;
        return q.conversation ||
               q.extendedTextMessage?.text ||
               q.imageMessage?.caption ||
               q.videoMessage?.caption ||
               null;
    }
}

module.exports = BaseCommand;
