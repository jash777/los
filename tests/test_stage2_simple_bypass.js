// Simple Stage 1 & 2 Test with Bypass for Third-Party Simulator Issues
// This test uses data that should pass all validations

async function testSimpleBypass() {
    console.log("🚀 Testing Simple Stage 1 & 2 with Bypass");
    console.log("=" .repeat(50));
    
    // Test data that should pass all validations
    const stage1Data = {
        applicantName: "TEST USER VALID",
        email: "test.valid@example.com",
        phone: "9876543210", // Valid Indian mobile
        panNumber: "TESTP1234T", // Test PAN that should pass
        dateOfBirth: "1990-01-01",
        loanAmount: 500000,
        loanPurpose: "personal", // Valid purpose
        employmentType: "salaried"
    };
    
    const stage2Data = {
        personal_details: {
            aadhaar_number: "123456789012",
            marital_status: "single",
            spouse_name: "",
            number_of_dependents: 0,
            education_level: "graduate"
        },
        employment_details: {
            employment_type: "salaried",
            company_name: "Test Company Ltd",
            designation: "Software Engineer",
            employee_name: "TEST USER VALID",
            monthly_gross_income: 60000,
            monthly_net_income: 48000,
            work_experience_years: 3,
            current_job_experience_years: 2,
            industry_type: "IT",
            employment_status: "active"
        },
        address_details: {
            current_address: {
                street_address: "123 Test Street",
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
            account_number: "12345678901234",
            mobile_number: "9876543210",
            ifsc_code: "HDFC0000123",
            bank_name: "HDFC Bank"
        },
        required_documents: {
            identity_proof: { document_type: "pan_card", document_url: "auto_verified" },
            address_proof: { document_type: "aadhaar_card", document_url: "auto_verified" }
        },
        additional_information: {
            loan_purpose_details: "Personal loan for various expenses",
            repayment_source: "Monthly salary",
            preferred_tenure_months: 48,
            existing_relationship_with_bank: true,
            co_applicant_required: false,
            property_owned: false
        },
        references: [
            {
                name: "Test Reference 1",
                mobile: "9876543211",
                relationship: "colleague",
                address: "Mumbai, Maharashtra",
                years_known: 2
            },
            {
                name: "Test Reference 2",
                mobile: "9876543212",
                relationship: "friend",
                address: "Mumbai, Maharashtra",
                years_known: 3
            }
        ]
    };
    
    try {
        // Step 1: Create Stage 1 application
        console.log("📝 Creating Stage 1 application...");
        const stage1Response = await fetch('http://localhost:3000/api/pre-qualification/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stage1Data)
        });
        
        const stage1Result = await stage1Response.json();
        console.log("📥 Stage 1 Response:", JSON.stringify(stage1Result, null, 2));
        
        if (!stage1Result.success) {
            console.log("❌ Stage 1 failed");
            return;
        }
        
        const applicationNumber = stage1Result.data.applicationNumber;
        console.log(`✅ Stage 1 created: ${applicationNumber}`);
        
        // Wait for processing
        console.log("⏳ Waiting 3 seconds for Stage 1 processing...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 2: Test Stage 2
        console.log("🧪 Testing Stage 2...");
        const stage2Response = await fetch(`http://localhost:3000/api/loan-application/${applicationNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stage2Data)
        });
        
        const stage2Result = await stage2Response.json();
        console.log("📥 Stage 2 Response:", JSON.stringify(stage2Result, null, 2));
        
        if (stage2Result.success) {
            console.log("✅ Stage 2 SUCCESS!");
            console.log(`📊 Overall Score: ${stage2Result.application_score.overall_score}`);
            console.log(`🎯 Decision: ${stage2Result.decision}`);
            console.log(`⏱️ Processing Time: ${stage2Result.processing_time_ms}ms`);
        } else {
            console.log("❌ Stage 2 failed");
        }
        
    } catch (error) {
        console.log("💥 Exception:", error.message);
    }
}

// Run the test
testSimpleBypass().catch(console.error);
