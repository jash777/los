/**
 * Stage 2: Loan Application Test
 * Tests the loan application endpoint with comprehensive data
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data for Stage 2 (comprehensive loan application)
const testStage2Data = {
    personal_details: {
        aadhaar_number: "123456789012",
        marital_status: "single",
        number_of_dependents: 0,
        education_level: "graduate"
    },
    employment_details: {
        employment_type: "salaried",
        company_name: "Tech Solutions Ltd",
        designation: "Software Engineer",
        monthly_gross_income: 75000,
        monthly_net_income: 65000,
        work_experience_years: 3,
        current_job_experience_years: 2,
        industry_type: "Information Technology",
        employment_status: "permanent",
        employee_name: "JASHUVA PEYYALA"
    },
    address_details: {
        current_address: {
            street_address: "123 Main Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            residence_type: "rented",
            years_at_address: 2
        },
        permanent_address: {
            street_address: "456 Home Street",
            city: "Pune",
            state: "Maharashtra",
            pincode: "411001"
        }
    },
    banking_details: {
        account_number: "1234567890",
        mobile_number: "9876543210",
        ifsc_code: "SBIN0001234",
        bank_name: "State Bank of India"
    },
    references: [
        {
            name: "Rahul Sharma",
            mobile: "9876543211",
            relationship: "friend",
            address: "789 Friend Street, Mumbai, Maharashtra - 400002",
            years_known: 5
        },
        {
            name: "Priya Patel",
            mobile: "9876543212",
            relationship: "colleague",
            address: "321 Colleague Avenue, Mumbai, Maharashtra - 400003",
            years_known: 3
        }
    ],
    required_documents: {
        identity_proof: "Aadhaar Card",
        address_proof: "Rental Agreement"
    },
    additional_information: {
        loan_purpose_details: "Personal loan for home renovation and furniture purchase",
        repayment_source: "Monthly salary from employment",
        preferred_tenure_months: 36,
        existing_relationship_with_bank: true,
        co_applicant_required: false,
        property_owned: false
    }
};

async function testStage2LoanApplication(applicationNumber) {
    console.log('🚀 Testing Stage 2: Loan Application');
    console.log('📋 Application Number:', applicationNumber);
    
    if (!applicationNumber) {
        console.log('❌ No application number provided. Please run Stage 1 first.');
        return { success: false, error: 'No application number' };
    }
    
    try {
        console.log('\n📤 Sending loan application request...');
        const response = await axios.post(
            `${API_BASE_URL}/loan-application/${applicationNumber}`, 
            testStage2Data,
            {
                timeout: 30000, // 30 seconds for Stage 2
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Request successful!');
        console.log('📊 Response Status:', response.status);
        
        // Extract key data from response
        const responseData = response.data;
        
        // Debug: Show full response structure
        console.log('\n🔍 Full Response Structure:');
        console.log(JSON.stringify(responseData, null, 2));
        
        console.log('\n📋 Response Summary:');
        console.log('  Success:', responseData.success);
        console.log('  Application Number:', responseData.applicationNumber);
        console.log('  Status:', responseData.status);
        console.log('  Application Score:', responseData.application_score?.overall_score);
        console.log('  Decision:', responseData.decision);
        console.log('  Processing Time:', responseData.processing_time_ms + 'ms');
        
        // Validate response structure
        const validation = validateStage2Response(responseData);
        
        console.log('\n🔍 Validation Results:');
        console.log('  Response Structure:', validation.structureValid ? '✅ Valid' : '❌ Invalid');
        console.log('  Application Number:', validation.hasApplicationNumber ? '✅ Present' : '❌ Missing');
        console.log('  Application Score:', validation.hasApplicationScore ? '✅ Present' : '❌ Missing');
        console.log('  Decision:', validation.hasDecision ? '✅ Present' : '❌ Missing');
        
        // Check if application was approved (including conditional approval)
        if (responseData.decision === 'approved' || responseData.decision === 'conditional_approval') {
            console.log('\n🎉 Stage 2 PASSED - Loan Application Approved!');
            console.log('  Decision Type:', responseData.decision);
            console.log('  Next Steps:', responseData.next_steps?.description);
            return {
                success: true,
                applicationNumber: responseData.applicationNumber,
                status: responseData.status,
                decision: responseData.decision,
                applicationScore: responseData.application_score?.overall_score
            };
        } else {
            console.log('\n⚠️  Stage 2 FAILED - Application not approved');
            console.log('  Decision:', responseData.decision);
            console.log('  Message:', responseData.message);
            return {
                success: false,
                decision: responseData.decision,
                message: responseData.message
            };
        }
        
    } catch (error) {
        console.error('\n❌ Stage 2 FAILED');
        
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

function validateStage2Response(responseData) {
    return {
        structureValid: responseData.success !== undefined,
        hasApplicationNumber: !!responseData.applicationNumber,
        hasApplicationScore: responseData.application_score?.overall_score !== undefined,
        hasDecision: !!responseData.decision
    };
}

// Function to run both stages in sequence
async function runCompleteTest() {
    console.log('🚀 Running Complete Loan Application Test (Stage 1 + Stage 2)');
    
    // First run Stage 1
    console.log('\n' + '='.repeat(60));
    console.log('STAGE 1: PRE-QUALIFICATION');
    console.log('='.repeat(60));
    
    const stage1Result = await require('./test_stage1_pre_qualification').testStage1PreQualification();
    
    if (!stage1Result.success) {
        console.log('\n❌ Stage 1 failed. Cannot proceed to Stage 2.');
        return { success: false, stage1: stage1Result };
    }
    
    // Then run Stage 2
    console.log('\n' + '='.repeat(60));
    console.log('STAGE 2: LOAN APPLICATION');
    console.log('='.repeat(60));
    
    const stage2Result = await testStage2LoanApplication(stage1Result.applicationNumber);
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Stage 1:', stage1Result.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Stage 2:', stage2Result.success ? '✅ PASSED' : '❌ FAILED');
    
    if (stage1Result.success && stage2Result.success) {
        console.log('\n🎉 COMPLETE TEST PASSED - Both stages successful!');
    } else {
        console.log('\n⚠️  TEST PARTIAL - Some stages failed');
    }
    
    return {
        success: stage1Result.success && stage2Result.success,
        stage1: stage1Result,
        stage2: stage2Result
    };
}

// Export functions for individual testing
module.exports = {
    testStage2LoanApplication,
    runCompleteTest
};

// Run the test if called directly
if (require.main === module) {
    // Check if application number is provided as command line argument
    const applicationNumber = process.argv[2];
    
    if (applicationNumber) {
        testStage2LoanApplication(applicationNumber).then(result => {
            console.log('\n📈 Test Result:', result);
            process.exit(result.success ? 0 : 1);
        });
    } else {
        console.log('Usage: node test_stage2_loan_application.js <application_number>');
        console.log('Or run the complete test with: node test_complete_flow.js');
        process.exit(1);
    }
}
