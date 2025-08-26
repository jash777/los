-- Dual-Phase Workflow Database Schema
-- Creates tables for managing automated and manual workflow phases

-- Main workflow tracking table
CREATE TABLE IF NOT EXISTS workflow_tracking (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) UNIQUE NOT NULL,
    workflow_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    application_data JSONB NOT NULL,
    current_phase VARCHAR(20) CHECK (current_phase IN ('automated', 'manual')) NOT NULL DEFAULT 'automated',
    status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'failed', 'rejected', 'pending_manual', 'error')) NOT NULL DEFAULT 'in_progress',
    result_data JSONB,
    assigned_employee_id VARCHAR(50),
    assigned_employee_name VARCHAR(255),
    manual_phase_started_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_id ON workflow_tracking (workflow_id);
CREATE INDEX IF NOT EXISTS idx_status ON workflow_tracking (status);
CREATE INDEX IF NOT EXISTS idx_current_phase ON workflow_tracking (current_phase);
CREATE INDEX IF NOT EXISTS idx_assigned_employee ON workflow_tracking (assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON workflow_tracking (created_at);

-- Automated phase stage tracking
CREATE TABLE IF NOT EXISTS workflow_stage_tracking (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')) NOT NULL,
    result_data JSONB,
    processing_time_ms INT,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_workflow_stage UNIQUE (workflow_id, stage_name),
    CONSTRAINT fk_workflow_stage_tracking FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_stage_tracking_workflow_id ON workflow_stage_tracking (workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stage_tracking_stage_name ON workflow_stage_tracking (stage_name);
CREATE INDEX IF NOT EXISTS idx_workflow_stage_tracking_status ON workflow_stage_tracking (status);

-- Employee master table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('loan_officer', 'senior_loan_officer', 'branch_manager', 'risk_analyst', 'compliance_officer')) NOT NULL,
    department VARCHAR(100),
    specializations JSONB, -- Array of specializations like ['high_value_loans', 'risk_assessment', 'compliance']
    max_concurrent_applications INT DEFAULT 5,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'on_leave')) DEFAULT 'active',
    hire_date DATE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_role ON employees (role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department);

-- Employee assignments for manual phase
CREATE TABLE IF NOT EXISTS employee_assignments (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    application_id VARCHAR(50),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_role VARCHAR(50) NOT NULL,
    assignment_criteria JSONB, -- Stores criteria used for assignment
    status VARCHAR(20) CHECK (status IN ('assigned', 'in_progress', 'completed', 'reassigned', 'escalated')) DEFAULT 'assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_assignments_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_assignments_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_workflow_id ON employee_assignments (workflow_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_id ON employee_assignments (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_status ON employee_assignments (status);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_assigned_at ON employee_assignments (assigned_at);

-- Manual phase stage tracking
CREATE TABLE IF NOT EXISTS manual_stage_tracking (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    status VARCHAR(30) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'requires_escalation')) NOT NULL,
    result_data JSONB,
    processing_time_ms INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_workflow_employee_stage UNIQUE (workflow_id, employee_id, stage_name),
    CONSTRAINT fk_manual_stage_tracking_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_manual_stage_tracking_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_manual_stage_tracking_workflow_id ON manual_stage_tracking (workflow_id);
CREATE INDEX IF NOT EXISTS idx_manual_stage_tracking_employee_id ON manual_stage_tracking (employee_id);
CREATE INDEX IF NOT EXISTS idx_manual_stage_tracking_stage_name ON manual_stage_tracking (stage_name);
CREATE INDEX IF NOT EXISTS idx_manual_stage_tracking_status ON manual_stage_tracking (status);

-- Application notes and comments
CREATE TABLE IF NOT EXISTS application_notes (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    note_type VARCHAR(20) CHECK (note_type IN ('general', 'risk', 'compliance', 'customer_contact', 'internal')) DEFAULT 'general',
    note_content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    visibility VARCHAR(20) CHECK (visibility IN ('employee_only', 'team', 'department', 'all')) DEFAULT 'team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_notes_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_application_notes_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_application_notes_workflow_id ON application_notes (workflow_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_employee_id ON application_notes (employee_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_note_type ON application_notes (note_type);
CREATE INDEX IF NOT EXISTS idx_application_notes_created_at ON application_notes (created_at);

-- Escalation requests
CREATE TABLE IF NOT EXISTS escalation_requests (
    id SERIAL PRIMARY KEY,
    escalation_id VARCHAR(36) UNIQUE NOT NULL,
    workflow_id VARCHAR(36) NOT NULL,
    requesting_employee_id VARCHAR(50) NOT NULL,
    escalation_type VARCHAR(30) CHECK (escalation_type IN ('supervisor', 'senior_management', 'compliance', 'risk_committee', 'technical')) NOT NULL,
    reason TEXT NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('pending', 'assigned', 'in_review', 'resolved', 'rejected')) DEFAULT 'pending',
    assigned_to_employee_id VARCHAR(50),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_escalation_requests_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_escalation_requests_requesting_employee FOREIGN KEY (requesting_employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    CONSTRAINT fk_escalation_requests_assigned_employee FOREIGN KEY (assigned_to_employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_escalation_requests_escalation_id ON escalation_requests (escalation_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_workflow_id ON escalation_requests (workflow_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_requesting_employee ON escalation_requests (requesting_employee_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON escalation_requests (status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_priority ON escalation_requests (priority);

-- Employee notifications
CREATE TABLE IF NOT EXISTS employee_notifications (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(30) CHECK (notification_type IN ('assignment', 'escalation', 'deadline', 'system', 'approval_required')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    workflow_id VARCHAR(36),
    related_entity_id VARCHAR(50), -- Could be escalation_id, assignment_id, etc.
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_notifications_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_notifications_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_employee_id ON employee_notifications (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_notifications_notification_type ON employee_notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_employee_notifications_is_read ON employee_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_employee_notifications_priority ON employee_notifications (priority);
CREATE INDEX IF NOT EXISTS idx_employee_notifications_created_at ON employee_notifications (created_at);

-- Employee action log for audit trail
CREATE TABLE IF NOT EXISTS employee_action_log (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    stage_name VARCHAR(100),
    action_type VARCHAR(30) CHECK (action_type IN ('process_stage', 'add_note', 'request_escalation', 'approve', 'reject', 'reassign', 'view_application')) NOT NULL,
    action_result JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_action_log_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_action_log_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_employee_action_log_workflow_id ON employee_action_log (workflow_id);
CREATE INDEX IF NOT EXISTS idx_employee_action_log_employee_id ON employee_action_log (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_action_log_action_type ON employee_action_log (action_type);
CREATE INDEX IF NOT EXISTS idx_employee_action_log_created_at ON employee_action_log (created_at);

-- Workflow performance metrics
CREATE TABLE IF NOT EXISTS workflow_performance_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    phase VARCHAR(20) CHECK (phase IN ('automated', 'manual', 'overall')) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20), -- 'seconds', 'minutes', 'hours', 'count', 'percentage'
    stage_name VARCHAR(100),
    employee_id VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workflow_performance_metrics_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_tracking(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_performance_metrics_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_performance_metrics_workflow_id ON workflow_performance_metrics (workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_performance_metrics_phase ON workflow_performance_metrics (phase);
CREATE INDEX IF NOT EXISTS idx_workflow_performance_metrics_metric_name ON workflow_performance_metrics (metric_name);
CREATE INDEX IF NOT EXISTS idx_workflow_performance_metrics_recorded_at ON workflow_performance_metrics (recorded_at);

-- Employee workload tracking
CREATE TABLE IF NOT EXISTS employee_workload_tracking (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    active_assignments INT DEFAULT 0,
    completed_assignments INT DEFAULT 0,
    average_processing_time_hours DECIMAL(8,2),
    workload_percentage DECIMAL(5,2), -- Percentage of capacity utilized
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date),
    CONSTRAINT fk_employee_workload_tracking_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employee_workload_tracking_employee_id ON employee_workload_tracking (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_workload_tracking_date ON employee_workload_tracking (date);

-- System configuration for workflow
CREATE TABLE IF NOT EXISTS workflow_system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_system_config_config_key ON workflow_system_config (config_key);
CREATE INDEX IF NOT EXISTS idx_workflow_system_config_is_active ON workflow_system_config (is_active);

-- Insert default employees for testing
INSERT INTO employees (id, name, email, role, department, specializations, max_concurrent_applications) VALUES
('EMP001', 'John Smith', 'john.smith@lendingcompany.com', 'loan_officer', 'Lending', '["general_loans", "personal_loans"]', 8),
('EMP002', 'Sarah Johnson', 'sarah.johnson@lendingcompany.com', 'senior_loan_officer', 'Lending', '["high_value_loans", "commercial_loans"]', 6),
('EMP003', 'Michael Brown', 'michael.brown@lendingcompany.com', 'branch_manager', 'Management', '["senior_approval", "escalations"]', 4),
('EMP004', 'Emily Davis', 'emily.davis@lendingcompany.com', 'risk_analyst', 'Risk Management', '["risk_assessment", "compliance"]', 10),
('EMP005', 'David Wilson', 'david.wilson@lendingcompany.com', 'compliance_officer', 'Compliance', '["compliance_review", "regulatory"]', 12)
ON CONFLICT (id) DO NOTHING;

-- Insert default system configuration
INSERT INTO workflow_system_config (config_key, config_value, description) VALUES
('assignment_algorithm', '{"type": "weighted_scoring", "factors": {"workload": 0.4, "role_suitability": 0.3, "specialization": 0.2, "experience": 0.1}}', 'Employee assignment algorithm configuration'),
('escalation_rules', '{"auto_escalate_after_hours": 24, "high_priority_threshold": 1000000, "compliance_escalation_required": true}', 'Automatic escalation rules'),
('notification_settings', '{"email_enabled": true, "sms_enabled": false, "in_app_enabled": true, "digest_frequency": "daily"}', 'Employee notification preferences'),
('performance_thresholds', '{"sla_hours": {"loan_funding": 8}, "warning_thresholds": {"processing_time": 6}, "critical_thresholds": {"processing_time": 12}}', 'Performance monitoring thresholds')
ON CONFLICT (config_key) DO NOTHING;

-- Create views for common queries

-- Active workflow summary view
CREATE OR REPLACE VIEW active_workflows_summary AS
SELECT 
    wt.workflow_id,
    wt.current_phase,
    wt.status,
    wt.application_data->>'personal_info.first_name' as first_name,
    wt.application_data->>'personal_info.last_name' as last_name,
    wt.application_data->>'loan_request.requested_amount' as loan_amount,
    wt.assigned_employee_name,
    wt.created_at,
    wt.manual_phase_started_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - wt.created_at))/3600 as hours_since_start,
    CASE 
        WHEN wt.current_phase = 'manual' AND wt.manual_phase_started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - wt.manual_phase_started_at))/3600
        ELSE NULL 
    END as hours_in_manual_phase
FROM workflow_tracking wt
WHERE wt.status IN ('in_progress', 'pending_manual');

-- Employee workload summary view
CREATE OR REPLACE VIEW employee_workload_summary AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.role,
    e.max_concurrent_applications,
    COUNT(ea.id) as current_assignments,
    ROUND((COUNT(ea.id) / e.max_concurrent_applications) * 100, 1) as utilization_percentage,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ea.assigned_at))/3600) as avg_hours_per_assignment
FROM employees e
LEFT JOIN employee_assignments ea ON e.id = ea.employee_id AND ea.status IN ('assigned', 'in_progress')
WHERE e.status = 'active'
GROUP BY e.id, e.name, e.role, e.max_concurrent_applications;

-- Workflow performance summary view
CREATE OR REPLACE VIEW workflow_performance_summary AS
SELECT 
    DATE(wt.created_at) as workflow_date,
    COUNT(*) as total_workflows,
    COUNT(CASE WHEN wt.status = 'completed' THEN 1 END) as completed_workflows,
    COUNT(CASE WHEN wt.status = 'failed' THEN 1 END) as failed_workflows,
    COUNT(CASE WHEN wt.current_phase = 'automated' THEN 1 END) as in_automated_phase,
    COUNT(CASE WHEN wt.current_phase = 'manual' THEN 1 END) as in_manual_phase,
    AVG(CASE WHEN wt.status IN ('completed', 'failed') 
        THEN EXTRACT(EPOCH FROM (wt.updated_at - wt.created_at))/3600 END) as avg_completion_hours,
    ROUND(
        (COUNT(CASE WHEN wt.status = 'completed' THEN 1 END) / 
         NULLIF(COUNT(CASE WHEN wt.status IN ('completed', 'failed') THEN 1 END), 0)) * 100, 1
    ) as success_rate_percentage
FROM workflow_tracking wt
WHERE wt.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(wt.created_at)
ORDER BY workflow_date DESC;

-- Create indexes for better performance
CREATE INDEX idx_workflow_tracking_composite ON workflow_tracking(status, current_phase, created_at);
CREATE INDEX idx_employee_assignments_composite ON employee_assignments(employee_id, status, assigned_at);
CREATE INDEX idx_manual_stage_tracking_composite ON manual_stage_tracking(workflow_id, employee_id, status);
CREATE INDEX idx_application_notes_composite ON application_notes(workflow_id, created_at);
CREATE INDEX idx_employee_notifications_composite ON employee_notifications(employee_id, is_read, created_at);

-- Note: MySQL triggers and stored procedures have been removed for PostgreSQL compatibility.
-- These would need to be rewritten using PostgreSQL syntax if needed.

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_tracking TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_stage_tracking TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON employee_assignments TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON manual_stage_tracking TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON application_notes TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON escalation_requests TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON employee_notifications TO 'workflow_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON employee_action_log TO 'workflow_user'@'%';
-- GRANT SELECT ON employees TO 'workflow_user'@'%';
-- GRANT EXECUTE ON PROCEDURE GetEmployeeDashboardData TO 'workflow_user'@'%';
-- GRANT EXECUTE ON PROCEDURE AssignWorkflowToEmployee TO 'workflow_user'@'%';

-- Create sample data for testing (optional)
-- This can be uncommented for development/testing purposes

/*
-- Sample workflow data
INSERT INTO workflow_tracking (workflow_id, workflow_version, application_data, current_phase, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '1.0.0', 
 '{"personal_info": {"first_name": "John", "last_name": "Doe", "email": "john.doe@email.com"}, "loan_request": {"requested_amount": 250000, "loan_purpose": "home_purchase"}}',
 'manual', 'in_progress'),
('550e8400-e29b-41d4-a716-446655440002', '1.0.0',
 '{"personal_info": {"first_name": "Jane", "last_name": "Smith", "email": "jane.smith@email.com"}, "loan_request": {"requested_amount": 500000, "loan_purpose": "business_expansion"}}',
 'automated', 'in_progress');

-- Sample employee assignments
INSERT INTO employee_assignments (workflow_id, employee_id, employee_name, employee_role, assignment_criteria, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'EMP001', 'John Smith', 'loan_officer', 
 '{"loanAmount": 250000, "riskLevel": "medium", "complexity": "low", "priority": "standard"}', 'assigned');

-- Sample notifications
INSERT INTO employee_notifications (employee_id, notification_type, title, message, workflow_id, priority) VALUES
('EMP001', 'assignment', 'New Application Assigned', 'You have been assigned a new loan application for processing.', '550e8400-e29b-41d4-a716-446655440001', 'medium'),
('EMP002', 'escalation', 'Escalation Request', 'An application requires your review and approval.', '550e8400-e29b-41d4-a716-446655440002', 'high');
*/

-- End of schema