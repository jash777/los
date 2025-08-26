/**
 * Database Reset Script
 * Drops all tables and recreates them from schema
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const config = require('../middleware/config/app.config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl
});

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');

    // Drop all tables in the correct order (reverse of dependencies)
    const dropTables = [
      'employee_action_log',
      'employee_notifications', 
      'escalation_requests',
      'application_notes',
      'manual_stage_tracking',
      'employee_assignments',
      'workflow_stage_tracking',
      'workflow_tracking',
      'employees'
    ];

    for (const table of dropTables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} not found or already dropped`);
      }
    }

    // Drop views
    const dropViews = [
      'workflow_performance_summary',
      'employee_workload_summary',
      'workflow_performance_metrics'
    ];

    for (const view of dropViews) {
      try {
        await pool.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
        console.log(`✅ Dropped view: ${view}`);
      } catch (error) {
        console.log(`⚠️  View ${view} not found or already dropped`);
      }
    }

    console.log('\n📋 Creating tables from schema...');
    
    // Read and execute the schema
    const schemaPath = path.join(__dirname, '..', 'models', 'schemas', 'loan-management-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schemaSql);
    console.log('✅ Database schema created successfully!');
    
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`🔗 Database connected at: ${result.rows[0].current_time}`);

    // Verify tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };