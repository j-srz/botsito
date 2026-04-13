/**
 * Punto de entrada optimizado para el Bot.
 * Implementa un manejador global de errores para que la instancia no caiga enteramente ante promesas fallidas.
 */
const logger = require('./core/logger');
const botClient = require('./core/bot');

// --- MANEJO DE ERRORES GLOBALES ---
process.on('uncaughtException', (err) => {
    logger.error('Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- INICIALIZACIÓN ---
async function main() {
    try {
        logger.info('Iniciando Rex Bot...');
        await botClient.init();
    } catch (e) {
        logger.error('Error fatal al iniciar el bot:', e);
        process.exit(1);
    }
}

main();
