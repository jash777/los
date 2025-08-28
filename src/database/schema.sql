-- =====================================================
-- ENHANCED LOS - CLEAN MYSQL SCHEMA
-- =====================================================
-- Optimized schema for MVP with JSON flexibility
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS loan_origination_system;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 1. Applications - Main application registry
CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Current state
    current_stage ENUM('pre-qualification', 'loan-application', 'application-processing', 
                      'underwriting', 'credit-decision', 'quality-check', 'loan-funding') 
                 DEFAULT 'pre-qualification',
    current_status ENUM('pending', 'in-progress', 'approved', 'rejected', 'on-hold', 'completed') 
                  DEFAULT 'pending',
    
    -- Metadata
    source_channel VARCHAR(50) DEFAULT 'web',
    priority_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Processing metrics
    total_processing_time_ms BIGINT DEFAULT 0,
    stage_count INT DEFAULT 0,
    
    INDEX idx_application_number (application_number),
    INDEX idx_stage_status (current_stage, current_status),
    INDEX idx_created_at (created_at)
);

-- 2. Applicants - All personal and loan data (Enhanced for Stage 2)
CREATE TABLE applicants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Personal Information (JSON for flexibility)
    personal_info JSON NOT NULL,
    -- Structure: {
    --   "first_name": "John",
    --   "last_name": "Doe",
    --   "mobile": "9876543210",
    --   "email": "john@example.com",
    --   "pan_number": "ABCDE1234F",
    --   "aadhaar_number": "123456789012",
    --   "date_of_birth": "1990-01-01",
    --   "marital_status": "single",
    --   "number_of_dependents": 0,
    --   "education_level": "graduate"
    -- }
    
    -- Address Information (JSON) - Current and Permanent
    address_info JSON NULL,
    -- Structure: {
    --   "current_address": {
    --     "street_address": "123 Main St",
    --     "city": "Mumbai",
    --     "state": "Maharashtra",
    --     "pincode": "400001",
    --     "residence_type": "owned",
    --     "years_at_address": 5
    --   },
    --   "permanent_address": { ... },
    --   "same_as_current": true
    -- }
    
    -- Employment Information (JSON) - Comprehensive details
    employment_info JSON NULL,
    -- Structure: {
    --   "employment_type": "salaried",
    --   "company_name": "ABC Corp",
    --   "designation": "Software Engineer",
    --   "monthly_income": 75000,
    --   "work_experience_months": 36,
    --   "company_address": { ... },
    --   "hr_contact": { ... }
    -- }
    
    -- Banking Details (JSON) - Comprehensive financial information
    banking_details JSON NULL,
    -- Structure: {
    --   "primary_account": {
    --     "account_number": "1234567890",
    --     "ifsc_code": "HDFC0001234",
    --     "bank_name": "HDFC Bank",
    --     "account_type": "savings",
    --     "account_holder_name": "John Doe",
    --     "branch_name": "Mumbai Main",
    --     "account_opening_date": "2020-01-01",
    --     "average_monthly_balance": 50000
    --   },
    --   "existing_loans": [...],
    --   "credit_cards": [...],
    --   "monthly_expenses": { ... }
    -- }
    
    -- References (JSON) - Personal and professional references
    references JSON NULL,
    -- Structure: [
    --   {
    --     "name": "Jane Smith",
    --     "mobile": "9876543211",
    --     "relationship": "friend",
    --     "address": "456 Oak St, Mumbai",
    --     "years_known": 10
    --   }
    -- ]
    
    -- Required Documents (JSON) - Document submission details
    required_documents JSON NULL,
    -- Structure: {
    --   "identity_proof": {
    --     "document_type": "pan_card",
    --     "document_url": "https://...",
    --     "uploaded_at": "2025-01-27T10:00:00Z"
    --   },
    --   "address_proof": { ... },
    --   "income_proof": { ... },
    --   "bank_statements": { ... }
    -- }
    
    -- Additional Information (JSON) - Loan specific details
    additional_information JSON NULL,
    -- Structure: {
    --   "loan_purpose_details": "Home renovation",
    --   "repayment_source": "salary",
    --   "preferred_tenure_months": 36,
    --   "existing_bank_relationship": true,
    --   "co_applicant_required": false,
    --   "property_ownership": "owned",
    --   "insurance_coverage": "life_insurance"
    -- }
    
    -- Loan Request Information (JSON)
    loan_request JSON NULL,
    -- Structure: {
    --   "loan_type": "personal",
    --   "requested_amount": 500000,
    --   "purpose": "home_renovation",
    --   "tenure_months": 36
    -- }
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_pan_number ((JSON_UNQUOTE(JSON_EXTRACT(personal_info, '$.pan_number')))),
    INDEX idx_mobile ((JSON_UNQUOTE(JSON_EXTRACT(personal_info, '$.mobile')))),
    INDEX idx_aadhaar ((JSON_UNQUOTE(JSON_EXTRACT(personal_info, '$.aadhaar_number')))),
    INDEX idx_employment_type ((JSON_UNQUOTE(JSON_EXTRACT(employment_info, '$.employment_type')))),
    INDEX idx_monthly_income ((JSON_UNQUOTE(JSON_EXTRACT(employment_info, '$.monthly_income'))))
);

-- 3. Verifications - All verification results (Enhanced for comprehensive Stage 2)
CREATE TABLE verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Document Verification Results (JSON)
    document_verification JSON NULL,
    -- Structure: {
    --   "identity_documents": { "status": "verified", "score": 95, "details": {...} },
    --   "address_documents": { "status": "verified", "score": 90, "details": {...} },
    --   "income_documents": { "status": "verified", "score": 85, "details": {...} },
    --   "bank_statements": { "status": "verified", "score": 88, "details": {...} },
    --   "overall_score": 89,
    --   "overall_status": "verified",
    --   "verification_summary": "All documents verified successfully"
    -- }
    
    -- Employment Verification Results (JSON)
    employment_verification JSON NULL,
    -- Structure: {
    --   "employment_type_verification": { "verified": true, "score": 100 },
    --   "company_verification": { "verified": true, "score": 95 },
    --   "designation_verification": { "verified": true, "score": 90 },
    --   "income_verification": { "verified": true, "score": 85 },
    --   "experience_verification": { "verified": true, "score": 88 },
    --   "overall_score": 91,
    --   "overall_status": "verified",
    --   "employment_stability": "stable",
    --   "income_reliability": "high",
    --   "risk_factors": [],
    --   "recommendations": []
    -- }
    
    -- Financial Assessment Results (JSON)
    financial_assessment JSON NULL,
    -- Structure: {
    --   "income_analysis": { "monthly_income": 75000, "income_stability": "stable" },
    --   "expense_analysis": { "total_monthly_expenses": 45000, "expense_ratio": 0.6 },
    --   "debt_analysis": { "debt_to_income_ratio": 25, "existing_obligations": 18750 },
    --   "affordability_analysis": { "repayment_capacity": 0.35, "stress_test": { "passed": true } },
    --   "overall_score": 82,
    --   "overall_status": "approved",
    --   "risk_factors": [],
    --   "recommendations": [],
    --   "financial_health_score": 85
    -- }
    
    -- Banking Analysis Results (JSON)
    banking_analysis JSON NULL,
    -- Structure: {
    --   "primary_account_verification": { "verified": true, "score": 95 },
    --   "transaction_patterns": { "regularity": "regular", "score": 88 },
    --   "existing_loans_analysis": { "total_obligations": 25000, "score": 75 },
    --   "credit_cards_analysis": { "utilization_ratio": 0.3, "score": 80 },
    --   "cash_flow_analysis": { "average_balance": 50000, "score": 90 },
    --   "overall_score": 85,
    --   "overall_status": "approved",
    --   "banking_relationship_strength": "strong",
    --   "creditworthiness_indicators": ["regular_salary_credits", "maintained_balance"]
    -- }
    
    -- Reference Verification Results (JSON)
    reference_verification JSON NULL,
    -- Structure: {
    --   "references_contacted": 2,
    --   "positive_responses": 2,
    --   "reliability_score": 85,
    --   "overall_score": 85,
    --   "overall_status": "verified",
    --   "verification_summary": "References confirmed applicant details"
    -- }
    
    -- Credit Assessment Results (JSON) - External credit bureau data
    credit_assessment JSON NULL,
    -- Structure: {
    --   "cibil_score": 750,
    --   "cibil_grade": "A",
    --   "credit_history_length": 60,
    --   "active_accounts": 3,
    --   "credit_utilization": 0.25,
    --   "payment_history": "excellent",
    --   "recent_inquiries": 1
    -- }
    
    -- Overall Verification Status
    overall_status ENUM('pending', 'in-progress', 'completed', 'failed') DEFAULT 'pending',
    overall_verification_score DECIMAL(5,2) DEFAULT 0,
    
    -- Component Scores for quick access
    document_score DECIMAL(5,2) DEFAULT 0,
    employment_score DECIMAL(5,2) DEFAULT 0,
    financial_score DECIMAL(5,2) DEFAULT 0,
    banking_score DECIMAL(5,2) DEFAULT 0,
    reference_score DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_overall_status (overall_status),
    INDEX idx_overall_score (overall_verification_score),
    INDEX idx_cibil_score ((JSON_UNQUOTE(JSON_EXTRACT(credit_assessment, '$.cibil_score')))),
    INDEX idx_document_score (document_score),
    INDEX idx_employment_score (employment_score),
    INDEX idx_financial_score (financial_score),
    INDEX idx_banking_score (banking_score)
);

-- 4. Decisions - Final loan decisions (Enhanced for comprehensive Stage 2)
CREATE TABLE decisions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Decision Details
    decision ENUM('approved', 'rejected', 'conditional_approval') NOT NULL,
    decision_reason TEXT,
    decision_summary TEXT,
    
    -- Loan Terms (Generated based on comprehensive assessment)
    loan_terms JSON NULL,
    -- Structure: {
    --   "loan_amount": 500000,
    --   "interest_rate": 12.5,
    --   "tenure_months": 60,
    --   "processing_fee": 5000,
    --   "insurance_premium": 2500,
    --   "monthly_emi": 11122,
    --   "total_interest": 167320,
    --   "total_amount": 667320,
    --   "prepayment_charges": "2% after 12 months",
    --   "late_payment_charges": "2% per month"
    -- }
    
    -- Legacy fields for backward compatibility
    approved_amount DECIMAL(12,2) NULL,
    interest_rate DECIMAL(5,2) NULL,
    tenure_months INT NULL,
    processing_fee DECIMAL(10,2) NULL,
    
    -- Comprehensive Decision Factors
    decision_factors JSON NULL,
    -- Structure: {
    --   "positive_factors": [
    --     "Excellent CIBIL score (750+)",
    --     "Stable employment with reputed company",
    --     "Strong banking relationship"
    --   ],
    --   "negative_factors": [
    --     "High existing debt obligations"
    --   ],
    --   "risk_factors": [
    --     "Recent job change"
    --   ],
    --   "document_factors": { "status": "verified", "score": 89 },
    --   "employment_factors": { "status": "verified", "score": 91 },
    --   "financial_factors": { "status": "approved", "score": 82 },
    --   "banking_factors": { "status": "approved", "score": 85 },
    --   "reference_factors": { "status": "verified", "score": 85 }
    -- }
    
    -- Conditions (for conditional approvals)
    conditions JSON NULL,
    -- Structure: {
    --   "required_conditions": [
    --     "Provide salary certificate from current employer",
    --     "Submit 6 months bank statements"
    --   ],
    --   "recommended_conditions": [
    --     "Consider adding a co-applicant for better terms"
    --   ],
    --   "compliance_deadline": "2024-02-15"
    -- }
    
    -- Risk Assessment
    risk_category ENUM('low', 'medium', 'high') NULL,
    risk_factors JSON NULL,
    risk_score DECIMAL(5,2) NULL,
    
    -- Decision Metadata
    overall_score DECIMAL(5,2) NULL,
    component_scores JSON NULL,
    -- Structure: {
    --   "document_verification": 89,
    --   "employment_verification": 91,
    --   "financial_assessment": 82,
    --   "banking_analysis": 85,
    --   "reference_verification": 85,
    --   "credit_assessment": 88
    -- }
    
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    
    -- Processing Details
    decision_engine_version VARCHAR(20) DEFAULT '1.0',
    processed_by VARCHAR(100) DEFAULT 'system',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_decision (decision),
    INDEX idx_decision_date (decision_date),
    INDEX idx_risk_category (risk_category),
    INDEX idx_overall_score (overall_score),
    INDEX idx_approved_amount (approved_amount)
);

-- 5. Documents - Document management (Enhanced for comprehensive Stage 2)
CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Document Details
    document_category ENUM('identity', 'address', 'income', 'banking', 'other') NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_subtype VARCHAR(100) NULL, -- e.g., 'front', 'back' for Aadhaar
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Document Content Analysis
    extracted_data JSON NULL,
    -- Structure varies by document type:
    -- For Aadhaar: { "aadhaar_number": "XXXX-XXXX-1234", "name": "John Doe", "dob": "1990-01-01", "address": "..." }
    -- For PAN: { "pan_number": "ABCDE1234F", "name": "John Doe", "father_name": "..." }
    -- For Salary Slip: { "employer_name": "ABC Corp", "gross_salary": 75000, "net_salary": 65000, "month": "2024-01" }
    -- For Bank Statement: { "account_number": "XXXX1234", "bank_name": "XYZ Bank", "average_balance": 50000, "salary_credits": [...] }
    
    -- Verification Status
    verification_status ENUM('pending', 'verified', 'rejected', 'expired', 'requires_resubmission') DEFAULT 'pending',
    verification_score DECIMAL(5,2) DEFAULT 0,
    verification_details JSON NULL,
    -- Structure: {
    --   "quality_check": { "passed": true, "score": 95, "issues": [] },
    --   "authenticity_check": { "passed": true, "score": 90, "method": "digital_signature" },
    --   "data_extraction": { "success": true, "confidence": 0.95, "fields_extracted": 8 },
    --   "cross_verification": { "passed": true, "matched_fields": ["name", "dob"] },
    --   "compliance_check": { "passed": true, "regulations_met": ["KYC", "AML"] }
    -- }
    
    verification_notes TEXT NULL,
    verified_by VARCHAR(100) NULL,
    verified_at TIMESTAMP NULL,
    
    -- Document Requirements
    is_mandatory BOOLEAN DEFAULT true,
    is_alternative BOOLEAN DEFAULT false, -- Can be used as alternative to another doc
    alternative_for VARCHAR(100) NULL, -- Which document this can replace
    
    -- Document Metadata
    document_metadata JSON NULL,
    -- Structure: {
    --   "upload_source": "mobile_app",
    --   "device_info": { "type": "android", "version": "12" },
    --   "location": { "lat": 12.9716, "lng": 77.5946 },
    --   "timestamp": "2024-01-15T10:30:00Z",
    --   "file_hash": "sha256:abc123...",
    --   "processing_flags": ["auto_cropped", "enhanced"]
    -- }
    
    -- Expiry and Validity
    document_date DATE NULL, -- Date on the document
    expiry_date DATE NULL, -- When document expires
    validity_period_months INT NULL, -- How long this verification is valid
    
    -- Upload Info
    uploaded_by VARCHAR(100) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_document_category (document_category),
    INDEX idx_document_type (document_type),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verification_score (verification_score),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_mandatory_docs (application_id, is_mandatory, verification_status)
);

-- 6. Underwriting Results - Detailed underwriting analysis (Enhanced for comprehensive Stage 2)
CREATE TABLE underwriting_results (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Underwriting Analysis
    underwriting_stage VARCHAR(50) NOT NULL, -- 'stage_2_comprehensive', 'stage_3_automated', etc.
    analysis_type VARCHAR(100) NOT NULL, -- 'document_verification', 'employment_verification', etc.
    analysis_result JSON NOT NULL,
    -- Structure varies by analysis_type:
    -- For document_verification: { "identity_documents": {...}, "address_documents": {...}, "overall_score": 89 }
    -- For employment_verification: { "employment_type_verification": {...}, "company_verification": {...}, "overall_score": 91 }
    -- For financial_assessment: { "income_analysis": {...}, "debt_analysis": {...}, "overall_score": 82 }
    -- For banking_analysis: { "primary_account_verification": {...}, "transaction_patterns": {...}, "overall_score": 85 }
    -- For reference_verification: { "references_contacted": 2, "reliability_score": 85, "overall_score": 85 }
    
    -- Detailed Scoring
    component_score DECIMAL(5,2) DEFAULT 0,
    sub_component_scores JSON NULL,
    -- Structure: {
    --   "identity_documents": 95,
    --   "address_documents": 90,
    --   "income_documents": 85,
    --   "bank_statements": 88
    -- }
    
    weight DECIMAL(3,2) DEFAULT 0,
    weighted_score DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Assessment
    risk_indicators JSON NULL,
    -- Structure: {
    --   "high_risk": ["Recent job change"],
    --   "medium_risk": ["High debt-to-income ratio"],
    --   "low_risk": ["Stable employment", "Good credit history"]
    -- }
    
    recommendations JSON NULL,
    -- Structure: {
    --   "approval_recommendations": ["Approve with standard terms"],
    --   "conditional_recommendations": ["Require additional income proof"],
    --   "rejection_recommendations": ["Insufficient income stability"]
    -- }
    
    -- Status and Quality
    status ENUM('pending', 'completed', 'failed', 'skipped', 'requires_manual_review') DEFAULT 'pending',
    quality_score DECIMAL(5,2) DEFAULT 0, -- Quality of the analysis itself
    confidence_level DECIMAL(3,2) DEFAULT 0, -- Confidence in the results (0-1)
    
    -- Processing Info
    processed_by VARCHAR(100) DEFAULT 'system',
    processing_time_ms INT DEFAULT 0,
    processing_method VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'hybrid'
    
    -- External Dependencies
    external_data_sources JSON NULL,
    -- Structure: {
    --   "cibil_api": { "used": true, "response_time_ms": 1200, "status": "success" },
    --   "bank_statement_analyzer": { "used": true, "confidence": 0.95, "status": "success" },
    --   "employment_verifier": { "used": false, "reason": "manual_verification_preferred" }
    -- }
    
    -- Audit Trail
    version INT DEFAULT 1, -- For tracking analysis version/updates
    previous_result_id VARCHAR(36) NULL, -- Reference to previous analysis if updated
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_result_id) REFERENCES underwriting_results(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id),
    INDEX idx_underwriting_stage (underwriting_stage),
    INDEX idx_analysis_type (analysis_type),
    INDEX idx_status (status),
    INDEX idx_component_score (component_score),
    INDEX idx_quality_score (quality_score),
    INDEX idx_processing_method (processing_method),
    INDEX idx_stage_analysis (underwriting_stage, analysis_type)
);

-- 7. Quality Check Results - Final quality assurance
CREATE TABLE quality_check_results (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Quality Checks (JSON)
    quality_checks JSON NULL,
    -- Structure: {
    --   "document_completeness": true,
    --   "data_accuracy": true,
    --   "compliance_verification": true,
    --   "regulatory_adherence": true
    -- }
    
    -- Issues Found (JSON)
    issues_found JSON NULL,
    
    -- QC Decision
    qc_decision ENUM('pass', 'fail', 'conditional_approval') NOT NULL,
    qc_comments TEXT NULL,
    qc_officer_id VARCHAR(100) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_qc_decision (qc_decision)
);

-- 8. Loan Funding - Final funding and disbursement
CREATE TABLE loan_funding (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Loan Terms (JSON)
    final_loan_terms JSON NULL,
    -- Structure: {
    --   "approved_amount": 500000,
    --   "interest_rate": 12.5,
    --   "tenure_months": 36,
    --   "emi_amount": 16500,
    --   "processing_fee": 5000
    -- }
    
    -- Disbursement Details (JSON)
    disbursement_details JSON NULL,
    -- Structure: {
    --   "disbursement_method": "bank_transfer",
    --   "bank_account": {...},
    --   "disbursement_date": "2025-08-27",
    --   "reference_number": "DISB123456"
    -- }
    
    -- Funding Status
    funding_status ENUM('pending', 'approved', 'disbursed', 'failed') DEFAULT 'pending',
    funding_comments TEXT NULL,
    funded_by VARCHAR(100) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    disbursed_at TIMESTAMP NULL,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_funding_status (funding_status)
);

-- 9. Audit Logs - Comprehensive audit trail
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    application_id VARCHAR(36) NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    stage_name VARCHAR(50) NULL,
    
    -- Actor Information
    actor_type ENUM('system', 'employee', 'applicant', 'external_api') DEFAULT 'system',
    actor_name VARCHAR(100) NULL,
    
    -- Change Data (JSON)
    change_data JSON NULL,
    
    -- Request Context
    request_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_request_id (request_id)
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Complete Application View (Enhanced for comprehensive Stage 2)
CREATE VIEW v_complete_applications AS
SELECT 
    a.id,
    a.application_number,
    a.current_stage,
    a.current_status,
    a.created_at,
    a.updated_at,
    a.total_processing_time_ms,
    
    -- Personal info
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.first_name')) as first_name,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.last_name')) as last_name,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.mobile')) as mobile,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.email')) as email,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.pan_number')) as pan_number,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.aadhaar_number')) as aadhaar_number,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.date_of_birth')) as date_of_birth,
    
    -- Employment info
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.employment_type')) as employment_type,
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.company_name')) as company_name,
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.designation')) as designation,
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.monthly_income')) as monthly_income,
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.work_experience_years')) as work_experience_years,
    
    -- Loan request
    JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.loan_type')) as loan_type,
    JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.requested_amount')) as requested_amount,
    JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.tenure_months')) as requested_tenure,
    JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.purpose')) as loan_purpose,
    
    -- Banking info
    JSON_UNQUOTE(JSON_EXTRACT(ap.banking_details, '$.primary_account.bank_name')) as primary_bank,
    JSON_UNQUOTE(JSON_EXTRACT(ap.banking_details, '$.primary_account.account_type')) as account_type,
    JSON_UNQUOTE(JSON_EXTRACT(ap.banking_details, '$.primary_account.average_monthly_balance')) as avg_balance,
    
    -- Verification scores
    v.overall_verification_score,
    v.document_score,
    v.employment_score,
    v.financial_score,
    v.banking_score,
    v.reference_score,
    
    -- Credit info
    JSON_UNQUOTE(JSON_EXTRACT(v.credit_assessment, '$.cibil_score')) as cibil_score,
    JSON_UNQUOTE(JSON_EXTRACT(v.credit_assessment, '$.cibil_grade')) as cibil_grade,
    JSON_UNQUOTE(JSON_EXTRACT(v.credit_assessment, '$.payment_history')) as payment_history,
    
    -- Latest decision
    d.decision as latest_decision,
    d.decision_reason as latest_decision_reason,
    d.overall_score as decision_score,
    d.risk_category,
    
    -- Approved loan terms
    JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.loan_amount')) as approved_amount,
    JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.interest_rate')) as approved_rate,
    JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.tenure_months')) as approved_tenure,
    JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.monthly_emi')) as monthly_emi
    
FROM applications a
LEFT JOIN applicants ap ON a.id = ap.application_id
LEFT JOIN verifications v ON a.id = v.application_id
LEFT JOIN (
    SELECT application_id, decision, decision_reason, overall_score, risk_category, loan_terms,
           ROW_NUMBER() OVER (PARTITION BY application_id ORDER BY decision_date DESC) as rn
    FROM decisions
) d ON a.id = d.application_id AND d.rn = 1;

-- Application Summary View (Enhanced for comprehensive Stage 2)
CREATE VIEW v_application_summary AS
SELECT 
    a.application_number,
    a.current_stage,
    a.current_status,
    a.created_at,
    a.updated_at,
    
    -- Personal info
    CONCAT(
        JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.first_name')), ' ',
        JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.last_name'))
    ) as applicant_name,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.mobile')) as mobile,
    JSON_UNQUOTE(JSON_EXTRACT(ap.personal_info, '$.email')) as email,
    
    -- Employment summary
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.employment_type')) as employment_type,
    JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.company_name')) as company_name,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(ap.employment_info, '$.monthly_income')) AS DECIMAL(12,2)) as monthly_income,
    
    -- Loan request summary
    JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.loan_type')) as loan_type,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.requested_amount')) AS DECIMAL(12,2)) as requested_amount,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(ap.loan_request, '$.tenure_months')) AS INT) as requested_tenure,
    
    -- Verification progress
    v.overall_status as verification_status,
    v.overall_verification_score,
    v.document_score,
    v.employment_score,
    v.financial_score,
    v.banking_score,
    
    -- Credit assessment
    CAST(JSON_UNQUOTE(JSON_EXTRACT(v.credit_assessment, '$.cibil_score')) AS INT) as cibil_score,
    JSON_UNQUOTE(JSON_EXTRACT(v.credit_assessment, '$.cibil_grade')) as cibil_grade,
    
    -- Decision summary
    d.decision as latest_decision,
    d.overall_score as decision_score,
    d.risk_category,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.loan_amount')) AS DECIMAL(12,2)) as approved_amount,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(d.loan_terms, '$.interest_rate')) AS DECIMAL(5,2)) as approved_rate,
    
    -- Processing metrics
    a.total_processing_time_ms,
    TIMESTAMPDIFF(HOUR, a.created_at, COALESCE(a.updated_at, NOW())) as processing_hours,
    
    -- Document status
    (
        SELECT COUNT(*) 
        FROM documents doc 
        WHERE doc.application_id = a.id AND doc.is_mandatory = true
    ) as total_mandatory_docs,
    (
        SELECT COUNT(*) 
        FROM documents doc 
        WHERE doc.application_id = a.id AND doc.is_mandatory = true AND doc.verification_status = 'verified'
    ) as verified_mandatory_docs,
    
    -- Activity tracking
    (SELECT MAX(created_at) FROM audit_logs WHERE application_id = a.id) as last_activity,
    (SELECT COUNT(*) FROM audit_logs WHERE application_id = a.id) as total_activities,
    
    -- Risk indicators
    CASE 
        WHEN v.overall_verification_score >= 85 THEN 'Low'
        WHEN v.overall_verification_score >= 70 THEN 'Medium'
        ELSE 'High'
    END as risk_level,
    
    -- Processing efficiency
    CASE 
        WHEN a.current_stage = 'pre-qualification' AND TIMESTAMPDIFF(HOUR, a.created_at, NOW()) > 1 THEN 'Delayed'
        WHEN a.current_stage = 'comprehensive-application' AND TIMESTAMPDIFF(HOUR, a.created_at, NOW()) > 24 THEN 'Delayed'
        WHEN a.current_stage IN ('document-verification', 'employment-verification', 'financial-assessment') AND TIMESTAMPDIFF(HOUR, a.created_at, NOW()) > 48 THEN 'Delayed'
        ELSE 'On Track'
    END as processing_status
    
FROM applications a
LEFT JOIN applicants ap ON a.id = ap.application_id
LEFT JOIN verifications v ON a.id = v.application_id
LEFT JOIN (
    SELECT application_id, decision, overall_score, risk_category, loan_terms,
           ROW_NUMBER() OVER (PARTITION BY application_id ORDER BY decision_date DESC) as rn
    FROM decisions
) d ON a.id = d.application_id AND d.rn = 1;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample application for testing
INSERT INTO applications (application_number, current_stage, current_status) 
VALUES ('SAMPLE_001', 'pre-qualification', 'pending');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Enhanced LOS MySQL Schema Created Successfully!' as message,
       'Tables: 5 core tables with JSON flexibility' as details,
       'Views: 2 common query views' as views,
       'Ready for Enhanced LOS development!' as status;