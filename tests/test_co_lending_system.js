/**
 * Comprehensive Co-Lending System Test
 * Test all co-lending endpoints and functionality
 */

const axios = require('axios');
const logger = require('../src/utils/logger');

const BASE_URL = 'http://localhost:3000/api';

class CoLendingSystemTest {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        logger.info(`\n🧪 Running test: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.testResults.passed++;
                logger.info(`✅ ${testName} - PASSED`);
                this.testResults.tests.push({ name: testName, status: 'PASSED', details: result.details });
            } else {
                this.testResults.failed++;
                logger.error(`❌ ${testName} - FAILED: ${result.error}`);
                this.testResults.tests.push({ name: testName, status: 'FAILED', error: result.error });
            }
        } catch (error) {
            this.testResults.failed++;
            logger.error(`❌ ${testName} - ERROR: ${error.message}`);
            this.testResults.tests.push({ name: testName, status: 'ERROR', error: error.message });
        }
    }

    async testCoLendingHealth() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/health`);
            
            if (response.status === 200 && response.data.success) {
                return {
                    success: true,
                    details: `Service healthy - ${response.data.features ? Object.keys(response.data.features).length : 0} features available`
                };
            } else {
                return { success: false, error: 'Health check failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testGetPartners() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/partners`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Found ${data.total_count} partners (${data.banks_count} banks, ${data.nbfcs_count} NBFCs)`
                };
            } else {
                return { success: false, error: 'Failed to get partners' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testCreatePartner() {
        try {
            const newPartner = {
                partner_code: 'TEST_BANK_001',
                partner_name: 'Test Bank Limited',
                partner_type: 'bank',
                license_number: 'BL123456789',
                regulatory_authority: 'RBI',
                contact_details: {
                    email: 'test@testbank.com',
                    phone: '+91-22-12345678',
                    contact_person: 'Test Manager'
                },
                risk_rating: 'A',
                minimum_ticket_size: 100000,
                maximum_ticket_size: 5000000,
                status: 'active'
            };

            const response = await axios.post(`${BASE_URL}/co-lending/partners`, newPartner);
            
            if (response.status === 201 && response.data.success) {
                return {
                    success: true,
                    details: `Created partner: ${response.data.data.partner_name}`
                };
            } else {
                return { success: false, error: 'Failed to create partner' };
            }
        } catch (error) {
            if (error.response?.status === 409) {
                return { success: true, details: 'Partner already exists (expected)' };
            }
            return { success: false, error: error.message };
        }
    }

    async testGetRatios() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/ratios`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Found ${data.total_count} ratio rules (${data.active_count} active)`
                };
            } else {
                return { success: false, error: 'Failed to get ratios' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testOptimalArrangement() {
        try {
            const loanRequest = {
                loan_amount: 500000,
                cibil_score: 750,
                loan_purpose: 'personal'
            };

            const response = await axios.post(`${BASE_URL}/co-lending/optimal-arrangement`, loanRequest);
            
            if (response.status === 200 && response.data.success) {
                const arrangement = response.data.data;
                return {
                    success: true,
                    details: `Optimal: ${arrangement.bank_partner.name} (${arrangement.bank_ratio}%) + ${arrangement.nbfc_partner.name} (${arrangement.nbfc_ratio}%)`
                };
            } else {
                return { success: false, error: 'Failed to get optimal arrangement' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testCreateTransaction() {
        try {
            // First get optimal arrangement
            const loanRequest = {
                loan_amount: 750000,
                cibil_score: 780,
                loan_purpose: 'home_improvement'
            };

            const arrangementResponse = await axios.post(`${BASE_URL}/co-lending/optimal-arrangement`, loanRequest);
            
            if (!arrangementResponse.data.success) {
                return { success: false, error: 'Failed to get arrangement for transaction' };
            }

            const arrangement = arrangementResponse.data.data;

            // Create transaction
            const transactionRequest = {
                application_number: `TEST_APP_${Date.now()}`,
                loan_amount: loanRequest.loan_amount,
                arrangement: arrangement
            };

            const response = await axios.post(`${BASE_URL}/co-lending/transactions`, transactionRequest);
            
            if (response.status === 201 && response.data.success) {
                // Store transaction ID for later tests
                this.testTransactionId = response.data.data.transaction_id;
                return {
                    success: true,
                    details: `Created transaction: ${response.data.data.transaction_id}`
                };
            } else {
                return { success: false, error: 'Failed to create transaction' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testGetTransactions() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/transactions?limit=10`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Found ${data.transactions.length} transactions (Total: ${data.pagination.total})`
                };
            } else {
                return { success: false, error: 'Failed to get transactions' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testProcessDistributedLoan() {
        try {
            if (!this.testTransactionId) {
                return { success: false, error: 'No test transaction ID available' };
            }

            const response = await axios.post(`${BASE_URL}/co-lending/process/${this.testTransactionId}`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Processing result: ${data.processing_summary.overall_status} (Bank: ${data.bank_status === 'fulfilled' ? 'Success' : 'Failed'}, NBFC: ${data.nbfc_status === 'fulfilled' ? 'Success' : 'Failed'})`
                };
            } else {
                return { success: false, error: 'Failed to process distributed loan' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testAnalytics() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/analytics?date_range=30`);
            
            if (response.status === 200 && response.data.success) {
                const analytics = response.data.data;
                return {
                    success: true,
                    details: `Analytics: ${analytics.overall.total_transactions} transactions, ${analytics.partners.length} partners, ${analytics.monthly_trends.length} monthly records`
                };
            } else {
                return { success: false, error: 'Failed to get analytics' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testPortfolioAnalytics() {
        try {
            const response = await axios.get(`${BASE_URL}/co-lending/portfolio`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Portfolio: ${data.summary.total_partners} partners, ${data.summary.total_active_loans} active loans`
                };
            } else {
                return { success: false, error: 'Failed to get portfolio analytics' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testRulesEngineEndpoint() {
        try {
            const response = await axios.get(`${BASE_URL}/rules-engine`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `Rules Engine: v${data.version}, ${data.total_stages} stages, updated ${data.last_updated}`
                };
            } else {
                return { success: false, error: 'Rules engine endpoint failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testPDFEndpoints() {
        try {
            const response = await axios.get(`${BASE_URL}/pdf/list`);
            
            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                return {
                    success: true,
                    details: `PDF Service: ${data.total_applications} applications, ${data.applications_with_pdf} with PDFs`
                };
            } else {
                return { success: false, error: 'PDF endpoints failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async runAllTests() {
        logger.info('🚀 Starting Comprehensive Co-Lending System Test');
        logger.info('='.repeat(60));

        // Setup database first
        try {
            const { setupCoLendingDatabase } = require('./setup-co-lending');
            await setupCoLendingDatabase();
            logger.info('✅ Co-lending database setup completed');
        } catch (error) {
            logger.error('❌ Database setup failed:', error.message);
        }

        // Run all tests
        await this.runTest('Co-Lending Health Check', () => this.testCoLendingHealth());
        await this.runTest('Get Partners', () => this.testGetPartners());
        await this.runTest('Create Partner', () => this.testCreatePartner());
        await this.runTest('Get Ratios', () => this.testGetRatios());
        await this.runTest('Optimal Arrangement', () => this.testOptimalArrangement());
        await this.runTest('Create Transaction', () => this.testCreateTransaction());
        await this.runTest('Get Transactions', () => this.testGetTransactions());
        await this.runTest('Process Distributed Loan', () => this.testProcessDistributedLoan());
        await this.runTest('Analytics', () => this.testAnalytics());
        await this.runTest('Portfolio Analytics', () => this.testPortfolioAnalytics());
        await this.runTest('Rules Engine Endpoint', () => this.testRulesEngineEndpoint());
        await this.runTest('PDF Endpoints', () => this.testPDFEndpoints());

        // Print summary
        logger.info('\n' + '='.repeat(60));
        logger.info('🎯 TEST SUMMARY');
        logger.info('='.repeat(60));
        logger.info(`Total Tests: ${this.testResults.total}`);
        logger.info(`✅ Passed: ${this.testResults.passed}`);
        logger.info(`❌ Failed: ${this.testResults.failed}`);
        logger.info(`📊 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

        if (this.testResults.failed > 0) {
            logger.info('\n❌ Failed Tests:');
            this.testResults.tests
                .filter(test => test.status !== 'PASSED')
                .forEach(test => {
                    logger.info(`   - ${test.name}: ${test.error}`);
                });
        }

        logger.info('\n🎉 Co-Lending System Test Completed!');
        
        // Return summary
        return {
            success: this.testResults.passed === this.testResults.total,
            summary: this.testResults
        };
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new CoLendingSystemTest();
    tester.runAllTests()
        .then(result => {
            if (result.success) {
                logger.info('All tests passed! 🎉');
                process.exit(0);
            } else {
                logger.error('Some tests failed! ❌');
                process.exit(1);
            }
        })
        .catch(error => {
            logger.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = CoLendingSystemTest;
