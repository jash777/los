#!/usr/bin/env node

/**
 * Simple End-to-End LOS Testing Script
 * Tests two applications through all 7 stages using Node.js built-in modules
 * Application 1: Approved path (complete workflow)
 * Application 2: Rejected path (fails at underwriting)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class SimpleE2ETest {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.testResults = {
            application1: { applicationNumber: null, stages: {}, status: 'running' },
            application2: { applicationNumber: null, stages: {}, status: 'running' }
        };
        this.startTime = Date.now();
    }

    /**
     * Make HTTP request using Node.js built-in modules
     */
    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'LOS-E2E-Test/1.0'
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const client = urlObj.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            data: parsedData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            data: { error: 'Invalid JSON response', raw: responseData }
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Main test execution
     */
    async runTest() {
        console.log('🚀 Starting Simple End-to-End LOS Testing');
        console.log('=' .repeat(60));
        console.log('Testing two applications:');
        console.log('📋 Application 1: Expected to be APPROVED (full workflow)');
        console.log('📋 Application 2: Expected to be REJECTED (fails at underwriting)');
        console.log('=' .repeat(60));
        console.log('');

        try {
            // Test Application 1 - Approved Path
            await this.testApplication1_ApprovedPath();
            
            // Test Application 2 - Rejected Path
            await this.testApplication2_RejectedPath();

            // Display final results
            this.displayFinalResults();

        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Test Application 1 - Approved Path
     */
    async testApplication1_ApprovedPath() {
        console.log('🟢 Testing Application 1 - Approved Path');
        console.log('-'.repeat(40));

        try {
            // Stage 1: Pre-Qualification
            const app1Number = await this.executeStage1_PreQualification('app1', this.getApprovedApplicantData());
            this.testResults.application1.applicationNumber = app1Number;

            // Stage 2: Loan Application
            await this.executeStage2_LoanApplication('app1', app1Number, this.getApprovedLoanApplicationData());

            // Stage 3-7: Automated Workflow
            await this.executeAutomatedWorkflow('app1', app1Number);

            this.testResults.application1.status = 'completed';
            console.log('✅ Application 1 completed successfully\n');

        } catch (error) {
            this.testResults.application1.status = 'failed';
            console.error(`❌ Application 1 failed: ${error.message}\n`);
            throw error;
        }
    }

    /**
     * Test Application 2 - Rejected Path
     */
    async testApplication2_RejectedPath() {
        console.log('🔴 Testing Application 2 - Rejected Path');
        console.log('-'.repeat(40));

        try {
            // Stage 1: Pre-Qualification
            const app2Number = await this.executeStage1_PreQualification('app2', this.getRejectedApplicantData());
            this.testResults.application2.applicationNumber = app2Number;

            // Stage 2: Loan Application
            await this.executeStage2_LoanApplication('app2', app2Number, this.getRejectedLoanApplicationData());

            // Stage 3-7: Automated Workflow (will fail at underwriting)
            await this.executeAutomatedWorkflow('app2', app2Number);

            this.testResults.application2.status = 'completed';
            console.log('✅ Application 2 completed (expected rejection)\n');

        } catch (error) {
            // For rejected applications, this is expected
            if (error.message.includes('rejected') || error.message.includes('underwriting')) {
                this.testResults.application2.status = 'rejected_as_expected';
                console.log('✅ Application 2 rejected as expected at underwriting\n');
            } else {
                this.testResults.application2.status = 'failed';
                console.error(`❌ Application 2 failed unexpectedly: ${error.message}\n`);
                throw error;
            }
        }
    }

    /**
     * Execute Stage 1: Pre-Qualification
     */
    async executeStage1_PreQualification(appId, applicantData) {
        console.log(`  📝 Stage 1: Pre-Qualification (${appId})`);
        
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(`${this.baseURL}/pre-qualification/process`, 'POST', applicantData);
            
            if (response.statusCode !== 200 || !response.data.success) {
                throw new Error(`Pre-qualification failed: ${response.data.error || 'Unknown error'}`);
            }

            const applicationNumber = response.data.data.applicationNumber;
            const processingTime = Date.now() - startTime;

            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.stage1 = {
                status: 'completed',
                processingTime,
                result: response.data
            };

            console.log(`     ✅ Pre-qualification completed: ${applicationNumber} (${processingTime}ms)`);
            console.log(`     📊 Decision: ${response.data.data.eligibility_result?.decision || 'N/A'}`);
            console.log(`     📊 Score: ${response.data.data.eligibility_result?.score || 'N/A'}`);
            
            return applicationNumber;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.stage1 = {
                status: 'failed',
                processingTime,
                error: error.message
            };
            
            console.log(`     ❌ Pre-qualification failed (${processingTime}ms): ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute Stage 2: Loan Application
     */
    async executeStage2_LoanApplication(appId, applicationNumber, loanData) {
        console.log(`  📋 Stage 2: Loan Application (${appId})`);
        
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(`${this.baseURL}/loan-application/process/${applicationNumber}`, 'POST', loanData);
            
            if (response.statusCode !== 200 || !response.data.success) {
                throw new Error(`Loan application failed: ${response.data.error || 'Unknown error'}`);
            }

            const processingTime = Date.now() - startTime;

            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.stage2 = {
                status: 'completed',
                processingTime,
                result: response.data
            };

            console.log(`     ✅ Loan application completed (${processingTime}ms)`);
            console.log(`     📊 Status: ${response.data.status}`);
            console.log(`     📊 Decision: ${response.data.data?.decision || 'N/A'}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.stage2 = {
                status: 'failed',
                processingTime,
                error: error.message
            };
            
            console.log(`     ❌ Loan application failed (${processingTime}ms): ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute Automated Workflow (Stages 3-7)
     */
    async executeAutomatedWorkflow(appId, applicationNumber) {
        console.log(`  🤖 Automated Workflow: Stages 3-7 (${appId})`);
        
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(`${this.baseURL}/automated-workflow/start/${applicationNumber}`, 'POST');
            
            const processingTime = Date.now() - startTime;
            const result = response.data;

            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.automated = {
                status: result.data?.workflow_status || 'unknown',
                processingTime,
                result: result
            };

            console.log(`     ✅ Automated workflow completed (${processingTime}ms)`);
            console.log(`     📊 Workflow Status: ${result.data?.workflow_status}`);
            console.log(`     📊 Stages Processed: ${result.data?.stages_processed}/${result.data?.total_stages}`);
            
            // Log individual stage results
            if (result.data?.stage_results) {
                result.data.stage_results.forEach((stage, index) => {
                    console.log(`        Stage ${index + 3}: ${stage.stage} - ${stage.status}`);
                });
            }

            // Check if workflow was rejected
            if (result.data?.workflow_status === 'rejected') {
                throw new Error(`Workflow rejected: ${result.data?.rejection_reason || 'Unknown reason'}`);
            }

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.testResults[appId === 'app1' ? 'application1' : 'application2'].stages.automated = {
                status: 'failed',
                processingTime,
                error: error.message
            };
            
            console.log(`     ❌ Automated workflow failed (${processingTime}ms): ${error.message}`);
            throw error;
        }
    }

    /**
     * Get approved applicant data (strong profile)
     */
    getApprovedApplicantData() {
        return {
            full_name: "RAJESH KUMAR SHARMA",
            phone: "9876543210",
            email: "rajesh.sharma@example.com",
            pan_number: "ABCDE1234F",
            date_of_birth: "1985-06-15",
            requested_loan_amount: 500000,
            loan_purpose: "home_improvement",
            employment_type: "salaried"
        };
    }

    /**
     * Get approved loan application data (strong financial profile)
     */
    getApprovedLoanApplicationData() {
        return {
            employment_details: {
                employment_type: "salaried",
                company_name: "Tech Solutions Pvt Ltd",
                designation: "Senior Software Engineer",
                work_experience_years: 8,
                monthly_salary: 85000,
                company_address: "Sector 62, Noida, UP",
                hr_contact: "9876543211"
            },
            income_details: {
                monthly_salary: 85000,
                other_income: 10000,
                total_monthly_income: 95000,
                existing_emi: 12000,
                net_monthly_income: 83000
            },
            banking_details: {
                primary_bank: "HDFC Bank",
                account_number: "12345678901234",
                account_type: "Savings",
                average_monthly_balance: 75000,
                banking_relationship_years: 5
            },
            address_details: {
                current_address: {
                    address_line_1: "A-123, Sector 15",
                    address_line_2: "Near Metro Station",
                    city: "Noida",
                    state: "Uttar Pradesh",
                    pincode: "201301",
                    address_type: "owned",
                    years_at_address: 3
                }
            },
            references: [
                {
                    name: "Amit Gupta",
                    relationship: "friend",
                    mobile: "9876543212",
                    address: "B-456, Sector 16, Noida"
                }
            ]
        };
    }

    /**
     * Get rejected applicant data (weak profile)
     */
    getRejectedApplicantData() {
        return {
            full_name: "SURESH KUMAR",
            phone: "9876543220",
            email: "suresh.kumar@example.com",
            pan_number: "XYZAB5678C",
            date_of_birth: "1995-03-10",
            requested_loan_amount: 1000000, // High amount
            loan_purpose: "business",
            employment_type: "self_employed"
        };
    }

    /**
     * Get rejected loan application data (weak financial profile)
     */
    getRejectedLoanApplicationData() {
        return {
            employment_details: {
                employment_type: "self_employed",
                company_name: "Small Business",
                designation: "Owner",
                work_experience_years: 2,
                monthly_salary: 25000,
                company_address: "Local Market, Delhi",
                hr_contact: "9876543221"
            },
            income_details: {
                monthly_salary: 25000,
                other_income: 5000,
                total_monthly_income: 30000,
                existing_emi: 18000,
                net_monthly_income: 12000
            },
            banking_details: {
                primary_bank: "Local Bank",
                account_number: "98765432109876",
                account_type: "Current",
                average_monthly_balance: 5000,
                banking_relationship_years: 1
            },
            address_details: {
                current_address: {
                    address_line_1: "Room 12, Building 5",
                    address_line_2: "Rental Complex",
                    city: "Delhi",
                    state: "Delhi",
                    pincode: "110001",
                    address_type: "rented",
                    years_at_address: 1
                }
            },
            references: [
                {
                    name: "Local Friend",
                    relationship: "friend",
                    mobile: "9876543222",
                    address: "Local Address, Delhi"
                }
            ]
        };
    }

    /**
     * Display final test results
     */
    displayFinalResults() {
        const totalTime = Date.now() - this.startTime;
        
        console.log('🏁 SIMPLE E2E TEST RESULTS');
        console.log('=' .repeat(60));
        console.log(`Total Test Duration: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
        console.log('');

        // Application 1 Results
        console.log('📋 APPLICATION 1 (Approved Path):');
        console.log(`   Application Number: ${this.testResults.application1.applicationNumber}`);
        console.log(`   Overall Status: ${this.testResults.application1.status.toUpperCase()}`);
        console.log('   Stage Results:');
        
        Object.entries(this.testResults.application1.stages).forEach(([stage, data]) => {
            const status = data.status === 'completed' ? '✅' : data.status === 'failed' ? '❌' : '⏳';
            console.log(`     ${status} ${stage}: ${data.status} (${data.processingTime}ms)`);
        });
        
        console.log('');

        // Application 2 Results
        console.log('📋 APPLICATION 2 (Rejected Path):');
        console.log(`   Application Number: ${this.testResults.application2.applicationNumber}`);
        console.log(`   Overall Status: ${this.testResults.application2.status.toUpperCase()}`);
        console.log('   Stage Results:');
        
        Object.entries(this.testResults.application2.stages).forEach(([stage, data]) => {
            const status = data.status === 'completed' ? '✅' : 
                          data.status === 'rejected' ? '🔴' :
                          data.status === 'failed' ? '❌' : '⏳';
            console.log(`     ${status} ${stage}: ${data.status} (${data.processingTime}ms)`);
        });
        
        console.log('');

        // Summary
        const app1Success = this.testResults.application1.status === 'completed';
        const app2Success = this.testResults.application2.status === 'rejected_as_expected';
        
        console.log('📊 TEST SUMMARY:');
        console.log(`   Application 1 (Approved): ${app1Success ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Application 2 (Rejected): ${app2Success ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Overall Test Result: ${app1Success && app2Success ? '🎉 SUCCESS' : '💥 FAILED'}`);
        
        console.log('');
        console.log('🎯 Test completed! Check your LOS dashboard to verify the results.');
        
        // Exit with appropriate code
        process.exit(app1Success && app2Success ? 0 : 1);
    }
}

// Execute the test if run directly
if (require.main === module) {
    const test = new SimpleE2ETest();
    test.runTest().catch(error => {
        console.error('Fatal test error:', error);
        process.exit(1);
    });
}

module.exports = SimpleE2ETest;
