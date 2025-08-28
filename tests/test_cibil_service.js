const ExternalServicesClient = require('../src/services/external-services');

async function testCIBILService() {
    console.log('🧪 Testing CIBIL External Service');
    console.log('=====================================');
    
    const externalServices = new ExternalServicesClient();
    
    try {
        console.log('📤 Calling CIBIL service with PAN: EMMPP2177M');
        const result = await externalServices.getCreditScore(
            'EMMPP2177M',
            'JASHUVA PEYYALA',
            '1998-09-25',
            '9876543210'
        );
        
        console.log('✅ CIBIL Service Response:');
        console.log('  Success:', result.success);
        console.log('  Credit Score:', result.credit_score);
        console.log('  Credit Grade:', result.credit_grade);
        console.log('  Data Keys:', Object.keys(result.data || {}));
        
        if (result.data && result.data.data) {
            console.log('  Full Data Structure:');
            console.log('    Report ID:', result.data.data.report_id);
            console.log('    Consumer Info:', result.data.data.consumer_info?.name);
            console.log('    Score Info:', result.data.data.score_info?.cibil_score);
        }
        
    } catch (error) {
        console.error('❌ CIBIL Service Test Failed:', error.message);
    }
}

testCIBILService();
