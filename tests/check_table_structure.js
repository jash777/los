/**
 * Check Table Structure for All Tables
 */

const databaseService = require('../src/database/service');

async function checkTableStructure() {
    console.log('🔍 Checking Table Structures...');
    console.log('==============================');
    
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        const tables = [
            'stage_processing',
            'audit_logs', 
            'external_verifications',
            'credit_decisions',
            'loan_applications'
        ];
        
        for (const tableName of tables) {
            console.log(`\n📋 ${tableName.toUpperCase()} Table Structure:`);
            console.log('='.repeat(50));
            
            try {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = ?
                    ORDER BY ORDINAL_POSITION
                `, [tableName]);
                
                columns.forEach(col => {
                    const nullable = col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null';
                    const defaultValue = col.COLUMN_DEFAULT ? ` default: ${col.COLUMN_DEFAULT}` : '';
                    console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${nullable})${defaultValue}`);
                });
                
                // Check sample data
                const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 1`);
                if (sampleData.length > 0) {
                    console.log(`\n  Sample record keys: ${Object.keys(sampleData[0]).join(', ')}`);
                } else {
                    console.log(`\n  No data in table`);
                }
                
            } catch (error) {
                console.log(`  ❌ Error checking table: ${error.message}`);
            }
        }
        
        connection.release();
        
    } catch (error) {
        console.error('❌ Error checking table structures:', error);
    } finally {
        await databaseService.close();
    }
}

checkTableStructure().catch(console.error);
