require('dotenv').config();
const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

const seedConsolidatedData = async () => {
  try {
    console.log('🌱 Seeding consolidated database with essential data...\n');

    // Insert default roles
    console.log('1. Inserting default roles...');
    await pool.query(`
      INSERT INTO roles (role_name, description) VALUES
      ('super_admin', 'Super Administrator with full system access'),
      ('admin', 'System Administrator with most privileges'),
      ('manager', 'Department Manager with team oversight'),
      ('loan_approver', 'Senior staff who can approve loans'),
      ('loan_processor', 'Staff who process loan applications'),
      ('credit_analyst', 'Staff who analyze credit and risk'),
      ('collection_agent', 'Staff who handle collections and recovery'),
      ('auditor', 'Internal auditor with read-only access'),
      ('viewer', 'Read-only access to reports and dashboards')
      ON CONFLICT (role_name) DO NOTHING
    `);

    // Insert default permissions
    console.log('2. Inserting default permissions...');
    const permissions = [
      // User Management
      ['user_create', 'user_management', 'Create new users'],
      ['user_read', 'user_management', 'View user information'],
      ['user_update', 'user_management', 'Update user information'],
      ['user_delete', 'user_management', 'Delete users'],
      
      // Loan Management
      ['loan_create', 'loan_management', 'Create new loan applications'],
      ['loan_read', 'loan_management', 'View loan applications'],
      ['loan_update', 'loan_management', 'Update loan applications'],
      ['loan_approve', 'loan_management', 'Approve loan applications'],
      ['loan_reject', 'loan_management', 'Reject loan applications'],
      ['loan_disburse', 'loan_management', 'Disburse approved loans'],
      
      // Risk Management
      ['risk_assess', 'risk_management', 'Perform risk assessments'],
      ['risk_override', 'risk_management', 'Override risk decisions'],
      
      // Collection Management
      ['collection_manage', 'collection_management', 'Manage loan collections'],
      ['collection_strategy', 'collection_management', 'Define collection strategies'],
      
      // Reporting
      ['report_view', 'reporting', 'View reports and dashboards'],
      ['report_export', 'reporting', 'Export reports'],
      ['report_create', 'reporting', 'Create custom reports'],
      
      // System Administration
      ['system_config', 'system_admin', 'Configure system settings'],
      ['audit_view', 'system_admin', 'View audit logs'],
      ['backup_manage', 'system_admin', 'Manage database backups']
    ];

    for (const [permName, module, description] of permissions) {
      await pool.query(`
        INSERT INTO permissions (permission_name, module, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_name) DO NOTHING
      `, [permName, module, description]);
    }

    // Get role and permission IDs for mapping
    console.log('3. Setting up role-permission mappings...');
    const superAdminRole = await pool.query('SELECT id FROM roles WHERE role_name = $1', ['super_admin']);
    const allPermissions = await pool.query('SELECT id FROM permissions');
    
    if (superAdminRole.rows.length > 0) {
      const roleId = superAdminRole.rows[0].id;
      
      // Grant all permissions to super_admin
      for (const permission of allPermissions.rows) {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [roleId, permission.id]);
      }
    }

    // Create superadmin user
    console.log('4. Creating superadmin user...');
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const superAdminRoleId = superAdminRole.rows[0]?.id;
    
    await pool.query(`
      INSERT INTO admin_users (id, username, password_hash, employee_name, email, role_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        employee_name = EXCLUDED.employee_name,
        email = EXCLUDED.email,
        role_id = EXCLUDED.role_id,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `, [
      '5ea77806-12cb-425e-868f-e971867fa32c',
      'superadmin',
      hashedPassword,
      'Super Administrator',
      'superadmin@lendingsystem.com',
      superAdminRoleId,
      'active'
    ]);

    // Insert sample AI model performance data
    console.log('5. Inserting sample AI model performance data...');
    const models = [
      {
        name: 'Risk Assessment Model',
        version: 'v2.1',
        accuracy: 87.5,
        precision: 85.2,
        recall: 89.1,
        f1: 87.1
      },
      {
        name: 'Fraud Detection Model',
        version: 'v1.8',
        accuracy: 92.3,
        precision: 90.1,
        recall: 94.2,
        f1: 92.1
      },
      {
        name: 'Credit Scoring Model',
        version: 'v3.0',
        accuracy: 89.7,
        precision: 88.5,
        recall: 91.0,
        f1: 89.7
      }
    ];

    for (const model of models) {
      await pool.query(`
        INSERT INTO ai_model_performance (
          model_name, model_version, accuracy_score, precision_score, 
          recall_score, f1_score, performance_metrics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        model.name,
        model.version,
        model.accuracy,
        model.precision,
        model.recall,
        model.f1,
        JSON.stringify({
          accuracy: model.accuracy,
          precision: model.precision,
          recall: model.recall,
          f1_score: model.f1,
          last_updated: new Date().toISOString()
        })
      ]);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log('   - Roles created: 9');
    console.log('   - Permissions created: 20');
    console.log('   - Super admin user created with all permissions');
    console.log('   - AI model performance data seeded: 3 models');
    console.log('\n🔐 Superadmin Credentials:');
    console.log('   - Username: superadmin');
    console.log('   - Password: SuperAdmin@123');
    console.log('   - ID: 5ea77806-12cb-425e-868f-e971867fa32c');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedConsolidatedData };

if (require.main === module) {
  seedConsolidatedData()
    .then(() => {
      console.log('\n🎉 Database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}