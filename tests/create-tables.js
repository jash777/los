/**
 * Create Database Tables Script
 * Handles table creation properly without USE statements
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTables() {
    let connection;
    
    try {
        console.log('🗄️  Creating database tables...');
        
        // Connect to the specific database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'alpha',
            password: process.env.DB_PASSWORD || 'Alpha#777',
            database: process.env.DB_NAME || 'loan_origination_system'
        });
        
        console.log('✅ Connected to database:', process.env.DB_NAME || 'loan_origination_system');
        
        // Create tables one by one
        const tables = [
            {
                name: 'loan_applications',
                sql: `CREATE TABLE IF NOT EXISTS loan_applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50) UNIQUE NOT NULL,
                    applicant_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    pan_number VARCHAR(10) NOT NULL,
                    aadhar_number VARCHAR(12),
                    loan_amount DECIMAL(15,2) NOT NULL,
                    loan_purpose VARCHAR(255) NOT NULL,
                    employment_type ENUM('salaried', 'self_employed', 'business') NOT NULL,
                    monthly_income DECIMAL(15,2) NOT NULL,
                    current_stage ENUM('pre_qualification', 'application_processing', 'underwriting', 'credit_decision', 'quality_check', 'loan_funding', 'completed') DEFAULT 'pre_qualification',
                    status ENUM('pending', 'approved', 'rejected', 'under_review') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_application_number (application_number),
                    INDEX idx_status (status),
                    INDEX idx_current_stage (current_stage)
                )`
            },
            {
                name: 'stage_processing',
                sql: `CREATE TABLE IF NOT EXISTS stage_processing (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50) NOT NULL,
                    stage_name VARCHAR(50) NOT NULL,
                    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
                    stage_data JSON,
                    processing_notes TEXT,
                    processed_by VARCHAR(100),
                    started_at TIMESTAMP NULL,
                    completed_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_number) REFERENCES loan_applications(application_number) ON DELETE CASCADE,
                    INDEX idx_application_stage (application_number, stage_name),
                    INDEX idx_status (status)
                )`
            },
            {
                name: 'external_verifications',
                sql: `CREATE TABLE IF NOT EXISTS external_verifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50) NOT NULL,
                    verification_type ENUM('pan', 'cibil', 'bank_statement', 'employment', 'gst', 'aadhar') NOT NULL,
                    status ENUM('pending', 'verified', 'failed', 'manual_review') DEFAULT 'pending',
                    request_data JSON,
                    response_data JSON,
                    verification_score DECIMAL(5,2),
                    verified_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_number) REFERENCES loan_applications(application_number) ON DELETE CASCADE,
                    INDEX idx_application_verification (application_number, verification_type),
                    INDEX idx_status (status)
                )`
            },
            {
                name: 'credit_decisions',
                sql: `CREATE TABLE IF NOT EXISTS credit_decisions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50) NOT NULL,
                    decision ENUM('approved', 'rejected', 'conditional_approval') NOT NULL,
                    approved_amount DECIMAL(15,2),
                    interest_rate DECIMAL(5,2),
                    loan_tenure_months INT,
                    conditions TEXT,
                    risk_score DECIMAL(5,2),
                    decision_factors JSON,
                    decided_by VARCHAR(100),
                    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_number) REFERENCES loan_applications(application_number) ON DELETE CASCADE,
                    INDEX idx_application_number (application_number),
                    INDEX idx_decision (decision)
                )`
            },
            {
                name: 'loan_funding',
                sql: `CREATE TABLE IF NOT EXISTS loan_funding (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50) NOT NULL,
                    loan_account_number VARCHAR(50) UNIQUE,
                    disbursement_amount DECIMAL(15,2) NOT NULL,
                    disbursement_date DATE,
                    disbursement_method ENUM('bank_transfer', 'cheque', 'demand_draft') DEFAULT 'bank_transfer',
                    beneficiary_account_number VARCHAR(50),
                    beneficiary_ifsc VARCHAR(11),
                    beneficiary_bank_name VARCHAR(255),
                    disbursement_reference VARCHAR(100),
                    status ENUM('pending', 'processed', 'completed', 'failed') DEFAULT 'pending',
                    funding_notes TEXT,
                    processed_by VARCHAR(100),
                    processed_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_number) REFERENCES loan_applications(application_number) ON DELETE CASCADE,
                    INDEX idx_application_number (application_number),
                    INDEX idx_loan_account (loan_account_number),
                    INDEX idx_status (status)
                )`
            },
            {
                name: 'underwriting_results',
                sql: `CREATE TABLE IF NOT EXISTS underwriting_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_id INT NOT NULL,
                    risk_assessment JSON NULL,
                    policy_compliance JSON NULL,
                    financial_analysis JSON NULL,
                    underwriter_decision ENUM('approve', 'reject', 'conditional', 'refer') NOT NULL,
                    underwriter_comments TEXT NULL,
                    underwriter_id VARCHAR(100) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
                    INDEX idx_application_id (application_id),
                    INDEX idx_underwriter_decision (underwriter_decision)
                )`
            },
            {
                name: 'audit_logs',
                sql: `CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    application_number VARCHAR(50),
                    action VARCHAR(100) NOT NULL,
                    stage VARCHAR(50),
                    user_id VARCHAR(100),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    request_data JSON,
                    response_data JSON,
                    status ENUM('success', 'error', 'warning') DEFAULT 'success',
                    error_message TEXT,
                    processing_time_ms INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_application_number (application_number),
                    INDEX idx_action (action),
                    INDEX idx_created_at (created_at),
                    INDEX idx_status (status)
                )`
            }
        ];
        
        // Create each table
        for (const table of tables) {
            console.log(`📋 Creating table: ${table.name}`);
            await connection.execute(table.sql);
            console.log(`✅ Table ${table.name} created successfully`);
        }
        
        // Verify tables were created
        const [tables_result] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [process.env.DB_NAME || 'loan_origination_system']);
        
        console.log('\\n📊 Database Tables Summary:');
        tables_result.forEach(table => {
            console.log(`   • ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} rows)`);
        });
        
        console.log('\\n🎉 All database tables created successfully!');
        console.log('🚀 You can now start the LOS server with: npm start');
        
    } catch (error) {
        console.error('❌ Table creation failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTables();