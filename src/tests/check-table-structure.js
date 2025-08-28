const databaseService = require('../database/service');
const logger = require('../utils/logger');

async function checkTableStructure() {
    try {
        console.log('Starting table structure check...');
        console.log('Initializing database service...');
        await databaseService.initialize();
        console.log('Database service initialized successfully');
        
        console.log('Checking applications table structure...');
        const query = 'SHOW CREATE TABLE applications';
        const result = await databaseService.executeQuery(query);
        
        console.log('Table structure:');
        console.log(result[0]['Create Table']);
        
        // Also check current stage values in existing records
        console.log('\nChecking existing current_stage values:');
        const stageQuery = 'SELECT DISTINCT current_stage FROM applications';
        const stages = await databaseService.executeQuery(stageQuery);
        
        console.log('Existing stage values:');
        stages.forEach(row => {
            console.log(`- ${row.current_stage}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await databaseService.close();
        console.log('Database service closed');
    }
}

checkTableStructure();