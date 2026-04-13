const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');

class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    register(command) {
        this.commands.set(command.name, command);
        command.alias.forEach(a => this.commands.set(a, command));
    }

    /**
     * Auto-loads all commands from the commands directory
     */
    loadCommands(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.loadCommands(fullPath);
            } else if (file.endsWith('.command.js')) {
                const CommandClass = require(fullPath);
                try {
                    const commandInstance = new CommandClass();
                    if (commandInstance.name) {
                        this.register(commandInstance);
                    }
                } catch (e) {
                    logger.error(`Error registrando comando desde archivo ${file}:`, e);
                }
            }
        }
        logger.info(`Se cargaron ${this.commands.size} alias/comandos.`);
    }

    findCommand(text) {
        const args = text.split(" ");
        const firstArg = args[0]; // ej: '.ruletaban'
        return this.commands.get(firstArg);
    }
    
    getAllCommands() {
        const unique = new Set(this.commands.values());
        return Array.from(unique);
    }
}

module.exports = CommandRegistry;
