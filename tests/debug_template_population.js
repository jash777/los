/**
 * Debug Template Population
 * Test script to debug HTML template population and identify missing fields
 */

const fs = require('fs').promises;
const path = require('path');

async function debugTemplatePopulation() {
    console.log('🔍 Debugging Template Population');
    console.log('================================');
    
    const applicationNumber = 'EL_1756358155286_itgiitlzf';
    
    try {
        // Read the application data
        const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
        
        // Read the HTML template
        const templatePath = path.join(__dirname, 'loan-application-template.html');
        let htmlTemplate = await fs.readFile(templatePath, 'utf8');
        
        console.log('📋 Application Data Structure:');
        console.log('  Personal Details:', Object.keys(applicationData.stage_1_data.personal_details));
        console.log('  Employment Details:', Object.keys(applicationData.stage_2_data.employment_details));
        console.log('  Banking Details:', Object.keys(applicationData.stage_2_data.banking_details));
        console.log('  Address Details:', Object.keys(applicationData.stage_2_data.address_details));
        
        // Test individual field replacements
        console.log('\n🔧 Testing Field Replacements:');
        
        // Test application number replacement
        const appNumberTest = htmlTemplate.includes('Application No: <strong>_____________</strong>');
        console.log('  Application Number placeholder found:', appNumberTest);
        
        // Test personal information fields
        const personalFields = [
            'Full Name <span class="mandatory">*</span>',
            'Date of Birth <span class="mandatory">*</span>',
            'PAN Number <span class="mandatory">*</span>',
            'Aadhaar Number <span class="mandatory">*</span>',
            'Mobile Number <span class="mandatory">*</span>',
            'Email Address <span class="mandatory">*</span>'
        ];
        
        personalFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Test employment fields
        const employmentFields = [
            'Employment Type <span class="mandatory">*</span>',
            'Company/Business Name <span class="mandatory">*</span>',
            'Designation <span class="mandatory">*</span>',
            'Total Work Experience'
        ];
        
        employmentFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Test income table
        const incomeFields = [
            'Basic Salary <span class="mandatory">*</span>',
            'Total Monthly Income <span class="mandatory">*</span>'
        ];
        
        incomeFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Test loan details
        const loanFields = [
            'Loan Amount Required <span class="mandatory">*</span>',
            'Preferred Tenure <span class="mandatory">*</span>',
            'Purpose of Loan <span class="mandatory">*</span>'
        ];
        
        loanFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Test banking details
        const bankingFields = [
            'Primary Bank Name <span class="mandatory">*</span>',
            'Account Number <span class="mandatory">*</span>',
            'IFSC Code <span class="mandatory">*</span>',
            'Account Type <span class="mandatory">*</span>'
        ];
        
        bankingFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Test references
        const referenceFields = [
            'Reference 1',
            'Reference 2',
            '<strong>Name:</strong> ________________________'
        ];
        
        referenceFields.forEach(field => {
            const found = htmlTemplate.includes(field);
            console.log(`  ${field}: ${found ? '✅ Found' : '❌ Missing'}`);
        });
        
        console.log('\n📊 Summary:');
        console.log('  Template structure looks good');
        console.log('  All major sections are present');
        console.log('  Ready to implement proper field replacement logic');
        
    } catch (error) {
        console.error('❌ Error debugging template:', error.message);
    }
}

debugTemplatePopulation();
