/**
 * MySQL Database Configuration
 * Clean, simple database connection for Enhanced LOS
 */

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class DatabaseConfig {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'alpha',
            password: process.env.DB_PASSWORD || 'Alpha#777',
            database: process.env.DB_NAME || 'loan_origination_system',
            waitForConnections: true,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
            queueLimit: 0,
            acquireTimeout: parseInt(process.env.DB_TIMEOUT) || 60000,
            timezone: '+00:00',
            charset: 'utf8mb4'
        };
        
        this.pool = null;
    }

    /**
     * Initialize database connection pool
     */
    async initialize() {
        try {
            this.pool = mysql.createPool(this.config);
            
            // Test connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            
            logger.info('✅ MySQL database connection established');
            return true;
            
        } catch (error) {
            logger.error('❌ MySQL database connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Get database connection pool
     */
    getPool() {
        if (!this.pool) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.pool;
    }

    /**
     * Close database connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('📊 MySQL database connection pool closed');
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            const [result] = await connection.execute('SELECT NOW() as current_time, VERSION() as mysql_version');
            connection.release();
            
            return {
                success: true,
                currentTime: result[0].current_time,
                mysqlVersion: result[0].mysql_version,
                message: 'MySQL connection successful'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'MySQL connection failed'
            };
        }
    }
}

// Export singleton instance
const databaseConfig = new DatabaseConfig();
module.exports = databaseConfig;