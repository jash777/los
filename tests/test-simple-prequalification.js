/**
 * Test Simple Pre-Qualification
 * Tests the simplified pre-qualification with minimal required fields
 */

const axios = require('axios');

async function testSimplePreQualification() {
    console.log('🧪 Testing Simplified Pre-Qualification');
    console.log('=====================================\n');

    const baseUrl = 'http://localhost:3000/api';

    // Test data with only essential fields for pre-qualification
    const testCases = [
        {
            name: "Valid Pre-Qualification - Should Approve",
            data: {
                applicantName: "Rajesh Kumar Sharma",
                dateOfBirth: "1985-06-15",
                phone: "9876543210",
                panNumber: "ABCDE1234F"
            }
        },
        {
            name: "Young Applicant - Should Reject",
            data: {
                applicantName: "Young Person",
                dateOfBirth: "2010-01-01", // Too young
                phone: "9876543211",
                panNumber: "ABCDE1234G"
            }
        },
        {
            name: "Invalid PAN - Should Reject",
            data: {
                applicantName: "Invalid PAN User",
                dateOfBirth: "1990-01-01",
                phone: "9876543212",
                panNumber: "INVALID123" // Invalid PAN format
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`📋 Test Case: ${testCase.name}`);
        console.log('Input Data:', JSON.stringify(testCase.data, null, 2));

        try {
            const response = await axios.post(`${baseUrl}/pre-qualification/process`, testCase.data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-request-id': `test-${Date.now()}`
                }
            });

            console.log('✅ Response Status:', response.status);
            console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('🎉 Pre-qualification Result:', response.data.data.eligibility_result?.eligible ? 'APPROVED' : 'REJECTED');
                if (response.data.data.application_number) {
                    console.log('📄 Application Number:', response.data.data.application_number);
                }
            }

        } catch (error) {
            if (error.response) {
                console.log('❌ Error Status:', error.response.status);
                console.log('📋 Error Details:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.log('❌ Network Error:', error.message);
            }
        }

        console.log('\\n' + '='.repeat(50) + '\\n');
    }
}

// Run the test
testSimplePreQualification().catch(console.error);