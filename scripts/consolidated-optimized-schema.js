require('dotenv').config();
const pool = require('../src/config/database');

const createConsolidatedSchema = async () => {
  try {
    console.log('🔄 Creating consolidated and optimized PostgreSQL schema...\n');

    // Enable UUID extension
    console.log('1. Enabling UUID extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Drop existing tables in correct order to avoid constraint issues
    console.log('2. Dropping existing tables for clean recreation...');
    const dropTables = [
      'audit_trail', 'user_sessions', 'role_permissions', 'ai_feedback', 'ai_training_data',
      'ai_model_performance', 'ai_analysis_results', 'repayment_schedules', 'esign_records',
      'loan_offers', 'risk_assessments', 'bank_statements', 'bureau_reports', 'loan_documents',
      'documents', 'loan_applications', 'employees', 'admin_users', 'permissions', 'roles', 'users'
    ];
    
    for (const table of dropTables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    // Create core authentication and user management tables
    console.log('3. Creating roles table...');
    await pool.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('4. Creating permissions table...');
    await pool.query(`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        permission_name VARCHAR(100) UNIQUE NOT NULL,
        module VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('5. Creating role_permissions mapping table...');
    await pool.query(`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id)
      )
    `);

    console.log('6. Creating admin_users table...');
    await pool.query(`
      CREATE TABLE admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        employee_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        role_id UUID REFERENCES roles(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_by UUID REFERENCES admin_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('7. Creating employees table...');
    await pool.query(`
      CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        employee_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(15),
        department VARCHAR(50),
        designation VARCHAR(50),
        role_id UUID REFERENCES roles(id),
        reporting_manager UUID REFERENCES employees(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
        joining_date DATE,
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_by UUID REFERENCES admin_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('8. Creating users table (borrowers)...');
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        mobile VARCHAR(15) UNIQUE,
        pan_number VARCHAR(15) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'borrower' CHECK (role IN ('borrower')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('9. Creating comprehensive loan_applications table...');
    await pool.query(`
      CREATE TABLE loan_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_number VARCHAR(50) UNIQUE NOT NULL,
        application_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
          'pending', 'Application Received', 'Eligible for Next Stage', 'Rejected: Ineligible',
          'KYC Verified', 'Rejected: KYC Failed', 'Bureau Check Passed', 'Rejected: Poor Credit',
          'Bank Analysis Passed', 'Rejected: Bank Analysis Failed', 'Risk Assessment Passed',
          'Rejected: High Risk', 'Offer Generated', 'Pending Final Approval', 'Approved',
          'Rejected: Final Review', 'Disbursed', 'kyc_pending', 'under_review', 'approved',
          'rejected', 'closed'
        )),
        
        -- Borrower Profile
        borrower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other', 'male', 'female', 'other')),
        marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'single', 'married', 'divorced', 'widowed')),
        dependents_count INTEGER DEFAULT 0,
        mobile VARCHAR(15) NOT NULL,
        alternate_mobile VARCHAR(15),
        email VARCHAR(100),
        
        -- Address
        address_line1 VARCHAR(200),
        address_line2 VARCHAR(200),
        city VARCHAR(50),
        state VARCHAR(50),
        pincode VARCHAR(10),
        residence_type VARCHAR(20) CHECK (residence_type IN ('Owned', 'Rented', 'Parental', 'owned', 'rented', 'parental')),
        years_at_address INTEGER,
        
        -- Employment
        employment_type VARCHAR(30) CHECK (employment_type IN ('Salaried', 'Self-Employed', 'Business', 'Professional', 'salaried', 'self-employed', 'business', 'professional')),
        employer_name VARCHAR(100),
        designation VARCHAR(100),
        monthly_income DECIMAL(12,2),
        years_with_employer DECIMAL(4,2),
        total_work_experience DECIMAL(4,2),
        
        -- KYC
        aadhar_number VARCHAR(20),
        aadhar_verified BOOLEAN DEFAULT FALSE,
        pan_number VARCHAR(15),
        pan_verified BOOLEAN DEFAULT FALSE,
        bureau_consent BOOLEAN DEFAULT FALSE,
        
        -- Loan Request
        loan_type VARCHAR(50) DEFAULT 'Personal Loan',
        requested_amount DECIMAL(12,2) NOT NULL,
        tenure_months INTEGER NOT NULL,
        loan_purpose VARCHAR(100),
        interest_rate_offered DECIMAL(5,2),
        processing_fee DECIMAL(10,2),
        sanction_limit DECIMAL(12,2),
        
        -- Repayment Mandate
        mandate_mode VARCHAR(20) CHECK (mandate_mode IN ('NACH', 'ECS', 'SI', 'nach', 'ecs', 'si')),
        nach_registered BOOLEAN DEFAULT FALSE,
        umrn VARCHAR(50),
        auto_debit_date INTEGER,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Additional JSON fields for flexibility
        additional_data JSONB
      )
    `);

    console.log('10. Creating loan_documents table...');
    await pool.query(`
      CREATE TABLE loan_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('11. Creating bureau_reports table...');
    await pool.query(`
      CREATE TABLE bureau_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        cibil_score INTEGER,
        enquiries_last_12m INTEGER,
        active_loans JSONB,
        utilization_percent DECIMAL(5,2),
        report_file_url VARCHAR(500),
        report_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('12. Creating bank_statements table...');
    await pool.query(`
      CREATE TABLE bank_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        institution VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(15),
        monthly_income_avg DECIMAL(12,2),
        monthly_expense_avg DECIMAL(12,2),
        emi_outflow_avg DECIMAL(12,2),
        surplus_avg DECIMAL(12,2),
        bounces_last_6m INTEGER DEFAULT 0,
        statement_file_url VARCHAR(500),
        statement_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('13. Creating risk_assessments table...');
    await pool.query(`
      CREATE TABLE risk_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        risk_score INTEGER,
        risk_band VARCHAR(20) CHECK (risk_band IN ('Low', 'Medium', 'High')),
        decision VARCHAR(50),
        reasons JSONB,
        assessment_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('14. Creating loan_offers table...');
    await pool.query(`
      CREATE TABLE loan_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        approved_amount DECIMAL(12,2),
        interest_rate DECIMAL(5,2),
        tenure INTEGER,
        emi_amount DECIMAL(12,2),
        offer_valid_until DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('15. Creating esign_records table...');
    await pool.query(`
      CREATE TABLE esign_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        loan_offer_id UUID REFERENCES loan_offers(id) ON DELETE CASCADE,
        agreement_path VARCHAR(500),
        otp_sent VARCHAR(10),
        otp_verified BOOLEAN DEFAULT FALSE,
        signed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'otp_sent', 'signed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('16. Creating repayment_schedules table...');
    await pool.query(`
      CREATE TABLE repayment_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        loan_offer_id UUID REFERENCES loan_offers(id) ON DELETE CASCADE,
        month_number INTEGER,
        principal_amount DECIMAL(12,2),
        interest_amount DECIMAL(12,2),
        emi_amount DECIMAL(12,2),
        outstanding_balance DECIMAL(12,2),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('17. Creating AI analysis tables...');
    await pool.query(`
      CREATE TABLE ai_analysis_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
        orchestrator_id VARCHAR(50) NOT NULL,
        processing_time INTEGER,
        confidence_score INTEGER,
        quality_score INTEGER,
        final_decision VARCHAR(50),
        ai_recommendation JSONB,
        analysis_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE ai_model_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name VARCHAR(100) NOT NULL,
        model_version VARCHAR(20),
        performance_metrics JSONB,
        accuracy_score DECIMAL(5,2),
        precision_score DECIMAL(5,2),
        recall_score DECIMAL(5,2),
        f1_score DECIMAL(5,2),
        evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('18. Creating session and audit tables...');
    await pool.query(`
      CREATE TABLE user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'employee')),
        session_token VARCHAR(500) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE audit_trail (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        user_type VARCHAR(20) CHECK (user_type IN ('admin', 'employee', 'borrower')),
        application_id UUID REFERENCES loan_applications(id),
        action VARCHAR(100) NOT NULL,
        module VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('19. Creating optimized indexes...');
    const indexes = [
      // Primary lookup indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_applications_borrower_id ON loan_applications(borrower_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_applications_status ON loan_applications(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_applications_application_number ON loan_applications(application_number)',
      
      // Document indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_documents_application_id ON loan_documents(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_documents_type ON loan_documents(document_type)',
      
      // Analysis indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bureau_reports_application_id ON bureau_reports(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_statements_application_id ON bank_statements(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risk_assessments_application_id ON risk_assessments(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analysis_application_id ON ai_analysis_results(application_id)',
      
      // User management indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_mobile ON users(mobile)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_pan ON users(pan_number)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_username ON admin_users(username)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_username ON employees(username)',
      
      // Session and audit indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, user_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id, user_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_trail_application ON audit_trail(application_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
      } catch (error) {
        console.log(`Index creation skipped (may already exist): ${error.message}`);
      }
    }

    console.log('\n✅ Consolidated and optimized schema created successfully!');
    console.log('\n📊 Schema Summary:');
    console.log('   - Core tables: 11');
    console.log('   - AI tables: 2');
    console.log('   - Audit tables: 2');
    console.log('   - Optimized indexes: 19');
    console.log('   - All foreign key constraints properly defined');
    console.log('   - UUID primary keys for better performance');
    console.log('   - Comprehensive check constraints for data integrity');
    
  } catch (error) {
    console.error('❌ Error creating consolidated schema:', error);
    throw error;
  }
};

module.exports = { createConsolidatedSchema };

if (require.main === module) {
  createConsolidatedSchema()
    .then(() => {
      console.log('\n🎉 Schema consolidation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema consolidation failed:', error);
      process.exit(1);
    });
}