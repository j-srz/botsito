const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');

class CmAdminCommand extends BaseCommand {
    constructor() {
        super('.cm-admin', [], 'Menú de gestión comercial del bot REX');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        const isOwner = commercialService.isOwner(ctx.sender);

        const menu = `╔══════════════════════════╗
║   🦖 *REX — Panel Admin*   ║
╚══════════════════════════╝

📋 *GRUPOS*
/list-groups — Listar todos los grupos
/alias <jid/alias> <nombre> — Asignar alias a un grupo
/activate <grupo> <tipo> [cant] — Activar licencia
  Tipos: days · weeks · months · unlimited
  Ej: /activate ventas days 30

📢 *DIFUSIÓN*
/anuncio <mensaje> — Enviar a todos los grupos activos

📡 *REMOTE*
.remote bind <grupo> — Anclar sesión remota
.remote unbind — Desanclar sesión
.remote <grupo> <cmd> — Ejecutar comando en grupo${isOwner ? `

👑 *OWNER ONLY*
/add-admin <número> — Dar acceso admin
/remove-admin <número> — Revocar acceso admin` : ''}`;

        await ctx.reply(menu);
    }
}

module.exports = CmAdminCommand;
