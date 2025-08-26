/**
 * Application Processing Phase Controller
 * Handles HTTP requests for the application processing phase
 */

const ApplicationProcessingService = require('./service');
const logger = require('../../middleware/utils/logger');
const { LOAN_ORIGINATION_PHASES } = require('../../middleware/constants/loan-origination-phases');

class ApplicationProcessingController {
    constructor() {
        this.service = new ApplicationProcessingService();
        this.phase = LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING;
    }

    /**
     * Process application processing phase
     * POST /api/phases/application-processing/process
     */
    async processApplicationProcessing(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            logger.info(`[${requestId}] Application processing request received`, {
                body: req.body,
                phase: this.phase
            });

            const {
                loan_application_id,
                applicant_data,
                verification_requests
            } = req.body;

            // Validate required fields
            if (!loan_application_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Loan application ID is required',
                    code: 'MISSING_LOAN_APPLICATION_ID',
                    phase: this.phase
                });
            }

            // Process application processing
            const result = await this.service.processApplicationProcessing(
                {
                    applicant_data: applicant_data || {},
                    verification_requests: verification_requests || []
                },
                loan_application_id,
                requestId
            );

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error,
                    code: result.code,
                    phase: this.phase,
                    applicationId: result.applicationId
                });
            }

            // Return success response
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    applicationId: result.applicationId,
                    phase: result.phase,
                    status: result.status,
                    processingResult: result.result,
                    processingTime: result.processingTime,
                    nextPhase: result.nextPhase
                },
                requestId
            });

            logger.info(`[${requestId}] Application processing completed successfully`, {
                applicationId: result.applicationId,
                status: result.status,
                processingTime: result.processingTime
            });

        } catch (error) {
            logger.error(`[${requestId}] Application processing controller error`, {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                message: 'Internal server error during application processing',
                error: error.message,
                phase: this.phase,
                requestId
            });
        }
    }

    /**
     * Get application processing status
     * GET /api/phases/application-processing/status/:applicationId
     */
    async getApplicationStatus(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationId } = req.params;

            logger.info(`[${requestId}] Application processing status request`, {
                applicationId,
                phase: this.phase
            });

            if (!applicationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Application ID is required',
                    code: 'MISSING_APPLICATION_ID',
                    phase: this.phase
                });
            }

            const result = await this.service.getApplicationStatus(applicationId);

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: result.message,
                    error: result.error,
                    phase: this.phase,
                    applicationId
                });
            }

            res.status(200).json({
                success: true,
                message: 'Application processing status retrieved successfully',
                data: result.data,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get application processing status error`, {
                error: error.message,
                applicationId: req.params.applicationId
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve application processing status',
                error: error.message,
                phase: this.phase,
                requestId
            });
        }
    }

    /**
     * Get application processing requirements
     * GET /api/phases/application-processing/requirements
     */
    async getRequirements(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            logger.info(`[${requestId}] Application processing requirements request`, {
                phase: this.phase
            });

            const requirements = {
                phase: this.phase,
                description: 'Rigorous verification and validation of all provided information',
                prerequisites: [
                    'Approved loan application from previous phase',
                    'Complete applicant data and documents',
                    'Valid loan application ID'
                ],
                required_fields: {
                    loan_application_id: {
                        type: 'string',
                        required: true,
                        description: 'ID of the approved loan application'
                    },
                    applicant_data: {
                        type: 'object',
                        required: false,
                        description: 'Additional applicant data for verification',
                        properties: {
                            additional_documents: {
                                type: 'array',
                                description: 'Any additional documents for verification'
                            },
                            verification_preferences: {
                                type: 'object',
                                description: 'Preferences for verification methods'
                            }
                        }
                    },
                    verification_requests: {
                        type: 'array',
                        required: false,
                        description: 'Specific verification requests',
                        items: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['identity', 'employment', 'financial', 'address'],
                                    description: 'Type of verification requested'
                                },
                                priority: {
                                    type: 'string',
                                    enum: ['low', 'medium', 'high'],
                                    description: 'Priority level for verification'
                                }
                            }
                        }
                    }
                },
                processing_stages: [
                    {
                        stage: 'identity_employment_verification',
                        description: 'Verify identity documents and employment details',
                        checks: [
                            'PAN verification',
                            'Employment verification',
                            'Address verification'
                        ],
                        estimated_time: '2-5 minutes'
                    },
                    {
                        stage: 'financial_document_verification',
                        description: 'Verify financial documents and consistency',
                        checks: [
                            'Income proof verification',
                            'Bank statement verification',
                            'Financial consistency check'
                        ],
                        estimated_time: '3-7 minutes'
                    },
                    {
                        stage: 'inconsistency_check',
                        description: 'Check for inconsistencies across data sources',
                        checks: [
                            'Income consistency check',
                            'Employment consistency check',
                            'Document-data consistency check'
                        ],
                        estimated_time: '2-4 minutes'
                    },
                    {
                        stage: 'automated_flagging',
                        description: 'Automated flagging for risk and fraud indicators',
                        checks: [
                            'Risk flag detection',
                            'Fraud indicator analysis',
                            'Compliance flag check'
                        ],
                        estimated_time: '1-3 minutes'
                    },
                    {
                        stage: 'external_database_validation',
                        description: 'Validate information against external databases',
                        checks: [
                            'CIBIL data validation',
                            'Employment database validation',
                            'Regulatory database validation'
                        ],
                        estimated_time: '3-8 minutes'
                    }
                ],
                verification_criteria: {
                    identity_verification: {
                        pan_verification: 'Must match official records',
                        employment_verification: 'Must be verifiable with employer',
                        address_verification: 'Must match provided documents'
                    },
                    financial_verification: {
                        income_proof: 'Must be authentic and recent',
                        bank_statements: 'Must show consistent income patterns',
                        financial_consistency: 'All financial data must be consistent'
                    },
                    consistency_checks: {
                        income_consistency: 'Income across sources must match',
                        employment_consistency: 'Employment details must be consistent',
                        document_consistency: 'Documents must match provided data'
                    },
                    external_validation: {
                        cibil_validation: 'Must match CIBIL records',
                        employment_database: 'Must be found in employment databases',
                        regulatory_compliance: 'Must pass regulatory checks'
                    }
                },
                scoring_system: {
                    overall_score_calculation: {
                        identity_employment: '25% weight',
                        financial_documents: '25% weight',
                        consistency_check: '20% weight',
                        external_validation: '20% weight',
                        flagging_penalty: '10% weight'
                    },
                    approval_threshold: 75,
                    manual_review_threshold: 'Any flags detected or score < 75'
                },
                possible_outcomes: {
                    approved: {
                        description: 'All verifications passed, no flags detected',
                        next_phase: 'underwriting',
                        requirements: [
                            'Overall score >= 75',
                            'No automated flags',
                            'All verifications successful'
                        ]
                    },
                    flagged_for_review: {
                        description: 'Manual review required due to flags or low score',
                        next_phase: 'manual_review',
                        requirements: [
                            'Automated flags detected OR',
                            'Overall score < 75 OR',
                            'Verification failures'
                        ]
                    },
                    rejected: {
                        description: 'Critical verification failures',
                        next_phase: null,
                        requirements: [
                            'Critical fraud indicators OR',
                            'Major inconsistencies OR',
                            'External validation failures'
                        ]
                    }
                },
                estimated_processing_time: '10-25 minutes',
                api_endpoints: [
                    'POST /api/phases/application-processing/process',
                    'GET /api/phases/application-processing/status/:applicationId',
                    'GET /api/phases/application-processing/requirements',
                    'GET /api/phases/application-processing/health'
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Application processing requirements retrieved successfully',
                data: requirements,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get application processing requirements error`, {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve application processing requirements',
                error: error.message,
                phase: this.phase,
                requestId
            });
        }
    }

    /**
     * Health check for application processing phase
     * GET /api/phases/application-processing/health
     */
    async healthCheck(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            logger.info(`[${requestId}] Application processing health check`, {
                phase: this.phase
            });

            const healthStatus = {
                phase: this.phase,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    application_processing_service: 'operational',
                    verification_systems: 'operational',
                    external_databases: 'operational',
                    flagging_engine: 'operational'
                },
                capabilities: [
                    'Identity and employment verification',
                    'Financial document verification',
                    'Inconsistency detection',
                    'Automated flagging',
                    'External database validation'
                ],
                endpoints: [
                    'POST /api/phases/application-processing/process',
                    'GET /api/phases/application-processing/status/:applicationId',
                    'GET /api/phases/application-processing/requirements',
                    'GET /api/phases/application-processing/health'
                ]
            };

            res.status(200).json({
                success: true,
                message: 'Application processing phase is healthy',
                data: healthStatus,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Application processing health check error`, {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Application processing health check failed',
                error: error.message,
                phase: this.phase,
                requestId
            });
        }
    }
}

module.exports = ApplicationProcessingController;