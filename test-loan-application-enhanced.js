/**
 * Test script for enhanced loan application with CIBIL cross-verification
 * This demonstrates the complete loan application flow with employment verification,
 * account statement analysis, and payslip verification
 */

const LoanApplicationService = require('./components/loan-application/service');
const logger = require('./middleware/utils/logger');

async function testEnhancedLoanApplication() {
    const requestId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log('\n=== Enhanced Loan Application Test ===\n');
        
        // Initialize service
        const loanApplicationService = new LoanApplicationService();
        
        // Use the existing pre-qualification ID from our previous test
        const preQualificationId = 'APP_1756149283965_kt1dbnlqf';
        
        // Sample loan application data with employment details
        const applicationData = {
            loan_details: {
                loan_type: 'personal',
                requested_amount: 500000,
                tenure_months: 36,
                purpose: 'debt_consolidation'
            },
            employment_details: {
                company_name: 'Tech Solutions Pvt Ltd',
                monthly_salary: 85000,
                work_experience: 48, // 4 years in months
                employment_type: 'salaried',
                designation: 'Senior Software Engineer'
            },
            financial_details: {
                monthly_income: 85000,
                monthly_expenses: 35000,
                existing_emis: 12000,
                bank_balance: 150000,
                assets: [
                    { type: 'savings_account', value: 150000 },
                    { type: 'fixed_deposit', value: 200000 },
                    { type: 'mutual_funds', value: 100000 }
                ],
                liabilities: [
                    { type: 'credit_card', amount: 25000 },
                    { type: 'personal_loan', amount: 180000 }
                ]
            },
            // Demo account statement data (in production, this would come from Account Aggregator)
            account_statement_data: null, // Will use demo data
            
            // Demo payslip data (in production, this would come from Surepass OCR)
            payslip_data: null, // Will use demo data
            
            documents: [
                { type: 'salary_certificate', status: 'uploaded' },
                { type: 'bank_statement', status: 'uploaded' },
                { type: 'identity_proof', status: 'uploaded' }
            ]
        };
        
        console.log('1. Processing loan application with enhanced verification...');
        console.log(`   Pre-qualification ID: ${preQualificationId}`);
        console.log(`   Requested Amount: ₹${applicationData.loan_details.requested_amount.toLocaleString()}`);
        console.log(`   User Monthly Salary: ₹${applicationData.employment_details.monthly_salary.toLocaleString()}`);
        console.log(`   User Work Experience: ${applicationData.employment_details.work_experience} months`);
        
        // Process the loan application
        const result = await loanApplicationService.processLoanApplication(
            applicationData,
            preQualificationId,
            requestId
        );
        
        console.log('\n2. Processing Results:');
        console.log(`   Overall Success: ${result.success}`);
        console.log(`   Application ID: ${result.application_id}`);
        console.log(`   Phase Status: ${result.phase_status}`);
        
        if (result.processing_results) {
            // CIBIL Employment Verification Results
            if (result.processing_results.cibil_employment_verification) {
                const cibilVerif = result.processing_results.cibil_employment_verification;
                console.log('\n3. CIBIL Employment Verification:');
                console.log(`   Status: ${cibilVerif.status}`);
                console.log(`   Verification Score: ${cibilVerif.verification_score}/100`);
                
                if (cibilVerif.cibil_employment_data) {
                    console.log(`   CIBIL Income: ₹${cibilVerif.cibil_employment_data.income?.toLocaleString() || 'N/A'}`);
                    console.log(`   CIBIL Employment Duration: ${cibilVerif.cibil_employment_data.employment_duration || 'N/A'} months`);
                }
                
                if (cibilVerif.verification_results) {
                    const verif = cibilVerif.verification_results;
                    console.log('\n   Verification Details:');
                    if (verif.income_consistency) {
                        console.log(`   - Income Consistency: ${verif.income_consistency.consistent ? 'PASS' : 'FAIL'} (Score: ${verif.income_consistency.score})`);
                        console.log(`     Variance: ${verif.income_consistency.variance}%`);
                    }
                    if (verif.employment_duration) {
                        console.log(`   - Employment Duration: ${verif.employment_duration.consistent ? 'PASS' : 'FAIL'} (Score: ${verif.employment_duration.score})`);
                    }
                }
                
                if (cibilVerif.recommendations && cibilVerif.recommendations.length > 0) {
                    console.log('\n   Recommendations:');
                    cibilVerif.recommendations.forEach(rec => console.log(`   - ${rec}`));
                }
            }
            
            // Account Statement Verification Results
            if (result.processing_results.account_statement_verification) {
                const accountVerif = result.processing_results.account_statement_verification;
                console.log('\n4. Account Statement Verification:');
                console.log(`   Status: ${accountVerif.status}`);
                console.log(`   Verification Score: ${accountVerif.verification_score}/100`);
                
                if (accountVerif.verification_results) {
                    const verif = accountVerif.verification_results;
                    console.log('\n   Analysis Results:');
                    if (verif.income_analysis) {
                        console.log(`   - Average Monthly Income: ₹${verif.income_analysis.average_monthly_income?.toLocaleString() || 'N/A'}`);
                        console.log(`   - Income Stability: ${verif.income_analysis.stability_score}/100`);
                    }
                    if (verif.expense_analysis) {
                        console.log(`   - Average Monthly Expenses: ₹${verif.expense_analysis.average_monthly_expenses?.toLocaleString() || 'N/A'}`);
                    }
                    if (verif.risk_indicators && verif.risk_indicators.length > 0) {
                        console.log('\n   Risk Indicators:');
                        verif.risk_indicators.forEach(risk => console.log(`   - ${risk}`));
                    }
                }
            }
            
            // Payslip Verification Results
            if (result.processing_results.payslip_verification) {
                const payslipVerif = result.processing_results.payslip_verification;
                console.log('\n5. Payslip Verification:');
                console.log(`   Status: ${payslipVerif.status}`);
                console.log(`   Verification Score: ${payslipVerif.verification_score}/100`);
                
                if (payslipVerif.verification_results) {
                    const verif = payslipVerif.verification_results;
                    console.log('\n   Verification Details:');
                    if (verif.employee_verification) {
                        console.log(`   - Employee Details: ${verif.employee_verification.verified ? 'VERIFIED' : 'FAILED'} (Score: ${verif.employee_verification.score})`);
                    }
                    if (verif.employer_verification) {
                        console.log(`   - Employer Details: ${verif.employer_verification.verified ? 'VERIFIED' : 'FAILED'} (Score: ${verif.employer_verification.score})`);
                    }
                    if (verif.salary_verification) {
                        console.log(`   - Salary Verification: ${verif.salary_verification.verified ? 'VERIFIED' : 'FAILED'} (Score: ${verif.salary_verification.score})`);
                    }
                }
            }
            
            // Enhanced Financial Assessment
            if (result.processing_results.financial_assessment) {
                const finAssess = result.processing_results.financial_assessment;
                console.log('\n6. Enhanced Financial Assessment:');
                console.log(`   DTI Ratio: ${finAssess.dti_ratio}%`);
                console.log(`   Financial Stability Score: ${finAssess.financial_stability_score}/100`);
                console.log(`   Net Worth: ₹${finAssess.net_worth?.toLocaleString() || 'N/A'}`);
                console.log(`   Monthly Disposable Income: ₹${finAssess.monthly_disposable_income?.toLocaleString() || 'N/A'}`);
                
                if (finAssess.enhanced_assessment) {
                    const enhanced = finAssess.enhanced_assessment;
                    console.log('\n   Enhanced Assessment:');
                    console.log(`   - Enhanced Score: ${enhanced.enhanced_score}/100 (Base: ${enhanced.base_score})`);
                    console.log(`   - Risk Level: ${enhanced.risk_level.toUpperCase()}`);
                    console.log(`   - Recommendation: ${enhanced.recommendation.toUpperCase()}`);
                    
                    if (enhanced.adjustments && enhanced.adjustments.length > 0) {
                        console.log('\n   Score Adjustments:');
                        enhanced.adjustments.forEach(adj => console.log(`   - ${adj}`));
                    }
                }
                
                if (finAssess.verification_summary) {
                    const summary = finAssess.verification_summary;
                    console.log('\n   Verification Summary:');
                    console.log(`   - CIBIL Employment Score: ${summary.cibil_employment_score}/100`);
                    console.log(`   - Account Statement Score: ${summary.account_statement_score}/100`);
                    console.log(`   - Payslip Verification Score: ${summary.payslip_verification_score}/100`);
                    console.log(`   - Combined Verification Score: ${summary.combined_verification_score}/100`);
                }
            }
        }
        
        // Overall Result
        if (result.overall_result) {
            console.log('\n7. Final Decision:');
            console.log(`   Approved: ${result.overall_result.approved ? 'YES' : 'NO'}`);
            if (result.overall_result.eligible_amount) {
                console.log(`   Eligible Amount: ₹${result.overall_result.eligible_amount.toLocaleString()}`);
            }
            if (result.overall_result.rejection_reason) {
                console.log(`   Rejection Reason: ${result.overall_result.rejection_reason}`);
            }
            if (result.overall_result.recommendations && result.overall_result.recommendations.length > 0) {
                console.log('\n   Recommendations:');
                result.overall_result.recommendations.forEach(rec => console.log(`   - ${rec}`));
            }
        }
        
        console.log('\n=== Test Completed Successfully ===\n');
        
    } catch (error) {
        console.error('\n=== Test Failed ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testEnhancedLoanApplication();
}

module.exports = { testEnhancedLoanApplication };