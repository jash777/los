const { 
    BaseRuleEngine, 
    KYCRuleEngine, 
    CIBILRuleEngine, 
    EligibilityRuleEngine, 
    RiskAssessmentRuleEngine 
} = require('./index');

/**
 * Comprehensive test suite for all rule engines
 * Tests integration with loan application phases
 */
class RuleEngineTestSuite {
    constructor() {
        this.testResults = [];
        this.setupTestData();
    }

    setupTestData() {
        // Sample loan application data for testing
        this.sampleApplicationData = {
            personalDetails: {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1985-05-15',
                gender: 'male',
                maritalStatus: 'married'
            },
            identityDetails: {
                panNumber: 'ABCDE1234F',
                aadharNumber: '123456789012',
                passportNumber: null
            },
            addressDetails: {
                currentAddress: {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    residenceType: 'owned',
                    yearsAtAddress: 5
                },
                permanentAddress: {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                }
            },
            contactDetails: {
                mobileNumber: '9876543210',
                emailAddress: 'john.doe@email.com',
                alternateMobile: null
            },
            employmentDetails: {
                employmentType: 'salaried',
                companyName: 'Tech Corp India',
                designation: 'Software Engineer',
                workExperience: 8,
                monthlyIncome: 75000,
                companyType: 'private',
                industryType: 'technology'
            },
            financialDetails: {
                monthlyIncome: 75000,
                existingEmis: 15000,
                bankAccountDetails: {
                    accountNumber: '1234567890',
                    bankName: 'HDFC Bank',
                    ifscCode: 'HDFC0001234'
                },
                netTakeHome: 60000
            },
            loanDetails: {
                loanAmount: 500000,
                loanPurpose: 'home_improvement',
                tenureMonths: 36,
                loanType: 'personal_loan'
            }
        };

        // Sample CIBIL data
        this.sampleCibilData = {
            cibilScore: 750,
            creditHistory: {
                totalAccounts: 5,
                activeAccounts: 3,
                closedAccounts: 2,
                overdueAccounts: 0
            },
            paymentHistory: {
                onTimePayments: 95,
                latePayments: 2,
                missedPayments: 0
            },
            creditUtilization: 35,
            creditAge: 60, // months
            recentInquiries: 1,
            negativeMarks: []
        };

        // Sample stage results for risk assessment
        this.sampleStageResults = {
            creditAnalysis: {
                cibil_score: 750,
                credit_history_length: 60,
                payment_history: 95,
                credit_utilization: 35
            },
            dtiAnalysis: {
                debt_to_income_ratio: 40,
                monthly_income: 75000,
                existing_debt_obligations: 15000,
                proposed_emi: 15000
            },
            collateralAssessment: {
                assessment_required: false,
                loan_to_value_ratio: null
            }
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Rule Engine Test Suite...');
        console.log('=' .repeat(50));

        try {
            await this.testKYCRuleEngine();
            await this.testCIBILRuleEngine();
            await this.testEligibilityRuleEngine();
            await this.testRiskAssessmentRuleEngine();
            await this.testRuleEngineFactory();
            
            this.printTestSummary();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    /**
     * Test KYC Rule Engine
     */
    async testKYCRuleEngine() {
        console.log('\n📋 Testing KYC Rule Engine...');
        
        try {
            const kycEngine = new KYCRuleEngine();
            
            // Test valid KYC data
            const result = await kycEngine.performKYCVerification(this.sampleApplicationData);
            
            this.logTestResult('KYC Rule Engine - Valid Data', {
                passed: result.decision !== 'REJECTED',
                details: {
                    decision: result.decision,
                    score: result.score,
                    passedRules: result.passedRules?.length || 0,
                    failedRules: result.failedRules?.length || 0
                }
            });

            // Test invalid KYC data (missing PAN)
            const invalidData = {
                ...this.sampleApplicationData,
                identityDetails: {
                    ...this.sampleApplicationData.identityDetails,
                    panNumber: null
                }
            };
            
            const invalidResult = await kycEngine.performKYCVerification(invalidData);
            
            this.logTestResult('KYC Rule Engine - Invalid Data', {
                passed: invalidResult.decision === 'REJECTED',
                details: {
                    decision: invalidResult.decision,
                    score: invalidResult.score,
                    failedRules: invalidResult.failedRules?.length || 0
                }
            });
            
        } catch (error) {
            this.logTestResult('KYC Rule Engine', {
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Test CIBIL Rule Engine
     */
    async testCIBILRuleEngine() {
        console.log('\n💳 Testing CIBIL Rule Engine...');
        
        try {
            const cibilEngine = new CIBILRuleEngine();
            
            // Test good credit score
            const result = await cibilEngine.performCreditAnalysis(
                this.sampleCibilData, 
                this.sampleApplicationData
            );
            
            this.logTestResult('CIBIL Rule Engine - Good Credit', {
                passed: result.decision !== 'REJECTED',
                details: {
                    decision: result.decision,
                    score: result.score,
                    creditGrade: result.creditGrade
                }
            });

            // Test poor credit score
            const poorCreditData = {
                ...this.sampleCibilData,
                cibilScore: 550,
                paymentHistory: {
                    onTimePayments: 60,
                    latePayments: 25,
                    missedPayments: 15
                }
            };
            
            const poorResult = await cibilEngine.performCreditAnalysis(
                poorCreditData, 
                this.sampleApplicationData
            );
            
            this.logTestResult('CIBIL Rule Engine - Poor Credit', {
                passed: poorResult.decision === 'REJECTED',
                details: {
                    decision: poorResult.decision,
                    score: poorResult.score,
                    creditGrade: poorResult.creditGrade
                }
            });
            
        } catch (error) {
            this.logTestResult('CIBIL Rule Engine', {
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Test Eligibility Rule Engine
     */
    async testEligibilityRuleEngine() {
        console.log('\n✅ Testing Eligibility Rule Engine...');
        
        try {
            const eligibilityEngine = new EligibilityRuleEngine();
            
            // Test eligible application
            const result = await eligibilityEngine.performEligibilityAssessment(
                this.sampleApplicationData,
                this.sampleStageResults
            );
            
            this.logTestResult('Eligibility Rule Engine - Eligible', {
                passed: result.decision !== 'REJECTED',
                details: {
                    decision: result.decision,
                    score: result.score,
                    eligibilityGrade: result.eligibilityGrade
                }
            });

            // Test ineligible application (low income)
            const ineligibleData = {
                ...this.sampleApplicationData,
                financialDetails: {
                    ...this.sampleApplicationData.financialDetails,
                    monthlyIncome: 15000,
                    netTakeHome: 12000
                },
                employmentDetails: {
                    ...this.sampleApplicationData.employmentDetails,
                    monthlyIncome: 15000
                }
            };
            
            const ineligibleResult = await eligibilityEngine.performEligibilityAssessment(
                ineligibleData,
                this.sampleStageResults
            );
            
            this.logTestResult('Eligibility Rule Engine - Ineligible', {
                passed: ineligibleResult.decision === 'REJECTED',
                details: {
                    decision: ineligibleResult.decision,
                    score: ineligibleResult.score,
                    failedRules: ineligibleResult.failedRules?.length || 0
                }
            });
            
        } catch (error) {
            this.logTestResult('Eligibility Rule Engine', {
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Test Risk Assessment Rule Engine
     */
    async testRiskAssessmentRuleEngine() {
        console.log('\n⚠️ Testing Risk Assessment Rule Engine...');
        
        try {
            const riskEngine = new RiskAssessmentRuleEngine();
            
            const riskData = {
                ...this.sampleApplicationData,
                ...this.sampleStageResults
            };
            
            // Test low risk application
            const result = await riskEngine.performRiskAssessment(riskData);
            
            this.logTestResult('Risk Assessment Rule Engine - Low Risk', {
                passed: result.decision !== 'REJECTED',
                details: {
                    decision: result.decision,
                    score: result.score,
                    riskGrade: result.riskGrade
                }
            });

            // Test high risk application
            const highRiskData = {
                ...riskData,
                creditAnalysis: {
                    ...riskData.creditAnalysis,
                    cibil_score: 580,
                    payment_history: 60
                },
                dtiAnalysis: {
                    ...riskData.dtiAnalysis,
                    debt_to_income_ratio: 75
                }
            };
            
            const highRiskResult = await riskEngine.performRiskAssessment(highRiskData);
            
            this.logTestResult('Risk Assessment Rule Engine - High Risk', {
                passed: highRiskResult.decision === 'REJECTED',
                details: {
                    decision: highRiskResult.decision,
                    score: highRiskResult.score,
                    riskGrade: highRiskResult.riskGrade
                }
            });
            
        } catch (error) {
            this.logTestResult('Risk Assessment Rule Engine', {
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Test Rule Engine Factory
     */
    async testRuleEngineFactory() {
        console.log('\n🏭 Testing Rule Engine Factory...');
        
        try {
            const { createRuleEngine, getAvailableTypes, isValidType } = require('./index');
            
            // Test factory creation
            const kycEngine = createRuleEngine('kyc');
            const cibilEngine = createRuleEngine('cibil');
            const eligibilityEngine = createRuleEngine('eligibility');
            const riskEngine = createRuleEngine('risk-assessment');
            
            this.logTestResult('Rule Engine Factory - Creation', {
                passed: kycEngine && cibilEngine && eligibilityEngine && riskEngine,
                details: {
                    kycCreated: !!kycEngine,
                    cibilCreated: !!cibilEngine,
                    eligibilityCreated: !!eligibilityEngine,
                    riskCreated: !!riskEngine
                }
            });

            // Test available types
            const availableTypes = getAvailableTypes();
            this.logTestResult('Rule Engine Factory - Available Types', {
                passed: availableTypes.length === 5, // Including base type
                details: {
                    types: availableTypes,
                    count: availableTypes.length
                }
            });

            // Test type validation
            const validType = isValidType('kyc');
            const invalidType = isValidType('invalid');
            
            this.logTestResult('Rule Engine Factory - Type Validation', {
                passed: validType && !invalidType,
                details: {
                    validTypeCheck: validType,
                    invalidTypeCheck: invalidType
                }
            });
            
        } catch (error) {
            this.logTestResult('Rule Engine Factory', {
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Log test result
     */
    logTestResult(testName, result) {
        this.testResults.push({ testName, ...result });
        
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status}: ${testName}`);
        
        if (result.details) {
            console.log(`    Details:`, JSON.stringify(result.details, null, 2));
        }
        
        if (result.error) {
            console.log(`    Error: ${result.error}`);
        }
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.testName}: ${r.error || 'Test failed'}`));
        }
        
        console.log('\n🎉 Rule Engine Test Suite Completed!');
    }
}

// Export for use in other files
module.exports = RuleEngineTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new RuleEngineTestSuite();
    testSuite.runAllTests().catch(console.error);
}