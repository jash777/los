const { CREDIT_DECISION_OUTCOMES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');
const pool = require('../../middleware/config/database');
// Models replaced with direct PostgreSQL queries

class CreditDecisionService {
    /**
     * Process credit decision for an underwriting result
     * @param {string} underwritingId - Underwriting ID
     * @param {Object} decisionData - Additional decision data
     * @returns {Object} Processing result
     */
    async processCreditDecision(underwritingId, decisionData = {}) {
        try {
            // Validate underwriting exists and is completed
            const underwriting = await UnderwritingModel.findById(underwritingId)
                .populate('loan_application_id');
            
            if (!underwriting) {
                throw new Error('Underwriting record not found');
            }

            if (underwriting.status !== PHASE_STATUS.COMPLETED) {
                throw new Error('Underwriting must be completed before credit decision');
            }

            // Get loan application data
            const loanApplication = underwriting.loan_application_id;
            if (!loanApplication) {
                throw new Error('Loan application not found');
            }

            // Create credit decision record
            const creditDecision = new CreditDecisionModel({
                underwriting_id: underwritingId,
                loan_application_id: loanApplication._id,
                status: PHASE_STATUS.IN_PROGRESS,
                decision_data: {
                    manual_review_required: decisionData.manual_review_required || false,
                    reviewer_notes: decisionData.reviewer_notes || '',
                    override_reason: decisionData.override_reason || '',
                    additional_conditions: decisionData.additional_conditions || []
                }
            });

            await creditDecision.save();
            await creditDecision.addLog('Credit decision process initiated', 'system');

            // Process decision based on underwriting result
            const finalDecision = await this.makeFinalDecision(creditDecision, underwriting, loanApplication, decisionData);
            
            // Update credit decision with final result
            creditDecision.decision_result = finalDecision;
            creditDecision.status = PHASE_STATUS.COMPLETED;

            await creditDecision.save();
            await creditDecision.addLog(`Credit decision completed: ${finalDecision.final_decision}`, 'system');

            return {
                success: true,
                credit_decision_id: creditDecision._id,
                final_decision: finalDecision.final_decision,
                approved_amount: finalDecision.approved_loan_amount,
                interest_rate: finalDecision.interest_rate,
                tenure: finalDecision.approved_tenure,
                conditions: finalDecision.loan_conditions,
                next_phase: finalDecision.final_decision === CREDIT_DECISION_OUTCOMES.APPROVED ? 'quality-check' : null
            };

        } catch (error) {
            console.error('Credit decision processing error:', error);
            throw error;
        }
    }

    /**
     * Make final credit decision based on underwriting and additional factors
     */
    async makeFinalDecision(creditDecision, underwriting, loanApplication, decisionData) {
        await creditDecision.addLog('Analyzing underwriting results for final decision', 'system');

        const underwritingResult = underwriting.underwriting_result;
        const loanDetails = loanApplication.loan_details;
        const applicantInfo = loanApplication.applicant_info;

        // Base decision from underwriting
        let finalDecision = underwritingResult.decision;
        let approvedAmount = underwritingResult.approved_amount;
        let conditions = [...underwritingResult.conditions];
        
        // Determine interest rate based on underwriting score and risk factors
        const interestRate = this.calculateInterestRate(
            underwriting.automated_decision.total_underwriting_score,
            underwriting.credit_analysis.cibil_score,
            underwriting.risk_assessment.risk_category,
            loanDetails.loan_type
        );

        // Determine tenure (can be adjusted based on risk)
        let approvedTenure = loanDetails.tenure_months;
        if (underwriting.risk_assessment.risk_category === 'high') {
            approvedTenure = Math.min(approvedTenure, 60); // Max 5 years for high risk
        }

        // Apply business rules and policy checks
        const policyCheck = this.applyPolicyRules(underwriting, loanApplication);
        if (!policyCheck.passed) {
            finalDecision = CREDIT_DECISION_OUTCOMES.REJECTED;
            conditions = [...conditions, ...policyCheck.reasons];
            approvedAmount = 0;
        }

        // Handle manual review cases
        if (decisionData.manual_review_required) {
            await creditDecision.addLog('Manual review initiated', 'system');
            
            if (decisionData.override_reason) {
                // Manual override applied
                finalDecision = decisionData.manual_decision || finalDecision;
                if (decisionData.manual_approved_amount) {
                    approvedAmount = decisionData.manual_approved_amount;
                }
                conditions.push(`Manual override: ${decisionData.override_reason}`);
            }
        }

        // Add additional conditions if any
        if (decisionData.additional_conditions && decisionData.additional_conditions.length > 0) {
            conditions = [...conditions, ...decisionData.additional_conditions];
        }

        // Calculate EMI for approved cases
        let monthlyEMI = 0;
        if (finalDecision === CREDIT_DECISION_OUTCOMES.APPROVED || 
            finalDecision === CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL) {
            monthlyEMI = this.calculateEMI(approvedAmount, approvedTenure, interestRate);
        }

        // Determine validity period
        const validityPeriod = this.getValidityPeriod(finalDecision, underwriting.risk_assessment.risk_category);

        const result = {
            final_decision: finalDecision,
            approved_loan_amount: approvedAmount,
            interest_rate: interestRate,
            approved_tenure: approvedTenure,
            monthly_emi: monthlyEMI,
            loan_conditions: conditions,
            validity_period: validityPeriod,
            decision_factors: {
                underwriting_score: underwriting.automated_decision.total_underwriting_score,
                credit_score: underwriting.credit_analysis.cibil_score,
                dti_ratio: underwriting.dti_analysis.debt_to_income_ratio,
                risk_category: underwriting.risk_assessment.risk_category,
                collateral_ltv: underwriting.collateral_assessment?.loan_to_value_ratio,
                policy_compliance: policyCheck.passed
            },
            processing_summary: {
                total_processing_time: this.calculateProcessingTime(loanApplication.created_at),
                automated_decision: !decisionData.manual_review_required,
                manual_override_applied: !!decisionData.override_reason,
                conditions_count: conditions.length
            },
            decision_date: new Date()
        };

        await creditDecision.addLog(`Final decision determined: ${finalDecision}`, 'system');
        return result;
    }

    /**
     * Calculate interest rate based on risk factors
     */
    calculateInterestRate(underwritingScore, creditScore, riskCategory, loanType) {
        // Base rates by loan type
        const baseRates = {
            'personal_loan': 12.0,
            'home_loan': 8.5,
            'car_loan': 9.5,
            'education_loan': 10.0,
            'business_loan': 14.0,
            'loan_against_property': 11.0
        };

        let baseRate = baseRates[loanType] || 12.0;

        // Adjust based on credit score
        if (creditScore >= 750) baseRate -= 1.5;
        else if (creditScore >= 700) baseRate -= 1.0;
        else if (creditScore >= 650) baseRate -= 0.5;
        else if (creditScore < 600) baseRate += 2.0;

        // Adjust based on underwriting score
        if (underwritingScore >= 50) baseRate -= 0.5;
        else if (underwritingScore >= 20) baseRate += 0;
        else if (underwritingScore >= 0) baseRate += 1.0;
        else baseRate += 2.5;

        // Adjust based on risk category
        if (riskCategory === 'low') baseRate -= 0.5;
        else if (riskCategory === 'high') baseRate += 1.5;

        // Ensure rate is within reasonable bounds
        return Math.max(8.0, Math.min(25.0, Math.round(baseRate * 100) / 100));
    }

    /**
     * Apply policy rules and compliance checks
     */
    applyPolicyRules(underwriting, loanApplication) {
        const reasons = [];
        let passed = true;

        // Minimum credit score policy
        const minCreditScore = this.getMinCreditScore(loanApplication.loan_details.loan_type);
        if (underwriting.credit_analysis.cibil_score < minCreditScore) {
            passed = false;
            reasons.push(`Credit score ${underwriting.credit_analysis.cibil_score} below minimum required ${minCreditScore}`);
        }

        // Maximum DTI ratio policy
        const maxDTI = 60; // 60% maximum DTI
        if (underwriting.dti_analysis.debt_to_income_ratio > maxDTI) {
            passed = false;
            reasons.push(`DTI ratio ${underwriting.dti_analysis.debt_to_income_ratio.toFixed(2)}% exceeds maximum ${maxDTI}%`);
        }

        // Minimum income policy
        const minIncome = this.getMinIncome(loanApplication.loan_details.loan_type, loanApplication.loan_details.loan_amount);
        if (loanApplication.financial_details.monthly_income < minIncome) {
            passed = false;
            reasons.push(`Monthly income ₹${loanApplication.financial_details.monthly_income} below minimum required ₹${minIncome}`);
        }

        // Age restrictions
        const age = this.calculateAge(loanApplication.applicant_info.date_of_birth);
        if (age < 21 || age > 65) {
            passed = false;
            reasons.push(`Applicant age ${age} outside acceptable range (21-65 years)`);
        }

        // Loan amount limits
        const maxLoanAmount = this.getMaxLoanAmount(loanApplication.loan_details.loan_type, loanApplication.financial_details.monthly_income);
        if (loanApplication.loan_details.loan_amount > maxLoanAmount) {
            passed = false;
            reasons.push(`Loan amount ₹${loanApplication.loan_details.loan_amount} exceeds maximum ₹${maxLoanAmount}`);
        }

        return { passed, reasons };
    }

    /**
     * Calculate EMI
     */
    calculateEMI(principal, tenure, rate) {
        const monthlyRate = rate / (12 * 100);
        return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                         (Math.pow(1 + monthlyRate, tenure) - 1));
    }

    /**
     * Get validity period based on decision and risk
     */
    getValidityPeriod(decision, riskCategory) {
        if (decision === CREDIT_DECISION_OUTCOMES.APPROVED) {
            return riskCategory === 'low' ? 45 : 30; // days
        }
        if (decision === CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL) {
            return 30; // days
        }
        return 0; // No validity for rejected applications
    }

    /**
     * Calculate total processing time
     */
    calculateProcessingTime(startDate) {
        const now = new Date();
        const diffMs = now - new Date(startDate);
        return Math.round(diffMs / (1000 * 60)); // minutes
    }

    // Helper methods
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

    getMinIncome(loanType, loanAmount) {
        const baseMinIncome = {
            'personal_loan': 25000,
            'home_loan': 40000,
            'car_loan': 30000,
            'education_loan': 20000,
            'business_loan': 50000,
            'loan_against_property': 35000
        };
        
        let minIncome = baseMinIncome[loanType] || 25000;
        
        // Adjust based on loan amount
        if (loanAmount > 1000000) minIncome *= 1.5; // 15L+
        else if (loanAmount > 500000) minIncome *= 1.2; // 5L+
        
        return Math.round(minIncome);
    }

    getMaxLoanAmount(loanType, monthlyIncome) {
        const multipliers = {
            'personal_loan': 60, // 60x monthly income
            'home_loan': 120, // 120x monthly income
            'car_loan': 80, // 80x monthly income
            'education_loan': 100, // 100x monthly income
            'business_loan': 80, // 80x monthly income
            'loan_against_property': 100 // 100x monthly income
        };
        
        const multiplier = multipliers[loanType] || 60;
        return monthlyIncome * multiplier;
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

    /**
     * Get credit decision status
     */
    async getCreditDecisionStatus(creditDecisionId) {
        try {
            const creditDecision = await CreditDecisionModel.findById(creditDecisionId)
                .populate('loan_application_id', 'loan_details applicant_info')
                .populate('underwriting_id', 'underwriting_result automated_decision');

            if (!creditDecision) {
                throw new Error('Credit decision record not found');
            }

            return {
                success: true,
                data: {
                    credit_decision_id: creditDecision._id,
                    status: creditDecision.status,
                    decision_result: creditDecision.decision_result,
                    processing_logs: creditDecision.processing_logs.slice(-5), // Last 5 logs
                    loan_application: creditDecision.loan_application_id,
                    underwriting_summary: creditDecision.underwriting_id
                }
            };
        } catch (error) {
            console.error('Get credit decision status error:', error);
            throw error;
        }
    }

    /**
     * Get decision letter/document
     */
    async getDecisionLetter(creditDecisionId) {
        try {
            const creditDecision = await CreditDecisionModel.findById(creditDecisionId)
                .populate('loan_application_id')
                .populate('underwriting_id');

            if (!creditDecision) {
                throw new Error('Credit decision record not found');
            }

            const decisionResult = creditDecision.decision_result;
            const loanApplication = creditDecision.loan_application_id;

            const letter = {
                letter_type: 'credit_decision',
                decision: decisionResult.final_decision,
                applicant_name: loanApplication.applicant_info.full_name,
                application_id: loanApplication._id,
                decision_date: decisionResult.decision_date,
                loan_details: {
                    requested_amount: loanApplication.loan_details.loan_amount,
                    approved_amount: decisionResult.approved_loan_amount,
                    interest_rate: decisionResult.interest_rate,
                    tenure: decisionResult.approved_tenure,
                    monthly_emi: decisionResult.monthly_emi
                },
                conditions: decisionResult.loan_conditions,
                validity_period: decisionResult.validity_period,
                next_steps: this.getNextSteps(decisionResult.final_decision)
            };

            return {
                success: true,
                data: letter
            };
        } catch (error) {
            console.error('Get decision letter error:', error);
            throw error;
        }
    }

    getNextSteps(decision) {
        switch (decision) {
            case CREDIT_DECISION_OUTCOMES.APPROVED:
                return [
                    'Quality check will be initiated automatically',
                    'Loan agreement will be prepared',
                    'You will be contacted for document signing',
                    'Loan disbursement will follow after completion'
                ];
            case CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL:
                return [
                    'Please fulfill the mentioned conditions',
                    'Submit required additional documents',
                    'Contact our loan officer for assistance',
                    'Re-evaluation will be done upon condition fulfillment'
                ];
            case CREDIT_DECISION_OUTCOMES.REJECTED:
                return [
                    'You may reapply after 6 months',
                    'Work on improving your credit score',
                    'Consider reducing the loan amount',
                    'Contact our customer service for guidance'
                ];
            default:
                return [];
        }
    }
}

module.exports = new CreditDecisionService();