// Using built-in fetch (Node.js 18+)

// Test scenarios with different data profiles
const testScenarios = [
    {
        name: "High-Income Professional",
        stage1Data: {
            applicantName: "RAJESH KUMAR SHARMA",
            email: "rajesh.sharma@techsolutions.com",
            phone: "9876543210",
            panNumber: "ABCDE1234F",
            dateOfBirth: "1990-05-15",
            loanAmount: 800000,
            loanPurpose: "home_improvement",
            employmentType: "salaried"
        },
        stage2Data: {
            personal_details: {
                aadhaar_number: "123456789012",
                marital_status: "married",
                spouse_name: "Priya Sharma",
                number_of_dependents: 1,
                education_level: "post_graduate"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "Tech Solutions Pvt Ltd",
                designation: "Senior Software Engineer",
                employee_name: "RAJESH KUMAR SHARMA",
                monthly_gross_income: 90000,
                monthly_net_income: 72000,
                work_experience_years: 5,
                current_job_experience_years: 3,
                industry_type: "IT",
                employment_status: "active"
            },
            address_details: {
                current_address: {
                    street_address: "Tech Park, Sector 5",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001",
                    residence_type: "owned",
                    years_at_address: 3
                },
                permanent_address: {
                    street_address: "456 Old Street",
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
                loan_purpose_details: "Home renovation and personal expenses",
                repayment_source: "Monthly salary",
                preferred_tenure_months: 60,
                existing_relationship_with_bank: true,
                co_applicant_required: false,
                property_owned: true
            },
            references: [
                {
                    name: "Amit Patel",
                    mobile: "9876543210",
                    relationship: "colleague",
                    address: "Mumbai, Maharashtra",
                    years_known: 4
                },
                {
                    name: "Priya Sharma",
                    mobile: "9876543211",
                    relationship: "friend",
                    address: "Mumbai, Maharashtra",
                    years_known: 6
                }
            ]
        }
    },
    {
        name: "Mid-Income Professional",
        stage1Data: {
            applicantName: "NEHA VERMA",
            email: "neha.verma@globalsolutions.com",
            phone: "8765432109",
            panNumber: "FGHIJ5678K",
            dateOfBirth: "1995-08-22",
            loanAmount: 500000,
            loanPurpose: "education",
            employmentType: "salaried"
        },
        stage2Data: {
            personal_details: {
                aadhaar_number: "987654321098",
                marital_status: "single",
                spouse_name: "",
                number_of_dependents: 0,
                education_level: "graduate"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "Global Solutions Ltd",
                designation: "Marketing Executive",
                employee_name: "NEHA VERMA",
                monthly_gross_income: 55000,
                monthly_net_income: 44000,
                work_experience_years: 2,
                current_job_experience_years: 1,
                industry_type: "Marketing",
                employment_status: "active"
            },
            address_details: {
                current_address: {
                    street_address: "789 Business Street",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560001",
                    residence_type: "rented",
                    years_at_address: 1
                },
                permanent_address: {
                    street_address: "321 Home Street",
                    city: "Delhi",
                    state: "Delhi",
                    pincode: "110001"
                }
            },
            banking_details: {
                account_number: "98765432109876",
                mobile_number: "8765432109",
                ifsc_code: "ICIC0001234",
                bank_name: "ICICI Bank"
            },
            required_documents: {
                identity_proof: { document_type: "pan_card", document_url: "auto_verified" },
                address_proof: { document_type: "aadhaar_card", document_url: "auto_verified" }
            },
            additional_information: {
                loan_purpose_details: "Education loan for higher studies",
                repayment_source: "Monthly salary",
                preferred_tenure_months: 48,
                existing_relationship_with_bank: false,
                co_applicant_required: false,
                property_owned: false
            },
            references: [
                {
                    name: "Rahul Singh",
                    mobile: "8765432109",
                    relationship: "friend",
                    address: "Bangalore, Karnataka",
                    years_known: 3
                },
                {
                    name: "Anita Desai",
                    mobile: "8765432108",
                    relationship: "colleague",
                    address: "Bangalore, Karnataka",
                    years_known: 2
                }
            ]
        }
    },
    {
        name: "Low-Income Applicant",
        stage1Data: {
            applicantName: "MOHAN LAL",
            email: "mohan.lal@localservices.com",
            phone: "9876543210",
            panNumber: "LMNOP9012Q",
            dateOfBirth: "1985-12-10",
            loanAmount: 200000,
            loanPurpose: "medical",
            employmentType: "salaried"
        },
        stage2Data: {
            personal_details: {
                aadhaar_number: "555555555555",
                marital_status: "married",
                spouse_name: "Sunita Devi",
                number_of_dependents: 3,
                education_level: "higher_secondary"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "Local Services Pvt Ltd",
                designation: "Office Assistant",
                employee_name: "MOHAN LAL",
                monthly_gross_income: 25000,
                monthly_net_income: 20000,
                work_experience_years: 1,
                current_job_experience_years: 1,
                industry_type: "Services",
                employment_status: "active"
            },
            address_details: {
                current_address: {
                    street_address: "123 Small Street",
                    city: "Chennai",
                    state: "Tamil Nadu",
                    pincode: "600001",
                    residence_type: "rented",
                    years_at_address: 1
                },
                permanent_address: {
                    street_address: "456 Village Street",
                    city: "Madurai",
                    state: "Tamil Nadu",
                    pincode: "625001"
                }
            },
            banking_details: {
                account_number: "55555555555555",
                mobile_number: "9876543210",
                ifsc_code: "SBIN0001234",
                bank_name: "State Bank of India"
            },
            required_documents: {
                identity_proof: { document_type: "pan_card", document_url: "auto_verified" },
                address_proof: { document_type: "aadhaar_card", document_url: "auto_verified" }
            },
            additional_information: {
                loan_purpose_details: "Medical emergency expenses",
                repayment_source: "Monthly salary",
                preferred_tenure_months: 36,
                existing_relationship_with_bank: true,
                co_applicant_required: false,
                property_owned: false
            },
            references: [
                {
                    name: "Ramesh Kumar",
                    mobile: "5555555555",
                    relationship: "neighbor",
                    address: "Chennai, Tamil Nadu",
                    years_known: 5
                },
                {
                    name: "Lakshmi Devi",
                    mobile: "5555555554",
                    relationship: "friend",
                    address: "Chennai, Tamil Nadu",
                    years_known: 3
                }
            ]
        }
    }
];

async function createStage1Application(scenario) {
    console.log(`📝 Creating Stage 1 application for: ${scenario.name}`);
    
    try {
        const response = await fetch('http://localhost:3000/api/pre-qualification/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scenario.stage1Data)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Stage 1 created successfully: ${result.applicationNumber}`);
            return result.applicationNumber;
        } else {
            console.log(`❌ Stage 1 failed: ${result.error || result.message}`);
            return null;
        }
    } catch (error) {
        console.log(`💥 Stage 1 exception: ${error.message}`);
        return null;
    }
}

async function testStage2Scenario(scenario, applicationNumber) {
    console.log(`\n🧪 Testing Stage 2 for: ${scenario.name}`);
    console.log(`📋 Application Number: ${applicationNumber}`);
    console.log(`💰 Monthly Income: ₹${scenario.stage2Data.employment_details.monthly_net_income}`);
    
    try {
        const response = await fetch(`http://localhost:3000/api/loan-application/${applicationNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scenario.stage2Data)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ ${scenario.name} - SUCCESS`);
            console.log(`📊 Overall Score: ${result.application_score.overall_score}`);
            console.log(`🎯 Decision: ${result.decision}`);
            console.log(`⏱️ Processing Time: ${result.processing_time_ms}ms`);
            
            // Log component scores
            console.log(`📈 Component Scores:`);
            console.log(`   Document: ${result.application_score.component_scores.document_score}`);
            console.log(`   Employment: ${result.application_score.component_scores.employment_score}`);
            console.log(`   Financial: ${result.application_score.component_scores.financial_score}`);
            console.log(`   Banking: ${result.application_score.component_scores.banking_score}`);
            console.log(`   Reference: ${result.application_score.component_scores.reference_score}`);
            
            return {
                scenario: scenario.name,
                success: true,
                score: result.application_score.overall_score,
                decision: result.decision,
                processing_time: result.processing_time_ms
            };
        } else {
            console.log(`❌ ${scenario.name} - FAILED`);
            console.log(`🚨 Error: ${result.error || result.message}`);
            if (result.details) {
                console.log(`📝 Details:`, result.details);
            }
            
            return {
                scenario: scenario.name,
                success: false,
                error: result.error || result.message,
                details: result.details
            };
        }
    } catch (error) {
        console.log(`💥 ${scenario.name} - EXCEPTION`);
        console.log(`🚨 Error: ${error.message}`);
        
        return {
            scenario: scenario.name,
            success: false,
            error: error.message
        };
    }
}

async function runComprehensiveTest() {
    console.log("🚀 Starting Comprehensive Stage 1 & 2 Testing");
    console.log("=" .repeat(60));
    
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        
        // Add delay between tests
        if (i > 0) {
            console.log("⏳ Waiting 3 seconds before next test...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Step 1: Create Stage 1 application
        const applicationNumber = await createStage1Application(scenario);
        
        if (!applicationNumber) {
            console.log(`❌ Skipping Stage 2 for ${scenario.name} - Stage 1 failed`);
            results.push({
                scenario: scenario.name,
                success: false,
                error: "Stage 1 creation failed"
            });
            continue;
        }
        
        // Step 2: Wait a moment for Stage 1 to be processed
        console.log("⏳ Waiting 2 seconds for Stage 1 processing...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Test Stage 2
        const result = await testStage2Scenario(scenario, applicationNumber);
        results.push(result);
    }
    
    // Summary
    console.log("\n" + "=" .repeat(60));
    console.log("📊 COMPREHENSIVE TEST SUMMARY");
    console.log("=" .repeat(60));
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Failed Tests: ${failedTests.length}/${results.length}`);
    
    if (successfulTests.length > 0) {
        console.log("\n📈 Score Analysis:");
        const scores = successfulTests.map(r => r.score);
        console.log(`   Average Score: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}`);
        console.log(`   Highest Score: ${Math.max(...scores)}`);
        console.log(`   Lowest Score: ${Math.min(...scores)}`);
        
        console.log("\n🎯 Decision Analysis:");
        const decisions = successfulTests.map(r => r.decision);
        const decisionCounts = decisions.reduce((acc, decision) => {
            acc[decision] = (acc[decision] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(decisionCounts).forEach(([decision, count]) => {
            console.log(`   ${decision}: ${count} applications`);
        });
    }
    
    if (failedTests.length > 0) {
        console.log("\n❌ Failed Test Details:");
        failedTests.forEach(test => {
            console.log(`   ${test.scenario}: ${test.error}`);
        });
    }
    
    console.log("\n🏁 Comprehensive testing completed!");
}

// Run the test
runComprehensiveTest().catch(console.error);
