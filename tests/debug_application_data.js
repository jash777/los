/**
 * Debug Application Data
 * Check what data is being saved to the application JSON
 */

const fs = require('fs').promises;
const path = require('path');

async function debugApplicationData(applicationNumber) {
    console.log('🔍 Debugging Application Data:', applicationNumber);
    
    try {
        const appPath = path.join(__dirname, 'applications', applicationNumber, 'application-data.json');
        const data = JSON.parse(await fs.readFile(appPath, 'utf8'));
        
        console.log('\n📋 Application Info:');
        console.log('  Number:', data.application_info.application_number);
        console.log('  Current Stage:', data.application_info.current_stage);
        console.log('  Status:', data.application_info.status);
        console.log('  Created:', data.application_info.created_at);
        console.log('  Updated:', data.application_info.last_updated);
        
        console.log('\n📊 Stage 1 Data:');
        console.log('  Personal Details:', data.stage_1_data.personal_details);
        console.log('  Loan Request:', data.stage_1_data.loan_request);
        console.log('  Eligibility Result:', data.stage_1_data.eligibility_result);
        
        console.log('\n📊 Stage 2 Data:');
        console.log('  Employment Details:', data.stage_2_data.employment_details);
        console.log('  Income Details:', data.stage_2_data.income_details);
        console.log('  Financial Details:', data.stage_2_data.financial_details);
        console.log('  Banking Details:', data.stage_2_data.banking_details);
        console.log('  Address Details:', data.stage_2_data.address_details);
        console.log('  References:', data.stage_2_data.references);
        console.log('  Required Documents:', data.stage_2_data.required_documents);
        console.log('  Additional Information:', data.stage_2_data.additional_information);
        console.log('  Application Result:', data.stage_2_data.application_result);
        
        console.log('\n🔗 Third Party Data:');
        console.log('  CIBIL Data:', data.third_party_data.cibil_data);
        console.log('  PAN Verification:', data.third_party_data.pan_verification);
        console.log('  Employment Verification:', data.third_party_data.employment_verification);
        console.log('  Bank Statement Analysis:', data.third_party_data.bank_statement_analysis);
        
        console.log('\n📈 Processing Stages:');
        Object.keys(data.processing_stages).forEach(stage => {
            console.log(`  ${stage}:`, data.processing_stages[stage].status);
        });
        
        console.log('\n📝 Audit Trail:');
        console.log('  Stage Transitions:', data.audit_trail.stage_transitions.length);
        data.audit_trail.stage_transitions.forEach(transition => {
            console.log(`    ${transition.from_stage} → ${transition.to_stage} at ${transition.timestamp}`);
        });
        
        // Check for missing data
        console.log('\n❌ Missing/Null Data:');
        const missingData = [];
        
        if (!data.stage_2_data.income_details.monthly_salary) missingData.push('Income Details - Monthly Salary');
        if (!data.stage_2_data.financial_details.monthly_expenses) missingData.push('Financial Details - Monthly Expenses');
        if (!data.third_party_data.cibil_data.score) missingData.push('Third Party Data - CIBIL Score');
        if (!data.third_party_data.pan_verification.verified) missingData.push('Third Party Data - PAN Verification');
        if (!data.stage_2_data.required_documents.identity_proof) missingData.push('Required Documents - Identity Proof');
        if (!data.stage_2_data.additional_information || !data.stage_2_data.additional_information.loan_purpose_details) missingData.push('Additional Information - Loan Purpose Details');
        
        if (missingData.length > 0) {
            missingData.forEach(item => console.log(`  - ${item}`));
        } else {
            console.log('  ✅ All data appears to be populated!');
        }
        
    } catch (error) {
        console.error('❌ Error reading application data:', error.message);
    }
}

// Run debug for the latest application
const applicationNumber = process.argv[2] || 'EL_1756355343603_71h5lnhbu';
debugApplicationData(applicationNumber);
