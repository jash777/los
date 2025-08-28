async function testStage2Simple() {
    try {
        // Test Stage 1 with valid data that should pass
        console.log('Testing Stage 1 with valid data...');
        const stage1Response = await fetch('http://localhost:3000/api/pre-qualification/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                applicantName: 'Rajesh Kumar',
                email: 'rajesh.kumar@company.com',
                phone: '9876543210',
                panNumber: 'ABCDE1234F',
                dateOfBirth: '1985-06-15',
                loanAmount: 500000,
                loanPurpose: 'personal',
                employmentType: 'salaried'
            })
        });

        const stage1Data = await stage1Response.json();
        console.log('Stage 1 Response:', JSON.stringify(stage1Data, null, 2));

        if (!stage1Data.success) {
            console.log('Stage 1 failed. Let me try with different data...');
            
            // Try with different data
            const stage1Response2 = await fetch('http://localhost:3000/api/pre-qualification/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantName: 'Priya Sharma',
                    email: 'priya.sharma@tech.com',
                    phone: '9876543211',
                    panNumber: 'FGHIJ5678K',
                    dateOfBirth: '1992-03-20',
                    loanAmount: 300000,
                    loanPurpose: 'education',
                    employmentType: 'salaried'
                })
            });

            const stage1Data2 = await stage1Response2.json();
            console.log('Stage 1 Response (2nd attempt):', JSON.stringify(stage1Data2, null, 2));

            if (!stage1Data2.success) {
                console.log('Both Stage 1 attempts failed. Let me check what validation errors we have...');
                return;
            }
            
            // Use the second attempt if it succeeded
            const applicationNumber = stage1Data2.data.applicationNumber;
            console.log(`\nStage 1 succeeded with application number: ${applicationNumber}`);
            
            // Now test Stage 2
            await testStage2WithAppNumber(applicationNumber);
        } else {
            const applicationNumber = stage1Data.data.applicationNumber;
            console.log(`\nStage 1 succeeded with application number: ${applicationNumber}`);
            
            // Now test Stage 2
            await testStage2WithAppNumber(applicationNumber);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function testStage2WithAppNumber(applicationNumber) {
    console.log(`\nTesting Stage 2 with application number: ${applicationNumber}`);

    // Test Stage 2 with simplified data structure
    const stage2Data = {
        personal_details: {
            aadhaar_number: '123456789012',
            marital_status: 'single',
            spouse_name: '',
            number_of_dependents: 2,
            education_level: 'graduate'
        },
        employment_details: {
            employment_type: 'salaried',
            company_name: 'Tech Solutions Ltd',
            designation: 'Software Engineer',
            employee_name: 'Rajesh Kumar',
            monthly_gross_income: 75000,
            monthly_net_income: 60000,
            work_experience_years: 3,
            current_job_experience_years: 2,
            industry_type: 'IT',
            employment_status: 'active'
        },
        address_details: {
            current_address: {
                street_address: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                residence_type: 'rented',
                years_at_address: 2
            },
            permanent_address: {
                street_address: '456 Old Street',
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001'
            }
        },
        banking_details: {
            account_number: '1234567890',
            mobile_number: '9876543210',
            ifsc_code: 'SBIN0001234',
            bank_name: 'State Bank of India'
        },
        required_documents: {
            identity_proof: { document_type: 'pan_card', document_url: 'auto_verified' },
            address_proof: { document_type: 'aadhaar_card', document_url: 'auto_verified' }
        },
        additional_information: {
            loan_purpose_details: 'Personal loan for various purposes',
            repayment_source: 'Monthly salary',
            preferred_tenure_months: 60,
            existing_relationship_with_bank: false,
            co_applicant_required: false,
            property_owned: false
        },
        references: [
            {
                name: 'Amit Singh',
                mobile: '9876543210',
                relationship: 'friend',
                address: 'Mumbai, Maharashtra',
                years_known: 5
            },
            {
                name: 'Priya Sharma',
                mobile: '9876543211',
                relationship: 'colleague',
                address: 'Mumbai, Maharashtra',
                years_known: 3
            }
        ]
    };

    const stage2Response = await fetch(`http://localhost:3000/api/loan-application/${applicationNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stage2Data)
    });

    const stage2Result = await stage2Response.json();
    console.log('\nStage 2 Response:', JSON.stringify(stage2Result, null, 2));

    // Check if validation passed
    if (stage2Result.success) {
        console.log('\n✅ Stage 2 validation passed!');
    } else {
        console.log('\n❌ Stage 2 validation failed:');
        if (stage2Result.data && stage2Result.data.errors) {
            console.log('Validation errors:', stage2Result.data.errors);
        }
    }
}

testStage2Simple();
