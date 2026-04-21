const BaseCommand = require('../base.command');
const { getLegend } = require('../../utils/formatter');

class CmScCommand extends BaseCommand {
    constructor() {
        super('.cm-sc', [], 'Menú Social y Comunidad de REX.');
    }

    async execute(sock, m, ctx) {
        const menu = `*📜 REX BOT — Social & Comunidad*

*🛡️ ANTILINK*
• \`.antilink on\` — Activa escudo (2 strikes = ban)
• \`.antilink off\` — Desactiva el escudo
• \`.antilink logs\` — Historial de infracciones

*🎟️ RULETA (RIFAS)*
• \`.ruleta all\` — Sorteo entre todos ✨
• \`.ruleta admin\` — Sorteo entre admins
• \`.ruleta add m\` — Inscripción por reacciones 🎟️
• \`.ruleta cs\` — Sorteo de la tómbola
• \`.ruleta cs add/remove @user\` — Gestiona tómbola
• \`.ruleta cs show/reset\` — Ver o vaciar tómbola

*🎲 RULETABAN*
• \`.ruletaban all/admin\` — Ban al azar 💥
• \`.ruletaban cs\` — Sorteo de la lista negra
• \`.ruletaban cs add @user\` — Agregar a la lista
• \`.ruletaban cs remove @user\` — Perdonar
• \`.ruletaban cs show\` — Ver la lista
• \`.ruletaban cs reset\` — Vaciar lista negra

*🏘️ COMUNIDAD & BIENVENIDAS*
• \`.community set <nombre>\` — Nombre de la comunidad
• \`.community view\` — Ver nombre configurado
• \`.bienvenida on/off\` — Activa/desactiva bienvenidas
• \`.bienvenida set <msg>\` — Configura bienvenida
• \`.bienvenida ver\` — Ver bienvenida actual
• \`.bye on/off\` — Activa/desactiva despedidas
• \`.bye set <msg>\` — Configura despedida
• \`.bye ver\` — Ver despedida actual
• \`.rules\` — Reglamento del grupo
• \`.rules set <texto>\` — Guardar reglamento
_Placeholders: {{user}}, {{group}}, {{desc}}, {{community}}_

*🖼️ MULTIMEDIA*
_Calidades: superlow · low · medium · high · superhigh_
• \`.s [calidad]\` — Crea sticker (imagen/video/GIF)
• \`.img [calidad]\` — Sticker a imagen o video
• \`.cancel\` — Vacía la cola de conversión 🚮

> Ver más: *.cm* (General) · *.cm-admin* (Sistema)`;

        await sock.sendMessage(ctx.jid, { text: menu + getLegend(sock) }, { quoted: m });
    }
}

module.exports = CmScCommand;
