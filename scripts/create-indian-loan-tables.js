/**
 * Create tables for Indian Loan System
 * Two-stage eligibility process tables
 */

require('dotenv').config();
const pool = require('../src/config/database');

const createIndianLoanTables = async () => {
  try {
    console.log('🇮🇳 Creating Indian Loan System tables...\n');

    // Enhance existing loan_applications table for Indian requirements
    console.log('1. Enhancing loan_applications table for Indian requirements...');
    await pool.query(`
      ALTER TABLE loan_applications 
      ADD COLUMN IF NOT EXISTS pan_number VARCHAR(15),
      ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30),
      ADD COLUMN IF NOT EXISTS employer_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS work_experience DECIMAL(4,2),
      ADD COLUMN IF NOT EXISTS bureau_consent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS indian_loan_data JSONB
    `);

    // Enhance existing eligibility_assessments table
    console.log('2. Enhancing eligibility_assessments table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eligibility_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) UNIQUE NOT NULL,
        eligible BOOLEAN NOT NULL,
        eligibility_score INTEGER,
        risk_grade VARCHAR(10),
        max_loan_amount DECIMAL(12,2),
        recommended_amount DECIMAL(12,2),
        interest_rate DECIMAL(5,2),
        tenure INTEGER,
        reasons JSONB,
        checks JSONB,
        recommendations JSONB,
        processing_time INTEGER,
        enhanced_result JSONB,
        request_id VARCHAR(50),
        assessed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enhance existing credit bureau analysis table
    console.log('3. Enhancing credit_bureau_analysis table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS credit_bureau_analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        credit_score INTEGER,
        risk_grade VARCHAR(10),
        bureau_results JSONB,
        raw_bureau_data JSONB,
        analysis_parameters JSONB,
        request_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workflow tracking table
    console.log('4. Creating workflow_tracking table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) NOT NULL,
        stage_name VARCHAR(50) NOT NULL,
        stage_status VARCHAR(20) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        request_id VARCHAR(50),
        error_message TEXT,
        stage_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(application_id, stage_name)
      )
    `);

    // Create loan processing table
    console.log('5. Creating loan_processing table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_processing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) UNIQUE NOT NULL,
        secondary_application_id VARCHAR(50) NOT NULL,
        loan_terms JSONB NOT NULL,
        agreement_details JSONB,
        disbursement_details JSONB,
        repayment_schedule JSONB,
        status VARCHAR(50) DEFAULT 'processing' CHECK (status IN (
          'processing', 'agreement_pending', 'agreement_signed', 'disbursed', 'active', 'closed'
        )),
        processing_stage VARCHAR(50) DEFAULT 'documentation' CHECK (processing_stage IN (
          'documentation', 'verification', 'approval', 'agreement', 'disbursement'
        )),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (secondary_application_id) REFERENCES secondary_applications(application_id)
      )
    `);

    // Create document verification table
    console.log('4. Creating document_verification table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_verification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) NOT NULL,
        application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('preliminary', 'secondary')),
        document_type VARCHAR(50) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
          'pending', 'verified', 'rejected', 'requires_resubmission'
        )),
        verification_notes TEXT,
        verified_by UUID,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reference verification table
    console.log('5. Creating reference_verification table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reference_verification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) NOT NULL,
        reference_name VARCHAR(100) NOT NULL,
        reference_mobile VARCHAR(15) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
          'pending', 'contacted', 'verified', 'failed', 'unreachable'
        )),
        verification_notes TEXT,
        contact_attempts INTEGER DEFAULT 0,
        last_contact_attempt TIMESTAMP,
        verified_by UUID,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create credit assessment table
    console.log('6. Creating credit_assessment table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS credit_assessment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) NOT NULL,
        credit_score INTEGER,
        credit_report JSONB,
        bureau_response JSONB,
        risk_grade VARCHAR(10) CHECK (risk_grade IN ('A', 'B', 'C', 'D', 'E')),
        assessment_result VARCHAR(20) CHECK (assessment_result IN ('approved', 'rejected', 'review')),
        assessment_notes TEXT,
        assessed_by UUID,
        assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create loan terms table
    console.log('7. Creating loan_terms table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_terms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id VARCHAR(50) UNIQUE NOT NULL,
        approved_amount DECIMAL(12,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        tenure_months INTEGER NOT NULL,
        emi_amount DECIMAL(10,2) NOT NULL,
        processing_fee DECIMAL(10,2) DEFAULT 0,
        insurance_fee DECIMAL(10,2) DEFAULT 0,
        total_interest DECIMAL(12,2) NOT NULL,
        total_repayment DECIMAL(12,2) NOT NULL,
        terms_conditions TEXT,
        offer_valid_until DATE,
        status VARCHAR(20) DEFAULT 'generated' CHECK (status IN (
          'generated', 'presented', 'accepted', 'rejected', 'expired'
        )),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    console.log('8. Creating indexes...');
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preliminary_applications_status ON preliminary_applications(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preliminary_applications_created_at ON preliminary_applications(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_secondary_applications_status ON secondary_applications(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_secondary_applications_preliminary_id ON secondary_applications(preliminary_application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_processing_status ON loan_processing(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_processing_stage ON loan_processing(processing_stage)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_verification_application ON document_verification(application_id, application_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_verification_status ON document_verification(verification_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reference_verification_application ON reference_verification(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reference_verification_status ON reference_verification(verification_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_assessment_application ON credit_assessment(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_terms_application ON loan_terms(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_terms_status ON loan_terms(status)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
      } catch (error) {
        console.log(`Index creation skipped (may already exist): ${error.message}`);
      }
    }

    console.log('\n✅ Indian Loan System tables created successfully!');
    console.log('\n📊 Tables Summary:');
    console.log('   - preliminary_applications: Stage 1 eligibility data');
    console.log('   - secondary_applications: Stage 2 detailed eligibility data');
    console.log('   - loan_processing: Loan processing and disbursement tracking');
    console.log('   - document_verification: Document verification tracking');
    console.log('   - reference_verification: Reference verification tracking');
    console.log('   - credit_assessment: Credit score and risk assessment');
    console.log('   - loan_terms: Approved loan terms and conditions');
    console.log('   - Optimized indexes: 13 indexes for better performance');

  } catch (error) {
    console.error('❌ Error creating Indian Loan System tables:', error);
    throw error;
  }
};

module.exports = { createIndianLoanTables };

// Also create the main loan_applications table if it doesn't exist
const createMainTables = async () => {
  console.log('9. Creating main loan_applications table if not exists...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loan_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_number VARCHAR(50) UNIQUE NOT NULL,
      borrower_id UUID,
      full_name VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      requested_amount DECIMAL(12,2),
      loan_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('10. Creating audit_logs table if not exists...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id VARCHAR(50),
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      user_role VARCHAR(50),
      details JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

if (require.main === module) {
  createIndianLoanTables()
    .then(() => createMainTables())
    .then(() => {
      console.log('\n🎉 Indian Loan System setup completed!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Start the server: npm start');
      console.log('   2. Import Postman collection: Indian_Loan_System.postman_collection.json');
      console.log('   3. Test the API endpoints');
      console.log('   4. Check dashboard at: /api/indian-loan-dashboard/overview');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Indian Loan System setup failed:', error);
      process.exit(1);
    });
}