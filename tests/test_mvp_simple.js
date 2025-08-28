/**
 * MVP Simple Test - Loan Origination System
 * Tests core functionality with simplified validation
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Simple test data for MVP
const testStage1Data = {
    applicantName: "JASHUVA PEYYALA",
    phone: "9876543210",
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
        company_name: "Tech Solutions Ltd",
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
            pincode: "411001",
            same_as_current: false
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
            name: "Rahul Sharma",
            relationship: "friend",
            mobile: "9876543211",
            email: "rahul.sharma@gmail.com"
        },
        personal_reference_2: {
            name: "Priya Patel",
            relationship: "colleague",
            mobile: "9876543212",
            email: "priya.patel@gmail.com"
        }
    }
};

async function testStage1() {
    console.log('\n=== Testing Stage 1: Pre-Qualification (MVP) ===');
    
    try {
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testStage1Data);
        
        console.log('✅ Stage 1 Response:', {
            success: response.data.success,
            application_number: response.data.data?.applicationNumber,
            status: response.data.data?.status,
            decision: response.data.data?.decision_score,
            cibil_score: response.data.data?.cibil_score
        });
        
        return response.data.data?.applicationNumber;
    } catch (error) {
        console.error('❌ Stage 1 Error:', error.response?.data || error.message);
        return null;
    }
}

async function testStage2(applicationNumber) {
    console.log('\n=== Testing Stage 2: Loan Application (MVP) ===');
    
    if (!applicationNumber) {
        console.log('❌ Skipping Stage 2 - no application number from Stage 1');
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/loan-application/${applicationNumber}`, testStage2Data);
        
        console.log('✅ Stage 2 Response:', {
            success: response.data.success,
            application_number: response.data.application_number,
            status: response.data.status,
            application_score: response.data.application_score?.overall_score,
            final_decision: response.data.decision?.final_decision
        });
        
        return response.data;
    } catch (error) {
        console.error('❌ Stage 2 Error:', error.response?.data || error.message);
        return null;
    }
}

async function checkApplicationData(applicationNumber) {
    console.log('\n=== Checking Application Data (MVP) ===');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/applications/${applicationNumber}`);
        
        console.log('✅ Application Data Retrieved:', {
            application_number: response.data.application_number,
            current_stage: response.data.current_stage,
            current_status: response.data.current_status,
            stage_1_data: response.data.stage_1_data ? 'Present' : 'Missing',
            stage_2_data: response.data.stage_2_data ? 'Present' : 'Missing'
        });
        
        // Check if user data was saved
        const stage1Data = response.data.stage_1_data;
        if (stage1Data?.personal_details?.full_name) {
            console.log('✅ User data saved correctly in Stage 1');
        } else {
            console.log('❌ User data not saved in Stage 1');
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Application Data Error:', error.response?.data || error.message);
        return null;
    }
}

async function runMVPTest() {
    console.log('🚀 Starting MVP Simple Test...');
    console.log('📋 Test Data:', {
        name: testStage1Data.applicantName,
        pan: testStage1Data.panNumber,
        loan_amount: testStage1Data.loanAmount
    });
    
    // Test Stage 1
    const applicationNumber = await testStage1();
    
    // Test Stage 2
    const stage2Result = await testStage2(applicationNumber);
    
    // Check application data
    const appData = await checkApplicationData(applicationNumber);
    
    // Summary
    console.log('\n=== MVP Test Summary ===');
    console.log(`Stage 1: ${applicationNumber ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Stage 2: ${stage2Result ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Data Persistence: ${appData?.stage_1_data?.personal_details?.full_name ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (applicationNumber && stage2Result && appData?.stage_1_data?.personal_details?.full_name) {
        console.log('\n🎉 MVP Test PASSED - System is working correctly!');
    } else {
        console.log('\n⚠️  MVP Test has issues - check logs above');
    }
}

// Run the test
runMVPTest().catch(console.error);
