/**
 * Comprehensive Test for Stage 1 & 2 Fixes
 * Tests data persistence, CIBIL integration, and stage transitions
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data with good CIBIL score (796 from the attached file)
const testStage1Data = {
    applicantName: "JASHUVA PEYYALA",
    phone: "9876543210", // This matches the CIBIL data
    email: "jashuva.peyyala@gmail.com",
    panNumber: "EMMPP2177A",
    dateOfBirth: "1998-09-25",
    loanAmount: 500000,
    loanPurpose: "personal",
    employmentType: "salaried"
};

const testStage2Data = {
    personal_details: {
        aadhaar_number: "123456789012",
        marital_status: "single",
        number_of_dependents: 0,
        education_level: "graduate"
    },
    employment_details: {
        employment_type: "salaried",
        company_name: "Tech Solutions Pvt Ltd",
        designation: "Software Engineer",
        monthly_gross_income: 75000,
        monthly_net_income: 65000,
        work_experience_years: 3,
        current_job_experience_years: 2,
        industry_type: "Information Technology",
        employment_status: "permanent"
    },
    address_details: {
        current_address: {
            street_address: "A 120 MUNNA APARTMENT",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110034",
            residence_type: "rented",
            years_at_address: 2
        },
        permanent_address: {
            street_address: "A 120 MUNNA APARTMENT",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110034",
            same_as_current: true
        }
    },
    banking_details: {
        account_number: "1234567890",
        ifsc_code: "SBIN0001234",
        bank_name: "State Bank of India",
        account_type: "savings",
        average_monthly_balance: 50000,
        banking_relationship_years: 3
    },
    references: {
        personal_reference_1: {
            name: "Rahul Kumar",
            relationship: "friend",
            mobile: "9876543211",
            email: "rahul.kumar@email.com"
        },
        personal_reference_2: {
            name: "Priya Sharma",
            relationship: "colleague",
            mobile: "9876543212",
            email: "priya.sharma@email.com"
        }
    }
};

async function testStage1() {
    console.log('\n🧪 Testing Stage 1: Pre-Qualification');
    console.log('=====================================');
    
    try {
        console.log('📤 Sending Stage 1 data:', JSON.stringify(testStage1Data, null, 2));
        
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testStage1Data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;
        console.log('📥 Stage 1 Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ Stage 1 PASSED');
            console.log(`   Application Number: ${result.applicationNumber}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   CIBIL Score: ${result.cibil_score}`);
            console.log(`   CIBIL Grade: ${result.cibil_grade}`);
            return result.applicationNumber;
        } else {
            console.log('❌ Stage 1 FAILED');
            console.log(`   Error: ${result.error || result.message}`);
            return null;
        }
    } catch (error) {
        console.log('💥 Stage 1 EXCEPTION:', error.message);
        if (error.response) {
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function testStage2(applicationNumber) {
    console.log('\n🧪 Testing Stage 2: Loan Application');
    console.log('=====================================');
    
    if (!applicationNumber) {
        console.log('❌ Cannot test Stage 2 - no application number from Stage 1');
        return false;
    }

    try {
        console.log('📤 Sending Stage 2 data for application:', applicationNumber);
        
        const response = await axios.post(`${API_BASE_URL}/loan-application/${applicationNumber}`, testStage2Data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;
        console.log('📥 Stage 2 Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ Stage 2 PASSED');
            console.log(`   Status: ${result.status}`);
            console.log(`   Decision: ${result.decision?.final_decision || result.status}`);
            console.log(`   Application Score: ${result.application_score?.overall_score || 'N/A'}`);
            return true;
        } else {
            console.log('❌ Stage 2 FAILED');
            console.log(`   Error: ${result.error || result.message}`);
            return false;
        }
    } catch (error) {
        console.log('💥 Stage 2 EXCEPTION:', error.message);
        if (error.response) {
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function verifyApplicationData(applicationNumber) {
    console.log('\n🔍 Verifying Application Data Persistence');
    console.log('========================================');
    
    if (!applicationNumber) {
        console.log('❌ Cannot verify - no application number');
        return false;
    }

    try {
        // Check if application data file exists and has proper data
        const fs = require('fs');
        const path = require('path');
        
        const appDataPath = path.join(__dirname, 'applications', applicationNumber, 'application-data.json');
        
        if (!fs.existsSync(appDataPath)) {
            console.log('❌ Application data file not found');
            return false;
        }

        const appData = JSON.parse(fs.readFileSync(appDataPath, 'utf8'));
        console.log('📄 Application Data Structure:');
        console.log(JSON.stringify(appData, null, 2));

        // Verify Stage 1 data is saved
        const stage1Data = appData.stage_1_data;
        if (!stage1Data) {
            console.log('❌ Stage 1 data not found in application file');
            return false;
        }

        // Check if personal details are saved
        if (!stage1Data.personal_details?.full_name) {
            console.log('❌ Personal details not properly saved');
            return false;
        }

        console.log('✅ Stage 1 data properly saved:');
        console.log(`   Name: ${stage1Data.personal_details.full_name}`);
        console.log(`   Mobile: ${stage1Data.personal_details.mobile}`);
        console.log(`   PAN: ${stage1Data.personal_details.pan_number}`);

        // Check if Stage 2 data is saved (if Stage 2 was completed)
        const stage2Data = appData.stage_2_data;
        if (stage2Data && stage2Data.personal_details?.aadhaar_number) {
            console.log('✅ Stage 2 data properly saved:');
            console.log(`   Aadhaar: ${stage2Data.personal_details.aadhaar_number}`);
            console.log(`   Employment: ${stage2Data.employment_details?.employment_type}`);
        }

        return true;
    } catch (error) {
        console.log('💥 Verification EXCEPTION:', error.message);
        return false;
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Stage 1 & 2 Test');
    console.log('==========================================');
    
    // Test Stage 1
    const applicationNumber = await testStage1();
    
    if (applicationNumber) {
        // Test Stage 2
        const stage2Success = await testStage2(applicationNumber);
        
        // Verify data persistence
        const dataVerified = await verifyApplicationData(applicationNumber);
        
        // Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        console.log(`Stage 1: ${applicationNumber ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Stage 2: ${stage2Success ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Data Persistence: ${dataVerified ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (applicationNumber && stage2Success && dataVerified) {
            console.log('\n🎉 ALL TESTS PASSED! The fixes are working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the issues above.');
        }
    } else {
        console.log('\n❌ Stage 1 failed - cannot proceed with other tests');
    }
}

// Run the test
runComprehensiveTest().catch(console.error);
