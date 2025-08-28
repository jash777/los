/**
 * Test Template Population
 * Test script to verify HTML template population is working correctly
 */

const PDFGeneratorService = require('../src/services/pdf-generator');
const fs = require('fs').promises;
const path = require('path');

async function testTemplatePopulation() {
    console.log('🧪 Testing Template Population');
    console.log('==============================');
    
    const applicationNumber = 'EL_1756358155286_itgiitlzf';
    
    try {
        // Read the application data
        const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
        
        // Read the HTML template
        const templatePath = path.join(__dirname, 'loan-application-template.html');
        let htmlTemplate = await fs.readFile(templatePath, 'utf8');
        
        // Create PDF generator instance
        const pdfGenerator = new PDFGeneratorService();
        
        // Test the population function
        const populatedHTML = pdfGenerator.populateHTMLTemplate(htmlTemplate, applicationData);
        
        // Save the populated HTML for inspection
        const debugPath = path.join(__dirname, `applications/${applicationNumber}/debug-populated-template.html`);
        await fs.writeFile(debugPath, populatedHTML);
        
        console.log('✅ Template population completed');
        console.log('📄 Debug HTML saved to:', debugPath);
        
        // Check for specific fields in the populated HTML
        console.log('\n🔍 Field Population Check:');
        
        const fieldChecks = [
            { name: 'Application Number', pattern: applicationData.application_info.application_number },
            { name: 'Full Name', pattern: applicationData.stage_1_data.personal_details.full_name },
            { name: 'PAN Number', pattern: applicationData.stage_1_data.personal_details.pan_number },
            { name: 'Mobile Number', pattern: applicationData.stage_1_data.personal_details.mobile },
            { name: 'Email', pattern: applicationData.stage_1_data.personal_details.email },
            { name: 'Date of Birth', pattern: applicationData.stage_1_data.personal_details.date_of_birth },
            { name: 'Aadhaar Number', pattern: applicationData.stage_2_data.personal_details.aadhaar_number },
            { name: 'Marital Status', pattern: applicationData.stage_2_data.personal_details.marital_status },
            { name: 'Company Name', pattern: applicationData.stage_2_data.employment_details.company_name },
            { name: 'Designation', pattern: applicationData.stage_2_data.employment_details.designation },
            { name: 'Employment Type', pattern: applicationData.stage_2_data.employment_details.employment_type },
            { name: 'Work Experience', pattern: applicationData.stage_2_data.employment_details.work_experience_years.toString() },
            { name: 'Monthly Income', pattern: applicationData.stage_2_data.employment_details.monthly_gross_income.toLocaleString('en-IN') },
            { name: 'Loan Amount', pattern: applicationData.stage_1_data.loan_request.loan_amount.toLocaleString('en-IN') },
            { name: 'Loan Purpose', pattern: applicationData.stage_1_data.loan_request.loan_purpose },
            { name: 'Tenure', pattern: applicationData.stage_1_data.loan_request.preferred_tenure_months.toString() },
            { name: 'Bank Name', pattern: applicationData.stage_2_data.banking_details.bank_name },
            { name: 'Account Number', pattern: applicationData.stage_2_data.banking_details.account_number },
            { name: 'IFSC Code', pattern: applicationData.stage_2_data.banking_details.ifsc_code },
            { name: 'CIBIL Score', pattern: applicationData.third_party_data.cibil_data.score.toString() },
            { name: 'Reference 1 Name', pattern: applicationData.stage_2_data.references['0'].name },
            { name: 'Reference 2 Name', pattern: applicationData.stage_2_data.references['1'].name }
        ];
        
        let successCount = 0;
        let totalCount = fieldChecks.length;
        
        fieldChecks.forEach(check => {
            const found = populatedHTML.includes(check.pattern);
            console.log(`  ${check.name}: ${found ? '✅ Found' : '❌ Missing'} (${check.pattern})`);
            if (found) successCount++;
        });
        
        console.log(`\n📊 Population Summary: ${successCount}/${totalCount} fields populated successfully`);
        
        if (successCount === totalCount) {
            console.log('🎉 All fields populated successfully!');
        } else {
            console.log('⚠️  Some fields are missing. Check the debug HTML file for details.');
        }
        
    } catch (error) {
        console.error('❌ Error testing template population:', error.message);
    }
}

testTemplatePopulation();
