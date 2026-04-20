const path = require('path');
const fs = require('fs');
const db = require('../data/db');
const logger = require('../core/logger');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'media', 'assets');

class CommunityService {
    constructor() {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    async _read() {
        return db.communitySettings.read();
    }

    async _patch(jid, patch) {
        const all = await this._read();
        all[jid] = { ...all[jid], ...patch };
        await db.communitySettings.write(all);
    }

    // ─── COMMUNITY NAME ───────────────────────────────────

    async getCommunityName(jid) {
        const all = await this._read();
        return all[jid]?.communityName || null;
    }

    async setCommunityName(jid, name) {
        await this._patch(jid, { communityName: name });
    }

    // ─── WELCOME ──────────────────────────────────────────

    async getWelcome(jid) {
        const all = await this._read();
        return all[jid]?.welcome || { enabled: false, message: null, mediaPath: null, mediaType: null };
    }

    async setWelcomeEnabled(jid, enabled) {
        const welcome = await this.getWelcome(jid);
        await this._patch(jid, { welcome: { ...welcome, enabled } });
    }

    async setWelcomeContent(jid, message, mediaPath = null, mediaType = null) {
        const welcome = await this.getWelcome(jid);
        await this._patch(jid, { welcome: { ...welcome, message, mediaPath, mediaType } });
    }

    // ─── BYE ─────────────────────────────────────────────

    async getBye(jid) {
        const all = await this._read();
        return all[jid]?.bye || { enabled: false, message: null, mediaPath: null, mediaType: null };
    }

    async setByeEnabled(jid, enabled) {
        const bye = await this.getBye(jid);
        await this._patch(jid, { bye: { ...bye, enabled } });
    }

    async setByeContent(jid, message, mediaPath = null, mediaType = null) {
        const bye = await this.getBye(jid);
        await this._patch(jid, { bye: { ...bye, message, mediaPath, mediaType } });
    }

    // ─── RULES ───────────────────────────────────────────

    async getRules(jid) {
        const all = await this._read();
        return all[jid]?.rules || null;
    }

    async setRules(jid, rules) {
        await this._patch(jid, { rules });
    }

    // ─── MEDIA UTILS ─────────────────────────────────────

    getAssetPath(jid, type, ext) {
        const safeName = jid.replace(/[@.:]/g, '_');
        return path.join(ASSETS_DIR, `${type}_${safeName}.${ext}`);
    }

    saveAsset(filePath, buffer) {
        fs.writeFileSync(filePath, buffer);
        logger.info(`[CommunityService] Asset guardado: ${filePath}`);
    }

    // ─── PLACEHOLDER RESOLUTION ───────────────────────────

    resolveMessage(template, vars) {
        return template
            .replace(/\{\{user\}\}/g, vars.user || '')
            .replace(/\{\{group\}\}/g, vars.group || '')
            .replace(/\{\{desc\}\}/g, vars.desc || '')
            .replace(/\{\{community\}\}/g, vars.community || '');
    }
}

module.exports = new CommunityService();
