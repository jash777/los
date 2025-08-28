/**
 * Quick MVP Test - Basic functionality check
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Simple test data
const testData = {
    applicantName: "JASHUVA PEYYALA",
    phone: "9876543210",
    email: "jashuva.peyyala@gmail.com",
    panNumber: "EMMPP2177A",
    dateOfBirth: "1998-09-25",
    loanAmount: 500000,
    loanPurpose: "personal",
    employmentType: "salaried"
};

async function quickTest() {
    console.log('🚀 Quick MVP Test Starting...');
    
    try {
        console.log('📤 Sending Stage 1 request...');
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testData, {
            timeout: 10000 // 10 second timeout
        });
        
        console.log('✅ Stage 1 Success!');
        console.log('Response:', {
            success: response.data.success,
            applicationNumber: response.data.data?.applicationNumber,
            status: response.data.data?.status,
            cibilScore: response.data.data?.cibil_score
        });
        
        if (response.data.data?.applicationNumber) {
            console.log('🎉 MVP Test PASSED - Application processed successfully!');
            console.log('Application Number:', response.data.data.applicationNumber);
            console.log('Status:', response.data.data.status);
            console.log('CIBIL Score:', response.data.data.cibil_score);
        } else {
            console.log('⚠️  MVP Test PARTIAL - Response received but no application number');
        }
        
    } catch (error) {
        console.error('❌ MVP Test FAILED');
        if (error.code === 'ECONNREFUSED') {
            console.error('Server not running. Please start the server with: npm start');
        } else if (error.response) {
            console.error('API Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

quickTest();
