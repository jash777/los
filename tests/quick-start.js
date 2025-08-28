/**
 * Quick Start Script for Loan Origination System
 * This script helps set up and test the complete LOS system
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class QuickStart {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'los_user',
            password: process.env.DB_PASSWORD || 'los_password',
            database: process.env.DB_NAME || 'loan_origination_system'
        };
    }

    /**
     * Main setup and test runner
     */
    async run() {
        console.log('🚀 Loan Origination System - Quick Start');
        console.log('=' .repeat(50));

        try {
            // Step 1: Check prerequisites
            await this.checkPrerequisites();

            // Step 2: Test database connection
            await this.testDatabaseConnection();

            // Step 3: Wait for server to be ready
            await this.waitForServer();

            // Step 4: Test system health
            await this.testSystemHealth();

            // Step 5: Run complete workflow test
            await this.runWorkflowTest();

            console.log('\n🎉 Quick start completed successfully!');
            console.log('Your Loan Origination System is ready to use.');
            
            this.printUsageInstructions();

        } catch (error) {
            console.error('\n❌ Quick start failed:', error.message);
            this.printTroubleshootingTips();
        }
    }

    /**
     * Check prerequisites
     */
    async checkPrerequisites() {
        console.log('\n📋 Checking Prerequisites...');
        
        // Check if .env file exists
        if (!fs.existsSync('.env')) {
            console.log('⚠️  .env file not found. Creating from template...');
            this.createEnvFile();
        } else {
            console.log('✅ .env file found');
        }

        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            console.log('❌ node_modules not found. Please run: npm install');
            throw new Error('Dependencies not installed');
        } else {
            console.log('✅ Dependencies installed');
        }

        // Check if database schema file exists
        if (!fs.existsSync('src/database/schema.sql')) {
            console.log('❌ Database schema file not found');
            throw new Error('Database schema missing');
        } else {
            console.log('✅ Database schema file found');
        }
    }

    /**
     * Create .env file from template
     */
    createEnvFile() {
        const envContent = `# Loan Origination System Environment Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=los_user
DB_PASSWORD=los_password
DB_NAME=loan_origination_system

# Application Configuration
APP_NAME=Loan Origination System
APP_VERSION=1.0.0
LOG_LEVEL=info

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key

# External Service Configuration (Optional)
CIBIL_API_URL=https://api.cibil.com
CIBIL_API_KEY=your-cibil-api-key
`;

        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file created with default values');
        console.log('   Please update the database credentials if needed');
    }

    /**
     * Test database connection
     */
    async testDatabaseConnection() {
        console.log('\n🗄️  Testing Database Connection...');
        
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            await connection.execute('SELECT 1');
            await connection.end();
            console.log('✅ Database connection successful');
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            console.log('\n💡 Database Setup Instructions:');
            console.log('   1. Make sure MySQL is running');
            console.log('   2. Create database: CREATE DATABASE loan_origination_system;');
            console.log('   3. Create user: CREATE USER \'los_user\'@\'localhost\' IDENTIFIED BY \'los_password\';');
            console.log('   4. Grant permissions: GRANT ALL PRIVILEGES ON loan_origination_system.* TO \'los_user\'@\'localhost\';');
            console.log('   5. Run schema: mysql -u los_user -p loan_origination_system < src/database/schema.sql');
            throw error;
        }
    }

    /**
     * Wait for server to be ready
     */
    async waitForServer(maxAttempts = 30) {
        console.log('\n⏳ Waiting for servers to be ready...');
        
        // Check third-party simulator first
        await this.waitForSimulator();
        
        // Then check main server
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await axios.get(`${this.baseURL}/health`, { timeout: 2000 });
                console.log('✅ Main server is ready');
                return;
            } catch (error) {
                if (i === 0) {
                    console.log('   Main server not ready yet, waiting...');
                }
                await this.sleep(2000); // Wait 2 seconds
            }
        }
        
        throw new Error('Main server did not start within expected time. Please check if the server is running.');
    }

    /**
     * Wait for third-party simulator to be ready
     */
    async waitForSimulator(maxAttempts = 15) {
        const simulatorURL = process.env.THIRD_PARTY_API_URL?.replace('/api', '') || 'http://localhost:4000';
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await axios.get(`${simulatorURL}/health`, { timeout: 2000 });
                console.log('✅ Third-party simulator is ready');
                return;
            } catch (error) {
                if (i === 0) {
                    console.log('   Third-party simulator not ready yet, waiting...');
                }
                await this.sleep(2000); // Wait 2 seconds
            }
        }
        
        console.log('⚠️  Third-party simulator not responding. Some verifications may fail.');
        console.log('   To start simulator: npm run start:simulator');
    }

    /**
     * Test system health
     */
    async testSystemHealth() {
        console.log('\n🏥 Testing System Health...');
        
        try {
            const response = await axios.get(`${this.baseURL}/health`);
            
            if (response.data.success) {
                console.log('✅ System health check passed');
                console.log(`   Database Status: ${response.data.data.database.status}`);
                console.log(`   Total Applications: ${response.data.data.database.total_applications}`);
                console.log(`   System Uptime: ${Math.round(response.data.data.system_info.uptime)}s`);
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            console.log('❌ System health check failed:', error.message);
            throw error;
        }
    }

    /**
     * Run workflow test
     */
    async runWorkflowTest() {
        console.log('\n🧪 Running Complete Workflow Test...');
        
        try {
            // Import and run the complete workflow test
            const CompleteWorkflowTest = require('../src/tests/complete-workflow-test');
            const workflowTest = new CompleteWorkflowTest(this.baseURL);
            
            await workflowTest.runCompleteTest();
            
        } catch (error) {
            console.log('❌ Workflow test failed:', error.message);
            throw error;
        }
    }

    /**
     * Print usage instructions
     */
    printUsageInstructions() {
        console.log('\n📖 Usage Instructions');
        console.log('=' .repeat(50));
        console.log('Your Loan Origination System is now ready!');
        console.log('\n🌐 API Endpoints:');
        console.log(`   Base URL: ${this.baseURL}`);
        console.log('   Health Check: GET /api/health');
        console.log('   System Info: GET /api/');
        console.log('   System Stats: GET /api/stats');
        
        console.log('\n📋 Loan Processing Stages:');
        console.log('   Stage 1: POST /api/pre-qualification/process');
        console.log('   Stage 2: POST /api/application-processing/:applicationNumber');
        console.log('   Stage 3: POST /api/underwriting/:applicationNumber');
        console.log('   Stage 4: POST /api/credit-decision/:applicationNumber');
        console.log('   Stage 6: POST /api/quality-check/:applicationNumber');
        console.log('   Stage 7: POST /api/loan-funding/:applicationNumber');

        console.log('\n🚀 Starting Services:');
        console.log('   Start All: npm run start:all (recommended)');
        console.log('   Start Main Only: npm start');
        console.log('   Start Simulator Only: npm run start:simulator');

        console.log('\n🧪 Testing:');
        console.log('   Complete Workflow: npm run test:workflow');
        console.log('   Individual Stages: npm test');
        console.log('   Quick Start: npm run quick-start');

        console.log('\n🔧 Third-Party Services:');
        console.log('   Simulator URL: http://localhost:4000');
        console.log('   Available Services: PAN, CIBIL, Account Aggregator, Employment');
        console.log('   Health Check: http://localhost:4000/health');

        console.log('\n📚 Documentation:');
        console.log('   Project Structure: PROJECT_STRUCTURE.md');
        console.log('   Setup Guide: SETUP_GUIDE.md');
        console.log('   Database Guide: MYSQL_MIGRATION_GUIDE.md');
        console.log('   Simulator Guide: third-party-simulator/README.md');

        console.log('\n💡 Next Steps:');
        console.log('   1. Customize business rules in src/config/app.js');
        console.log('   2. Configure external API endpoints in .env');
        console.log('   3. Add authentication and authorization');
        console.log('   4. Implement document upload functionality');
        console.log('   5. Add email notifications');
    }

    /**
     * Print troubleshooting tips
     */
    printTroubleshootingTips() {
        console.log('\n🔧 Troubleshooting Tips');
        console.log('=' .repeat(50));
        console.log('If you encountered issues, try these steps:');
        console.log('\n1. Database Issues:');
        console.log('   - Ensure MySQL is running: sudo service mysql start');
        console.log('   - Check database credentials in .env file');
        console.log('   - Verify database and user exist');
        console.log('   - Run database schema: mysql -u los_user -p loan_origination_system < src/database/schema.sql');
        
        console.log('\n2. Server Issues:');
        console.log('   - Check if port 3000 is available');
        console.log('   - Ensure all dependencies are installed: npm install');
        console.log('   - Check server logs for errors');
        console.log('   - Try restarting the server: npm start');
        
        console.log('\n3. API Issues:');
        console.log('   - Verify server is running on http://localhost:3000');
        console.log('   - Check network connectivity');
        console.log('   - Review API endpoint URLs');
        console.log('   - Check request/response format');
        
        console.log('\n4. Test Issues:');
        console.log('   - Ensure database has proper test data');
        console.log('   - Check test configuration');
        console.log('   - Review test logs for specific errors');
        console.log('   - Try running individual stage tests');

        console.log('\n📞 Need Help?');
        console.log('   - Check the documentation files');
        console.log('   - Review the logs in the console');
        console.log('   - Ensure all prerequisites are met');
        console.log('   - Try the setup steps again');
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run quick start if this file is executed directly
if (require.main === module) {
    const quickStart = new QuickStart();
    quickStart.run().catch(console.error);
}

module.exports = QuickStart;