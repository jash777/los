const databaseService = require('../src/database/service');

async function checkEnumValues() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        // Get the database connection to run raw queries
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Get the exact ENUM definition for current_stage
            console.log('\n=== current_stage ENUM Values ===');
            const [columns] = await connection.execute(`
                SELECT COLUMN_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'loan_applications' 
                AND COLUMN_NAME = 'current_stage'
                AND TABLE_SCHEMA = DATABASE()
            `);
            
            if (columns.length > 0) {
                console.log('ENUM definition:', columns[0].COLUMN_TYPE);
            }
            
            // Get the exact ENUM definition for status
            console.log('\n=== status ENUM Values ===');
            const [statusColumns] = await connection.execute(`
                SELECT COLUMN_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'loan_applications' 
                AND COLUMN_NAME = 'status'
                AND TABLE_SCHEMA = DATABASE()
            `);
            
            if (statusColumns.length > 0) {
                console.log('ENUM definition:', statusColumns[0].COLUMN_TYPE);
            }
            
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