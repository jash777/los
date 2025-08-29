/**
 * Check All Enum Columns in Database
 * Identifies which table and column is causing the enum error
 */

const databaseService = require('../src/database/service');
const logger = require('../src/utils/logger');

async function checkAllEnumColumns() {
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();

        console.log('🔍 Checking All Database Tables and Enum Columns...');
        console.log('====================================================');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => t[Object.keys(t)[0]]);
        
        console.log('📋 Available Tables:');
        tableNames.forEach(name => console.log(`   ${name}`));
        console.log('');

        // Check enum columns in each table
        for (const tableName of tableNames) {
            try {
                const [columns] = await connection.execute(`SHOW COLUMNS FROM ${tableName} WHERE Type LIKE '%enum%'`);
                
                if (columns.length > 0) {
                    console.log(`🏗️ ${tableName} enum columns:`);
                    columns.forEach(col => {
                        console.log(`   ${col.Field}: ${col.Type}`);
                    });
                    console.log('');
                }
            } catch (error) {
                console.log(`❌ Error checking table ${tableName}:`, error.message);
            }
        }

        // Check specifically problematic tables
        const problematicTables = ['loan_applications', 'stage_processing', 'applications', 'loan_applications_enhanced'];
        
        console.log('🔍 Detailed Check of Key Tables:');
        console.log('=================================');
        
        for (const tableName of problematicTables) {
            try {
                const [tableExists] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
                if (tableExists.length > 0) {
                    console.log(`✅ Table ${tableName} exists`);
                    
                    const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
                    console.log(`   Columns:`);
                    structure.forEach(col => {
                        if (col.Type.includes('enum')) {
                            console.log(`     ${col.Field}: ${col.Type} [ENUM]`);
                        } else if (col.Field.includes('status') || col.Field.includes('stage')) {
                            console.log(`     ${col.Field}: ${col.Type}`);
                        }
                    });
                    console.log('');
                } else {
                    console.log(`❌ Table ${tableName} does not exist`);
                }
            } catch (error) {
                console.log(`❌ Error checking table ${tableName}:`, error.message);
            }
        }

        connection.release();
        await databaseService.close();

    } catch (error) {
        logger.error('Error checking enum columns:', error);
        console.error('❌ Error:', error.message);
    }
}

checkAllEnumColumns();
