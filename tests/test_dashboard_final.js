const axios = require('axios');

// Configure axios
const api = axios.create({
    baseURL: 'http://localhost:3000/api/dashboard',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': 'final-test-' + Date.now()
    }
});

console.log('🎯 Final Dashboard API Testing');
console.log('==============================\n');

async function testEndpoint(name, endpoint) {
    try {
        console.log(`🔍 Testing: ${name}`);
        console.log(`   Endpoint: ${endpoint}`);
        
        const response = await api.get(endpoint);
        
        if (response.status === 200 && response.data.success) {
            console.log(`   ✅ PASSED - Status: ${response.status}`);
            
            // Show key metrics
            const data = response.data.data;
            if (data) {
                if (Array.isArray(data)) {
                    console.log(`   📊 Items: ${data.length}`);
                    if (data.length > 0 && data[0].date) {
                        console.log(`   📅 Date Range: ${data[0].date} to ${data[data.length - 1].date}`);
                    }
                } else if (data.overview) {
                    console.log(`   📈 Total Applications: ${data.overview.total_applications || 'N/A'}`);
                    console.log(`   💰 Total Loan Amount: ${data.overview.total_loan_amount || 'N/A'}`);
                } else if (data.total_applications) {
                    console.log(`   📈 Total Applications: ${data.total_applications}`);
                }
            }
            
            return true;
        } else {
            console.log(`   ❌ FAILED - Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ FAILED - Error: ${error.message}`);
        return false;
    }
    console.log('');
}

async function runFinalTests() {
    let passed = 0;
    let total = 0;
    
    const tests = [
        { name: 'Health Check', endpoint: '/health' },
        { name: 'LOS Overview', endpoint: '/los/overview' },
        { name: 'LOS Applications List', endpoint: '/los/applications?limit=10' },
        { name: 'LOS Analytics - CIBIL Distribution', endpoint: '/los/analytics?type=cibil_distribution' },
        { name: 'LOS Analytics - Processing Time', endpoint: '/los/analytics?type=processing_time' },
        { name: 'LOS Analytics - Applications Trend', endpoint: '/los/analytics?type=applications_trend&period=7d' },
        { name: 'LMS Overview', endpoint: '/lms/overview' },
        { name: 'LMS Loans List', endpoint: '/lms/loans?limit=10' },
        { name: 'LMS Analytics - Revenue', endpoint: '/lms/analytics?type=revenue_analytics' },
        { name: 'Combined Dashboard', endpoint: '/combined' },
        { name: 'Recent Activities', endpoint: '/dashboard/recent-activities?limit=5' },
        { name: 'Dashboard Stats', endpoint: '/dashboard/stats' },
        { name: 'Status Distribution', endpoint: '/dashboard/status-distribution' },
        { name: 'Disbursement Trends', endpoint: '/dashboard/disbursement-trends?period=7d' },
        { name: 'Risk Distribution', endpoint: '/dashboard/risk-distribution' }
    ];
    
    for (const test of tests) {
        const result = await testEndpoint(test.name, test.endpoint);
        if (result) passed++;
        total++;
    }
    
    // Test specific application details
    try {
        const listResponse = await api.get('/los/applications?limit=1');
        if (listResponse.data.success && listResponse.data.data.applications.length > 0) {
            const appNumber = listResponse.data.data.applications[0].application_number;
            console.log(`🔍 Testing Application Details: ${appNumber}`);
            const detailsResult = await testEndpoint('Application Details', `/los/applications/${appNumber}`);
            if (detailsResult) passed++;
            total++;
        }
    } catch (error) {
        console.log(`❌ Error testing application details: ${error.message}\n`);
    }
    
    // Summary
    console.log('📊 Final Test Summary');
    console.log('=====================');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${total - passed}`);
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All dashboard endpoints are working perfectly!');
        console.log('✅ Dashboard API is ready for production use.');
    } else {
        console.log('\n⚠️  Some endpoints need attention.');
    }
    
    // Show available endpoints
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
}

runFinalTests().catch(error => {
    console.error(`❌ Test execution failed: ${error.message}`);
    process.exit(1);
});
