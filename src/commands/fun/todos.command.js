const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');
const { getLegend } = require('../../utils/formatter');

class TodosCommand extends BaseCommand {
    constructor() {
        super('.todos', [], 'Menciona a todos en el grupo.');
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        await sock.sendMessage(ctx.jid, { react: { text: "📣", key: m.key } });

        const groupMetadata = await groupService.getGroupMetadata(sock, ctx.jid);
        if (!groupMetadata) return;

        const mentions = groupMetadata.participants.map((p) => p.id);
        let list = `*Llamando rexitos*\n✦ ┉┉┉┉┉┉┉ ✧ ┉┉┉┉┉┉┉ ✦\n`;

        for (let participant of groupMetadata.participants) {
            const num = participant.id.split("@")[0].split(":")[0];
            list += `🦖 @${num}\n`;
        }

        list += `✦ ┉┉┉┉┉┉┉ ✧ ┉┉┉┉┉┉┉ ✦\n*Llamados*` + getLegend(sock);
        await sock.sendMessage(ctx.jid, { text: list, mentions }, { quoted: m });
    }
}

module.exports = TodosCommand;
