'use strict';

/**
 * Suite de seguridad para el pipeline de message.handler.js
 *
 * Cubre los 4 escenarios críticos + validación de comandos dinámicos:
 *   1. No-admin, mensaje normal (sin prefijo) → Silencio total
 *   2. No-admin, comando .ping              → Bloqueado + log [SECURITY]
 *   3. Admin, comando .ping                 → Ejecutado correctamente
 *   4. Owner (no admin del grupo), comando  → Ejecutado correctamente
 *   5. Comando dinámico pasa por mismo pipeline de seguridad
 */

// ─── MOCKS DE MÓDULOS EXTERNOS ────────────────────────────────────────────────
jest.mock('../src/services/group.service');
jest.mock('../src/services/commercial.service');
jest.mock('../src/services/moderation.service', () => ({
    logMessage: jest.fn().mockResolvedValue(null)
}));
jest.mock('../src/services/group.registry', () => ({
    registerActivity: jest.fn().mockResolvedValue(null)
}));
jest.mock('../src/services/command-control.service', () => ({
    isDisabled: jest.fn().mockResolvedValue(false)
}));
jest.mock('../src/middlewares/antilink.middleware', () => ({
    handle: jest.fn().mockResolvedValue(true)
}));
jest.mock('../src/middlewares/commercial.middleware', () => ({
    handle: jest.fn().mockResolvedValue(true)
}));
jest.mock('../src/middlewares/remote.middleware', () => ({
    handle: jest.fn().mockResolvedValue({ intercepted: false })
}));
jest.mock('../src/core/session/group.session.manager', () => ({
    getSession: jest.fn().mockResolvedValue({})
}));
jest.mock('../src/data/db', () => ({
    remoteSessions: { read: jest.fn().mockResolvedValue({}) }
}));
jest.mock('../src/core/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

// ─── IMPORTS POST-MOCK ────────────────────────────────────────────────────────
const groupService = require('../src/services/group.service');
const commercialService = require('../src/services/commercial.service');
const logger = require('../src/core/logger');

// ─── FACTORIES ────────────────────────────────────────────────────────────────

/**
 * @param {string} body  - Texto del mensaje
 * @param {string} sender - JID del remitente
 * @param {string} [jid]  - JID del chat (por defecto un grupo)
 */
const makeMessage = (body, sender, jid = '120363409112798858@g.us') => ({
    key: { remoteJid: jid, participant: sender, fromMe: false },
    message: { conversation: body },
    pushName: 'Test User'
});

const makeSock = () => ({
    sendMessage: jest.fn().mockResolvedValue(null),
    groupMetadata: jest.fn().mockResolvedValue({ participants: [] }),
    user: { id: 'botid@s.whatsapp.net', name: 'RexBot' }
});

// ─── SUITE PRINCIPAL ──────────────────────────────────────────────────────────

describe('Security Pipeline — message.handler.js', () => {
    let handler;
    let mockCommand;
    let sock;

    beforeEach(() => {
        jest.clearAllMocks();

        handler = require('../src/handlers/message.handler');

        // Default: ningún permiso
        groupService.isAdmin.mockResolvedValue(false);
        groupService.isBotAdmin.mockResolvedValue(true);
        commercialService.isOwner.mockReturnValue(false);
        commercialService.isCommercialAdmin.mockResolvedValue(false);

        // Comando mock que espía ejecución
        mockCommand = {
            name: '.ping',
            alias: [],
            execute: jest.fn().mockResolvedValue(null)
        };
        jest.spyOn(handler.registry, 'findCommand').mockReturnValue(mockCommand);

        sock = makeSock();
    });

    // ── TEST 1 ────────────────────────────────────────────────────────────────
    test('1. No-admin — mensaje normal (sin prefijo) es ignorado en silencio', async () => {
        const m = makeMessage('hola a todos', '52999888777@s.whatsapp.net');

        await handler.handle(sock, m);

        // No debe haber advertencia de seguridad
        expect(logger.warn).not.toHaveBeenCalled();
        // El comando no debe ejecutarse
        expect(mockCommand.execute).not.toHaveBeenCalled();
        // El registry ni siquiera debe buscar el comando
        expect(handler.registry.findCommand).not.toHaveBeenCalled();
    });

    // ── TEST 2 ────────────────────────────────────────────────────────────────
    test('2. No-admin — envía .ping → bloqueado con log [SECURITY]', async () => {
        const m = makeMessage('.ping', '52999888777@s.whatsapp.net');

        await handler.handle(sock, m);

        // Debe emitir advertencia de seguridad
        const warnCalls = logger.warn.mock.calls.map(c => c[0]);
        expect(warnCalls.some(msg => msg.includes('[SECURITY]'))).toBe(true);
        // El comando no debe ejecutarse
        expect(mockCommand.execute).not.toHaveBeenCalled();
    });

    // ── TEST 3 ────────────────────────────────────────────────────────────────
    test('3. Admin — envía .ping → ejecutado correctamente', async () => {
        groupService.isAdmin.mockResolvedValue(true);
        const m = makeMessage('.ping', '52111222333@s.whatsapp.net');

        await handler.handle(sock, m);

        // El comando debe ejecutarse
        expect(mockCommand.execute).toHaveBeenCalledTimes(1);
        // Sin advertencias de seguridad
        const warnCalls = logger.warn.mock.calls.map(c => c[0]);
        expect(warnCalls.some(msg => msg && msg.includes('[SECURITY]'))).toBe(false);
    });

    // ── TEST 4 ────────────────────────────────────────────────────────────────
    test('4. Owner (no admin del grupo) — ejecutado correctamente', async () => {
        // El owner no es admin del grupo en WhatsApp
        groupService.isAdmin.mockResolvedValue(false);
        commercialService.isOwner.mockReturnValue(true);

        const m = makeMessage('.ping', '128316476502070@lid');

        await handler.handle(sock, m);

        // Owner siempre puede ejecutar comandos
        expect(mockCommand.execute).toHaveBeenCalledTimes(1);
        const warnCalls = logger.warn.mock.calls.map(c => c[0]);
        expect(warnCalls.some(msg => msg && msg.includes('[SECURITY]'))).toBe(false);
    });

    // ── TEST 5 ────────────────────────────────────────────────────────────────
    test('5. Comando dinámico — pasa por el mismo pipeline de seguridad', async () => {
        const dynamicCmd = {
            name: '.nuevocmd',
            alias: [],
            execute: jest.fn().mockResolvedValue(null)
        };
        jest.spyOn(handler.registry, 'findCommand').mockReturnValue(dynamicCmd);

        // No-admin no puede ejecutarlo
        const mBlocked = makeMessage('.nuevocmd', '52999888777@s.whatsapp.net');
        await handler.handle(sock, mBlocked);
        expect(dynamicCmd.execute).not.toHaveBeenCalled();

        // Admin sí puede ejecutarlo
        jest.clearAllMocks();
        jest.spyOn(handler.registry, 'findCommand').mockReturnValue(dynamicCmd);
        groupService.isAdmin.mockResolvedValue(true);
        commercialService.isOwner.mockReturnValue(false);
        commercialService.isCommercialAdmin.mockResolvedValue(false);

        const mAllowed = makeMessage('.nuevocmd', '52111222333@s.whatsapp.net');
        await handler.handle(sock, mAllowed);
        expect(dynamicCmd.execute).toHaveBeenCalledTimes(1);
    });
});

