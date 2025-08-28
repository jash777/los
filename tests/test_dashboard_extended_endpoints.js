/**
 * Test Extended Dashboard Endpoints
 * Verify all dashboard API endpoints including legacy endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/dashboard';

async function testExtendedDashboardEndpoints() {
    console.log('🧪 Testing Extended Dashboard Endpoints');
    console.log('=======================================');
    
    const tests = [
        // Health Check
        {
            name: 'Health Check',
            endpoint: '/health',
            method: 'GET'
        },
        
        // LOS Dashboard endpoints
        {
            name: 'LOS Dashboard Overview',
            endpoint: '/los/overview',
            method: 'GET'
        },
        {
            name: 'Applications List (LOS)',
            endpoint: '/los/applications?limit=10',
            method: 'GET'
        },
        {
            name: 'LOS Analytics - Applications Trend',
            endpoint: '/los/analytics?type=applications_trend&period=7d',
            method: 'GET'
        },
        {
            name: 'LOS Analytics - CIBIL Distribution',
            endpoint: '/los/analytics?type=cibil_distribution',
            method: 'GET'
        },
        {
            name: 'LOS Analytics - Processing Time',
            endpoint: '/los/analytics?type=processing_time',
            method: 'GET'
        },
        
        // LMS Dashboard endpoints
        {
            name: 'LMS Dashboard Overview',
            endpoint: '/lms/overview',
            method: 'GET'
        },
        {
            name: 'Loans List (LMS)',
            endpoint: '/lms/loans?limit=10',
            method: 'GET'
        },
        {
            name: 'LMS Analytics - Revenue Analytics',
            endpoint: '/lms/analytics?type=revenue_analytics',
            method: 'GET'
        },
        
        // Legacy Dashboard endpoints
        {
            name: 'Recent Activities',
            endpoint: '/dashboard/recent-activities?limit=5',
            method: 'GET'
        },
        {
            name: 'Dashboard Stats',
            endpoint: '/dashboard/stats',
            method: 'GET'
        },
        {
            name: 'Status Distribution',
            endpoint: '/dashboard/status-distribution',
            method: 'GET'
        },
        {
            name: 'Disbursement Trends',
            endpoint: '/dashboard/disbursement-trends?period=7d',
            method: 'GET'
        },
        {
            name: 'Risk Distribution',
            endpoint: '/dashboard/risk-distribution',
            method: 'GET'
        },
        
        // Combined Dashboard
        {
            name: 'Combined Dashboard',
            endpoint: '/combined',
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
                        console.log(`   📊 Overview: Total Apps: ${data.overview.total_applications}`);
                    } else if (data.applications) {
                        console.log(`   📋 Applications: ${data.applications.length} found`);
                    } else if (Array.isArray(data)) {
                        console.log(`   📈 Data Points: ${data.length} items`);
                        if (data.length > 0 && data[0].date) {
                            console.log(`   📅 Date Range: ${data[0].date} to ${data[data.length - 1].date}`);
                        }
                    } else if (data.total_applications !== undefined) {
                        console.log(`   📊 Stats: Total Apps: ${data.total_applications}`);
                    } else if (data.pending !== undefined) {
                        console.log(`   📊 Status: Pending: ${data.pending}, Approved: ${data.approved}`);
                    } else if (data.low_risk !== undefined) {
                        console.log(`   🎯 Risk: Low: ${data.low_risk}, Medium: ${data.medium_risk}, High: ${data.high_risk}`);
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
        console.log('\n🎉 All extended dashboard endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some extended dashboard endpoints need attention.');
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

// Test data validation
async function testDataValidation() {
    console.log('\n🔍 Testing Data Validation');
    console.log('==========================');
    
    const validationTests = [
        {
            name: 'Invalid Analytics Type',
            endpoint: '/los/analytics?type=invalid_type',
            expectedStatus: 400
        },
        {
            name: 'Invalid Period',
            endpoint: '/los/analytics?type=applications_trend&period=invalid',
            expectedStatus: 200 // Should still work with default period
        },
        {
            name: 'Negative Limit',
            endpoint: '/los/applications?limit=-10',
            expectedStatus: 200 // Should work with default limit
        }
    ];

    for (const test of validationTests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   Endpoint: GET ${test.endpoint}`);
            
            const response = await axios.get(`${BASE_URL}${test.endpoint}`);
            
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

// Run the tests
async function runTests() {
    try {
        await testExtendedDashboardEndpoints();
        await testApplicationDetails();
        await testDataValidation();
        
        console.log('\n🏁 Extended Dashboard API Testing Complete!');
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
        console.log('   GET  /api/dashboard/dashboard/recent-activities');
        console.log('   GET  /api/dashboard/dashboard/stats');
        console.log('   GET  /api/dashboard/dashboard/status-distribution');
        console.log('   GET  /api/dashboard/dashboard/disbursement-trends');
        console.log('   GET  /api/dashboard/dashboard/risk-distribution');
        
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
