-- =====================================================
-- MANUAL WORKFLOW SCHEMA ENHANCEMENTS
-- =====================================================
-- Additional tables to support manual approval workflow

-- 1. Manual Review Queue - Applications waiting for manual review
CREATE TABLE IF NOT EXISTS manual_review_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to VARCHAR(100) NULL,
    review_type ENUM('underwriting', 'verification', 'final_approval', 'quality_check') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP NULL,
    due_date TIMESTAMP NULL,
    status ENUM('pending', 'assigned', 'in_review', 'completed', 'escalated') DEFAULT 'pending',
    
    INDEX idx_application_number (application_number),
    INDEX idx_stage_name (stage_name),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_review_type (review_type),
    INDEX idx_priority (priority),
    UNIQUE KEY unique_app_stage (application_number, stage_name)
);

-- 2. Manual Decisions - Store manual approval/rejection decisions
CREATE TABLE IF NOT EXISTS manual_decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    reviewer_id VARCHAR(100) NOT NULL,
    reviewer_name VARCHAR(200) NOT NULL,
    decision ENUM('approved', 'rejected', 'conditional_approval', 'refer_back', 'escalate') NOT NULL,
    decision_reason TEXT NOT NULL,
    conditions TEXT NULL,
    risk_assessment JSON NULL,
    recommended_terms JSON NULL,
    -- Structure: {
    --   "loan_amount": 500000,
    --   "interest_rate": 12.5,
    --   "tenure_months": 36,
    --   "processing_fee": 5000,
    --   "special_conditions": ["Provide additional income proof"]
    -- }
    internal_notes TEXT NULL,
    time_spent_minutes INT DEFAULT 0,
    decision_score INT DEFAULT 0,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_application_number (application_number),
    INDEX idx_stage_name (stage_name),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_decision (decision),
    INDEX idx_decided_at (decided_at)
);

-- 3. Workflow Rules - Define which applications need manual review
CREATE TABLE IF NOT EXISTS workflow_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    condition_type ENUM('score_based', 'amount_based', 'risk_based', 'document_based', 'custom') NOT NULL,
    condition_criteria JSON NOT NULL,
    -- Structure: {
    --   "min_score": 65,
    --   "max_score": 85,
    --   "loan_amount_threshold": 1000000,
    --   "risk_categories": ["high", "medium"],
    --   "required_documents": ["income_proof", "bank_statement"]
    -- }
    action ENUM('manual_review', 'auto_approve', 'auto_reject', 'escalate') NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    reviewer_role VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_stage_name (stage_name),
    INDEX idx_condition_type (condition_type),
    INDEX idx_is_active (is_active)
);

-- 4. Employee/Reviewer Management
CREATE TABLE IF NOT EXISTS reviewers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('underwriter', 'senior_underwriter', 'credit_analyst', 'quality_checker', 'manager') NOT NULL,
    department VARCHAR(100) DEFAULT 'credit',
    max_loan_amount_authority DECIMAL(15,2) DEFAULT 1000000,
    specializations JSON NULL,
    -- Structure: ["personal_loans", "business_loans", "high_risk_cases"]
    is_active BOOLEAN DEFAULT TRUE,
    current_workload INT DEFAULT 0,
    max_workload INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    INDEX idx_workload (current_workload)
);

-- 5. Workflow Assignments - Track who is working on what
CREATE TABLE IF NOT EXISTS workflow_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    assigned_by VARCHAR(100) DEFAULT 'system',
    assignment_reason TEXT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    status ENUM('assigned', 'in_progress', 'completed', 'reassigned', 'escalated') DEFAULT 'assigned',
    notes TEXT NULL,
    
    INDEX idx_application_number (application_number),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_assigned_at (assigned_at),
    FOREIGN KEY (assigned_to) REFERENCES reviewers(employee_id) ON UPDATE CASCADE
);

-- 6. Manual Review Comments/Notes
CREATE TABLE IF NOT EXISTS review_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    reviewer_id VARCHAR(100) NOT NULL,
    comment_type ENUM('note', 'question', 'concern', 'recommendation', 'internal') DEFAULT 'note',
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    parent_comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_application_number (application_number),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_comment_type (comment_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id) ON DELETE SET NULL
);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Sample reviewers
INSERT INTO reviewers (employee_id, employee_name, email, role, max_loan_amount_authority, specializations) VALUES
('EMP001', 'John Smith', 'john.smith@company.com', 'underwriter', 500000, '["personal_loans", "small_business"]'),
('EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', 'senior_underwriter', 2000000, '["high_value_loans", "complex_cases"]'),
('EMP003', 'Mike Wilson', 'mike.wilson@company.com', 'credit_analyst', 1000000, '["financial_analysis", "risk_assessment"]'),
('EMP004', 'Lisa Davis', 'lisa.davis@company.com', 'quality_checker', 5000000, '["compliance", "quality_assurance"]'),
('EMP005', 'Admin User', 'admin@company.com', 'manager', 10000000, '["all_cases", "escalations"]');

-- Sample workflow rules
INSERT INTO workflow_rules (rule_name, stage_name, condition_type, condition_criteria, action, priority, reviewer_role) VALUES
('High Amount Manual Review', 'underwriting', 'amount_based', '{"loan_amount_threshold": 1000000}', 'manual_review', 'high', 'senior_underwriter'),
('Medium Score Manual Review', 'underwriting', 'score_based', '{"min_score": 65, "max_score": 85}', 'manual_review', 'normal', 'underwriter'),
('High Risk Manual Review', 'underwriting', 'risk_based', '{"risk_categories": ["high", "critical"]}', 'manual_review', 'high', 'senior_underwriter'),
('Low Score Auto Reject', 'underwriting', 'score_based', '{"max_score": 50}', 'auto_reject', 'normal', null),
('High Score Auto Approve', 'underwriting', 'score_based', '{"min_score": 90}', 'auto_approve', 'low', null),
('Quality Check All Approvals', 'quality_check', 'custom', '{"decision": "approved"}', 'manual_review', 'normal', 'quality_checker');

-- =====================================================
-- VIEWS FOR MANUAL WORKFLOW
-- =====================================================

-- View for pending manual reviews
CREATE OR REPLACE VIEW v_pending_manual_reviews AS
SELECT 
    mrq.id,
    mrq.application_number,
    mrq.stage_name,
    mrq.priority,
    mrq.review_type,
    mrq.assigned_to,
    mrq.created_at,
    mrq.due_date,
    mrq.status as queue_status,
    
    -- Application details
    la.applicant_name,
    la.loan_amount,
    la.loan_purpose,
    la.current_stage,
    la.status as app_status,
    
    -- Reviewer details
    r.employee_name as reviewer_name,
    r.role as reviewer_role,
    
    -- Time metrics
    TIMESTAMPDIFF(HOUR, mrq.created_at, NOW()) as hours_in_queue,
    CASE 
        WHEN mrq.due_date IS NOT NULL AND NOW() > mrq.due_date THEN 'overdue'
        WHEN TIMESTAMPDIFF(HOUR, mrq.created_at, NOW()) > 24 THEN 'urgent'
        WHEN TIMESTAMPDIFF(HOUR, mrq.created_at, NOW()) > 12 THEN 'priority'
        ELSE 'normal'
    END as urgency_level
    
FROM manual_review_queue mrq
LEFT JOIN loan_applications la ON mrq.application_number = la.application_number
LEFT JOIN reviewers r ON mrq.assigned_to = r.employee_id
WHERE mrq.status IN ('pending', 'assigned', 'in_review')
ORDER BY 
    CASE mrq.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    mrq.created_at ASC;

-- View for reviewer workload
CREATE OR REPLACE VIEW v_reviewer_workload AS
SELECT 
    r.employee_id,
    r.employee_name,
    r.role,
    r.max_workload,
    r.current_workload,
    
    -- Current assignments
    COUNT(CASE WHEN wa.status IN ('assigned', 'in_progress') THEN 1 END) as active_assignments,
    COUNT(CASE WHEN mrq.status IN ('assigned', 'in_review') THEN 1 END) as queue_items,
    
    -- Performance metrics
    COUNT(CASE WHEN md.decided_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as decisions_this_week,
    AVG(CASE WHEN md.decided_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN md.time_spent_minutes END) as avg_time_per_case,
    
    -- Availability
    CASE 
        WHEN r.current_workload >= r.max_workload THEN 'full'
        WHEN r.current_workload >= (r.max_workload * 0.8) THEN 'busy'
        ELSE 'available'
    END as availability_status
    
FROM reviewers r
LEFT JOIN workflow_assignments wa ON r.employee_id = wa.assigned_to
LEFT JOIN manual_review_queue mrq ON r.employee_id = mrq.assigned_to
LEFT JOIN manual_decisions md ON r.employee_id = md.reviewer_id
WHERE r.is_active = TRUE
GROUP BY r.employee_id, r.employee_name, r.role, r.max_workload, r.current_workload
ORDER BY r.role, r.employee_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Manual Workflow Schema Created Successfully!' as message,
       'Tables: 6 new tables for manual workflow' as details,
       'Views: 2 workflow management views' as views,
       'Sample Data: 5 reviewers and 6 workflow rules' as sample_data;
