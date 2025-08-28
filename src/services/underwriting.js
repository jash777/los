/**
 * Underwriting Service (Stage 4)
 * Comprehensive risk assessment, credit analysis, and underwriting decision
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');
const config = require('../config/app');

class UnderwritingService {
    constructor() {
        this.riskWeights = {
            creditScore: 0.25,
            incomeStability: 0.20,
            employmentHistory: 0.15,
            debtToIncome: 0.15,
            bankingBehavior: 0.10,
            loanToValue: 0.10,
            externalFactors: 0.05
        };
    }

    /**
     * Process underwriting (Stage 4)
     */
    async processUnderwriting(applicationNumber, requestId) {
        const startTime = Date.now();
        
        logger.info(`[${requestId}] Starting underwriting process for ${applicationNumber}`);

        try {
            // Get existing application
            const existingApp = await databaseService.getCompleteApplication(applicationNumber);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            if (existingApp.current_stage !== 'application_processing' || existingApp.current_status !== 'approved') {
                throw new Error('Application must complete processing stage to proceed to underwriting');
            }

            const applicationId = existingApp.id;

            // Update stage to underwriting
            await databaseService.updateApplicationStage(applicationId, 'underwriting', 'in_progress');

            // Debug: Log the application data structure
            logger.info(`[${requestId}] Application data keys:`, Object.keys(existingApp));
            logger.info(`[${requestId}] Application basic info:`, {
                id: existingApp.id,
                application_number: existingApp.application_number,
                current_stage: existingApp.current_stage,
                status: existingApp.status,
                verifications_count: existingApp.verifications?.length || 0
            });

            // Step 1: Risk assessment
            const riskAssessment = await this.performRiskAssessment(existingApp, requestId);

            // Step 2: Credit analysis
            const creditAnalysis = await this.performCreditAnalysis(existingApp, requestId);

            // Step 3: Policy compliance check
            const policyCompliance = await this.performPolicyComplianceCheck(existingApp, requestId);

            // Step 4: Collateral assessment (if applicable)
            const collateralAssessment = await this.performCollateralAssessment(existingApp, requestId);

            // Step 5: Calculate overall underwriting score
            const underwritingScore = this.calculateUnderwritingScore(
                riskAssessment, creditAnalysis, policyCompliance, collateralAssessment
            );

            // Step 6: Make underwriting decision
            const underwritingDecision = this.makeUnderwritingDecision(
                underwritingScore, riskAssessment, creditAnalysis, existingApp
            );

            // Step 7: Save underwriting results
            await this.saveUnderwritingResults(applicationId, {
                risk_assessment: riskAssessment,
                credit_analysis: creditAnalysis,
                policy_compliance: policyCompliance,
                collateral_assessment: collateralAssessment,
                underwriting_score: underwritingScore,
                underwriting_decision: underwritingDecision
            });

            // Step 8: Save decision
            // Map decision values to match database ENUM
            const dbDecision = {
                'approve': 'approved',
                'reject': 'rejected', 
                'conditional': 'conditional_approval'
            }[underwritingDecision.decision] || 'rejected';
            
            const decisionData = {
                decision: dbDecision,
                decision_reason: underwritingDecision.reason,
                decision_score: underwritingScore,
                recommended_terms: underwritingDecision.recommendedTerms,
                decision_factors: {
                    positive_factors: underwritingDecision.positiveFactors,
                    negative_factors: underwritingDecision.negativeFactors,
                    risk_factors: underwritingDecision.riskFactors
                }
            };

            await databaseService.saveEligibilityDecision(applicationId, 'underwriting', decisionData);

            // Step 9: Update final status
            const finalStatus = underwritingDecision.decision === 'approve' ? 'approved' : 'rejected';
            const nextStage = underwritingDecision.decision === 'approve' ? 'credit_decision' : 'underwriting';
            await databaseService.updateApplicationStage(applicationId, nextStage, finalStatus, {
                underwriting_result: underwritingDecision,
                processing_time_ms: Date.now() - startTime
            });

            // Step 10: Return response
            if (underwritingDecision.decision === 'approve') {
                return this.createApprovalResponse(applicationNumber, underwritingDecision, underwritingScore, startTime);
            } else {
                return this.createRejectionResponse(applicationNumber, underwritingDecision.reason, underwritingDecision.negativeFactors, startTime);
            }

        } catch (error) {
            logger.error(`[${requestId}] Underwriting process failed:`, {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code,
                fullError: error
            });
            return this.createSystemErrorResponse(startTime, error.message || 'Unknown underwriting error');
        }
    }

    /**
     * Perform comprehensive risk assessment
     */
    async performRiskAssessment(existingApp, requestId) {
        logger.info(`[${requestId}] Performing comprehensive risk assessment`);

        // Extract data from the actual application structure
        const creditData = {}; // Will be populated from verifications array
        const financialData = {
            monthly_income: parseFloat(existingApp.monthly_income) || 0,
            employment_type: existingApp.employment_type
        };
        const personalData = {
            name: existingApp.applicant_name,
            email: existingApp.email,
            phone: existingApp.phone,
            pan_number: existingApp.pan_number
        };
        
        // Extract verification data if available
        if (existingApp.verifications && existingApp.verifications.length > 0) {
            existingApp.verifications.forEach(verification => {
                if (verification.verification_type === 'credit_assessment' && verification.verification_data) {
                    Object.assign(creditData, verification.verification_data);
                }
                if (verification.verification_type === 'financial_assessment' && verification.verification_data) {
                    Object.assign(financialData, verification.verification_data);
                }
            });
        }

        const riskFactors = {
            credit_risk: this.assessCreditRisk(creditData),
            income_risk: this.assessIncomeRisk(financialData),
            employment_risk: this.assessEmploymentRisk(financialData),
            behavioral_risk: this.assessBehavioralRisk(financialData),
            external_risk: this.assessExternalRisk(personalData)
        };

        const overallRiskScore = this.calculateOverallRiskScore(riskFactors);
        const riskCategory = this.determineRiskCategory(overallRiskScore);

        return {
            risk_factors: riskFactors,
            overall_risk_score: overallRiskScore,
            risk_category: riskCategory,
            risk_mitigation_factors: this.identifyRiskMitigationFactors(riskFactors),
            risk_concerns: this.identifyRiskConcerns(riskFactors)
        };
    }

    /**
     * Perform credit analysis
     */
    async performCreditAnalysis(existingApp, requestId) {
        logger.info(`[${requestId}] Performing credit analysis`);

        // Extract data from the actual application structure
        const creditData = {}; // Will be populated from verifications array
        const financialData = {
            monthly_income: parseFloat(existingApp.monthly_income) || 0,
            employment_type: existingApp.employment_type
        };
        
        // Extract verification data if available
        if (existingApp.verifications && existingApp.verifications.length > 0) {
            existingApp.verifications.forEach(verification => {
                if (verification.verification_type === 'credit_assessment' && verification.verification_data) {
                    Object.assign(creditData, verification.verification_data);
                }
                if (verification.verification_type === 'financial_assessment' && verification.verification_data) {
                    Object.assign(financialData, verification.verification_data);
                }
            });
        }

        const creditAnalysis = {
            credit_score_analysis: {
                current_score: creditData.cibil_score || 650,
                score_trend: 'stable',
                score_factors: this.analyzeCreditScoreFactors(creditData)
            },
            credit_history_analysis: {
                credit_age: creditData.credit_history_length_months || 24,
                payment_history: 'good',
                credit_utilization: creditData.credit_utilization_ratio || 30,
                credit_mix: 'balanced'
            },
            debt_analysis: {
                total_outstanding: creditData.total_outstanding || 0,
                debt_to_income_ratio: this.calculateDTI(financialData),
                debt_service_coverage: this.calculateDebtServiceCoverage(financialData)
            },
            repayment_capacity: {
                monthly_disposable_income: this.calculateDisposableIncome(financialData),
                repayment_capacity_ratio: this.calculateRepaymentCapacity(financialData),
                stress_test_results: this.performStressTest(financialData)
            }
        };

        const creditScore = this.calculateCreditAnalysisScore(creditAnalysis);

        return {
            ...creditAnalysis,
            overall_credit_score: creditScore,
            credit_recommendation: this.getCreditRecommendation(creditScore)
        };
    }

    /**
     * Perform policy compliance check
     */
    async performPolicyComplianceCheck(existingApp, requestId) {
        logger.info(`[${requestId}] Performing policy compliance check`);

        // Extract data from the actual application structure
        const loanRequest = {
            loan_amount: parseFloat(existingApp.loan_amount) || 0,
            loan_purpose: existingApp.loan_purpose,
            loan_type: 'personal' // Default for personal loans
        };
        const personalInfo = {
            name: existingApp.applicant_name,
            email: existingApp.email,
            phone: existingApp.phone,
            pan_number: existingApp.pan_number
        };
        const financialData = {
            monthly_income: parseFloat(existingApp.monthly_income) || 0,
            employment_type: existingApp.employment_type
        };
        
        // Extract verification data if available
        if (existingApp.verifications && existingApp.verifications.length > 0) {
            existingApp.verifications.forEach(verification => {
                if (verification.verification_type === 'financial_assessment' && verification.verification_data) {
                    Object.assign(financialData, verification.verification_data);
                }
            });
        }

        const policyChecks = {
            loan_amount_policy: this.checkLoanAmountPolicy(loanRequest, financialData),
            age_policy: this.checkAgePolicy(personalInfo),
            income_policy: this.checkIncomePolicy(financialData),
            employment_policy: this.checkEmploymentPolicy(financialData),
            debt_policy: this.checkDebtPolicy(financialData),
            collateral_policy: this.checkCollateralPolicy(loanRequest)
        };

        const complianceScore = this.calculatePolicyComplianceScore(policyChecks);
        const violations = this.identifyPolicyViolations(policyChecks);
        const exceptions = this.identifyRequiredExceptions(policyChecks);

        return {
            policy_checks: policyChecks,
            compliance_score: complianceScore,
            policy_violations: violations,
            exceptions_required: exceptions,
            compliance_status: violations.length === 0 ? 'compliant' : 'non_compliant'
        };
    }

    /**
     * Perform collateral assessment
     */
    async performCollateralAssessment(existingApp, requestId) {
        logger.info(`[${requestId}] Performing collateral assessment`);

        // Extract data from the actual application structure
        const loanRequest = {
            loan_amount: parseFloat(existingApp.loan_amount) || 0,
            loan_purpose: existingApp.loan_purpose,
            loan_type: 'personal' // Default for personal loans
        };

        // For unsecured loans, collateral assessment is minimal
        if (loanRequest.loan_type === 'personal') {
            return {
                collateral_required: false,
                collateral_type: 'none',
                collateral_value: 0,
                loan_to_value_ratio: 0,
                collateral_score: 100 // No collateral risk for personal loans
            };
        }

        // For secured loans, perform detailed assessment
        return {
            collateral_required: true,
            collateral_type: this.determineCollateralType(loanRequest.loan_type),
            collateral_value: this.estimateCollateralValue(loanRequest),
            loan_to_value_ratio: this.calculateLTV(loanRequest),
            collateral_score: this.calculateCollateralScore(loanRequest)
        };
    }

    /**
     * Calculate overall underwriting score
     */
    calculateUnderwritingScore(riskAssessment, creditAnalysis, policyCompliance, collateralAssessment) {
        const weights = {
            risk: 0.35,
            credit: 0.35,
            policy: 0.20,
            collateral: 0.10
        };

        // Convert risk score (lower is better) to positive score
        const riskScore = Math.max(0, 100 - riskAssessment.overall_risk_score);

        return Math.round(
            (riskScore * weights.risk) +
            (creditAnalysis.overall_credit_score * weights.credit) +
            (policyCompliance.compliance_score * weights.policy) +
            (collateralAssessment.collateral_score * weights.collateral)
        );
    }

    /**
     * Make underwriting decision
     */
    makeUnderwritingDecision(underwritingScore, riskAssessment, creditAnalysis, existingApp) {
        const decision = {
            decision: 'reject',
            reason: '',
            positiveFactors: [],
            negativeFactors: [],
            riskFactors: [],
            recommendedTerms: {}
        };

        const loanRequest = existingApp.applicant_data?.loan_request || {};
        const creditScore = existingApp.verification_data?.credit_assessment?.cibil_score || 650;

        // Decision logic based on underwriting score
        if (underwritingScore >= 85) {
            decision.decision = 'approve';
            decision.reason = 'Excellent underwriting profile';
            decision.positiveFactors.push('High underwriting score', 'Low risk profile', 'Strong credit history');
            decision.recommendedTerms = this.calculateOptimalTerms(loanRequest, creditScore, 'excellent');
        } else if (underwritingScore >= 75) {
            decision.decision = 'approve';
            decision.reason = 'Good underwriting profile with standard terms';
            decision.positiveFactors.push('Good underwriting score', 'Acceptable risk profile');
            decision.recommendedTerms = this.calculateOptimalTerms(loanRequest, creditScore, 'good');
        } else if (underwritingScore >= 65) {
            decision.decision = 'conditional_approval';
            decision.reason = 'Conditional approval with enhanced terms';
            decision.positiveFactors.push('Meets minimum criteria');
            decision.riskFactors.push('Moderate risk factors identified');
            decision.recommendedTerms = this.calculateOptimalTerms(loanRequest, creditScore, 'conditional_approval');
        } else {
            decision.decision = 'reject';
            decision.reason = 'Does not meet underwriting criteria';
            decision.negativeFactors.push('Low underwriting score', 'High risk profile');
        }

        // Additional risk-based adjustments
        if (riskAssessment.risk_category === 'high' || riskAssessment.risk_category === 'critical') {
            if (decision.decision === 'approve') {
                decision.decision = 'conditional_approval';
                decision.riskFactors.push('High risk category requires additional conditions');
            }
        }

        return decision;
    }

    /**
     * Save underwriting results to database
     */
    async saveUnderwritingResults(applicationId, underwritingData) {
        // Save to underwriting_results table
        const connection = await databaseService.pool.getConnection();
        
        try {
            await connection.execute(`
                INSERT INTO underwriting_results (
                    application_id, risk_assessment, policy_compliance, financial_analysis,
                    underwriter_decision, underwriter_comments, underwriter_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                applicationId,
                JSON.stringify(underwritingData.risk_assessment),
                JSON.stringify(underwritingData.policy_compliance),
                JSON.stringify(underwritingData.credit_analysis),
                underwritingData.underwriting_decision.decision,
                underwritingData.underwriting_decision.reason,
                'system_underwriter'
            ]);
            
        } finally {
            connection.release();
        }
    }

    // Helper methods for risk assessment
    assessCreditRisk(creditData) {
        const score = creditData.cibil_score || 650;
        if (score >= 800) return { score: 10, level: 'very_low' };
        if (score >= 750) return { score: 20, level: 'low' };
        if (score >= 700) return { score: 35, level: 'medium' };
        if (score >= 650) return { score: 50, level: 'high' };
        return { score: 80, level: 'very_high' };
    }

    assessIncomeRisk(financialData) {
        const income = financialData.employment_verification?.verified_income || 50000;
        if (income >= 100000) return { score: 10, level: 'very_low' };
        if (income >= 75000) return { score: 20, level: 'low' };
        if (income >= 50000) return { score: 35, level: 'medium' };
        if (income >= 30000) return { score: 50, level: 'high' };
        return { score: 80, level: 'very_high' };
    }

    assessEmploymentRisk(financialData) {
        const empType = financialData.employment_verification?.employment_type || 'salaried';
        const experience = financialData.employment_verification?.work_experience || 2;
        
        let riskScore = 30; // Base score
        
        if (empType === 'salaried') riskScore -= 10;
        if (empType === 'self-employed') riskScore += 15;
        
        if (experience >= 5) riskScore -= 10;
        if (experience < 2) riskScore += 20;
        
        return { score: Math.max(10, riskScore), level: this.getRiskLevel(riskScore) };
    }

    assessBehavioralRisk(financialData) {
        const bankingScore = financialData.banking_analysis?.banking_score || 75;
        const bounces = financialData.banking_analysis?.bounce_count_last_12_months || 0;
        
        let riskScore = 30;
        if (bankingScore >= 90) riskScore -= 15;
        if (bankingScore < 70) riskScore += 20;
        if (bounces > 2) riskScore += 25;
        
        return { score: Math.max(10, riskScore), level: this.getRiskLevel(riskScore) };
    }

    assessExternalRisk(personalData) {
        // Simulate external risk factors
        return { score: 20, level: 'low' };
    }

    calculateOverallRiskScore(riskFactors) {
        const weights = {
            credit_risk: 0.3,
            income_risk: 0.25,
            employment_risk: 0.2,
            behavioral_risk: 0.15,
            external_risk: 0.1
        };

        return Math.round(
            Object.entries(riskFactors).reduce((total, [factor, data]) => {
                return total + (data.score * (weights[factor] || 0));
            }, 0)
        );
    }

    determineRiskCategory(riskScore) {
        if (riskScore <= 25) return 'low';
        if (riskScore <= 45) return 'medium';
        if (riskScore <= 65) return 'high';
        return 'critical';
    }

    calculateOptimalTerms(loanRequest, creditScore, profile) {
        const baseRate = this.getBaseInterestRate(creditScore);
        const profileAdjustment = { excellent: -0.5, good: 0, conditional_approval: 1.5 }[profile] || 0;
        
        return {
            approved_amount: loanRequest.requested_amount,
            interest_rate: baseRate + profileAdjustment,
            tenure_months: loanRequest.preferred_tenure_months || 36,
            processing_fee: Math.min(loanRequest.requested_amount * 0.01, 25000),
            emi_amount: this.calculateEMI(loanRequest.requested_amount, 36, baseRate + profileAdjustment)
        };
    }

    getBaseInterestRate(creditScore) {
        if (creditScore >= 800) return 10.5;
        if (creditScore >= 750) return 11.5;
        if (creditScore >= 700) return 12.5;
        if (creditScore >= 650) return 13.5;
        return 15.0;
    }

    calculateEMI(principal, tenureMonths, annualRate) {
        const monthlyRate = annualRate / 12 / 100;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                   (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        return Math.round(emi);
    }

    getRiskLevel(score) {
        if (score <= 20) return 'very_low';
        if (score <= 35) return 'low';
        if (score <= 50) return 'medium';
        if (score <= 70) return 'high';
        return 'very_high';
    }

    // Additional helper methods would be implemented here...
    calculateDTI(financialData) { return 35; }
    calculateDebtServiceCoverage(financialData) { return 1.5; }
    calculateDisposableIncome(financialData) { return 25000; }
    calculateRepaymentCapacity(financialData) { return 0.4; }
    performStressTest(financialData) { return { passed: true, margin: 15 }; }
    analyzeCreditScoreFactors(creditData) { return ['payment_history', 'credit_utilization']; }
    calculateCreditAnalysisScore(creditAnalysis) { return 85; }
    getCreditRecommendation(score) { return score >= 80 ? 'approve' : 'review'; }
    
    // Policy check methods
    checkLoanAmountPolicy(loanRequest, financialData) { return { compliant: true, score: 100 }; }
    checkAgePolicy(personalInfo) { return { compliant: true, score: 100 }; }
    checkIncomePolicy(financialData) { return { compliant: true, score: 100 }; }
    checkEmploymentPolicy(financialData) { return { compliant: true, score: 100 }; }
    checkDebtPolicy(financialData) { return { compliant: true, score: 100 }; }
    checkCollateralPolicy(loanRequest) { return { compliant: true, score: 100 }; }
    
    calculatePolicyComplianceScore(policyChecks) { return 95; }
    identifyPolicyViolations(policyChecks) { return []; }
    identifyRequiredExceptions(policyChecks) { return []; }
    identifyRiskMitigationFactors(riskFactors) { return ['stable_income', 'good_banking_history']; }
    identifyRiskConcerns(riskFactors) { return []; }
    
    // Collateral methods
    determineCollateralType(loanType) { return loanType === 'home' ? 'property' : 'none'; }
    estimateCollateralValue(loanRequest) { return loanRequest.requested_amount * 1.2; }
    calculateLTV(loanRequest) { return 80; }
    calculateCollateralScore(loanRequest) { return 90; }

    // Response methods
    createApprovalResponse(applicationNumber, underwritingDecision, underwritingScore, startTime) {
        return {
            success: true,
            phase: 'underwriting',
            status: 'approved',
            applicationNumber,
            underwriting_score: underwritingScore,
            decision: underwritingDecision.decision,
            recommended_terms: underwritingDecision.recommendedTerms,
            positive_factors: underwritingDecision.positiveFactors,
            risk_factors: underwritingDecision.riskFactors,
            next_steps: {
                phase: 'credit_decision',
                description: 'Proceed to final credit decision',
                required_actions: [
                    'Final credit committee review',
                    'Terms and conditions finalization',
                    'Loan agreement preparation'
                ]
            },
            processing_time_ms: Date.now() - startTime,
            message: 'Underwriting completed successfully. Application approved for credit decision.'
        };
    }

    createRejectionResponse(applicationNumber, reason, errors, startTime) {
        return {
            success: false,
            phase: 'underwriting',
            status: 'rejected',
            applicationNumber,
            reason,
            errors,
            recommendations: [
                'Improve credit score and reapply',
                'Increase income or reduce existing obligations',
                'Consider applying for a lower loan amount'
            ],
            processing_time_ms: Date.now() - startTime,
            message: 'Application did not meet underwriting criteria.'
        };
    }

    createSystemErrorResponse(startTime, errorMessage) {
        return {
            success: false,
            phase: 'underwriting',
            status: 'error',
            error: 'System error during underwriting',
            message: errorMessage,
            processing_time_ms: Date.now() - startTime
        };
    }
    /**
     * Get underwriting status
     */
    async getUnderwritingStatus(applicationNumber) {
        try {
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            return {
                applicationNumber,
                current_stage: application.current_stage,
                current_status: application.current_status,
                underwriting_completed: application.current_stage === 'underwriting' && 
                                      ['approved', 'rejected'].includes(application.current_status)
            };
        } catch (error) {
            throw new Error(`Failed to get underwriting status: ${error.message}`);
        }
    }
}

module.exports = UnderwritingService;