/**
 * Database Schema for Automated Loan Workflow
 * Creates additional tables needed for fully automated processing
 */

const pool = require('../src/config/database');

async function createAutomatedWorkflowTables() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('Creating automated workflow tables...');

        // 1. Loan Rejections Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loan_rejections (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES loan_applications(id),
                rejection_stage VARCHAR(50) NOT NULL,
                rejection_reasons JSONB,
                rejection_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(application_id)
            )
        `);

        // 2. Loan Disbursements Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loan_disbursements (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES loan_applications(id),
                disbursement_reference VARCHAR(100) UNIQUE NOT NULL,
                disbursement_amount DECIMAL(15,2) NOT NULL,
                disbursement_method VARCHAR(20) DEFAULT 'NEFT',
                bank_account VARCHAR(50),
                ifsc_code VARCHAR(15),
                status VARCHAR(20) DEFAULT 'Scheduled',
                scheduled_date TIMESTAMP,
                disbursed_at TIMESTAMP,
                disbursement_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Automated Processing Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS automated_processing_logs (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES loan_applications(id),
                processing_stage VARCHAR(50) NOT NULL,
                stage_status VARCHAR(20) NOT NULL,
                processing_time_ms INTEGER,
                stage_data JSONB,
                error_details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Auto Decision Rules Table (for dynamic rule management)
        await client.query(`
            CREATE TABLE IF NOT EXISTS auto_decision_rules (
                id SERIAL PRIMARY KEY,
                rule_category VARCHAR(50) NOT NULL,
                rule_name VARCHAR(100) NOT NULL,
                rule_condition TEXT NOT NULL,
                rule_action VARCHAR(20) NOT NULL,
                rule_priority INTEGER DEFAULT 1,
                is_active BOOLEAN DEFAULT true,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Processing Performance Metrics Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS processing_metrics (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                total_applications INTEGER DEFAULT 0,
                auto_approved INTEGER DEFAULT 0,
                auto_rejected INTEGER DEFAULT 0,
                manual_review_required INTEGER DEFAULT 0,
                avg_processing_time_ms INTEGER DEFAULT 0,
                success_rate DECIMAL(5,2) DEFAULT 0,
                metrics_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date)
            )
        `);

        // 6. Automated Offer Templates Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS automated_offer_templates (
                id SERIAL PRIMARY KEY,
                template_name VARCHAR(100) NOT NULL,
                risk_band VARCHAR(20) NOT NULL,
                min_cibil_score INTEGER,
                max_cibil_score INTEGER,
                base_interest_rate DECIMAL(5,2) NOT NULL,
                max_loan_amount DECIMAL(15,2),
                max_tenure_months INTEGER,
                processing_fee_percent DECIMAL(5,2),
                template_conditions JSONB,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add indexes for better performance
        console.log('Creating indexes...');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_loan_rejections_application_id 
            ON loan_rejections(application_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_loan_disbursements_application_id 
            ON loan_disbursements(application_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_loan_disbursements_status 
            ON loan_disbursements(status)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_automated_processing_logs_application_id 
            ON automated_processing_logs(application_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_automated_processing_logs_stage 
            ON automated_processing_logs(processing_stage)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_processing_metrics_date 
            ON processing_metrics(date)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_auto_decision_rules_category 
            ON auto_decision_rules(rule_category)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_automated_offer_templates_risk_band 
            ON automated_offer_templates(risk_band)
        `);

        // Insert default automated offer templates
        console.log('Inserting default offer templates...');

        await client.query(`
            INSERT INTO automated_offer_templates (
                template_name, risk_band, min_cibil_score, max_cibil_score,
                base_interest_rate, max_loan_amount, max_tenure_months,
                processing_fee_percent, template_conditions
            ) VALUES 
            ('Prime Customer', 'Low', 750, 850, 10.50, 1000000, 60, 1.50, '{"auto_approve": true, "max_income_multiple": 60}'),
            ('Standard Customer', 'Medium', 650, 749, 12.00, 500000, 48, 2.00, '{"auto_approve": true, "max_income_multiple": 50}'),
            ('Sub-Prime Customer', 'High', 600, 649, 15.00, 200000, 36, 3.00, '{"auto_approve": false, "manual_review": true}')
            ON CONFLICT DO NOTHING
        `);

        // Insert default auto decision rules
        console.log('Inserting default decision rules...');

        await client.query(`
            INSERT INTO auto_decision_rules (
                rule_category, rule_name, rule_condition, rule_action, rule_priority
            ) VALUES 
            ('eligibility', 'Minimum Age', 'age >= 21 AND age <= 65', 'approve', 1),
            ('eligibility', 'Minimum Income', 'monthly_income >= 15000', 'approve', 1),
            ('eligibility', 'Maximum Loan to Income', 'requested_amount <= (monthly_income * 50)', 'approve', 2),
            ('bureau', 'Minimum CIBIL', 'cibil_score >= 600', 'approve', 1),
            ('bureau', 'Maximum Enquiries', 'enquiries_last_12m <= 8', 'approve', 2),
            ('bank', 'Minimum Surplus', 'surplus_avg >= 5000', 'approve', 1),
            ('bank', 'Maximum DTI', 'dti_percentage <= 50', 'approve', 1),
            ('bank', 'Maximum Bounces', 'bounces_last_6m <= 3', 'approve', 2)
            ON CONFLICT DO NOTHING
        `);

        await client.query('COMMIT');
        console.log('✅ Automated workflow tables created successfully!');

        // Display summary
        console.log('\n📊 Created Tables:');
        console.log('1. loan_rejections - Stores rejection details');
        console.log('2. loan_disbursements - Manages disbursement process');
        console.log('3. automated_processing_logs - Tracks processing stages');
        console.log('4. auto_decision_rules - Dynamic rule management');
        console.log('5. processing_metrics - Performance tracking');
        console.log('6. automated_offer_templates - Offer generation templates');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating automated workflow tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    createAutomatedWorkflowTables()
        .then(() => {
            console.log('Database setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = createAutomatedWorkflowTables;