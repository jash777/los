/**
 * Test Portfolio Management Endpoints
 * Verify all portfolio and co-lending API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/portfolio';

async function testPortfolioEndpoints() {
    console.log('🧪 Testing Portfolio Management Endpoints');
    console.log('==========================================');
    
    const tests = [
        // Portfolio Overview
        {
            name: 'Portfolio Overview',
            endpoint: '/overview',
            method: 'GET'
        },
        
        // Portfolio Analytics
        {
            name: 'Portfolio Analytics',
            endpoint: '/analytics?period=30d',
            method: 'GET'
        },
        
        // Portfolio History
        {
            name: 'Portfolio History',
            endpoint: '/history?limit=10',
            method: 'GET'
        },
        
        // Co-lending Configuration
        {
            name: 'Co-lending Configuration',
            endpoint: '/co-lending/config',
            method: 'GET'
        },
        
        // Bank Accounts
        {
            name: 'Bank Accounts',
            endpoint: '/bank-accounts',
            method: 'GET'
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
            
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.endpoint}`,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
            });

            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ PASSED - Status: ${response.status}`);
                
                // Show key data for verification
                if (response.data.data) {
                    const data = response.data.data;
                    if (data.portfolio) {
                        console.log(`   📊 Portfolio: Limit: ₹${(data.portfolio.total_limit/10000000).toFixed(2)}Cr, Utilized: ${data.portfolio.utilization_percentage}%`);
                    } else if (data.portfolio_metrics) {
                        console.log(`   📈 Analytics: Utilization: ${data.portfolio_metrics.utilization_percentage}%`);
                    } else if (data.history) {
                        console.log(`   📋 History: ${data.history.length} entries`);
                    } else if (data.nbfc_ratio) {
                        console.log(`   🤝 Co-lending: NBFC: ${data.nbfc_ratio}%, Bank: ${data.bank_ratio}%`);
                    } else if (data.accounts) {
                        console.log(`   🏦 Bank Accounts: ${data.accounts.length} accounts, Total: ₹${(data.summary.total_balance/10000000).toFixed(2)}Cr`);
                    }
                }
                
                passedTests++;
            } else {
                console.log(`   ❌ FAILED - Status: ${response.status}`);
                console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            }

        } catch (error) {
            console.log(`   ❌ FAILED - Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
    }

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 All portfolio endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some portfolio endpoints need attention.');
    }
}

async function testPortfolioUpdates() {
    console.log('\n🔄 Testing Portfolio Update Operations');
    console.log('=====================================');
    
    const updateTests = [
        {
            name: 'Update Portfolio Limit',
            endpoint: '/limit',
            method: 'PUT',
            data: {
                new_limit: 25000000, // 2.5 Cr
                reason: 'Portfolio expansion for increased lending capacity'
            }
        },
        {
            name: 'Update Co-lending Configuration',
            endpoint: '/co-lending/config',
            method: 'PUT',
            data: {
                nbfc_ratio: 25,
                bank_ratio: 75,
                nbfc_partner: 'Updated NBFC Partner',
                bank_partner: 'Updated Bank Partner'
            }
        },
        {
            name: 'Add Bank Account',
            endpoint: '/bank-accounts',
            method: 'POST',
            data: {
                account_name: 'New Investment Account',
                bank_name: 'Axis Bank',
                account_number: 'XXXX9999',
                account_type: 'Savings',
                balance: 3000000,
                currency: 'INR'
            }
        }
    ];

    let passedUpdates = 0;
    let totalUpdates = updateTests.length;

    for (const test of updateTests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
            
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.endpoint}`,
                data: test.data,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
            });

            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ PASSED - Status: ${response.status}`);
                console.log(`   📝 Update: ${response.data.data.message || 'Operation successful'}`);
                passedUpdates++;
            } else {
                console.log(`   ❌ FAILED - Status: ${response.status}`);
                console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            }

        } catch (error) {
            console.log(`   ❌ FAILED - Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
    }

    console.log(`\n📊 Update Test Summary:`);
    console.log(`   Total Updates: ${totalUpdates}`);
    console.log(`   Passed: ${passedUpdates}`);
    console.log(`   Failed: ${totalUpdates - passedUpdates}`);
    console.log(`   Success Rate: ${((passedUpdates / totalUpdates) * 100).toFixed(2)}%`);
}

async function testPortfolioValidation() {
    console.log('\n🔍 Testing Portfolio Validation');
    console.log('===============================');
    
    const validationTests = [
        {
            name: 'Invalid Portfolio Limit (Negative)',
            endpoint: '/limit',
            method: 'PUT',
            data: { new_limit: -1000000 },
            expectedStatus: 400
        },
        {
            name: 'Invalid Co-lending Ratios (Not 100%)',
            endpoint: '/co-lending/config',
            method: 'PUT',
            data: { nbfc_ratio: 30, bank_ratio: 80 },
            expectedStatus: 400
        },
        {
            name: 'Missing Bank Account Fields',
            endpoint: '/bank-accounts',
            method: 'POST',
            data: { account_name: 'Test Account' },
            expectedStatus: 400
        }
    ];

    for (const test of validationTests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
            
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.endpoint}`,
                data: test.data,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
            });
            
            if (response.status === test.expectedStatus) {
                console.log(`   ✅ PASSED - Expected Status: ${test.expectedStatus}, Got: ${response.status}`);
            } else {
                console.log(`   ⚠️  UNEXPECTED - Expected: ${test.expectedStatus}, Got: ${response.status}`);
            }
            
        } catch (error) {
            if (error.response && error.response.status === test.expectedStatus) {
                console.log(`   ✅ PASSED - Expected Error Status: ${test.expectedStatus}`);
            } else {
                console.log(`   ❌ FAILED - Unexpected Error: ${error.message}`);
            }
        }
    }
}

async function runPortfolioTests() {
    try {
        await testPortfolioEndpoints();
        await testPortfolioUpdates();
        await testPortfolioValidation();
        
        console.log('\n🏁 Portfolio Management API Testing Complete!');
        console.log('\n📋 Available Portfolio Endpoints:');
        console.log('   GET  /api/portfolio/overview');
        console.log('   GET  /api/portfolio/analytics');
        console.log('   GET  /api/portfolio/history');
        console.log('   PUT  /api/portfolio/limit');
        console.log('   GET  /api/portfolio/co-lending/config');
        console.log('   PUT  /api/portfolio/co-lending/config');
        console.log('   GET  /api/portfolio/bank-accounts');
        console.log('   POST /api/portfolio/bank-accounts');
        console.log('   PUT  /api/portfolio/bank-accounts/:account_id/balance');
        
    } catch (error) {
        console.error('❌ Portfolio test execution failed:', error.message);
    }
}

// Check if server is running before testing
async function checkServerHealth() {
    try {
        const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        if (response.status === 200) {
            console.log('✅ Server is running and healthy');
            return true;
        }
    } catch (error) {
        console.log('❌ Server is not running or not accessible');
        console.log('   Please start the server with: npm start');
        return false;
    }
}

// Main execution
async function main() {
    const serverHealthy = await checkServerHealth();
    if (serverHealthy) {
        await runPortfolioTests();
    }
}

main();
