const axios = require('axios');

// Configure axios
const api = axios.create({
    baseURL: 'http://localhost:3000/api/dashboard',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': 'test-' + Date.now()
    }
});

// Test colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}🧪 Comprehensive Dashboard API Testing${colors.reset}`);
console.log('=====================================\n');

async function testEndpoint(name, endpoint, expectedKeys = []) {
    try {
        console.log(`${colors.cyan}🔍 Testing: ${name}${colors.reset}`);
        console.log(`   Endpoint: ${endpoint}`);
        
        const response = await api.get(endpoint);
        
        if (response.status === 200 && response.data.success) {
            console.log(`   ${colors.green}✅ PASSED - Status: ${response.status}${colors.reset}`);
            
            if (expectedKeys.length > 0) {
                const dataKeys = Object.keys(response.data.data || {});
                const missingKeys = expectedKeys.filter(key => !dataKeys.includes(key));
                
                if (missingKeys.length === 0) {
                    console.log(`   📊 Data Keys: ${expectedKeys.join(', ')}`);
                } else {
                    console.log(`   ${colors.yellow}⚠️  Missing Keys: ${missingKeys.join(', ')}${colors.reset}`);
                }
            }
            
            // Show sample data
            const data = response.data.data;
            if (data && typeof data === 'object') {
                if (Array.isArray(data)) {
                    console.log(`   📋 Items: ${data.length} found`);
                    if (data.length > 0) {
                        console.log(`   📄 Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
                    }
                } else {
                    const sampleKeys = Object.keys(data).slice(0, 3);
                    console.log(`   📄 Sample Keys: ${sampleKeys.join(', ')}`);
                }
            }
            
            return true;
        } else {
            console.log(`   ${colors.red}❌ FAILED - Status: ${response.status}${colors.reset}`);
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            return false;
        }
    } catch (error) {
        console.log(`   ${colors.red}❌ FAILED - Error: ${error.message}${colors.reset}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return false;
    }
    console.log('');
}

async function testDataValidation() {
    console.log(`${colors.bright}${colors.yellow}🔍 Testing Data Validation${colors.reset}`);
    console.log('==========================\n');
    
    // Test with invalid parameters
    await testEndpoint('Invalid Analytics Type', '/los/analytics?type=invalid_type');
    await testEndpoint('Invalid Period', '/los/analytics?type=applications_trend&period=invalid');
    await testEndpoint('Negative Limit', '/los/applications?limit=-10');
    await testEndpoint('Large Limit', '/los/applications?limit=1000');
}

async function testSpecificApplication() {
    console.log(`${colors.bright}${colors.magenta}🔍 Testing Specific Application${colors.reset}`);
    console.log('==============================\n');
    
    try {
        // First get list of applications
        const listResponse = await api.get('/los/applications?limit=1');
        if (listResponse.data.success && listResponse.data.data.applications.length > 0) {
            const appNumber = listResponse.data.data.applications[0].application_number;
            
            console.log(`${colors.cyan}📋 Testing with application: ${appNumber}${colors.reset}`);
            
            // Test application details
            await testEndpoint('Application Details', `/los/applications/${appNumber}`, [
                'application_info', 'stage_1_data', 'stage_2_data'
            ]);
            
            // Test loan details
            await testEndpoint('Loan Details', `/lms/loans/${appNumber}`, [
                'application_info', 'stage_1_data', 'stage_2_data'
            ]);
            
        } else {
            console.log(`${colors.red}❌ No applications found to test${colors.reset}\n`);
        }
    } catch (error) {
        console.log(`${colors.red}❌ Error testing specific application: ${error.message}${colors.reset}\n`);
    }
}

async function testDataStructure() {
    console.log(`${colors.bright}${colors.green}🔍 Testing Data Structure Validation${colors.reset}`);
    console.log('=====================================\n');
    
    try {
        // Test LOS Overview structure
        const losResponse = await api.get('/los/overview');
        if (losResponse.data.success) {
            const data = losResponse.data.data;
            console.log(`${colors.cyan}📊 LOS Overview Structure:${colors.reset}`);
            console.log(`   - Overview: ${Object.keys(data.overview || {}).length} fields`);
            console.log(`   - Status Distribution: ${Object.keys(data.status_distribution || {}).length} fields`);
            console.log(`   - Stage Distribution: ${Object.keys(data.stage_distribution || {}).length} fields`);
            console.log(`   - CIBIL Analytics: ${Object.keys(data.cibil_analytics || {}).length} fields`);
            console.log(`   - Loan Analytics: ${Object.keys(data.loan_analytics || {}).length} fields`);
            console.log(`   - Processing Analytics: ${Object.keys(data.processing_analytics || {}).length} fields`);
        }
        
        // Test LMS Overview structure
        const lmsResponse = await api.get('/lms/overview');
        if (lmsResponse.data.success) {
            const data = lmsResponse.data.data;
            console.log(`\n${colors.cyan}📊 LMS Overview Structure:${colors.reset}`);
            console.log(`   - Portfolio Overview: ${Object.keys(data.portfolio_overview || {}).length} fields`);
            console.log(`   - Performance Metrics: ${Object.keys(data.performance_metrics || {}).length} fields`);
            console.log(`   - Customer Analytics: ${Object.keys(data.customer_analytics || {}).length} fields`);
            console.log(`   - Financial Analytics: ${Object.keys(data.financial_analytics || {}).length} fields`);
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Error testing data structure: ${error.message}${colors.reset}`);
    }
    console.log('');
}

async function runAllTests() {
    let passed = 0;
    let total = 0;
    
    // Test main dashboard endpoints
    const mainTests = [
        { name: 'Health Check', endpoint: '/health', keys: ['status', 'service', 'version'] },
        { name: 'LOS Overview', endpoint: '/los/overview', keys: ['overview', 'status_distribution', 'stage_distribution'] },
        { name: 'LOS Applications List', endpoint: '/los/applications?limit=5', keys: ['applications', 'pagination'] },
        { name: 'LOS Analytics - CIBIL Distribution', endpoint: '/los/analytics?type=cibil_distribution', keys: ['average_score', 'distribution'] },
        { name: 'LOS Analytics - Processing Time', endpoint: '/los/analytics?type=processing_time', keys: ['average_time', 'time_distribution'] },
        { name: 'LOS Analytics - Applications Trend', endpoint: '/los/analytics?type=applications_trend&period=7d', keys: ['trend_data'] },
        { name: 'LMS Overview', endpoint: '/lms/overview', keys: ['portfolio_overview', 'performance_metrics'] },
        { name: 'LMS Loans List', endpoint: '/lms/loans?limit=5', keys: ['loans', 'pagination'] },
        { name: 'LMS Analytics - Revenue', endpoint: '/lms/analytics?type=revenue_analytics', keys: ['total_revenue', 'revenue_breakdown'] },
        { name: 'Combined Dashboard', endpoint: '/combined', keys: ['overview', 'los_data', 'lms_data'] },
        { name: 'Recent Activities', endpoint: '/dashboard/recent-activities?limit=5', keys: [] },
        { name: 'Dashboard Stats', endpoint: '/dashboard/stats', keys: ['total_applications', 'total_loan_amount'] },
        { name: 'Status Distribution', endpoint: '/dashboard/status-distribution', keys: ['pending', 'approved', 'rejected'] },
        { name: 'Disbursement Trends', endpoint: '/dashboard/disbursement-trends?period=7d', keys: [] },
        { name: 'Risk Distribution', endpoint: '/dashboard/risk-distribution', keys: ['low_risk', 'medium_risk', 'high_risk'] }
    ];
    
    for (const test of mainTests) {
        const result = await testEndpoint(test.name, test.endpoint, test.keys);
        if (result) passed++;
        total++;
    }
    
    // Test specific application
    await testSpecificApplication();
    
    // Test data validation
    await testDataValidation();
    
    // Test data structure
    await testDataStructure();
    
    // Summary
    console.log(`${colors.bright}${colors.blue}📊 Test Summary:${colors.reset}`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`   Failed: ${colors.red}${total - passed}${colors.reset}`);
    console.log(`   Success Rate: ${colors.bright}${((passed / total) * 100).toFixed(1)}%${colors.reset}`);
    
    if (passed === total) {
        console.log(`\n${colors.bright}${colors.green}🎉 All dashboard endpoints are working correctly!${colors.reset}`);
    } else {
        console.log(`\n${colors.bright}${colors.yellow}⚠️  Some endpoints need attention.${colors.reset}`);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
});
