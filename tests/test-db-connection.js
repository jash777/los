const databaseService = require('../src/database/service');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        
        // Initialize database service first
        console.log('Initializing database service...');
        await databaseService.initialize();
        console.log('✅ Database service initialized successfully!');
        
        // Test getting database stats
        console.log('\nTesting database stats...');
        const stats = await databaseService.getDatabaseStats();
        console.log('Database stats:', JSON.stringify(stats, null, 2));
        
        // Test getting a sample application (this should fail gracefully if no apps exist)
        console.log('\nTesting application retrieval...');
        const sampleApp = await databaseService.getCompleteApplication('EL_test_123');
        console.log('Sample application result:', sampleApp ? 'Found' : 'Not found (expected)');
        
        console.log('\n✅ Database connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection test failed:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    } finally {
        // Close database connections
        await databaseService.close();
        process.exit(0);
    }
}

testDatabaseConnection();