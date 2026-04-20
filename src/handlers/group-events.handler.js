const fs = require('fs');
const logger = require('../core/logger');
const communityService = require('../services/community.service');

class GroupEventsHandler {
    async handle(sock, update) {
        const { id: jid, participants, action } = update;
        if (!jid.endsWith('@g.us')) return;

        if (action === 'add') {
            await this._handleWelcome(sock, jid, participants);
        } else if (action === 'remove') {
            await this._handleBye(sock, jid, participants);
        }
    }

    async _sendWithMedia(sock, jid, text, mentions, mediaPath, mediaType) {
        if (mediaPath && fs.existsSync(mediaPath)) {
            const buffer = fs.readFileSync(mediaPath);
            const msgType = mediaType === 'video' ? 'video' : 'image';
            await sock.sendMessage(jid, { [msgType]: buffer, caption: text, mentions });
        } else {
            await sock.sendMessage(jid, { text, mentions });
        }
    }

    async _handleWelcome(sock, jid, participants) {
        try {
            const welcome = await communityService.getWelcome(jid);
            if (!welcome.enabled || !welcome.message) return;

            const meta = await sock.groupMetadata(jid);
            const community = await communityService.getCommunityName(jid);

            for (const participant of participants) {
                const jidStr = typeof participant === 'string' ? participant : participant.id;
                const text = communityService.resolveMessage(welcome.message, {
                    user: `@${jidStr.split('@')[0]}`,
                    group: meta.subject || '',
                    desc: meta.desc || '',
                    community: community || meta.subject || '',
                });
                await this._sendWithMedia(sock, jid, text, [jidStr], welcome.mediaPath, welcome.mediaType);
            }
        } catch (err) {
            logger.error(`[GroupEvents] Bienvenida fallida en ${jid}:`, err);
        }
    }

    async _handleBye(sock, jid, participants) {
        try {
            const bye = await communityService.getBye(jid);
            if (!bye.enabled || !bye.message) return;

            const meta = await sock.groupMetadata(jid);
            const community = await communityService.getCommunityName(jid);

            for (const participant of participants) {
                const jidStr = typeof participant === 'string' ? participant : participant.id;
                const text = communityService.resolveMessage(bye.message, {
                    user: `@${jidStr.split('@')[0]}`,
                    group: meta.subject || '',
                    desc: meta.desc || '',
                    community: community || meta.subject || '',
                });
                await this._sendWithMedia(sock, jid, text, [jidStr], bye.mediaPath, bye.mediaType);
            }
        } catch (err) {
            logger.error(`[GroupEvents] Despedida fallida en ${jid}:`, err);
        }
    }
}

module.exports = new GroupEventsHandler();
