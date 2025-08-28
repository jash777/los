/**
 * PDF Generator Service
 * Converts loan application data to professional PDF documents
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class PDFGeneratorService {
    constructor() {
        this.templatePath = path.join(__dirname, '../../loan-application-template.html');
    }

    /**
     * Generate loan application PDF from application data
     */
    async generateLoanApplicationPDF(applicationData, outputPath) {
        try {
            logger.info(`Generating PDF for application: ${applicationData.application_info.application_number}`);
            
            // Read the HTML template
            let htmlTemplate = await fs.readFile(this.templatePath, 'utf8');
            
            // Inject the application data into the HTML
            const populatedHTML = this.populateHTMLTemplate(htmlTemplate, applicationData);
            
            // Generate PDF using Puppeteer
            const pdfBuffer = await this.convertHTMLToPDF(populatedHTML);
            
            // Save the PDF file
            await fs.writeFile(outputPath, pdfBuffer);
            
            logger.info(`PDF generated successfully: ${outputPath}`);
            
            return {
                success: true,
                filePath: outputPath,
                fileSize: pdfBuffer.length,
                applicationNumber: applicationData.application_info.application_number
            };
            
        } catch (error) {
            logger.error('PDF generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Populate HTML template with application data
     */
    populateHTMLTemplate(htmlTemplate, applicationData) {
        // For the new form-based template, we need to directly replace placeholders
        let populatedHTML = htmlTemplate;
        
        // Replace application number
        populatedHTML = populatedHTML.replace(
            'Application No: <strong>_____________</strong>',
            `Application No: <strong>${applicationData.application_info.application_number}</strong>`
        );
        
        // Create a mapping of field patterns to values for systematic replacement
        const fieldMappings = [
            // Personal Information Section
            {
                pattern: /<td class="label-col">Full Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Full Name <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_1_data.personal_details.full_name}</td>`
            },
            {
                pattern: /<td class="label-col">Date of Birth <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col">DD\/MM\/YYYY<\/td>/,
                replacement: `<td class="label-col">Date of Birth <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_1_data.personal_details.date_of_birth}</td>`
            },
            {
                pattern: /<td class="label-col">PAN Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">PAN Number <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_1_data.personal_details.pan_number}</td>`
            },
            {
                pattern: /<td class="label-col">Aadhaar Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Aadhaar Number <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.personal_details.aadhaar_number}</td>`
            },
            {
                pattern: /<td class="label-col">Mobile Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Mobile Number <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_1_data.personal_details.mobile}</td>`
            },
            {
                pattern: /<td class="label-col">Email Address <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Email Address <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_1_data.personal_details.email}</td>`
            },
            
            // Marital Status
            {
                pattern: /☐ Single ☐ Married ☐ Divorced ☐ Widow\/er/,
                replacement: `☐ Single ☐ Married ☐ Divorced ☐ Widow/er <strong>(${applicationData.stage_2_data.personal_details.marital_status})</strong>`
            },
            
            // Address Details
            {
                pattern: /<td class="label-col">Current Address <span class="mandatory">\*<\/span><br><small>\(Residence\)<\/small><\/td>\s*<td colspan="3"><\/td>/,
                replacement: `<td class="label-col">Current Address <span class="mandatory">*</span><br><small>(Residence)</small></td>\n                    <td colspan="3">${applicationData.stage_2_data.address_details.current_address.street_address}, ${applicationData.stage_2_data.address_details.current_address.city}, ${applicationData.stage_2_data.address_details.current_address.state} - ${applicationData.stage_2_data.address_details.current_address.pincode}</td>`
            },
            {
                pattern: /<td class="label-col">City <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">City <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.address_details.current_address.city}</td>`
            },
            {
                pattern: /<td class="label-col">State <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">State <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.address_details.current_address.state}</td>`
            },
            {
                pattern: /<td class="label-col">PIN Code <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">PIN Code <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.address_details.current_address.pincode}</td>`
            },
            
            // Employment Details
            {
                pattern: /☐ Salaried ☐ Self-Employed Professional ☐ Self-Employed Business ☐ Pensioner ☐ Others: ____________/,
                replacement: `☐ Salaried ☐ Self-Employed Professional ☐ Self-Employed Business ☐ Pensioner ☐ Others: ____________ <strong>(${applicationData.stage_2_data.employment_details.employment_type})</strong>`
            },
            {
                pattern: /<td class="label-col">Company\/Business Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Company/Business Name <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.employment_details.company_name}</td>`
            },
            {
                pattern: /<td class="label-col">Designation <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Designation <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.employment_details.designation}</td>`
            },
            {
                pattern: /<td class="label-col">Total Work Experience<\/td>\s*<td class="input-col">_____ Years _____ Months<\/td>/,
                replacement: `<td class="label-col">Total Work Experience</td>\n                    <td class="input-col">${applicationData.stage_2_data.employment_details.work_experience_years} Years _____ Months</td>`
            },
            
            // Income Table
            {
                pattern: /<td >Basic Salary <span class="mandatory">\*<\/span><\/td>\s*<td class="amount-box"><\/td>/,
                replacement: `<td >Basic Salary <span class="mandatory">*</span></td>\n                <td class="amount-box">₹ ${applicationData.stage_2_data.employment_details.monthly_gross_income.toLocaleString('en-IN')}</td>`
            },
            {
                pattern: /<td>Total Monthly Income <span class="mandatory">\*<\/span><\/td>\s*<td class="amount-box">₹ [\d,]+<\/td>/,
                replacement: `<td>Total Monthly Income <span class="mandatory">*</span></td>\n                <td class="amount-box">₹ ${applicationData.stage_2_data.employment_details.monthly_gross_income.toLocaleString('en-IN')}</td>`
            },
            
            // Loan Details
            {
                pattern: /<td class="input-col amount-box">₹ ________________<\/td>/,
                replacement: `<td class="input-col amount-box">₹ ${applicationData.stage_1_data.loan_request.loan_amount.toLocaleString('en-IN')}</td>`
            },
            {
                pattern: /<td class="input-col">_______ Months<\/td>/,
                replacement: `<td class="input-col">${applicationData.stage_1_data.loan_request.preferred_tenure_months} Months</td>`
            },
            {
                pattern: /☐ Wedding ☐ Medical Emergency ☐ Home Renovation ☐ Education ☐ Travel ☐ Business ☐ Debt Consolidation ☐ Others: __________/,
                replacement: `☐ Wedding ☐ Medical Emergency ☐ Home Renovation ☐ Education ☐ Travel ☐ Business ☐ Debt Consolidation ☐ Others: __________ <strong>(${applicationData.stage_1_data.loan_request.loan_purpose})</strong>`
            },
            
            // Banking Details
            {
                pattern: /<td class="label-col">Primary Bank Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Primary Bank Name <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.banking_details.bank_name}</td>`
            },
            {
                pattern: /<td class="label-col">Account Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">Account Number <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.banking_details.account_number}</td>`
            },
            {
                pattern: /<td class="label-col">IFSC Code <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">IFSC Code <span class="mandatory">*</span></td>\n                    <td class="input-col">${applicationData.stage_2_data.banking_details.ifsc_code}</td>`
            },
            {
                pattern: /☐ Savings ☐ Current/,
                replacement: `☐ Savings ☐ Current <strong>(${applicationData.third_party_data.bank_statement_analysis.account_info.account_type})</strong>`
            },
            
            // References - Handle them more carefully to avoid duplicates
            // First, replace the first reference section
            {
                pattern: /<td>\s*<strong>Name:<\/strong> ________________________<br><br>\s*<strong>Relationship:<\/strong> _________________<br><br>\s*<strong>Mobile:<\/strong> ______________________<br><br>\s*<strong>Address:<\/strong> ____________________<br>\s*_______________________________________/,
                replacement: `<td>\n                        <strong>Name:</strong> ${applicationData.stage_2_data.references['0'].name}<br><br>\n                        <strong>Relationship:</strong> ${applicationData.stage_2_data.references['0'].relationship}<br><br>\n                        <strong>Mobile:</strong> ${applicationData.stage_2_data.references['0'].mobile}<br><br>\n                        <strong>Address:</strong> ${applicationData.stage_2_data.references['0'].address}<br>\n                        _______________________________________`
            },
            // Then replace the second reference section
            {
                pattern: /<td>\s*<strong>Name:<\/strong> ________________________<br><br>\s*<strong>Relationship:<\/strong> _________________<br><br>\s*<strong>Mobile:<\/strong> ______________________<br><br>\s*<strong>Address:<\/strong> ____________________<br>\s*_______________________________________/,
                replacement: `<td>\n                        <strong>Name:</strong> ${applicationData.stage_2_data.references['1'].name}<br><br>\n                        <strong>Relationship:</strong> ${applicationData.stage_2_data.references['1'].relationship}<br><br>\n                        <strong>Mobile:</strong> ${applicationData.stage_2_data.references['1'].mobile}<br><br>\n                        <strong>Address:</strong> ${applicationData.stage_2_data.references['1'].address}<br>\n                        _______________________________________`
            },
            
            // Bank Use Section
            {
                pattern: /<td class="label-col">CIBIL Score<\/td>\s*<td class="input-col"><\/td>/,
                replacement: `<td class="label-col">CIBIL Score</td>\n                    <td class="input-col">${applicationData.third_party_data.cibil_data.score}</td>`
            },
            {
                pattern: /<td class="label-col">Sanctioned Amount<\/td>\s*<td class="input-col amount-box">₹ __________<\/td>/,
                replacement: `<td class="label-col">Sanctioned Amount</td>\n                    <td class="input-col amount-box">₹ ${applicationData.stage_1_data.loan_request.loan_amount.toLocaleString('en-IN')}</td>`
            }
        ];
        
        // Apply all field mappings
        fieldMappings.forEach(mapping => {
            populatedHTML = populatedHTML.replace(mapping.pattern, mapping.replacement);
        });
        
        // Add generated date
        const generatedDate = new Date().toLocaleString('en-IN');
        populatedHTML = populatedHTML.replace(
            '<p>Subject to Terms & Conditions | This form is valid for 30 days from date of issue</p>',
            `<p>Generated on: ${generatedDate} | Subject to Terms & Conditions | This form is valid for 30 days from date of issue</p>`
        );
        
        return populatedHTML;
    }

    /**
     * Convert HTML to PDF using Puppeteer
     */
    async convertHTMLToPDF(htmlContent) {
        let browser;
        try {
            // Launch browser
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Set content and wait for JavaScript to execute
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            // Wait a bit for any dynamic content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                },
                displayHeaderFooter: false
            });
            
            return pdfBuffer;
            
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Generate PDF for a specific application number
     */
    async generatePDFForApplication(applicationNumber) {
        try {
            // Read the application data
            const applicationDataPath = path.join(__dirname, `../../applications/${applicationNumber}/application-data.json`);
            const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
            
            // Create output directory if it doesn't exist
            const outputDir = path.join(__dirname, `../../applications/${applicationNumber}/documents`);
            await fs.mkdir(outputDir, { recursive: true });
            
            // Generate PDF file path
            const pdfFileName = `loan-application-${applicationNumber}.pdf`;
            const outputPath = path.join(outputDir, pdfFileName);
            
            // Generate the PDF
            return await this.generateLoanApplicationPDF(applicationData, outputPath);
            
        } catch (error) {
            logger.error(`Failed to generate PDF for ${applicationNumber}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate a simple text-based application summary
     */
    async generateTextSummary(applicationData) {
        const summary = `
LOAN APPLICATION SUMMARY
========================

Application Number: ${applicationData.application_info.application_number}
Status: ${applicationData.application_info.status.toUpperCase()}
Generated: ${new Date().toLocaleString('en-IN')}

PERSONAL INFORMATION
-------------------
Name: ${applicationData.stage_1_data.personal_details.full_name}
Mobile: ${applicationData.stage_1_data.personal_details.mobile}
Email: ${applicationData.stage_1_data.personal_details.email}
PAN: ${applicationData.stage_1_data.personal_details.pan_number}
DOB: ${applicationData.stage_1_data.personal_details.date_of_birth}

LOAN DETAILS
------------
Amount: ₹${applicationData.stage_1_data.loan_request.loan_amount.toLocaleString('en-IN')}
Purpose: ${applicationData.stage_1_data.loan_request.loan_purpose}
Tenure: ${applicationData.stage_1_data.loan_request.preferred_tenure_months} months

EMPLOYMENT
----------
Company: ${applicationData.stage_2_data.employment_details.company_name}
Designation: ${applicationData.stage_2_data.employment_details.designation}
Monthly Income: ₹${applicationData.stage_2_data.employment_details.monthly_gross_income.toLocaleString('en-IN')}

CREDIT ASSESSMENT
-----------------
CIBIL Score: ${applicationData.third_party_data.cibil_data.score}
Credit Grade: ${applicationData.third_party_data.cibil_data.grade}
Decision Score: ${applicationData.stage_2_data.application_result.score}

ELIGIBILITY ASSESSMENT
---------------------
${applicationData.stage_1_data.eligibility_result.reasons.map(reason => `• ${reason}`).join('\n')}

BANKING DETAILS
---------------
Bank: ${applicationData.stage_2_data.banking_details.bank_name}
Account: ${applicationData.stage_2_data.banking_details.account_number}
IFSC: ${applicationData.stage_2_data.banking_details.ifsc_code}

RECOMMENDED TERMS
-----------------
Interest Rate: ${applicationData.stage_2_data.application_result.recommended_terms.interest_rate.rate}%
Processing Fee: ${applicationData.stage_2_data.application_result.recommended_terms.fees.processing_fee_percentage}%

NEXT STEPS
----------
${applicationData.stage_2_data.application_result.positive_factors.map(factor => `✓ ${factor}`).join('\n')}

CONDITIONS
----------
${applicationData.stage_2_data.application_result.recommended_terms.conditions.map(condition => `• ${condition}`).join('\n')}

---
This is a computer-generated summary of the loan application.
For detailed information, please refer to the complete application form.
        `;
        
        return summary.trim();
    }
}

module.exports = PDFGeneratorService;
