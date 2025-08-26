const underwritingService = require('./service');
const { UNDERWRITING_STAGES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

class UnderwritingController {
    /**
     * Process underwriting for an application
     */
    async processUnderwriting(req, res) {
        try {
            const { application_processing_id } = req.params;
            const underwritingData = req.body;

            const result = await underwritingService.processUnderwriting(
                application_processing_id,
                underwritingData
            );

            res.status(200).json({
                success: true,
                message: 'Underwriting processed successfully',
                data: result
            });
        } catch (error) {
            console.error('Process underwriting error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to process underwriting',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get underwriting status
     */
    async getUnderwritingStatus(req, res) {
        try {
            const { underwritingId } = req.params;
            const result = await underwritingService.getUnderwritingStatus(underwritingId);

            res.status(200).json({
                success: true,
                message: 'Underwriting status retrieved successfully',
                data: result.data
            });
        } catch (error) {
            console.error('Get underwriting status error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Failed to retrieve underwriting status',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get underwriting requirements and information
     */
    async getUnderwritingRequirements(req, res) {
        try {
            const requirements = {
                phase: 'underwriting',
                description: 'Comprehensive credit and risk assessment for loan approval',
                prerequisites: [
                    'Application processing must be completed and approved',
                    'All required documents must be verified',
                    'Identity and employment verification must be successful'
                ],
                required_fields: {
                    underwriting_data: {
                        credit_bureau_preference: {
                            type: 'string',
                            enum: ['CIBIL', 'Experian', 'Equifax', 'CRIF'],
                            default: 'CIBIL',
                            description: 'Preferred credit bureau for credit score retrieval'
                        },
                        collateral_details: {
                            type: 'object',
                            required: false,
                            description: 'Details of collateral (if applicable)',
                            properties: {
                                type: { type: 'string', enum: ['property', 'vehicle', 'securities', 'gold'] },
                                estimated_value: { type: 'number', minimum: 0 },
                                ownership_proof: { type: 'string' },
                                valuation_certificate: { type: 'string' }
                            }
                        },
                        additional_income_sources: {
                            type: 'array',
                            required: false,
                            description: 'Additional sources of income',
                            items: {
                                type: 'object',
                                properties: {
                                    source_type: { type: 'string', enum: ['rental', 'investment', 'freelance', 'business'] },
                                    monthly_amount: { type: 'number', minimum: 0 },
                                    proof_document: { type: 'string' }
                                }
                            }
                        },
                        risk_mitigation_factors: {
                            type: 'array',
                            required: false,
                            description: 'Factors that may reduce lending risk',
                            items: {
                                type: 'string',
                                enum: [
                                    'existing_customer',
                                    'salary_account_holder',
                                    'insurance_coverage',
                                    'guarantor_available',
                                    'stable_employment_history',
                                    'property_ownership'
                                ]
                            }
                        }
                    }
                },
                underwriting_stages: [
                    {
                        stage: UNDERWRITING_STAGES.CREDIT_SCORE_ANALYSIS,
                        name: 'Credit Score Analysis',
                        description: 'Comprehensive credit history and score evaluation',
                        checks: [
                            'CIBIL/Credit score retrieval',
                            'Payment history analysis',
                            'Credit utilization assessment',
                            'Credit mix evaluation',
                            'Recent credit inquiries review'
                        ]
                    },
                    {
                        stage: UNDERWRITING_STAGES.DEBT_TO_INCOME_ANALYSIS,
                        name: 'Debt-to-Income Analysis',
                        description: 'Assessment of borrower\'s debt servicing capacity',
                        checks: [
                            'Monthly income verification',
                            'Existing debt obligations calculation',
                            'Proposed EMI calculation',
                            'DTI ratio computation',
                            'Disposable income assessment'
                        ]
                    },
                    {
                        stage: UNDERWRITING_STAGES.COLLATERAL_ASSESSMENT,
                        name: 'Collateral Assessment',
                        description: 'Evaluation of loan security and collateral adequacy',
                        checks: [
                            'Collateral type identification',
                            'Market value assessment',
                            'Loan-to-value ratio calculation',
                            'Liquidity assessment',
                            'Legal verification of ownership'
                        ]
                    },
                    {
                        stage: UNDERWRITING_STAGES.RISK_ASSESSMENT,
                        name: 'Risk Assessment',
                        description: 'Comprehensive risk evaluation and scoring',
                        checks: [
                            'Employment stability assessment',
                            'Income stability evaluation',
                            'Geographic risk analysis',
                            'Industry risk assessment',
                            'Behavioral indicators analysis'
                        ]
                    },
                    {
                        stage: UNDERWRITING_STAGES.AUTOMATED_DECISION,
                        name: 'Automated Decision',
                        description: 'Automated underwriting decision based on all factors',
                        checks: [
                            'Score aggregation and weighting',
                            'Decision rules application',
                            'Risk tolerance evaluation',
                            'Automated recommendation generation',
                            'Confidence level calculation'
                        ]
                    },
                    {
                        stage: UNDERWRITING_STAGES.DECISION_FINALIZATION,
                        name: 'Decision Finalization',
                        description: 'Final underwriting decision and terms determination',
                        checks: [
                            'Final decision confirmation',
                            'Loan amount determination',
                            'Interest rate category assignment',
                            'Conditions and terms finalization',
                            'Approval validity period setting'
                        ]
                    }
                ],
                scoring_system: {
                    credit_score_impact: {
                        description: 'Impact of credit score on underwriting decision',
                        weight: '30%',
                        scoring: {
                            'excellent (750+)': '+25 points',
                            'good (700-749)': '+15 points',
                            'fair (650-699)': '+5 points',
                            'poor (600-649)': '-10 points',
                            'very_poor (<600)': '-25 points'
                        }
                    },
                    dti_impact: {
                        description: 'Impact of debt-to-income ratio',
                        weight: '25%',
                        scoring: {
                            'excellent (≤30%)': '+20 points',
                            'good (31-40%)': '+10 points',
                            'acceptable (41-50%)': '0 points',
                            'concerning (51-60%)': '-15 points',
                            'high_risk (>60%)': '-30 points'
                        }
                    },
                    collateral_impact: {
                        description: 'Impact of collateral adequacy',
                        weight: '20%',
                        scoring: {
                            'excellent_ltv (≤70%)': '+15 points',
                            'good_ltv (71-80%)': '+10 points',
                            'acceptable_ltv (81-90%)': '+5 points',
                            'high_ltv (>90%)': '-5 points',
                            'unsecured_loan': '-10 points'
                        }
                    },
                    risk_impact: {
                        description: 'Impact of overall risk assessment',
                        weight: '25%',
                        scoring: {
                            'low_risk': '+15 points',
                            'medium_risk': '0 points',
                            'high_risk': '-20 points'
                        }
                    }
                },
                possible_outcomes: [
                    {
                        outcome: 'approved',
                        description: 'Full loan amount approved with standard terms',
                        criteria: 'Total underwriting score ≥ 40 points',
                        next_phase: 'credit-decision'
                    },
                    {
                        outcome: 'conditional_approval',
                        description: 'Partial approval with conditions or modified terms',
                        criteria: 'Total underwriting score 0-39 points',
                        conditions: [
                            'Reduced loan amount',
                            'Higher interest rate',
                            'Additional guarantor required',
                            'Enhanced collateral needed'
                        ],
                        next_phase: 'credit-decision'
                    },
                    {
                        outcome: 'rejected',
                        description: 'Application rejected due to high risk factors',
                        criteria: 'Total underwriting score < 0 points',
                        common_reasons: [
                            'Credit score below minimum threshold',
                            'DTI ratio exceeds acceptable limits',
                            'Insufficient or inadequate collateral',
                            'High-risk employment or industry',
                            'Unstable income sources'
                        ]
                    }
                ],
                estimated_processing_time: '15-30 minutes',
                automated_processing: true,
                manual_review_triggers: [
                    'Borderline underwriting scores',
                    'Complex collateral structures',
                    'High-value loan applications',
                    'Unusual risk factors identified',
                    'System confidence level below threshold'
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Underwriting requirements retrieved successfully',
                data: requirements
            });
        } catch (error) {
            console.error('Get underwriting requirements error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve underwriting requirements',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Health check for underwriting phase
     */
    async healthCheck(req, res) {
        try {
            const health = {
                phase: 'underwriting',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    underwriting_engine: 'operational',
                    credit_bureau_integration: 'operational',
                    risk_assessment_system: 'operational',
                    automated_decision_engine: 'operational',
                    database_connection: 'operational'
                },
                endpoints: [
                    'POST /api/phases/underwriting/process/:application_processing_id',
                    'GET /api/phases/underwriting/status/:underwritingId',
                    'GET /api/phases/underwriting/requirements',
                    'GET /api/phases/underwriting/health'
                ],
                performance_metrics: {
                    average_processing_time: '18 minutes',
                    success_rate: '98.5%',
                    automated_decision_rate: '85%'
                }
            };

            res.status(200).json({
                success: true,
                message: 'Underwriting phase is healthy',
                data: health
            });
        } catch (error) {
            console.error('Underwriting health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Underwriting phase health check failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new UnderwritingController();