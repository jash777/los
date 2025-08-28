/**
 * Complete Workflow Test with Representative Test Data
 * Tests Stage 1 and Stage 2 with various scenarios including edge cases
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test Scenarios Data
const testScenarios = {
    // Scenario 1: Excellent Profile (High CIBIL Score)
    excellent_profile: {
        stage1: {
            applicantName: "RAJESH KUMAR SHARMA",
            phone: "9876543210",
            email: "rajesh.sharma@example.com",
            panNumber: "ABCDE1234F",
            dateOfBirth: "1985-06-15",
            loanAmount: 500000,
            loanPurpose: "personal",
            employmentType: "salaried"
        },
        stage2: {
            personal_details: {
                aadhaar_number: "123456789012",
                marital_status: "married",
                number_of_dependents: 2,
                education_level: "post_graduate"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "TechCorp Solutions Ltd",
                designation: "Senior Software Engineer",
                monthly_gross_income: 120000,
                monthly_net_income: 95000,
                work_experience_years: 8,
                current_job_experience_years: 5,
                industry_type: "Information Technology",
                employment_status: "permanent"
            },
            address_details: {
                current_address: {
                    street_address: "123 MG Road, Apartment 5B",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001",
                    residence_type: "owned",
                    years_at_address: 8
                },
                permanent_address: {
                    street_address: "456 Lake View, House 12",
                    city: "Pune",
                    state: "Maharashtra",
                    pincode: "411001",
                    same_as_current: false
                }
            },
            banking_details: {
                account_number: "1234567890",
                ifsc_code: "HDFC0001234",
                bank_name: "HDFC Bank",
                account_type: "savings",
                average_monthly_balance: 150000,
                banking_relationship_years: 8
            },
            references: {
                personal_reference_1: {
                    name: "Amit Patel",
                    relationship: "friend",
                    mobile: "9876543211",
                    email: "amit.patel@email.com"
                },
                personal_reference_2: {
                    name: "Priya Singh",
                    relationship: "colleague",
                    mobile: "9876543212",
                    email: "priya.singh@email.com"
                }
            }
        }
    },

    // Scenario 2: Good Profile (Medium CIBIL Score)
    good_profile: {
        stage1: {
            applicantName: "JASHUVA PEYYALA",
            phone: "9876543210",
            email: "jashuva.peyyala@gmail.com",
            panNumber: "EMMPP2177A",
            dateOfBirth: "1998-09-25",
            loanAmount: 300000,
            loanPurpose: "education",
            employmentType: "salaried"
        },
        stage2: {
            personal_details: {
                aadhaar_number: "123456789012",
                marital_status: "single",
                number_of_dependents: 0,
                education_level: "graduate"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "Tech Solutions Pvt Ltd",
                designation: "Software Engineer",
                monthly_gross_income: 75000,
                monthly_net_income: 65000,
                work_experience_years: 3,
                current_job_experience_years: 2,
                industry_type: "Information Technology",
                employment_status: "permanent"
            },
            address_details: {
                current_address: {
                    street_address: "A 120 MUNNA APARTMENT",
                    city: "New Delhi",
                    state: "Delhi",
                    pincode: "110034",
                    residence_type: "rented",
                    years_at_address: 2
                },
                permanent_address: {
                    street_address: "A 120 MUNNA APARTMENT",
                    city: "New Delhi",
                    state: "Delhi",
                    pincode: "110034",
                    same_as_current: true
                }
            },
            banking_details: {
                account_number: "1234567890",
                ifsc_code: "SBIN0001234",
                bank_name: "State Bank of India",
                account_type: "savings",
                average_monthly_balance: 50000,
                banking_relationship_years: 3
            },
            references: {
                personal_reference_1: {
                    name: "Rahul Kumar",
                    relationship: "friend",
                    mobile: "9876543211",
                    email: "rahul.kumar@email.com"
                },
                personal_reference_2: {
                    name: "Priya Sharma",
                    relationship: "colleague",
                    mobile: "9876543212",
                    email: "priya.sharma@email.com"
                }
            }
        }
    },

    // Scenario 3: Self-Employed Profile
    self_employed: {
        stage1: {
            applicantName: "SUNITA DEVI",
            phone: "8765432109",
            email: "sunita.devi@business.com",
            panNumber: "SUNIT1234D",
            dateOfBirth: "1980-03-10",
            loanAmount: 800000,
            loanPurpose: "business",
            employmentType: "self_employed"
        },
        stage2: {
            personal_details: {
                aadhaar_number: "987654321098",
                marital_status: "married",
                number_of_dependents: 1,
                education_level: "graduate"
            },
            employment_details: {
                employment_type: "self_employed",
                company_name: "Sunita's Boutique",
                designation: "Owner",
                monthly_gross_income: 150000,
                monthly_net_income: 120000,
                work_experience_years: 12,
                current_job_experience_years: 8,
                industry_type: "Retail",
                employment_status: "self_employed"
            },
            address_details: {
                current_address: {
                    street_address: "Shop No 15, Market Square",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560001",
                    residence_type: "owned",
                    years_at_address: 10
                },
                permanent_address: {
                    street_address: "Shop No 15, Market Square",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560001",
                    same_as_current: true
                }
            },
            banking_details: {
                account_number: "9876543210",
                ifsc_code: "ICIC0009876",
                bank_name: "ICICI Bank",
                account_type: "current",
                average_monthly_balance: 200000,
                banking_relationship_years: 10
            },
            references: {
                personal_reference_1: {
                    name: "Rajesh Agarwal",
                    relationship: "business_partner",
                    mobile: "8765432108",
                    email: "rajesh.agarwal@email.com"
                },
                personal_reference_2: {
                    name: "Meera Iyer",
                    relationship: "supplier",
                    mobile: "8765432107",
                    email: "meera.iyer@email.com"
                }
            }
        }
    },

    // Scenario 4: Edge Case - Young Applicant
    young_applicant: {
        stage1: {
            applicantName: "ARUN KUMAR",
            phone: "7654321098",
            email: "arun.kumar@startup.com",
            panNumber: "ARUNK5678A",
            dateOfBirth: "2000-12-05",
            loanAmount: 200000,
            loanPurpose: "education",
            employmentType: "salaried"
        },
        stage2: {
            personal_details: {
                aadhaar_number: "112233445566",
                marital_status: "single",
                number_of_dependents: 0,
                education_level: "graduate"
            },
            employment_details: {
                employment_type: "salaried",
                company_name: "StartupXYZ",
                designation: "Junior Developer",
                monthly_gross_income: 45000,
                monthly_net_income: 38000,
                work_experience_years: 1,
                current_job_experience_years: 1,
                industry_type: "Information Technology",
                employment_status: "permanent"
            },
            address_details: {
                current_address: {
                    street_address: "Flat 3B, Student Housing",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500001",
                    residence_type: "rented",
                    years_at_address: 1
                },
                permanent_address: {
                    street_address: "Flat 3B, Student Housing",
                    city: "Hyderabad",
                    state: "Telangana",
                    pincode: "500001",
                    same_as_current: true
                }
            },
            banking_details: {
                account_number: "1122334455",
                ifsc_code: "AXIS0001122",
                bank_name: "Axis Bank",
                account_type: "savings",
                average_monthly_balance: 25000,
                banking_relationship_years: 2
            },
            references: {
                personal_reference_1: {
                    name: "Vikram Singh",
                    relationship: "friend",
                    mobile: "7654321097",
                    email: "vikram.singh@email.com"
                },
                personal_reference_2: {
                    name: "Anjali Reddy",
                    relationship: "colleague",
                    mobile: "7654321096",
                    email: "anjali.reddy@email.com"
                }
            }
        }
    }
};

async function testScenario(scenarioName, scenarioData) {
    console.log(`\n🧪 Testing Scenario: ${scenarioName.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const results = {
        scenario: scenarioName,
        stage1: null,
        stage2: null,
        status: null,
        success: false
    };
    
    try {
        // Test Stage 1
        console.log('📤 Testing Stage 1...');
        const stage1Response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, scenarioData.stage1, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (stage1Response.data.success && stage1Response.data.data.success) {
            const stage1Data = stage1Response.data.data;
            results.stage1 = {
                success: true,
                applicationNumber: stage1Data.applicationNumber,
                status: stage1Data.status,
                cibilScore: stage1Data.cibil_score,
                decisionScore: stage1Data.decision_score,
                processingTime: stage1Data.processing_time_ms
            };
            
            console.log(`✅ Stage 1 PASSED - App: ${stage1Data.applicationNumber}, Score: ${stage1Data.cibil_score}, Status: ${stage1Data.status}`);
            
            // Test Stage 2 (only if Stage 1 passed)
            if (stage1Data.status === 'approved') {
                console.log('📤 Testing Stage 2...');
                try {
                    const stage2Response = await axios.post(`${API_BASE_URL}/loan-application/${stage1Data.applicationNumber}`, scenarioData.stage2, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (stage2Response.data.success) {
                        results.stage2 = {
                            success: true,
                            status: stage2Response.data.status,
                            processingTime: stage2Response.data.processing_time_ms
                        };
                        console.log(`✅ Stage 2 PASSED - Status: ${stage2Response.data.status}`);
                    } else {
                        results.stage2 = { success: false, error: stage2Response.data.error };
                        console.log(`❌ Stage 2 FAILED - ${stage2Response.data.error}`);
                    }
                } catch (stage2Error) {
                    results.stage2 = { success: false, error: stage2Error.message };
                    console.log(`💥 Stage 2 EXCEPTION - ${stage2Error.message}`);
                }
                
                // Test Status Check
                try {
                    const statusResponse = await axios.get(`${API_BASE_URL}/pre-qualification/status/${stage1Data.applicationNumber}`);
                    if (statusResponse.data.success) {
                        results.status = { success: true, data: statusResponse.data.data };
                        console.log(`✅ Status Check PASSED`);
                    } else {
                        results.status = { success: false };
                        console.log(`❌ Status Check FAILED`);
                    }
                } catch (statusError) {
                    results.status = { success: false, error: statusError.message };
                    console.log(`💥 Status Check EXCEPTION - ${statusError.message}`);
                }
            } else {
                console.log(`⚠️ Stage 1 not approved (${stage1Data.status}) - skipping Stage 2`);
            }
            
            results.success = true;
            
        } else {
            results.stage1 = { success: false, error: stage1Response.data.error };
            console.log(`❌ Stage 1 FAILED - ${stage1Response.data.error}`);
        }
        
    } catch (error) {
        results.stage1 = { success: false, error: error.message };
        console.log(`💥 Stage 1 EXCEPTION - ${error.message}`);
    }
    
    return results;
}

async function runCompleteWorkflowTest() {
    console.log('🚀 Starting Complete Workflow Test with Representative Data');
    console.log('='.repeat(60));
    
    const allResults = [];
    const startTime = Date.now();
    
    // Test all scenarios
    for (const [scenarioName, scenarioData] of Object.entries(testScenarios)) {
        const result = await testScenario(scenarioName, scenarioData);
        allResults.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const totalTime = Date.now() - startTime;
    
    // Generate Summary Report
    console.log('\n📊 COMPLETE WORKFLOW TEST SUMMARY');
    console.log('='.repeat(50));
    
    const summary = {
        totalScenarios: allResults.length,
        successfulScenarios: allResults.filter(r => r.success).length,
        stage1Success: allResults.filter(r => r.stage1?.success).length,
        stage2Success: allResults.filter(r => r.stage2?.success).length,
        statusCheckSuccess: allResults.filter(r => r.status?.success).length,
        totalTime: totalTime,
        averageTimePerScenario: totalTime / allResults.length
    };
    
    console.log(`📈 Test Results:`);
    console.log(`   Total Scenarios: ${summary.totalScenarios}`);
    console.log(`   Successful Scenarios: ${summary.successfulScenarios}/${summary.totalScenarios}`);
    console.log(`   Stage 1 Success Rate: ${summary.stage1Success}/${summary.totalScenarios} (${((summary.stage1Success/summary.totalScenarios)*100).toFixed(1)}%)`);
    console.log(`   Stage 2 Success Rate: ${summary.stage2Success}/${summary.totalScenarios} (${((summary.stage2Success/summary.totalScenarios)*100).toFixed(1)}%)`);
    console.log(`   Status Check Success Rate: ${summary.statusCheckSuccess}/${summary.totalScenarios} (${((summary.statusCheckSuccess/summary.totalScenarios)*100).toFixed(1)}%)`);
    console.log(`   Total Test Time: ${summary.totalTime}ms`);
    console.log(`   Average Time per Scenario: ${summary.averageTimePerScenario.toFixed(0)}ms`);
    
    // Detailed Results
    console.log('\n📋 DETAILED RESULTS BY SCENARIO');
    console.log('='.repeat(50));
    
    allResults.forEach(result => {
        console.log(`\n${result.scenario.toUpperCase()}:`);
        console.log(`  Stage 1: ${result.stage1?.success ? '✅ PASS' : '❌ FAIL'} ${result.stage1?.cibilScore ? `(CIBIL: ${result.stage1.cibilScore})` : ''}`);
        console.log(`  Stage 2: ${result.stage2?.success ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Status: ${result.status?.success ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    // Performance Analysis
    console.log('\n🔍 PERFORMANCE ANALYSIS');
    console.log('='.repeat(30));
    
    const stage1Times = allResults.filter(r => r.stage1?.success).map(r => r.stage1.processingTime);
    const stage2Times = allResults.filter(r => r.stage2?.success).map(r => r.stage2.processingTime);
    
    if (stage1Times.length > 0) {
        const avgStage1Time = stage1Times.reduce((a, b) => a + b, 0) / stage1Times.length;
        console.log(`Stage 1 Average Time: ${avgStage1Time.toFixed(0)}ms`);
    }
    
    if (stage2Times.length > 0) {
        const avgStage2Time = stage2Times.reduce((a, b) => a + b, 0) / stage2Times.length;
        console.log(`Stage 2 Average Time: ${avgStage2Time.toFixed(0)}ms`);
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('='.repeat(20));
    
    if (summary.stage1Success === summary.totalScenarios) {
        console.log('✅ Stage 1 is working excellently across all scenarios');
    } else {
        console.log('⚠️ Stage 1 needs attention for some scenarios');
    }
    
    if (summary.stage2Success === summary.totalScenarios) {
        console.log('✅ Stage 2 is working excellently across all scenarios');
    } else {
        console.log('⚠️ Stage 2 needs attention - database schema issues identified');
    }
    
    if (summary.statusCheckSuccess === summary.totalScenarios) {
        console.log('✅ Status checking is working excellently');
    } else {
        console.log('⚠️ Status checking needs attention');
    }
    
    return { summary, detailedResults: allResults };
}

// Run the complete workflow test
runCompleteWorkflowTest().catch(console.error);
