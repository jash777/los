/**
 * Debug Template Service
 * Test the template service directly to see what's happening with data updates
 */

const ApplicationTemplateService = require('../src/services/application-template');

async function debugTemplateService() {
    console.log('🔍 Debugging Template Service');
    
    const templateService = new ApplicationTemplateService();
    await templateService.waitForDirectories();
    
    // Test data
    const testStage1Data = {
        personal_details: {
            full_name: "TEST USER",
            mobile: "9876543210",
            email: "test@example.com",
            pan_number: "TESTP1234T",
            date_of_birth: "1990-01-01"
        },
        loan_request: {
            loan_amount: 100000,
            loan_purpose: "personal",
            preferred_tenure_months: 24
        },
        eligibility_result: {
            status: "approved",
            score: 75,
            decision: "approved",
            reasons: []
        },
        cibil_result: {
            success: true,
            score: 750,
            grade: "good",
            data: {
                credit_score: 750,
                status: "active",
                existing_loans: 1,
                payment_history: "good"
            }
        },
        pan_verification_result: {
            success: true,
            nameMatch: { isMatch: true, matchPercentage: 95 },
            dobMatch: { isMatch: true, verified: true }
        }
    };
    
    const testStage2Data = {
        personal_details: {
            aadhaar_number: "123456789012",
            marital_status: "single",
            number_of_dependents: 0,
            education_level: "graduate"
        },
        employment_details: {
            employment_type: "salaried",
            company_name: "Test Company",
            designation: "Test Role",
            monthly_gross_income: 50000,
            monthly_net_income: 45000,
            work_experience_years: 2,
            current_job_experience_years: 1,
            industry_type: "Technology",
            employment_status: "permanent",
            employee_name: "TEST USER"
        },
        income_details: {
            monthly_salary: 50000,
            other_income: 0,
            total_monthly_income: 50000,
            existing_emi: 0,
            net_monthly_income: 45000
        },
        financial_details: {
            monthly_expenses: 20000,
            existing_loans: [],
            credit_cards: [],
            investments: [],
            assets: []
        },
        address_details: {
            current_address: {
                street_address: "Test Street",
                city: "Test City",
                state: "Test State",
                pincode: "123456",
                residence_type: "owned",
                years_at_address: 3
            },
            permanent_address: {
                street_address: "Test Permanent",
                city: "Test City",
                state: "Test State",
                pincode: "123456"
            }
        },
        banking_details: {
            account_number: "1234567890",
            mobile_number: "9876543210",
            ifsc_code: "TEST0001234",
            bank_name: "Test Bank"
        },
        references: [
            {
                name: "Test Ref 1",
                mobile: "9876543211",
                relationship: "friend",
                address: "Test Address 1",
                years_known: 5
            },
            {
                name: "Test Ref 2",
                mobile: "9876543212",
                relationship: "colleague",
                address: "Test Address 2",
                years_known: 3
            }
        ],
        required_documents: {
            identity_proof: "Aadhaar Card",
            address_proof: "Utility Bill"
        },
        additional_information: {
            loan_purpose_details: "Test loan purpose",
            repayment_source: "Monthly salary",
            preferred_tenure_months: 24,
            existing_relationship_with_bank: true,
            co_applicant_required: false,
            property_owned: true
        },
        application_result: {
            decision: "approved",
            score: 80,
            recommended_terms: {
                interest_rate: 10,
                tenure_months: 24
            },
            positive_factors: ["Good credit score"],
            negative_factors: [],
            risk_factors: []
        }
    };
    
    try {
        // Create a test application
        const applicationNumber = `TEST_${Date.now()}_debug`;
        console.log('📝 Creating test application:', applicationNumber);
        
        // Create base template
        const baseTemplate = templateService.createBaseTemplate();
        baseTemplate.application_info.application_number = applicationNumber;
        baseTemplate.application_info.created_at = new Date().toISOString();
        
        await templateService.saveApplicationData(applicationNumber, baseTemplate);
        console.log('✅ Base template created');
        
        // Update with Stage 1 data
        console.log('\n📊 Updating with Stage 1 data...');
        const stage1Result = await templateService.updateWithStage1Data(applicationNumber, testStage1Data);
        console.log('✅ Stage 1 data updated');
        
        // Update with Stage 2 data
        console.log('\n📊 Updating with Stage 2 data...');
        const stage2Result = await templateService.updateWithStage2Data(applicationNumber, testStage2Data);
        console.log('✅ Stage 2 data updated');
        
        // Read the final data
        console.log('\n📋 Reading final application data...');
        const finalData = await templateService.getApplicationData(applicationNumber);
        
        console.log('\n🔍 Final Data Analysis:');
        console.log('  Income Details:', finalData.stage_2_data.income_details);
        console.log('  Financial Details:', finalData.stage_2_data.financial_details);
        console.log('  CIBIL Data:', finalData.third_party_data.cibil_data);
        console.log('  PAN Verification:', finalData.third_party_data.pan_verification);
        console.log('  Required Documents:', finalData.stage_2_data.required_documents);
        console.log('  Additional Information:', finalData.stage_2_data.additional_information);
        
        // Clean up
        console.log('\n🧹 Cleaning up test data...');
        // Note: In production, you might want to keep test data for debugging
        
    } catch (error) {
        console.error('❌ Error in template service test:', error);
    }
}

debugTemplateService().then(() => {
    console.log('\n✅ Template service debug completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Template service debug failed:', error);
    process.exit(1);
});
