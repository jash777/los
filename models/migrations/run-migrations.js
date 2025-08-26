/**
 * Database Migration Runner
 * Executes database schema migrations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...\n');

    // Read and execute the main schema
    const schemaPath = path.join(__dirname, '..', 'schemas', 'loan-management-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing loan management schema...');
    await pool.query(schemaSql);

    console.log('✅ Database migrations completed successfully!');
    
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`🔗 Database connected at: ${result.rows[0].current_time}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };