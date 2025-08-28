/**
 * Complete Workflow Test
 * Tests all 7 stages of the loan origination system
 */

const axios = require('axios');

class CompleteWorkflowTest {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.applicationNumber = null;
        this.testResults = [];
    }

    /**
     * Run complete workflow test
     */
    async runCompleteTest() {
        console.log('🚀 Starting Complete Loan Origination Workflow Test');
        console.log('=' .repeat(60));

        try {
            // Stage 1: Pre-Qualification
            await this.testPreQualification();
            
            // Stage 2: Application Processing
            await this.testApplicationProcessing();
            
            // Stage 3: Underwriting
            await this.testUnderwriting();
            
            // Stage 4: Credit Decision
            await this.testCreditDecision();
            
            // Stage 6: Quality Check
            await this.testQualityCheck();
            
            // Stage 7: Loan Funding
            await this.testLoanFunding();

            // Print summary
            this.printTestSummary();

        } catch (error) {
            console.error('❌ Complete workflow test failed:', error.message);
            this.printTestSummary();
        }
    }

    /**
     * Test Stage 1: Pre-Qualification
     */
    async testPreQualification() {
        console.log('\n📋 Testing Stage 1: Pre-Qualification');
        console.log('-'.repeat(40));

        const testData = {
            applicantName: "RAJESH KUMAR SHARMA",
            dateOfBirth: "1985-06-15",
            phone: "9876543210",
            panNumber: "ABCDE1234F",
            monthlyIncome: 75000,
            loanAmount: 500000,
            loanPurpose: "personal",
            employmentType: "salaried"
        };

        try {
            const response = await axios.post(`${this.baseURL}/pre-qualification/process`, testData);
            
            if (response.data.success) {
                this.applicationNumber = response.data.data.applicationNumber;
                console.log(`✅ Pre-qualification passed - Application Number: ${this.applicationNumber}`);
                console.log(`   Eligibility Score: ${response.data.data.eligibility_score}`);
                console.log(`   Processing Time: ${response.data.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Pre-Qualification',
                    status: 'PASSED',
                    applicationNumber: this.applicationNumber,
                    processingTime: response.data.data.processing_time_ms
                });
            } else {
                throw new Error(`Pre-qualification failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Pre-qualification failed: ${error.message}`);
            this.testResults.push({
                stage: 'Pre-Qualification',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test Stage 2: Application Processing
     */
    async testApplicationProcessing() {
        console.log('\n📄 Testing Stage 2: Application Processing');
        console.log('-'.repeat(40));

        const applicationData = {
            additional_documents: {
                salary_slips: ["slip1.pdf", "slip2.pdf", "slip3.pdf"],
                bank_statements: ["statement1.pdf", "statement2.pdf"],
                identity_proof: "aadhar_card.pdf",
                address_proof: "utility_bill.pdf"
            },
            references: [
                {
                    name: "Amit Patel",
                    relationship: "colleague",
                    mobile: "9876543211",
                    email: "amit.patel@email.com"
                }
            ]
        };

        try {
            const response = await axios.post(
                `${this.baseURL}/application-processing/${this.applicationNumber}`, 
                applicationData
            );
            
            if (response.data.success) {
                console.log(`✅ Application processing completed`);
                console.log(`   Verification Score: ${response.data.verification_score}`);
                console.log(`   Processing Time: ${response.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Application Processing',
                    status: 'PASSED',
                    processingTime: response.data.processing_time_ms
                });
            } else {
                throw new Error(`Application processing failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Application processing failed: ${error.message}`);
            this.testResults.push({
                stage: 'Application Processing',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test Stage 3: Underwriting
     */
    async testUnderwriting() {
        console.log('\n🔍 Testing Stage 3: Underwriting');
        console.log('-'.repeat(40));

        try {
            const response = await axios.post(`${this.baseURL}/underwriting/${this.applicationNumber}`);
            
            if (response.data.success) {
                console.log(`✅ Underwriting completed`);
                console.log(`   Underwriting Score: ${response.data.underwriting_score}`);
                console.log(`   Decision: ${response.data.decision}`);
                console.log(`   Processing Time: ${response.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Underwriting',
                    status: 'PASSED',
                    processingTime: response.data.processing_time_ms
                });
            } else {
                throw new Error(`Underwriting failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Underwriting failed: ${error.message}`);
            this.testResults.push({
                stage: 'Underwriting',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test Stage 4: Credit Decision
     */
    async testCreditDecision() {
        console.log('\n💳 Testing Stage 4: Credit Decision');
        console.log('-'.repeat(40));

        try {
            const response = await axios.post(`${this.baseURL}/credit-decision/${this.applicationNumber}`);
            
            if (response.data.success) {
                console.log(`✅ Credit decision completed`);
                console.log(`   Decision: ${response.data.credit_decision.decision}`);
                console.log(`   Approved Amount: ₹${response.data.recommended_terms.loan_amount}`);
                console.log(`   Interest Rate: ${response.data.recommended_terms.interest_rate}%`);
                console.log(`   EMI: ₹${response.data.recommended_terms.emi_amount}`);
                console.log(`   Processing Time: ${response.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Credit Decision',
                    status: 'PASSED',
                    processingTime: response.data.processing_time_ms
                });
            } else {
                throw new Error(`Credit decision failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Credit decision failed: ${error.message}`);
            this.testResults.push({
                stage: 'Credit Decision',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test Stage 6: Quality Check
     */
    async testQualityCheck() {
        console.log('\n🔍 Testing Stage 6: Quality Check');
        console.log('-'.repeat(40));

        try {
            const response = await axios.post(`${this.baseURL}/quality-check/${this.applicationNumber}`);
            
            if (response.data.success) {
                console.log(`✅ Quality check completed`);
                console.log(`   Quality Score: ${response.data.quality_score}`);
                console.log(`   Quality Grade: ${response.data.quality_grade}`);
                console.log(`   Processing Time: ${response.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Quality Check',
                    status: 'PASSED',
                    processingTime: response.data.processing_time_ms
                });
            } else {
                throw new Error(`Quality check failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Quality check failed: ${error.message}`);
            this.testResults.push({
                stage: 'Quality Check',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test Stage 7: Loan Funding
     */
    async testLoanFunding() {
        console.log('\n💰 Testing Stage 7: Loan Funding');
        console.log('-'.repeat(40));

        try {
            const response = await axios.post(`${this.baseURL}/loan-funding/${this.applicationNumber}`);
            
            if (response.data.success) {
                console.log(`✅ Loan funding completed`);
                console.log(`   Transaction ID: ${response.data.disbursement_details.transaction_id}`);
                console.log(`   UTR Number: ${response.data.disbursement_details.utr_number}`);
                console.log(`   Amount Disbursed: ₹${response.data.disbursement_details.amount_disbursed}`);
                console.log(`   Method: ${response.data.disbursement_details.disbursement_method}`);
                console.log(`   Processing Time: ${response.data.processing_time_ms}ms`);
                
                this.testResults.push({
                    stage: 'Loan Funding',
                    status: 'PASSED',
                    processingTime: response.data.processing_time_ms
                });
            } else {
                throw new Error(`Loan funding failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Loan funding failed: ${error.message}`);
            this.testResults.push({
                stage: 'Loan Funding',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n📊 Test Summary');
        console.log('=' .repeat(60));
        
        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;
        const totalProcessingTime = this.testResults
            .filter(r => r.processingTime)
            .reduce((sum, r) => sum + r.processingTime, 0);

        console.log(`Application Number: ${this.applicationNumber || 'N/A'}`);
        console.log(`Total Stages Tested: ${this.testResults.length}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Total Processing Time: ${totalProcessingTime}ms`);
        console.log(`Average Processing Time: ${Math.round(totalProcessingTime / this.testResults.length)}ms`);

        console.log('\nStage-wise Results:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            const time = result.processingTime ? `(${result.processingTime}ms)` : '';
            console.log(`  ${status} ${result.stage} ${time}`);
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
        });

        if (passedTests === this.testResults.length) {
            console.log('\n🎉 All tests passed! Complete workflow is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new CompleteWorkflowTest();
    test.runCompleteTest().catch(console.error);
}

module.exports = CompleteWorkflowTest;