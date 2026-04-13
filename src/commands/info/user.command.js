const BaseCommand = require('../base.command');
const groupService = require('../../services/group.service');
const { getLegend } = require('../../utils/formatter');

class UserCommand extends BaseCommand {
    constructor() {
        super('.user', [], 'Muestra tu información de usuario y rango.');
    }

    async execute(sock, m, ctx) {
        const number = ctx.sender.split("@")[0];

        let info = `*👤 INFO DE USUARIO*\n\n`;
        info += `*Usuario:* ${ctx.pushName}\n`;
        info += `*Número:* ${number}\n`;

        if (ctx.isGroup) {
            const groupMetadata = await groupService.getGroupMetadata(sock, ctx.jid);
            if (groupMetadata) {
                const participant = groupMetadata.participants.find((p) => p.id === ctx.sender);
                let rol = "Miembro";
                if (participant?.admin === "admin") rol = "Administrador";
                if (participant?.admin === "superadmin") rol = "Super Administrador";
                info += `*Rol:* ${rol}`;
            }
        }

        await sock.sendMessage(ctx.jid, { text: info + getLegend(sock) }, { quoted: m });
    }
}

module.exports = UserCommand;
