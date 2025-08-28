/**
 * Rate Limiting Test
 * Tests API endpoints to ensure rate limiting is relaxed for frontend development
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testRateLimiting() {
    console.log('🧪 Testing Rate Limiting Configuration');
    console.log('=====================================');
    
    const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        rateLimitInfo: {}
    };

    try {
        // Test 1: Multiple rapid requests to dashboard endpoints
        console.log('\n📊 Test 1: Multiple Dashboard API Calls');
        console.log('=======================================');
        results.totalTests++;
        
        const dashboardEndpoints = [
            '/dashboard/health',
            '/dashboard/los/overview',
            '/dashboard/lms/overview',
            '/dashboard/los/applications?limit=5',
            '/dashboard/dashboard/recent-activities',
            '/dashboard/dashboard/stats'
        ];

        const promises = dashboardEndpoints.map(async (endpoint, index) => {
            try {
                const response = await axios.get(`${API_BASE_URL}${endpoint}`);
                return {
                    endpoint,
                    success: true,
                    status: response.status,
                    rateLimitHeaders: {
                        'X-RateLimit-Limit': response.headers['x-ratelimit-limit'],
                        'X-RateLimit-Remaining': response.headers['x-ratelimit-remaining'],
                        'X-RateLimit-Reset': response.headers['x-ratelimit-reset']
                    }
                };
            } catch (error) {
                return {
                    endpoint,
                    success: false,
                    status: error.response?.status,
                    error: error.message,
                    rateLimitHeaders: error.response?.headers ? {
                        'X-RateLimit-Limit': error.response.headers['x-ratelimit-limit'],
                        'X-RateLimit-Remaining': error.response.headers['x-ratelimit-remaining'],
                        'X-RateLimit-Reset': error.response.headers['x-ratelimit-reset']
                    } : null
                };
            }
        });

        const responses = await Promise.all(promises);
        
        let successCount = 0;
        let rateLimitHeadersFound = false;
        
        responses.forEach((response, index) => {
            console.log(`   ${index + 1}. ${response.endpoint}: ${response.success ? '✅' : '❌'} (${response.status})`);
            
            if (response.success) {
                successCount++;
            }
            
            if (response.rateLimitHeaders && Object.values(response.rateLimitHeaders).some(h => h)) {
                rateLimitHeadersFound = true;
                console.log(`      Rate Limit Headers:`, response.rateLimitHeaders);
            }
        });

        console.log(`\n   Results: ${successCount}/${responses.length} requests successful`);
        
        if (successCount === responses.length) {
            console.log('✅ All dashboard requests succeeded - Rate limiting is relaxed');
            results.passedTests++;
        } else {
            console.log('❌ Some requests failed - Rate limiting may still be too restrictive');
            results.failedTests++;
        }

        // Test 2: Rapid successive calls to same endpoint
        console.log('\n📊 Test 2: Rapid Successive Calls');
        console.log('=================================');
        results.totalTests++;
        
        const rapidCalls = [];
        for (let i = 0; i < 20; i++) {
            rapidCalls.push(
                axios.get(`${API_BASE_URL}/dashboard/health`)
                    .then(response => ({ success: true, status: response.status }))
                    .catch(error => ({ success: false, status: error.response?.status, error: error.message }))
            );
        }

        const rapidResults = await Promise.all(rapidCalls);
        const rapidSuccessCount = rapidResults.filter(r => r.success).length;
        
        console.log(`   Made 20 rapid calls to /dashboard/health`);
        console.log(`   Successful: ${rapidSuccessCount}/20`);
        
        if (rapidSuccessCount >= 18) { // Allow 2 failures for network issues
            console.log('✅ Rapid successive calls working - Rate limiting is properly configured');
            results.passedTests++;
        } else {
            console.log('❌ Too many rapid calls failed - Rate limiting may be too restrictive');
            results.failedTests++;
        }

        // Test 3: Check rate limiting configuration
        console.log('\n📊 Test 3: Rate Limiting Configuration Check');
        console.log('===========================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/health`);
            
            // Check if rate limiting headers are present
            const hasRateLimitHeaders = response.headers['x-ratelimit-limit'] || 
                                      response.headers['x-ratelimit-remaining'] ||
                                      response.headers['x-ratelimit-reset'];
            
            if (hasRateLimitHeaders) {
                console.log('✅ Rate limiting is enabled with headers:');
                console.log(`   Limit: ${response.headers['x-ratelimit-limit']}`);
                console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
                console.log(`   Reset: ${response.headers['x-ratelimit-reset']}`);
                
                const limit = parseInt(response.headers['x-ratelimit-limit']);
                if (limit >= 1000) {
                    console.log('✅ Rate limit is high enough for frontend development');
                    results.passedTests++;
                } else {
                    console.log('⚠️ Rate limit might be too low for frontend development');
                    results.failedTests++;
                }
            } else {
                console.log('✅ Rate limiting appears to be disabled (no headers)');
                console.log('✅ This is optimal for frontend development');
                results.passedTests++;
            }
            
        } catch (error) {
            console.log('❌ Failed to check rate limiting configuration:', error.message);
            results.failedTests++;
        }

        // Final Summary
        console.log('\n📋 RATE LIMITING TEST SUMMARY');
        console.log('=============================');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        if (results.failedTests === 0) {
            console.log('\n🎉 RATE LIMITING IS PROPERLY CONFIGURED!');
            console.log('✅ API endpoints are accessible for frontend development');
            console.log('✅ Rate limiting is either disabled or very lenient');
            console.log('✅ Frontend should be able to pull data smoothly');
        } else {
            console.log('\n⚠️ RATE LIMITING MAY STILL BE TOO RESTRICTIVE');
            console.log('💡 Consider disabling rate limiting entirely for development');
        }
        
        return results;
        
    } catch (error) {
        console.log('\n❌ Rate limiting test failed:', error.message);
        return {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests + 1,
            error: error.message
        };
    }
}

// Run the tests
testRateLimiting().catch(console.error);
