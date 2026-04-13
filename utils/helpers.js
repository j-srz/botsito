const fs = require('fs');
const path = require('path');

/**
 * Verifica si un usuario es administrador del grupo
 */
const isAdmin = async (sock, jid, user) => {
    try {
        if (!jid.endsWith('@g.us')) return false;
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const participant = participants.find(p => p.id === user);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        console.error('Error en isAdmin:', e);
        return false;
    }
};

/**
 * Genera la firma del bot para los mensajes
 */
const getLegend = (sock) => {
    const botName = sock?.user?.name || 'Rex Bot';
    const fechaNatural = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long'
    });
    return `\n\n> ${botName} | ${fechaNatural}`;
};

/**
 * Registra eventos (logs) en archivos JSON de forma segura
 * @param {string} filePath - Ruta al archivo (ej: ./data/antilink_logs.json)
 * @param {object} data - Datos a registrar
 */
const registrarLog = (filePath, data) => {
    try {
        // Asegurar que la carpeta (data) exista
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let logs = [];
        if (fs.existsSync(filePath)) {
            try {
                logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (err) {
                logs = []; // Si el JSON está corrupto, empezamos de cero
            }
        }

        logs.push(data);

        // Mantener solo los últimos 500 registros para no saturar la MicroSD de la Rasp
        if (logs.length > 500) logs.shift();

        fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error("❌ Error en registrarLog:", e);
    }
};

module.exports = { 
    isAdmin, 
    getLegend, 
    registrarLog 
};