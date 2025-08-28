/**
 * Stage 1: Pre-Qualification Test
 * Tests the pre-qualification endpoint with proper request/response structure
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data matching the API requirements
const testData = {
    applicantName: "JASHUVA PEYYALA",
    phone: "9876543210",
    email: "jashuva.peyyala@gmail.com",
    panNumber: "EMMPP2177A",
    dateOfBirth: "1998-09-25",
    loanAmount: 500000,
    loanPurpose: "personal",
    employmentType: "salaried"
};

async function testStage1PreQualification() {
    console.log('🚀 Testing Stage 1: Pre-Qualification');
    console.log('📋 Test Data:', {
        name: testData.applicantName,
        pan: testData.panNumber,
        loan_amount: testData.loanAmount
    });
    
    try {
        console.log('\n📤 Sending pre-qualification request...');
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testData, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Request successful!');
        console.log('📊 Response Status:', response.status);
        
        // Extract key data from response
        const responseData = response.data;
        const applicationData = responseData.data;
        
        console.log('\n📋 Response Summary:');
        console.log('  Success:', responseData.success);
        console.log('  Application Number:', applicationData?.applicationNumber);
        console.log('  Status:', applicationData?.status);
        console.log('  CIBIL Score:', applicationData?.cibil_score);
        console.log('  CIBIL Grade:', applicationData?.cibil_grade);
        console.log('  Decision Score:', applicationData?.decision_score);
        console.log('  Risk Category:', applicationData?.risk_category);
        console.log('  Processing Time:', applicationData?.processing_time_ms + 'ms');
        
        // Validate response structure
        const validation = validateStage1Response(responseData);
        
        console.log('\n🔍 Validation Results:');
        console.log('  Response Structure:', validation.structureValid ? '✅ Valid' : '❌ Invalid');
        console.log('  Application Number:', validation.hasApplicationNumber ? '✅ Present' : '❌ Missing');
        console.log('  CIBIL Score:', validation.hasCibilScore ? '✅ Present' : '❌ Missing');
        console.log('  Status:', validation.hasStatus ? '✅ Present' : '❌ Missing');
        
        // Check if application was approved
        if (applicationData?.status === 'approved') {
            console.log('\n🎉 Stage 1 PASSED - Application Approved!');
            console.log('  Next Steps:', applicationData?.next_steps?.description);
            return {
                success: true,
                applicationNumber: applicationData.applicationNumber,
                status: applicationData.status,
                cibilScore: applicationData.cibil_score
            };
        } else {
            console.log('\n⚠️  Stage 1 PARTIAL - Application not approved');
            console.log('  Status:', applicationData?.status);
            console.log('  Message:', applicationData?.message);
            return {
                success: false,
                status: applicationData?.status,
                message: applicationData?.message
            };
        }
        
    } catch (error) {
        console.error('\n❌ Stage 1 FAILED');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('  Server not running. Please start with: npm start');
        } else if (error.response) {
            console.error('  API Error:', error.response.status);
            console.error('  Error Details:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            console.error('  Request timeout - server may be slow');
        } else {
            console.error('  Error:', error.message);
        }
        
        return { success: false, error: error.message };
    }
}

function validateStage1Response(responseData) {
    const applicationData = responseData.data;
    
    return {
        structureValid: responseData.success !== undefined && applicationData !== undefined,
        hasApplicationNumber: !!applicationData?.applicationNumber,
        hasCibilScore: applicationData?.cibil_score !== undefined,
        hasStatus: !!applicationData?.status,
        hasDecisionScore: applicationData?.decision_score !== undefined
    };
}

// Run the test
testStage1PreQualification().then(result => {
    console.log('\n📈 Test Result:', result);
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
