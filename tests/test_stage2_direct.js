async function testStage2Direct() {
    try {
        // Use a mock application number for testing Stage 2 validation
        const applicationNumber = 'EL_1756320274996_2ekwv20sb';
        console.log(`Testing Stage 2 validation with application number: ${applicationNumber}`);

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
                employee_name: 'Rahul Kumar',
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

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testStage2Direct();
