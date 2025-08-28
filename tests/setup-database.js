/**
 * Database Setup Script
 * Creates the required database and user for LOS
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🗄️  Setting up MySQL database for LOS...');
    
    try {
        // Connect to MySQL as root (without specifying database)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: 'alpha',
            password: process.env.DB_PASSWORD || 'Alpha#777'
        });

        console.log('✅ Connected to MySQL server');

        // Create database
        const dbName = process.env.DB_NAME || 'loan_origination_system';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Create user (if not exists)
        const dbUser = process.env.DB_USER || 'los_user';
        const dbPassword = process.env.DB_PASSWORD || 'los_password';
        
        // Fix for the current .env file
        if (process.env.DB_USER === 'alpha') {
            console.log('ℹ️  Using existing user from .env file');
        }
        
        try {
            await connection.execute(`CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}'`);
            console.log(`✅ User '${dbUser}' created/verified`);
        } catch (error) {
            if (error.code !== 'ER_CANNOT_USER') {
                throw error;
            }
            console.log(`ℹ️  User '${dbUser}' already exists`);
        }

        // Grant permissions
        await connection.execute(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`);
        await connection.execute(`FLUSH PRIVILEGES`);
        console.log(`✅ Permissions granted to '${dbUser}'`);

        // Switch to the created database
        await connection.execute(`USE \`${dbName}\``);

        // Create tables using the schema
        console.log('📋 Creating database tables...');
        
        const fs = require('fs');
        const path = require('path');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'src/database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Split schema into individual statements
            const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.execute(statement);
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            console.log(`⚠️  Warning executing statement: ${error.message}`);
                        }
                    }
                }
            }
            
            console.log('✅ Database schema created successfully');
        } else {
            console.log('⚠️  Schema file not found, creating basic tables...');
            
            // Create basic tables if schema file doesn't exist
            await createBasicTables(connection);
        }

        await connection.end();
        
        console.log('');
        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('📋 Connection Details:');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   Port: ${process.env.DB_PORT || 3306}`);
        console.log(`   Database: ${dbName}`);
        console.log(`   User: ${dbUser}`);
        console.log('');
        console.log('🚀 You can now start the LOS server with: npm start');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check if root password is correct');
        console.log('3. Verify MySQL is accessible on the specified host/port');
        console.log('4. Try running: mysql -u root -p');
        process.exit(1);
    }
}

async function createBasicTables(connection) {
    const basicTables = `
        CREATE TABLE IF NOT EXISTS applications (
            id VARCHAR(36) PRIMARY KEY,
            application_number VARCHAR(50) UNIQUE NOT NULL,
            current_stage ENUM('pre-qualification', 'loan-application', 'application-processing', 
                              'underwriting', 'credit-decision', 'quality-check', 'loan-funding') 
                         DEFAULT 'pre-qualification',
            current_status ENUM('pending', 'in-progress', 'approved', 'rejected', 'on-hold', 'completed') 
                          DEFAULT 'pending',
            source_channel VARCHAR(50) DEFAULT 'web',
            priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            total_processing_time_ms BIGINT DEFAULT 0,
            stage_count INT DEFAULT 0,
            INDEX idx_application_number (application_number),
            INDEX idx_stage_status (current_stage, current_status),
            INDEX idx_created_at (created_at)
        );

        CREATE TABLE IF NOT EXISTS applicants (
            id VARCHAR(36) PRIMARY KEY,
            application_id VARCHAR(36) NOT NULL,
            personal_info JSON NOT NULL,
            address_info JSON NULL,
            employment_info JSON NULL,
            loan_request JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
            INDEX idx_application_id (application_id)
        );

        CREATE TABLE IF NOT EXISTS verifications (
            id VARCHAR(36) PRIMARY KEY,
            application_id VARCHAR(36) NOT NULL,
            identity_verification JSON NULL,
            credit_assessment JSON NULL,
            financial_assessment JSON NULL,
            overall_status ENUM('pending', 'in-progress', 'completed', 'failed') DEFAULT 'pending',
            verification_score DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
            INDEX idx_application_id (application_id)
        );

        CREATE TABLE IF NOT EXISTS decisions (
            id VARCHAR(36) PRIMARY KEY,
            application_id VARCHAR(36) NOT NULL,
            stage_name VARCHAR(50) NOT NULL,
            decision ENUM('approved', 'rejected', 'conditional', 'refer_to_manual') NOT NULL,
            decision_reason TEXT NULL,
            decision_score DECIMAL(5,2) DEFAULT 0,
            recommended_terms JSON NULL,
            decision_factors JSON NULL,
            decision_engine_version VARCHAR(20) DEFAULT '1.0',
            processed_by VARCHAR(100) DEFAULT 'system',
            decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
            INDEX idx_application_id (application_id)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(36) PRIMARY KEY,
            application_id VARCHAR(36) NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            action_description TEXT NOT NULL,
            stage_name VARCHAR(50) NULL,
            actor_type ENUM('system', 'employee', 'applicant', 'external_api') DEFAULT 'system',
            actor_name VARCHAR(100) NULL,
            change_data JSON NULL,
            request_id VARCHAR(100) NULL,
            ip_address VARCHAR(45) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
            INDEX idx_application_id (application_id)
        );
    `;

    const statements = basicTables.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
        if (statement.trim()) {
            await connection.execute(statement);
        }
    }
    
    console.log('✅ Basic tables created successfully');
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };