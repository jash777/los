#!/usr/bin/env node

const axios = require('axios');

async function testWorkflow() {
    console.log('Testing automated workflow...');
    
    try {
        // Test data for JASHUVA PEYYALA
        const applicantData = {
            full_name: "JASHUVA PEYYALA",
            phone: "9876543210",
            email: "jashuva.peyyala@example.com",
            pan_number: "EMMPP2177A",
            date_of_birth: "1985-06-15",
            requested_loan_amount: 500000,
            loan_purpose: "home_improvement",
            employment_type: "salaried"
        };

        // Stage 1: Pre-qualification
        console.log('Stage 1: Pre-qualification...');
        const preQualResponse = await axios.post('http://localhost:3000/api/pre-qualification/process', applicantData);
        const applicationNumber = preQualResponse.data.data.applicationNumber;
        console.log(`Application created: ${applicationNumber}`);

        // Stage 2: Loan Application
        console.log('Stage 2: Loan Application...');
        const loanData = {
            employment_details: {
                employment_type: "salaried",
                company_name: "Tech Solutions Pvt Ltd",
                designation: "Senior Software Engineer",
                work_experience_years: 8,
                monthly_salary: 85000,
                company_address: "Sector 62, Noida, UP",
                hr_contact: "9876543211"
            },
            income_details: {
                monthly_salary: 85000,
                other_income: 10000,
                total_monthly_income: 95000,
                existing_emi: 12000,
                net_monthly_income: 83000
            },
            banking_details: {
                primary_bank: "HDFC Bank",
                account_number: "12345678901234",
                account_type: "Savings",
                average_monthly_balance: 75000,
                banking_relationship_years: 5
            }
        };

        const loanResponse = await axios.post(`http://localhost:3000/api/loan-application/process/${applicationNumber}`, loanData);
        console.log(`Loan application status: ${loanResponse.data.status}`);

        // Wait a moment for automated workflow to start
        console.log('Waiting for automated workflow to start...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check workflow status
        console.log('Checking workflow status...');
        const statusResponse = await axios.get(`http://localhost:3000/api/automated-workflow/status/${applicationNumber}`);
        console.log('Workflow status:', statusResponse.data);

        // Wait and check again
        console.log('Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const finalStatusResponse = await axios.get(`http://localhost:3000/api/automated-workflow/status/${applicationNumber}`);
        console.log('Final workflow status:', finalStatusResponse.data);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testWorkflow();
