-- =====================================================
-- ENHANCED LOS - SIMPLIFIED MYSQL SCHEMA
-- =====================================================
-- Compatible with MySQL 8.0+
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS loan_origination_system;
USE loan_origination_system;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 1. Applications - Main application registry
CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY,
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

-- 2. Applicants - All personal and loan data
CREATE TABLE applicants (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    
    -- Personal Information (JSON for flexibility)
    personal_info JSON NOT NULL,
    
    -- Address Information (JSON)
    address_info JSON NULL,
    
    -- Employment Information (JSON)
    employment_info JSON NULL,
    
    -- Banking Details (JSON)
    banking_details JSON NULL,
    
    -- Loan Details (JSON)
    loan_details JSON NULL,
    
    -- Third Party Data (JSON)
    third_party_data JSON NULL,
    
    -- References (JSON)
    references_info JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id)
);

-- 3. Stage Processing - Track application progress
CREATE TABLE stage_processing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    status ENUM('pending', 'in-progress', 'completed', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    processing_time_ms BIGINT DEFAULT 0,
    result_data JSON NULL,
    error_message TEXT NULL,
    
    INDEX idx_application_stage (application_number, stage_name),
    INDEX idx_status (status)
);

-- 4. Audit Logs - Track all changes
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

-- 5. Third Party Integrations - Track external API calls
CREATE TABLE third_party_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    request_data JSON NULL,
    response_data JSON NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_application_service (application_number, service_name),
    INDEX idx_status (status)
);

-- =====================================================
-- VIEWS FOR DASHBOARD
-- =====================================================

-- Application Summary View
CREATE VIEW v_application_summary AS
SELECT 
    a.application_number,
    a.current_stage,
    a.current_status,
    a.created_at,
    a.updated_at,
    a.completed_at,
    a.total_processing_time_ms,
    a.stage_count,
    ap.personal_info,
    ap.loan_details,
    ap.third_party_data
FROM applications a
LEFT JOIN applicants ap ON a.id = ap.application_id;

-- Dashboard Metrics View
CREATE VIEW v_dashboard_metrics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN current_status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN current_status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN current_status = 'rejected' THEN 1 END) as rejected_applications,
    COUNT(CASE WHEN current_status = 'completed' THEN 1 END) as completed_applications,
    AVG(total_processing_time_ms) as avg_processing_time_ms,
    SUM(total_processing_time_ms) as total_processing_time_ms
FROM applications;

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample application
INSERT INTO applications (id, application_number, current_stage, current_status, source_channel) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'EL_1756360000000_sample1', 'loan-application', 'approved', 'web'),
('550e8400-e29b-41d4-a716-446655440002', 'EL_1756360000000_sample2', 'pre-qualification', 'pending', 'web'),
('550e8400-e29b-41d4-a716-446655440003', 'EL_1756360000000_sample3', 'loan-application', 'conditional_approval', 'web');

-- Insert sample applicant data
INSERT INTO applicants (id, application_id, personal_info, loan_details, third_party_data) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 
 '{"first_name": "John", "last_name": "Doe", "mobile": "9876543210", "email": "john@example.com", "pan_number": "ABCDE1234F"}',
 '{"loan_amount": 500000, "loan_purpose": "personal", "preferred_tenure_months": 36}',
 '{"cibil_data": {"score": 750, "grade": "GOOD"}}'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002',
 '{"first_name": "Jane", "last_name": "Smith", "mobile": "9876543211", "email": "jane@example.com", "pan_number": "FGHIJ5678K"}',
 '{"loan_amount": 300000, "loan_purpose": "business", "preferred_tenure_months": 24}',
 '{"cibil_data": {"score": 680, "grade": "FAIR"}}'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003',
 '{"first_name": "Bob", "last_name": "Johnson", "mobile": "9876543212", "email": "bob@example.com", "pan_number": "LMNOP9012Q"}',
 '{"loan_amount": 750000, "loan_purpose": "home", "preferred_tenure_months": 60}',
 '{"cibil_data": {"score": 820, "grade": "EXCELLENT"}}');

-- Insert sample stage processing
INSERT INTO stage_processing (application_number, stage_name, status, completed_at, processing_time_ms) VALUES
('EL_1756360000000_sample1', 'pre-qualification', 'completed', NOW(), 5000),
('EL_1756360000000_sample1', 'loan-application', 'completed', NOW(), 15000),
('EL_1756360000000_sample2', 'pre-qualification', 'in-progress', NULL, 3000),
('EL_1756360000000_sample3', 'pre-qualification', 'completed', NOW(), 4000),
('EL_1756360000000_sample3', 'loan-application', 'completed', NOW(), 12000);

-- Insert sample audit logs
INSERT INTO audit_logs (application_number, action, stage, user_id, request_data, response_data) VALUES
('EL_1756360000000_sample1', 'application_created', 'pre-qualification', 'system', '{}', '{"status": "success"}'),
('EL_1756360000000_sample1', 'stage_completed', 'pre-qualification', 'system', '{}', '{"status": "approved"}'),
('EL_1756360000000_sample2', 'application_created', 'pre-qualification', 'system', '{}', '{"status": "success"}'),
('EL_1756360000000_sample3', 'application_created', 'pre-qualification', 'system', '{}', '{"status": "success"}');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Enhanced LOS Database Schema Created Successfully!' as message;
SELECT COUNT(*) as total_applications FROM applications;
SELECT COUNT(*) as total_applicants FROM applicants;
