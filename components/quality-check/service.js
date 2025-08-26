const { QUALITY_CHECK_TYPES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');
const pool = require('../../middleware/config/database');
// Models replaced with direct PostgreSQL queries

class QualityCheckService {
    /**
     * Process quality check for an approved credit decision
     * @param {string} creditDecisionId - Credit Decision ID
     * @param {Object} checkData - Additional quality check data
     * @returns {Object} Processing result
     */
    async processQualityCheck(creditDecisionId, checkData = {}) {
        try {
            // Validate credit decision exists and is approved
            const creditDecision = await CreditDecisionModel.findById(creditDecisionId)
                .populate('loan_application_id')
                .populate('underwriting_id');
            
            if (!creditDecision) {
                throw new Error('Credit decision record not found');
            }

            if (creditDecision.status !== PHASE_STATUS.COMPLETED) {
                throw new Error('Credit decision must be completed before quality check');
            }

            if (!creditDecision.decision_result || 
                !['approved', 'conditional_approval'].includes(creditDecision.decision_result.final_decision)) {
                throw new Error('Quality check only applicable for approved applications');
            }

            // Get loan application data
            const loanApplication = creditDecision.loan_application_id;
            if (!loanApplication) {
                throw new Error('Loan application not found');
            }

            // Create quality check record
            const qualityCheck = new QualityCheckModel({
                credit_decision_id: creditDecisionId,
                loan_application_id: loanApplication._id,
                status: PHASE_STATUS.IN_PROGRESS,
                check_data: {
                    priority_level: checkData.priority_level || 'standard',
                    manual_review_required: checkData.manual_review_required || false,
                    reviewer_notes: checkData.reviewer_notes || '',
                    additional_checks: checkData.additional_checks || []
                }
            });

            await qualityCheck.save();
            await qualityCheck.addLog('Quality check process initiated', 'system');

            // Perform comprehensive quality checks
            const qualityResult = await this.performQualityChecks(qualityCheck, creditDecision, loanApplication, checkData);
            
            // Update quality check with results
            qualityCheck.quality_result = qualityResult;
            qualityCheck.status = qualityResult.overall_status === 'passed' ? PHASE_STATUS.COMPLETED : PHASE_STATUS.FAILED;

            await qualityCheck.save();
            await qualityCheck.addLog(`Quality check completed: ${qualityResult.overall_status}`, 'system');

            return {
                success: true,
                quality_check_id: qualityCheck._id,
                overall_status: qualityResult.overall_status,
                compliance_score: qualityResult.compliance_score,
                accuracy_score: qualityResult.accuracy_score,
                issues_found: qualityResult.issues_found.length,
                recommendations: qualityResult.recommendations.length,
                next_phase: qualityResult.overall_status === 'passed' ? 'loan-funding' : null
            };

        } catch (error) {
            console.error('Quality check processing error:', error);
            throw error;
        }
    }

    /**
     * Perform comprehensive quality checks
     */
    async performQualityChecks(qualityCheck, creditDecision, loanApplication, checkData) {
        await qualityCheck.addLog('Starting comprehensive quality checks', 'system');

        const checks = {
            document_verification: await this.performDocumentVerification(loanApplication, creditDecision),
            data_accuracy: await this.performDataAccuracyCheck(loanApplication, creditDecision),
            compliance_check: await this.performComplianceCheck(loanApplication, creditDecision),
            policy_adherence: await this.performPolicyAdherenceCheck(loanApplication, creditDecision),
            risk_validation: await this.performRiskValidation(loanApplication, creditDecision),
            calculation_verification: await this.performCalculationVerification(creditDecision),
            regulatory_compliance: await this.performRegulatoryCompliance(loanApplication, creditDecision)
        };

        // Perform additional checks if specified
        if (checkData.additional_checks && checkData.additional_checks.length > 0) {
            for (const additionalCheck of checkData.additional_checks) {
                checks[additionalCheck.type] = await this.performAdditionalCheck(additionalCheck, loanApplication, creditDecision);
            }
        }

        // Calculate overall scores and status
        const complianceScore = this.calculateComplianceScore(checks);
        const accuracyScore = this.calculateAccuracyScore(checks);
        const overallStatus = this.determineOverallStatus(checks, complianceScore, accuracyScore);

        // Collect issues and recommendations
        const issuesFound = this.collectIssues(checks);
        const recommendations = this.generateRecommendations(checks, issuesFound);

        const result = {
            overall_status: overallStatus,
            compliance_score: complianceScore,
            accuracy_score: accuracyScore,
            quality_checks: checks,
            issues_found: issuesFound,
            recommendations: recommendations,
            check_summary: {
                total_checks: Object.keys(checks).length,
                passed_checks: Object.values(checks).filter(check => check.status === 'passed').length,
                failed_checks: Object.values(checks).filter(check => check.status === 'failed').length,
                warning_checks: Object.values(checks).filter(check => check.status === 'warning').length
            },
            processing_summary: {
                total_processing_time: this.calculateProcessingTime(qualityCheck.created_at),
                automated_checks: Object.values(checks).filter(check => !check.manual_review).length,
                manual_reviews: Object.values(checks).filter(check => check.manual_review).length,
                critical_issues: issuesFound.filter(issue => issue.severity === 'critical').length
            },
            check_date: new Date()
        };

        await qualityCheck.addLog(`Quality checks completed: ${overallStatus}`, 'system');
        return result;
    }

    /**
     * Document verification check
     */
    async performDocumentVerification(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        // Check required documents
        const requiredDocs = this.getRequiredDocuments(loanApplication.loan_details.loan_type);
        const providedDocs = loanApplication.documents || [];

        for (const requiredDoc of requiredDocs) {
            const docExists = providedDocs.some(doc => doc.document_type === requiredDoc.type);
            if (!docExists) {
                issues.push({
                    type: 'missing_document',
                    severity: requiredDoc.mandatory ? 'critical' : 'warning',
                    description: `Missing required document: ${requiredDoc.name}`,
                    document_type: requiredDoc.type
                });
                score -= requiredDoc.mandatory ? 20 : 10;
            }
        }

        // Verify document validity and completeness
        for (const doc of providedDocs) {
            if (!doc.file_path || !doc.upload_date) {
                issues.push({
                    type: 'incomplete_document',
                    severity: 'warning',
                    description: `Incomplete document information: ${doc.document_type}`,
                    document_id: doc._id
                });
                score -= 5;
            }

            // Check document age (should be recent)
            if (doc.upload_date && this.isDocumentTooOld(doc.upload_date, doc.document_type)) {
                issues.push({
                    type: 'outdated_document',
                    severity: 'warning',
                    description: `Document may be outdated: ${doc.document_type}`,
                    document_id: doc._id
                });
                score -= 5;
            }
        }

        return {
            check_type: QUALITY_CHECK_TYPES.DOCUMENT_VERIFICATION,
            status: score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                required_documents: requiredDocs.length,
                provided_documents: providedDocs.length,
                missing_documents: issues.filter(i => i.type === 'missing_document').length,
                incomplete_documents: issues.filter(i => i.type === 'incomplete_document').length
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Data accuracy check
     */
    async performDataAccuracyCheck(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        // Check data consistency across phases
        const applicantInfo = loanApplication.applicant_info;
        const financialDetails = loanApplication.financial_details;
        const loanDetails = loanApplication.loan_details;

        // Validate personal information
        if (!applicantInfo.full_name || applicantInfo.full_name.trim().length < 2) {
            issues.push({
                type: 'invalid_data',
                severity: 'critical',
                description: 'Invalid or missing applicant name',
                field: 'applicant_info.full_name'
            });
            score -= 15;
        }

        if (!this.isValidEmail(applicantInfo.email)) {
            issues.push({
                type: 'invalid_data',
                severity: 'warning',
                description: 'Invalid email format',
                field: 'applicant_info.email'
            });
            score -= 5;
        }

        if (!this.isValidMobile(applicantInfo.mobile)) {
            issues.push({
                type: 'invalid_data',
                severity: 'critical',
                description: 'Invalid mobile number format',
                field: 'applicant_info.mobile'
            });
            score -= 15;
        }

        // Validate financial information
        if (financialDetails.monthly_income <= 0) {
            issues.push({
                type: 'invalid_data',
                severity: 'critical',
                description: 'Invalid monthly income',
                field: 'financial_details.monthly_income'
            });
            score -= 20;
        }

        if (financialDetails.existing_emi < 0) {
            issues.push({
                type: 'invalid_data',
                severity: 'warning',
                description: 'Negative existing EMI value',
                field: 'financial_details.existing_emi'
            });
            score -= 5;
        }

        // Validate loan details
        if (loanDetails.loan_amount <= 0 || loanDetails.loan_amount > 50000000) {
            issues.push({
                type: 'invalid_data',
                severity: 'critical',
                description: 'Invalid loan amount',
                field: 'loan_details.loan_amount'
            });
            score -= 20;
        }

        if (loanDetails.tenure_months <= 0 || loanDetails.tenure_months > 360) {
            issues.push({
                type: 'invalid_data',
                severity: 'critical',
                description: 'Invalid loan tenure',
                field: 'loan_details.tenure_months'
            });
            score -= 15;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.DATA_ACCURACY,
            status: score >= 85 ? 'passed' : score >= 70 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                fields_validated: 8,
                invalid_fields: issues.length,
                critical_issues: issues.filter(i => i.severity === 'critical').length
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Compliance check
     */
    async performComplianceCheck(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        // Age compliance
        const age = this.calculateAge(loanApplication.applicant_info.date_of_birth);
        if (age < 21 || age > 65) {
            issues.push({
                type: 'compliance_violation',
                severity: 'critical',
                description: `Applicant age ${age} outside acceptable range (21-65)`,
                regulation: 'Age Eligibility Policy'
            });
            score -= 25;
        }

        // Income compliance
        const minIncome = this.getMinIncomeRequirement(loanApplication.loan_details.loan_type);
        if (loanApplication.financial_details.monthly_income < minIncome) {
            issues.push({
                type: 'compliance_violation',
                severity: 'critical',
                description: `Monthly income below minimum requirement of ₹${minIncome}`,
                regulation: 'Minimum Income Policy'
            });
            score -= 25;
        }

        // Credit score compliance
        const minCreditScore = this.getMinCreditScore(loanApplication.loan_details.loan_type);
        const actualCreditScore = creditDecision.decision_result?.decision_factors?.credit_score || 0;
        if (actualCreditScore < minCreditScore) {
            issues.push({
                type: 'compliance_violation',
                severity: 'critical',
                description: `Credit score ${actualCreditScore} below minimum requirement of ${minCreditScore}`,
                regulation: 'Credit Score Policy'
            });
            score -= 25;
        }

        // DTI compliance
        const maxDTI = 60; // 60% maximum
        const actualDTI = creditDecision.decision_result?.decision_factors?.dti_ratio || 0;
        if (actualDTI > maxDTI) {
            issues.push({
                type: 'compliance_violation',
                severity: 'critical',
                description: `DTI ratio ${actualDTI.toFixed(2)}% exceeds maximum ${maxDTI}%`,
                regulation: 'Debt-to-Income Policy'
            });
            score -= 25;
        }

        // KYC compliance
        if (!loanApplication.applicant_info.pan_number || !this.isValidPAN(loanApplication.applicant_info.pan_number)) {
            issues.push({
                type: 'compliance_violation',
                severity: 'critical',
                description: 'Invalid or missing PAN number',
                regulation: 'KYC Requirements'
            });
            score -= 20;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.COMPLIANCE_CHECK,
            status: score >= 90 ? 'passed' : score >= 75 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                regulations_checked: 5,
                violations_found: issues.length,
                critical_violations: issues.filter(i => i.severity === 'critical').length
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Policy adherence check
     */
    async performPolicyAdherenceCheck(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        // Check loan amount vs income multiple
        const maxLoanAmount = this.getMaxLoanAmount(loanApplication.loan_details.loan_type, loanApplication.financial_details.monthly_income);
        if (creditDecision.decision_result.approved_loan_amount > maxLoanAmount) {
            issues.push({
                type: 'policy_violation',
                severity: 'critical',
                description: `Approved amount ₹${creditDecision.decision_result.approved_loan_amount} exceeds policy limit ₹${maxLoanAmount}`,
                policy: 'Loan Amount Policy'
            });
            score -= 30;
        }

        // Check interest rate within bounds
        const rateRange = this.getInterestRateRange(loanApplication.loan_details.loan_type);
        const approvedRate = creditDecision.decision_result.interest_rate;
        if (approvedRate < rateRange.min || approvedRate > rateRange.max) {
            issues.push({
                type: 'policy_violation',
                severity: 'warning',
                description: `Interest rate ${approvedRate}% outside policy range ${rateRange.min}%-${rateRange.max}%`,
                policy: 'Interest Rate Policy'
            });
            score -= 15;
        }

        // Check tenure limits
        const maxTenure = this.getMaxTenure(loanApplication.loan_details.loan_type);
        if (creditDecision.decision_result.approved_tenure > maxTenure) {
            issues.push({
                type: 'policy_violation',
                severity: 'warning',
                description: `Approved tenure ${creditDecision.decision_result.approved_tenure} months exceeds policy limit ${maxTenure} months`,
                policy: 'Tenure Policy'
            });
            score -= 15;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.POLICY_ADHERENCE,
            status: score >= 85 ? 'passed' : score >= 70 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                policies_checked: 3,
                violations_found: issues.length,
                critical_violations: issues.filter(i => i.severity === 'critical').length
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Risk validation check
     */
    async performRiskValidation(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        const riskCategory = creditDecision.decision_result?.decision_factors?.risk_category;
        const approvedAmount = creditDecision.decision_result.approved_loan_amount;
        const creditScore = creditDecision.decision_result?.decision_factors?.credit_score;

        // High risk with high loan amount
        if (riskCategory === 'high' && approvedAmount > 1000000) {
            issues.push({
                type: 'risk_concern',
                severity: 'warning',
                description: 'High risk applicant approved for large loan amount',
                risk_factor: 'High Risk + Large Amount'
            });
            score -= 15;
        }

        // Low credit score with approval
        if (creditScore < 650 && creditDecision.decision_result.final_decision === 'approved') {
            issues.push({
                type: 'risk_concern',
                severity: 'warning',
                description: 'Low credit score applicant approved without conditions',
                risk_factor: 'Low Credit Score'
            });
            score -= 10;
        }

        // High DTI with approval
        const dtiRatio = creditDecision.decision_result?.decision_factors?.dti_ratio;
        if (dtiRatio > 50 && creditDecision.decision_result.final_decision === 'approved') {
            issues.push({
                type: 'risk_concern',
                severity: 'warning',
                description: 'High DTI ratio applicant approved',
                risk_factor: 'High DTI Ratio'
            });
            score -= 10;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.RISK_VALIDATION,
            status: score >= 80 ? 'passed' : score >= 65 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                risk_factors_checked: 3,
                concerns_found: issues.length,
                risk_category: riskCategory
            },
            manual_review: issues.length > 0
        };
    }

    /**
     * Calculation verification
     */
    async performCalculationVerification(creditDecision) {
        const issues = [];
        let score = 100;

        const result = creditDecision.decision_result;
        
        // Verify EMI calculation
        const calculatedEMI = this.calculateEMI(result.approved_loan_amount, result.approved_tenure, result.interest_rate);
        const approvedEMI = result.monthly_emi;
        
        const emiDifference = Math.abs(calculatedEMI - approvedEMI);
        if (emiDifference > 10) { // Allow ₹10 difference for rounding
            issues.push({
                type: 'calculation_error',
                severity: 'critical',
                description: `EMI calculation mismatch: Expected ₹${calculatedEMI}, Got ₹${approvedEMI}`,
                calculation_type: 'EMI'
            });
            score -= 25;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.CALCULATION_VERIFICATION,
            status: score >= 95 ? 'passed' : score >= 80 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                calculations_verified: 1,
                calculation_errors: issues.length,
                emi_difference: emiDifference
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Regulatory compliance check
     */
    async performRegulatoryCompliance(loanApplication, creditDecision) {
        const issues = [];
        let score = 100;

        // RBI guidelines compliance
        // Fair Practice Code compliance
        if (!creditDecision.decision_result.loan_conditions.some(condition => 
            condition.toLowerCase().includes('fair practice') || 
            condition.toLowerCase().includes('grievance'))) {
            issues.push({
                type: 'regulatory_gap',
                severity: 'warning',
                description: 'Fair Practice Code disclosure missing',
                regulation: 'RBI Fair Practice Code'
            });
            score -= 10;
        }

        // Interest rate disclosure
        if (!creditDecision.decision_result.interest_rate || creditDecision.decision_result.interest_rate <= 0) {
            issues.push({
                type: 'regulatory_gap',
                severity: 'critical',
                description: 'Interest rate not properly disclosed',
                regulation: 'Interest Rate Disclosure'
            });
            score -= 20;
        }

        return {
            check_type: QUALITY_CHECK_TYPES.REGULATORY_COMPLIANCE,
            status: score >= 90 ? 'passed' : score >= 75 ? 'warning' : 'failed',
            score: Math.max(0, score),
            issues: issues,
            details: {
                regulations_checked: 2,
                compliance_gaps: issues.length,
                critical_gaps: issues.filter(i => i.severity === 'critical').length
            },
            manual_review: issues.some(i => i.severity === 'critical')
        };
    }

    /**
     * Perform additional custom check
     */
    async performAdditionalCheck(checkConfig, loanApplication, creditDecision) {
        // Placeholder for custom additional checks
        return {
            check_type: checkConfig.type,
            status: 'passed',
            score: 100,
            issues: [],
            details: {
                check_name: checkConfig.name || checkConfig.type,
                custom_check: true
            },
            manual_review: false
        };
    }

    // Helper methods
    calculateComplianceScore(checks) {
        const complianceChecks = ['compliance_check', 'policy_adherence', 'regulatory_compliance'];
        const relevantChecks = Object.entries(checks).filter(([key]) => complianceChecks.includes(key));
        
        if (relevantChecks.length === 0) return 0;
        
        const totalScore = relevantChecks.reduce((sum, [, check]) => sum + check.score, 0);
        return Math.round(totalScore / relevantChecks.length);
    }

    calculateAccuracyScore(checks) {
        const accuracyChecks = ['data_accuracy', 'calculation_verification', 'document_verification'];
        const relevantChecks = Object.entries(checks).filter(([key]) => accuracyChecks.includes(key));
        
        if (relevantChecks.length === 0) return 0;
        
        const totalScore = relevantChecks.reduce((sum, [, check]) => sum + check.score, 0);
        return Math.round(totalScore / relevantChecks.length);
    }

    determineOverallStatus(checks, complianceScore, accuracyScore) {
        const failedChecks = Object.values(checks).filter(check => check.status === 'failed');
        const criticalIssues = Object.values(checks).some(check => 
            check.issues.some(issue => issue.severity === 'critical'));

        if (failedChecks.length > 0 || criticalIssues) {
            return 'failed';
        }

        if (complianceScore < 80 || accuracyScore < 80) {
            return 'warning';
        }

        return 'passed';
    }

    collectIssues(checks) {
        const allIssues = [];
        Object.values(checks).forEach(check => {
            check.issues.forEach(issue => {
                allIssues.push({
                    ...issue,
                    check_type: check.check_type
                });
            });
        });
        return allIssues.sort((a, b) => {
            const severityOrder = { critical: 3, warning: 2, info: 1 };
            return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        });
    }

    generateRecommendations(checks, issues) {
        const recommendations = [];
        
        issues.forEach(issue => {
            switch (issue.type) {
                case 'missing_document':
                    recommendations.push({
                        type: 'document_collection',
                        priority: issue.severity === 'critical' ? 'high' : 'medium',
                        description: `Collect missing document: ${issue.document_type}`,
                        action_required: 'Document collection'
                    });
                    break;
                case 'compliance_violation':
                    recommendations.push({
                        type: 'compliance_review',
                        priority: 'high',
                        description: `Review compliance violation: ${issue.description}`,
                        action_required: 'Manual review'
                    });
                    break;
                case 'calculation_error':
                    recommendations.push({
                        type: 'calculation_review',
                        priority: 'high',
                        description: `Verify and correct calculation: ${issue.calculation_type}`,
                        action_required: 'Calculation correction'
                    });
                    break;
                default:
                    recommendations.push({
                        type: 'general_review',
                        priority: issue.severity === 'critical' ? 'high' : 'medium',
                        description: `Address issue: ${issue.description}`,
                        action_required: 'Review and resolution'
                    });
            }
        });
        
        return recommendations;
    }

    calculateProcessingTime(startDate) {
        const now = new Date();
        const diffMs = now - new Date(startDate);
        return Math.round(diffMs / (1000 * 60)); // minutes
    }

    // Validation helper methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidMobile(mobile) {
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile);
    }

    isValidPAN(pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    calculateEMI(principal, tenure, rate) {
        const monthlyRate = rate / (12 * 100);
        return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                         (Math.pow(1 + monthlyRate, tenure) - 1));
    }

    // Configuration helper methods
    getRequiredDocuments(loanType) {
        const docConfig = {
            'personal_loan': [
                { type: 'identity_proof', name: 'Identity Proof', mandatory: true },
                { type: 'address_proof', name: 'Address Proof', mandatory: true },
                { type: 'income_proof', name: 'Income Proof', mandatory: true },
                { type: 'bank_statement', name: 'Bank Statement', mandatory: true }
            ],
            'home_loan': [
                { type: 'identity_proof', name: 'Identity Proof', mandatory: true },
                { type: 'address_proof', name: 'Address Proof', mandatory: true },
                { type: 'income_proof', name: 'Income Proof', mandatory: true },
                { type: 'bank_statement', name: 'Bank Statement', mandatory: true },
                { type: 'property_documents', name: 'Property Documents', mandatory: true },
                { type: 'property_valuation', name: 'Property Valuation', mandatory: true }
            ]
        };
        
        return docConfig[loanType] || docConfig['personal_loan'];
    }

    isDocumentTooOld(uploadDate, docType) {
        const now = new Date();
        const docDate = new Date(uploadDate);
        const daysDiff = (now - docDate) / (1000 * 60 * 60 * 24);
        
        const maxAge = {
            'bank_statement': 90, // 3 months
            'income_proof': 180, // 6 months
            'identity_proof': 365, // 1 year
            'address_proof': 365 // 1 year
        };
        
        return daysDiff > (maxAge[docType] || 180);
    }

    getMinIncomeRequirement(loanType) {
        const minIncomes = {
            'personal_loan': 25000,
            'home_loan': 40000,
            'car_loan': 30000,
            'education_loan': 20000,
            'business_loan': 50000,
            'loan_against_property': 35000
        };
        return minIncomes[loanType] || 25000;
    }

    getMinCreditScore(loanType) {
        const minScores = {
            'personal_loan': 650,
            'home_loan': 700,
            'car_loan': 650,
            'education_loan': 600,
            'business_loan': 700,
            'loan_against_property': 650
        };
        return minScores[loanType] || 650;
    }

    getMaxLoanAmount(loanType, monthlyIncome) {
        const multipliers = {
            'personal_loan': 60,
            'home_loan': 120,
            'car_loan': 80,
            'education_loan': 100,
            'business_loan': 80,
            'loan_against_property': 100
        };
        
        const multiplier = multipliers[loanType] || 60;
        return monthlyIncome * multiplier;
    }

    getInterestRateRange(loanType) {
        const ranges = {
            'personal_loan': { min: 10.0, max: 24.0 },
            'home_loan': { min: 7.0, max: 12.0 },
            'car_loan': { min: 8.0, max: 15.0 },
            'education_loan': { min: 8.5, max: 16.0 },
            'business_loan': { min: 11.0, max: 20.0 },
            'loan_against_property': { min: 9.0, max: 16.0 }
        };
        return ranges[loanType] || { min: 8.0, max: 25.0 };
    }

    getMaxTenure(loanType) {
        const maxTenures = {
            'personal_loan': 84, // 7 years
            'home_loan': 360, // 30 years
            'car_loan': 84, // 7 years
            'education_loan': 180, // 15 years
            'business_loan': 120, // 10 years
            'loan_against_property': 240 // 20 years
        };
        return maxTenures[loanType] || 84;
    }

    /**
     * Get quality check status
     */
    async getQualityCheckStatus(qualityCheckId) {
        try {
            const qualityCheck = await QualityCheckModel.findById(qualityCheckId)
                .populate('loan_application_id', 'loan_details applicant_info')
                .populate('credit_decision_id', 'decision_result');

            if (!qualityCheck) {
                throw new Error('Quality check record not found');
            }

            return {
                success: true,
                data: {
                    quality_check_id: qualityCheck._id,
                    status: qualityCheck.status,
                    quality_result: qualityCheck.quality_result,
                    processing_logs: qualityCheck.processing_logs.slice(-5), // Last 5 logs
                    loan_application: qualityCheck.loan_application_id,
                    credit_decision: qualityCheck.credit_decision_id
                }
            };
        } catch (error) {
            console.error('Get quality check status error:', error);
            throw error;
        }
    }
}

module.exports = new QualityCheckService();