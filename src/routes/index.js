/**
 * Main Application Routes
 * Clean, organized routing for Enhanced LOS
 */

const express = require('express');
const path = require('path');
const preQualificationRoutes = require('./pre-qualification');
const loanApplicationRoutes = require('./loan-application');
const applicationProcessingRoutes = require('./application-processing');
const underwritingRoutes = require('./underwriting');
const creditDecisionRoutes = require('./credit-decision');
const qualityCheckRoutes = require('./quality-check');
const loanFundingRoutes = require('./loan-funding');
const automatedWorkflowRoutes = require('./automated-workflow');
const applicationTemplateRoutes = require('./application-template');
const databaseService = require('../database/service');
const config = require('../config/app');

const router = express.Router();

// Serve the loan application HTML page
router.get('/loan-form', (req, res) => {
    res.sendFile(path.join(__dirname, '../../loan-application.html'));
});

// Mount all stage routes
router.use('/pre-qualification', preQualificationRoutes);           // Stage 1
router.use('/loan-application', loanApplicationRoutes);             // Stage 2 (Enhanced)
router.use('/application-processing', applicationProcessingRoutes); // Stage 3
router.use('/underwriting', underwritingRoutes);                   // Stage 4
router.use('/credit-decision', creditDecisionRoutes);              // Stage 5
router.use('/quality-check', qualityCheckRoutes);                  // Stage 6
router.use('/loan-funding', loanFundingRoutes);                    // Stage 7
router.use('/automated-workflow', automatedWorkflowRoutes);        // Automated processing
router.use('/application-template', applicationTemplateRoutes);    // Application templates

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     description: Get information about the Enhanced LOS API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 */
router.get('/', (req, res) => {
    try {
        const apiInfo = {
            success: true,
            message: 'Enhanced Loan Origination System API',
            data: {
                name: config.app.name,
                version: config.app.version,
                description: config.app.description,
                environment: config.app.environment,
                availablePhases: [
                    {
                        phase: 'pre_qualification',
                        name: 'Pre-Qualification (Stage 1)',
                        description: 'Enhanced pre-qualification with complete application lifecycle',
                        status: 'active',
                        endpoints: [
                            'POST /api/pre-qualification/process',
                            'GET /api/pre-qualification/status/:applicationNumber'
                        ]
                    },
                    {
                        phase: 'loan-application',
                        name: 'Loan Application (Stage 2)',
                        description: 'Enhanced loan application with Aadhaar, bank statement analysis, and Indian market requirements',
                        status: 'active',
                        endpoints: [
                            'POST /api/loan-application/:applicationNumber',
                            'GET /api/loan-application/:applicationNumber/status',
                            'GET /api/loan-application/fields'
                        ]
                    },
                    {
                        phase: 'application-processing',
                        name: 'Application Processing (Stage 3)',
                        description: 'Document verification and application processing',
                        status: 'active',
                        endpoints: [
                            'POST /api/application-processing/:applicationNumber',
                            'GET /api/application-processing/:applicationNumber/status'
                        ]
                    },
                    {
                        phase: 'underwriting',
                        name: 'Underwriting (Stage 4)',
                        description: 'Risk assessment and underwriting analysis',
                        status: 'active',
                        endpoints: [
                            'POST /api/underwriting/:applicationNumber',
                            'GET /api/underwriting/:applicationNumber/status'
                        ]
                    },
                    {
                        phase: 'credit_decision',
                        name: 'Credit Decision (Stage 5)',
                        description: 'Final credit decision and loan terms determination',
                        status: 'active',
                        endpoints: [
                            'POST /api/credit-decision/:applicationNumber',
                            'GET /api/credit-decision/:applicationNumber/status'
                        ]
                    },
                    {
                        phase: 'quality_check',
                        name: 'Quality Check (Stage 6)',
                        description: 'Final quality assurance and compliance validation',
                        status: 'active',
                        endpoints: [
                            'POST /api/quality-check/:applicationNumber',
                            'GET /api/quality-check/:applicationNumber/status'
                        ]
                    },
                    {
                        phase: 'loan_funding',
                        name: 'Loan Funding (Stage 7)',
                        description: 'Final loan disbursement and account activation',
                        status: 'active',
                        endpoints: [
                            'POST /api/loan-funding/:applicationNumber',
                            'GET /api/loan-funding/:applicationNumber/status'
                        ]
                    }
                ],
                features: [
                    'MySQL database persistence',
                    'Complete application lifecycle management',
                    'Enhanced fraud detection',
                    'Real-time verification',
                    'Comprehensive audit trail',
                    'JSON-based flexible data storage'
                ],
                workflow: {
                    description: 'Complete 7-stage loan origination workflow',
                    implementedStages: [
                        'pre_qualification',
                        'application_processing', 
                        'underwriting',
                        'credit_decision',
                        'quality_check',
                        'loan_funding'
                    ],
                    stageFlow: 'pre_qualification → application_processing → underwriting → credit_decision → quality_check → loan_funding'
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(apiInfo);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve API information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check
 *     description: Check the overall health of the Enhanced LOS system
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *       500:
 *         description: System health issues detected
 */
router.get('/health', async (req, res) => {
    try {
        // Get database stats
        const dbStats = await databaseService.getDatabaseStats();
        
        const healthStatus = {
            success: true,
            message: 'Enhanced LOS system health check',
            data: {
                overall_status: 'healthy',
                system_info: {
                    name: config.app.name,
                    version: config.app.version,
                    environment: config.app.environment,
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    node_version: process.version
                },
                database: {
                    status: 'connected',
                    total_applications: dbStats.totalApplications,
                    recent_applications: dbStats.recentApplications,
                    tables: dbStats.tables.length
                },
                services: {
                    'pre_qualification': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    },
                    'application-processing': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    },
                    'underwriting': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    },
                    'credit_decision': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    },
                    'quality_check': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    },
                    'loan_funding': {
                        status: 'healthy',
                        endpoints: 2,
                        last_check: new Date().toISOString()
                    }
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'System health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Health check error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: System statistics
 *     description: Get detailed system and database statistics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       500:
 *         description: Failed to retrieve statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const dbStats = await databaseService.getDatabaseStats();
        
        const stats = {
            success: true,
            message: 'Enhanced LOS system statistics',
            data: {
                database: dbStats,
                system: {
                    uptime_seconds: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    cpu_usage: process.cpuUsage(),
                    node_version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                application: {
                    name: config.app.name,
                    version: config.app.version,
                    environment: config.app.environment,
                    features_enabled: Object.entries(config.features)
                        .filter(([key, value]) => value)
                        .map(([key]) => key)
                }
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware for main routes
router.use((error, req, res, next) => {
    console.error('Main routes error:', error);
    res.status(500).json({
        success: false,
        message: 'System error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;