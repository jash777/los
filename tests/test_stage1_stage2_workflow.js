/**
 * Stage 1 and Stage 2 Workflow Validation
 * Tests the current automated workflow before implementing manual approval
 */

const axios = require('axios');
const databaseService = require('../src/database/service');

const API_BASE_URL = 'http://localhost:3000/api';

async function testStage1Stage2Workflow() {
    console.log('🧪 Testing Stage 1 and Stage 2 Automated Workflow');
    console.log('==================================================');
    
    const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        applications: []
    };

    try {
        // Test 1: Stage 1 - Pre-qualification
        console.log('\n📊 Test 1: Stage 1 - Pre-qualification');
        console.log('======================================');
        results.totalTests++;
        
        const stage1Data = {
            applicantName: "John Doe",
            phone: "9876543210",
            email: "john.doe@example.com",
            panNumber: "ABCDE1234F",
            dateOfBirth: "1990-05-15",
            employmentType: "salaried",
            loanAmount: 500000,
            loanPurpose: "home_improvement"
        };

        try {
            const stage1Response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, stage1Data);
            
            if (stage1Response.data.success) {
                const applicationNumber = stage1Response.data.applicationNumber || stage1Response.data.data?.applicationNumber;
                console.log('✅ Stage 1 completed successfully');
                console.log(`   Application Number: ${applicationNumber}`);
                console.log(`   Status: ${stage1Response.data.status}`);
                console.log(`   Decision: ${stage1Response.data.decision || 'approved'}`);
                console.log(`   CIBIL Score: ${stage1Response.data.cibil_score || 'N/A'}`);
                
                results.applications.push({
                    applicationNumber,
                    stage1Result: stage1Response.data,
                    stage1Data
                });
                
                results.passedTests++;
            } else {
                throw new Error(stage1Response.data.message || 'Stage 1 failed');
            }
        } catch (error) {
            console.log('❌ Stage 1 failed:', error.message);
            results.failedTests++;
        }

        // Test 2: Stage 2 - Loan Application (if Stage 1 passed)
        if (results.applications.length > 0) {
            console.log('\n📊 Test 2: Stage 2 - Loan Application');
            console.log('====================================');
            results.totalTests++;
            
            const applicationNumber = results.applications[0].applicationNumber;
            
            const stage2Data = {
                // Personal Information
                first_name: "John",
                last_name: "Doe",
                mobile: "9876543210",
                email: "john.doe@example.com",
                pan_number: "ABCDE1234F",
                aadhaar_number: "123456789012",
                date_of_birth: "1990-05-15",
                marital_status: "single",
                number_of_dependents: 0,
                
                // Address Information
                current_address: {
                    street_address: "123 Main Street",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001",
                    residence_type: "rented",
                    years_at_address: 3
                },
                
                // Employment Information
                employment_type: "salaried",
                company_name: "Tech Corp Pvt Ltd",
                designation: "Software Engineer",
                monthly_income: 75000,
                work_experience_months: 36,
                
                // Banking Details
                primary_account: {
                    account_number: "1234567890",
                    ifsc_code: "HDFC0001234",
                    bank_name: "HDFC Bank",
                    account_type: "savings",
                    account_holder_name: "John Doe"
                },
                
                // Loan Request
                loan_type: "personal",
                requested_amount: 500000,
                purpose: "home_improvement",
                tenure_months: 36,
                
                // References
                references: [
                    {
                        name: "Jane Smith",
                        mobile: "9876543211",
                        relationship: "friend",
                        address: "456 Oak Street, Mumbai"
                    },
                    {
                        name: "Bob Johnson",
                        mobile: "9876543212",
                        relationship: "colleague",
                        address: "789 Pine Street, Mumbai"
                    }
                ]
            };

            try {
                const stage2Response = await axios.post(`${API_BASE_URL}/loan-application/${applicationNumber}`, stage2Data);
                
                if (stage2Response.data.success) {
                    console.log('✅ Stage 2 completed successfully');
                    console.log(`   Application Number: ${applicationNumber}`);
                    console.log(`   Status: ${stage2Response.data.status}`);
                    console.log(`   Overall Score: ${stage2Response.data.overall_score || 'N/A'}`);
                    console.log(`   Decision: ${stage2Response.data.decision || 'processed'}`);
                    
                    results.applications[0].stage2Result = stage2Response.data;
                    results.applications[0].stage2Data = stage2Data;
                    
                    results.passedTests++;
                } else {
                    throw new Error(stage2Response.data.message || 'Stage 2 failed');
                }
            } catch (error) {
                console.log('❌ Stage 2 failed:', error.message);
                results.failedTests++;
            }
        }

        // Test 3: Application Status Check
        if (results.applications.length > 0) {
            console.log('\n📊 Test 3: Application Status Check');
            console.log('===================================');
            results.totalTests++;
            
            const applicationNumber = results.applications[0].applicationNumber;
            
            try {
                const statusResponse = await axios.get(`${API_BASE_URL}/pre-qualification/status/${applicationNumber}`);
                
                if (statusResponse.data.success) {
                    const status = statusResponse.data.data;
                    console.log('✅ Status check successful');
                    console.log(`   Application Number: ${applicationNumber}`);
                    console.log(`   Current Stage: ${status.current_stage}`);
                    console.log(`   Current Status: ${status.current_status}`);
                    console.log(`   Stage Processing Records: ${status.stage_processing?.length || 0}`);
                    console.log(`   Credit Decisions: ${status.credit_decisions?.length || 0}`);
                    
                    results.applications[0].statusCheck = status;
                    results.passedTests++;
                } else {
                    throw new Error(statusResponse.data.message || 'Status check failed');
                }
            } catch (error) {
                console.log('❌ Status check failed:', error.message);
                results.failedTests++;
            }
        }

        // Test 4: Database Verification
        console.log('\n📊 Test 4: Database Verification');
        console.log('================================');
        results.totalTests++;
        
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            if (results.applications.length > 0) {
                const applicationNumber = results.applications[0].applicationNumber;
                
                // Check loan_applications table
                const [loanApps] = await connection.execute(
                    'SELECT * FROM loan_applications WHERE application_number = ?', 
                    [applicationNumber]
                );
                
                // Check stage_processing table
                const [stageProcessing] = await connection.execute(
                    'SELECT * FROM stage_processing WHERE application_number = ? ORDER BY started_at DESC', 
                    [applicationNumber]
                );
                
                // Check credit_decisions table
                const [creditDecisions] = await connection.execute(
                    'SELECT * FROM credit_decisions WHERE application_number = ?', 
                    [applicationNumber]
                );
                
                console.log('✅ Database verification successful');
                console.log(`   Loan Applications: ${loanApps.length}`);
                console.log(`   Stage Processing Records: ${stageProcessing.length}`);
                console.log(`   Credit Decisions: ${creditDecisions.length}`);
                
                if (loanApps.length > 0) {
                    const app = loanApps[0];
                    console.log(`   Current Stage: ${app.current_stage}`);
                    console.log(`   Status: ${app.status}`);
                    console.log(`   Applicant: ${app.applicant_name}`);
                }
                
                results.applications[0].databaseVerification = {
                    loanApplications: loanApps.length,
                    stageProcessing: stageProcessing.length,
                    creditDecisions: creditDecisions.length,
                    currentStage: loanApps[0]?.current_stage,
                    status: loanApps[0]?.status
                };
            }
            
            connection.release();
            results.passedTests++;
            
        } catch (error) {
            console.log('❌ Database verification failed:', error.message);
            results.failedTests++;
        } finally {
            await databaseService.close();
        }

        // Final Summary
        console.log('\n📋 STAGE 1 & 2 WORKFLOW TEST SUMMARY');
        console.log('====================================');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        if (results.applications.length > 0) {
            console.log('\n📊 Application Summary:');
            const app = results.applications[0];
            console.log(`   Application Number: ${app.applicationNumber}`);
            console.log(`   Stage 1 Status: ${app.stage1Result?.success ? '✅ Passed' : '❌ Failed'}`);
            console.log(`   Stage 2 Status: ${app.stage2Result?.success ? '✅ Passed' : '❌ Failed'}`);
            console.log(`   Current Stage: ${app.statusCheck?.current_stage || 'Unknown'}`);
            console.log(`   Current Status: ${app.statusCheck?.current_status || 'Unknown'}`);
        }
        
        if (results.failedTests === 0) {
            console.log('\n🎉 ALL AUTOMATED WORKFLOW TESTS PASSED!');
            console.log('✅ Stage 1 (Pre-qualification) is working correctly');
            console.log('✅ Stage 2 (Loan Application) is working correctly');
            console.log('✅ Database integration is functioning');
            console.log('✅ Ready to implement manual approval workflow');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - Review required before implementing manual workflow');
        }
        
        return results;
        
    } catch (error) {
        console.log('\n❌ Workflow testing failed:', error.message);
        return {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests + 1,
            error: error.message
        };
    }
}

// Run the tests
testStage1Stage2Workflow().catch(console.error);
