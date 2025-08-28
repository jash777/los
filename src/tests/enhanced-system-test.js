/**
 * Enhanced System Test
 * Comprehensive testing for the Enhanced LOS system
 */

const logger = require('../utils/logger');

// Test data
const testApplications = [
    {
        name: "Valid Application - Should Approve",
        data: {
            applicantName: "JASHUVA PEYYALA",
            dateOfBirth: "1997-08-06",
            phone: "9876543210",
            panNumber: "EMMPP2177M"
        },
        expectedResult: "approved"
    },
    {
        name: "Low CIBIL Score - Should Reject",
        data: {
            applicantName: "JOHN DOE",
            dateOfBirth: "1990-01-01",
            phone: "9876543211",
            panNumber: "EMMPP2277M"
        },
        expectedResult: "rejected"
    },
    {
        name: "Invalid PAN - Should Reject",
        data: {
            applicantName: "INVALID USER",
            dateOfBirth: "1985-05-15",
            phone: "9876543212",
            panNumber: "INVALID123"
        },
        expectedResult: "rejected"
    },
    {
        name: "Fraud Detection - Should Reject",
        data: {
            applicantName: "TEST DUMMY",
            dateOfBirth: "1990-01-01",
            phone: "1234567890",
            panNumber: "AAAAA0000A"
        },
        expectedResult: "rejected"
    }
];

class EnhancedSystemTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = [];
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Enhanced LOS System Tests...\n');
        
        try {
            // Test database connection
            await this.testDatabaseConnection();
            
            // Test health check
            await this.testHealthCheck();
            
            // Test requirements endpoint
            await this.testRequirements();
            
            // Test pre-qualification processing
            for (const testCase of testApplications) {
                await this.testPreQualification(testCase);
            }
            
            // Test status retrieval
            await this.testStatusRetrieval();
            
            // Print summary
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Test database connection
     */
    async testDatabaseConnection() {
        console.log('📊 Testing Database Connection...');
        
        try {
            const DatabaseSetup = require('../database/setup');
            const setup = new DatabaseSetup();
            
            const connectionTest = await setup.test();
            console.log('✅ Database connection successful\n');
            
        } catch (error) {
            console.log('❌ Database connection test failed:', error.message);
            console.log('   Make sure MySQL is running and configured correctly\n');
            throw error;
        }
    }

    /**
     * Test health check endpoint
     */
    async testHealthCheck() {
        console.log('🏥 Testing Health Check Endpoint...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/pre-qualification/health`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Health check passed');
                console.log(`   - Version: ${data.version}`);
                console.log(`   - Status: ${data.status}`);
                console.log(`   - Features: ${data.features.length} available\n`);
            } else {
                throw new Error(`Health check failed: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
            console.log('   Make sure the server is running on port 3000\n');
            throw error;
        }
    }

    /**
     * Test requirements endpoint
     */
    async testRequirements() {
        console.log('📋 Testing Requirements Endpoint...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/pre-qualification/requirements`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Requirements endpoint working');
                console.log(`   - Version: ${data.data.version}`);
                console.log(`   - Processing Stages: ${data.data.processingStages.length}`);
                console.log(`   - Features: ${Object.keys(data.data.features).length}\n`);
            } else {
                throw new Error(`Requirements endpoint failed: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log('❌ Requirements endpoint failed:', error.message);
            throw error;
        }
    }

    /**
     * Test pre-qualification processing
     */
    async testPreQualification(testCase) {
        console.log(`🔍 Testing: ${testCase.name}...`);
        
        try {
            const response = await fetch(`${this.baseUrl}/api/pre-qualification/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testCase.data)
            });
            
            const data = await response.json();
            
            let actualResult;
            let applicationNumber;
            let processingTime;
            let cibilScore;
            let message;
            
            if (data.success === true && data.data) {
                // Success response structure
                actualResult = data.data.status;
                applicationNumber = data.data.applicationNumber;
                processingTime = data.data.processing_time_ms;
                cibilScore = data.data.cibil_score;
                message = data.data.message;
            } else if (data.success === false) {
                // Failure response structure (validation failed or rejected)
                actualResult = 'rejected';
                message = data.error || (data.details && data.details.join(', ')) || 'Unknown error';
            } else {
                // Unexpected response structure
                actualResult = 'error';
                message = 'Invalid response format';
            }
            
            const isExpected = actualResult === testCase.expectedResult;
            
            const result = {
                testName: testCase.name,
                expected: testCase.expectedResult,
                actual: actualResult,
                passed: isExpected,
                applicationNumber,
                processingTime,
                cibilScore,
                message
            };
            
            this.results.push(result);
            
            if (isExpected) {
                console.log(`✅ Test passed - Result: ${actualResult}`);
                if (applicationNumber) {
                    console.log(`   - Application Number: ${applicationNumber}`);
                }
                if (cibilScore) {
                    console.log(`   - CIBIL Score: ${cibilScore}`);
                }
                if (processingTime) {
                    console.log(`   - Processing Time: ${processingTime}ms`);
                }
            } else {
                console.log(`❌ Test failed - Expected: ${testCase.expectedResult}, Got: ${actualResult}`);
                console.log(`   - Message: ${message}`);
            }
            
        } catch (error) {
            console.log(`❌ Test failed - Error: ${error.message}`);
            this.results.push({
                testName: testCase.name,
                expected: testCase.expectedResult,
                actual: 'error',
                passed: false,
                error: error.message
            });
        }
        
        console.log('');
    }

    /**
     * Test status retrieval for approved applications
     */
    async testStatusRetrieval() {
        console.log('📊 Testing Status Retrieval...');
        
        // Find an approved application from our test results
        const approvedApp = this.results.find(r => r.actual === 'approved' && r.applicationNumber);
        
        if (!approvedApp) {
            console.log('⚠️  No approved applications found to test status retrieval\n');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/pre-qualification/status/${approvedApp.applicationNumber}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Status retrieval successful');
                console.log(`   - Application Number: ${data.data.applicationNumber}`);
                console.log(`   - Current Stage: ${data.data.currentStage}`);
                console.log(`   - Current Status: ${data.data.currentStatus}`);
                console.log(`   - Applicant: ${data.data.personalInfo.name}`);
                if (data.data.creditAssessment) {
                    console.log(`   - CIBIL Score: ${data.data.creditAssessment.cibil_score}`);
                }
            } else {
                console.log('❌ Status retrieval failed:', data.error || 'Unknown error');
            }
            
        } catch (error) {
            console.log('❌ Status retrieval failed:', error.message);
        }
        
        console.log('');
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('📈 Enhanced LOS Test Summary');
        console.log('============================');
        
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`- ${result.testName}: Expected ${result.expected}, got ${result.actual}`);
                if (result.error) {
                    console.log(`  Error: ${result.error}`);
                }
            });
        }
        
        console.log('\nDetailed Results:');
        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.testName}`);
            console.log(`   Expected: ${result.expected}, Actual: ${result.actual}`);
            if (result.applicationNumber) {
                console.log(`   Application: ${result.applicationNumber}`);
            }
            if (result.processingTime) {
                console.log(`   Processing Time: ${result.processingTime}ms`);
            }
        });
        
        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! The Enhanced LOS system is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the system configuration.');
        }
    }
}

// Run tests if this file is executed directly
async function main() {
    const tester = new EnhancedSystemTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = EnhancedSystemTester;