/**
 * Enhanced PDF Generator Service
 * Complete loan application template population and PDF generation
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class EnhancedPDFGeneratorService {
    constructor() {
        this.templatePath = path.join(__dirname, '../../loan-application-template.html');
    }

    /**
     * Generate complete loan application PDF with all fields populated
     */
    async generateCompleteLoanApplicationPDF(applicationData, outputPath) {
        try {
            logger.info(`Generating complete PDF for application: ${applicationData.application_info.application_number}`);

            // 1. Load HTML template
            let htmlTemplate = await fs.readFile(this.templatePath, 'utf8');

            // 2. Normalize and validate data
            const normalizedData = this.normalizeDataForTemplate(applicationData);

            // 3. Populate template with all fields
            const populatedHTML = this.populateCompleteTemplate(htmlTemplate, normalizedData);

            // 4. Generate PDF with enhanced settings
            const pdf = await this.generateHighQualityPDF(populatedHTML);

            // 5. Save PDF file
            await fs.writeFile(outputPath, pdf);

            logger.info(`PDF generated successfully: ${outputPath}`);
            return { 
                success: true, 
                path: outputPath,
                size: pdf.length,
                application_number: applicationData.application_info.application_number
            };

        } catch (error) {
            logger.error('PDF generation failed:', error);
            return {
                success: false,
                error: error.message,
                application_number: applicationData.application_info?.application_number || 'unknown'
            };
        }
    }

    /**
     * Normalize application data for template population
     */
    normalizeDataForTemplate(applicationData) {
        const stage1 = applicationData.stage_1_data || {};
        const stage2 = applicationData.stage_2_data || {};
        const thirdParty = applicationData.third_party_data || {};
        const appInfo = applicationData.application_info || {};

        return {
            // Application Information
            application_number: appInfo.application_number || 'N/A',
            application_date: appInfo.created_at ? new Date(appInfo.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            
            // Personal Details
            personal: {
                full_name: stage1.personal_details?.full_name || stage1.personal_details?.applicant_name || 'N/A',
                date_of_birth: stage1.personal_details?.date_of_birth ? 
                    new Date(stage1.personal_details.date_of_birth).toLocaleDateString('en-IN') : 'N/A',
                father_name: stage2.personal_details?.father_name || 'N/A',
                mother_name: stage2.personal_details?.mother_name || 'N/A',
                gender: stage2.personal_details?.gender || 'N/A',
                marital_status: stage2.personal_details?.marital_status || 'Single',
                pan_number: stage1.personal_details?.pan_number || thirdParty.pan_verification?.panData?.pan_number || 'N/A',
                aadhaar_number: stage2.personal_details?.aadhaar_number || 'N/A',
                mobile_number: stage1.personal_details?.mobile || stage1.personal_details?.phone || 'N/A',
                email_address: stage1.personal_details?.email || 'N/A',
                qualification: stage2.personal_details?.education_level || 'Graduate',
                dependents: stage2.personal_details?.number_of_dependents || '0'
            },

            // Address Details
            address: {
                current_address: this.formatAddress(stage2.address_details?.current_address),
                city: stage2.address_details?.current_address?.city || 'N/A',
                state: stage2.address_details?.current_address?.state || 'N/A',
                pincode: stage2.address_details?.current_address?.pincode || 'N/A',
                residence_type: stage2.address_details?.current_address?.residence_type || 'N/A',
                years_at_address: stage2.address_details?.current_address?.years_at_current_address || 'N/A',
                permanent_same: stage2.address_details?.permanent_address?.same_as_current ? 'Yes' : 'No'
            },

            // Employment Details
            employment: {
                employment_type: stage2.employment_details?.employment_type || stage2.employment_details?.type || stage1.personal_details?.employment_type || 'Salaried',
                company_name: stage2.employment_details?.company_name || 'N/A',
                designation: stage2.employment_details?.designation || 'N/A',
                office_address: this.formatAddress(stage2.employment_details?.office_address),
                total_experience: this.formatExperience(stage2.employment_details?.work_experience_years),
                current_experience: this.formatExperience(stage2.employment_details?.current_job_experience_years),
                official_email: stage2.employment_details?.official_email || 'N/A',
                office_phone: stage2.employment_details?.office_phone || 'N/A'
            },

            // Income Details
            income: {
                basic_salary: this.formatCurrency(stage2.employment_details?.monthly_gross_income || stage2.employment_details?.monthly_income),
                hra: this.formatCurrency(stage2.employment_details?.hra || 0),
                other_allowances: this.formatCurrency(stage2.employment_details?.allowances || 0),
                other_income: this.formatCurrency(stage2.employment_details?.other_income || 0),
                total_income: this.formatCurrency(stage2.employment_details?.monthly_gross_income || stage2.employment_details?.monthly_income || 0)
            },

            // Existing Liabilities
            liabilities: this.processExistingLoans(stage2.banking_details?.existing_loans || stage2.financial_details?.existing_loans),

            // Loan Requirements
            loan: {
                amount_required: this.formatCurrency(stage1.loan_request?.loan_amount || stage1.loan_request?.amount),
                tenure: stage1.loan_request?.preferred_tenure_months || stage1.loan_request?.tenure_months || 'N/A',
                purpose: this.formatLoanPurpose(stage1.loan_request?.loan_purpose || stage1.loan_request?.purpose)
            },

            // Banking Details
            banking: {
                bank_name: stage2.banking_details?.primary_account?.bank_name || stage2.banking_details?.primary_bank || 'N/A',
                account_type: stage2.banking_details?.primary_account?.account_type || 'Savings',
                account_number: this.maskAccountNumber(stage2.banking_details?.primary_account?.account_number),
                ifsc_code: stage2.banking_details?.primary_account?.ifsc_code || 'N/A',
                account_opening_date: stage2.banking_details?.primary_account?.account_opening_date || 'N/A',
                average_balance: this.formatCurrency(stage2.banking_details?.primary_account?.average_monthly_balance)
            },

            // References
            references: this.processReferences(stage2.references),

            // Third-party verification status
            verification: {
                pan_status: thirdParty.pan_verification?.success ? 'Verified' : 'Pending',
                cibil_score: thirdParty.cibil_data?.score || 'N/A',
                employment_status: thirdParty.employment_verification?.success ? 'Verified' : 'Pending',
                banking_status: thirdParty.bank_statement_analysis?.success ? 'Verified' : 'Pending'
            }
        };
    }

    /**
     * Populate HTML template with normalized data
     */
    populateCompleteTemplate(htmlTemplate, data) {
        let populatedHTML = htmlTemplate;

        // Application Number
        populatedHTML = populatedHTML.replace(
            'Application No: <strong>_____________</strong>',
            `Application No: <strong>${data.application_number}</strong>`
        );

        // Personal Information Section
        const personalMappings = [
            { pattern: /<td class="label-col">Full Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.full_name },
            { pattern: /<td class="label-col">Date of Birth <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col">DD\/MM\/YYYY<\/td>/, value: data.personal.date_of_birth },
            { pattern: /<td class="label-col">Father's Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.father_name },
            { pattern: /<td class="label-col">Mother's Name<\/td>\s*<td class="input-col"><\/td>/, value: data.personal.mother_name },
            { pattern: /<td class="label-col">PAN Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.pan_number },
            { pattern: /<td class="label-col">Aadhaar Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.aadhaar_number },
            { pattern: /<td class="label-col">Mobile Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.mobile_number },
            { pattern: /<td class="label-col">Email Address <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/, value: data.personal.email_address },
            { pattern: /<td class="label-col">Qualification<\/td>\s*<td class="input-col"><\/td>/, value: data.personal.qualification },
            { pattern: /<td class="label-col">No. of Dependents<\/td>\s*<td class="input-col"><\/td>/, value: data.personal.dependents }
        ];

        // Apply personal information mappings
        personalMappings.forEach(mapping => {
            if (mapping.pattern && mapping.value && mapping.value !== 'N/A') {
                populatedHTML = populatedHTML.replace(mapping.pattern, (match) => {
                    return match.replace(/<td class="input-col">([^<]*)<\/td>/, `<td class="input-col"><strong>${mapping.value}</strong></td>`);
                });
            }
        });

        // Employment Information
        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Company\/Business Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">Company/Business Name <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.employment.company_name}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Designation <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">Designation <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.employment.designation}</strong></td>`
        );

        // Banking Information
        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Primary Bank Name <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">Primary Bank Name <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.banking.bank_name}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Account Number <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">Account Number <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.banking.account_number}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">IFSC Code <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">IFSC Code <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.banking.ifsc_code}</strong></td>`
        );

        // Loan Requirements
        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Loan Amount Required <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col amount-box">₹ ________________<\/td>/,
            `<td class="label-col">Loan Amount Required <span class="mandatory">*</span></td>\n                    <td class="input-col amount-box"><strong>₹ ${data.loan.amount_required}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Preferred Tenure <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col">_______ Months<\/td>/,
            `<td class="label-col">Preferred Tenure <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.loan.tenure} Months</strong></td>`
        );

        // Income Details - Basic Salary
        populatedHTML = populatedHTML.replace(
            /<td >Basic Salary <span class="mandatory">\*<\/span><\/td>\s*<td class="amount-box"><\/td>/,
            `<td>Basic Salary <span class="mandatory">*</span></td>\n                    <td class="amount-box"><strong>${data.income.basic_salary}</strong></td>`
        );

        // Total Monthly Income
        populatedHTML = populatedHTML.replace(
            /<td>Total Monthly Income <span class="mandatory">\*<\/span><\/td>\s*<td class="amount-box"><\/td>/,
            `<td>Total Monthly Income <span class="mandatory">*</span></td>\n                    <td class="amount-box"><strong>${data.income.total_income}</strong></td>`
        );

        // Address Information
        populatedHTML = populatedHTML.replace(
            /<td class="label-col">Current Address <span class="mandatory">\*<\/span><br><small>\(Residence\)<\/small><\/td>\s*<td colspan="3"><\/td>/,
            `<td class="label-col">Current Address <span class="mandatory">*</span><br><small>(Residence)</small></td>\n                    <td colspan="3"><strong>${data.address.current_address}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">City <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">City <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.address.city}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">State <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">State <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.address.state}</strong></td>`
        );

        populatedHTML = populatedHTML.replace(
            /<td class="label-col">PIN Code <span class="mandatory">\*<\/span><\/td>\s*<td class="input-col"><\/td>/,
            `<td class="label-col">PIN Code <span class="mandatory">*</span></td>\n                    <td class="input-col"><strong>${data.address.pincode}</strong></td>`
        );

        return populatedHTML;
    }

    /**
     * Generate high-quality PDF from HTML
     */
    async generateHighQualityPDF(htmlContent) {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '15mm',
                    right: '15mm'
                },
                displayHeaderFooter: false,
                preferCSSPageSize: true
            });

            return pdf;
        } finally {
            await browser.close();
        }
    }

    /**
     * Helper methods for data formatting
     */
    formatAddress(address) {
        if (!address) return 'N/A';
        
        const parts = [
            address.address_line_1 || address.street,
            address.address_line_2,
            address.city,
            address.state,
            address.pincode
        ].filter(part => part && part.trim());
        
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    }

    formatCurrency(amount) {
        if (!amount || amount === 0) return '0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('₹', '');
    }

    formatExperience(years) {
        if (!years) return 'N/A';
        return `${Math.floor(years)} Years ${Math.floor((years % 1) * 12)} Months`;
    }

    formatLoanPurpose(purpose) {
        const purposeMap = {
            'home_improvement': 'Home Renovation',
            'medical_emergency': 'Medical Emergency',
            'education': 'Education',
            'wedding': 'Wedding',
            'travel': 'Travel',
            'business': 'Business',
            'debt_consolidation': 'Debt Consolidation',
            'personal': 'Personal'
        };
        return purposeMap[purpose] || purpose || 'Personal';
    }

    maskAccountNumber(accountNumber) {
        if (!accountNumber) return 'N/A';
        if (accountNumber.length <= 4) return accountNumber;
        return 'XXXX' + accountNumber.slice(-4);
    }

    processExistingLoans(loans) {
        if (!loans || !Array.isArray(loans)) return { home_loan: '0', car_loan: '0', personal_loan: '0', credit_card: '0', total: '0' };
        
        const result = { home_loan: 0, car_loan: 0, personal_loan: 0, credit_card: 0 };
        
        loans.forEach(loan => {
            const emi = loan.monthly_emi || loan.emi || 0;
            switch(loan.type?.toLowerCase()) {
                case 'home_loan': result.home_loan += emi; break;
                case 'car_loan': result.car_loan += emi; break;
                case 'personal_loan': result.personal_loan += emi; break;
                case 'credit_card': result.credit_card += emi; break;
            }
        });

        return {
            home_loan: this.formatCurrency(result.home_loan),
            car_loan: this.formatCurrency(result.car_loan),
            personal_loan: this.formatCurrency(result.personal_loan),
            credit_card: this.formatCurrency(result.credit_card),
            total: this.formatCurrency(Object.values(result).reduce((a, b) => a + b, 0))
        };
    }

    processReferences(references) {
        if (!references) return { ref1: {}, ref2: {} };
        
        const ref1 = references.personal_reference_1 || references.reference_1 || {};
        const ref2 = references.personal_reference_2 || references.reference_2 || {};
        
        return {
            ref1: {
                name: ref1.name || 'N/A',
                relationship: ref1.relationship || 'N/A',
                mobile: ref1.mobile || ref1.phone || 'N/A',
                address: ref1.address || 'N/A'
            },
            ref2: {
                name: ref2.name || 'N/A',
                relationship: ref2.relationship || 'N/A',
                mobile: ref2.mobile || ref2.phone || 'N/A',
                address: ref2.address || 'N/A'
            }
        };
    }
}

module.exports = EnhancedPDFGeneratorService;
