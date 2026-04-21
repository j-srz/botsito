const BaseCommand = require('../base.command');
const commercialService = require('../../services/commercial.service');
const groupService = require('../../services/group.service');

const FETCH_DELAY_MS = 250;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

class ListGroupsCommand extends BaseCommand {
    constructor() {
        super('/list-groups', [], 'Listar todos los grupos con estado de licencia');
    }

    /**
     * Resuelve el nombre visible de un grupo con prioridad:
     * 1. Alias guardado en DB
     * 2. Nombre en caché de metadata (sin network call)
     * 3. Fetch real a WhatsApp (con delay para no saturar)
     * 4. JID como fallback
     *
     * @returns {{ name: string, fetched: boolean }}
     */
    async _resolveName(sock, jid, dbRecord) {
        // 1. Alias de la DB
        if (dbRecord.aliases && dbRecord.aliases.length > 0) {
            return { name: dbRecord.aliases[0], fetched: false };
        }

        // 2. Nombre guardado en DB que no sea placeholder
        const storedName = dbRecord.name;
        if (storedName && storedName !== 'Sin nombre' && storedName !== 'Desconocido') {
            return { name: storedName, fetched: false };
        }

        // 3. Caché de metadata (sin network call)
        const cached = groupService.getCachedName(jid);
        if (cached) return { name: cached, fetched: false };

        // 4. Necesita fetch
        return { name: null, fetched: true };
    }

    async execute(sock, m, ctx) {
        await this.requireCommercialAdmin(ctx);
        this.requirePrivate(ctx);

        const groups = await commercialService.listAllGroups();

        if (groups.length === 0) {
            return ctx.reply('📭 No hay grupos registrados aún.');
        }

        await ctx.reply(`🔍 Obteniendo nombres de ${groups.length} grupos...`);

        // Primera pasada: resolver los que no necesitan fetch
        const resolved = await Promise.all(
            groups.map(async (g) => {
                const { name, fetched } = await this._resolveName(sock, g.jid, g);
                return { ...g, displayName: name, needsFetch: fetched };
            })
        );

        // Segunda pasada: fetch secuencial con delay para los que lo necesitan
        for (const g of resolved) {
            if (!g.needsFetch) continue;
            try {
                const meta = await sock.groupMetadata(g.jid);
                g.displayName = meta.subject || null;
            } catch (_) {
                g.displayName = null;
            }
            await sleep(FETCH_DELAY_MS);
        }

        // Formatear lista
        const lines = resolved.map((g, i) => {
            const name = g.displayName || g.jid;

            let licBadge;
            if (!g.license.active) {
                licBadge = g.license.reason === 'expired' ? '🔴 Vencida' : '⚫ Sin licencia';
            } else if (g.license.type === 'unlimited') {
                licBadge = '🟢 Ilimitada';
            } else {
                licBadge = `🟢 ${g.license.daysLeft}d`;
            }

            return `${i + 1}. *${name}*  ${licBadge}\n   \`${g.jid}\``;
        });

        const header = `📋 *GRUPOS REGISTRADOS (${groups.length})*\n${'─'.repeat(28)}\n\n`;
        await ctx.reply(header + lines.join('\n\n'));
    }
}

module.exports = ListGroupsCommand;
