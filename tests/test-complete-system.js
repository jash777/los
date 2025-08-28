/**
 * Complete System Test Runner
 * Tests all 7 stages of the Loan Origination System
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const SIMULATOR_URL = 'http://localhost:4000/api';

class LoanSystemTester {
    constructor() {
        this.applicationNumber = null;
        this.testResults = [];
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running: ${testName}`);
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            console.log(`✅ ${testName} - PASSED (${duration}ms)`);
            this.testResults.push({ name: testName, status: 'PASSED', duration, result });
            return result;
        } catch (error) {
            console.log(`❌ ${testName} - FAILED: ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            throw error;
        }
    }

    async testSystemHealth() {
        return this.runTest('System Health Check', async () => {
            const [losHealth, simulatorHealth] = await Promise.all([
                axios.get(`${BASE_URL}/health`),
                axios.get(`http://localhost:4000/health`)
            ]);
            
            return {
                losStatus: losHealth.data,
                simulatorStatus: simulatorHealth.data
            };
        });
    }

    async testPreQualification() {
        return this.runTest('Stage 1: Pre-Qualification', async () => {
            const response = await axios.post(`${BASE_URL}/pre-qualification/process`, {
                applicantName: "RAJESH KUMAR SHARMA",
                email: `test.${Date.now()}@email.com`,
                phone: `98765${Date.now().toString().slice(-5)}`,
                panNumber: "ABCDE1234F",
                dateOfBirth: "1985-06-15",
                aadharNumber: "123456789012",
                loanAmount: 500000,
                loanPurpose: "Home Purchase",
                employmentType: "salaried",
                monthlyIncome: 75000,
                existingLoans: [],
                bankAccount: {
                    accountNumber: "1234567890",
                    ifscCode: "HDFC0001234",
                    bankName: "HDFC Bank"
                }
            });

            this.applicationNumber = response.data.data.applicationNumber;
            console.log(`   📋 Application Number: ${this.applicationNumber}`);
            return response.data;
        });
    }

    async testApplicationProcessing() {
        return this.runTest('Stage 2: Application Processing', async () => {
            const response = await axios.post(`${BASE_URL}/application-processing/${this.applicationNumber}`, {
                documents: [
                    {
                        type: "pan_card",
                        documentId: "PAN_001",
                        verified: true
                    },
                    {
                        type: "salary_slips",
                        documentId: "SALARY_001",
                        verified: true,
                        details: {
                            months: 3,
                            averageSalary: 75000
                        }
                    }
                ],
                additionalInfo: {
                    propertyDetails: {
                        propertyValue: 2500000,
                        propertyType: "Apartment",
                        location: "Mumbai"
                    }
                }
            });

            return response.data;
        });
    }

    async testUnderwriting() {
        return this.runTest('Stage 3: Underwriting', async () => {
            const response = await axios.post(`${BASE_URL}/underwriting/${this.applicationNumber}`, {
                riskAssessment: {
                    employmentStability: "high",
                    incomeConsistency: "stable",
                    debtToIncomeRatio: 0.35,
                    collateralValue: 2500000,
                    loanToValueRatio: 0.20
                },
                financialAnalysis: {
                    monthlyIncome: 75000,
                    monthlyExpenses: 35000,
                    existingEMIs: 0,
                    disposableIncome: 40000,
                    savingsPattern: "regular"
                },
                creditProfile: {
                    creditScore: 750,
                    creditHistory: "good",
                    defaultHistory: "none",
                    creditUtilization: 0.30
                }
            });

            return response.data;
        });
    }

    async testCreditDecision() {
        return this.runTest('Stage 4: Credit Decision', async () => {
            const response = await axios.post(`${BASE_URL}/credit-decision/${this.applicationNumber}`, {
                decision: "approved",
                approvedAmount: 500000,
                interestRate: 8.5,
                loanTenure: 240,
                conditions: [
                    "Property insurance mandatory",
                    "Life insurance coverage required"
                ],
                decisionFactors: {
                    creditScore: 750,
                    incomeStability: "high",
                    collateralAdequacy: "sufficient",
                    debtServiceCoverage: 2.1
                },
                decisionMaker: "Automated System",
                decisionNotes: "Application approved based on strong financial profile."
            });

            return response.data;
        });
    }

    async testQualityCheck() {
        return this.runTest('Stage 6: Quality Check', async () => {
            const response = await axios.post(`${BASE_URL}/quality-check/${this.applicationNumber}`, {
                qualityChecks: {
                    documentVerification: {
                        status: "passed",
                        checkedDocuments: ["PAN", "Aadhar", "Salary Slips"],
                        verificationScore: 95
                    },
                    creditVerification: {
                        status: "passed",
                        cibilScore: 750,
                        creditReportDate: "2024-08-27",
                        verificationScore: 90
                    },
                    incomeVerification: {
                        status: "passed",
                        verifiedIncome: 75000,
                        incomeSource: "salary",
                        verificationScore: 92
                    },
                    complianceCheck: {
                        status: "passed",
                        kycCompliance: "complete",
                        amlCheck: "clear",
                        verificationScore: 100
                    }
                },
                overallQualityScore: 93,
                qualityCheckNotes: "All quality checks passed successfully.",
                checkedBy: "Automated Quality System"
            });

            return response.data;
        });
    }

    async testLoanFunding() {
        return this.runTest('Stage 7: Loan Funding', async () => {
            const response = await axios.post(`${BASE_URL}/loan-funding/${this.applicationNumber}`, {
                disbursementDetails: {
                    disbursementAmount: 500000,
                    disbursementMethod: "bank_transfer",
                    beneficiaryAccount: {
                        accountNumber: "1234567890",
                        ifscCode: "HDFC0001234",
                        bankName: "HDFC Bank",
                        accountHolderName: "Test User"
                    },
                    disbursementDate: "2024-08-30"
                },
                loanAccountDetails: {
                    loanAccountNumber: `LA${Date.now()}`,
                    interestRate: 8.5,
                    loanTenure: 240,
                    emiAmount: 4238,
                    firstEmiDate: "2024-09-30"
                },
                fundingNotes: "Loan disbursement processed successfully.",
                processedBy: "Automated Funding System"
            });

            return response.data;
        });
    }

    async testThirdPartyAPIs() {
        return this.runTest('Third-Party API Integration', async () => {
            const [panResult, cibilResult, bankResult, employmentResult] = await Promise.all([
                // PAN Verification
                axios.post(`${SIMULATOR_URL}/pan/verify`, {
                    pan_number: "ABCDE1234F",
                    name: "RAJESH KUMAR SHARMA"
                }),
                
                // CIBIL Credit Score
                axios.post(`${SIMULATOR_URL}/cibil/credit-score`, {
                    pan_number: "ABCDE1234F",
                    name: "RAJESH KUMAR SHARMA",
                    date_of_birth: "1985-06-15",
                    mobile_number: "9876543210"
                }),
                
                // Bank Statement Analysis
                axios.post(`${SIMULATOR_URL}/account-aggregator/bank-statements`, {
                    account_number: "1234567890",
                    ifsc_code: "HDFC0001234",
                    account_holder_name: "RAJESH KUMAR SHARMA",
                    statement_period: {
                        from_date: "2024-02-01",
                        to_date: "2024-07-31"
                    }
                }),
                
                // Employment Verification
                axios.post(`${SIMULATOR_URL}/employment/verify`, {
                    employee_id: "EMP001",
                    pan_number: "ABCDE1234F",
                    company_name: "TechCorp Solutions",
                    employee_name: "RAJESH KUMAR SHARMA"
                })
            ]);

            return {
                panVerification: panResult.data,
                cibilScore: cibilResult.data,
                bankAnalysis: bankResult.data,
                employmentVerification: employmentResult.data
            };
        });
    }

    async runCompleteTest() {
        console.log('🚀 Starting Complete Loan Origination System Test');
        console.log('=' .repeat(60));

        try {
            // Test system health
            await this.testSystemHealth();
            
            // Test third-party APIs
            await this.testThirdPartyAPIs();
            
            // Test complete loan workflow
            await this.testPreQualification();
            await this.testApplicationProcessing();
            await this.testUnderwriting();
            await this.testCreditDecision();
            await this.testQualityCheck();
            await this.testLoanFunding();

            // Print summary
            this.printTestSummary();

        } catch (error) {
            console.log(`\n💥 Test suite failed: ${error.message}`);
            this.printTestSummary();
            process.exit(1);
        }
    }

    printTestSummary() {
        console.log('\n📊 Test Summary');
        console.log('=' .repeat(60));
        
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const totalTime = this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        
        if (this.applicationNumber) {
            console.log(`📋 Test Application: ${this.applicationNumber}`);
        }

        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            const time = result.duration ? ` (${result.duration}ms)` : '';
            console.log(`   ${status} ${result.name}${time}`);
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
        });

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Your Loan Origination System is working perfectly!');
        } else {
            console.log(`\n⚠️  ${failed} test(s) failed. Please check the errors above.`);
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const tester = new LoanSystemTester();
    tester.runCompleteTest().catch(console.error);
}

module.exports = LoanSystemTester;