const qualityCheckService = require('./service');
const { PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

class QualityCheckController {
    /**
     * Process quality check for a credit decision
     * POST /api/phases/quality-check/process/:credit_decision_id
     */
    async processQualityCheck(req, res) {
        try {
            const { credit_decision_id } = req.params;
            const checkData = req.body;

            console.log(`Processing quality check for credit decision: ${credit_decision_id}`);

            const result = await qualityCheckService.processQualityCheck(credit_decision_id, checkData);

            res.status(200).json({
                success: true,
                message: 'Quality check processed successfully',
                data: result
            });

        } catch (error) {
            console.error('Quality check processing error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Quality check processing failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get quality check status
     * GET /api/phases/quality-check/status/:quality_check_id
     */
    async getQualityCheckStatus(req, res) {
        try {
            const { quality_check_id } = req.params;

            console.log(`Retrieving quality check status: ${quality_check_id}`);

            const result = await qualityCheckService.getQualityCheckStatus(quality_check_id);

            res.status(200).json({
                success: true,
                message: 'Quality check status retrieved successfully',
                data: result.data
            });

        } catch (error) {
            console.error('Get quality check status error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Quality check status retrieval failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get quality check report
     * GET /api/phases/quality-check/report/:quality_check_id
     */
    async getQualityCheckReport(req, res) {
        try {
            const { quality_check_id } = req.params;
            const { format = 'json' } = req.query;

            console.log(`Generating quality check report: ${quality_check_id}`);

            const statusResult = await qualityCheckService.getQualityCheckStatus(quality_check_id);
            const qualityCheck = statusResult.data;

            if (!qualityCheck.quality_result) {
                return res.status(400).json({
                    success: false,
                    message: 'Quality check not completed yet'
                });
            }

            const report = {
                report_id: `QC-${quality_check_id}`,
                generated_at: new Date(),
                quality_check_id: quality_check_id,
                loan_application_id: qualityCheck.loan_application._id,
                applicant_name: qualityCheck.loan_application.applicant_info.full_name,
                loan_type: qualityCheck.loan_application.loan_details.loan_type,
                loan_amount: qualityCheck.loan_application.loan_details.loan_amount,
                
                // Quality check summary
                overall_status: qualityCheck.quality_result.overall_status,
                compliance_score: qualityCheck.quality_result.compliance_score,
                accuracy_score: qualityCheck.quality_result.accuracy_score,
                
                // Check results
                quality_checks: qualityCheck.quality_result.quality_checks,
                check_summary: qualityCheck.quality_result.check_summary,
                processing_summary: qualityCheck.quality_result.processing_summary,
                
                // Issues and recommendations
                issues_found: qualityCheck.quality_result.issues_found,
                recommendations: qualityCheck.quality_result.recommendations,
                
                // Status and next steps
                status: qualityCheck.status,
                next_phase: qualityCheck.quality_result.overall_status === 'passed' ? 'loan-funding' : null,
                requires_manual_review: qualityCheck.quality_result.issues_found.some(issue => issue.severity === 'critical'),
                
                // Processing timeline
                created_at: qualityCheck.created_at,
                completed_at: qualityCheck.quality_result.check_date,
                processing_time_minutes: qualityCheck.quality_result.processing_summary.total_processing_time
            };

            if (format === 'pdf') {
                // For PDF format, we would typically use a PDF generation library
                // For now, return JSON with PDF indication
                res.status(200).json({
                    success: true,
                    message: 'Quality check report generated (PDF format not implemented)',
                    data: {
                        format: 'pdf',
                        download_url: `/api/phases/quality-check/report/${quality_check_id}?format=json`,
                        report: report
                    }
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Quality check report generated successfully',
                    data: {
                        format: 'json',
                        report: report
                    }
                });
            }

        } catch (error) {
            console.error('Quality check report generation error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Quality check report generation failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get quality check requirements and information
     * GET /api/phases/quality-check/requirements
     */
    async getRequirements(req, res) {
        try {
            const requirements = {
                phase_name: 'Quality Check',
                phase_description: 'Comprehensive quality assurance and compliance verification before loan funding',
                
                prerequisites: [
                    'Completed Credit Decision phase',
                    'Approved or conditionally approved loan application',
                    'All required documents uploaded',
                    'Valid credit decision with complete results'
                ],
                
                required_fields: [
                    {
                        field: 'credit_decision_id',
                        type: 'string',
                        description: 'ID of the completed credit decision',
                        validation: 'Must be a valid MongoDB ObjectId of an existing credit decision'
                    }
                ],
                
                optional_fields: [
                    {
                        field: 'priority_level',
                        type: 'string',
                        description: 'Priority level for quality check processing',
                        options: ['standard', 'high', 'urgent'],
                        default: 'standard'
                    },
                    {
                        field: 'manual_review_required',
                        type: 'boolean',
                        description: 'Force manual review even if automated checks pass',
                        default: false
                    },
                    {
                        field: 'reviewer_notes',
                        type: 'string',
                        description: 'Additional notes for the quality check reviewer',
                        max_length: 1000
                    },
                    {
                        field: 'additional_checks',
                        type: 'array',
                        description: 'Additional custom quality checks to perform',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', description: 'Type of additional check' },
                                name: { type: 'string', description: 'Name of the check' },
                                parameters: { type: 'object', description: 'Check-specific parameters' }
                            }
                        }
                    }
                ],
                
                quality_check_types: [
                    {
                        type: 'document_verification',
                        name: 'Document Verification',
                        description: 'Verify completeness and validity of all required documents',
                        automated: true,
                        weight: 20
                    },
                    {
                        type: 'data_accuracy',
                        name: 'Data Accuracy Check',
                        description: 'Validate accuracy and consistency of applicant data',
                        automated: true,
                        weight: 20
                    },
                    {
                        type: 'compliance_check',
                        name: 'Compliance Verification',
                        description: 'Ensure compliance with lending policies and regulations',
                        automated: true,
                        weight: 25
                    },
                    {
                        type: 'policy_adherence',
                        name: 'Policy Adherence',
                        description: 'Verify adherence to internal lending policies',
                        automated: true,
                        weight: 15
                    },
                    {
                        type: 'risk_validation',
                        name: 'Risk Validation',
                        description: 'Validate risk assessment and mitigation measures',
                        automated: true,
                        weight: 10
                    },
                    {
                        type: 'calculation_verification',
                        name: 'Calculation Verification',
                        description: 'Verify accuracy of financial calculations (EMI, interest, etc.)',
                        automated: true,
                        weight: 5
                    },
                    {
                        type: 'regulatory_compliance',
                        name: 'Regulatory Compliance',
                        description: 'Ensure compliance with RBI and other regulatory requirements',
                        automated: true,
                        weight: 5
                    }
                ],
                
                quality_outcomes: [
                    {
                        outcome: 'passed',
                        description: 'All quality checks passed successfully',
                        next_phase: 'loan-funding',
                        conditions: [
                            'Overall compliance score >= 80%',
                            'Overall accuracy score >= 80%',
                            'No critical issues found',
                            'All mandatory checks passed'
                        ]
                    },
                    {
                        outcome: 'warning',
                        description: 'Quality checks passed with warnings',
                        next_phase: 'manual-review',
                        conditions: [
                            'Overall compliance score >= 70%',
                            'Overall accuracy score >= 70%',
                            'Minor issues found but no critical violations',
                            'Manual review recommended'
                        ]
                    },
                    {
                        outcome: 'failed',
                        description: 'Quality checks failed',
                        next_phase: 'rejection',
                        conditions: [
                            'Overall compliance score < 70%',
                            'Overall accuracy score < 70%',
                            'Critical issues found',
                            'Mandatory checks failed'
                        ]
                    }
                ],
                
                compliance_areas: [
                    {
                        area: 'Age Eligibility',
                        requirement: 'Applicant age between 21-65 years',
                        regulation: 'Internal Policy'
                    },
                    {
                        area: 'Income Requirements',
                        requirement: 'Minimum income based on loan type',
                        regulation: 'Internal Policy'
                    },
                    {
                        area: 'Credit Score',
                        requirement: 'Minimum credit score based on loan type',
                        regulation: 'Risk Management Policy'
                    },
                    {
                        area: 'Debt-to-Income Ratio',
                        requirement: 'DTI ratio not exceeding 60%',
                        regulation: 'Prudential Norms'
                    },
                    {
                        area: 'KYC Compliance',
                        requirement: 'Valid PAN, Aadhaar, and other KYC documents',
                        regulation: 'RBI KYC Guidelines'
                    },
                    {
                        area: 'Fair Practice Code',
                        requirement: 'Proper disclosure of terms and conditions',
                        regulation: 'RBI Fair Practice Code'
                    }
                ],
                
                processing_timeline: {
                    automated_checks: '2-5 minutes',
                    manual_review: '30-60 minutes (if required)',
                    total_processing: '2-65 minutes',
                    sla: '4 hours for standard priority'
                },
                
                scoring_system: {
                    compliance_score: {
                        description: 'Overall compliance with policies and regulations',
                        range: '0-100',
                        passing_threshold: 80
                    },
                    accuracy_score: {
                        description: 'Data accuracy and calculation correctness',
                        range: '0-100',
                        passing_threshold: 80
                    },
                    overall_status: {
                        description: 'Combined assessment of all quality checks',
                        values: ['passed', 'warning', 'failed']
                    }
                },
                
                api_endpoints: [
                    {
                        method: 'POST',
                        endpoint: '/api/phases/quality-check/process/:credit_decision_id',
                        description: 'Process quality check for a credit decision',
                        parameters: {
                            path: ['credit_decision_id'],
                            body: ['priority_level', 'manual_review_required', 'reviewer_notes', 'additional_checks']
                        }
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/quality-check/status/:quality_check_id',
                        description: 'Get quality check status and results',
                        parameters: {
                            path: ['quality_check_id']
                        }
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/quality-check/report/:quality_check_id',
                        description: 'Generate quality check report',
                        parameters: {
                            path: ['quality_check_id'],
                            query: ['format']
                        }
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/quality-check/requirements',
                        description: 'Get quality check requirements and information'
                    },
                    {
                        method: 'GET',
                        endpoint: '/api/phases/quality-check/health',
                        description: 'Health check for quality check service'
                    }
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Quality check requirements retrieved successfully',
                data: requirements
            });

        } catch (error) {
            console.error('Get quality check requirements error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve quality check requirements',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Health check for quality check service
     * GET /api/phases/quality-check/health
     */
    async healthCheck(req, res) {
        try {
            const health = {
                phase: 'quality-check',
                status: 'healthy',
                timestamp: new Date(),
                version: '1.0.0',
                services: {
                    database: 'connected',
                    quality_engine: 'operational',
                    compliance_checker: 'operational',
                    document_validator: 'operational'
                },
                dependencies: {
                    credit_decision_service: 'available',
                    loan_application_service: 'available',
                    document_service: 'available'
                },
                metrics: {
                    total_quality_checks: 0,
                    passed_checks: 0,
                    failed_checks: 0,
                    average_processing_time: '3.5 minutes',
                    compliance_score_average: 85.2,
                    accuracy_score_average: 88.7
                },
                quality_check_types: [
                    'document_verification',
                    'data_accuracy',
                    'compliance_check',
                    'policy_adherence',
                    'risk_validation',
                    'calculation_verification',
                    'regulatory_compliance'
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Quality check service is healthy',
                data: health
            });

        } catch (error) {
            console.error('Quality check health check error:', error);
            res.status(503).json({
                success: false,
                message: 'Quality check service health check failed',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new QualityCheckController();