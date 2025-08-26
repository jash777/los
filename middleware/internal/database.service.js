const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Database Service
 * Provides centralized database operations for the application
 */
class DatabaseService {
    constructor() {
        this.db = db;
    }

    /**
     * Execute a query with parameters
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query results with rows property
     */
    async query(query, params = []) {
        try {
            logger.debug('Executing database query', {
                query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                paramCount: params.length
            });

            const result = await this.db.query(query, params);
            return result;
        } catch (error) {
            logger.error('Database query error', {
                error: error.message,
                query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
                params: params.length
            });
            throw error;
        }
    }

    /**
     * Execute a query and return the first row
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object|null>} First row or null
     */
    async queryOne(query, params = []) {
        const result = await this.query(query, params);
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Insert a record into a table
     * @param {string} tableName - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Insert result
     */
    async create(tableName, data) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            logger.debug('Creating record', {
                table: tableName,
                columns: columns.length
            });

            const result = await this.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Database create error', {
                table: tableName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Update records in a table
     * @param {string} tableName - Table name
     * @param {Object} data - Data to update
     * @param {Object} where - Where conditions
     * @returns {Promise<Array>} Updated records
     */
    async update(tableName, data, where) {
        try {
            const updateColumns = Object.keys(data);
            const updateValues = Object.values(data);
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);

            const setClause = updateColumns.map((col, index) => `${col} = $${index + 1}`).join(', ');
            const whereClause = whereColumns.map((col, index) => `${col} = $${updateColumns.length + index + 1}`).join(' AND ');

            const query = `
                UPDATE ${tableName}
                SET ${setClause}
                WHERE ${whereClause}
                RETURNING *
            `;

            logger.debug('Updating records', {
                table: tableName,
                updateColumns: updateColumns.length,
                whereColumns: whereColumns.length
            });

            const result = await this.query(query, [...updateValues, ...whereValues]);
            return result.rows;
        } catch (error) {
            logger.error('Database update error', {
                table: tableName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Delete records from a table
     * @param {string} tableName - Table name
     * @param {Object} where - Where conditions
     * @returns {Promise<Array>} Deleted records
     */
    async delete(tableName, where) {
        try {
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);
            const whereClause = whereColumns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');

            const query = `
                DELETE FROM ${tableName}
                WHERE ${whereClause}
                RETURNING *
            `;

            logger.debug('Deleting records', {
                table: tableName,
                whereColumns: whereColumns.length
            });

            const result = await this.query(query, whereValues);
            return result.rows;
        } catch (error) {
            logger.error('Database delete error', {
                table: tableName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Find records in a table
     * @param {string} tableName - Table name
     * @param {Object} where - Where conditions (optional)
     * @param {Object} options - Query options (limit, offset, orderBy)
     * @returns {Promise<Array>} Found records
     */
    async find(tableName, where = {}, options = {}) {
        try {
            const { limit, offset, orderBy } = options;
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);

            let query = `SELECT * FROM ${tableName}`;
            
            if (whereColumns.length > 0) {
                const whereClause = whereColumns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
                query += ` WHERE ${whereClause}`;
            }

            if (orderBy) {
                query += ` ORDER BY ${orderBy}`;
            }

            if (limit) {
                query += ` LIMIT ${limit}`;
            }

            if (offset) {
                query += ` OFFSET ${offset}`;
            }

            logger.debug('Finding records', {
                table: tableName,
                whereColumns: whereColumns.length,
                limit,
                offset
            });

            const result = await this.query(query, whereValues);
            return result.rows;
        } catch (error) {
            logger.error('Database find error', {
                table: tableName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Find a single record
     * @param {string} tableName - Table name
     * @param {Object} where - Where conditions
     * @returns {Promise<Object|null>} Found record or null
     */
    async findOne(tableName, where) {
        const results = await this.find(tableName, where, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>} Transaction result
     */
    async transaction(callback) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');
            logger.debug('Transaction started');
            
            const result = await callback(client);
            
            await client.query('COMMIT');
            logger.debug('Transaction committed');
            
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Transaction rolled back', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check database connection
     * @returns {Promise<boolean>} Connection status
     */
    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return true;
        } catch (error) {
            logger.error('Database health check failed', { error: error.message });
            return false;
        }
    }

    /**
     * Get table row count
     * @param {string} tableName - Table name
     * @param {Object} where - Where conditions (optional)
     * @returns {Promise<number>} Row count
     */
    async count(tableName, where = {}) {
        try {
            const whereColumns = Object.keys(where);
            const whereValues = Object.values(where);

            let query = `SELECT COUNT(*) as count FROM ${tableName}`;
            
            if (whereColumns.length > 0) {
                const whereClause = whereColumns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
                query += ` WHERE ${whereClause}`;
            }

            const result = await this.query(query, whereValues);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Database count error', {
                table: tableName,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = DatabaseService;