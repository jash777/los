require('dotenv').config();
const pool = require('../src/config/database');

const fixDocumentsConstraint = async () => {
  try {
    console.log('🔧 Fixing loan_documents table constraints...\n');

    // Make file_path nullable in loan_documents table
    console.log('1. Making file_path column nullable...');
    await pool.query(`
      ALTER TABLE loan_documents 
      ALTER COLUMN file_path DROP NOT NULL
    `);

    // Also make file_name nullable for flexibility
    console.log('2. Making file_name column nullable...');
    await pool.query(`
      ALTER TABLE loan_documents 
      ALTER COLUMN file_name DROP NOT NULL
    `);

    console.log('✅ Documents table constraints fixed successfully!\n');
    
    // Test the fix
    console.log('3. Testing the fix...');
    const testResult = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'loan_documents' 
      AND column_name IN ('file_path', 'file_name')
    `);
    
    console.log('Column nullability status:');
    testResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error fixing documents constraints:', error.message);
  } finally {
    pool.end();
  }
};

fixDocumentsConstraint();