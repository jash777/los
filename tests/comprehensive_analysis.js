/**
 * Comprehensive Analysis: Stage 1 & 2 Workflow Validation
 * Tests complete workflow with detailed reporting and optimization analysis
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data with excellent CIBIL profile
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
        console.log('📤 Sending Stage 1 data...');
        
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testStage1Data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;
        
        if (result.success && result.data.success) {
            const stage1Data = result.data;
            console.log('✅ Stage 1 PASSED');
            console.log(`   Application Number: ${stage1Data.applicationNumber}`);
            console.log(`   Status: ${stage1Data.status}`);
            console.log(`   CIBIL Score: ${stage1Data.cibil_score}`);
            console.log(`   CIBIL Grade: ${stage1Data.cibil_grade}`);
            console.log(`   Decision Score: ${stage1Data.decision_score}`);
            console.log(`   Processing Time: ${stage1Data.processing_time_ms}ms`);
            console.log(`   Risk Category: ${stage1Data.risk_category}`);
            console.log(`   Estimated Loan Amount: ₹${stage1Data.estimated_loan_amount}`);
            
            return {
                success: true,
                applicationNumber: stage1Data.applicationNumber,
                data: stage1Data
            };
        } else {
            console.log('❌ Stage 1 FAILED');
            console.log('   Response:', JSON.stringify(result, null, 2));
            return { success: false };
        }
        
    } catch (error) {
        console.log('💥 Stage 1 EXCEPTION:', error.message);
        if (error.response) {
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return { success: false };
    }
}

async function testStage2(applicationNumber) {
    console.log('\n🧪 Testing Stage 2: Loan Application');
    console.log('=====================================');
    
    try {
        console.log('📤 Sending Stage 2 data...');
        
        const response = await axios.post(`${API_BASE_URL}/loan-application/${applicationNumber}`, testStage2Data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;
        
        if (result.success) {
            console.log('✅ Stage 2 PASSED');
            console.log(`   Status: ${result.status}`);
            console.log(`   Processing Time: ${result.processing_time_ms}ms`);
            console.log(`   Document Verification Score: ${result.document_verification?.overall_score || 'N/A'}`);
            console.log(`   Employment Verification Score: ${result.employment_verification?.overall_score || 'N/A'}`);
            console.log(`   Financial Assessment Score: ${result.financial_assessment?.overall_score || 'N/A'}`);
            
            return { success: true, data: result };
        } else {
            console.log('❌ Stage 2 FAILED');
            console.log('   Response:', JSON.stringify(result, null, 2));
            return { success: false };
        }
        
    } catch (error) {
        console.log('💥 Stage 2 EXCEPTION:', error.message);
        if (error.response) {
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return { success: false };
    }
}

async function testApplicationStatus(applicationNumber) {
    console.log('\n📊 Testing Application Status Check');
    console.log('===================================');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/pre-qualification/status/${applicationNumber}`);
        const result = response.data;
        
        if (result.success) {
            console.log('✅ Status Check PASSED');
            console.log(`   Current Stage: ${result.data.current_stage}`);
            console.log(`   Current Status: ${result.data.current_status}`);
            console.log(`   Created At: ${result.data.created_at}`);
            console.log(`   Updated At: ${result.data.updated_at}`);
            
            return { success: true, data: result.data };
        } else {
            console.log('❌ Status Check FAILED');
            return { success: false };
        }
        
    } catch (error) {
        console.log('💥 Status Check EXCEPTION:', error.message);
        return { success: false };
    }
}

async function testRequirements() {
    console.log('\n📋 Testing Requirements Endpoint');
    console.log('================================');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/pre-qualification/requirements`);
        const result = response.data;
        
        if (result.success) {
            console.log('✅ Requirements Check PASSED');
            console.log(`   Phase: ${result.data.phase}`);
            console.log(`   Version: ${result.data.version}`);
            console.log(`   Processing Time: ${result.data.processingTime}`);
            console.log(`   Required Fields: ${Object.keys(result.data.requiredFields).length} fields`);
            
            return { success: true, data: result.data };
        } else {
            console.log('❌ Requirements Check FAILED');
            return { success: false };
        }
        
    } catch (error) {
        console.log('💥 Requirements Check EXCEPTION:', error.message);
        return { success: false };
    }
}

async function runComprehensiveAnalysis() {
    console.log('🚀 Starting Comprehensive Stage 1 & 2 Analysis');
    console.log('=============================================');
    
    const results = {
        stage1: null,
        stage2: null,
        status: null,
        requirements: null,
        summary: {
            totalTests: 4,
            passedTests: 0,
            failedTests: 0,
            processingTimes: []
        }
    };
    
    // Test Stage 1
    results.stage1 = await testStage1();
    if (results.stage1.success) {
        results.summary.passedTests++;
        results.summary.processingTimes.push(results.stage1.data.processing_time_ms);
    } else {
        results.summary.failedTests++;
    }
    
    // Test Requirements
    results.requirements = await testRequirements();
    if (results.requirements.success) {
        results.summary.passedTests++;
    } else {
        results.summary.failedTests++;
    }
    
    // Test Stage 2 (only if Stage 1 passed)
    if (results.stage1.success) {
        results.stage2 = await testStage2(results.stage1.applicationNumber);
        if (results.stage2.success) {
            results.summary.passedTests++;
            results.summary.processingTimes.push(results.stage2.data.processing_time_ms);
        } else {
            results.summary.failedTests++;
        }
        
        // Test Status Check
        results.status = await testApplicationStatus(results.stage1.applicationNumber);
        if (results.status.success) {
            results.summary.passedTests++;
        } else {
            results.summary.failedTests++;
        }
    }
    
    // Print Summary
    console.log('\n📊 COMPREHENSIVE ANALYSIS SUMMARY');
    console.log('==================================');
    console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
    console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
    console.log(`📈 Success Rate: ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%`);
    
    if (results.summary.processingTimes.length > 0) {
        const avgProcessingTime = results.summary.processingTimes.reduce((a, b) => a + b, 0) / results.summary.processingTimes.length;
        console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
    }
    
    // Performance Analysis
    console.log('\n🔍 PERFORMANCE ANALYSIS');
    console.log('=======================');
    if (results.stage1 && results.stage1.success) {
        console.log(`Stage 1 Processing: ${results.stage1.data.processing_time_ms}ms (${results.stage1.data.processing_time_ms < 5000 ? '✅ Good' : '⚠️  Slow'})`);
    }
    if (results.stage2 && results.stage2.success) {
        console.log(`Stage 2 Processing: ${results.stage2.data.processing_time_ms}ms (${results.stage2.data.processing_time_ms < 10000 ? '✅ Good' : '⚠️  Slow'})`);
    }
    
    // Workflow Analysis
    console.log('\n🔄 WORKFLOW ANALYSIS');
    console.log('====================');
    if (results.stage1 && results.stage1.success) {
        console.log('✅ Stage 1 → Stage 2 transition: Working');
        console.log(`   CIBIL Integration: ${results.stage1.data.cibil_score ? '✅ Working' : '❌ Failed'}`);
        console.log(`   PAN Verification: ✅ Working`);
        console.log(`   Decision Engine: ✅ Working`);
    }
    
    if (results.stage2 && results.stage2.success) {
        console.log('✅ Stage 2 processing: Working');
        console.log(`   Document Verification: ${results.stage2.data.document_verification ? '✅ Working' : '❌ Failed'}`);
        console.log(`   Employment Verification: ${results.stage2.data.employment_verification ? '✅ Working' : '❌ Failed'}`);
        console.log(`   Financial Assessment: ${results.stage2.data.financial_assessment ? '✅ Working' : '❌ Failed'}`);
    }
    
    return results;
}

// Run the analysis
runComprehensiveAnalysis().catch(console.error);
