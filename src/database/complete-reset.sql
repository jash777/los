-- =====================================================
-- COMPLETE DATABASE RESET AND RECREATE
-- =====================================================

USE loan_origination_system;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all existing tables
DROP TABLE IF EXISTS application_references;
DROP TABLE IF EXISTS application_results;
DROP TABLE IF EXISTS third_party_data;
DROP TABLE IF EXISTS stage_2_data;
DROP TABLE IF EXISTS stage_1_data;
DROP TABLE IF EXISTS stage_processing;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS applications;

-- Drop all views
DROP VIEW IF EXISTS v_complete_application;
DROP VIEW IF EXISTS v_dashboard_metrics;
DROP VIEW IF EXISTS v_complete_applications;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Now recreate with proper structure
-- 1. Applications - Main application registry
CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Current state (matching filesystem structure)
    current_stage ENUM('pre_qualification', 'loan_application', 'application_processing', 
                      'underwriting', 'credit_decision', 'quality_check', 'loan_funding') 
                 DEFAULT 'pre_qualification',
    status ENUM('pending', 'in_progress', 'approved', 'rejected', 'conditional_approval', 'on_hold', 'completed') 
           DEFAULT 'pending',
    
    -- Metadata
    source_channel VARCHAR(50) DEFAULT 'web',
    priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Timestamps (matching filesystem structure)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Processing metrics
    total_processing_time_ms BIGINT DEFAULT 0,
    stage_count INT DEFAULT 0,
    
    INDEX idx_application_number (application_number),
    INDEX idx_stage_status (current_stage, status),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);

-- 2. Stage 1 Data - Pre-qualification (Personal Details + Loan Request + Eligibility)
CREATE TABLE stage_1_data (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    
    -- Personal Details
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    pan_number VARCHAR(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    
    -- Loan Request
    loan_amount DECIMAL(15,2) NOT NULL,
    loan_purpose VARCHAR(50) NOT NULL,
    preferred_tenure_months INT NOT NULL,
    
    -- Eligibility Result
    eligibility_status ENUM('approved', 'rejected', 'pending') DEFAULT 'pending',
    eligibility_score INT DEFAULT 0,
    eligibility_decision ENUM('approved', 'rejected', 'conditional') DEFAULT 'approved',
    eligibility_reasons JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_eligibility_status (eligibility_status)
);

-- 3. Stage 2 Data - Loan Application (Employment + Income + Banking + Address + References)
CREATE TABLE stage_2_data (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    
    -- Employment Details
    employment_type ENUM('salaried', 'self_employed', 'business_owner', 'freelancer') NOT NULL,
    company_name VARCHAR(100) NULL,
    designation VARCHAR(100) NULL,
    work_experience_years INT DEFAULT 0,
    monthly_gross_income DECIMAL(12,2) NULL,
    monthly_net_income DECIMAL(12,2) NULL,
    current_job_experience_years INT DEFAULT 0,
    industry_type VARCHAR(100) NULL,
    employment_status ENUM('permanent', 'contract', 'probation', 'temporary') NULL,
    employee_name VARCHAR(100) NULL,
    
    -- Income Details
    monthly_salary DECIMAL(12,2) NULL,
    other_income DECIMAL(12,2) DEFAULT 0,
    total_monthly_income DECIMAL(12,2) NULL,
    existing_emi DECIMAL(12,2) DEFAULT 0,
    net_monthly_income DECIMAL(12,2) NULL,
    
    -- Banking Details
    account_number VARCHAR(20) NULL,
    ifsc_code VARCHAR(11) NULL,
    bank_name VARCHAR(100) NULL,
    account_type ENUM('savings', 'current', 'salary') NULL,
    average_monthly_balance DECIMAL(12,2) NULL,
    banking_relationship_years INT NULL,
    
    -- Address Details (Current)
    current_street_address VARCHAR(200) NULL,
    current_city VARCHAR(50) NULL,
    current_state VARCHAR(50) NULL,
    current_pincode VARCHAR(10) NULL,
    current_residence_type ENUM('owned', 'rented', 'leased', 'paying_guest') NULL,
    current_years_at_address INT NULL,
    
    -- Address Details (Permanent)
    permanent_street_address VARCHAR(200) NULL,
    permanent_city VARCHAR(50) NULL,
    permanent_state VARCHAR(50) NULL,
    permanent_pincode VARCHAR(10) NULL,
    
    -- References (JSON for flexibility)
    references_data JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_employment_type (employment_type)
);

-- 4. Third Party Data - CIBIL, PAN, Bank Statements, etc.
CREATE TABLE third_party_data (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    
    -- CIBIL Data
    cibil_score INT NULL,
    cibil_grade VARCHAR(10) NULL,
    cibil_report JSON NULL,
    
    -- PAN Verification
    pan_verification_status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    pan_verification_data JSON NULL,
    
    -- Bank Statement Analysis
    bank_analysis_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    bank_analysis_data JSON NULL,
    
    -- Employment Verification
    employment_verification_status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    employment_verification_data JSON NULL,
    
    -- Additional third party data
    additional_data JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_cibil_score (cibil_score)
);

-- 5. Application Results - Final decision and terms
CREATE TABLE application_results (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    
    -- Decision
    final_decision ENUM('approved', 'rejected', 'conditional_approval') DEFAULT 'approved',
    decision_reason TEXT NULL,
    decision_score INT DEFAULT 0,
    
    -- Recommended Terms
    recommended_loan_amount DECIMAL(15,2) NULL,
    recommended_tenure_months INT NULL,
    recommended_interest_rate DECIMAL(5,2) NULL,
    recommended_emi DECIMAL(12,2) NULL,
    
    -- Fees and Charges
    processing_fee_percentage DECIMAL(5,2) DEFAULT 1.0,
    processing_fee_amount DECIMAL(10,2) NULL,
    other_charges JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_final_decision (final_decision)
);

-- 6. Stage Processing - Track application progress
CREATE TABLE stage_processing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    processing_time_ms BIGINT DEFAULT 0,
    result_data JSON NULL,
    error_message TEXT NULL,
    
    INDEX idx_application_stage (application_number, stage_name),
    INDEX idx_status (status)
);

-- 7. Audit Logs - Track all changes
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NULL,
    user_id VARCHAR(50) DEFAULT 'system',
    request_data JSON NULL,
    response_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_application_action (application_number, action),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- VIEWS FOR DASHBOARD
-- =====================================================

-- Complete Application View
CREATE VIEW v_complete_application AS
SELECT 
    a.id,
    a.application_number,
    a.current_stage,
    a.status,
    a.created_at,
    a.last_updated,
    a.completed_at,
    a.total_processing_time_ms,
    a.stage_count,
    
    -- Stage 1 Data
    s1.full_name,
    s1.mobile,
    s1.email,
    s1.pan_number,
    s1.date_of_birth,
    s1.loan_amount,
    s1.loan_purpose,
    s1.preferred_tenure_months,
    s1.eligibility_status,
    s1.eligibility_score,
    s1.eligibility_decision,
    s1.eligibility_reasons,
    
    -- Stage 2 Data
    s2.employment_type,
    s2.company_name,
    s2.designation,
    s2.monthly_gross_income,
    s2.monthly_net_income,
    s2.total_monthly_income,
    s2.existing_emi,
    s2.net_monthly_income,
    s2.bank_name,
    s2.account_number,
    s2.current_city,
    s2.current_state,
    
    -- Third Party Data
    tp.cibil_score,
    tp.cibil_grade,
    tp.pan_verification_status,
    tp.bank_analysis_status,
    
    -- Application Results
    ar.final_decision,
    ar.decision_score,
    ar.recommended_loan_amount,
    ar.recommended_interest_rate,
    ar.processing_fee_amount
    
FROM applications a
LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
LEFT JOIN stage_2_data s2 ON a.id = s2.application_id
LEFT JOIN third_party_data tp ON a.id = tp.application_id
LEFT JOIN application_results ar ON a.id = ar.application_id;

-- Dashboard Metrics View
CREATE VIEW v_dashboard_metrics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
    COUNT(CASE WHEN status = 'conditional_approval' THEN 1 END) as conditional_approval_applications,
    COUNT(CASE WHEN current_stage = 'pre_qualification' THEN 1 END) as pre_qualification_count,
    COUNT(CASE WHEN current_stage = 'loan_application' THEN 1 END) as loan_application_count,
    AVG(total_processing_time_ms) as avg_processing_time_ms,
    SUM(total_processing_time_ms) as total_processing_time_ms,
    AVG(s1.loan_amount) as avg_loan_amount,
    SUM(s1.loan_amount) as total_loan_amount,
    AVG(tp.cibil_score) as avg_cibil_score
FROM applications a
LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
LEFT JOIN third_party_data tp ON a.id = tp.application_id;

SELECT 'Complete database reset and recreation successful!' as message;
