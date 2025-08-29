-- Co-Lending Database Schema
-- Comprehensive schema for co-lending partnerships, ratios, and distribution

USE loan_origination_system;

-- Co-lending Partners (Banks and NBFCs)
CREATE TABLE IF NOT EXISTS co_lending_partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_code VARCHAR(20) UNIQUE NOT NULL,
    partner_name VARCHAR(200) NOT NULL,
    partner_type ENUM('bank', 'nbfc', 'fintech') NOT NULL,
    license_number VARCHAR(100),
    regulatory_authority VARCHAR(100),
    contact_details JSON,
    api_endpoint VARCHAR(500),
    api_credentials JSON,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    risk_rating ENUM('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C') DEFAULT 'A',
    minimum_ticket_size DECIMAL(15,2) DEFAULT 0,
    maximum_ticket_size DECIMAL(15,2) DEFAULT 10000000,
    preferred_sectors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Co-lending Ratios and Rules
CREATE TABLE IF NOT EXISTS co_lending_ratios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    loan_amount_min DECIMAL(15,2) DEFAULT 0,
    loan_amount_max DECIMAL(15,2) DEFAULT 99999999,
    cibil_score_min INT DEFAULT 0,
    cibil_score_max INT DEFAULT 900,
    loan_purpose VARCHAR(100),
    bank_partner_id INT,
    nbfc_partner_id INT,
    bank_ratio DECIMAL(5,2) DEFAULT 80.00,
    nbfc_ratio DECIMAL(5,2) DEFAULT 20.00,
    is_default BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_partner_id) REFERENCES co_lending_partners(id),
    FOREIGN KEY (nbfc_partner_id) REFERENCES co_lending_partners(id),
    INDEX idx_loan_amount (loan_amount_min, loan_amount_max),
    INDEX idx_cibil_score (cibil_score_min, cibil_score_max)
);

-- Co-lending Transactions
CREATE TABLE IF NOT EXISTS co_lending_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    application_number VARCHAR(50) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    bank_partner_id INT NOT NULL,
    nbfc_partner_id INT NOT NULL,
    bank_amount DECIMAL(15,2) NOT NULL,
    nbfc_amount DECIMAL(15,2) NOT NULL,
    bank_ratio DECIMAL(5,2) NOT NULL,
    nbfc_ratio DECIMAL(5,2) NOT NULL,
    transaction_status ENUM('initiated', 'bank_approved', 'nbfc_approved', 'both_approved', 'disbursed', 'failed', 'cancelled') DEFAULT 'initiated',
    bank_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    nbfc_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    bank_transaction_ref VARCHAR(100),
    nbfc_transaction_ref VARCHAR(100),
    disbursement_date TIMESTAMP NULL,
    settlement_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_partner_id) REFERENCES co_lending_partners(id),
    FOREIGN KEY (nbfc_partner_id) REFERENCES co_lending_partners(id),
    INDEX idx_application (application_number),
    INDEX idx_transaction_status (transaction_status),
    INDEX idx_disbursement_date (disbursement_date)
);

-- Co-lending Settlement Tracking
CREATE TABLE IF NOT EXISTS co_lending_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    settlement_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_id VARCHAR(50) NOT NULL,
    settlement_type ENUM('disbursement', 'repayment', 'adjustment') NOT NULL,
    bank_amount DECIMAL(15,2) NOT NULL,
    nbfc_amount DECIMAL(15,2) NOT NULL,
    settlement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settlement_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    bank_settlement_ref VARCHAR(100),
    nbfc_settlement_ref VARCHAR(100),
    settlement_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES co_lending_transactions(transaction_id),
    INDEX idx_settlement_date (settlement_date),
    INDEX idx_settlement_status (settlement_status)
);

-- Co-lending Portfolio Analytics
CREATE TABLE IF NOT EXISTS co_lending_portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    portfolio_date DATE NOT NULL,
    total_loans_count INT DEFAULT 0,
    total_loan_amount DECIMAL(15,2) DEFAULT 0,
    active_loans_count INT DEFAULT 0,
    active_loan_amount DECIMAL(15,2) DEFAULT 0,
    disbursed_amount DECIMAL(15,2) DEFAULT 0,
    outstanding_amount DECIMAL(15,2) DEFAULT 0,
    npa_count INT DEFAULT 0,
    npa_amount DECIMAL(15,2) DEFAULT 0,
    collection_efficiency DECIMAL(5,2) DEFAULT 0,
    average_ticket_size DECIMAL(15,2) DEFAULT 0,
    portfolio_yield DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES co_lending_partners(id),
    UNIQUE KEY unique_partner_date (partner_id, portfolio_date),
    INDEX idx_portfolio_date (portfolio_date)
);

-- Co-lending API Integration Logs
CREATE TABLE IF NOT EXISTS co_lending_api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50),
    partner_id INT NOT NULL,
    api_endpoint VARCHAR(500) NOT NULL,
    request_method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    request_payload JSON,
    response_status INT,
    response_payload JSON,
    response_time_ms INT,
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_timestamp TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    FOREIGN KEY (partner_id) REFERENCES co_lending_partners(id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_partner_timestamp (partner_id, request_timestamp)
);

-- Insert default co-lending partners
INSERT INTO co_lending_partners (partner_code, partner_name, partner_type, status, risk_rating, minimum_ticket_size, maximum_ticket_size, contact_details) VALUES
('HDFC_BANK', 'HDFC Bank Limited', 'bank', 'active', 'AAA', 50000, 5000000, '{"email": "colending@hdfcbank.com", "phone": "+91-22-12345678", "contact_person": "Rahul Sharma"}'),
('ICICI_BANK', 'ICICI Bank Limited', 'bank', 'active', 'AAA', 50000, 5000000, '{"email": "partnerships@icicibank.com", "phone": "+91-22-87654321", "contact_person": "Priya Mehta"}'),
('SBI_BANK', 'State Bank of India', 'bank', 'active', 'AAA', 25000, 10000000, '{"email": "colending@sbi.co.in", "phone": "+91-22-11223344", "contact_person": "Amit Kumar"}'),
('BAJAJ_FINSERV', 'Bajaj Finserv Limited', 'nbfc', 'active', 'AA', 25000, 2000000, '{"email": "partnerships@bajajfinserv.in", "phone": "+91-20-55667788", "contact_person": "Neha Singh"}'),
('MAHINDRA_FIN', 'Mahindra Finance Limited', 'nbfc', 'active', 'AA', 50000, 3000000, '{"email": "colending@mahindrafinance.com", "phone": "+91-22-99887766", "contact_person": "Vikram Joshi"}'),
('TATA_CAPITAL', 'Tata Capital Limited', 'nbfc', 'active', 'AA', 100000, 5000000, '{"email": "partnerships@tatacapital.com", "phone": "+91-22-44556677", "contact_person": "Anjali Gupta"}');

-- Insert default co-lending ratios
INSERT INTO co_lending_ratios (rule_name, loan_amount_min, loan_amount_max, cibil_score_min, cibil_score_max, bank_partner_id, nbfc_partner_id, bank_ratio, nbfc_ratio, is_default, priority_order) VALUES
('Default 80-20 Rule', 0, 99999999, 0, 900, 1, 4, 80.00, 20.00, TRUE, 1),
('High Value Loans', 1000000, 5000000, 750, 900, 1, 4, 85.00, 15.00, FALSE, 2),
('Mid Ticket Loans', 200000, 999999, 700, 900, 2, 5, 80.00, 20.00, FALSE, 3),
('Small Ticket Loans', 50000, 199999, 650, 900, 3, 4, 75.00, 25.00, FALSE, 4),
('Premium Customers', 0, 99999999, 800, 900, 1, 6, 90.00, 10.00, FALSE, 5);

-- Create views for analytics
CREATE VIEW IF NOT EXISTS co_lending_partnership_summary AS
SELECT 
    cp.partner_code,
    cp.partner_name,
    cp.partner_type,
    cp.status,
    cp.risk_rating,
    COUNT(clt.id) as total_transactions,
    COALESCE(SUM(CASE WHEN cp.partner_type = 'bank' THEN clt.bank_amount ELSE clt.nbfc_amount END), 0) as total_amount,
    COALESCE(AVG(CASE WHEN cp.partner_type = 'bank' THEN clt.bank_amount ELSE clt.nbfc_amount END), 0) as average_amount,
    COUNT(CASE WHEN clt.transaction_status = 'disbursed' THEN 1 END) as disbursed_count,
    COALESCE(SUM(CASE WHEN clt.transaction_status = 'disbursed' AND cp.partner_type = 'bank' THEN clt.bank_amount 
                     WHEN clt.transaction_status = 'disbursed' AND cp.partner_type = 'nbfc' THEN clt.nbfc_amount 
                     ELSE 0 END), 0) as disbursed_amount
FROM co_lending_partners cp
LEFT JOIN co_lending_transactions clt ON (cp.id = clt.bank_partner_id OR cp.id = clt.nbfc_partner_id)
GROUP BY cp.id, cp.partner_code, cp.partner_name, cp.partner_type, cp.status, cp.risk_rating;

CREATE VIEW IF NOT EXISTS co_lending_monthly_analytics AS
SELECT 
    DATE_FORMAT(clt.created_at, '%Y-%m') as month_year,
    COUNT(*) as total_transactions,
    SUM(clt.loan_amount) as total_loan_amount,
    AVG(clt.loan_amount) as average_loan_amount,
    SUM(clt.bank_amount) as total_bank_amount,
    SUM(clt.nbfc_amount) as total_nbfc_amount,
    AVG(clt.bank_ratio) as average_bank_ratio,
    AVG(clt.nbfc_ratio) as average_nbfc_ratio,
    COUNT(CASE WHEN clt.transaction_status = 'disbursed' THEN 1 END) as disbursed_count,
    SUM(CASE WHEN clt.transaction_status = 'disbursed' THEN clt.loan_amount ELSE 0 END) as disbursed_amount
FROM co_lending_transactions clt
GROUP BY DATE_FORMAT(clt.created_at, '%Y-%m')
ORDER BY month_year DESC;
