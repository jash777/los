/**
 * Main Phases Router
 * Integrates all loan origination phase routes
 */

const express = require('express');
const router = express.Router();

// Import phase routes
const preQualificationRoutes = require('./pre-qualification/routes');
const loanApplicationRoutes = require('./loan-application/routes');
const applicationProcessingRoutes = require('./application-processing/routes');
const underwritingRoutes = require('./underwriting/routes');
const creditDecisionRoutes = require('./credit-decision/routes');
const qualityCheckRoutes = require('./quality-check/routes');
const loanFundingRoutes = require('./loan-funding/routes');
// TODO: Import other phase routes as they are implemented
// const underwritingRoutes = require('./underwriting/routes');
// const creditDecisionRoutes = require('./credit-decision/routes');
// const qualityCheckRoutes = require('./quality-check/routes');
// const loanFundingRoutes = require('./loan-funding/routes');

// Phase routes
router.use('/pre-qualification', preQualificationRoutes);
router.use('/loan-application', loanApplicationRoutes);
router.use('/application-processing', applicationProcessingRoutes);
router.use('/underwriting', underwritingRoutes);
router.use('/credit-decision', creditDecisionRoutes);
router.use('/quality-check', qualityCheckRoutes);
router.use('/loan-funding', loanFundingRoutes);
// TODO: Add other phase routes as they are implemented

/**
 * @route GET /api/phases
 * @desc Get all available phases and their status
 * @access Public
 */
router.get('/', (req, res) => {
    try {
        const phases = {
            success: true,
            message: 'Loan Origination Phases API',
            data: {
                version: '1.0.0',
                description: 'Multi-phase loan origination system',
                availablePhases: [
                    {
                        phase: 'pre-qualification',
                        name: 'Pre-Qualification',
                        description: 'Initial assessment for loan eligibility',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/pre-qualification/process',
                            'GET /api/phases/pre-qualification/status/:applicationId',
                            'GET /api/phases/pre-qualification/requirements',
                            'GET /api/phases/pre-qualification/health'
                        ]
                    },
                    {
                        phase: 'loan-application',
                        name: 'Loan Application',
                        description: 'Detailed loan application with comprehensive financial information',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/loan-application/process',
                            'GET /api/phases/loan-application/status/:applicationId',
                            'GET /api/phases/loan-application/requirements',
                            'GET /api/phases/loan-application/health'
                        ]
                    },
                    {
                        phase: 'application-processing',
                        name: 'Application Processing',
                        description: 'Verification and validation of application data',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/application-processing/process',
                            'GET /api/phases/application-processing/status/:applicationId',
                            'GET /api/phases/application-processing/requirements',
                            'GET /api/phases/application-processing/health'
                        ]
                    },
                    {
                        phase: 'underwriting',
                        name: 'Underwriting Process',
                        description: 'Credit assessment and risk evaluation',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/underwriting/process',
                            'GET /api/phases/underwriting/status/:applicationId',
                            'GET /api/phases/underwriting/requirements',
                            'GET /api/phases/underwriting/health'
                        ]
                    },
                    {
                        phase: 'credit-decision',
                        name: 'Credit Decision',
                        description: 'Final approval or rejection decision',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/credit-decision/process',
                            'GET /api/phases/credit-decision/status/:applicationId',
                            'GET /api/phases/credit-decision/requirements',
                            'GET /api/phases/credit-decision/health'
                        ]
                    },
                    {
                        phase: 'quality-check',
                        name: 'Quality Check',
                        description: 'Compliance and accuracy verification',
                        status: 'active',
                        endpoints: [
                             'POST /api/phases/quality-check/process/:credit_decision_id',
                             'GET /api/phases/quality-check/status/:quality_check_id',
                             'GET /api/phases/quality-check/report/:quality_check_id',
                             'GET /api/phases/quality-check/requirements',
                             'GET /api/phases/quality-check/health'
                         ]
                    },
                    {
                        phase: 'loan-funding',
                        name: 'Loan Funding',
                        description: 'Final loan disbursement',
                        status: 'active',
                        endpoints: [
                            'POST /api/phases/loan-funding/process/:quality_check_id',
                            'GET /api/phases/loan-funding/status/:loan_funding_id',
                            'GET /api/phases/loan-funding/report/:loan_funding_id',
                            'GET /api/phases/loan-funding/requirements',
                            'GET /api/phases/loan-funding/health'
                        ]
                    }
                ],
                workflow: {
                    description: 'Sequential workflow through all phases',
                    flow: [
                        'pre-qualification → loan-application → application-processing → underwriting → credit-decision → quality-check → loan-funding'
                    ],
                    notes: [
                        'Each phase must be completed before proceeding to the next',
                        'Applications can be rejected at any phase',
                        'Quality checks ensure compliance before funding'
                    ]
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(phases);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve phases information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/phases/health
 * @desc Health check for all phases
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            success: true,
            message: 'Phases health check',
            data: {
                overall_status: 'healthy',
                phases: {
                    'pre-qualification': {
                        status: 'healthy',
                        endpoints: 4,
                        last_check: new Date().toISOString()
                    }
                    // TODO: Add health checks for other phases
                },
                system_info: {
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    node_version: process.version,
                    environment: process.env.NODE_ENV || 'development'
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Health check error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/phases/workflow
 * @desc Get workflow information and phase dependencies
 * @access Public
 */
router.get('/workflow', (req, res) => {
    try {
        const workflowInfo = {
            success: true,
            message: 'Loan origination workflow information',
            data: {
                workflow_version: '1.0.0',
                total_phases: 7,
                estimated_completion_time: '3-7 business days',
                phases: [
                    {
                        order: 1,
                        phase: 'pre-qualification',
                        name: 'Pre-Qualification',
                        estimated_time: '15-30 minutes',
                        required_documents: ['PAN Card', 'Aadhar Card', 'Employment Details'],
                        key_checks: ['Identity Verification', 'CIBIL Score', 'Basic Eligibility']
                    },
                    {
                        order: 2,
                        phase: 'loan-application',
                        name: 'Loan Application',
                        estimated_time: '30-60 minutes',
                        required_documents: ['Income Proof', 'Bank Statements', 'Address Proof'],
                        key_checks: ['Financial Assessment', 'Document Verification']
                    },
                    {
                        order: 3,
                        phase: 'application-processing',
                        name: 'Application Processing',
                        estimated_time: '1-2 business days',
                        required_documents: ['All submitted documents'],
                        key_checks: ['Document Accuracy', 'Data Validation', 'External Verification']
                    },
                    {
                        order: 4,
                        phase: 'underwriting',
                        name: 'Underwriting Process',
                        estimated_time: '1-3 business days',
                        required_documents: ['Complete application package'],
                        key_checks: ['Credit Assessment', 'Risk Evaluation', 'Collateral Assessment']
                    },
                    {
                        order: 5,
                        phase: 'credit-decision',
                        name: 'Credit Decision',
                        estimated_time: '1 business day',
                        required_documents: ['Underwriting report'],
                        key_checks: ['Final Approval', 'Terms Setting', 'Conditions Definition']
                    },
                    {
                        order: 6,
                        phase: 'quality-check',
                        name: 'Quality Check',
                        estimated_time: '1 business day',
                        required_documents: ['Complete loan file'],
                        key_checks: ['Compliance Verification', 'Document Completeness', 'Regulatory Adherence']
                    },
                    {
                        order: 7,
                        phase: 'loan-funding',
                        name: 'Loan Funding',
                        estimated_time: '1-2 business days',
                        required_documents: ['Signed loan agreement'],
                        key_checks: ['Final Verification', 'Disbursement Processing']
                    }
                ],
                business_rules: {
                    sequential_processing: true,
                    allow_phase_skip: false,
                    rejection_at_any_phase: true,
                    reapplication_after_rejection: true,
                    data_retention_period: '7 years'
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(workflowInfo);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve workflow information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware for phases router
router.use((error, req, res, next) => {
    console.error('Phases router error:', error);
    res.status(500).json({
        success: false,
        message: 'Phases system error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;