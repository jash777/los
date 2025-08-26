/**
 * Loan Application Phase Service
 * Handles detailed loan application with comprehensive financial information
 */

const pool = require('../../middleware/config/database');
const { LOAN_ORIGINATION_PHASES, PHASE_STATUS, APPLICATION_STATUS_NEW } = require('../../middleware/constants/loan-origination-phases');
const logger = require('../../middleware/utils/logger');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const AccountStatementService = require('../../middleware/external/account-statement.service');
const PayslipVerificationService = require('../../middleware/external/payslip-verification.service');

class LoanApplicationService {
    constructor() {
        this.phase = LOAN_ORIGINATION_PHASES.LOAN_APPLICATION;
    }

    /**
     * Process detailed loan application
     * @param {Object} applicationData - Detailed application data
     * @param {string} preQualificationId - Pre-qualification application ID
     * @param {string} requestId - Request ID for tracking
     * @returns {Object} Processing result
     */
    async processLoanApplication(applicationData, preQualificationId, requestId) {
        try {
            logger.info(`[${requestId}] Starting loan application processing`, {
                preQualificationId,
                loanType: applicationData.loan_details?.loan_type,
                requestedAmount: applicationData.loan_details?.requested_amount
            });

            // Validate pre-qualification status
            const preQualification = await this.validatePreQualification(preQualificationId, requestId);
            if (!preQualification.success) {
                return preQualification;
            }

            // Create loan application record
            const applicationId = this.generateApplicationId();
            
            // Cross-verify employment details with CIBIL data
            const cibilEmploymentVerification = await this.verifyCibilEmploymentData(preQualificationId, applicationData, requestId);
            
            // Process account statement verification
            const accountStatementVerification = await this.processAccountStatement(applicationData.account_statement_data, requestId);
            
            // Process payslip verification
            const payslipVerification = await this.processPayslipVerification(applicationData.payslip_data, requestId);
            
            // Process financial information with enhanced verification
            const financialAssessment = await this.processFinancialInformation(applicationData, cibilEmploymentVerification, accountStatementVerification, payslipVerification, requestId);
            
            // Validate loan details
            const loanValidation = await this.validateLoanDetails(applicationData.loan_details, requestId);
            
            // Process supporting documents
            const documentValidation = await this.processDocuments(applicationData.documents || [], requestId);
            
            // Calculate comprehensive risk score
            const riskAssessment = await this.calculateRiskScore(applicationData, preQualification.data, requestId);
            
            // Determine application status
            const applicationStatus = this.determineApplicationStatus({
                financialAssessment,
                loanValidation,
                documentValidation,
                riskAssessment
            });

            const result = {
                success: applicationStatus.approved,
                application_id: applicationId,
                pre_qualification_id: preQualificationId,
                phase: this.phase,
                phase_status: applicationStatus.approved ? PHASE_STATUS.COMPLETED : PHASE_STATUS.REJECTED,
                processing_results: {
                    cibil_employment_verification: cibilEmploymentVerification,
                    account_statement_verification: accountStatementVerification,
                    payslip_verification: payslipVerification,
                    financial_assessment: financialAssessment,
                    loan_validation: loanValidation,
                    document_validation: documentValidation,
                    risk_assessment: riskAssessment
                },
                overall_result: {
                    approved: applicationStatus.approved,
                    rejection_reason: applicationStatus.rejection_reason,
                    recommendations: applicationStatus.recommendations,
                    next_steps: applicationStatus.next_steps,
                    eligible_amount: applicationStatus.eligible_amount,
                    suggested_terms: applicationStatus.suggested_terms
                },
                timestamp: new Date().toISOString(),
                request_id: requestId
            };

            // Save application data (would typically save to database)
            await this.saveApplicationData({
                ...result,
                application_data: applicationData,
                pre_qualification_data: preQualification.data
            }, requestId);

            logger.info(`[${requestId}] Loan application processing completed`, {
                applicationId,
                approved: result.success,
                eligibleAmount: applicationStatus.eligible_amount
            });

            return result;

        } catch (error) {
            logger.error(`[${requestId}] Loan application processing failed`, {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                phase: this.phase,
                phase_status: PHASE_STATUS.FAILED,
                error: {
                    message: 'Loan application processing failed',
                    details: error.message,
                    code: 'LOAN_APPLICATION_ERROR'
                },
                timestamp: new Date().toISOString(),
                request_id: requestId
            };
        }
    }

    /**
     * Validate pre-qualification status
     */
    async validatePreQualification(preQualificationId, requestId) {
        try {
            // In a real implementation, this would query the database
            // For now, we'll simulate validation
            logger.info(`[${requestId}] Validating pre-qualification`, { preQualificationId });

            // Simulate pre-qualification lookup
            const preQualification = {
                application_id: preQualificationId,
                approved: true,
                cibil_score: 720,
                eligible_amount: 500000,
                risk_category: 'medium'
            };

            if (!preQualification.approved) {
                return {
                    success: false,
                    error: {
                        message: 'Pre-qualification not approved',
                        code: 'PRE_QUALIFICATION_NOT_APPROVED'
                    }
                };
            }

            return {
                success: true,
                data: preQualification
            };

        } catch (error) {
            logger.error(`[${requestId}] Pre-qualification validation failed`, { error: error.message });
            return {
                success: false,
                error: {
                    message: 'Pre-qualification validation failed',
                    code: 'PRE_QUALIFICATION_VALIDATION_ERROR'
                }
            };
        }
    }

    /**
     * Process comprehensive financial information
     */
    async processFinancialInformation(applicationData, cibilEmploymentVerification, accountStatementVerification, payslipVerification, requestId) {
        try {
            logger.info(`[${requestId}] Processing financial information`);

            const { financial_details } = applicationData;
            
            // Calculate debt-to-income ratio
            const monthlyIncome = financial_details.monthly_income || 0;
            const monthlyExpenses = financial_details.monthly_expenses || 0;
            const existingEMIs = financial_details.existing_emis || 0;
            const totalMonthlyObligations = monthlyExpenses + existingEMIs;
            const dtiRatio = monthlyIncome > 0 ? (totalMonthlyObligations / monthlyIncome) * 100 : 100;

            // Assess financial stability
            const financialStability = this.assessFinancialStability({
                monthlyIncome,
                monthlyExpenses,
                existingEMIs,
                bankBalance: financial_details.bank_balance || 0,
                assets: financial_details.assets || [],
                liabilities: financial_details.liabilities || []
            });

            // Calculate net worth
            const totalAssets = (financial_details.assets || []).reduce((sum, asset) => sum + (asset.value || 0), 0);
            const totalLiabilities = (financial_details.liabilities || []).reduce((sum, liability) => sum + (liability.amount || 0), 0);
            const netWorth = totalAssets - totalLiabilities;

            // Enhanced assessment with verification data
            const enhancedAssessment = this.performEnhancedFinancialAssessment({
                dtiRatio,
                financialStability,
                netWorth,
                monthlyIncome,
                totalMonthlyObligations,
                cibilEmploymentVerification,
                accountStatementVerification,
                payslipVerification
            });

            return {
                status: 'completed',
                dti_ratio: Math.round(dtiRatio * 100) / 100,
                financial_stability_score: financialStability.score,
                net_worth: netWorth,
                monthly_disposable_income: monthlyIncome - totalMonthlyObligations,
                assessment: {
                    income_adequacy: monthlyIncome >= 50000 ? 'adequate' : 'insufficient',
                    expense_management: dtiRatio <= 40 ? 'good' : dtiRatio <= 60 ? 'moderate' : 'poor',
                    asset_base: totalAssets >= 100000 ? 'strong' : 'weak',
                    overall_rating: financialStability.rating
                },
                enhanced_assessment: enhancedAssessment,
                verification_summary: {
                    cibil_employment_score: cibilEmploymentVerification?.verification_score || 0,
                    account_statement_score: accountStatementVerification?.verification_score || 0,
                    payslip_verification_score: payslipVerification?.verification_score || 0,
                    combined_verification_score: this.calculateCombinedVerificationScore(cibilEmploymentVerification, accountStatementVerification, payslipVerification)
                },
                details: {
                    monthly_income: monthlyIncome,
                    monthly_expenses: monthlyExpenses,
                    existing_emis: existingEMIs,
                    total_assets: totalAssets,
                    total_liabilities: totalLiabilities,
                    stability_factors: financialStability.factors
                },
                completed_at: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`[${requestId}] Financial information processing failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                completed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Assess financial stability
     */
    assessFinancialStability(financialData) {
        let score = 0;
        const factors = [];

        // Income stability (30 points)
        if (financialData.monthlyIncome >= 100000) {
            score += 30;
            factors.push('High income level');
        } else if (financialData.monthlyIncome >= 50000) {
            score += 20;
            factors.push('Adequate income level');
        } else {
            score += 10;
            factors.push('Low income level');
        }

        // Expense management (25 points)
        const expenseRatio = financialData.monthlyExpenses / financialData.monthlyIncome;
        if (expenseRatio <= 0.3) {
            score += 25;
            factors.push('Excellent expense management');
        } else if (expenseRatio <= 0.5) {
            score += 15;
            factors.push('Good expense management');
        } else {
            score += 5;
            factors.push('High expense ratio');
        }

        // Existing debt burden (25 points)
        const debtRatio = financialData.existingEMIs / financialData.monthlyIncome;
        if (debtRatio <= 0.2) {
            score += 25;
            factors.push('Low existing debt burden');
        } else if (debtRatio <= 0.4) {
            score += 15;
            factors.push('Moderate existing debt burden');
        } else {
            score += 5;
            factors.push('High existing debt burden');
        }

        // Asset base (20 points)
        if (financialData.bankBalance >= 500000) {
            score += 20;
            factors.push('Strong liquid assets');
        } else if (financialData.bankBalance >= 100000) {
            score += 10;
            factors.push('Adequate liquid assets');
        } else {
            score += 5;
            factors.push('Limited liquid assets');
        }

        // Determine rating
        let rating;
        if (score >= 80) rating = 'excellent';
        else if (score >= 60) rating = 'good';
        else if (score >= 40) rating = 'fair';
        else rating = 'poor';

        return { score, rating, factors };
    }

    /**
     * Validate loan details
     */
    async validateLoanDetails(loanDetails, requestId) {
        try {
            logger.info(`[${requestId}] Validating loan details`);

            const validations = [];
            let isValid = true;

            // Validate loan amount
            if (!loanDetails.requested_amount || loanDetails.requested_amount < 50000) {
                validations.push({ field: 'requested_amount', status: 'invalid', message: 'Minimum loan amount is ₹50,000' });
                isValid = false;
            } else if (loanDetails.requested_amount > 10000000) {
                validations.push({ field: 'requested_amount', status: 'invalid', message: 'Maximum loan amount is ₹1,00,00,000' });
                isValid = false;
            } else {
                validations.push({ field: 'requested_amount', status: 'valid', message: 'Loan amount is within acceptable range' });
            }

            // Validate loan tenure
            if (!loanDetails.tenure || loanDetails.tenure < 6) {
                validations.push({ field: 'tenure', status: 'invalid', message: 'Minimum tenure is 6 months' });
                isValid = false;
            } else if (loanDetails.tenure > 84) {
                validations.push({ field: 'tenure', status: 'invalid', message: 'Maximum tenure is 84 months' });
                isValid = false;
            } else {
                validations.push({ field: 'tenure', status: 'valid', message: 'Tenure is acceptable' });
            }

            // Validate loan purpose
            if (!loanDetails.loan_purpose || loanDetails.loan_purpose.length < 10) {
                validations.push({ field: 'loan_purpose', status: 'invalid', message: 'Loan purpose must be detailed (minimum 10 characters)' });
                isValid = false;
            } else {
                validations.push({ field: 'loan_purpose', status: 'valid', message: 'Loan purpose is adequately described' });
            }

            return {
                status: isValid ? 'valid' : 'invalid',
                validations,
                completed_at: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`[${requestId}] Loan details validation failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                completed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Process supporting documents
     */
    async processDocuments(documents, requestId) {
        try {
            logger.info(`[${requestId}] Processing documents`, { documentCount: documents.length });

            const requiredDocuments = [
                'income_proof',
                'bank_statements',
                'address_proof',
                'identity_proof'
            ];

            const documentStatus = {};
            const missingDocuments = [];

            requiredDocuments.forEach(docType => {
                const document = documents.find(doc => doc.type === docType);
                if (document) {
                    documentStatus[docType] = {
                        status: 'submitted',
                        filename: document.filename,
                        size: document.size,
                        uploaded_at: document.uploaded_at
                    };
                } else {
                    documentStatus[docType] = {
                        status: 'missing'
                    };
                    missingDocuments.push(docType);
                }
            });

            const isComplete = missingDocuments.length === 0;

            return {
                status: isComplete ? 'complete' : 'incomplete',
                document_status: documentStatus,
                missing_documents: missingDocuments,
                total_documents: documents.length,
                required_documents: requiredDocuments.length,
                completion_percentage: Math.round(((requiredDocuments.length - missingDocuments.length) / requiredDocuments.length) * 100),
                completed_at: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`[${requestId}] Document processing failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                completed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate comprehensive risk score
     */
    async calculateRiskScore(applicationData, preQualificationData, requestId) {
        try {
            logger.info(`[${requestId}] Calculating risk score`);

            let riskScore = 0;
            const riskFactors = [];

            // Pre-qualification factors (30%)
            const cibilScore = preQualificationData.cibil_score || 650;
            if (cibilScore >= 750) {
                riskScore += 30;
                riskFactors.push('Excellent credit score');
            } else if (cibilScore >= 700) {
                riskScore += 25;
                riskFactors.push('Good credit score');
            } else {
                riskScore += 15;
                riskFactors.push('Average credit score');
            }

            // Financial stability (40%)
            const monthlyIncome = applicationData.financial_details?.monthly_income || 0;
            const requestedAmount = applicationData.loan_details?.requested_amount || 0;
            const loanToIncomeRatio = (requestedAmount / (monthlyIncome * 12)) * 100;

            if (loanToIncomeRatio <= 300) {
                riskScore += 40;
                riskFactors.push('Conservative loan-to-income ratio');
            } else if (loanToIncomeRatio <= 500) {
                riskScore += 30;
                riskFactors.push('Moderate loan-to-income ratio');
            } else {
                riskScore += 15;
                riskFactors.push('High loan-to-income ratio');
            }

            // Employment stability (20%)
            const workExperience = applicationData.employment_details?.work_experience || 0;
            if (workExperience >= 5) {
                riskScore += 20;
                riskFactors.push('Stable employment history');
            } else if (workExperience >= 2) {
                riskScore += 15;
                riskFactors.push('Adequate employment history');
            } else {
                riskScore += 10;
                riskFactors.push('Limited employment history');
            }

            // Asset coverage (10%)
            const totalAssets = (applicationData.financial_details?.assets || []).reduce((sum, asset) => sum + (asset.value || 0), 0);
            const assetCoverageRatio = (totalAssets / requestedAmount) * 100;

            if (assetCoverageRatio >= 150) {
                riskScore += 10;
                riskFactors.push('Strong asset coverage');
            } else if (assetCoverageRatio >= 100) {
                riskScore += 7;
                riskFactors.push('Adequate asset coverage');
            } else {
                riskScore += 3;
                riskFactors.push('Limited asset coverage');
            }

            // Determine risk category
            let riskCategory;
            if (riskScore >= 80) riskCategory = 'low';
            else if (riskScore >= 60) riskCategory = 'medium';
            else riskCategory = 'high';

            return {
                status: 'completed',
                risk_score: riskScore,
                risk_category: riskCategory,
                risk_factors: riskFactors,
                detailed_assessment: {
                    credit_score_contribution: Math.min(30, Math.round((cibilScore / 850) * 30)),
                    financial_stability_contribution: Math.min(40, 40 - Math.round(loanToIncomeRatio / 20)),
                    employment_stability_contribution: Math.min(20, Math.round(workExperience * 4)),
                    asset_coverage_contribution: Math.min(10, Math.round(assetCoverageRatio / 15))
                },
                completed_at: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`[${requestId}] Risk score calculation failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                completed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Determine application status based on all assessments
     */
    determineApplicationStatus(assessments) {
        const { financialAssessment, loanValidation, documentValidation, riskAssessment } = assessments;
        
        let approved = true;
        const rejectionReasons = [];
        const recommendations = [];
        let eligibleAmount = 0;
        const suggestedTerms = {};

        // Check financial assessment
        if (financialAssessment.status !== 'completed' || financialAssessment.dti_ratio > 60) {
            approved = false;
            rejectionReasons.push('High debt-to-income ratio');
            recommendations.push('Reduce existing debt obligations before reapplying');
        }

        // Check loan validation
        if (loanValidation.status !== 'valid') {
            approved = false;
            rejectionReasons.push('Invalid loan details');
            recommendations.push('Review and correct loan application details');
        }

        // Check document completeness
        if (documentValidation.status !== 'complete') {
            approved = false;
            rejectionReasons.push('Incomplete documentation');
            recommendations.push(`Submit missing documents: ${documentValidation.missing_documents.join(', ')}`);
        }

        // Check risk assessment
        if (riskAssessment.status === 'completed') {
            if (riskAssessment.risk_category === 'high') {
                approved = false;
                rejectionReasons.push('High risk profile');
                recommendations.push('Improve credit score and financial stability');
            } else {
                // Calculate eligible amount based on risk
                const baseAmount = financialAssessment.monthly_disposable_income * 60; // 60x disposable income
                if (riskAssessment.risk_category === 'low') {
                    eligibleAmount = Math.min(baseAmount * 1.2, 10000000);
                    suggestedTerms.interest_rate = '10.5%';
                    suggestedTerms.max_tenure = 84;
                } else {
                    eligibleAmount = Math.min(baseAmount, 5000000);
                    suggestedTerms.interest_rate = '12.5%';
                    suggestedTerms.max_tenure = 60;
                }
            }
        }

        return {
            approved,
            rejection_reason: rejectionReasons.join('; '),
            recommendations,
            next_steps: approved ? 'Proceed to Application Processing phase' : 'Address the issues and reapply',
            eligible_amount: Math.round(eligibleAmount),
            suggested_terms: suggestedTerms
        };
    }

    /**
     * Generate unique application ID
     */
    generateApplicationId() {
        return `LA${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    /**
     * Save comprehensive application data to JSON file
     */
    async saveApplicationData(applicationData, requestId) {
        try {
            logger.info(`[${requestId}] Saving loan application data`, {
                applicationId: applicationData.application_id
            });
            
            // Create comprehensive application data structure
            const comprehensiveData = {
                // Application metadata
                applicationId: applicationData.application_id,
                preQualificationId: applicationData.pre_qualification_id,
                timestamp: applicationData.timestamp,
                requestId: requestId,
                
                // Stage information
                currentStage: 'loan_application',
                stageHistory: [
                    {
                        stage: 'pre_qualification',
                        status: 'completed',
                        timestamp: applicationData.pre_qualification_data?.timestamp || new Date().toISOString(),
                        data: applicationData.pre_qualification_data
                    },
                    {
                        stage: 'loan_application',
                        status: applicationData.phase_status,
                        timestamp: applicationData.timestamp,
                        data: {
                            phase: applicationData.phase,
                            success: applicationData.success,
                            processing_results: applicationData.processing_results,
                            overall_result: applicationData.overall_result
                        }
                    }
                ],
                
                // Complete user input data
                userInputData: {
                    personalInfo: applicationData.application_data?.personal_info || {},
                    employmentDetails: applicationData.application_data?.employment_details || {},
                    financialInfo: applicationData.application_data?.financial_info || {},
                    loanDetails: applicationData.application_data?.loan_details || {},
                    documents: applicationData.application_data?.documents || [],
                    accountStatementData: applicationData.application_data?.account_statement_data || null,
                    payslipData: applicationData.application_data?.payslip_data || null
                },
                
                // Verification results from all stages
                verificationResults: {
                    panVerification: applicationData.pre_qualification_data?.pan_verification || null,
                    cibilVerification: applicationData.pre_qualification_data?.cibil_verification || null,
                    cibilEmploymentVerification: applicationData.processing_results?.cibil_employment_verification || null,
                    accountStatementVerification: applicationData.processing_results?.account_statement_verification || null,
                    payslipVerification: applicationData.processing_results?.payslip_verification || null
                },
                
                // Assessment results
                assessmentResults: {
                    preQualificationAssessment: applicationData.pre_qualification_data?.assessment || null,
                    financialAssessment: applicationData.processing_results?.financial_assessment || null,
                    riskAssessment: applicationData.processing_results?.risk_assessment || null,
                    loanValidation: applicationData.processing_results?.loan_validation || null,
                    documentValidation: applicationData.processing_results?.document_validation || null
                },
                
                // Decision and recommendations
                decisionSummary: {
                    preQualificationDecision: {
                        approved: applicationData.pre_qualification_data?.approved || false,
                        eligibleAmount: applicationData.pre_qualification_data?.eligible_amount || 0,
                        rejectionReason: applicationData.pre_qualification_data?.rejection_reason || null
                    },
                    loanApplicationDecision: {
                        approved: applicationData.overall_result?.approved || false,
                        eligibleAmount: applicationData.overall_result?.eligible_amount || 0,
                        rejectionReason: applicationData.overall_result?.rejection_reason || null,
                        recommendations: applicationData.overall_result?.recommendations || [],
                        nextSteps: applicationData.overall_result?.next_steps || null,
                        suggestedTerms: applicationData.overall_result?.suggested_terms || null
                    }
                },
                
                // Processing metadata
                processingMetadata: {
                    totalProcessingTime: null, // Can be calculated if needed
                    stagesCompleted: ['pre_qualification', 'loan_application'],
                    nextStage: applicationData.success ? 'underwriting' : null,
                    flags: {
                        requiresManualReview: this.requiresManualReview(applicationData),
                        highRisk: applicationData.processing_results?.risk_assessment?.risk_category === 'high',
                        incompleteDocuments: this.hasIncompleteDocuments(applicationData)
                    }
                }
            };
            
            // Save to file system (in real implementation, this would be database)
            const applicationDir = path.join(__dirname, '../../application_data', applicationData.application_id);
            
            // Ensure directory exists
            if (!fsSync.existsSync(applicationDir)) {
                await fs.mkdir(applicationDir, { recursive: true });
            }
            
            const filePath = path.join(applicationDir, 'comprehensive_application_data.json');
            await fs.writeFile(filePath, JSON.stringify(comprehensiveData, null, 2));
            
            logger.info(`[${requestId}] Comprehensive application data saved`, {
                applicationId: applicationData.application_id,
                filePath: filePath,
                dataSize: JSON.stringify(comprehensiveData).length
            });
            
            return { success: true, filePath };
            
        } catch (error) {
            logger.error(`[${requestId}] Failed to save application data`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Verify employment details against CIBIL data
     */
    async verifyCibilEmploymentData(preQualificationId, applicationData, requestId) {
        try {
            logger.info(`[${requestId}] Starting CIBIL employment verification`);
            
            // Load CIBIL data from pre-qualification stage
            const cibilDataPath = path.join(__dirname, '../../application_data', preQualificationId, 'cibil_report.json');
            
            let cibilData = null;
            try {
                const cibilContent = await fs.readFile(cibilDataPath, 'utf8');
                cibilData = JSON.parse(cibilContent);
            } catch (error) {
                logger.warn(`[${requestId}] CIBIL data not found for pre-qualification ID: ${preQualificationId}`);
                return {
                    status: 'failed',
                    error: 'CIBIL data not available for verification',
                    verification_score: 0
                };
            }
            
            // Extract employment information from user application
            const userEmployment = applicationData.employment_details || {};
            
            // Extract employment information from CIBIL report
            const cibilEmployment = this.extractCibilEmploymentData(cibilData);
            
            // Perform cross-verification
            const verification = {
                company_name_match: this.verifyCompanyName(userEmployment.company_name, cibilEmployment.employers),
                income_consistency: this.verifyIncomeConsistency(userEmployment.monthly_salary, cibilEmployment.income),
                employment_duration: this.verifyEmploymentDuration(userEmployment.work_experience, cibilEmployment.employment_duration),
                overall_score: 0
            };
            
            // Calculate overall verification score
            verification.overall_score = this.calculateEmploymentVerificationScore(verification);
            
            return {
                status: 'completed',
                cibil_employment_data: cibilEmployment,
                user_employment_data: userEmployment,
                verification_results: verification,
                verification_score: verification.overall_score,
                recommendations: this.generateEmploymentRecommendations(verification),
                completed_at: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`[${requestId}] CIBIL employment verification failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                verification_score: 0
            };
        }
    }
    
    /**
     * Extract employment data from CIBIL report
     */
    extractCibilEmploymentData(cibilData) {
        const employment = {
            employers: [],
            income: 0,
            employment_duration: 0
        };
        
        try {
            // Extract from Current_Other_Details section
            if (cibilData.creditReport && cibilData.creditReport.Current_Other_Details) {
                const currentDetails = cibilData.creditReport.Current_Other_Details;
                if (currentDetails.Income && parseInt(currentDetails.Income) > 0) {
                    employment.income = parseInt(currentDetails.Income);
                }
                if (currentDetails.Employment_Status) {
                    employment.employment_status = currentDetails.Employment_Status;
                }
                if (currentDetails.Time_with_Employer) {
                    employment.employment_duration = parseInt(currentDetails.Time_with_Employer) || 0;
                }
            }
            
            // Extract from CAIS_Account section for additional income information
            if (cibilData.creditReport && cibilData.creditReport.CAIS_Account) {
                const caisAccounts = Array.isArray(cibilData.creditReport.CAIS_Account) 
                    ? cibilData.creditReport.CAIS_Account 
                    : [cibilData.creditReport.CAIS_Account];
                    
                caisAccounts.forEach(account => {
                    if (account.Income && parseInt(account.Income) > employment.income) {
                        employment.income = parseInt(account.Income);
                    }
                });
            }
            
            // If no income found in Current_Other_Details, try to find it in other sections
            if (employment.income === 0) {
                // Check if there's any income data in the entire credit report
                const searchForIncome = (obj) => {
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            if (key === 'Income' && typeof obj[key] === 'number' && obj[key] > employment.income) {
                                employment.income = obj[key];
                            } else if (typeof obj[key] === 'object') {
                                searchForIncome(obj[key]);
                            }
                        }
                    }
                };
                searchForIncome(cibilData.creditReport);
            }
            
        } catch (error) {
            logger.warn('Error extracting CIBIL employment data', { error: error.message });
        }
        
        return employment;
    }
    
    /**
     * Process account statement verification
     */
    async processAccountStatement(accountStatementData, requestId) {
        try {
            logger.info(`[${requestId}] Processing account statement verification`);
            
            const accountStatementService = new AccountStatementService();
            
            if (!accountStatementData) {
                // Generate demo account statement data for testing
                accountStatementData = accountStatementService.generateDemoAccountStatement();
            }
            
            const verification = accountStatementService.verifyAccountStatement(accountStatementData);
            
            return {
                status: 'completed',
                account_statement_data: accountStatementData,
                verification_results: verification,
                verification_score: verification.overall_score,
                completed_at: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`[${requestId}] Account statement verification failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                verification_score: 0
            };
        }
    }
    
    /**
     * Process payslip verification
     */
    async processPayslipVerification(payslipData, requestId) {
        try {
            logger.info(`[${requestId}] Processing payslip verification`);
            
            const payslipVerificationService = new PayslipVerificationService();
            
            if (!payslipData) {
                // Generate demo payslip data for testing
                payslipData = payslipVerificationService.generateDemoPayslip();
            }
            
            const verification = payslipVerificationService.verifyPayslip(payslipData);
            
            return {
                status: 'completed',
                payslip_data: payslipData,
                verification_results: verification,
                verification_score: verification.overall_score,
                completed_at: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`[${requestId}] Payslip verification failed`, { error: error.message });
            return {
                status: 'failed',
                error: error.message,
                verification_score: 0
            };
        }
    }
    
    /**
     * Verify company name match
     */
    verifyCompanyName(userCompany, cibilEmployers) {
        if (!userCompany || !cibilEmployers || cibilEmployers.length === 0) {
            return { match: false, score: 0, reason: 'Insufficient data for comparison' };
        }
        
        // Simple string matching - in production, use fuzzy matching
        const normalizedUserCompany = userCompany.toLowerCase().trim();
        const matches = cibilEmployers.filter(employer => 
            employer.toLowerCase().includes(normalizedUserCompany) || 
            normalizedUserCompany.includes(employer.toLowerCase())
        );
        
        return {
            match: matches.length > 0,
            score: matches.length > 0 ? 85 : 0,
            reason: matches.length > 0 ? 'Company name found in CIBIL records' : 'Company name not found in CIBIL records'
        };
    }
    
    /**
     * Verify income consistency
     */
    verifyIncomeConsistency(userIncome, cibilIncome) {
        if (!userIncome || !cibilIncome) {
            return { consistent: false, score: 0, variance: 0, reason: 'Insufficient income data' };
        }
        
        const variance = Math.abs(userIncome - cibilIncome) / Math.max(userIncome, cibilIncome) * 100;
        let score = 0;
        let consistent = false;
        
        if (variance <= 10) {
            score = 95;
            consistent = true;
        } else if (variance <= 20) {
            score = 80;
            consistent = true;
        } else if (variance <= 30) {
            score = 60;
            consistent = false;
        } else {
            score = 30;
            consistent = false;
        }
        
        return {
            consistent,
            score,
            variance: Math.round(variance * 100) / 100,
            user_income: userIncome,
            cibil_income: cibilIncome,
            reason: consistent ? 'Income levels are consistent' : 'Significant income variance detected'
        };
    }
    
    /**
     * Verify employment duration
     */
    verifyEmploymentDuration(userExperience, cibilDuration) {
        if (!userExperience || !cibilDuration) {
            return { consistent: false, score: 0, reason: 'Insufficient employment duration data' };
        }
        
        const difference = Math.abs(userExperience - cibilDuration);
        let score = 0;
        let consistent = false;
        
        if (difference <= 6) { // 6 months tolerance
            score = 90;
            consistent = true;
        } else if (difference <= 12) { // 1 year tolerance
            score = 70;
            consistent = true;
        } else if (difference <= 24) { // 2 years tolerance
            score = 50;
            consistent = false;
        } else {
            score = 20;
            consistent = false;
        }
        
        return {
            consistent,
            score,
            difference_months: difference,
            user_experience: userExperience,
            cibil_duration: cibilDuration,
            reason: consistent ? 'Employment duration is consistent' : 'Employment duration discrepancy detected'
        };
    }
    
    /**
     * Calculate employment verification score
     */
    calculateEmploymentVerificationScore(verification) {
        const weights = {
            company_name_match: 0.3,
            income_consistency: 0.5,
            employment_duration: 0.2
        };
        
        let totalScore = 0;
        totalScore += (verification.company_name_match?.score || 0) * weights.company_name_match;
        totalScore += (verification.income_consistency?.score || 0) * weights.income_consistency;
        totalScore += (verification.employment_duration?.score || 0) * weights.employment_duration;
        
        return Math.round(totalScore * 100) / 100;
    }
    
    /**
     * Generate employment recommendations
     */
    generateEmploymentRecommendations(verification) {
        const recommendations = [];
        
        if (!verification.company_name_match?.match) {
            recommendations.push('Verify company name with additional documentation');
        }
        
        if (!verification.income_consistency?.consistent) {
            recommendations.push('Request additional income verification documents');
        }
        
        if (!verification.employment_duration?.consistent) {
            recommendations.push('Verify employment history with HR documentation');
        }
        
        if (verification.overall_score < 60) {
            recommendations.push('Consider manual review due to low verification score');
        }
        
        return recommendations;
    }
    
    /**
     * Perform enhanced financial assessment
     */
    performEnhancedFinancialAssessment(data) {
        const {
            dtiRatio,
            financialStability,
            netWorth,
            monthlyIncome,
            totalMonthlyObligations,
            cibilEmploymentVerification,
            accountStatementVerification,
            payslipVerification
        } = data;
        
        let enhancedScore = financialStability.score;
        const adjustments = [];
        
        // Adjust based on CIBIL employment verification
        if (cibilEmploymentVerification?.verification_score >= 80) {
            enhancedScore += 10;
            adjustments.push('Positive CIBIL employment verification (+10)');
        } else if (cibilEmploymentVerification?.verification_score < 60) {
            enhancedScore -= 15;
            adjustments.push('Poor CIBIL employment verification (-15)');
        }
        
        // Adjust based on account statement verification
        if (accountStatementVerification?.verification_score >= 80) {
            enhancedScore += 15;
            adjustments.push('Strong account statement verification (+15)');
        } else if (accountStatementVerification?.verification_score < 60) {
            enhancedScore -= 10;
            adjustments.push('Weak account statement verification (-10)');
        }
        
        // Adjust based on payslip verification
        if (payslipVerification?.verification_score >= 80) {
            enhancedScore += 10;
            adjustments.push('Strong payslip verification (+10)');
        } else if (payslipVerification?.verification_score < 60) {
            enhancedScore -= 10;
            adjustments.push('Weak payslip verification (-10)');
        }
        
        // Cap the score between 0 and 100
        enhancedScore = Math.max(0, Math.min(100, enhancedScore));
        
        return {
            enhanced_score: Math.round(enhancedScore * 100) / 100,
            base_score: financialStability.score,
            adjustments,
            risk_level: enhancedScore >= 80 ? 'low' : enhancedScore >= 60 ? 'medium' : 'high',
            recommendation: enhancedScore >= 70 ? 'approve' : enhancedScore >= 50 ? 'conditional_approve' : 'reject'
        };
    }
    
    /**
     * Calculate combined verification score
     */
    calculateCombinedVerificationScore(cibilEmploymentVerification, accountStatementVerification, payslipVerification) {
        const weights = {
            cibil_employment: 0.4,
            account_statement: 0.35,
            payslip: 0.25
        };
        
        let totalScore = 0;
        totalScore += (cibilEmploymentVerification?.verification_score || 0) * weights.cibil_employment;
        totalScore += (accountStatementVerification?.verification_score || 0) * weights.account_statement;
        totalScore += (payslipVerification?.verification_score || 0) * weights.payslip;
        
        return Math.round(totalScore * 100) / 100;
    }
    
    /**
     * Check if application requires manual review
     */
    requiresManualReview(applicationData) {
        const flags = [];
        
        // Check CIBIL employment verification score
        const cibilScore = applicationData.processing_results?.cibil_employment_verification?.verification_score || 0;
        if (cibilScore < 50) {
            flags.push('low_cibil_employment_score');
        }
        
        // Check account statement verification
        const accountScore = applicationData.processing_results?.account_statement_verification?.verification_score || 0;
        if (accountScore < 50) {
            flags.push('low_account_statement_score');
        }
        
        // Check payslip verification
        const payslipScore = applicationData.processing_results?.payslip_verification?.verification_score || 0;
        if (payslipScore < 50) {
            flags.push('low_payslip_score');
        }
        
        // Check high loan amount
        const loanAmount = applicationData.application_data?.loan_details?.loan_amount || 0;
        if (loanAmount > 5000000) { // 50 lakhs
            flags.push('high_loan_amount');
        }
        
        // Check risk category
        const riskCategory = applicationData.processing_results?.risk_assessment?.risk_category;
        if (riskCategory === 'high') {
            flags.push('high_risk_category');
        }
        
        return flags.length > 0;
    }
    
    /**
     * Check if application has incomplete documents
     */
    hasIncompleteDocuments(applicationData) {
        const documentValidation = applicationData.processing_results?.document_validation;
        if (!documentValidation) return true;
        
        const missingDocs = documentValidation.missing_documents || [];
        const invalidDocs = documentValidation.invalid_documents || [];
        
        return missingDocs.length > 0 || invalidDocs.length > 0;
    }
    
    /**
     * Get application status
     */
    async getApplicationStatus(applicationId, requestId) {
        try {
            // In a real implementation, this would query the database
            return {
                application_id: applicationId,
                phase: this.phase,
                status: 'completed',
                last_updated: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get application status: ${error.message}`);
        }
    }
}

module.exports = LoanApplicationService;