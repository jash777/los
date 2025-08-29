-- =====================================================
-- REFINED UNIFIED DATABASE SCHEMA FOR DUAL WORKFLOWS (MySQL Compatible)
-- =====================================================
-- Supports both LOS automated workflow and dashboard-driven employee workflow
-- Fixed for MySQL version compatibility

-- =====================================================
-- 1. CORE APPLICATION MANAGEMENT
-- =====================================================

-- Enhanced Loan Applications Table
CREATE TABLE IF NOT EXISTS loan_applications_enhanced (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Workflow Management
    workflow_type ENUM('los_automated', 'dashboard_driven', 'hybrid') DEFAULT 'los_automated',
    current_stage ENUM(
        'application_submitted', 'initial_review', 'pre_qualification', 'document_collection',
        'kyc_verification', 'employment_verification', 'financial_assessment', 
        'credit_evaluation', 'underwriting', 'credit_decision', 'quality_check', 
        'approval_processing', 'loan_funding', 'completed', 'rejected', 'cancelled'
    ) DEFAULT 'application_submitted',
    current_status ENUM('pending', 'in_progress', 'approved', 'rejected', 'on_hold', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Basic Application Data
    loan_amount DECIMAL(15,2) NOT NULL,
    loan_purpose VARCHAR(255) NOT NULL,
    requested_tenure_months INT DEFAULT 36,
    
    -- Priority and Assignment
    priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to VARCHAR(100) NULL,
    assigned_at TIMESTAMP NULL,
    
    -- Source and Channel
    source_channel VARCHAR(50) DEFAULT 'web',
    source_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Processing Metadata
    total_processing_time_ms BIGINT DEFAULT 0,
    stage_count INT DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- Indexes
    INDEX idx_application_number (application_number),
    INDEX idx_workflow_type (workflow_type),
    INDEX idx_stage_status (current_stage, current_status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_priority (priority_level),
    INDEX idx_created_at (created_at),
    INDEX idx_last_activity (last_activity_at)
);

-- =====================================================
-- 2. COMPREHENSIVE APPLICANT PROFILES
-- =====================================================

-- Unified Applicant Profiles with Complete KYC Data
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(300) AS (CONCAT(first_name, ' ', IFNULL(CONCAT(middle_name, ' '), ''), last_name)),
    date_of_birth DATE NOT NULL,
    age INT AS (TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE())),
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed') NULL,
    number_of_dependents INT DEFAULT 0,
    
    -- Contact Information
    primary_email VARCHAR(255) NOT NULL,
    secondary_email VARCHAR(255) NULL,
    primary_mobile VARCHAR(20) NOT NULL,
    secondary_mobile VARCHAR(20) NULL,
    landline VARCHAR(20) NULL,
    
    -- Identity Documents
    pan_number VARCHAR(10) NOT NULL,
    pan_verified BOOLEAN DEFAULT FALSE,
    pan_verification_date TIMESTAMP NULL,
    aadhar_number VARCHAR(12) NULL,
    aadhar_verified BOOLEAN DEFAULT FALSE,
    aadhar_verification_date TIMESTAMP NULL,
    passport_number VARCHAR(20) NULL,
    driving_license_number VARCHAR(20) NULL,
    voter_id VARCHAR(20) NULL,
    
    -- Address Information (JSON for flexibility)
    current_address JSON NOT NULL,
    permanent_address JSON NULL,
    office_address JSON NULL,
    address_verified BOOLEAN DEFAULT FALSE,
    address_verification_date TIMESTAMP NULL,
    
    -- Employment Details
    employment_type ENUM('salaried', 'self_employed', 'business_owner', 'professional', 'retired', 'unemployed') NOT NULL,
    company_name VARCHAR(255) NULL,
    designation VARCHAR(100) NULL,
    work_experience_years DECIMAL(4,2) DEFAULT 0,
    industry_type VARCHAR(100) NULL,
    monthly_income DECIMAL(15,2) NOT NULL,
    annual_income DECIMAL(15,2) AS (monthly_income * 12),
    income_verified BOOLEAN DEFAULT FALSE,
    income_verification_date TIMESTAMP NULL,
    
    -- Banking Information
    primary_bank_name VARCHAR(100) NULL,
    primary_account_number VARCHAR(30) NULL,
    primary_account_type ENUM('savings', 'current', 'salary') NULL,
    primary_ifsc_code VARCHAR(11) NULL,
    banking_relationship_years INT DEFAULT 0,
    average_monthly_balance DECIMAL(15,2) DEFAULT 0,
    
    -- Credit Profile
    cibil_score INT NULL,
    cibil_grade VARCHAR(2) NULL,
    cibil_report_date TIMESTAMP NULL,
    existing_loans_count INT DEFAULT 0,
    total_existing_emi DECIMAL(15,2) DEFAULT 0,
    credit_cards_count INT DEFAULT 0,
    credit_utilization_ratio DECIMAL(5,4) DEFAULT 0,
    
    -- Risk Assessment
    risk_category ENUM('low', 'medium', 'high', 'critical') NULL,
    risk_score DECIMAL(5,2) DEFAULT 0,
    fraud_indicators JSON NULL,
    
    -- Verification Status
    kyc_status ENUM('pending', 'in_progress', 'completed', 'failed', 'expired') DEFAULT 'pending',
    kyc_completion_percentage DECIMAL(5,2) DEFAULT 0,
    overall_verification_score DECIMAL(5,2) DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- Foreign Key and Indexes
    FOREIGN KEY (application_id) REFERENCES loan_applications_enhanced(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_full_name (full_name),
    INDEX idx_pan_number (pan_number),
    INDEX idx_aadhar_number (aadhar_number),
    INDEX idx_primary_email (primary_email),
    INDEX idx_primary_mobile (primary_mobile),
    INDEX idx_employment_type (employment_type),
    INDEX idx_monthly_income (monthly_income),
    INDEX idx_cibil_score (cibil_score),
    INDEX idx_risk_category (risk_category),
    INDEX idx_kyc_status (kyc_status),
    
    -- Unique constraints
    UNIQUE KEY unique_pan_per_app (application_id, pan_number)
);

-- =====================================================
-- 3. WORKFLOW STATE MANAGEMENT
-- =====================================================

-- Comprehensive Workflow State Tracking
CREATE TABLE IF NOT EXISTS workflow_states (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Workflow Information
    workflow_type ENUM('los_automated', 'dashboard_driven', 'hybrid') NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    stage_order INT NOT NULL,
    
    -- State Information
    status ENUM('pending', 'in_progress', 'completed', 'failed', 'skipped', 'on_hold') DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    processing_time_ms BIGINT DEFAULT 0,
    
    -- Processing Details
    processed_by VARCHAR(100) DEFAULT 'system',
    processing_method ENUM('automated', 'manual', 'hybrid') DEFAULT 'automated',
    
    -- Results and Data
    stage_result JSON NULL,
    stage_data JSON NULL,
    error_details JSON NULL,
    
    -- Decision Information
    decision ENUM('approved', 'rejected', 'conditional', 'refer_manual', 'escalate') NULL,
    decision_reason TEXT NULL,
    decision_score DECIMAL(5,2) DEFAULT 0,
    
    -- Quality Metrics
    confidence_score DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key and Indexes
    FOREIGN KEY (application_id) REFERENCES loan_applications_enhanced(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_workflow_type (workflow_type),
    INDEX idx_stage_name (stage_name),
    INDEX idx_status (status),
    INDEX idx_processed_by (processed_by),
    INDEX idx_processing_method (processing_method),
    INDEX idx_started_at (started_at),
    INDEX idx_stage_order (stage_order),
    
    -- Unique constraint to prevent duplicate stage entries per application
    UNIQUE KEY unique_app_stage (application_id, stage_name)
);

-- =====================================================
-- 4. COMPREHENSIVE KYC VERIFICATIONS
-- =====================================================

-- Detailed KYC Verification Tracking
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    applicant_profile_id VARCHAR(36) NOT NULL,
    
    -- Verification Details
    verification_type ENUM(
        'pan_verification', 'aadhar_verification', 'bank_verification', 
        'employment_verification', 'address_verification', 'income_verification',
        'cibil_check', 'fraud_check', 'reference_check'
    ) NOT NULL,
    
    -- Verification Status
    status ENUM('pending', 'in_progress', 'completed', 'failed', 'expired', 'not_required') DEFAULT 'pending',
    verification_method ENUM('api', 'manual', 'document', 'biometric', 'otp', 'video_call') NOT NULL,
    
    -- Verification Data
    request_data JSON NULL,
    response_data JSON NULL,
    verification_score DECIMAL(5,2) DEFAULT 0,
    confidence_level DECIMAL(5,2) DEFAULT 0,
    
    -- External Service Details
    service_provider VARCHAR(100) NULL,
    service_reference_id VARCHAR(100) NULL,
    service_response_time_ms INT DEFAULT 0,
    service_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Verification Results
    verified_data JSON NULL,
    match_percentage DECIMAL(5,2) DEFAULT 0,
    discrepancies JSON NULL,
    
    -- Timing Information
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    
    -- Processing Information
    processed_by VARCHAR(100) DEFAULT 'system',
    reviewer_notes TEXT NULL,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys and Indexes
    FOREIGN KEY (application_id) REFERENCES loan_applications_enhanced(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_profile_id) REFERENCES applicant_profiles(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_applicant_profile_id (applicant_profile_id),
    INDEX idx_verification_type (verification_type),
    INDEX idx_status (status),
    INDEX idx_verification_method (verification_method),
    INDEX idx_service_provider (service_provider),
    INDEX idx_initiated_at (initiated_at),
    INDEX idx_processed_by (processed_by)
);

-- =====================================================
-- 5. DOCUMENT MANAGEMENT SYSTEM
-- =====================================================

-- Comprehensive Document Attachments
CREATE TABLE IF NOT EXISTS document_attachments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    applicant_profile_id VARCHAR(36) NOT NULL,
    
    -- Document Classification
    document_category ENUM(
        'identity', 'address', 'income', 'employment', 'banking', 
        'property', 'insurance', 'legal', 'other'
    ) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_subtype VARCHAR(100) NULL,
    
    -- File Information
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    
    -- Document Metadata
    document_date DATE NULL,
    expiry_date DATE NULL,
    issuing_authority VARCHAR(200) NULL,
    document_number VARCHAR(100) NULL,
    
    -- Processing Status
    processing_status ENUM('uploaded', 'processing', 'processed', 'verified', 'rejected', 'expired') DEFAULT 'uploaded',
    verification_status ENUM('pending', 'verified', 'rejected', 'requires_resubmission') DEFAULT 'pending',
    
    -- Extracted Data
    extracted_data JSON NULL,
    ocr_confidence DECIMAL(5,2) DEFAULT 0,
    
    -- Verification Results
    verification_score DECIMAL(5,2) DEFAULT 0,
    verification_details JSON NULL,
    rejection_reason TEXT NULL,
    
    -- Upload Information
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_from VARCHAR(50) DEFAULT 'web',
    upload_ip VARCHAR(45) NULL,
    
    -- Processing Information
    processed_by VARCHAR(100) NULL,
    verified_by VARCHAR(100) NULL,
    verified_at TIMESTAMP NULL,
    
    -- Requirements
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_sensitive BOOLEAN DEFAULT FALSE,
    retention_period_months INT DEFAULT 84, -- 7 years
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys and Indexes
    FOREIGN KEY (application_id) REFERENCES loan_applications_enhanced(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_profile_id) REFERENCES applicant_profiles(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_applicant_profile_id (applicant_profile_id),
    INDEX idx_document_category (document_category),
    INDEX idx_document_type (document_type),
    INDEX idx_processing_status (processing_status),
    INDEX idx_verification_status (verification_status),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_hash (file_hash),
    INDEX idx_created_at (created_at),
    
    -- Unique constraint for file hash to prevent duplicates
    UNIQUE KEY unique_file_hash (file_hash)
);

-- =====================================================
-- 6. WORKFLOW TRANSITIONS AND AUDIT TRAIL
-- =====================================================

-- Comprehensive Workflow Transition Tracking
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Transition Details
    from_stage VARCHAR(50) NULL,
    to_stage VARCHAR(50) NOT NULL,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NOT NULL,
    workflow_type ENUM('los_automated', 'dashboard_driven', 'hybrid') NOT NULL,
    
    -- Trigger Information
    trigger_type ENUM('automatic', 'manual', 'scheduled', 'api', 'rule_based') NOT NULL,
    triggered_by VARCHAR(100) NOT NULL,
    trigger_reason TEXT NULL,
    
    -- Decision Information
    decision_data JSON NULL,
    business_rules_applied JSON NULL,
    
    -- Processing Context
    processing_context JSON NULL,
    system_state JSON NULL,
    
    -- Performance Metrics
    transition_time_ms BIGINT DEFAULT 0,
    
    -- Audit Information
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(100) NULL,
    request_id VARCHAR(100) NULL,
    
    -- Timestamp
    transitioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key and Indexes
    FOREIGN KEY (application_id) REFERENCES loan_applications_enhanced(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_from_stage (from_stage),
    INDEX idx_to_stage (to_stage),
    INDEX idx_workflow_type (workflow_type),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_triggered_by (triggered_by),
    INDEX idx_transitioned_at (transitioned_at)
);

-- =====================================================
-- 7. ENHANCED VIEWS FOR DUAL WORKFLOW SUPPORT
-- =====================================================

-- Dashboard Summary View for Both Workflows
CREATE OR REPLACE VIEW v_dual_workflow_dashboard AS
SELECT 
    workflow_type,
    current_stage,
    current_status,
    COUNT(*) as application_count,
    AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(updated_at, NOW()))) as avg_processing_hours,
    MIN(created_at) as oldest_application,
    MAX(updated_at) as latest_activity
FROM loan_applications_enhanced
GROUP BY workflow_type, current_stage, current_status
ORDER BY workflow_type, current_stage, current_status;

-- =====================================================
-- 8. DATA MIGRATION FROM EXISTING TABLES
-- =====================================================

-- Migrate existing loan_applications data
INSERT INTO loan_applications_enhanced (
    application_number, workflow_type, current_stage, current_status,
    loan_amount, loan_purpose, source_channel, created_at, updated_at
)
SELECT 
    application_number,
    'los_automated' as workflow_type,
    CASE 
        WHEN current_stage = 'pre_qualification' THEN 'pre_qualification'
        WHEN current_stage = 'application_processing' THEN 'document_collection'
        WHEN current_stage = 'underwriting' THEN 'underwriting'
        WHEN current_stage = 'credit_decision' THEN 'credit_decision'
        WHEN current_stage = 'quality_check' THEN 'quality_check'
        WHEN current_stage = 'loan_funding' THEN 'loan_funding'
        WHEN current_stage = 'completed' THEN 'completed'
        ELSE 'pre_qualification'
    END as current_stage,
    CASE 
        WHEN status = 'pending' THEN 'pending'
        WHEN status = 'approved' THEN 'approved'
        WHEN status = 'rejected' THEN 'rejected'
        WHEN status = 'under_review' THEN 'in_progress'
        ELSE 'pending'
    END as current_status,
    loan_amount,
    loan_purpose,
    'web' as source_channel,
    created_at,
    updated_at
FROM loan_applications
WHERE NOT EXISTS (
    SELECT 1 FROM loan_applications_enhanced lae 
    WHERE lae.application_number = loan_applications.application_number
);

-- Migrate applicant data to profiles
INSERT INTO applicant_profiles (
    application_id, first_name, last_name, date_of_birth,
    primary_email, primary_mobile, pan_number, aadhar_number,
    employment_type, monthly_income, current_address, permanent_address,
    created_at, updated_at
)
SELECT 
    lae.id as application_id,
    SUBSTRING_INDEX(la.applicant_name, ' ', 1) as first_name,
    CASE 
        WHEN LOCATE(' ', la.applicant_name) > 0 THEN SUBSTRING_INDEX(la.applicant_name, ' ', -1)
        ELSE la.applicant_name
    END as last_name,
    COALESCE(DATE('1990-01-01'), CURDATE()) as date_of_birth,
    la.email as primary_email,
    la.phone as primary_mobile,
    la.pan_number,
    la.aadhar_number,
    CASE 
        WHEN la.employment_type = 'business' THEN 'business_owner'
        ELSE la.employment_type
    END as employment_type,
    la.monthly_income,
    JSON_OBJECT('address', 'Not provided', 'city', 'Unknown', 'state', 'Unknown', 'pincode', '000000') as current_address,
    JSON_OBJECT('same_as_current', true) as permanent_address,
    la.created_at,
    la.updated_at
FROM loan_applications la
JOIN loan_applications_enhanced lae ON la.application_number = lae.application_number
WHERE NOT EXISTS (
    SELECT 1 FROM applicant_profiles ap 
    WHERE ap.application_id = lae.id
);

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT 'Refined Unified Database Schema Applied Successfully!' as message,
       'Enhanced Tables: 6 new tables for dual workflow support' as tables,
       'Dual Workflow Support: LOS Automated + Dashboard Driven workflows' as workflows,
       'Data Migration: Existing data migrated to new structure' as migration,
       'Ready for dual workflow implementation!' as status;
