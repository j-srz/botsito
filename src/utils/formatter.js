/**
 * Utilitarios de formato para interactuar con Baileys o mensajes visuales
 */

/**
 * Genera la firma del bot para adjuntar al final de los mensajes
 * @param {Object} sock - Instancia del socket Baileys
 * @returns {string} Leyenda formateada
 */
const getLegend = (sock) => {
    const botName = sock?.user?.name || 'Rex Bot';
    const fechaNatural = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long'
    });
    return `\n> ${botName} | ${fechaNatural}`;
};

/**
 * Normaliza un WA ID a su formato base sin el sufijo de dispositivo
 * @param {string} id - Whatsapp ID (ej: 123456789:22@s.whatsapp.net)
 * @returns {string} Base ID (ej: 123456789)
 */
const cleanID = (id) => (id ? id.split("@")[0].split(":")[0] : "");

module.exports = {
    getLegend,
    cleanID
};
