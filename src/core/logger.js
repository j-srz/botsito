class Logger {
    constructor() {
        this.prefix = '[REX BOT]';
    }

    info(msg, ...args) {
        console.log(`\x1b[36m${this.prefix}\x1b[0m \x1b[32m[INFO]\x1b[0m`, msg, ...args);
    }

    error(msg, error = null) {
        if (error) {
            console.error(`\x1b[36m${this.prefix}\x1b[0m \x1b[31m[ERROR]\x1b[0m`, msg, error);
        } else {
            console.error(`\x1b[36m${this.prefix}\x1b[0m \x1b[31m[ERROR]\x1b[0m`, msg);
        }
    }

    warn(msg, ...args) {
        console.warn(`\x1b[36m${this.prefix}\x1b[0m \x1b[33m[WARN]\x1b[0m`, msg, ...args);
    }

    debug(msg, ...args) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\x1b[36m${this.prefix}\x1b[0m \x1b[35m[DEBUG]\x1b[0m`, msg, ...args);
        }
    }
}

module.exports = new Logger();
