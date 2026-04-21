const BaseCommand = require('../base.command');
const groupRegistry = require('../../services/group.registry');

// Número puro — inmune a @lid, @s.whatsapp.net y sufijos :device
function numericId(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

function toJid(num) {
    return `${num}@s.whatsapp.net`;
}

class OperatorsCommand extends BaseCommand {
    constructor() {
        super('.operators', [], 'Gestiona los operadores remotos del grupo.');
    }

    /**
     * Resuelve el JID del objetivo desde: mención, reply, "yo", o número de teléfono puro.
     * @returns {{ jid: string, display: string } | null}
     */
    _resolveTarget(m, ctx) {
        // 1. Mención (@usuario)
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length > 0) {
            const num = numericId(mentions[0]);
            return { jid: toJid(num), display: num };
        }

        // 2. Reply al mensaje del usuario objetivo
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
        if (quotedParticipant) {
            const num = numericId(quotedParticipant);
            return { jid: toJid(num), display: num };
        }

        // 3. Keyword "yo" → el propio remitente
        const thirdArg = ctx.args[2]?.toLowerCase();
        if (thirdArg === 'yo') {
            const num = numericId(ctx.sender);
            return { jid: toJid(num), display: num };
        }

        // 4. Número de teléfono puro (7-15 dígitos)
        if (thirdArg && /^\d{7,15}$/.test(thirdArg)) {
            return { jid: toJid(thirdArg), display: thirdArg };
        }

        return null;
    }

    async execute(sock, m, ctx) {
        this.requireGroup(ctx);

        const action = ctx.args[1]?.toLowerCase();
        const record = await groupRegistry.getGroupRecord(ctx.jid);
        const ops = record.operators || { owner: null, list: [] };
        if (!Array.isArray(ops.list)) ops.list = [];

        // ── LIST ──────────────────────────────────────────────────────────────────
        if (action === 'list') {
            const entries = ops.list.map((jid, i) => `${i + 1}. \`${numericId(jid)}\``);
            if (entries.length === 0) {
                return await ctx.reply('📋 *Operadores remotos*\n\nNo hay operadores registrados en este grupo.\nUsa `.operators add yo` para agregarte.');
            }
            return await ctx.reply(`📋 *Operadores remotos (${entries.length})*\n\n${entries.join('\n')}`);
        }

        // ── ADD ───────────────────────────────────────────────────────────────────
        if (action === 'add') {
            const target = this._resolveTarget(m, ctx);
            if (!target) {
                return await ctx.reply(
                    '⚠️ No pude identificar al usuario. Usa alguna de estas formas:\n\n' +
                    '• Mencionarlo: `.operators add @usuario`\n' +
                    '• Responder su mensaje: `.operators add`\n' +
                    '• A ti mismo: `.operators add yo`\n' +
                    '• Por número: `.operators add 524491234567`'
                );
            }

            const alreadyIn = ops.list.some(j => numericId(j) === numericId(target.jid));
            if (alreadyIn) {
                return await ctx.reply(`ℹ️ \`${target.display}\` ya es operador de este grupo.`);
            }

            ops.list.push(target.jid);
            // Si no hay owner designado, el primero en la lista se convierte en owner
            if (!ops.owner) ops.owner = target.jid;

            await groupRegistry.saveOperators(ctx.jid, ops);
            return await ctx.reply(`✅ \`${target.display}\` ahora es Operador de este grupo.`);
        }

        // ── REMOVE ────────────────────────────────────────────────────────────────
        if (action === 'remove') {
            const target = this._resolveTarget(m, ctx);
            if (!target) {
                return await ctx.reply(
                    '⚠️ No pude identificar al usuario. Menciona, responde su mensaje, escribe *yo*, o su número.'
                );
            }

            const beforeCount = ops.list.length;
            ops.list = ops.list.filter(j => numericId(j) !== numericId(target.jid));

            if (ops.list.length === beforeCount) {
                return await ctx.reply(`ℹ️ \`${target.display}\` no está en la lista de operadores.`);
            }

            // Si el owner fue removido, promover al siguiente o dejar vacío
            if (ops.owner && numericId(ops.owner) === numericId(target.jid)) {
                ops.owner = ops.list[0] || null;
            }

            await groupRegistry.saveOperators(ctx.jid, ops);
            return await ctx.reply(`✅ \`${target.display}\` ya no es Operador de este grupo.`);
        }

        // ── RESET ─────────────────────────────────────────────────────────────────
        if (action === 'reset') {
            ops.list = [];
            ops.owner = null;
            await groupRegistry.saveOperators(ctx.jid, ops);
            return await ctx.reply('🔄 Todos los operadores han sido eliminados.');
        }

        // ── AYUDA ─────────────────────────────────────────────────────────────────
        await ctx.reply(
            '*🎛️ Gestión de Operadores Remotos*\n\n' +
            '`.operators add` — Agregar operador\n' +
            '`.operators remove` — Quitar operador\n' +
            '`.operators list` — Ver operadores actuales\n' +
            '`.operators reset` — Limpiar todos\n\n' +
            '*Cómo identificar al usuario:*\n' +
            '• Mencionarlo: `.operators add @usuario`\n' +
            '• Responder su mensaje: `.operators add`\n' +
            '• A ti mismo: `.operators add yo`\n' +
            '• Por número: `.operators add 524491234567`'
        );
    }
}

module.exports = OperatorsCommand;
