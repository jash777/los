/**
 * Enhanced Logger Utility
 * Simple, efficient logging for Enhanced LOS
 */

const config = require('../config/app');

class Logger {
    constructor() {
        this.level = config.logging.level;
        this.enableConsole = config.logging.enableConsole;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Format log message
     */
    formatMessage(level, message, meta = null) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (meta) {
            return `${formattedMessage} ${JSON.stringify(meta)}`;
        }
        
        return formattedMessage;
    }

    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    /**
     * Log error messages
     */
    error(message, meta = null) {
        if (this.shouldLog('error') && this.enableConsole) {
            console.error(this.formatMessage('error', message, meta));
        }
    }

    /**
     * Log warning messages
     */
    warn(message, meta = null) {
        if (this.shouldLog('warn') && this.enableConsole) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    /**
     * Log info messages
     */
    info(message, meta = null) {
        if (this.shouldLog('info') && this.enableConsole) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    /**
     * Log debug messages
     */
    debug(message, meta = null) {
        if (this.shouldLog('debug') && this.enableConsole) {
            console.log(this.formatMessage('debug', message, meta));
        }
    }
}

// Export singleton instance
const logger = new Logger();
module.exports = logger;