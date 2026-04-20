/**
 * Punto de entrada del Bot REX.
 * Manejo global de errores + Graceful Shutdown.
 */
const logger = require('./core/logger');
const botClient = require('./core/bot');

// --- MANEJO DE ERRORES GLOBALES ---
process.on('uncaughtException', (err) => {
    logger.error('Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
});

// --- GRACEFUL SHUTDOWN ---
async function shutdown(signal) {
    logger.info(`${signal} recibido. Cerrando Bot REX...`);
    try {
        if (botClient.sock) {
            await botClient.sock.logout().catch(() => null);
            botClient.sock.end();
        }
        logger.info('Conexión WhatsApp cerrada correctamente.');
    } catch (e) {
        logger.error('Error durante shutdown:', e.message);
    } finally {
        process.exit(0);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C local

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
