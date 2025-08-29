/**
 * Complete Loan Application Flow Test
 * Tests the entire loan process from intake to final decision using real CIBIL data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

// Load CIBIL verification data
const cibilData = JSON.parse(fs.readFileSync(path.join(__dirname, '../third-party-simulator/data/cibil_verification.json'), 'utf8'));

console.log('🧪 Complete Loan Application Flow Test');
console.log('=====================================');
console.log(`📊 Using CIBIL Score: ${cibilData.data.score}`);
console.log(`👤 Applicant: ${cibilData.data.report.personalInfo.name}`);
console.log(`📱 Mobile: ${cibilData.data.report.personalInfo.mobile}`);
console.log(`🆔 PAN: ${cibilData.data.report.personalInfo.panNumber}`);
console.log('');

let applicationNumber = '';
let testResults = {
    stage1: { passed: false, response: null, error: null },
    stage2: { passed: false, response: null, error: null },
    stage3: { passed: false, response: null, error: null },
    stage4: { passed: false, response: null, error: null },
    stage5: { passed: false, response: null, error: null },
    stage6: { passed: false, response: null, error: null },
    stage7: { passed: false, response: null, error: null }
};

/**
 * Stage 1: Pre-Qualification
 */
async function testStage1PreQualification() {
    console.log('📋 Stage 1: Pre-Qualification');
    console.log('=============================');
    
    try {
        const stage1Data = {
            applicantName: cibilData.data.report.personalInfo.name,
            phone: cibilData.data.report.personalInfo.mobile,
            email: "jashuva.peyyala@example.com", // Derived from name
            panNumber: cibilData.data.report.personalInfo.panNumber,
            dateOfBirth: "1998-09-25", // From CIBIL data: 19980925
            employmentType: "salaried",
            loanAmount: 750000, // 7.5 Lakhs
            loanPurpose: "home_improvement"
        };

        console.log('📤 Sending pre-qualification request...');
        console.log('Request Data:', JSON.stringify(stage1Data, null, 2));

        const response = await axios.post(`${BASE_URL}/pre-qualification/process`, stage1Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage1_${Date.now()}`
            }
        });

        testResults.stage1.passed = true;
        testResults.stage1.response = response.data;
        applicationNumber = response.data.data.applicationNumber;

        console.log('✅ Stage 1 PASSED');
        console.log(`📄 Application Number: ${applicationNumber}`);
        console.log(`🎯 Decision: ${response.data.data.decision}`);
        console.log(`💰 Estimated Loan Amount: ₹${response.data.data.estimatedLoanAmount?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`📊 CIBIL Score: ${response.data.data.cibilScore || 'N/A'}`);
        console.log(`⭐ Risk Level: ${response.data.data.riskLevel || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage1.error = error.response?.data || error.message;
        console.log('❌ Stage 1 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 2: Loan Application Processing
 */
async function testStage2LoanApplication() {
    console.log('📋 Stage 2: Loan Application Processing');
    console.log('======================================');

    try {
        const stage2Data = {
            loan_request: {
                amount: 750000,
                purpose: "home_improvement",
                tenure_months: 84 // 7 years
            },
            employment_details: {
                type: "salaried",
                company_name: "Tech Solutions Pvt Ltd",
                designation: "Senior Software Engineer",
                work_experience_years: 5,
                monthly_income: 85000,
                employment_status: "permanent"
            },
            financial_details: {
                monthly_income: 85000,
                existing_loans: [
                    {
                        type: "credit_card",
                        outstanding_amount: 42314,
                        monthly_emi: 5000
                    },
                    {
                        type: "home_loan",
                        outstanding_amount: 234290,
                        monthly_emi: 15000
                    }
                ],
                bank_account: {
                    account_number: "1234567890",
                    bank_name: "HDFC Bank",
                    account_type: "savings",
                    average_balance: 50000
                }
            },
            documents: [
                {
                    type: "pan_card",
                    status: "verified",
                    document_id: "PAN_001"
                },
                {
                    type: "aadhar_card",
                    status: "verified", 
                    document_id: "AADHAR_001"
                },
                {
                    type: "salary_slips",
                    status: "uploaded",
                    document_id: "SALARY_001"
                },
                {
                    type: "bank_statements",
                    status: "uploaded",
                    document_id: "BANK_001"
                }
            ]
        };

        console.log('📤 Sending loan application request...');
        
        const response = await axios.post(`${BASE_URL}/loan-application/process/${applicationNumber}`, stage2Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage2_${Date.now()}`
            }
        });

        testResults.stage2.passed = true;
        testResults.stage2.response = response.data;

        console.log('✅ Stage 2 PASSED');
        console.log(`🎯 Decision: ${response.data.data.decision}`);
        console.log(`📊 Document Verification: ${response.data.data.documentVerification?.overall_status || 'N/A'}`);
        console.log(`💼 Employment Verification: ${response.data.data.employmentVerification?.verification_status || 'N/A'}`);
        console.log(`💰 Financial Assessment: ${response.data.data.financialAssessment?.debt_to_income_ratio || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage2.error = error.response?.data || error.message;
        console.log('❌ Stage 2 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 3: Application Processing (Document & Employment Verification)
 */
async function testStage3ApplicationProcessing() {
    console.log('📋 Stage 3: Application Processing');
    console.log('=================================');

    try {
        const stage3Data = {
            verification_requests: [
                {
                    type: "employment_verification",
                    company_name: "Tech Solutions Pvt Ltd",
                    designation: "Senior Software Engineer",
                    monthly_salary: 85000
                },
                {
                    type: "income_verification", 
                    declared_income: 85000,
                    bank_statements_months: 6
                },
                {
                    type: "address_verification",
                    current_address: {
                        address: "D-401, Sainik Vihar",
                        city: "New Delhi",
                        state: "Delhi",
                        pincode: "110034"
                    }
                }
            ]
        };

        console.log('📤 Sending application processing request...');

        const response = await axios.post(`${BASE_URL}/application-processing/process/${applicationNumber}`, stage3Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage3_${Date.now()}`
            }
        });

        testResults.stage3.passed = true;
        testResults.stage3.response = response.data;

        console.log('✅ Stage 3 PASSED');
        console.log(`🎯 Decision: ${response.data.data.decision}`);
        console.log(`📊 Overall Verification Score: ${response.data.data.overallVerificationScore || 'N/A'}`);
        console.log(`💼 Employment Status: ${response.data.data.employmentVerification?.status || 'N/A'}`);
        console.log(`🏠 Address Status: ${response.data.data.addressVerification?.status || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage3.error = error.response?.data || error.message;
        console.log('❌ Stage 3 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 4: Underwriting
 */
async function testStage4Underwriting() {
    console.log('📋 Stage 4: Underwriting');
    console.log('========================');

    try {
        const stage4Data = {
            risk_assessment: {
                credit_score: cibilData.data.score, // Use actual CIBIL score
                debt_to_income_ratio: 0.235, // (5000 + 15000) / 85000
                loan_to_value_ratio: 0.75,
                employment_stability: "stable",
                income_verification: "verified"
            },
            loan_parameters: {
                requested_amount: 750000,
                tenure_months: 84,
                property_value: 1000000
            },
            underwriter_notes: "High CIBIL score applicant with stable employment and good repayment history"
        };

        console.log('📤 Sending underwriting request...');

        const response = await axios.post(`${BASE_URL}/underwriting/process/${applicationNumber}`, stage4Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage4_${Date.now()}`
            }
        });

        testResults.stage4.passed = true;
        testResults.stage4.response = response.data;

        console.log('✅ Stage 4 PASSED');
        console.log(`🎯 Decision: ${response.data.data.decision}`);
        console.log(`📊 Risk Assessment: ${response.data.data.riskAssessment?.overall_risk || 'N/A'}`);
        console.log(`💰 Approved Amount: ₹${response.data.data.approvedAmount?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`📈 Interest Rate: ${response.data.data.interestRate || 'N/A'}%`);
        console.log(`⏰ Tenure: ${response.data.data.tenure || 'N/A'} months`);
        console.log('');

    } catch (error) {
        testResults.stage4.error = error.response?.data || error.message;
        console.log('❌ Stage 4 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 5: Credit Decision
 */
async function testStage5CreditDecision() {
    console.log('📋 Stage 5: Credit Decision');
    console.log('===========================');

    try {
        const stage5Data = {
            final_assessment: {
                credit_score: cibilData.data.score,
                risk_category: "low", // Based on excellent CIBIL score
                debt_service_ratio: 0.235,
                collateral_value: 1000000,
                loan_to_value: 0.75
            },
            decision_factors: [
                "Excellent credit history with score 796",
                "Stable employment with good income",
                "Low debt-to-income ratio",
                "Adequate collateral coverage"
            ],
            recommended_terms: {
                loan_amount: 750000,
                interest_rate: 8.5, // Lower rate due to excellent credit
                tenure_months: 84,
                processing_fee: 7500
            }
        };

        console.log('📤 Sending credit decision request...');

        const response = await axios.post(`${BASE_URL}/credit-decision/process/${applicationNumber}`, stage5Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage5_${Date.now()}`
            }
        });

        testResults.stage5.passed = true;
        testResults.stage5.response = response.data;

        console.log('✅ Stage 5 PASSED');
        console.log(`🎯 Final Decision: ${response.data.data.decision}`);
        console.log(`💰 Final Loan Amount: ₹${response.data.data.finalLoanAmount?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`📈 Final Interest Rate: ${response.data.data.finalInterestRate || 'N/A'}%`);
        console.log(`⏰ Final Tenure: ${response.data.data.finalTenure || 'N/A'} months`);
        console.log(`💳 Monthly EMI: ₹${response.data.data.monthlyEmi?.toLocaleString('en-IN') || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage5.error = error.response?.data || error.message;
        console.log('❌ Stage 5 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 6: Quality Check
 */
async function testStage6QualityCheck() {
    console.log('📋 Stage 6: Quality Check');
    console.log('=========================');

    try {
        const stage6Data = {
            quality_parameters: {
                documentation_completeness: 100,
                verification_accuracy: 98,
                compliance_score: 100,
                risk_assessment_quality: 95
            },
            audit_checklist: [
                {
                    item: "KYC Documentation",
                    status: "compliant",
                    score: 100
                },
                {
                    item: "Income Verification",
                    status: "compliant", 
                    score: 98
                },
                {
                    item: "Credit Assessment",
                    status: "compliant",
                    score: 95
                },
                {
                    item: "Regulatory Compliance",
                    status: "compliant",
                    score: 100
                }
            ],
            reviewer_comments: "All documentation is complete and compliant. Credit assessment is thorough and well-documented."
        };

        console.log('📤 Sending quality check request...');

        const response = await axios.post(`${BASE_URL}/quality-check/process/${applicationNumber}`, stage6Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage6_${Date.now()}`
            }
        });

        testResults.stage6.passed = true;
        testResults.stage6.response = response.data;

        console.log('✅ Stage 6 PASSED');
        console.log(`🎯 Quality Decision: ${response.data.data.decision}`);
        console.log(`📊 Overall Quality Score: ${response.data.data.overallQualityScore || 'N/A'}%`);
        console.log(`✅ Compliance Status: ${response.data.data.complianceStatus || 'N/A'}`);
        console.log(`📋 Audit Result: ${response.data.data.auditResult || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage6.error = error.response?.data || error.message;
        console.log('❌ Stage 6 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Stage 7: Loan Funding
 */
async function testStage7LoanFunding() {
    console.log('📋 Stage 7: Loan Funding');
    console.log('========================');

    try {
        const stage7Data = {
            funding_details: {
                loan_account_number: `LA${Date.now()}`,
                disbursement_amount: 750000,
                disbursement_method: "NEFT",
                beneficiary_account: {
                    account_number: "1234567890",
                    bank_name: "HDFC Bank",
                    ifsc_code: "HDFC0001234",
                    account_holder_name: cibilData.data.report.personalInfo.name
                }
            },
            loan_terms: {
                principal_amount: 750000,
                interest_rate: 8.5,
                tenure_months: 84,
                monthly_emi: 11547,
                first_emi_date: "2025-03-01"
            },
            disbursement_schedule: [
                {
                    tranche: 1,
                    amount: 750000,
                    purpose: "Property purchase/renovation",
                    expected_date: "2025-02-01"
                }
            ]
        };

        console.log('📤 Sending loan funding request...');

        const response = await axios.post(`${BASE_URL}/loan-funding/process/${applicationNumber}`, stage7Data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': `test_stage7_${Date.now()}`
            }
        });

        testResults.stage7.passed = true;
        testResults.stage7.response = response.data;

        console.log('✅ Stage 7 PASSED');
        console.log(`🎯 Funding Decision: ${response.data.data.decision}`);
        console.log(`💰 Disbursement Amount: ₹${response.data.data.disbursementAmount?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`🏦 Loan Account: ${response.data.data.loanAccountNumber || 'N/A'}`);
        console.log(`📅 Disbursement Date: ${response.data.data.disbursementDate || 'N/A'}`);
        console.log(`💳 Monthly EMI: ₹${response.data.data.monthlyEmi?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`📅 First EMI Date: ${response.data.data.firstEmiDate || 'N/A'}`);
        console.log('');

    } catch (error) {
        testResults.stage7.error = error.response?.data || error.message;
        console.log('❌ Stage 7 FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
        throw error;
    }
}

/**
 * Check Final Application Status
 */
async function checkFinalStatus() {
    console.log('📋 Final Application Status Check');
    console.log('=================================');

    try {
        const response = await axios.get(`${BASE_URL}/pre-qualification/status/${applicationNumber}`, {
            headers: {
                'X-Request-ID': `test_status_${Date.now()}`
            }
        });

        console.log('✅ Final Status Retrieved');
        console.log(`📄 Application Number: ${response.data.data.applicationNumber}`);
        console.log(`📊 Current Stage: ${response.data.data.currentStage}`);
        console.log(`🎯 Status: ${response.data.data.status}`);
        console.log(`⏰ Last Updated: ${response.data.data.lastUpdated}`);
        console.log(`📈 Progress: ${response.data.data.completionPercentage || 'N/A'}%`);
        console.log('');

    } catch (error) {
        console.log('❌ Status Check FAILED');
        console.log('Error:', error.response?.data || error.message);
        console.log('');
    }
}

/**
 * Generate Test Summary
 */
function generateTestSummary() {
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    
    const stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage7'];
    const stageNames = [
        'Pre-Qualification',
        'Loan Application',
        'Application Processing', 
        'Underwriting',
        'Credit Decision',
        'Quality Check',
        'Loan Funding'
    ];

    let passedCount = 0;
    let totalCount = stages.length;

    stages.forEach((stage, index) => {
        const result = testResults[stage];
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        const stageName = stageNames[index];
        
        console.log(`${index + 1}. ${stageName}: ${status}`);
        
        if (result.passed) {
            passedCount++;
        } else if (result.error) {
            console.log(`   Error: ${JSON.stringify(result.error)}`);
        }
    });

    console.log('');
    console.log(`📈 Overall Success Rate: ${passedCount}/${totalCount} (${((passedCount/totalCount) * 100).toFixed(1)}%)`);
    console.log(`📄 Application Number: ${applicationNumber}`);
    console.log(`👤 Applicant: ${cibilData.data.report.personalInfo.name}`);
    console.log(`📊 CIBIL Score: ${cibilData.data.score}`);
    console.log('');

    if (passedCount === totalCount) {
        console.log('🎉 COMPLETE LOAN FLOW SUCCESSFUL!');
        console.log('The applicant has successfully completed all stages of the loan process.');
    } else {
        console.log('⚠️ SOME STAGES FAILED');
        console.log('Please review the failed stages above for details.');
    }
}

/**
 * Main Test Execution
 */
async function runCompleteFlowTest() {
    try {
        await testStage1PreQualification();
        
        // Small delay between stages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage2LoanApplication();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage3ApplicationProcessing();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage4Underwriting();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage5CreditDecision();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage6QualityCheck();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testStage7LoanFunding();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await checkFinalStatus();
        
    } catch (error) {
        console.log('🛑 Test execution stopped due to error in stage');
    } finally {
        generateTestSummary();
    }
}

// Execute the complete flow test
runCompleteFlowTest();
