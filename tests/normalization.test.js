'use strict';

/**
 * Suite de normalización de JIDs en CommercialService.
 * Verifica que @lid y @s.whatsapp.net sean equivalentes en isOwner/isCommercialAdmin.
 */

// Solo mockeamos db para evitar lectura de archivos JSON
jest.mock('../src/data/db', () => ({
    commercial: {
        read: jest.fn().mockResolvedValue({ admins: ['524492842300@s.whatsapp.net'] })
    },
    groupsDirectory: { read: jest.fn().mockResolvedValue({}) }
}));
jest.mock('../src/core/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

describe('CommercialService — normalización @lid / @s.whatsapp.net', () => {
    let service;

    beforeEach(() => {
        service = require('../src/services/commercial.service');
    });

    describe('isOwner', () => {
        test('reconoce JID con @lid cuando OWNER_JID tiene @lid', () => {
            service.getOwnerJid = () => '128316476502070@lid';

            expect(service.isOwner('128316476502070@lid')).toBe(true);
            expect(service.isOwner('128316476502070@s.whatsapp.net')).toBe(true);
            expect(service.isOwner('128316476502070:5@lid')).toBe(true);
        });

        test('reconoce JID con @s.whatsapp.net cuando OWNER_JID tiene @lid', () => {
            service.getOwnerJid = () => '524492842300@lid';

            expect(service.isOwner('524492842300@s.whatsapp.net')).toBe(true);
            expect(service.isOwner('524492842300@lid')).toBe(true);
        });

        test('rechaza número distinto sin importar el sufijo', () => {
            service.getOwnerJid = () => '128316476502070@lid';

            expect(service.isOwner('999999999@s.whatsapp.net')).toBe(false);
            expect(service.isOwner('999999999@lid')).toBe(false);
        });

        test('rechaza JID vacío o nulo', () => {
            service.getOwnerJid = () => '128316476502070@lid';

            expect(service.isOwner('')).toBe(false);
            expect(service.isOwner(null)).toBe(false);
            expect(service.isOwner(undefined)).toBe(false);
        });
    });

    describe('isCommercialAdmin', () => {
        test('owner siempre es admin comercial', async () => {
            service.getOwnerJid = () => '128316476502070@lid';

            const result = await service.isCommercialAdmin('128316476502070@s.whatsapp.net');
            expect(result).toBe(true);
        });

        test('admin guardado con @s.whatsapp.net se reconoce con @lid', async () => {
            service.getOwnerJid = () => '000000000@lid';

            const result = await service.isCommercialAdmin('524492842300@lid');
            expect(result).toBe(true);
        });

        test('número desconocido no es admin comercial', async () => {
            service.getOwnerJid = () => '000000000@lid';

            const result = await service.isCommercialAdmin('777777777@s.whatsapp.net');
            expect(result).toBe(false);
        });
    });
});
