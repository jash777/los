const databaseService = require('../database/service');

async function checkEnumValues() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Get the exact ENUM definition for current_stage
            console.log('\n=== current_stage ENUM Values ===');
            const [columns] = await connection.execute(`
                SELECT COLUMN_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'loan_applications' 
                AND COLUMN_NAME = 'current_stage'
                AND TABLE_SCHEMA = 'loan_origination_system'
            `);
            
            if (columns.length > 0) {
                console.log('ENUM definition:', columns[0].COLUMN_TYPE);
            } else {
                console.log('No current_stage column found');
            }
            
            // Also check what values are actually in the database
            console.log('\n=== Actual current_stage values in database ===');
            const [stageValues] = await connection.execute(`
                SELECT DISTINCT current_stage FROM loan_applications ORDER BY current_stage
            `);
            
            stageValues.forEach(row => {
                console.log(`- '${row.current_stage}'`);
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await databaseService.close();
        process.exit(0);
    }
}

checkEnumValues();