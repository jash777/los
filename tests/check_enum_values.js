const databaseService = require('../src/database/service');

async function checkEnumValues() {
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        console.log('🔍 Checking Enum Values...');
        console.log('==========================');
        
        // Check loan_applications status enum
        const [statusResult] = await connection.execute("SHOW COLUMNS FROM loan_applications LIKE 'status'");
        console.log('📋 LOAN_APPLICATIONS.status enum values:');
        console.log(statusResult[0].Type);
        
        // Check stage_processing status enum
        const [stageStatusResult] = await connection.execute("SHOW COLUMNS FROM stage_processing LIKE 'status'");
        console.log('\n📋 STAGE_PROCESSING.status enum values:');
        console.log(stageStatusResult[0].Type);
        
        // Check current_stage enum
        const [currentStageResult] = await connection.execute("SHOW COLUMNS FROM loan_applications LIKE 'current_stage'");
        console.log('\n📋 LOAN_APPLICATIONS.current_stage enum values:');
        console.log(currentStageResult[0].Type);
        
        connection.release();
        await databaseService.close();
        
    } catch (error) {
        console.error('Error checking enum values:', error);
        await databaseService.close();
    }
}

checkEnumValues();
