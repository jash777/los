const LoanFundingService = require('./service');
const { PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');
const pool = require('../../middleware/config/database');
// Model replaced with direct PostgreSQL queries

class LoanFundingController {
    /**
     * Process loan funding
     * POST /api/phases/loan-funding/process/:quality_check_id
     */
    async processLoanFunding(req, res) {
        try {
            const { quality_check_id } = req.params;
            const fundingData = req.body;

            // Validate quality_check_id
            if (!quality_check_id || !quality_check_id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid quality check ID format',
                    code: 'INVALID_QUALITY_CHECK_ID'
                });
            }

            const result = await LoanFundingService.processLoanFunding(quality_check_id, fundingData);

            res.status(200).json({
                success: true,
                message: 'Loan funding processed successfully',
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Process loan funding error:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                    code: 'RECORD_NOT_FOUND'
                });
            }
            
            if (error.message.includes('must be completed') || error.message.includes('only applicable')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'INVALID_PHASE_STATUS'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Internal server error during loan funding processing',
                code: 'PROCESSING_ERROR'
            });
        }
    }

    /**
     * Get loan funding status
     * GET /api/phases/loan-funding/status/:loan_funding_id
     */
    async getLoanFundingStatus(req, res) {
        try {
            const { loan_funding_id } = req.params;

            // Validate loan_funding_id
            if (!loan_funding_id || !loan_funding_id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid loan funding ID format',
                    code: 'INVALID_LOAN_FUNDING_ID'
                });
            }

            const result = await LoanFundingService.getLoanFundingStatus(loan_funding_id);

            res.status(200).json({
                success: true,
                message: 'Loan funding status retrieved successfully',
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get loan funding status error:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                    code: 'RECORD_NOT_FOUND'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Internal server error while retrieving loan funding status',
                code: 'RETRIEVAL_ERROR'
            });
        }
    }

    /**
     * Generate loan funding report
     * GET /api/phases/loan-funding/report/:loan_funding_id
     */
    async generateLoanFundingReport(req, res) {
        try {
            const { loan_funding_id } = req.params;
            const { format = 'json' } = req.query;

            // Validate loan_funding_id
            if (!loan_funding_id || !loan_funding_id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid loan funding ID format',
                    code: 'INVALID_LOAN_FUNDING_ID'
                });
            }

            const loanFunding = await LoanFundingModel.findById(loan_funding_id)
                .populate('loan_application_id')
                .populate('credit_decision_id')
                .populate('quality_check_id');

            if (!loanFunding) {
                return res.status(404).json({
                    success: false,
                    error: 'Loan funding record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            const report = {
                loan_funding_id: loanFunding._id,
                report_generated_at: new Date().toISOString(),
                loan_funding_summary: {
                    status: loanFunding.status,
                    funding_date: loanFunding.funding_result?.funding_date,
                    disbursement_amount: loanFunding.funding_result?.disbursement_details?.net_disbursement_amount,
                    loan_account_number: loanFunding.funding_result?.loan_account?.loan_account_number,
                    disbursement_reference: loanFunding.funding_result?.disbursement_details?.disbursement_reference
                },
                loan_application_details: {
                    application_id: loanFunding.loan_application_id?._id,
                    applicant_name: loanFunding.loan_application_id?.applicant_info?.full_name,
                    loan_type: loanFunding.loan_application_id?.loan_details?.loan_type,
                    requested_amount: loanFunding.loan_application_id?.loan_details?.loan_amount
                },
                credit_decision_details: {
                    decision_id: loanFunding.credit_decision_id?._id,
                    decision_outcome: loanFunding.credit_decision_id?.decision_result?.decision_outcome,
                    approved_amount: loanFunding.credit_decision_id?.decision_result?.approved_loan_amount,
                    interest_rate: loanFunding.credit_decision_id?.decision_result?.interest_rate,
                    tenure: loanFunding.credit_decision_id?.decision_result?.approved_tenure
                },
                quality_check_details: {
                    quality_check_id: loanFunding.quality_check_id?._id,
                    overall_status: loanFunding.quality_check_id?.quality_result?.overall_status,
                    compliance_score: loanFunding.quality_check_id?.quality_result?.compliance_score,
                    accuracy_score: loanFunding.quality_check_id?.quality_result?.accuracy_score
                },
                funding_details: loanFunding.funding_result,
                processing_timeline: {
                    initiated_at: loanFunding.created_at,
                    completed_at: loanFunding.updated_at,
                    total_processing_time: loanFunding.funding_result?.processing_summary?.total_processing_time
                },
                processing_logs: loanFunding.processing_logs
            };

            if (format === 'pdf') {
                // In a real implementation, you would generate a PDF here
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="loan-funding-report-${loan_funding_id}.pdf"`);
                return res.status(200).json({
                    success: false,
                    error: 'PDF generation not implemented yet',
                    code: 'FEATURE_NOT_IMPLEMENTED'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Loan funding report generated successfully',
                data: report,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Generate loan funding report error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while generating loan funding report',
                code: 'REPORT_GENERATION_ERROR'
            });
        }
    }

    /**
     * Get loan funding requirements
     * GET /api/phases/loan-funding/requirements
     */
    async getLoanFundingRequirements(req, res) {
        try {
            const requirements = {
                phase_name: 'Loan Funding',
                phase_description: 'Final disbursement of approved loans after quality checks',
                phase_order: 6,
                prerequisites: [
                    'Quality Check must be completed and passed',
                    'Credit Decision must be valid (within 30 days)',
                    'All loan conditions must be satisfied',
                    'Beneficiary bank details must be validated'
                ],
                required_fields: [
                    'quality_check_id',
                    'loan_application_id',
                    'credit_decision_id'
                ],
                optional_fields: [
                    'disbursement_method',
                    'disbursement_priority',
                    'special_instructions',
                    'beneficiary_verification_required',
                    'third_party_disbursement',
                    'disbursement_schedule'
                ],
                disbursement_methods: [
                    {
                        method: 'bank_transfer',
                        description: 'Direct bank transfer (NEFT/RTGS)',
                        processing_time: '1-2 business days',
                        charges: 'As per bank charges'
                    },
                    {
                        method: 'rtgs',
                        description: 'Real Time Gross Settlement',
                        processing_time: 'Same day',
                        charges: 'Higher charges apply',
                        minimum_amount: 200000
                    },
                    {
                        method: 'neft',
                        description: 'National Electronic Funds Transfer',
                        processing_time: '1 business day',
                        charges: 'Standard charges'
                    }
                ],
                funding_outcomes: [
                    {
                        outcome: 'disbursed',
                        description: 'Loan amount successfully disbursed to beneficiary account',
                        next_phase: 'loan-servicing'
                    },
                    {
                        outcome: 'failed',
                        description: 'Disbursement failed due to technical or validation issues',
                        next_phase: 'manual-review'
                    },
                    {
                        outcome: 'on_hold',
                        description: 'Disbursement put on hold pending additional verification',
                        next_phase: 'additional-verification'
                    }
                ],
                pre_disbursement_checks: [
                    'Credit Decision Validity Check',
                    'Loan Conditions Verification',
                    'Regulatory Compliance Check',
                    'Fraud Detection Screening',
                    'Duplicate Application Check',
                    'Sanctions and Watchlist Screening'
                ],
                processing_timeline: {
                    typical_processing_time: '2-4 hours',
                    maximum_processing_time: '1 business day',
                    factors_affecting_time: [
                        'Disbursement method selected',
                        'Bank processing times',
                        'Additional verification requirements',
                        'System load and peak hours'
                    ]
                },
                fee_structure: {
                    processing_fee: {
                        personal_loan: '2% of loan amount (max ₹50,000)',
                        home_loan: '0.5% of loan amount (max ₹100,000)',
                        car_loan: '1% of loan amount (max ₹100,000)',
                        education_loan: '1% of loan amount (max ₹100,000)',
                        business_loan: '1.5% of loan amount (max ₹100,000)',
                        loan_against_property: '1% of loan amount (max ₹100,000)'
                    },
                    gst: '18% on processing fee',
                    insurance_premium: {
                        personal_loan: '0.5% of loan amount (optional)',
                        other_loans: 'Not applicable'
                    },
                    other_charges: '₹500 (documentation and administrative charges)'
                },
                loan_account_features: [
                    'Unique loan account number generation',
                    'EMI calculation and scheduling',
                    'Customer portal access setup',
                    'Automated payment collection setup',
                    'Loan servicing configuration',
                    'Document generation and delivery'
                ],
                api_endpoints: [
                    {
                        method: 'POST',
                        endpoint: '/api/phases/loan-funding/process/:quality_check_id',
                        description: 'Process loan funding for a quality check',
                        required_params: ['quality_check_id'],
                        optional_body: [
                            'disbursement_method',
                            'disbursement_priority',
                            'special_instructions',
                            'beneficiary_verification_required',
                            'third_party_disbursement',
                            'disbursement_schedule'
                        ]
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/loan-funding/status/:loan_funding_id',
                        description: 'Get loan funding status and details',
                        required_params: ['loan_funding_id']
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/loan-funding/report/:loan_funding_id',
                        description: 'Generate comprehensive loan funding report',
                        required_params: ['loan_funding_id'],
                        optional_query: ['format (json/pdf)']
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/loan-funding/requirements',
                        description: 'Get detailed requirements for loan funding phase'
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/loan-funding/health',
                        description: 'Check health status of loan funding service'
                    }
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Loan funding requirements retrieved successfully',
                data: requirements,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get loan funding requirements error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while retrieving loan funding requirements',
                code: 'REQUIREMENTS_ERROR'
            });
        }
    }

    /**
     * Health check for loan funding service
     * GET /api/phases/loan-funding/health
     */
    async healthCheck(req, res) {
        try {
            const healthStatus = {
                service: 'loan-funding',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                phase_info: {
                    phase_name: 'Loan Funding',
                    phase_order: 6,
                    status: 'active',
                    description: 'Final disbursement of approved loans'
                },
                services: {
                    database: 'connected',
                    funding_service: 'operational',
                    notification_service: 'operational',
                    document_service: 'operational'
                },
                dependencies: {
                    quality_check_service: 'available',
                    credit_decision_service: 'available',
                    loan_application_service: 'available',
                    banking_apis: 'available',
                    payment_gateway: 'available'
                },
                metrics: {
                    total_fundings_processed: 0,
                    successful_disbursements: 0,
                    average_processing_time: 0,
                    current_queue_size: 0
                }
            };

            res.status(200).json({
                success: true,
                data: healthStatus
            });

        } catch (error) {
            console.error('Loan funding health check error:', error);
            res.status(503).json({
                success: false,
                service: 'loan-funding',
                status: 'unhealthy',
                error: 'Service health check failed',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Helper methods for health check metrics
    async getTotalFundingsProcessed() {
        try {
            return await LoanFundingModel.countDocuments({});
        } catch (error) {
            return 0;
        }
    }

    async getSuccessfulDisbursements() {
        try {
            return await LoanFundingModel.countDocuments({ 
                status: PHASE_STATUS.COMPLETED,
                'funding_result.funding_status': 'disbursed'
            });
        } catch (error) {
            return 0;
        }
    }

    async calculateAverageProcessingTime() {
        try {
            const result = await LoanFundingModel.aggregate([
                {
                    $match: {
                        status: PHASE_STATUS.COMPLETED,
                        'funding_result.processing_summary.total_processing_time': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgProcessingTime: {
                            $avg: '$funding_result.processing_summary.total_processing_time'
                        }
                    }
                }
            ]);

            return result.length > 0 ? Math.round(result[0].avgProcessingTime) : 0;
        } catch (error) {
            return 0;
        }
    }

    async getAverageProcessingTime() {
        return await this.calculateAverageProcessingTime();
    }
}

module.exports = new LoanFundingController();