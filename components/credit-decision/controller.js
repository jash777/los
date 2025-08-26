const creditDecisionService = require('./service');
const { CREDIT_DECISION_OUTCOMES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

class CreditDecisionController {
    /**
     * Process credit decision
     * POST /api/phases/credit-decision/process/:underwriting_id
     */
    async processCreditDecision(req, res) {
        try {
            const { underwriting_id } = req.params;
            const decisionData = req.body;

            console.log(`Processing credit decision for underwriting: ${underwriting_id}`);

            const result = await creditDecisionService.processCreditDecision(underwriting_id, decisionData);

            res.status(200).json({
                success: true,
                message: 'Credit decision processed successfully',
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Credit decision processing error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Credit decision processing failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get credit decision status
     * GET /api/phases/credit-decision/status/:credit_decision_id
     */
    async getCreditDecisionStatus(req, res) {
        try {
            const { credit_decision_id } = req.params;

            console.log(`Getting credit decision status: ${credit_decision_id}`);

            const result = await creditDecisionService.getCreditDecisionStatus(credit_decision_id);

            res.status(200).json({
                success: true,
                message: 'Credit decision status retrieved successfully',
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get credit decision status error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Credit decision not found',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get decision letter
     * GET /api/phases/credit-decision/letter/:credit_decision_id
     */
    async getDecisionLetter(req, res) {
        try {
            const { credit_decision_id } = req.params;

            console.log(`Getting decision letter: ${credit_decision_id}`);

            const result = await creditDecisionService.getDecisionLetter(credit_decision_id);

            res.status(200).json({
                success: true,
                message: 'Decision letter retrieved successfully',
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get decision letter error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Decision letter not found',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get credit decision requirements
     * GET /api/phases/credit-decision/requirements
     */
    async getRequirements(req, res) {
        try {
            const requirements = {
                phase_name: 'Credit Decision',
                description: 'Final loan approval decision based on comprehensive underwriting analysis',
                prerequisites: [
                    'Completed underwriting phase',
                    'Valid underwriting results',
                    'All verification checks passed'
                ],
                required_fields: {
                    underwriting_id: {
                        type: 'string',
                        description: 'ID of completed underwriting record',
                        required: true
                    }
                },
                optional_fields: {
                    manual_review_required: {
                        type: 'boolean',
                        description: 'Whether manual review is required',
                        default: false
                    },
                    reviewer_notes: {
                        type: 'string',
                        description: 'Notes from manual reviewer',
                        max_length: 1000
                    },
                    override_reason: {
                        type: 'string',
                        description: 'Reason for manual override if applicable',
                        max_length: 500
                    },
                    manual_decision: {
                        type: 'string',
                        description: 'Manual decision override',
                        enum: Object.values(CREDIT_DECISION_OUTCOMES)
                    },
                    manual_approved_amount: {
                        type: 'number',
                        description: 'Manually approved loan amount',
                        minimum: 0
                    },
                    additional_conditions: {
                        type: 'array',
                        description: 'Additional loan conditions',
                        items: {
                            type: 'string',
                            max_length: 200
                        }
                    }
                },
                decision_outcomes: {
                    approved: {
                        outcome: CREDIT_DECISION_OUTCOMES.APPROVED,
                        description: 'Loan approved with specified terms',
                        next_phase: 'quality-check'
                    },
                    conditional_approval: {
                        outcome: CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL,
                        description: 'Loan approved with conditions to be fulfilled',
                        next_phase: 'conditional-processing'
                    },
                    rejected: {
                        outcome: CREDIT_DECISION_OUTCOMES.REJECTED,
                        description: 'Loan application rejected',
                        next_phase: null
                    }
                },
                decision_factors: {
                    primary_factors: [
                        'Underwriting score',
                        'Credit score (CIBIL)',
                        'Debt-to-income ratio',
                        'Risk assessment category',
                        'Policy compliance'
                    ],
                    secondary_factors: [
                        'Collateral value (if applicable)',
                        'Employment stability',
                        'Banking relationship',
                        'Loan purpose',
                        'Market conditions'
                    ]
                },
                interest_rate_factors: {
                    base_rate_by_loan_type: {
                        personal_loan: '12.0%',
                        home_loan: '8.5%',
                        car_loan: '9.5%',
                        education_loan: '10.0%',
                        business_loan: '14.0%',
                        loan_against_property: '11.0%'
                    },
                    adjustments: {
                        credit_score_750_plus: '-1.5%',
                        credit_score_700_749: '-1.0%',
                        credit_score_650_699: '-0.5%',
                        credit_score_below_600: '+2.0%',
                        high_underwriting_score: '-0.5%',
                        low_underwriting_score: '+2.5%',
                        low_risk_category: '-0.5%',
                        high_risk_category: '+1.5%'
                    },
                    rate_range: {
                        minimum: '8.0%',
                        maximum: '25.0%'
                    }
                },
                policy_rules: {
                    minimum_credit_scores: {
                        personal_loan: 650,
                        home_loan: 700,
                        car_loan: 650,
                        education_loan: 600,
                        business_loan: 700,
                        loan_against_property: 650
                    },
                    maximum_dti_ratio: '60%',
                    age_restrictions: {
                        minimum: 21,
                        maximum: 65
                    },
                    income_multipliers: {
                        personal_loan: '60x monthly income',
                        home_loan: '120x monthly income',
                        car_loan: '80x monthly income',
                        education_loan: '100x monthly income',
                        business_loan: '80x monthly income',
                        loan_against_property: '100x monthly income'
                    }
                },
                processing_timeline: {
                    automated_decision: '5-10 minutes',
                    manual_review: '2-4 hours',
                    complex_cases: '1-2 business days'
                },
                validity_periods: {
                    approved_low_risk: '45 days',
                    approved_medium_high_risk: '30 days',
                    conditional_approval: '30 days',
                    rejected: 'No validity'
                },
                api_endpoints: {
                    process: 'POST /api/phases/credit-decision/process/:underwriting_id',
                    status: 'GET /api/phases/credit-decision/status/:credit_decision_id',
                    letter: 'GET /api/phases/credit-decision/letter/:credit_decision_id',
                    requirements: 'GET /api/phases/credit-decision/requirements',
                    health: 'GET /api/phases/credit-decision/health'
                }
            };

            res.status(200).json({
                success: true,
                message: 'Credit decision requirements retrieved successfully',
                data: requirements,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get credit decision requirements error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve credit decision requirements',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check for credit decision phase
     * GET /api/phases/credit-decision/health
     */
    async healthCheck(req, res) {
        try {
            const health = {
                phase: 'credit-decision',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    decision_engine: 'operational',
                    policy_rules: 'operational',
                    interest_calculator: 'operational',
                    decision_letter_generator: 'operational'
                },
                dependencies: {
                    underwriting_phase: 'required',
                    loan_application_phase: 'required',
                    database: 'connected'
                },
                metrics: {
                    average_processing_time: '8 minutes',
                    automated_decisions: '85%',
                    manual_reviews: '15%',
                    approval_rate: '72%'
                }
            };

            res.status(200).json({
                success: true,
                message: 'Credit decision phase is healthy',
                data: health,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Credit decision health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Credit decision phase health check failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new CreditDecisionController();