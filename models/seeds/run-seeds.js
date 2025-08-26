/**
 * Database Seed Runner
 * Populates database with initial data
 */

require('dotenv').config();
const { Pool } = require('pg');

const config = require('../../middleware/config/app.config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl
});

async function runSeeds() {
  try {
    console.log('🌱 Running database seeds...\n');

    // Seed employees
    console.log('👥 Seeding employees...');
    await pool.query(`
      INSERT INTO employees (id, name, email, role, department, specializations, max_concurrent_applications) VALUES
      ('EMP001', 'John Smith', 'john.smith@lendingcompany.com', 'loan_officer', 'Lending', '["general_loans", "personal_loans"]', 8),
      ('EMP002', 'Sarah Johnson', 'sarah.johnson@lendingcompany.com', 'senior_loan_officer', 'Lending', '["high_value_loans", "commercial_loans"]', 6),
      ('EMP003', 'Michael Brown', 'michael.brown@lendingcompany.com', 'branch_manager', 'Management', '["senior_approval", "escalations"]', 4),
      ('EMP004', 'Emily Davis', 'emily.davis@lendingcompany.com', 'risk_analyst', 'Risk Management', '["risk_assessment", "compliance"]', 10),
      ('EMP005', 'David Wilson', 'david.wilson@lendingcompany.com', 'compliance_officer', 'Compliance', '["compliance_review", "regulatory"]', 12)
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed system configuration
    console.log('⚙️ Seeding system configuration...');
    await pool.query(`
      INSERT INTO workflow_system_config (config_key, config_value, description) VALUES
      ('assignment_algorithm', '{"type": "weighted_scoring", "factors": {"workload": 0.4, "role_suitability": 0.3, "specialization": 0.2, "experience": 0.1}}', 'Employee assignment algorithm configuration'),
      ('escalation_rules', '{"auto_escalate_after_hours": 24, "high_priority_threshold": 1000000, "compliance_escalation_required": true}', 'Automatic escalation rules'),
      ('notification_settings', '{"email_enabled": true, "sms_enabled": false, "in_app_enabled": true, "digest_frequency": "daily"}', 'Employee notification preferences'),
      ('performance_thresholds', '{"sla_hours": {"loan_funding": 8}, "warning_thresholds": {"processing_time": 6}, "critical_thresholds": {"processing_time": 12}}', 'Performance monitoring thresholds')
      ON CONFLICT (config_key) DO NOTHING
    `);

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeds if called directly
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };