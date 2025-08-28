/**
 * Test Dashboard Endpoints
 * Verify all dashboard API endpoints are working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/dashboard';

async function testDashboardEndpoints() {
    console.log('🧪 Testing Dashboard Endpoints');
    console.log('==============================');
    
    const tests = [
        {
            name: 'Health Check',
            endpoint: '/health',
            method: 'GET'
        },
        {
            name: 'LOS Dashboard Overview',
            endpoint: '/los/overview',
            method: 'GET'
        },
        {
            name: 'LMS Dashboard Overview',
            endpoint: '/lms/overview',
            method: 'GET'
        },
        {
            name: 'Applications List (LOS)',
            endpoint: '/los/applications?limit=10',
            method: 'GET'
        },
        {
            name: 'Loans List (LMS)',
            endpoint: '/lms/loans?limit=10',
            method: 'GET'
        },
        {
            name: 'Applications Trend Analytics',
            endpoint: '/los/analytics?type=applications_trend&period=7d',
            method: 'GET'
        },
        {
            name: 'CIBIL Distribution Analytics',
            endpoint: '/los/analytics?type=cibil_distribution',
            method: 'GET'
        },
        {
            name: 'Processing Time Analytics',
            endpoint: '/los/analytics?type=processing_time',
            method: 'GET'
        },
        {
            name: 'Revenue Analytics',
            endpoint: '/lms/analytics?type=revenue_analytics',
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
                
                // Show some key data for verification
                if (response.data.data) {
                    const data = response.data.data;
                    if (data.overview) {
                        console.log(`   📊 Overview: ${JSON.stringify(data.overview, null, 2)}`);
                    } else if (data.applications) {
                        console.log(`   📋 Applications: ${data.applications.length} found`);
                        if (data.pagination) {
                            console.log(`   📄 Pagination: ${data.pagination.total} total, ${data.pagination.limit} per page`);
                        }
                    } else if (Array.isArray(data)) {
                        console.log(`   📈 Trend Data: ${data.length} data points`);
                    } else {
                        console.log(`   📊 Data Keys: ${Object.keys(data).join(', ')}`);
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
        console.log('\n🎉 All dashboard endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some dashboard endpoints need attention.');
    }
}

// Test specific application details if available
async function testApplicationDetails() {
    console.log('\n🔍 Testing Application Details Endpoint');
    console.log('=====================================');
    
    try {
        // First get applications list to find an application number
        const listResponse = await axios.get(`${BASE_URL}/los/applications?limit=1`);
        
        if (listResponse.data.success && listResponse.data.data.applications.length > 0) {
            const applicationNumber = listResponse.data.data.applications[0].application_number;
            
            console.log(`📋 Testing with application: ${applicationNumber}`);
            
            const detailsResponse = await axios.get(`${BASE_URL}/los/applications/${applicationNumber}`);
            
            if (detailsResponse.data.success) {
                console.log('✅ Application Details Endpoint Working');
                console.log(`   Application: ${detailsResponse.data.data.application_info.application_number}`);
                console.log(`   Status: ${detailsResponse.data.data.application_info.status}`);
                console.log(`   Stage: ${detailsResponse.data.data.application_info.current_stage}`);
            } else {
                console.log('❌ Application Details Endpoint Failed');
            }
        } else {
            console.log('⚠️  No applications found to test details endpoint');
        }
        
    } catch (error) {
        console.log(`❌ Application Details Test Failed: ${error.message}`);
    }
}

// Run the tests
async function runTests() {
    try {
        await testDashboardEndpoints();
        await testApplicationDetails();
        
        console.log('\n🏁 Dashboard API Testing Complete!');
        console.log('\n📋 Available Dashboard Endpoints:');
        console.log('   GET  /api/dashboard/health');
        console.log('   GET  /api/dashboard/los/overview');
        console.log('   GET  /api/dashboard/lms/overview');
        console.log('   GET  /api/dashboard/los/applications');
        console.log('   GET  /api/dashboard/lms/loans');
        console.log('   GET  /api/dashboard/los/applications/:applicationNumber');
        console.log('   GET  /api/dashboard/lms/loans/:applicationNumber');
        console.log('   GET  /api/dashboard/los/analytics?type=<type>&period=<period>');
        console.log('   GET  /api/dashboard/lms/analytics?type=<type>&period=<period>');
        console.log('   GET  /api/dashboard/combined');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
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
        await runTests();
    }
}

main();
