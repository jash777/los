/**
 * Test Third-Party Service Integration
 * Test the fixed third-party service calls with proper data normalization
 */

const LoanApplicationService = require('../src/services/loan-application');
const fs = require('fs').promises;
const path = require('path');

async function testThirdPartyIntegration() {
    console.log('🧪 Testing Third-Party Service Integration');
    console.log('========================================');

    try {
        // Load existing application data
        const applicationNumber = 'EL_1756402515298_a6qwcx48h';
        const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
        
        console.log(`📋 Loading application data: ${applicationNumber}`);
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));

        // Create enhanced test data with all required fields for third-party services
        const testLoanApplicationData = {
            personal_details: {
                full_name: 'JASHUVA PEYYALA',
                date_of_birth: '1998-09-25',
                pan_number: 'EMMPP2177A',
                mobile: '9876543210',
                email: 'jashuva.peyyala@example.com'
            },
            employment_details: {
                employee_id: 'EMP123456',
                company_name: 'Tech Innovations Pvt Ltd',
                designation: 'Senior Software Engineer',
                employment_type: 'salaried',
                monthly_income: 85000,
                monthly_gross_income: 85000,
                work_experience_years: 4.5,
                office_address: {
                    street: 'Plot No. 123, Cyber Towers',
                    city: 'Hyderabad',
                    state: 'Telangana',
                    pincode: '500081'
                }
            },
            banking_details: {
                primary_account: {
                    account_number: '12345678901234',
                    ifsc_code: 'HDFC0001234',
                    bank_name: 'HDFC Bank',
                    account_type: 'savings',
                    account_holder_name: 'JASHUVA PEYYALA'
                }
            },
            address_details: {
                current_address: {
                    address_line_1: 'Flat No. 301, Green Valley Apartments',
                    address_line_2: 'Jubilee Hills Road No. 36',
                    city: 'Hyderabad',
                    state: 'Telangana',
                    pincode: '500033'
                }
            },
            loan_request: {
                loan_amount: 750000,
                loan_purpose: 'home_improvement',
                preferred_tenure_months: 36
            },
            required_documents: {
                identity_proof: 'Aadhaar Card',
                address_proof: 'Utility Bill',
                income_proof: 'Salary Slips',
                bank_statements: 'Bank Statements',
                employment_proof: 'Employment Certificate'
            }
        };

        console.log('🔧 Test Data Prepared:');
        console.log(`   Name: ${testLoanApplicationData.personal_details.full_name}`);
        console.log(`   Company: ${testLoanApplicationData.employment_details.company_name}`);
        console.log(`   Bank Account: ${testLoanApplicationData.banking_details.primary_account.account_number}`);
        console.log(`   Employee ID: ${testLoanApplicationData.employment_details.employee_id}`);

        // Create loan application service instance
        const loanApplicationService = new LoanApplicationService();

        // Test the normalization functions
        console.log('\n🔍 Testing Data Normalization Functions:');
        
        // Test banking details normalization
        const normalizedBankingDetails = loanApplicationService.normalizeBankingDetailsForAPI(testLoanApplicationData.banking_details);
        console.log('✅ Banking Details Normalization:');
        console.log('   Account Number:', normalizedBankingDetails.account_number);
        console.log('   IFSC Code:', normalizedBankingDetails.ifsc_code);
        console.log('   Bank Name:', normalizedBankingDetails.bank_name);

        // Test employment details normalization
        const normalizedEmploymentDetails = loanApplicationService.normalizeEmploymentDetailsForAPI(
            testLoanApplicationData.employment_details,
            testLoanApplicationData.personal_details
        );
        console.log('✅ Employment Details Normalization:');
        console.log('   Employee ID:', normalizedEmploymentDetails.employee_id);
        console.log('   Company Name:', normalizedEmploymentDetails.company_name);
        console.log('   Employee Name:', normalizedEmploymentDetails.employee_name);
        console.log('   Designation:', normalizedEmploymentDetails.designation);

        // Test the complete loan application processing
        console.log('\n🚀 Testing Complete Loan Application Processing:');
        
        const requestId = `test_${Date.now()}`;
        console.log(`   Request ID: ${requestId}`);

        // Process the loan application (this will test third-party integrations)
        const result = await loanApplicationService.processLoanApplication(
            applicationNumber, 
            testLoanApplicationData, 
            requestId
        );

        console.log('\n📊 Processing Results:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Application Number: ${result.application_number}`);
        
        if (result.success) {
            console.log(`   Decision: ${result.application_result?.decision}`);
            console.log(`   Score: ${result.application_result?.score}`);
            
            // Check third-party data results
            if (result.third_party_data) {
                console.log('\n🔗 Third-Party Service Results:');
                console.log(`   Bank Statements: ${result.third_party_data.bank_statement_analysis?.success ? '✅ Success' : '❌ Failed'}`);
                if (!result.third_party_data.bank_statement_analysis?.success) {
                    console.log(`     Error: ${result.third_party_data.bank_statement_analysis?.error}`);
                }
                
                console.log(`   Employment Verification: ${result.third_party_data.employment_verification?.success ? '✅ Success' : '❌ Failed'}`);
                if (!result.third_party_data.employment_verification?.success) {
                    console.log(`     Error: ${result.third_party_data.employment_verification?.error}`);
                }
            }
        } else {
            console.log(`   Error: ${result.error}`);
        }

        // Save the test results
        const testResultsPath = path.join(__dirname, `applications/${applicationNumber}/third-party-test-results.json`);
        await fs.writeFile(testResultsPath, JSON.stringify({
            test_timestamp: new Date().toISOString(),
            test_data: testLoanApplicationData,
            normalized_banking: normalizedBankingDetails,
            normalized_employment: normalizedEmploymentDetails,
            processing_result: result
        }, null, 2));

        console.log(`\n💾 Test results saved: ${testResultsPath}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testThirdPartyIntegration();
}

module.exports = testThirdPartyIntegration;
