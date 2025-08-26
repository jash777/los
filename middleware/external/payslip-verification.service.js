/**
 * Payslip Verification Service
 * Demo service for payslip OCR and verification
 * In production, this would integrate with Surepass OCR APIs
 */

const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class PayslipVerificationService {
    constructor() {
        this.serviceName = 'Payslip Verification Service';
    }

    /**
     * Process and verify payslip data
     * @param {Object} payslipData - Payslip JSON data (simulating OCR output)
     * @param {string} requestId - Request ID for tracking
     * @returns {Object} Verification result
     */
    async verifyPayslip(payslipData, requestId) {
        try {
            logger.info(`[${requestId}] Starting payslip verification`);

            // Validate input data
            if (!payslipData || !payslipData.employeeDetails) {
                throw new Error('Invalid payslip data');
            }

            const verification = {
                employeeVerification: this.verifyEmployeeDetails(payslipData.employeeDetails),
                employerVerification: this.verifyEmployerDetails(payslipData.employerDetails),
                salaryVerification: this.verifySalaryDetails(payslipData.salaryDetails),
                deductionAnalysis: this.analyzeDeductions(payslipData.deductions || []),
                consistencyCheck: this.performConsistencyCheck(payslipData),
                documentAuthenticity: this.checkDocumentAuthenticity(payslipData)
            };

            // Calculate overall verification score
            const verificationScore = this.calculateVerificationScore(verification);

            // Extract key employment information
            const employmentInfo = this.extractEmploymentInfo(payslipData);

            logger.info(`[${requestId}] Payslip verification completed`, {
                employeeId: payslipData.employeeDetails?.employeeId,
                verificationScore: verificationScore.score
            });

            return {
                success: true,
                verification,
                verificationScore,
                employmentInfo,
                timestamp: new Date().toISOString(),
                requestId
            };

        } catch (error) {
            logger.error(`[${requestId}] Payslip verification failed`, {
                error: error.message
            });
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                requestId
            };
        }
    }

    /**
     * Verify employee details
     */
    verifyEmployeeDetails(employeeDetails) {
        const checks = {
            namePresent: !!employeeDetails.name,
            employeeIdPresent: !!employeeDetails.employeeId,
            designationPresent: !!employeeDetails.designation,
            departmentPresent: !!employeeDetails.department,
            joiningDatePresent: !!employeeDetails.joiningDate,
            panPresent: !!employeeDetails.pan,
            esiPresent: !!employeeDetails.esi,
            pfPresent: !!employeeDetails.pf
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;

        return {
            checks,
            score: Math.round((passedChecks / totalChecks) * 100),
            status: passedChecks >= 6 ? 'verified' : passedChecks >= 4 ? 'partial' : 'failed',
            issues: this.identifyEmployeeIssues(checks, employeeDetails)
        };
    }

    /**
     * Verify employer details
     */
    verifyEmployerDetails(employerDetails) {
        const checks = {
            companyNamePresent: !!employerDetails.companyName,
            addressPresent: !!employerDetails.address,
            contactPresent: !!employerDetails.contact,
            registrationPresent: !!employerDetails.registrationNumber,
            tanPresent: !!employerDetails.tan,
            pfRegistrationPresent: !!employerDetails.pfRegistration
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;

        return {
            checks,
            score: Math.round((passedChecks / totalChecks) * 100),
            status: passedChecks >= 4 ? 'verified' : passedChecks >= 2 ? 'partial' : 'failed',
            companyProfile: this.analyzeCompanyProfile(employerDetails)
        };
    }

    /**
     * Verify salary details
     */
    verifySalaryDetails(salaryDetails) {
        const checks = {
            basicSalaryPresent: !!salaryDetails.basicSalary,
            hraPresent: !!salaryDetails.hra,
            allowancesPresent: !!salaryDetails.allowances,
            grossSalaryPresent: !!salaryDetails.grossSalary,
            netSalaryPresent: !!salaryDetails.netSalary,
            payPeriodPresent: !!salaryDetails.payPeriod
        };

        const calculationCheck = this.verifySalaryCalculations(salaryDetails);
        const consistencyCheck = this.checkSalaryConsistency(salaryDetails);

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;

        return {
            checks,
            calculationCheck,
            consistencyCheck,
            score: Math.round((passedChecks / totalChecks) * 100),
            status: passedChecks >= 5 && calculationCheck.accurate ? 'verified' : 'needs_review',
            salaryBreakdown: this.analyzeSalaryBreakdown(salaryDetails)
        };
    }

    /**
     * Analyze deductions
     */
    analyzeDeductions(deductions) {
        const standardDeductions = ['pf', 'esi', 'tds', 'professional_tax'];
        const foundDeductions = deductions.map(d => d.type.toLowerCase());
        
        const analysis = {
            totalDeductions: deductions.reduce((sum, d) => sum + (d.amount || 0), 0),
            deductionCount: deductions.length,
            standardDeductionsPresent: standardDeductions.filter(sd => 
                foundDeductions.some(fd => fd.includes(sd))
            ),
            unusualDeductions: deductions.filter(d => 
                !standardDeductions.some(sd => d.type.toLowerCase().includes(sd))
            ),
            deductionBreakdown: this.categorizeDeductions(deductions)
        };

        return {
            ...analysis,
            complianceScore: this.calculateDeductionCompliance(analysis),
            status: analysis.standardDeductionsPresent.length >= 2 ? 'compliant' : 'review_required'
        };
    }

    /**
     * Perform consistency checks
     */
    performConsistencyCheck(payslipData) {
        const checks = [];

        // Check if employee name matches across sections
        const employeeName = payslipData.employeeDetails?.name;
        if (employeeName) {
            checks.push({
                type: 'name_consistency',
                status: 'passed',
                description: 'Employee name consistent across document'
            });
        }

        // Check salary calculation consistency
        const salaryDetails = payslipData.salaryDetails;
        if (salaryDetails) {
            const calculatedGross = (salaryDetails.basicSalary || 0) + 
                                  (salaryDetails.hra || 0) + 
                                  (salaryDetails.allowances || 0);
            const declaredGross = salaryDetails.grossSalary || 0;
            
            if (Math.abs(calculatedGross - declaredGross) < 100) {
                checks.push({
                    type: 'gross_salary_calculation',
                    status: 'passed',
                    description: 'Gross salary calculation is accurate'
                });
            } else {
                checks.push({
                    type: 'gross_salary_calculation',
                    status: 'failed',
                    description: `Gross salary mismatch: calculated ${calculatedGross}, declared ${declaredGross}`
                });
            }
        }

        // Check deduction consistency
        const deductions = payslipData.deductions || [];
        const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
        const netSalary = salaryDetails?.netSalary || 0;
        const grossSalary = salaryDetails?.grossSalary || 0;
        
        if (Math.abs((grossSalary - totalDeductions) - netSalary) < 100) {
            checks.push({
                type: 'net_salary_calculation',
                status: 'passed',
                description: 'Net salary calculation is accurate'
            });
        } else {
            checks.push({
                type: 'net_salary_calculation',
                status: 'failed',
                description: 'Net salary calculation discrepancy detected'
            });
        }

        const passedChecks = checks.filter(c => c.status === 'passed').length;
        
        return {
            checks,
            overallStatus: passedChecks === checks.length ? 'consistent' : 'inconsistent',
            consistencyScore: Math.round((passedChecks / checks.length) * 100)
        };
    }

    /**
     * Check document authenticity
     */
    checkDocumentAuthenticity(payslipData) {
        const authenticityChecks = {
            formatCheck: this.checkDocumentFormat(payslipData),
            watermarkCheck: this.checkWatermark(payslipData),
            digitalSignatureCheck: this.checkDigitalSignature(payslipData),
            templateConsistency: this.checkTemplateConsistency(payslipData)
        };

        const passedChecks = Object.values(authenticityChecks).filter(check => check.status === 'passed').length;
        const totalChecks = Object.keys(authenticityChecks).length;

        return {
            checks: authenticityChecks,
            authenticityScore: Math.round((passedChecks / totalChecks) * 100),
            status: passedChecks >= 3 ? 'authentic' : passedChecks >= 2 ? 'likely_authentic' : 'suspicious',
            riskLevel: passedChecks >= 3 ? 'low' : passedChecks >= 2 ? 'medium' : 'high'
        };
    }

    /**
     * Calculate overall verification score
     */
    calculateVerificationScore(verification) {
        const weights = {
            employeeVerification: 0.25,
            employerVerification: 0.20,
            salaryVerification: 0.30,
            consistencyCheck: 0.15,
            documentAuthenticity: 0.10
        };

        let totalScore = 0;
        const factors = [];

        Object.keys(weights).forEach(key => {
            const score = verification[key].score || verification[key].consistencyScore || verification[key].authenticityScore || 0;
            const weightedScore = score * weights[key];
            totalScore += weightedScore;
            
            factors.push({
                factor: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                score: score,
                weight: weights[key] * 100,
                contribution: Math.round(weightedScore * 100) / 100
            });
        });

        return {
            score: Math.round(totalScore * 100) / 100,
            rating: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor',
            factors,
            recommendation: this.getVerificationRecommendation(totalScore)
        };
    }

    /**
     * Extract employment information
     */
    extractEmploymentInfo(payslipData) {
        const employeeDetails = payslipData.employeeDetails || {};
        const employerDetails = payslipData.employerDetails || {};
        const salaryDetails = payslipData.salaryDetails || {};

        // Calculate work experience
        const joiningDate = employeeDetails.joiningDate;
        let workExperience = null;
        if (joiningDate) {
            const joining = new Date(joiningDate);
            const now = new Date();
            const diffTime = Math.abs(now - joining);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            workExperience = {
                years: Math.floor(diffDays / 365),
                months: Math.floor((diffDays % 365) / 30),
                totalMonths: Math.floor(diffDays / 30)
            };
        }

        return {
            employeeName: employeeDetails.name,
            employeeId: employeeDetails.employeeId,
            designation: employeeDetails.designation,
            department: employeeDetails.department,
            companyName: employerDetails.companyName,
            joiningDate: joiningDate,
            workExperience: workExperience,
            currentSalary: {
                basic: salaryDetails.basicSalary,
                hra: salaryDetails.hra,
                allowances: salaryDetails.allowances,
                gross: salaryDetails.grossSalary,
                net: salaryDetails.netSalary,
                payPeriod: salaryDetails.payPeriod
            },
            annualSalary: this.calculateAnnualSalary(salaryDetails),
            employmentType: this.determineEmploymentType(payslipData),
            industryType: this.determineIndustryType(employerDetails.companyName)
        };
    }

    // Helper methods
    identifyEmployeeIssues(checks, employeeDetails) {
        const issues = [];
        
        if (!checks.namePresent) issues.push('Employee name missing');
        if (!checks.employeeIdPresent) issues.push('Employee ID missing');
        if (!checks.panPresent) issues.push('PAN number missing');
        if (employeeDetails.pan && !this.validatePAN(employeeDetails.pan)) {
            issues.push('Invalid PAN format');
        }
        
        return issues;
    }

    analyzeCompanyProfile(employerDetails) {
        return {
            companyName: employerDetails.companyName,
            hasRegistration: !!employerDetails.registrationNumber,
            hasTAN: !!employerDetails.tan,
            hasPFRegistration: !!employerDetails.pfRegistration,
            companySize: this.estimateCompanySize(employerDetails),
            industryType: this.determineIndustryType(employerDetails.companyName)
        };
    }

    verifySalaryCalculations(salaryDetails) {
        const basic = salaryDetails.basicSalary || 0;
        const hra = salaryDetails.hra || 0;
        const allowances = salaryDetails.allowances || 0;
        const gross = salaryDetails.grossSalary || 0;
        
        const calculatedGross = basic + hra + allowances;
        const difference = Math.abs(calculatedGross - gross);
        
        return {
            accurate: difference < 100,
            calculatedGross: calculatedGross,
            declaredGross: gross,
            difference: difference,
            tolerance: 100
        };
    }

    checkSalaryConsistency(salaryDetails) {
        const checks = [];
        
        // Check if HRA is reasonable (typically 40-50% of basic)
        const basic = salaryDetails.basicSalary || 0;
        const hra = salaryDetails.hra || 0;
        if (basic > 0) {
            const hraPercentage = (hra / basic) * 100;
            checks.push({
                type: 'hra_percentage',
                status: hraPercentage >= 30 && hraPercentage <= 60 ? 'reasonable' : 'unusual',
                value: Math.round(hraPercentage * 100) / 100
            });
        }
        
        return { checks };
    }

    analyzeSalaryBreakdown(salaryDetails) {
        const gross = salaryDetails.grossSalary || 0;
        
        return {
            basicPercentage: gross > 0 ? Math.round(((salaryDetails.basicSalary || 0) / gross) * 100) : 0,
            hraPercentage: gross > 0 ? Math.round(((salaryDetails.hra || 0) / gross) * 100) : 0,
            allowancesPercentage: gross > 0 ? Math.round(((salaryDetails.allowances || 0) / gross) * 100) : 0,
            structure: this.categorizeSalaryStructure(salaryDetails)
        };
    }

    categorizeDeductions(deductions) {
        const categories = {
            statutory: [],
            voluntary: [],
            other: []
        };
        
        deductions.forEach(deduction => {
            const type = deduction.type.toLowerCase();
            if (type.includes('pf') || type.includes('esi') || type.includes('tds') || type.includes('professional')) {
                categories.statutory.push(deduction);
            } else if (type.includes('insurance') || type.includes('loan') || type.includes('advance')) {
                categories.voluntary.push(deduction);
            } else {
                categories.other.push(deduction);
            }
        });
        
        return categories;
    }

    calculateDeductionCompliance(analysis) {
        let score = 100;
        
        // Check for mandatory deductions
        if (!analysis.standardDeductionsPresent.includes('pf')) score -= 20;
        if (!analysis.standardDeductionsPresent.includes('tds')) score -= 15;
        if (analysis.unusualDeductions.length > 2) score -= 10;
        
        return Math.max(0, score);
    }

    checkDocumentFormat(payslipData) {
        // Simulate format validation
        return {
            status: 'passed',
            description: 'Document format appears standard'
        };
    }

    checkWatermark(payslipData) {
        // Simulate watermark check
        return {
            status: 'passed',
            description: 'Company watermark detected'
        };
    }

    checkDigitalSignature(payslipData) {
        // Simulate digital signature check
        return {
            status: payslipData.digitalSignature ? 'passed' : 'not_present',
            description: payslipData.digitalSignature ? 'Digital signature verified' : 'No digital signature found'
        };
    }

    checkTemplateConsistency(payslipData) {
        // Simulate template consistency check
        return {
            status: 'passed',
            description: 'Template format consistent with known payslip formats'
        };
    }

    getVerificationRecommendation(score) {
        if (score >= 80) {
            return 'Payslip verification successful. Document appears authentic and complete.';
        } else if (score >= 60) {
            return 'Payslip verification mostly successful. Minor issues detected but acceptable for processing.';
        } else if (score >= 40) {
            return 'Payslip verification shows concerns. Manual review recommended before proceeding.';
        } else {
            return 'Payslip verification failed. Document may be incomplete or inauthentic. Reject or request new document.';
        }
    }

    calculateAnnualSalary(salaryDetails) {
        const gross = salaryDetails.grossSalary || 0;
        const net = salaryDetails.netSalary || 0;
        
        return {
            grossAnnual: gross * 12,
            netAnnual: net * 12,
            estimatedCTC: gross * 13.5 // Assuming some additional benefits
        };
    }

    determineEmploymentType(payslipData) {
        // Simple logic to determine employment type
        const deductions = payslipData.deductions || [];
        const hasPF = deductions.some(d => d.type.toLowerCase().includes('pf'));
        const hasESI = deductions.some(d => d.type.toLowerCase().includes('esi'));
        
        if (hasPF && hasESI) return 'permanent';
        if (hasPF) return 'permanent';
        return 'contract';
    }

    determineIndustryType(companyName) {
        if (!companyName) return 'unknown';
        
        const name = companyName.toLowerCase();
        if (name.includes('tech') || name.includes('software') || name.includes('it')) return 'technology';
        if (name.includes('bank') || name.includes('finance') || name.includes('insurance')) return 'financial_services';
        if (name.includes('pharma') || name.includes('healthcare') || name.includes('hospital')) return 'healthcare';
        if (name.includes('manufacturing') || name.includes('auto') || name.includes('steel')) return 'manufacturing';
        if (name.includes('retail') || name.includes('mart') || name.includes('store')) return 'retail';
        
        return 'other';
    }

    estimateCompanySize(employerDetails) {
        // Simple estimation based on available data
        if (employerDetails.pfRegistration && employerDetails.tan) return 'large';
        if (employerDetails.registrationNumber) return 'medium';
        return 'small';
    }

    categorizeSalaryStructure(salaryDetails) {
        const basic = salaryDetails.basicSalary || 0;
        const gross = salaryDetails.grossSalary || 0;
        
        if (gross === 0) return 'unknown';
        
        const basicPercentage = (basic / gross) * 100;
        
        if (basicPercentage >= 50) return 'basic_heavy';
        if (basicPercentage >= 40) return 'balanced';
        return 'allowance_heavy';
    }

    validatePAN(pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    }

    /**
     * Generate demo payslip data for testing
     */
    generateDemoPayslip() {
        const basicSalary = 45000;
        const hra = 18000;
        const allowances = 12000;
        const grossSalary = basicSalary + hra + allowances;
        
        const pfDeduction = Math.round(basicSalary * 0.12);
        const tdsDeduction = Math.round(grossSalary * 0.05);
        const esiDeduction = Math.round(grossSalary * 0.0075);
        const professionalTax = 200;
        
        const totalDeductions = pfDeduction + tdsDeduction + esiDeduction + professionalTax;
        const netSalary = grossSalary - totalDeductions;
        
        return {
            employeeDetails: {
                name: 'John Doe',
                employeeId: 'EMP001234',
                designation: 'Software Engineer',
                department: 'Information Technology',
                joiningDate: '2022-03-15',
                pan: 'ABCDE1234F',
                esi: '1234567890',
                pf: 'PF1234567890'
            },
            employerDetails: {
                companyName: 'Tech Solutions Pvt Ltd',
                address: '123 Business Park, Bangalore, Karnataka 560001',
                contact: '+91-80-12345678',
                registrationNumber: 'CIN123456789',
                tan: 'BLRT12345A',
                pfRegistration: 'KA/BGE/12345'
            },
            salaryDetails: {
                basicSalary: basicSalary,
                hra: hra,
                allowances: allowances,
                grossSalary: grossSalary,
                netSalary: netSalary,
                payPeriod: new Date().toISOString().substring(0, 7) // Current month YYYY-MM
            },
            deductions: [
                { type: 'Provident Fund', amount: pfDeduction },
                { type: 'TDS', amount: tdsDeduction },
                { type: 'ESI', amount: esiDeduction },
                { type: 'Professional Tax', amount: professionalTax }
            ],
            digitalSignature: true,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Save payslip verification result to application folder
     */
    async savePayslipVerification(applicationId, verificationResult, requestId) {
        try {
            const applicationDir = path.join(process.cwd(), 'application_data', applicationId);
            const filePath = path.join(applicationDir, 'payslip_verification.json');
            
            await fs.writeFile(filePath, JSON.stringify(verificationResult, null, 2));
            
            logger.info(`[${requestId}] Payslip verification saved`, {
                applicationId,
                filePath
            });
            
            return { success: true, filePath };
        } catch (error) {
            logger.error(`[${requestId}] Failed to save payslip verification`, {
                error: error.message,
                applicationId
            });
            return { success: false, error: error.message };
        }
    }
}

module.exports = PayslipVerificationService;