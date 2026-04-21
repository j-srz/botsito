const db = require('../data/db');
const logger = require('../core/logger');
const { cleanID } = require('../utils/formatter');

class CommercialService {

    // ─── IDENTITY ────────────────────────────────────────────────────────────

    // Normaliza a número puro — soporta @s.whatsapp.net, @lid y sufijos :device
    _normalizePhone(jid) {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0];
    }

    // Mantiene formato @s.whatsapp.net para almacenamiento en DB
    _normalize(jid) {
        if (!jid) return '';
        const base = cleanID(jid);
        return base.includes('@') ? base : `${base}@s.whatsapp.net`;
    }

    async _getData() {
        return await db.commercial.read();
    }

    getOwnerJid() {
        return process.env.OWNER_JID || '524492842300@s.whatsapp.net';
    }

    isOwner(senderJid) {
        // Compara solo el número — maneja @lid y @s.whatsapp.net de forma transparente
        const ownerPhone = this._normalizePhone(this.getOwnerJid());
        const senderPhone = this._normalizePhone(senderJid);
        return ownerPhone.length > 0 && ownerPhone === senderPhone;
    }

    async isCommercialAdmin(senderJid) {
        if (this.isOwner(senderJid)) return true;
        const data = await this._getData();
        const admins = data.admins || [];
        const senderPhone = this._normalizePhone(senderJid);
        return admins.some(a => this._normalizePhone(a) === senderPhone);
    }

    // ─── ADMIN MANAGEMENT ────────────────────────────────────────────────────

    async addAdmin(targetJid) {
        const data = await this._getData();
        if (!data.admins) data.admins = [];
        const normalized = this._normalize(targetJid);
        if (this.isOwner(normalized)) return { success: false, reason: 'is_owner' };
        if (data.admins.some(a => this._normalize(a) === normalized)) {
            return { success: false, reason: 'already_admin' };
        }
        data.admins.push(normalized);
        await db.commercial.write(data);
        logger.info(`[COMMERCIAL] Admin agregado: ${normalized}`);
        return { success: true };
    }

    async removeAdmin(targetJid) {
        const data = await this._getData();
        if (!data.admins) return { success: false, reason: 'not_found' };
        const normalized = this._normalize(targetJid);
        const idx = data.admins.findIndex(a => this._normalize(a) === normalized);
        if (idx === -1) return { success: false, reason: 'not_found' };
        data.admins.splice(idx, 1);
        await db.commercial.write(data);
        logger.info(`[COMMERCIAL] Admin eliminado: ${normalized}`);
        return { success: true };
    }

    async listAdmins() {
        const data = await this._getData();
        return data.admins || [];
    }

    // ─── LICENSE MANAGEMENT ──────────────────────────────────────────────────

    _calcExpiry(type, amount) {
        if (type === 'unlimited') return null;
        const now = new Date();
        if (type === 'days')   now.setDate(now.getDate() + amount);
        if (type === 'weeks')  now.setDate(now.getDate() + amount * 7);
        if (type === 'months') now.setMonth(now.getMonth() + amount);
        return now.toISOString();
    }

    async activateLicense(groupJid, type, amount, activatedBy) {
        const validTypes = ['days', 'weeks', 'months', 'unlimited'];
        if (!validTypes.includes(type)) return { success: false, reason: 'invalid_type' };
        if (type !== 'unlimited' && (!amount || isNaN(amount) || amount <= 0)) {
            return { success: false, reason: 'invalid_amount' };
        }

        const root = await db.groupsDirectory.read();
        if (!root[groupJid]) return { success: false, reason: 'group_not_found' };

        root[groupJid].license = {
            active: true,
            type,
            expiresAt: this._calcExpiry(type, Number(amount)),
            activatedAt: new Date().toISOString(),
            activatedBy: this._normalize(activatedBy)
        };

        await db.groupsDirectory.write(root);
        logger.info(`[COMMERCIAL] Licencia activada: ${groupJid} | ${type} ${amount || ''}`);
        return { success: true, license: root[groupJid].license };
    }

    async getLicenseStatus(groupJid) {
        const root = await db.groupsDirectory.read();
        const record = root[groupJid];
        if (!record || !record.license) return { active: false, reason: 'no_license' };

        const lic = record.license;
        if (lic.type === 'unlimited') return { active: true, type: 'unlimited', expiresAt: null };

        const now = new Date();
        const expiry = new Date(lic.expiresAt);
        if (now > expiry) return { active: false, reason: 'expired', expiresAt: lic.expiresAt };

        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return { active: true, type: lic.type, expiresAt: lic.expiresAt, daysLeft };
    }

    async isLicenseActive(groupJid) {
        const status = await this.getLicenseStatus(groupJid);
        return status.active;
    }

    // ─── GROUP LISTING ───────────────────────────────────────────────────────

    async listAllGroups() {
        const root = await db.groupsDirectory.read();
        const results = [];
        for (const [jid, record] of Object.entries(root)) {
            const licStatus = await this.getLicenseStatus(jid);
            results.push({
                jid,
                name: record.name || 'Sin nombre',
                aliases: record.aliases || [],
                license: licStatus
            });
        }
        return results;
    }
}

module.exports = new CommercialService();
