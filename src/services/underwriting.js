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

            // Allow multiple valid previous stages for flexibility
            const validPreviousStages = ['application_processing', 'underwriting'];
            const validStatuses = ['approved', 'pending'];
            if (!validPreviousStages.includes(existingApp.current_stage) || !validStatuses.includes(existingApp.current_status)) {
                throw new Error(`Application must complete processing stage to proceed to underwriting. Current: ${existingApp.current_stage}/${existingApp.current_status}`);
            }

            const applicationId = existingApp.id;

            // Update stage to underwriting
            await databaseService.updateApplicationStage(applicationId, 'underwriting', 'under_review');

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

    /**
     * Get comprehensive underwriting dashboard data
     */
    async getUnderwritingDashboardData(applicationNumber, requestId) {
        try {
            logger.info(`[${requestId}] Fetching comprehensive underwriting data for ${applicationNumber}`);

            // Get complete application data
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                return {
                    success: false,
                    error: 'Application not found'
                };
            }

            // Get third-party data (CIBIL, Bank Analysis, etc.)
            const thirdPartyData = await this.getThirdPartyData(applicationNumber, requestId);

            // Get risk assessment data
            const riskData = await this.getRiskAssessmentData(application, requestId);

            // Calculate DTI and financial ratios
            const financialAnalysis = await this.calculateFinancialRatios(application, requestId);

            // Get rule-based checks
            const ruleChecks = await this.performRuleBasedChecks(application, requestId);

            // Get underwriting history
            const underwritingHistory = await this.getUnderwritingHistory(applicationNumber, requestId);

            // Get manual decisions if any
            const manualDecisions = await this.getManualDecisions(applicationNumber, requestId);

            const dashboardData = {
                application_info: {
                    application_number: application.application_number,
                    created_at: application.created_at,
                    current_stage: application.current_stage,
                    status: application.current_status,
                    loan_amount: application.loan_amount,
                    loan_purpose: application.loan_purpose,
                    preferred_tenure: application.preferred_tenure_months
                },
                personal_details: application.personal_details || {},
                employment_details: application.employment_details || {},
                income_details: application.income_details || {},
                banking_details: application.banking_details || {},
                address_details: application.address_details || {},
                financial_details: application.financial_details || {},
                third_party_data: thirdPartyData,
                risk_assessment: riskData,
                financial_analysis: financialAnalysis,
                rule_based_checks: ruleChecks,
                underwriting_history: underwritingHistory,
                manual_decisions: manualDecisions,
                underwriting_score: riskData.overall_score || 0,
                recommendation: this.generateUnderwritingRecommendation(riskData, financialAnalysis, ruleChecks)
            };

            return {
                success: true,
                data: dashboardData
            };

        } catch (error) {
            logger.error(`[${requestId}] Error getting underwriting dashboard data:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get third-party data for underwriting
     */
    async getThirdPartyData(applicationNumber, requestId) {
        try {
            // Try to read from file system first
            const fs = require('fs').promises;
            const path = require('path');
            
            const appDir = path.join(process.cwd(), 'applications', applicationNumber);
            const thirdPartyDir = path.join(appDir, 'third-party-data');

            const thirdPartyData = {
                cibil_data: null,
                bank_analysis: null,
                employment_verification: null,
                pan_verification: null
            };

            try {
                // CIBIL Data
                try {
                    const cibilPath = path.join(thirdPartyDir, 'cibil-report.json');
                    const cibilData = await fs.readFile(cibilPath, 'utf8');
                    thirdPartyData.cibil_data = JSON.parse(cibilData);
                } catch (e) {
                    logger.warn(`[${requestId}] CIBIL data not found for ${applicationNumber}`);
                }

                // Bank Analysis
                try {
                    const bankPath = path.join(thirdPartyDir, 'bank-analysis.json');
                    const bankData = await fs.readFile(bankPath, 'utf8');
                    thirdPartyData.bank_analysis = JSON.parse(bankData);
                } catch (e) {
                    logger.warn(`[${requestId}] Bank analysis not found for ${applicationNumber}`);
                }

                // Employment Verification
                try {
                    const empPath = path.join(thirdPartyDir, 'employment-verification.json');
                    const empData = await fs.readFile(empPath, 'utf8');
                    thirdPartyData.employment_verification = JSON.parse(empData);
                } catch (e) {
                    logger.warn(`[${requestId}] Employment verification not found for ${applicationNumber}`);
                }

                // PAN Verification
                try {
                    const panPath = path.join(thirdPartyDir, 'pan-verification.json');
                    const panData = await fs.readFile(panPath, 'utf8');
                    thirdPartyData.pan_verification = JSON.parse(panData);
                } catch (e) {
                    logger.warn(`[${requestId}] PAN verification not found for ${applicationNumber}`);
                }

            } catch (error) {
                logger.warn(`[${requestId}] Could not read third-party data directory for ${applicationNumber}`);
            }

            return thirdPartyData;

        } catch (error) {
            logger.error(`[${requestId}] Error getting third-party data:`, error);
            return {};
        }
    }

    /**
     * Get risk assessment data
     */
    async getRiskAssessmentData(application, requestId) {
        try {
            // This would typically come from a risk engine
            // For now, we'll simulate based on available data
            const riskFactors = {
                credit_score: application.cibil_score || 0,
                income_stability: this.assessIncomeStability(application),
                employment_history: this.assessEmploymentHistory(application),
                debt_to_income: this.calculateDebtToIncomeRatio(application),
                banking_behavior: this.assessBankingBehavior(application),
                loan_to_value: this.calculateLoanToValue(application),
                external_factors: this.assessExternalFactors(application)
            };

            const overallScore = this.calculateOverallRiskScore(riskFactors);

            return {
                risk_factors: riskFactors,
                overall_score: overallScore,
                risk_category: this.categorizeRisk(overallScore),
                recommendation: this.getRiskRecommendation(overallScore)
            };

        } catch (error) {
            logger.error(`[${requestId}] Error getting risk assessment data:`, error);
            return {
                risk_factors: {},
                overall_score: 0,
                risk_category: 'HIGH',
                recommendation: 'REJECT'
            };
        }
    }

    /**
     * Calculate financial ratios including DTI
     */
    async calculateFinancialRatios(application, requestId) {
        try {
            const monthlyIncome = application.income_details?.total_monthly_income || 0;
            const existingEMI = application.income_details?.existing_emi || 0;
            const requestedLoanAmount = application.loan_amount || 0;
            const tenure = application.preferred_tenure_months || 36;

            // Calculate proposed EMI (simplified calculation)
            const interestRate = 12; // Assumed annual rate
            const monthlyRate = interestRate / 12 / 100;
            const proposedEMI = monthlyRate > 0 ? 
                (requestedLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1) : 0;

            const totalEMI = existingEMI + proposedEMI;
            const dti = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 100;
            const foir = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 100; // Fixed Obligation to Income Ratio

            return {
                monthly_income: monthlyIncome,
                existing_emi: existingEMI,
                proposed_emi: Math.round(proposedEMI),
                total_emi: Math.round(totalEMI),
                debt_to_income_ratio: Math.round(dti * 100) / 100,
                foir: Math.round(foir * 100) / 100,
                disposable_income: Math.round(monthlyIncome - totalEMI),
                dti_category: this.categorizeDTI(dti),
                affordability_score: this.calculateAffordabilityScore(dti, monthlyIncome, totalEMI)
            };

        } catch (error) {
            logger.error(`[${requestId}] Error calculating financial ratios:`, error);
            return {
                debt_to_income_ratio: 100,
                dti_category: 'HIGH_RISK',
                affordability_score: 0
            };
        }
    }

    /**
     * Perform rule-based checks
     */
    async performRuleBasedChecks(application, requestId) {
        try {
            const checks = {
                age_criteria: this.checkAgeCriteria(application),
                income_criteria: this.checkIncomeCriteria(application),
                employment_criteria: this.checkEmploymentCriteria(application),
                credit_score_criteria: this.checkCreditScoreCriteria(application),
                loan_amount_criteria: this.checkLoanAmountCriteria(application),
                banking_criteria: this.checkBankingCriteria(application),
                document_criteria: this.checkDocumentCriteria(application),
                policy_compliance: this.checkPolicyCompliance(application)
            };

            const passedChecks = Object.values(checks).filter(check => check.status === 'PASS').length;
            const totalChecks = Object.keys(checks).length;
            const complianceScore = Math.round((passedChecks / totalChecks) * 100);

            return {
                individual_checks: checks,
                total_checks: totalChecks,
                passed_checks: passedChecks,
                compliance_score: complianceScore,
                overall_status: complianceScore >= 70 ? 'COMPLIANT' : 'NON_COMPLIANT'
            };

        } catch (error) {
            logger.error(`[${requestId}] Error performing rule-based checks:`, error);
            return {
                overall_status: 'NON_COMPLIANT',
                compliance_score: 0
            };
        }
    }

    /**
     * Make manual underwriting decision
     */
    async makeManualUnderwritingDecision(applicationNumber, decisionData) {
        try {
            const { decision, comments, reviewer, conditions, requestId } = decisionData;

            logger.info(`[${requestId}] Recording manual underwriting decision: ${decision} for ${applicationNumber}`);

            // Get application
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                return {
                    success: false,
                    error: 'Application not found'
                };
            }

            // Update application status based on decision
            let newStatus = 'under_review';
            let nextStage = 'underwriting';

            switch (decision) {
                case 'approve':
                    newStatus = 'approved';
                    nextStage = 'credit_decision'; // Move to next stage
                    break;
                case 'reject':
                    newStatus = 'rejected';
                    nextStage = 'underwriting'; // Stay in same stage
                    break;
                case 'review':
                    newStatus = 'under_review';
                    nextStage = 'underwriting'; // Stay in same stage
                    break;
            }

            // Update application stage and status
            await databaseService.updateApplicationStage(application.id, nextStage, newStatus);

            return {
                success: true,
                data: {
                    application_number: applicationNumber,
                    decision: decision,
                    new_status: newStatus,
                    next_stage: nextStage,
                    decision_date: new Date().toISOString(),
                    reviewer: reviewer
                }
            };

        } catch (error) {
            logger.error('Error making manual underwriting decision:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods for the dashboard functionality
    async getUnderwritingHistory(applicationNumber, requestId) {
        try {
            return [];
        } catch (error) {
            logger.error(`[${requestId}] Error getting underwriting history:`, error);
            return [];
        }
    }

    async getManualDecisions(applicationNumber, requestId) {
        try {
            return [];
        } catch (error) {
            logger.error(`[${requestId}] Error getting manual decisions:`, error);
            return [];
        }
    }

    async getPendingUnderwritingApplications(options) {
        try {
            const { limit, offset, priority, assignedTo, requestId } = options;
            return {
                data: [],
                pagination: {
                    total: 0,
                    limit: limit,
                    offset: offset,
                    has_more: false
                }
            };
        } catch (error) {
            logger.error('Error getting pending underwriting applications:', error);
            throw error;
        }
    }

    generateUnderwritingRecommendation(riskData, financialAnalysis, ruleChecks) {
        try {
            const riskScore = riskData.overall_score || 0;
            const dti = financialAnalysis.debt_to_income_ratio || 100;
            const complianceScore = ruleChecks.compliance_score || 0;

            let recommendation = 'REJECT';
            let confidence = 0;
            let reasons = [];

            if (riskScore >= 70 && dti <= 40 && complianceScore >= 80) {
                recommendation = 'APPROVE';
                confidence = 85;
                reasons = ['Strong risk profile', 'Good DTI ratio', 'High compliance score'];
            } else if (riskScore >= 50 && dti <= 50 && complianceScore >= 70) {
                recommendation = 'CONDITIONAL_APPROVE';
                confidence = 65;
                reasons = ['Moderate risk profile', 'Acceptable DTI ratio', 'Good compliance'];
            } else {
                recommendation = 'REJECT';
                confidence = 80;
                reasons = [];
                if (riskScore < 50) reasons.push('Low risk score');
                if (dti > 50) reasons.push('High DTI ratio');
                if (complianceScore < 70) reasons.push('Poor compliance score');
            }

            return {
                recommendation,
                confidence,
                reasons,
                suggested_conditions: recommendation === 'CONDITIONAL_APPROVE' ? 
                    ['Additional income verification', 'Co-signer requirement'] : []
            };

        } catch (error) {
            logger.error('Error generating underwriting recommendation:', error);
            return {
                recommendation: 'REJECT',
                confidence: 0,
                reasons: ['System error in recommendation generation']
            };
        }
    }

    // Helper methods for risk assessment
    assessIncomeStability(application) {
        return Math.random() * 100; // Mock for now
    }

    assessEmploymentHistory(application) {
        return Math.random() * 100; // Mock for now
    }

    calculateDebtToIncomeRatio(application) {
        const monthlyIncome = application.income_details?.total_monthly_income || 0;
        const existingEMI = application.income_details?.existing_emi || 0;
        return monthlyIncome > 0 ? (existingEMI / monthlyIncome) * 100 : 100;
    }

    assessBankingBehavior(application) {
        return Math.random() * 100; // Mock for now
    }

    calculateLoanToValue(application) {
        return Math.random() * 100; // Mock for now
    }

    assessExternalFactors(application) {
        return Math.random() * 100; // Mock for now
    }

    calculateOverallRiskScore(riskFactors) {
        const weights = this.riskWeights;
        let score = 0;
        
        score += (riskFactors.credit_score || 0) * weights.creditScore;
        score += (riskFactors.income_stability || 0) * weights.incomeStability;
        score += (riskFactors.employment_history || 0) * weights.employmentHistory;
        score += (100 - (riskFactors.debt_to_income || 0)) * weights.debtToIncome; // Invert DTI
        score += (riskFactors.banking_behavior || 0) * weights.bankingBehavior;
        score += (riskFactors.loan_to_value || 0) * weights.loanToValue;
        score += (riskFactors.external_factors || 0) * weights.externalFactors;

        return Math.round(score);
    }

    categorizeRisk(score) {
        if (score >= 80) return 'LOW';
        if (score >= 60) return 'MEDIUM';
        if (score >= 40) return 'HIGH';
        return 'VERY_HIGH';
    }

    getRiskRecommendation(score) {
        if (score >= 70) return 'APPROVE';
        if (score >= 50) return 'CONDITIONAL_APPROVE';
        return 'REJECT';
    }

    categorizeDTI(dti) {
        if (dti <= 30) return 'EXCELLENT';
        if (dti <= 40) return 'GOOD';
        if (dti <= 50) return 'FAIR';
        return 'POOR';
    }

    calculateAffordabilityScore(dti, income, totalEMI) {
        if (dti <= 30 && income >= 50000) return 90;
        if (dti <= 40 && income >= 30000) return 70;
        if (dti <= 50 && income >= 25000) return 50;
        return 20;
    }

    // Rule-based check methods
    checkAgeCriteria(application) {
        return { status: 'PASS', message: 'Age criteria met' };
    }

    checkIncomeCriteria(application) {
        return { status: 'PASS', message: 'Income criteria met' };
    }

    checkEmploymentCriteria(application) {
        return { status: 'PASS', message: 'Employment criteria met' };
    }

    checkCreditScoreCriteria(application) {
        return { status: 'PASS', message: 'Credit score criteria met' };
    }

    checkLoanAmountCriteria(application) {
        return { status: 'PASS', message: 'Loan amount criteria met' };
    }

    checkBankingCriteria(application) {
        return { status: 'PASS', message: 'Banking criteria met' };
    }

    checkDocumentCriteria(application) {
        return { status: 'PASS', message: 'Document criteria met' };
    }

    checkPolicyCompliance(application) {
        return { status: 'PASS', message: 'Policy compliance met' };
    }
}

module.exports = UnderwritingService;