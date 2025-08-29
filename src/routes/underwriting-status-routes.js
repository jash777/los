/**
 * Underwriting Status Management Routes
 * API endpoints for managing underwriting application statuses
 */

const express = require('express');
const UnderwritingStatusManager = require('../utils/underwriting-status-manager');
const logger = require('../utils/logger');

const router = express.Router();
const statusManager = new UnderwritingStatusManager();

/**
 * @route POST /api/underwriting-status/move-to-underwriting
 * @desc Move applications to underwriting stage
 * @access Public
 */
router.post('/move-to-underwriting', async (req, res) => {
    const requestId = req.headers['x-request-id'] || `move_${Date.now()}`;
    
    try {
        const { applicationNumbers, status = 'pending' } = req.body;

        if (!applicationNumbers || !Array.isArray(applicationNumbers) || applicationNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'applicationNumbers array is required',
                requestId
            });
        }

        const validStatuses = ['pending', 'in_progress', 'under_review'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
                requestId
            });
        }

        logger.info(`[${requestId}] Moving ${applicationNumbers.length} applications to underwriting`);

        const result = await statusManager.moveToUnderwriting(applicationNumbers, status);

        res.status(200).json({
            ...result,
            message: `Processed ${result.processed} applications. ${result.successful} successful, ${result.failed} failed.`,
            requestId
        });

    } catch (error) {
        logger.error(`[${requestId}] Error in move-to-underwriting:`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/underwriting-status/update-status
 * @desc Update status for applications already in underwriting
 * @access Public
 */
router.post('/update-status', async (req, res) => {
    const requestId = req.headers['x-request-id'] || `update_${Date.now()}`;
    
    try {
        const { applicationNumbers, status, reviewer, comments } = req.body;

        if (!applicationNumbers || !Array.isArray(applicationNumbers) || applicationNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'applicationNumbers array is required',
                requestId
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'status is required',
                requestId
            });
        }

        const validStatuses = ['approved', 'rejected', 'under_review', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
                requestId
            });
        }

        logger.info(`[${requestId}] Updating ${applicationNumbers.length} applications to ${status}`);

        const result = await statusManager.updateUnderwritingStatus(
            applicationNumbers, 
            status, 
            { reviewer, comments }
        );

        res.status(200).json({
            ...result,
            message: `Processed ${result.processed} applications. ${result.successful} successful, ${result.failed} failed.`,
            requestId
        });

    } catch (error) {
        logger.error(`[${requestId}] Error in update-status:`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/underwriting-status/applications
 * @desc Get applications by stage and status
 * @access Public
 */
router.get('/applications', async (req, res) => {
    const requestId = req.headers['x-request-id'] || `get_${Date.now()}`;
    
    try {
        const { stage = 'underwriting', status } = req.query;

        logger.info(`[${requestId}] Getting applications for stage: ${stage}, status: ${status || 'all'}`);

        const result = await statusManager.getApplicationsByStageAndStatus(stage, status);

        res.status(200).json({
            ...result,
            requestId
        });

    } catch (error) {
        logger.error(`[${requestId}] Error getting applications:`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/underwriting-status/stats
 * @desc Get underwriting statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
    const requestId = req.headers['x-request-id'] || `stats_${Date.now()}`;
    
    try {
        logger.info(`[${requestId}] Getting underwriting statistics`);

        const result = await statusManager.getUnderwritingStats();

        res.status(200).json({
            ...result,
            requestId
        });

    } catch (error) {
        logger.error(`[${requestId}] Error getting stats:`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route POST /api/underwriting-status/setup-demo
 * @desc Setup underwriting demo with realistic distribution
 * @access Public
 */
router.post('/setup-demo', async (req, res) => {
    const requestId = req.headers['x-request-id'] || `demo_${Date.now()}`;
    
    try {
        logger.info(`[${requestId}] Setting up underwriting demo`);

        const result = await statusManager.setupUnderwritingDemo();

        if (result.success) {
            res.status(200).json({
                ...result,
                requestId
            });
        } else {
            res.status(400).json({
                ...result,
                requestId
            });
        }

    } catch (error) {
        logger.error(`[${requestId}] Error setting up demo:`, error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId
        });
    }
});

/**
 * @route GET /api/underwriting-status/help
 * @desc Get help documentation for status management
 * @access Public
 */
router.get('/help', (req, res) => {
    res.status(200).json({
        success: true,
        title: 'Underwriting Status Management API',
        description: 'Manage application statuses for underwriting dashboard',
        endpoints: {
            'POST /move-to-underwriting': {
                description: 'Move applications to underwriting stage',
                body: {
                    applicationNumbers: ['EL_123', 'EL_456'],
                    status: 'pending' // optional: pending, in_progress, under_review
                }
            },
            'POST /update-status': {
                description: 'Update status for applications in underwriting',
                body: {
                    applicationNumbers: ['EL_123', 'EL_456'],
                    status: 'approved', // approved, rejected, under_review, pending
                    reviewer: 'John Doe', // optional
                    comments: 'Batch update' // optional
                }
            },
            'GET /applications': {
                description: 'Get applications by stage and status',
                query: {
                    stage: 'underwriting', // optional, default: underwriting
                    status: 'pending' // optional
                }
            },
            'GET /stats': {
                description: 'Get underwriting statistics'
            },
            'POST /setup-demo': {
                description: 'Setup demo with realistic status distribution'
            }
        },
        statuses: {
            underwriting_statuses: ['pending', 'under_review', 'approved', 'rejected'],
            stage_transitions: {
                'approved': 'moves to credit_decision stage',
                'rejected': 'stays in underwriting stage',
                'under_review': 'stays in underwriting stage',
                'pending': 'stays in underwriting stage'
            }
        }
    });
});

module.exports = router;
