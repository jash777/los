/**
 * Complete Loan Application Flow Test
 * Tests both Stage 1 (Pre-Qualification) and Stage 2 (Loan Application) in sequence
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Stage 1 test data
const stage1Data = {
    applicantName: "JASHUVA PEYYALA",
    phone: "9876543210",
    email: "jashuva.peyyala@gmail.com",
    panNumber: "EMMPP2177M",
    dateOfBirth: "1998-09-25",
    loanAmount: 500000,
    loanPurpose: "personal",
    employmentType: "salaried"
};

// Stage 2 test data
const stage2Data = {
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
        account_number: "12345678901234",
        mobile_number: "9876543210",
        ifsc_code: "HDFC0000123",
        bank_name: "HDFC Bank"
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

async function testStage1() {
    console.log('🚀 STAGE 1: Pre-Qualification');
    console.log('📋 Test Data:', {
        name: stage1Data.applicantName,
        pan: stage1Data.panNumber,
        loan_amount: stage1Data.loanAmount
    });
    
    try {
        console.log('\n📤 Sending pre-qualification request...');
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, stage1Data, {
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        const responseData = response.data;
        const applicationData = responseData.data;
        
        console.log('✅ Stage 1 Response:');
        console.log('  Success:', responseData.success);
        console.log('  Application Number:', applicationData?.applicationNumber);
        console.log('  Status:', applicationData?.status);
        console.log('  CIBIL Score:', applicationData?.cibil_score);
        console.log('  Decision Score:', applicationData?.decision_score);
        console.log('  Processing Time:', applicationData?.processing_time_ms + 'ms');
        
        if (applicationData?.status === 'approved') {
            console.log('🎉 Stage 1 PASSED - Application Approved!');
            return {
                success: true,
                applicationNumber: applicationData.applicationNumber,
                status: applicationData.status,
                cibilScore: applicationData.cibil_score
            };
        } else {
            console.log('⚠️  Stage 1 FAILED - Application not approved');
            console.log('  Status:', applicationData?.status);
            console.log('  Message:', applicationData?.message);
            return {
                success: false,
                status: applicationData?.status,
                message: applicationData?.message
            };
        }
        
    } catch (error) {
        console.error('❌ Stage 1 FAILED');
        if (error.response) {
            console.error('  API Error:', error.response.status, error.response.data);
        } else {
            console.error('  Error:', error.message);
        }
        return { success: false, error: error.message };
    }
}

async function testStage2(applicationNumber) {
    console.log('\n🚀 STAGE 2: Loan Application');
    console.log('📋 Application Number:', applicationNumber);
    
    if (!applicationNumber) {
        console.log('❌ No application number. Cannot proceed to Stage 2.');
        return { success: false, error: 'No application number' };
    }
    
    try {
        console.log('\n📤 Sending loan application request...');
        const response = await axios.post(
            `${API_BASE_URL}/loan-application/${applicationNumber}`, 
            stage2Data,
            {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        const responseData = response.data;
        
        console.log('✅ Stage 2 Response:');
        console.log('  Success:', responseData.success);
        console.log('  Application Number:', responseData.applicationNumber);
        console.log('  Status:', responseData.status);
        console.log('  Application Score:', responseData.application_score?.overall_score);
        console.log('  Decision:', responseData.decision);
        console.log('  Processing Time:', responseData.processing_time_ms + 'ms');
        
        if (responseData.decision === 'approved' || responseData.decision === 'conditional_approval') {
            console.log('🎉 Stage 2 PASSED - Loan Application Approved!');
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
            console.log('⚠️  Stage 2 FAILED - Application not approved');
            console.log('  Decision:', responseData.decision);
            console.log('  Message:', responseData.message);
            return {
                success: false,
                decision: responseData.decision,
                message: responseData.message
            };
        }
        
    } catch (error) {
        console.error('❌ Stage 2 FAILED');
        if (error.response) {
            console.error('  API Error:', error.response.status, error.response.data);
        } else {
            console.error('  Error:', error.message);
        }
        return { success: false, error: error.message };
    }
}

async function runCompleteTest() {
    console.log('🚀 COMPLETE LOAN APPLICATION FLOW TEST');
    console.log('='.repeat(60));
    console.log('Testing both Stage 1 (Pre-Qualification) and Stage 2 (Loan Application)');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    // Stage 1: Pre-Qualification
    console.log('\n' + '='.repeat(60));
    console.log('STAGE 1: PRE-QUALIFICATION');
    console.log('='.repeat(60));
    
    const stage1Result = await testStage1();
    
    if (!stage1Result.success) {
        console.log('\n❌ Stage 1 failed. Cannot proceed to Stage 2.');
        console.log('='.repeat(60));
        console.log('FINAL RESULT: FAILED (Stage 1 failed)');
        console.log('='.repeat(60));
        return { success: false, stage1: stage1Result };
    }
    
    // Stage 2: Loan Application
    console.log('\n' + '='.repeat(60));
    console.log('STAGE 2: LOAN APPLICATION');
    console.log('='.repeat(60));
    
    const stage2Result = await testStage2(stage1Result.applicationNumber);
    
    // Final Summary
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Stage 1 (Pre-Qualification):', stage1Result.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Stage 2 (Loan Application):', stage2Result.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Total Processing Time:', totalTime + 'ms');
    
    if (stage1Result.success && stage2Result.success) {
        console.log('\n🎉 COMPLETE TEST PASSED - Both stages successful!');
        console.log('📊 Summary:');
        console.log('  Application Number:', stage1Result.applicationNumber);
        console.log('  CIBIL Score:', stage1Result.cibilScore);
        console.log('  Final Decision:', stage2Result.decision);
        console.log('  Application Score:', stage2Result.applicationScore);
        console.log('  Total Time:', totalTime + 'ms');
    } else {
        console.log('\n⚠️  TEST PARTIAL - Some stages failed');
        if (!stage1Result.success) {
            console.log('  Stage 1 Issue:', stage1Result.message || stage1Result.error);
        }
        if (!stage2Result.success) {
            console.log('  Stage 2 Issue:', stage2Result.message || stage2Result.error);
        }
    }
    
    console.log('='.repeat(60));
    
    return {
        success: stage1Result.success && stage2Result.success,
        stage1: stage1Result,
        stage2: stage2Result,
        totalTime
    };
}

// Run the complete test
runCompleteTest().then(result => {
    console.log('\n📈 Final Result:', result.success ? 'PASSED' : 'FAILED');
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
