/**
 * Debug Stage 2 Data Processing
 * Test the Stage 2 data processing directly to see what's happening
 */

const ApplicationTemplateService = require('../src/services/application-template');

async function debugStage2Data() {
    console.log('🔍 Debugging Stage 2 Data Processing');
    
    const templateService = new ApplicationTemplateService();
    await templateService.waitForDirectories();
    
    // Test data that matches what the loan application service should be passing
    const testStage2Data = {
        personal_details: {
            aadhaar_number: "123456789012",
            marital_status: "single",
            number_of_dependents: 0,
            education_level: "graduate"
        },
        employment_details: {
            employment_type: "salaried",
            company_name: "Tech Solutions Ltd",
            designation: "Software Engineer",
            monthly_gross_income: 75000,
            monthly_net_income: 65000,
            work_experience_years: 3,
            current_job_experience_years: 2,
            industry_type: "Information Technology",
            employment_status: "permanent",
            employee_name: "JASHUVA PEYYALA"
        },
        income_details: {
            monthly_salary: 75000,
            other_income: 0,
            total_monthly_income: 75000,
            existing_emi: 0,
            net_monthly_income: 65000
        },
        financial_details: {
            monthly_expenses: 30000,
            existing_loans: [],
            credit_cards: [],
            investments: [],
            assets: []
        },
        address_details: {
            current_address: {
                street_address: "123 Main Street",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400001",
                residence_type: "rented",
                years_at_address: 2
            },
            permanent_address: {
                street_address: "456 Home Street",
                city: "Pune",
                state: "Maharashtra",
                pincode: "411001"
            }
        },
        banking_details: {
            account_number: "1234567890",
            mobile_number: "9876543210",
            ifsc_code: "SBIN0001234",
            bank_name: "State Bank of India"
        },
        references: [
            {
                name: "Rahul Sharma",
                mobile: "9876543211",
                relationship: "friend",
                address: "789 Friend Street, Mumbai, Maharashtra - 400002",
                years_known: 5
            },
            {
                name: "Priya Patel",
                mobile: "9876543212",
                relationship: "colleague",
                address: "321 Colleague Avenue, Mumbai, Maharashtra - 400003",
                years_known: 3
            }
        ],
        required_documents: {
            identity_proof: "Aadhaar Card",
            address_proof: "Rental Agreement",
            income_proof: "Salary Slips",
            bank_statements: "Bank Statements",
            employment_proof: "Employment Certificate"
        },
        additional_information: {
            loan_purpose_details: "Personal loan for home renovation and furniture purchase",
            repayment_source: "Monthly salary from employment",
            preferred_tenure_months: 36,
            existing_relationship_with_bank: true,
            co_applicant_required: false,
            property_owned: false
        },
        application_result: {
            decision: "conditional_approval",
            score: 67,
            recommended_terms: {
                interest_rate: 12,
                tenure_months: 36
            },
            positive_factors: ["Good employment profile"],
            negative_factors: ["Documentation incomplete"],
            risk_factors: ["Banking behavior concerns"]
        }
    };
    
    try {
        // Create a test application
        const applicationNumber = `DEBUG_${Date.now()}_stage2`;
        console.log('📝 Creating test application:', applicationNumber);
        
        // Create base template
        const baseTemplate = templateService.createBaseTemplate();
        baseTemplate.application_info.application_number = applicationNumber;
        baseTemplate.application_info.created_at = new Date().toISOString();
        
        await templateService.saveApplicationData(applicationNumber, baseTemplate);
        console.log('✅ Base template created');
        
        // Update with Stage 2 data
        console.log('\n📊 Updating with Stage 2 data...');
        console.log('📋 Stage 2 data to be saved:', JSON.stringify(testStage2Data, null, 2));
        
        const stage2Result = await templateService.updateWithStage2Data(applicationNumber, testStage2Data);
        console.log('✅ Stage 2 data updated');
        
        // Read the final data
        console.log('\n📋 Reading final application data...');
        const finalData = await templateService.getApplicationData(applicationNumber);
        
        console.log('\n🔍 Final Data Analysis:');
        console.log('  Income Details:', JSON.stringify(finalData.stage_2_data.income_details, null, 2));
        console.log('  Financial Details:', JSON.stringify(finalData.stage_2_data.financial_details, null, 2));
        console.log('  Required Documents:', JSON.stringify(finalData.stage_2_data.required_documents, null, 2));
        console.log('  Additional Information:', JSON.stringify(finalData.stage_2_data.additional_information, null, 2));
        
        // Check if data was properly saved
        const issues = [];
        if (!finalData.stage_2_data.income_details.monthly_salary) issues.push('Income Details - Monthly Salary is null');
        if (!finalData.stage_2_data.financial_details.monthly_expenses) issues.push('Financial Details - Monthly Expenses is null');
        if (!finalData.stage_2_data.required_documents.identity_proof) issues.push('Required Documents - Identity Proof is null');
        if (!finalData.stage_2_data.additional_information) issues.push('Additional Information is undefined');
        
        if (issues.length > 0) {
            console.log('\n❌ Issues found:');
            issues.forEach(issue => console.log('  -', issue));
        } else {
            console.log('\n✅ All data appears to be properly saved!');
        }
        
    } catch (error) {
        console.error('❌ Error in Stage 2 data test:', error);
    }
}

debugStage2Data().then(() => {
    console.log('\n✅ Stage 2 data debug completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Stage 2 data debug failed:', error);
    process.exit(1);
});
