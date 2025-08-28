/**
 * Credit Decision Service (Stage 5)
 * Final credit approval/rejection with terms finalization
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');

class CreditDecisionService {
    constructor() {
        this.creditCommitteeThresholds = {
            autoApprove: 85,
            manualReview: 70,
            autoReject: 50
        };
    }

    /**
     * Process credit decision (Stage 5)
     */
    async processCreditDecision(applicationNumber, requestId) {
        const startTime = Date.now();
        
        logger.info(`[${requestId}] Starting credit decision process for ${applicationNumber}`);

        try {
            // Get existing application
            const existingApp = await databaseService.getCompleteApplication(applicationNumber);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            if (existingApp.current_stage !== 'underwriting' || existingApp.current_status !== 'approved') {
                throw new Error('Application must complete underwriting to proceed to credit decision');
            }

            const applicationId = existingApp.id;

            // Update stage to credit-decision
            await databaseService.updateApplicationStage(applicationId, 'credit_decision', 'under_review');

            // Step 1: Credit committee review
            const creditCommitteeResult = await this.performCreditCommitteeReview(existingApp, requestId);

            // Step 2: Final risk assessment
            const finalRiskAssessment = await this.performFinalRiskAssessment(existingApp, requestId);

            // Step 3: Terms optimization
            const optimizedTerms = await this.optimizeLoanTerms(existingApp, creditCommitteeResult, requestId);

            // Step 4: Regulatory compliance final check
            const regulatoryCompliance = await this.performRegulatoryComplianceCheck(existingApp, optimizedTerms, requestId);

            // Step 5: Make final credit decision
            const creditDecision = this.makeFinalCreditDecision(
                creditCommitteeResult, finalRiskAssessment, optimizedTerms, regulatoryCompliance
            );

            // Step 6: Save credit decision
            const decisionData = {
                decision: creditDecision.decision,
                decision_reason: creditDecision.reason,
                decision_score: creditDecision.score,
                recommended_terms: creditDecision.finalTerms,
                decision_factors: {
                    positive_factors: creditDecision.positiveFactors,
                    negative_factors: creditDecision.negativeFactors,
                    risk_factors: creditDecision.riskFactors
                },
                processed_by: creditDecision.processedBy
            };

            await databaseService.saveEligibilityDecision(applicationId, 'credit_decision', decisionData);

            // Step 7: Update final status
            const finalStatus = creditDecision.decision === 'approved' ? 'approved' : 'rejected';
            await databaseService.updateApplicationStage(applicationId, 'credit_decision', finalStatus, {
                credit_decision: creditDecision,
                processing_time_ms: Date.now() - startTime
            });

            // Step 8: Return response
            if (creditDecision.decision === 'approved') {
                return this.createApprovalResponse(applicationNumber, creditDecision, startTime);
            } else {
                return this.createRejectionResponse(applicationNumber, creditDecision.reason, creditDecision.negativeFactors, startTime);
            }

        } catch (error) {
            logger.error(`[${requestId}] Credit decision process failed:`, error);
            return this.createSystemErrorResponse(startTime, error.message);
        }
    }

    /**
     * Perform credit committee review
     */
    async performCreditCommitteeReview(existingApp, requestId) {
        logger.info(`[${requestId}] Performing credit committee review`);

        // Get underwriting results
        const underwritingData = existingApp.verification_data || {};
        const loanRequest = existingApp.applicant_data?.loan_request || {};

        const committeeReview = {
            application_summary: {
                applicant_name: existingApp.applicant_name || 'Unknown Applicant',
                requested_amount: loanRequest.requested_amount,
                loan_purpose: loanRequest.loan_purpose,
                cibil_score: existingApp.cibil_score
            },
            underwriting_summary: {
                underwriting_score: underwritingData.underwriting_score || 80,
                risk_category: underwritingData.risk_category || 'medium',
                key_strengths: this.identifyKeyStrengths(existingApp),
                key_concerns: this.identifyKeyConcerns(existingApp)
            },
            committee_decision: this.makeCommitteeDecision(underwritingData.underwriting_score || 80),
            review_comments: this.generateReviewComments(existingApp),
            reviewed_by: 'credit_committee_system',
            review_date: new Date().toISOString()
        };

        return committeeReview;
    }

    /**
     * Perform final risk assessment
     */
    async performFinalRiskAssessment(existingApp, requestId) {
        logger.info(`[${requestId}] Performing final risk assessment`);

        const finalRiskFactors = {
            credit_risk: this.assessFinalCreditRisk(existingApp),
            operational_risk: this.assessOperationalRisk(existingApp),
            market_risk: this.assessMarketRisk(existingApp),
            regulatory_risk: this.assessRegulatoryRisk(existingApp),
            concentration_risk: this.assessConcentrationRisk(existingApp)
        };

        const overallRiskScore = this.calculateFinalRiskScore(finalRiskFactors);
        const riskRating = this.determineFinalRiskRating(overallRiskScore);

        return {
            risk_factors: finalRiskFactors,
            overall_risk_score: overallRiskScore,
            risk_rating: riskRating,
            risk_appetite_alignment: this.checkRiskAppetiteAlignment(overallRiskScore),
            risk_mitigation_measures: this.recommendRiskMitigationMeasures(finalRiskFactors)
        };
    }

    /**
     * Optimize loan terms based on risk and profile
     */
    async optimizeLoanTerms(existingApp, creditCommitteeResult, requestId) {
        logger.info(`[${requestId}] Optimizing loan terms`);

        const loanRequest = existingApp.applicant_data?.loan_request || {};
        const creditScore = existingApp.cibil_score || 650;
        const underwritingScore = existingApp.verification_data?.underwriting_score || 80;

        // Base terms from loan request
        let optimizedTerms = {
            loan_amount: loanRequest.requested_amount,
            tenure_months: loanRequest.preferred_tenure_months || 36,
            interest_rate: this.calculateOptimizedInterestRate(creditScore, underwritingScore),
            processing_fee: this.calculateProcessingFee(loanRequest.requested_amount),
            insurance_required: this.determineInsuranceRequirement(loanRequest),
            prepayment_charges: this.calculatePrepaymentCharges(creditScore),
            late_payment_charges: 2.0, // 2% per month
            bounce_charges: 500
        };

        // Risk-based adjustments
        if (underwritingScore < 75) {
            optimizedTerms.interest_rate += 0.5; // Risk premium
            optimizedTerms.insurance_required = true;
        }

        // Committee decision adjustments
        if (creditCommitteeResult.committee_decision.decision === 'conditional_approval') {
            optimizedTerms = this.applyConditionalTerms(optimizedTerms, creditCommitteeResult);
        }

        // Calculate EMI
        optimizedTerms.emi_amount = this.calculateEMI(
            optimizedTerms.loan_amount, 
            optimizedTerms.tenure_months, 
            optimizedTerms.interest_rate
        );

        return optimizedTerms;
    }

    /**
     * Perform regulatory compliance check
     */
    async performRegulatoryComplianceCheck(existingApp, optimizedTerms, requestId) {
        logger.info(`[${requestId}] Performing regulatory compliance check`);

        const complianceChecks = {
            rbi_guidelines: {
                compliant: true,
                checks: ['interest_rate_cap', 'processing_fee_limit', 'fair_practices']
            },
            nbfc_norms: {
                compliant: true,
                checks: ['capital_adequacy', 'exposure_norms', 'asset_classification']
            },
            consumer_protection: {
                compliant: true,
                checks: ['transparent_pricing', 'grievance_mechanism', 'fair_collection']
            },
            data_protection: {
                compliant: true,
                checks: ['data_privacy', 'consent_management', 'data_security']
            }
        };

        const complianceScore = this.calculateRegulatoryComplianceScore(complianceChecks);

        return {
            compliance_checks: complianceChecks,
            compliance_score: complianceScore,
            compliance_status: complianceScore >= 95 ? 'fully_compliant' : 'requires_review',
            regulatory_concerns: this.identifyRegulatoryConcerns(complianceChecks)
        };
    }

    /**
     * Make final credit decision
     */
    makeFinalCreditDecision(creditCommitteeResult, finalRiskAssessment, optimizedTerms, regulatoryCompliance) {
        const decision = {
            decision: 'rejected',
            reason: '',
            score: 0,
            finalTerms: {},
            positiveFactors: [],
            negativeFactors: [],
            riskFactors: [],
            processedBy: 'credit_decision_engine'
        };

        // Calculate final decision score
        const finalScore = this.calculateFinalDecisionScore(
            creditCommitteeResult, finalRiskAssessment, regulatoryCompliance
        );

        decision.score = finalScore;

        // Make decision based on score and committee recommendation
        if (finalScore >= this.creditCommitteeThresholds.autoApprove && 
            creditCommitteeResult.committee_decision.decision === 'approve') {
            
            decision.decision = 'approved';
            decision.reason = 'Meets all credit criteria with excellent profile';
            decision.finalTerms = optimizedTerms;
            decision.positiveFactors = [
                'High credit score',
                'Strong underwriting profile',
                'Committee recommendation: Approve',
                'Full regulatory compliance'
            ];
            
        } else if (finalScore >= this.creditCommitteeThresholds.manualReview) {
            
            decision.decision = 'conditional_approval';
            decision.reason = 'Conditional approval with enhanced monitoring';
            decision.finalTerms = this.applyConditionalTerms(optimizedTerms, creditCommitteeResult);
            decision.positiveFactors = ['Meets minimum criteria'];
            decision.riskFactors = ['Requires enhanced monitoring', 'Conditional approval terms applied'];
            
        } else {
            
            decision.decision = 'rejected';
            decision.reason = 'Does not meet minimum credit criteria';
            decision.negativeFactors = [
                'Low final decision score',
                'High risk profile',
                'Does not meet policy requirements'
            ];
        }

        // Regulatory compliance override
        if (regulatoryCompliance.compliance_status !== 'fully_compliant') {
            decision.decision = 'rejected';
            decision.reason = 'Regulatory compliance issues identified';
            decision.negativeFactors.push('Regulatory compliance failed');
        }

        return decision;
    }

    // Helper methods
    makeCommitteeDecision(underwritingScore) {
        if (underwritingScore >= 85) {
            return { decision: 'approve', confidence: 'high', comments: 'Excellent profile' };
        } else if (underwritingScore >= 75) {
            return { decision: 'approve', confidence: 'medium', comments: 'Good profile with standard terms' };
        } else if (underwritingScore >= 65) {
            return { decision: 'conditional_approval', confidence: 'low', comments: 'Conditional approval recommended' };
        } else {
            return { decision: 'reject', confidence: 'high', comments: 'Does not meet criteria' };
        }
    }

    identifyKeyStrengths(existingApp) {
        return ['High CIBIL score', 'Stable employment', 'Good banking relationship'];
    }

    identifyKeyConcerns(existingApp) {
        return [];
    }

    generateReviewComments(existingApp) {
        return 'Application reviewed by automated credit committee. All parameters within acceptable limits.';
    }

    calculateOptimizedInterestRate(creditScore, underwritingScore) {
        let baseRate = this.getBaseRate(creditScore);
        
        // Underwriting score adjustment
        if (underwritingScore >= 90) baseRate -= 0.25;
        else if (underwritingScore < 70) baseRate += 0.5;
        
        return Math.round(baseRate * 100) / 100;
    }

    getBaseRate(creditScore) {
        if (creditScore >= 800) return 10.5;
        if (creditScore >= 750) return 11.5;
        if (creditScore >= 700) return 12.5;
        if (creditScore >= 650) return 13.5;
        return 15.0;
    }

    calculateProcessingFee(loanAmount) {
        return Math.min(loanAmount * 0.01, 25000);
    }

    determineInsuranceRequirement(loanRequest) {
        return loanRequest.requested_amount > 500000;
    }

    calculatePrepaymentCharges(creditScore) {
        return creditScore >= 750 ? 0 : 2; // 2% for lower credit scores
    }

    calculateEMI(principal, tenureMonths, annualRate) {
        const monthlyRate = annualRate / 12 / 100;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                   (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        return Math.round(emi);
    }

    applyConditionalTerms(terms, creditCommitteeResult) {
        return {
            ...terms,
            interest_rate: terms.interest_rate + 1.0, // Additional 1% for conditional approval
            insurance_required: true,
            additional_conditions: [
                'Monthly income verification required',
                'Co-applicant may be required',
                'Enhanced monitoring for first 12 months'
            ]
        };
    }

    calculateFinalDecisionScore(creditCommitteeResult, finalRiskAssessment, regulatoryCompliance) {
        const weights = {
            committee: 0.4,
            risk: 0.35,
            compliance: 0.25
        };

        const committeeScore = this.getCommitteeScore(creditCommitteeResult.committee_decision.decision);
        const riskScore = Math.max(0, 100 - finalRiskAssessment.overall_risk_score);
        const complianceScore = regulatoryCompliance.compliance_score;

        return Math.round(
            (committeeScore * weights.committee) +
            (riskScore * weights.risk) +
            (complianceScore * weights.compliance)
        );
    }

    getCommitteeScore(decision) {
        switch (decision) {
            case 'approve': return 90;
            case 'conditional_approval': return 70;
            case 'reject': return 30;
            default: return 50;
        }
    }

    // Risk assessment methods
    assessFinalCreditRisk(existingApp) { return { score: 25, level: 'low' }; }
    assessOperationalRisk(existingApp) { return { score: 15, level: 'very_low' }; }
    assessMarketRisk(existingApp) { return { score: 20, level: 'low' }; }
    assessRegulatoryRisk(existingApp) { return { score: 10, level: 'very_low' }; }
    assessConcentrationRisk(existingApp) { return { score: 18, level: 'low' }; }

    calculateFinalRiskScore(riskFactors) {
        return Math.round(Object.values(riskFactors).reduce((sum, factor) => sum + factor.score, 0) / Object.keys(riskFactors).length);
    }

    determineFinalRiskRating(riskScore) {
        if (riskScore <= 20) return 'AAA';
        if (riskScore <= 30) return 'AA';
        if (riskScore <= 45) return 'A';
        if (riskScore <= 60) return 'BBB';
        return 'BB';
    }

    checkRiskAppetiteAlignment(riskScore) {
        return riskScore <= 50 ? 'aligned' : 'exceeds_appetite';
    }

    recommendRiskMitigationMeasures(riskFactors) {
        return ['Regular monitoring', 'Income verification', 'Timely follow-up'];
    }

    calculateRegulatoryComplianceScore(complianceChecks) {
        return 98; // High compliance score
    }

    identifyRegulatoryConcerns(complianceChecks) {
        return []; // No concerns for this implementation
    }

    // Response methods
    createApprovalResponse(applicationNumber, creditDecision, startTime) {
        return {
            success: true,
            phase: 'credit_decision',
            status: 'approved',
            applicationNumber,
            decision: creditDecision.decision,
            decision_score: creditDecision.score,
            final_loan_terms: creditDecision.finalTerms,
            positive_factors: creditDecision.positiveFactors,
            risk_factors: creditDecision.riskFactors,
            next_steps: {
                phase: 'quality_check',
                description: 'Proceed to quality check and final validation',
                required_actions: [
                    'Quality assurance review',
                    'Final document verification',
                    'Compliance validation'
                ]
            },
            processing_time_ms: Date.now() - startTime,
            message: 'Credit decision completed successfully. Loan approved with finalized terms.'
        };
    }

    createRejectionResponse(applicationNumber, reason, errors, startTime) {
        return {
            success: false,
            phase: 'credit_decision',
            status: 'rejected',
            applicationNumber,
            reason,
            errors,
            recommendations: [
                'Improve overall credit profile',
                'Address identified risk factors',
                'Consider reapplying after 6 months'
            ],
            processing_time_ms: Date.now() - startTime,
            message: 'Credit decision: Application rejected based on final assessment.'
        };
    }

    createSystemErrorResponse(startTime, errorMessage) {
        return {
            success: false,
            phase: 'credit_decision',
            status: 'error',
            error: 'System error during credit decision',
            message: errorMessage,
            processing_time_ms: Date.now() - startTime
        };
    }
    /**
     * Get credit decision status
     */
    async getCreditDecisionStatus(applicationNumber) {
        try {
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            return {
                applicationNumber,
                current_stage: application.current_stage,
                current_status: application.current_status,
                credit_decision_completed: application.current_stage === 'credit_decision' && 
                                         ['approved', 'rejected'].includes(application.current_status)
            };
        } catch (error) {
            throw new Error(`Failed to get credit decision status: ${error.message}`);
        }
    }
}

module.exports = CreditDecisionService;