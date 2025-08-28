const PreQualificationService = require('../src/services/pre-qualification');

async function testPreQualificationCIBIL() {
    console.log('🧪 Testing Pre-Qualification CIBIL Service');
    console.log('==========================================');
    
    const preQualificationService = new PreQualificationService();
    
    const applicationData = {
        panNumber: 'EMMPP2177M',
        applicantName: 'JASHUVA PEYYALA',
        dateOfBirth: '1998-09-25',
        phone: '9876543210',
        loanAmount: 500000
    };
    
    const requestId = 'TEST_' + Date.now();
    
    try {
        console.log('📤 Calling pre-qualification CIBIL service...');
        const result = await preQualificationService.performCIBILCheck(applicationData, requestId);
        
        console.log('✅ Pre-Qualification CIBIL Response:');
        console.log('  Success:', result.success);
        console.log('  Score:', result.score);
        console.log('  Grade:', result.grade);
        console.log('  Data Keys:', Object.keys(result.data || {}));
        
        if (result.data && result.data.data) {
            console.log('  Full Data Structure:');
            console.log('    Report ID:', result.data.data.report_id);
            console.log('    Consumer Info:', result.data.data.consumer_info?.name);
            console.log('    Score Info:', result.data.data.score_info?.cibil_score);
        }
        
    } catch (error) {
        console.error('❌ Pre-Qualification CIBIL Test Failed:', error.message);
    }
}

testPreQualificationCIBIL();
