/**
 * Test Complete PDF Generation
 * Test the enhanced PDF generation with complete field population
 */

const fs = require('fs').promises;
const path = require('path');
const EnhancedPDFGeneratorService = require('../src/services/enhanced-pdf-generator');

async function testCompletePDFGeneration() {
    console.log('🧪 Testing Complete PDF Generation');
    console.log('==================================');

    try {
        // Use the existing application data
        const applicationNumber = 'EL_1756402515298_a6qwcx48h';
        const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
        
        console.log(`📋 Loading application data: ${applicationNumber}`);
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));

        // Enhance the application data with missing fields for better testing
        const enhancedData = {
            ...applicationData,
            stage_2_data: {
                ...applicationData.stage_2_data,
                personal_details: {
                    father_name: 'Mr. Rajesh Peyyala',
                    mother_name: 'Mrs. Sunitha Peyyala',
                    gender: 'Male',
                    marital_status: 'Single',
                    aadhaar_number: '1234 5678 9012',
                    education_level: 'B.Tech Computer Science',
                    number_of_dependents: '0'
                },
                employment_details: {
                    ...applicationData.stage_2_data?.employment_details,
                    company_name: 'Tech Innovations Pvt Ltd',
                    designation: 'Senior Software Engineer',
                    employment_type: 'Salaried',
                    monthly_gross_income: 85000,
                    monthly_income: 85000,
                    work_experience_years: 4.5,
                    current_job_experience_years: 2.8,
                    official_email: 'jashuva.p@techinnovations.com',
                    office_phone: '+91-40-12345678',
                    office_address: {
                        street: 'Plot No. 123, Cyber Towers',
                        city: 'Hyderabad',
                        state: 'Telangana',
                        pincode: '500081'
                    }
                },
                banking_details: {
                    ...applicationData.stage_2_data?.banking_details,
                    primary_account: {
                        bank_name: 'HDFC Bank',
                        account_number: '12345678901234',
                        ifsc_code: 'HDFC0001234',
                        account_type: 'Savings',
                        account_holder_name: 'JASHUVA PEYYALA',
                        account_opening_date: '15/03/2020',
                        average_monthly_balance: 125000
                    },
                    existing_loans: [
                        {
                            type: 'credit_card',
                            monthly_emi: 5000,
                            outstanding: 45000
                        }
                    ]
                },
                address_details: {
                    current_address: {
                        address_line_1: 'Flat No. 301, Green Valley Apartments',
                        address_line_2: 'Jubilee Hills Road No. 36',
                        city: 'Hyderabad',
                        state: 'Telangana',
                        pincode: '500033',
                        residence_type: 'Rented',
                        years_at_current_address: 3
                    },
                    permanent_address: {
                        same_as_current: false,
                        address_line_1: 'H.No. 12-34, Gandhi Nagar',
                        city: 'Karimnagar',
                        state: 'Telangana',
                        pincode: '505001'
                    }
                },
                references: {
                    personal_reference_1: {
                        name: 'Mr. Rajesh Kumar',
                        relationship: 'Friend',
                        mobile: '9876543210',
                        address: 'Banjara Hills, Hyderabad'
                    },
                    personal_reference_2: {
                        name: 'Ms. Priya Sharma',
                        relationship: 'Colleague',
                        mobile: '9123456789',
                        address: 'Gachibowli, Hyderabad'
                    }
                }
            }
        };

        console.log('🔧 Enhanced application data with additional fields');
        console.log(`   Name: ${enhancedData.stage_1_data.personal_details.full_name}`);
        console.log(`   Loan Amount: ₹${enhancedData.stage_1_data.loan_request.loan_amount?.toLocaleString('en-IN')}`);
        console.log(`   Company: ${enhancedData.stage_2_data.employment_details.company_name}`);

        // Create PDF generator instance
        const pdfGenerator = new EnhancedPDFGeneratorService();

        // Generate PDF
        const outputPath = path.join(__dirname, `applications/${applicationNumber}/complete-loan-application.pdf`);
        console.log(`📄 Generating PDF: ${outputPath}`);

        const result = await pdfGenerator.generateCompleteLoanApplicationPDF(enhancedData, outputPath);

        if (result.success) {
            console.log('✅ PDF Generation Successful!');
            console.log(`   File: ${result.path}`);
            console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`);
            console.log(`   Application: ${result.application_number}`);

            // Also save the enhanced data for reference
            const enhancedDataPath = path.join(__dirname, `applications/${applicationNumber}/enhanced-application-data.json`);
            await fs.writeFile(enhancedDataPath, JSON.stringify(enhancedData, null, 2));
            console.log(`💾 Enhanced data saved: ${enhancedDataPath}`);

            // Test the normalization function separately
            console.log('\n🔍 Testing Data Normalization:');
            const normalizedData = pdfGenerator.normalizeDataForTemplate(enhancedData);
            console.log('   Personal Info:', {
                name: normalizedData.personal.full_name,
                pan: normalizedData.personal.pan_number,
                mobile: normalizedData.personal.mobile_number
            });
            console.log('   Employment Info:', {
                company: normalizedData.employment.company_name,
                designation: normalizedData.employment.designation,
                income: normalizedData.income.total_income
            });
            console.log('   Banking Info:', {
                bank: normalizedData.banking.bank_name,
                account: normalizedData.banking.account_number
            });
            console.log('   Loan Info:', {
                amount: normalizedData.loan.amount_required,
                tenure: normalizedData.loan.tenure,
                purpose: normalizedData.loan.purpose
            });

        } else {
            console.error('❌ PDF Generation Failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testCompletePDFGeneration();
}

module.exports = testCompletePDFGeneration;
