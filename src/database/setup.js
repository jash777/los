/**
 * Enhanced LOS Database Setup
 * Complete MySQL database setup and management
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/app');

class DatabaseSetup {
    constructor() {
        this.config = {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password
        };
        this.databaseName = config.database.name;
    }

    /**
     * Complete database setup
     */
    async setup() {
        console.log('🚀 Setting up Enhanced LOS MySQL Database...\n');
        
        try {
            // Test connection
            await this.testConnection();
            
            // Create database
            await this.createDatabase();
            
            // Create schema
            await this.createSchema();
            
            // Verify setup
            await this.verifySetup();
            
            console.log('\n🎉 Enhanced LOS MySQL setup completed successfully!');
            console.log('\n📊 Database Details:');
            console.log(`   - Host: ${this.config.host}:${this.config.port}`);
            console.log(`   - Database: ${this.databaseName}`);
            console.log(`   - Tables: 5 core tables created`);
            console.log(`   - Views: 2 query views created`);
            console.log('\n✅ Ready for Enhanced LOS development!');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Enhanced LOS MySQL setup failed:', error.message);
            throw error;
        }
    }

    /**
     * Test MySQL connection
     */
    async testConnection() {
        console.log('🔍 Testing MySQL connection...');
        
        try {
            const connection = await mysql.createConnection(this.config);
            const [result] = await connection.execute('SELECT VERSION() as version');
            await connection.end();
            
            console.log(`✅ MySQL connection successful`);
            console.log(`   - Version: ${result[0].version}`);
            
        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Make sure MySQL is running');
            console.log('   2. Check connection details in .env file');
            console.log('   3. Verify user permissions');
            throw error;
        }
    }

    /**
     * Create database
     */
    async createDatabase() {
        console.log(`🗄️  Creating database: ${this.databaseName}...`);
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            // Create database
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${this.databaseName}`);
            console.log(`✅ Database '${this.databaseName}' created/verified`);
            
            await connection.end();
            
        } catch (error) {
            console.error('❌ Database creation failed:', error.message);
            throw error;
        }
    }

    /**
     * Create schema from SQL file
     */
    async createSchema() {
        console.log('📋 Creating database schema...');
        
        try {
            // Connect to the specific database
            const connection = await mysql.createConnection({
                ...this.config,
                database: this.databaseName,
                multipleStatements: true
            });
            
            // Read schema file
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schemaSQL = await fs.readFile(schemaPath, 'utf8');
            
            // Execute schema
            await connection.execute(schemaSQL);
            console.log('✅ Database schema created successfully');
            
            await connection.end();
            
        } catch (error) {
            console.error('❌ Schema creation failed:', error.message);
            throw error;
        }
    }

    /**
     * Verify setup
     */
    async verifySetup() {
        console.log('🔍 Verifying database setup...');
        
        try {
            const connection = await mysql.createConnection({
                ...this.config,
                database: this.databaseName
            });
            
            // Check tables
            const [tables] = await connection.execute(`
                SELECT table_name, table_rows 
                FROM information_schema.tables 
                WHERE table_schema = ?
                ORDER BY table_name
            `, [this.databaseName]);
            
            console.log('✅ Database verification successful');
            console.log('📊 Tables created:');
            tables.forEach(table => {
                console.log(`   - ${table.table_name} (${table.table_rows} rows)`);
            });
            
            // Check views
            const [views] = await connection.execute(`
                SELECT table_name 
                FROM information_schema.views 
                WHERE table_schema = ?
                ORDER BY table_name
            `, [this.databaseName]);
            
            if (views.length > 0) {
                console.log('📊 Views created:');
                views.forEach(view => {
                    console.log(`   - ${view.table_name}`);
                });
            }
            
            await connection.end();
            
        } catch (error) {
            console.error('❌ Database verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Reset database
     */
    async reset() {
        console.log('🔄 Resetting Enhanced LOS database...');
        
        try {
            const connection = await mysql.createConnection(this.config);
            
            // Drop database
            await connection.execute(`DROP DATABASE IF EXISTS ${this.databaseName}`);
            console.log(`✅ Database '${this.databaseName}' dropped`);
            
            await connection.end();
            
            // Recreate everything
            await this.setup();
            
        } catch (error) {
            console.error('❌ Database reset failed:', error.message);
            throw error;
        }
    }

    /**
     * Get database status
     */
    async getStatus() {
        try {
            const connection = await mysql.createConnection({
                ...this.config,
                database: this.databaseName
            });
            
            const [tables] = await connection.execute(`
                SELECT table_name, table_rows, data_length, index_length
                FROM information_schema.tables 
                WHERE table_schema = ?
                ORDER BY table_name
            `, [this.databaseName]);
            
            const [appCount] = await connection.execute('SELECT COUNT(*) as count FROM loan_applications');
            
            await connection.end();
            
            console.log('📊 Enhanced LOS Database Status:');
            console.log(`   - Database: ${this.databaseName}`);
            console.log(`   - Total Applications: ${appCount[0].count}`);
            console.log(`   - Tables: ${tables.length}`);
            console.log('\n📋 Table Details:');
            tables.forEach(table => {
                console.log(`   - ${table.table_name}: ${table.table_rows} rows`);
            });
            
            return {
                database: this.databaseName,
                tables: tables,
                totalApplications: appCount[0].count,
                status: 'healthy'
            };
            
        } catch (error) {
            console.log('❌ Database status check failed:', error.message);
            return {
                database: this.databaseName,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * Test connection only
     */
    async test() {
        await this.testConnection();
        console.log('\n✅ Database connection test completed successfully!');
    }
}

// CLI interface
async function main() {
    const setup = new DatabaseSetup();
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'setup':
                await setup.setup();
                break;
                
            case 'reset':
                await setup.reset();
                break;
                
            case 'status':
                await setup.getStatus();
                break;
                
            case 'test':
                await setup.test();
                break;
                
            default:
                console.log('Enhanced LOS Database Setup');
                console.log('Usage: node setup.js [command]');
                console.log('\nCommands:');
                console.log('  setup  - Create database and schema');
                console.log('  reset  - Drop and recreate database');
                console.log('  status - Get database status');
                console.log('  test   - Test database connection');
                break;
        }
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run CLI if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = DatabaseSetup;