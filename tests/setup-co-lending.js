/**
 * Co-Lending Database Setup
 * Initialize co-lending tables and default data
 */

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const databaseConfig = require('../src/config/database');
const logger = require('../src/utils/logger');

async function setupCoLendingDatabase() {
    let connection;
    
    try {
        logger.info('Starting co-lending database setup...');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: databaseConfig.config.host,
            port: databaseConfig.config.port,
            user: databaseConfig.config.user,
            password: databaseConfig.config.password,
            database: databaseConfig.config.database,
            multipleStatements: true
        });

        logger.info('Connected to MySQL database');

        // Read and execute the co-lending schema
        const schemaPath = path.join(__dirname, '../src/database/co-lending-schema.sql');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');

        // Split SQL statements and execute them
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        logger.info(`Found ${statements.length} SQL statements to execute`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    await connection.execute(statement);
                    logger.info(`✅ Executed statement ${i + 1}/${statements.length}`);
                } catch (error) {
                    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
                        logger.info(`⚠️  Statement ${i + 1} - Table/Data already exists, skipping`);
                    } else {
                        logger.error(`❌ Error executing statement ${i + 1}:`, error.message);
                        logger.error('Statement:', statement.substring(0, 200) + '...');
                    }
                }
            }
        }

        // Verify tables were created
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE 'co_lending_%'
        `);

        logger.info(`✅ Co-lending setup completed! Created ${tables.length} tables:`);
        tables.forEach(table => {
            logger.info(`   - ${Object.values(table)[0]}`);
        });

        // Verify default data
        const [partnersCount] = await connection.execute(`
            SELECT COUNT(*) as count FROM co_lending_partners
        `);

        const [ratiosCount] = await connection.execute(`
            SELECT COUNT(*) as count FROM co_lending_ratios
        `);

        logger.info(`📊 Default data loaded:`);
        logger.info(`   - Partners: ${partnersCount[0].count}`);
        logger.info(`   - Ratio Rules: ${ratiosCount[0].count}`);

        // Test views
        const [partnershipSummary] = await connection.execute(`
            SELECT COUNT(*) as count FROM co_lending_partnership_summary
        `);

        logger.info(`🔍 Views created:`);
        logger.info(`   - Partnership Summary: ${partnershipSummary[0].count} records`);

        logger.info('🎉 Co-lending database setup completed successfully!');

    } catch (error) {
        logger.error('❌ Error setting up co-lending database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            logger.info('Database connection closed');
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCoLendingDatabase()
        .then(() => {
            logger.info('Setup completed successfully');
            process.exit(0);
        })
        .catch(error => {
            logger.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupCoLendingDatabase };
