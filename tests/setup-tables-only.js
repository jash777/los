/**
 * Simple Table Setup Script
 * Creates only the database tables (user already exists)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupTables() {
    let connection;
    
    try {
        console.log('🗄️  Setting up database tables...');
        
        // Connect to the database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'alpha',
            password: process.env.DB_PASSWORD || 'Alpha#777',
            database: process.env.DB_NAME || 'loan_origination_system'
        });
        
        console.log('✅ Connected to MySQL database');
        
        // Read and execute schema
        const fs = require('fs');
        const schemaSQL = fs.readFileSync('./src/database/schema.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
            }
        }
        
        console.log('✅ Database tables created successfully');
        
        // Verify tables were created
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [process.env.DB_NAME || 'loan_origination_system']);
        
        console.log('📋 Tables created:');
        tables.forEach(table => {
            console.log(`   • ${table.TABLE_NAME}`);
        });
        
        console.log('🎉 Database setup completed successfully!');
        console.log('🚀 You can now start the LOS server with: npm start');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupTables();