/**
 * Debug Pre-qualification Service
 * Test the service directly to identify the error
 */

const PreQualificationService = require('../src/services/pre-qualification');
const databaseService = require('../src/database/service');

async function debugPreQualification() {
    try {
        console.log('🔍 Testing Pre-qualification Service...');
        
        // Initialize database service first
        await databaseService.initialize();
        console.log('✅ Database service initialized');
        
        const service = new PreQualificationService();
        
        const testData = {
            applicantName: "John Doe",
            phone: "9876543210", 
            email: "john@example.com",
            panNumber: "ABCDE1234F",
            dateOfBirth: "1990-01-01",
            employmentType: "salaried",
            loanAmount: 100000,
            loanPurpose: "personal"
        };
        
        console.log('📤 Test Data:', testData);
        console.log('');
        
        const result = await service.processPreQualification(testData, 'debug_test_123');
        
        console.log('✅ Success!');
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.log('❌ Error occurred:');
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
    } finally {
        // Close database connection
        try {
            await databaseService.close();
            console.log('✅ Database service closed');
        } catch (closeError) {
            console.log('⚠️ Error closing database:', closeError.message);
        }
    }
}

debugPreQualification();
