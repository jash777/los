#!/usr/bin/env node

/**
 * Manual Stage-by-Stage Testing Script
 * Allows testing individual stages and manual progression through the workflow
 * Provides detailed control over each stage of the loan origination process
 */

const axios = require('axios');
const readline = require('readline');

class ManualStageTesting {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.currentApplications = {
            approved: null,
            rejected: null
        };
    }

    /**
     * Main interactive menu
     */
    async runInteractiveTest() {
        console.log('🧪 Manual Stage-by-Stage LOS Testing');
        console.log('=' .repeat(50));
        console.log('');

        while (true) {
            console.log('Available Actions:');
            console.log('1. Create Approved Profile Application');
            console.log('2. Create Rejected Profile Application');
            console.log('3. Test Stage 1 - Pre-Qualification');
            console.log('4. Test Stage 2 - Loan Application');
            console.log('5. Test Stage 3 - Application Processing');
            console.log('6. Test Stage 4 - Underwriting');
            console.log('7. Test Stage 5 - Credit Decision');
            console.log('8. Test Stage 6 - Quality Check');
            console.log('9. Test Stage 7 - Loan Funding');
            console.log('10. Run Automated Workflow (Stages 3-7)');
            console.log('11. Check Application Status');
            console.log('12. Run Complete E2E Test');
            console.log('0. Exit');
            console.log('');

            const choice = await this.prompt('Select an option (0-12): ');

            try {
                switch (choice) {
                    case '1':
                        await this.createApprovedApplication();
                        break;
                    case '2':
                        await this.createRejectedApplication();
                        break;
                    case '3':
                        await this.testStage1();
                        break;
                    case '4':
                        await this.testStage2();
                        break;
                    case '5':
                        await this.testStage3();
                        break;
                    case '6':
                        await this.testStage4();
                        break;
                    case '7':
                        await this.testStage5();
                        break;
                    case '8':
                        await this.testStage6();
                        break;
                    case '9':
                        await this.testStage7();
                        break;
                    case '10':
                        await this.runAutomatedWorkflow();
                        break;
                    case '11':
                        await this.checkApplicationStatus();
                        break;
                    case '12':
                        await this.runCompleteE2ETest();
                        break;
                    case '0':
                        console.log('👋 Goodbye!');
                        this.rl.close();
                        return;
                    default:
                        console.log('❌ Invalid option. Please try again.\n');
                }
            } catch (error) {
                console.error(`❌ Error: ${error.message}\n`);
            }
        }
    }

    /**
     * Create approved profile application
     */
    async createApprovedApplication() {
        console.log('\n📋 Creating Approved Profile Application...');
        
        try {
            const response = await axios.post(`${this.baseURL}/pre-qualification/process`, this.getApprovedApplicantData());
            
            if (response.data.success) {
                this.currentApplications.approved = response.data.data.applicationNumber;
                console.log(`✅ Created approved application: ${this.currentApplications.approved}`);
                console.log(`📊 Decision: ${response.data.data.eligibility_result.decision}`);
                console.log(`📊 Score: ${response.data.data.eligibility_result.score}\n`);
            } else {
                console.log(`❌ Failed to create application: ${response.data.error}\n`);
            }
        } catch (error) {
            console.error(`❌ Error creating application: ${error.message}\n`);
        }
    }

    /**
     * Create rejected profile application
     */
    async createRejectedApplication() {
        console.log('\n📋 Creating Rejected Profile Application...');
        
        try {
            const response = await axios.post(`${this.baseURL}/pre-qualification/process`, this.getRejectedApplicantData());
            
            if (response.data.success) {
                this.currentApplications.rejected = response.data.data.applicationNumber;
                console.log(`✅ Created rejected application: ${this.currentApplications.rejected}`);
                console.log(`📊 Decision: ${response.data.data.eligibility_result.decision}`);
                console.log(`📊 Score: ${response.data.data.eligibility_result.score}\n`);
            } else {
                console.log(`❌ Failed to create application: ${response.data.error}\n`);
            }
        } catch (error) {
            console.error(`❌ Error creating application: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 1 - Pre-Qualification
     */
    async testStage1() {
        console.log('\n🔍 Testing Stage 1 - Pre-Qualification');
        
        const profileType = await this.prompt('Test with (1) Approved Profile or (2) Rejected Profile? ');
        const data = profileType === '1' ? this.getApprovedApplicantData() : this.getRejectedApplicantData();
        
        try {
            console.log('Sending pre-qualification request...');
            const response = await axios.post(`${this.baseURL}/pre-qualification/process`, data);
            
            console.log('✅ Stage 1 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
            
            if (response.data.success) {
                const appType = profileType === '1' ? 'approved' : 'rejected';
                this.currentApplications[appType] = response.data.data.applicationNumber;
            }
        } catch (error) {
            console.error(`❌ Stage 1 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 2 - Loan Application
     */
    async testStage2() {
        console.log('\n📋 Testing Stage 2 - Loan Application');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        const profileType = await this.prompt('Use (1) Approved Profile Data or (2) Rejected Profile Data? ');
        const data = profileType === '1' ? this.getApprovedLoanApplicationData() : this.getRejectedLoanApplicationData();
        
        try {
            console.log(`Processing loan application for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/loan-application/process/${appNumber}`, data);
            
            console.log('✅ Stage 2 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 2 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 3 - Application Processing
     */
    async testStage3() {
        console.log('\n🔄 Testing Stage 3 - Application Processing');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Processing application: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/application-processing/${appNumber}`);
            
            console.log('✅ Stage 3 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 3 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 4 - Underwriting
     */
    async testStage4() {
        console.log('\n🏦 Testing Stage 4 - Underwriting');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Processing underwriting for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/underwriting/${appNumber}`);
            
            console.log('✅ Stage 4 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 4 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 5 - Credit Decision
     */
    async testStage5() {
        console.log('\n💰 Testing Stage 5 - Credit Decision');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Processing credit decision for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/credit-decision/${appNumber}`);
            
            console.log('✅ Stage 5 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 5 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 6 - Quality Check
     */
    async testStage6() {
        console.log('\n✅ Testing Stage 6 - Quality Check');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Processing quality check for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/quality-check/${appNumber}`);
            
            console.log('✅ Stage 6 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 6 failed: ${error.message}\n`);
        }
    }

    /**
     * Test Stage 7 - Loan Funding
     */
    async testStage7() {
        console.log('\n💸 Testing Stage 7 - Loan Funding');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Processing loan funding for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/loan-funding/${appNumber}`);
            
            console.log('✅ Stage 7 Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Stage 7 failed: ${error.message}\n`);
        }
    }

    /**
     * Run Automated Workflow (Stages 3-7)
     */
    async runAutomatedWorkflow() {
        console.log('\n🤖 Running Automated Workflow (Stages 3-7)');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            console.log(`Starting automated workflow for: ${appNumber}`);
            const response = await axios.post(`${this.baseURL}/automated-workflow/start/${appNumber}`);
            
            console.log('✅ Automated Workflow Response:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
        } catch (error) {
            console.error(`❌ Automated workflow failed: ${error.message}\n`);
        }
    }

    /**
     * Check application status
     */
    async checkApplicationStatus() {
        console.log('\n📊 Checking Application Status');
        
        const appNumber = await this.selectApplication();
        if (!appNumber) return;
        
        try {
            // Try multiple status endpoints
            const endpoints = [
                'pre-qualification/status',
                'loan-application/status',
                'application-processing/status',
                'underwriting/status',
                'credit-decision/status',
                'quality-check/status',
                'loan-funding/status'
            ];

            console.log(`Checking status for: ${appNumber}`);
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${this.baseURL}/${endpoint}/${appNumber}`);
                    console.log(`✅ ${endpoint}:`);
                    console.log(JSON.stringify(response.data, null, 2));
                    console.log('');
                } catch (err) {
                    console.log(`❌ ${endpoint}: ${err.response?.data?.error || err.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ Status check failed: ${error.message}\n`);
        }
    }

    /**
     * Run complete E2E test
     */
    async runCompleteE2ETest() {
        console.log('\n🚀 Running Complete End-to-End Test');
        console.log('This will create two applications and process them through all stages...\n');
        
        const confirm = await this.prompt('Continue? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('Test cancelled.\n');
            return;
        }

        try {
            // Import and run the comprehensive test
            const ComprehensiveE2ETest = require('./comprehensive-end-to-end-test');
            const test = new ComprehensiveE2ETest();
            await test.runTest();
        } catch (error) {
            console.error(`❌ E2E test failed: ${error.message}\n`);
        }
    }

    /**
     * Select application helper
     */
    async selectApplication() {
        console.log('Available Applications:');
        console.log(`1. Approved: ${this.currentApplications.approved || 'None'}`);
        console.log(`2. Rejected: ${this.currentApplications.rejected || 'None'}`);
        console.log('3. Enter custom application number');
        
        const choice = await this.prompt('Select application (1-3): ');
        
        switch (choice) {
            case '1':
                if (!this.currentApplications.approved) {
                    console.log('❌ No approved application available. Create one first.\n');
                    return null;
                }
                return this.currentApplications.approved;
            case '2':
                if (!this.currentApplications.rejected) {
                    console.log('❌ No rejected application available. Create one first.\n');
                    return null;
                }
                return this.currentApplications.rejected;
            case '3':
                return await this.prompt('Enter application number: ');
            default:
                console.log('❌ Invalid choice.\n');
                return null;
        }
    }

    /**
     * Prompt helper
     */
    prompt(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }

    /**
     * Get approved applicant data
     */
    getApprovedApplicantData() {
        return {
            // Using the correct field names expected by the API
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
     * Get approved loan application data
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
     * Get rejected applicant data
     */
    getRejectedApplicantData() {
        return {
            // Using the correct field names expected by the API
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
     * Get rejected loan application data
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
}

// Run if called directly
if (require.main === module) {
    const tester = new ManualStageTesting();
    tester.runInteractiveTest().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ManualStageTesting;
