/**
 * Create database tables for preliminary check modules
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createPreliminaryCheckTables() {
    try {
        console.log('🔧 Creating preliminary check tables...\n');

        // 1. Create PAN verifications table
        console.log('1. Creating pan_verifications table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pan_verifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                pan_number VARCHAR(10) UNIQUE NOT NULL,
                verification_status VARCHAR(50) NOT NULL,
                verification_details JSONB,
                verified_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create CIBIL scores table
        console.log('2. Creating cibil_scores table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cibil_scores (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                pan_number VARCHAR(10) UNIQUE NOT NULL,
                credit_score INTEGER,
                credit_grade VARCHAR(20),
                status VARCHAR(50) NOT NULL,
                score_details JSONB,
                fetched_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Create preliminary assessments table
        console.log('3. Creating preliminary_assessments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS preliminary_assessments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id VARCHAR(50) UNIQUE NOT NULL,
                pan_verification_status VARCHAR(50),
                pan_verification_details JSONB,
                cibil_score INTEGER,
                cibil_status VARCHAR(50),
                cibil_details JSONB,
                eligibility_score INTEGER,
                eligible BOOLEAN DEFAULT false,
                eligibility_details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Create indexes for better performance
        console.log('4. Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pan_verifications_pan_number ON pan_verifications(pan_number);
            CREATE INDEX IF NOT EXISTS idx_pan_verifications_status ON pan_verifications(verification_status);
            CREATE INDEX IF NOT EXISTS idx_cibil_scores_pan_number ON cibil_scores(pan_number);
            CREATE INDEX IF NOT EXISTS idx_cibil_scores_score ON cibil_scores(credit_score);
            CREATE INDEX IF NOT EXISTS idx_preliminary_assessments_application_id ON preliminary_assessments(application_id);
            CREATE INDEX IF NOT EXISTS idx_preliminary_assessments_eligible ON preliminary_assessments(eligible);
        `);

        console.log('\n✅ Preliminary check tables created successfully!');
        console.log('📊 Tables created:');
        console.log('   - pan_verifications (PAN verification results)');
        console.log('   - cibil_scores (CIBIL score cache)');
        console.log('   - preliminary_assessments (complete assessments)');
        console.log('\n🚀 Preliminary check system is ready!');

    } catch (error) {
        console.error('❌ Error creating preliminary check tables:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the setup if this file is executed directly
if (require.main === module) {
    createPreliminaryCheckTables().catch(console.error);
}

module.exports = { createPreliminaryCheckTables };