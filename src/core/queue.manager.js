const logger = require('./logger');
const { getLegend } = require('../utils/formatter');

class QueueManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.currentProcess = null;
        this._nextTimer = null;
    }

    _generarBarraFila(posicion) {
        const limiteVisual = 7;
        let barra = "";
        for (let i = 1; i <= limiteVisual; i++) {
            if (i < posicion) barra += "🟥";
            else if (i === posicion) barra += "🚺";
            else barra += "🟩";
        }
        return barra;
    }

    async add(taskData) {
        const { sock, m, executeTask } = taskData;
        const jid = m.key.remoteJid;
        
        this.queue.push(taskData);

        if (this.isProcessing || this.queue.length > 1) {
            const pos = this.queue.length;
            const barraVisual = this._generarBarraFila(pos);
            const mensajeEspera = 
`┌── [ 🦖 REX COLA ] ──┐
🚨 *¡PERESE!* 🚨
${barraVisual}
Posición: ${pos} | Total: ${pos}
└─────────────────────┘
${getLegend(sock)}`;

            await sock.sendMessage(jid, { text: mensajeEspera }, { quoted: m });
        }
        
        this.processNext();
    }

    async processNext() {
        if (this.queue.length === 0 || this.isProcessing) return;
        
        this.isProcessing = true;
        const currentTask = this.queue[0];
        const { sock, m, executeTask } = currentTask;

        try {
            // executeTask returns an optional child process if it needs to be tracked for cancellation
            this.currentProcess = await executeTask();
            await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
        } catch (err) {
            logger.error('Error en tarea de cola:', err.message);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ ERROR: ${err.message}` });
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
        } finally {
            this.queue.shift();
            this.isProcessing = false;
            this.currentProcess = null;
            clearTimeout(this._nextTimer);
            this._nextTimer = setTimeout(() => this.processNext(), 1000);
        }
    }

    async cancelAll(sock, m) {
        this.queue = [];
        if (this.currentProcess) {
            this.currentProcess.kill('SIGKILL');
            this.currentProcess = null;
        }
        this.isProcessing = false;
        
        await sock.sendMessage(m.key.remoteJid, { text: '🚮 *COLA VACIA* - Se detuvieron los procesos.' });
        await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    }
}

module.exports = new QueueManager();
