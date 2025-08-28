const databaseService = require('../src/database/service');

async function debugTables() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        // Get the database connection to run raw queries
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Show all tables
            console.log('\n=== Available Tables ===');
            const [tables] = await connection.execute('SHOW TABLES');
            tables.forEach(table => {
                console.log('-', Object.values(table)[0]);
            });
            
            // Describe loan_applications table structure
            console.log('\n=== loan_applications Table Structure ===');
            const [columns] = await connection.execute('DESCRIBE loan_applications');
            columns.forEach(col => {
                console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Default ? `default: ${col.Default}` : ''}`);
            });
            
            // Check a sample record
            console.log('\n=== Sample Record ===');
            const [sample] = await connection.execute('SELECT * FROM loan_applications WHERE application_number = ? LIMIT 1', ['EL_1756292481478_34trxgqg9']);
            if (sample.length > 0) {
                console.log('Sample record:');
                Object.keys(sample[0]).forEach(key => {
                    console.log(`  ${key}: ${sample[0][key]}`);
                });
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

debugTables();