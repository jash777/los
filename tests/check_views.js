const databaseService = require('../src/database/service');

async function checkViews() {
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        console.log('🔍 Checking Views...');
        console.log('===================');
        
        const [views] = await connection.execute("SHOW TABLES LIKE 'v_%'");
        console.log('📋 Available Views:');
        views.forEach(view => {
            const viewName = Object.values(view)[0];
            console.log(`   ${viewName}`);
        });
        
        // Check manual workflow tables
        const [manualTables] = await connection.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'loan_origination_system' 
            AND table_name IN ('manual_review_queue', 'reviewers', 'workflow_rules')
        `);
        
        console.log('\n📋 Manual Workflow Tables:');
        if (manualTables.length > 0) {
            manualTables.forEach(table => {
                console.log(`   ${table.table_name || table.TABLE_NAME}`);
            });
        } else {
            console.log('   No manual workflow tables found');
        }
        
        connection.release();
        await databaseService.close();
        
    } catch (error) {
        console.error('Error checking views:', error);
        await databaseService.close();
    }
}

checkViews();
