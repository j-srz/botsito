const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');

class CmAdminCommand extends BaseCommand {
    constructor() {
        super('.cm-admin', [], 'Menú de administración y sistema REX.');
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        const isOwner = commercialService.isOwner(ctx.sender);

        const menu = `╔══════════════════════════╗
║   🦖 *REX — Panel Admin*   ║
╚══════════════════════════╝

📋 *DIRECTORIO DE GRUPOS*
/list-groups — Listar todos los grupos con estado de licencia
/alias <jid/alias> <nombre> — Asignar alias a un grupo

🔑 *LICENCIAS*
/activate <grupo> <tipo> [cant] — Activar licencia
  Tipos: days · weeks · months · unlimited
  Ej: /activate ventas days 30

📢 *DIFUSIÓN*
/anuncio <mensaje> — Enviar a todos los grupos activos

📡 *CONTROL REMOTO*
.remote bind <grupo> — Anclar sesión remota
.remote unbind — Desanclar sesión
.remote <grupo> <cmd> — Ejecutar comando one-shot

⚙️ *OPERADORES DE GRUPO*
.operators set @user — Define operador principal
.operators add/remove @user — Gestiona sub-operadores
.operators get/reset — Ver o limpiar lista${isOwner ? `

👑 *OWNER ONLY*
/add-admin <número> — Otorgar acceso de admin comercial
/remove-admin <número> — Revocar acceso de admin comercial` : ''}

> Ver también: *.cm* (General) · *.cm-sc* (Social)`;

        await ctx.reply(menu);
    }
}

module.exports = CmAdminCommand;
