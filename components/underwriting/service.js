const { UNDERWRITING_STAGES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');
const pool = require('../../middleware/config/database');
// Models replaced with direct PostgreSQL queries
const { EligibilityRuleEngine, CIBILRuleEngine, RiskAssessmentRuleEngine, KYCRuleEngine } = require('../rule-engine');
const SurepassService = require('../../middleware/external/surepass.service');
const logger = require('../../middleware/utils/logger');

class UnderwritingService {
    constructor() {
        this.kycRuleEngine = new KYCRuleEngine();
        this.riskAssessmentRuleEngine = new RiskAssessmentRuleEngine();
    }

    /**
     * Process underwriting for a loan application
     * @param {string} applicationProcessingId - Application processing ID
     * @param {Object} underwritingData - Additional underwriting data
     * @returns {Object} Processing result
     */
    async processUnderwriting(applicationProcessingId, underwritingData = {}) {
        try {
            // Validate application processing exists and is approved
            const applicationProcessing = await ApplicationProcessingModel.findById(applicationProcessingId);
            if (!applicationProcessing) {
                throw new Error('Application processing record not found');
            }

            if (applicationProcessing.processing_result.final_result !== 'approved') {
                throw new Error('Application processing must be approved before underwriting');
            }

            // Get loan application data
            const loanApplication = await LoanApplicationModel.findById(applicationProcessing.loan_application_id);
            if (!loanApplication) {
                throw new Error('Loan application not found');
            }

            // Create underwriting record
            const underwriting = new UnderwritingModel({
                application_processing_id: applicationProcessingId,
                loan_application_id: applicationProcessing.loan_application_id,
                current_stage: UNDERWRITING_STAGES.CREDIT_SCORE_ANALYSIS,
                status: PHASE_STATUS.IN_PROGRESS,
                underwriting_data: {
                    credit_bureau_preference: underwritingData.credit_bureau_preference || 'CIBIL',
                    collateral_details: underwritingData.collateral_details || {},
                    additional_income_sources: underwritingData.additional_income_sources || [],
                    risk_mitigation_factors: underwritingData.risk_mitigation_factors || []
                }
            });

            await underwriting.save();
            await underwriting.addLog('Underwriting process initiated', 'system');

            // Process through underwriting stages
            await this.processKYCVerification(underwriting, loanApplication);
            await this.processCreditScoreAnalysis(underwriting, loanApplication);
            await this.processDebtToIncomeAnalysis(underwriting, loanApplication);
            await this.processCollateralAssessment(underwriting, loanApplication);
            await this.processRiskAssessment(underwriting, loanApplication);
            await this.processAutomatedDecision(underwriting, loanApplication);

            // Determine final underwriting result
            const finalResult = this.determineFinalResult(underwriting);
            underwriting.underwriting_result = finalResult;
            underwriting.status = finalResult.decision === 'approved' ? PHASE_STATUS.COMPLETED : 
                                 finalResult.decision === 'rejected' ? PHASE_STATUS.REJECTED :
                                 PHASE_STATUS.PENDING_REVIEW;
            underwriting.current_stage = UNDERWRITING_STAGES.DECISION_FINALIZATION;

            await underwriting.save();
            await underwriting.addLog(`Underwriting completed with decision: ${finalResult.decision}`, 'system');

            return {
                success: true,
                underwriting_id: underwriting._id,
                decision: finalResult.decision,
                loan_amount_approved: finalResult.approved_amount,
                conditions: finalResult.conditions,
                next_phase: finalResult.decision === 'approved' ? 'credit-decision' : null
            };

        } catch (error) {
            console.error('Underwriting processing error:', error);
            throw error;
        }
    }

    /**
     * Process credit score analysis stage
     */
    async processCreditScoreAnalysis(underwriting, loanApplication) {
        underwriting.current_stage = UNDERWRITING_STAGES.CREDIT_SCORE_ANALYSIS;
        await underwriting.addLog('Starting credit score analysis', 'system');

        const creditAnalysis = {
            cibil_score: this.simulateCreditScore(),
            credit_history_length: Math.floor(Math.random() * 120) + 12, // 1-10 years
            payment_history: this.simulatePaymentHistory(),
            credit_utilization: Math.floor(Math.random() * 80) + 10, // 10-90%
            credit_mix: this.simulateCreditMix(),
            recent_inquiries: Math.floor(Math.random() * 5),
            analysis_date: new Date(),
            bureau_source: underwriting.underwriting_data.credit_bureau_preference
        };

        // Calculate credit score impact
        let scoreImpact = 0;
        if (creditAnalysis.cibil_score >= 750) scoreImpact = 25;
        else if (creditAnalysis.cibil_score >= 700) scoreImpact = 15;
        else if (creditAnalysis.cibil_score >= 650) scoreImpact = 5;
        else if (creditAnalysis.cibil_score >= 600) scoreImpact = -10;
        else scoreImpact = -25;

        underwriting.credit_analysis = creditAnalysis;
        underwriting.underwriting_scores.credit_score_impact = scoreImpact;
        
        await underwriting.save();
        await underwriting.addLog(`Credit analysis completed. CIBIL Score: ${creditAnalysis.cibil_score}`, 'system');
    }

    /**
     * Process debt-to-income analysis stage
     */
    async processDebtToIncomeAnalysis(underwriting, loanApplication) {
        underwriting.current_stage = UNDERWRITING_STAGES.DEBT_TO_INCOME_ANALYSIS;
        await underwriting.addLog('Starting debt-to-income analysis', 'system');

        const monthlyIncome = loanApplication.financial_details.monthly_income;
        const existingEMIs = loanApplication.financial_details.existing_emis || 0;
        const proposedEMI = this.calculateEMI(
            loanApplication.loan_details.loan_amount,
            loanApplication.loan_details.tenure_months,
            12 // Assumed interest rate
        );

        const dtiAnalysis = {
            monthly_income: monthlyIncome,
            existing_debt_obligations: existingEMIs,
            proposed_emi: proposedEMI,
            total_debt_obligations: existingEMIs + proposedEMI,
            debt_to_income_ratio: ((existingEMIs + proposedEMI) / monthlyIncome) * 100,
            disposable_income: monthlyIncome - (existingEMIs + proposedEMI),
            analysis_date: new Date()
        };

        // Calculate DTI impact
        let dtiImpact = 0;
        if (dtiAnalysis.debt_to_income_ratio <= 30) dtiImpact = 20;
        else if (dtiAnalysis.debt_to_income_ratio <= 40) dtiImpact = 10;
        else if (dtiAnalysis.debt_to_income_ratio <= 50) dtiImpact = 0;
        else if (dtiAnalysis.debt_to_income_ratio <= 60) dtiImpact = -15;
        else dtiImpact = -30;

        underwriting.dti_analysis = dtiAnalysis;
        underwriting.underwriting_scores.dti_impact = dtiImpact;
        
        await underwriting.save();
        await underwriting.addLog(`DTI analysis completed. DTI Ratio: ${dtiAnalysis.debt_to_income_ratio.toFixed(2)}%`, 'system');
    }

    /**
     * Process collateral assessment stage
     */
    async processCollateralAssessment(underwriting, loanApplication) {
        underwriting.current_stage = UNDERWRITING_STAGES.COLLATERAL_ASSESSMENT;
        await underwriting.addLog('Starting collateral assessment', 'system');

        const loanType = loanApplication.loan_details.loan_type;
        let collateralAssessment = {
            assessment_required: ['home_loan', 'car_loan', 'loan_against_property'].includes(loanType),
            assessment_date: new Date()
        };

        if (collateralAssessment.assessment_required) {
            // Simulate collateral assessment
            const collateralValue = loanApplication.loan_details.loan_amount * (1.2 + Math.random() * 0.5); // 120-170% of loan amount
            
            collateralAssessment = {
                ...collateralAssessment,
                collateral_type: loanType === 'home_loan' ? 'property' : loanType === 'car_loan' ? 'vehicle' : 'property',
                estimated_value: collateralValue,
                loan_to_value_ratio: (loanApplication.loan_details.loan_amount / collateralValue) * 100,
                valuation_method: 'automated_valuation_model',
                market_conditions: 'stable',
                liquidity_assessment: Math.random() > 0.3 ? 'high' : 'medium'
            };
        }

        // Calculate collateral impact
        let collateralImpact = 0;
        if (collateralAssessment.assessment_required) {
            if (collateralAssessment.loan_to_value_ratio <= 70) collateralImpact = 15;
            else if (collateralAssessment.loan_to_value_ratio <= 80) collateralImpact = 10;
            else if (collateralAssessment.loan_to_value_ratio <= 90) collateralImpact = 5;
            else collateralImpact = -5;
        } else {
            collateralImpact = -10; // Unsecured loan penalty
        }

        underwriting.collateral_assessment = collateralAssessment;
        underwriting.underwriting_scores.collateral_impact = collateralImpact;
        
        await underwriting.save();
        await underwriting.addLog('Collateral assessment completed', 'system');
    }

    /**
     * Process KYC verification stage
     */
    async processKYCVerification(underwriting, loanApplication) {
        underwriting.current_stage = 'KYC_VERIFICATION';
        await underwriting.addLog('Starting KYC verification', 'system');

        try {
            // Prepare KYC data for rule engine
            const kycData = {
                personalDetails: loanApplication.personal_details,
                identityDetails: loanApplication.identity_details,
                addressDetails: loanApplication.address_details,
                contactDetails: loanApplication.contact_details,
                employmentDetails: loanApplication.employment_details
            };

            // Run KYC rule engine analysis
            const kycResult = await this.kycRuleEngine.performKYCVerification(kycData);
            
            const kycVerification = {
                kyc_status: kycResult.decision,
                kyc_score: kycResult.score,
                verification_results: kycResult.results,
                passed_rules: kycResult.passedRules,
                failed_rules: kycResult.failedRules,
                warnings: kycResult.warnings,
                flags: kycResult.flags,
                verification_date: new Date()
            };

            // Calculate KYC impact on underwriting score
            let kycImpact = 0;
            if (kycResult.decision === 'APPROVED') kycImpact = 20;
            else if (kycResult.decision === 'CONDITIONAL') kycImpact = 5;
            else kycImpact = -30;

            underwriting.kyc_verification = kycVerification;
            underwriting.underwriting_scores.kyc_impact = kycImpact;
            
            await underwriting.save();
            await underwriting.addLog(`KYC verification completed. Status: ${kycResult.decision}`, 'system');
            
            return kycVerification;
        } catch (error) {
            logger.error('KYC verification failed:', error);
            await underwriting.addLog(`KYC verification failed: ${error.message}`, 'system');
            throw error;
        }
    }

    /**
     * Process risk assessment stage
     */
    async processRiskAssessment(underwriting, loanApplication) {
        underwriting.current_stage = UNDERWRITING_STAGES.RISK_ASSESSMENT;
        await underwriting.addLog('Starting comprehensive risk assessment', 'system');

        try {
            // Prepare risk assessment data for rule engine
            const riskData = {
                personalDetails: loanApplication.personal_details,
                financialDetails: loanApplication.financial_details,
                employmentDetails: loanApplication.employment_details,
                loanDetails: loanApplication.loan_details,
                creditAnalysis: underwriting.credit_analysis,
                dtiAnalysis: underwriting.dti_analysis,
                collateralAssessment: underwriting.collateral_assessment
            };

            // Run Risk Assessment rule engine analysis
            const riskEngineResult = await this.riskAssessmentRuleEngine.performRiskAssessment(riskData);
            
            // Legacy risk factors assessment (for backward compatibility)
            const legacyRiskFactors = {
                employment_stability: this.assessEmploymentStability(loanApplication.employment_details),
                income_stability: this.assessIncomeStability(loanApplication.financial_details),
                geographic_risk: this.assessGeographicRisk(),
                industry_risk: this.assessIndustryRisk(loanApplication.employment_details.company_type),
                loan_purpose_risk: this.assessLoanPurposeRisk(loanApplication.loan_details.loan_purpose),
                behavioral_indicators: this.assessBehavioralIndicators()
            };

            const legacyRiskScore = Object.values(legacyRiskFactors).reduce((sum, score) => sum + score, 0) / Object.keys(legacyRiskFactors).length;
            
            const riskAssessment = {
                // Rule engine results
                rule_engine_decision: riskEngineResult.decision,
                rule_engine_score: riskEngineResult.score,
                rule_engine_results: riskEngineResult.results,
                passed_rules: riskEngineResult.passedRules,
                failed_rules: riskEngineResult.failedRules,
                warnings: riskEngineResult.warnings,
                flags: riskEngineResult.flags,
                risk_grade: riskEngineResult.riskGrade,
                recommended_actions: riskEngineResult.recommendedActions,
                
                // Legacy assessment (for compatibility)
                legacy_risk_factors: legacyRiskFactors,
                legacy_risk_score: legacyRiskScore,
                legacy_risk_category: legacyRiskScore >= 70 ? 'low' : legacyRiskScore >= 50 ? 'medium' : 'high',
                
                // Combined assessment
                overall_risk_score: (riskEngineResult.score + legacyRiskScore) / 2,
                risk_category: riskEngineResult.riskGrade || (legacyRiskScore >= 70 ? 'low' : legacyRiskScore >= 50 ? 'medium' : 'high'),
                mitigation_factors: underwriting.underwriting_data.risk_mitigation_factors,
                assessment_date: new Date()
            };

            // Calculate risk impact based on rule engine decision
            let riskImpact = 0;
            if (riskEngineResult.decision === 'APPROVED') {
                riskImpact = riskAssessment.risk_category === 'low' ? 15 : 10;
            } else if (riskEngineResult.decision === 'CONDITIONAL') {
                riskImpact = 0;
            } else {
                riskImpact = -25;
            }

            underwriting.risk_assessment = riskAssessment;
            underwriting.underwriting_scores.risk_impact = riskImpact;
            
            await underwriting.save();
            await underwriting.addLog(`Risk assessment completed. Decision: ${riskEngineResult.decision}, Risk Category: ${riskAssessment.risk_category}`, 'system');
            
            return riskAssessment;
        } catch (error) {
            logger.error('Risk assessment failed:', error);
            await underwriting.addLog(`Risk assessment failed: ${error.message}`, 'system');
            throw error;
        }
    }

    /**
     * Process automated decision stage
     */
    async processAutomatedDecision(underwriting, loanApplication) {
        underwriting.current_stage = UNDERWRITING_STAGES.AUTOMATED_DECISION;
        await underwriting.addLog('Processing automated underwriting decision', 'system');

        const scores = underwriting.underwriting_scores;
        const totalScore = (scores.kyc_impact || 0) + scores.credit_score_impact + scores.dti_impact + 
                          scores.collateral_impact + scores.risk_impact;

        const automatedDecision = {
            total_underwriting_score: totalScore,
            score_breakdown: scores,
            decision_rules_applied: [
                'kyc_verification_check',
                'minimum_credit_score_check',
                'maximum_dti_ratio_check',
                'collateral_adequacy_check',
                'risk_tolerance_check',
                'rule_engine_compliance_check'
            ],
            automated_recommendation: this.getAutomatedRecommendation(totalScore, underwriting),
            confidence_level: this.calculateConfidenceLevel(totalScore, underwriting),
            decision_date: new Date()
        };

        underwriting.automated_decision = automatedDecision;
        await underwriting.save();
        await underwriting.addLog(`Automated decision: ${automatedDecision.automated_recommendation}`, 'system');
    }

    /**
     * Determine final underwriting result
     */
    determineFinalResult(underwriting) {
        const automatedDecision = underwriting.automated_decision;
        const loanAmount = underwriting.loan_application_id ? 
            underwriting.loan_application_id.loan_details?.loan_amount || 0 : 0;

        let decision = automatedDecision.automated_recommendation;
        let approvedAmount = loanAmount;
        let conditions = [];

        // Adjust based on total score
        const totalScore = automatedDecision.total_underwriting_score;
        
        if (totalScore >= 40) {
            decision = 'approved';
            approvedAmount = loanAmount;
        } else if (totalScore >= 20) {
            decision = 'conditional_approval';
            approvedAmount = Math.floor(loanAmount * 0.8); // 80% of requested amount
            conditions = ['Provide additional income proof', 'Consider co-applicant'];
        } else if (totalScore >= 0) {
            decision = 'conditional_approval';
            approvedAmount = Math.floor(loanAmount * 0.6); // 60% of requested amount
            conditions = ['Provide guarantor', 'Additional collateral required', 'Higher interest rate applicable'];
        } else {
            decision = 'rejected';
            approvedAmount = 0;
            conditions = ['Credit score below minimum threshold', 'DTI ratio too high', 'Insufficient collateral'];
        }

        return {
            decision,
            approved_amount: approvedAmount,
            conditions,
            interest_rate_category: this.determineInterestRateCategory(totalScore),
            validity_period: 30, // days
            decision_date: new Date()
        };
    }

    // Helper methods
    simulateCreditScore() {
        return Math.floor(Math.random() * 300) + 500; // 500-800
    }

    simulatePaymentHistory() {
        const categories = ['excellent', 'good', 'fair', 'poor'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    simulateCreditMix() {
        const mixes = ['diverse', 'moderate', 'limited'];
        return mixes[Math.floor(Math.random() * mixes.length)];
    }

    calculateEMI(principal, tenure, rate) {
        const monthlyRate = rate / (12 * 100);
        return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                         (Math.pow(1 + monthlyRate, tenure) - 1));
    }

    assessEmploymentStability(employmentDetails) {
        const experience = employmentDetails.total_experience || 0;
        if (experience >= 5) return 80;
        if (experience >= 3) return 65;
        if (experience >= 1) return 50;
        return 30;
    }

    assessIncomeStability(financialDetails) {
        const income = financialDetails.monthly_income || 0;
        if (income >= 100000) return 85;
        if (income >= 50000) return 70;
        if (income >= 25000) return 55;
        return 40;
    }

    assessGeographicRisk() {
        return Math.floor(Math.random() * 30) + 60; // 60-90
    }

    assessIndustryRisk(companyType) {
        const riskMap = {
            'government': 90,
            'psu': 85,
            'mnc': 80,
            'private_limited': 70,
            'partnership': 60,
            'proprietorship': 50
        };
        return riskMap[companyType] || 65;
    }

    assessLoanPurposeRisk(purpose) {
        const riskMap = {
            'home_purchase': 85,
            'vehicle_purchase': 80,
            'education': 75,
            'medical_emergency': 70,
            'business_expansion': 60,
            'personal_use': 50
        };
        return riskMap[purpose] || 60;
    }

    assessBehavioralIndicators() {
        return Math.floor(Math.random() * 40) + 50; // 50-90
    }

    getAutomatedRecommendation(totalScore, underwriting) {
        if (totalScore >= 40) return 'approved';
        if (totalScore >= 0) return 'conditional_approval';
        return 'rejected';
    }

    calculateConfidenceLevel(totalScore, underwriting) {
        const baseConfidence = Math.min(90, Math.max(60, 70 + totalScore));
        return Math.round(baseConfidence);
    }

    determineInterestRateCategory(totalScore) {
        if (totalScore >= 50) return 'prime';
        if (totalScore >= 20) return 'standard';
        if (totalScore >= 0) return 'subprime';
        return 'high_risk';
    }

    /**
     * Get underwriting status
     */
    async getUnderwritingStatus(underwritingId) {
        try {
            const underwriting = await UnderwritingModel.findById(underwritingId)
                .populate('loan_application_id', 'loan_details applicant_info')
                .populate('application_processing_id', 'processing_result');

            if (!underwriting) {
                throw new Error('Underwriting record not found');
            }

            return {
                success: true,
                data: {
                    underwriting_id: underwriting._id,
                    status: underwriting.status,
                    current_stage: underwriting.current_stage,
                    progress_percentage: underwriting.getProgressPercentage(),
                    underwriting_result: underwriting.underwriting_result,
                    credit_analysis: underwriting.credit_analysis,
                    dti_analysis: underwriting.dti_analysis,
                    risk_assessment: underwriting.risk_assessment,
                    processing_logs: underwriting.processing_logs.slice(-5) // Last 5 logs
                }
            };
        } catch (error) {
            console.error('Get underwriting status error:', error);
            throw error;
        }
    }
}

module.exports = new UnderwritingService();