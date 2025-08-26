/**
 * Dual-Phase Workflow API Routes
 * Handles both automated and manual workflow operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../middleware/utils/logger');
const { DualPhaseWorkflowOrchestrator } = require('../middleware/internal/workflow-orchestrator.service');
const { body, param, query, validationResult } = require('express-validator');

// Initialize services
const workflowOrchestrator = new DualPhaseWorkflowOrchestrator();

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Middleware for employee authentication (simplified)
const authenticateEmployee = (req, res, next) => {
    // In a real implementation, this would validate JWT tokens, sessions, etc.
    const employeeId = req.headers['x-employee-id'] || req.body.employeeId || req.query.employeeId;
    
    if (!employeeId) {
        return res.status(401).json({
            success: false,
            error: 'Employee authentication required'
        });
    }
    
    req.employeeId = employeeId;
    next();
};

/**
 * @route GET /api/dual-phase-workflow/status/
 * @desc Get overall workflow status
 * @access Public
 */
router.get('/status/', async (req, res) => {
    try {
        const stats = await getWorkflowStats();
        res.json({
            success: true,
            data: {
                system_status: 'operational',
                active_workflows: stats.activeWorkflows || 0,
                completed_workflows: stats.completedWorkflows || 0,
                pending_manual_reviews: stats.pendingManualReviews || 0,
                system_health: 'healthy'
            }
        });
    } catch (error) {
        logger.error('Error getting workflow status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow status'
        });
    }
});

/**
 * @route GET /api/dual-phase-workflow/automated-results/
 * @desc Get automated processing results
 * @access Public
 */
router.get('/automated-results/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        // Get recent automated results from phases
        const results = await workflowOrchestrator.getAutomatedResults({
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: results,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: results.length
            }
        });
    } catch (error) {
        logger.error('Error getting automated results:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get automated results'
        });
    }
});

/**
 * @route GET /manual-assignment/
 * @desc Get manual assignment queue and available applications
 * @access Employee
 */
router.get('/manual-assignment/',
    authenticateEmployee,
    async (req, res) => {
        try {
            const employeeId = req.employeeId;
            
            // Mock manual assignment data
            const manualAssignments = {
                success: true,
                data: {
                    availableApplications: [],
                    queueLength: 0,
                    estimatedWaitTime: '0 minutes',
                    assignmentCriteria: {
                        maxCapacity: 10,
                        currentLoad: 0,
                        specializations: []
                    }
                }
            };

            res.status(200).json({
                success: true,
                data: manualAssignments.data
            });

        } catch (error) {
            logger.error('Failed to get manual assignments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get manual assignments',
                details: error.message
            });
        }
    }
);



/**
 * @route POST /api/workflow/start
 * @desc Start complete dual-phase workflow
 * @access Public
 */
router.post('/start',
    [
        body('applicationData').isObject().withMessage('Application data is required'),
        body('applicationData.personal_info').isObject().withMessage('Personal info is required'),
        body('applicationData.loan_request').isObject().withMessage('Loan request is required'),
        body('options').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { applicationData, options = {} } = req.body;
            
            logger.info('Starting dual-phase workflow:', {
                applicantName: `${applicationData.personal_info?.first_name} ${applicationData.personal_info?.last_name}`,
                loanAmount: applicationData.loan_request?.requested_amount
            });

            const result = await workflowOrchestrator.startWorkflow(applicationData, options);
            
            res.status(200).json({
                success: true,
                data: result,
                message: 'Workflow started successfully'
            });

        } catch (error) {
            logger.error('Failed to start workflow:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start workflow',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /api/workflow/:workflowId/status
 * @desc Get workflow status and progress
 * @access Public
 */
router.get('/:workflowId/status',
    [
        param('workflowId').isUUID().withMessage('Valid workflow ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId } = req.params;
            
            // Get workflow status from database
            const workflowStatus = await getWorkflowStatus(workflowId);
            
            if (!workflowStatus) {
                return res.status(404).json({
                    success: false,
                    error: 'Workflow not found'
                });
            }

            res.status(200).json({
                success: true,
                data: workflowStatus
            });

        } catch (error) {
            logger.error('Failed to get workflow status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get workflow status',
                details: error.message
            });
        }
    }
);

/**
 * @route POST /api/workflow/:workflowId/manual-stage
 * @desc Process manual stage
 * @access Employee
 */
router.post('/:workflowId/manual-stage',
    authenticateEmployee,
    [
        param('workflowId').isUUID().withMessage('Valid workflow ID is required'),
        body('stageName').isString().notEmpty().withMessage('Stage name is required'),
        body('stageData').isObject().withMessage('Stage data is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { stageName, stageData } = req.body;
            const employeeId = req.employeeId;
            
            logger.info(`Processing manual stage ${stageName} for workflow ${workflowId} by employee ${employeeId}`);

            const result = await workflowOrchestrator.processManualStage(
                workflowId,
                stageName,
                employeeId,
                stageData
            );
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Manual stage processed successfully'
            });

        } catch (error) {
            logger.error('Failed to process manual stage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process manual stage',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /api/employee/dashboard
 * @desc Get employee dashboard data
 * @access Employee
 */
router.get('/employee/dashboard',
    authenticateEmployee,
    async (req, res) => {
        try {
            const employeeId = req.employeeId;
            
            // Mock dashboard data since employee dashboard service was removed
            const dashboardData = {
                success: true,
                data: {
                    pendingApplications: 0,
                    completedToday: 0,
                    totalAssigned: 0,
                    notifications: []
                }
            };

            res.status(200).json({
                success: true,
                data: dashboardData.data
            });

        } catch (error) {
            logger.error('Failed to get dashboard data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard data',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /assigned-applications
 * @desc Get assigned applications for employee dashboard
 * @access Employee
 */
router.get('/assigned-applications',
    authenticateEmployee,
    async (req, res) => {
        try {
            const employeeId = req.employeeId;
            
            // Mock assigned applications data
            const assignedApplications = {
                success: true,
                data: {
                    applications: [],
                    total: 0,
                    pending: 0,
                    inProgress: 0
                }
            };

            res.status(200).json({
                success: true,
                data: assignedApplications.data
            });

        } catch (error) {
            logger.error('Failed to get assigned applications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get assigned applications',
                details: error.message
            });
        }
    }
);

/**
 * @route POST /process-manual-stage
 * @desc Process manual stage for employee dashboard
 * @access Employee
 */
router.post('/process-manual-stage',
    authenticateEmployee,
    [
        body('workflowId').isUUID().withMessage('Valid workflow ID is required'),
        body('stageName').isString().notEmpty().withMessage('Stage name is required'),
        body('stageData').isObject().withMessage('Stage data is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId, stageName, stageData } = req.body;
            const employeeId = req.employeeId;
            
            logger.info(`Processing manual stage ${stageName} for workflow ${workflowId} by employee ${employeeId}`);

            const result = await workflowOrchestrator.processManualStage(
                workflowId,
                stageName,
                employeeId,
                stageData
            );
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Manual stage processed successfully'
            });

        } catch (error) {
            logger.error('Failed to process manual stage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process manual stage',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /api/employee/applications/:workflowId
 * @desc Get application details for manual processing
 * @access Employee
 */
router.get('/employee/applications/:workflowId',
    authenticateEmployee,
    [
        param('workflowId').isUUID().withMessage('Valid workflow ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId } = req.params;
            const employeeId = req.employeeId;
            
            const applicationDetails = await workflowOrchestrator.getWorkflowStatus(workflowId);
            
            if (!applicationDetails.success) {
                return res.status(400).json({
                    success: false,
                    error: applicationDetails.error || 'Failed to get application details'
                });
            }

            res.status(200).json({
                success: true,
                data: applicationDetails.data
            });

        } catch (error) {
            logger.error('Failed to get application details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get application details',
                details: error.message
            });
        }
    }
);

/**
 * @route POST /api/employee/applications/:workflowId/notes
 * @desc Add note to application
 * @access Employee
 */
router.post('/employee/applications/:workflowId/notes',
    authenticateEmployee,
    [
        param('workflowId').isUUID().withMessage('Valid workflow ID is required'),
        body('note').isString().notEmpty().withMessage('Note content is required'),
        body('noteType').optional().isString().isIn(['general', 'risk', 'compliance', 'customer_contact'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { note, noteType = 'general' } = req.body;
            const employeeId = req.employeeId;
            
            // Mock note addition since employee dashboard service was removed
            const result = {
                success: true,
                data: {
                    noteId: Date.now().toString(),
                    message: 'Note added successfully'
                }
            };

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            logger.error('Failed to add application note:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add application note',
                details: error.message
            });
        }
    }
);

/**
 * @route POST /api/employee/applications/:workflowId/escalate
 * @desc Request escalation for application
 * @access Employee
 */
router.post('/employee/applications/:workflowId/escalate',
    authenticateEmployee,
    [
        param('workflowId').isUUID().withMessage('Valid workflow ID is required'),
        body('reason').isString().notEmpty().withMessage('Escalation reason is required'),
        body('escalationType').optional().isString().isIn(['supervisor', 'senior_management', 'compliance', 'risk_committee'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { reason, escalationType = 'supervisor' } = req.body;
            const employeeId = req.employeeId;
            
            // Mock escalation request since employee dashboard service was removed
            const result = {
                success: true,
                data: {
                    escalationId: Date.now().toString(),
                    status: 'pending',
                    message: 'Escalation request submitted successfully'
                }
            };

            res.status(200).json({
                success: true,
                data: {
                    escalationId: result.escalationId
                },
                message: result.message
            });

        } catch (error) {
            logger.error('Failed to request escalation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to request escalation',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /api/employee/notifications
 * @desc Get employee notifications
 * @access Employee
 */
router.get('/employee/notifications',
    authenticateEmployee,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const employeeId = req.employeeId;
            const limit = parseInt(req.query.limit) || 20;
            
            // Mock notifications since employee dashboard service was removed
            const notifications = [];

            res.status(200).json({
                success: true,
                data: notifications
            });

        } catch (error) {
            logger.error('Failed to get employee notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get employee notifications',
                details: error.message
            });
        }
    }
);

/**
 * @route PUT /api/employee/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Employee
 */
router.put('/employee/notifications/:notificationId/read',
    authenticateEmployee,
    [
        param('notificationId').isInt().withMessage('Valid notification ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { notificationId } = req.params;
            const employeeId = req.employeeId;
            
            // Mock notification read since employee dashboard service was removed
            const result = {
                success: true,
                message: 'Notification marked as read'
            };

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            logger.error('Failed to mark notification as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read',
                details: error.message
            });
        }
    }
);

/**
 * @route GET /api/workflow/config
 * @desc Get workflow configuration
 * @access Public
 */
router.get('/config', async (req, res) => {
    try {
        const workflowConfig = require('../middleware/config/workflow-config.json');
        
        // Return sanitized config (remove sensitive information)
        const publicConfig = {
            workflow_version: workflowConfig.workflow_version,
            workflow_phases: {
                automated_phase: {
                    stages: workflowConfig.workflow_phases.automated_phase.stages,
                    description: workflowConfig.workflow_phases.automated_phase.description
                },
                manual_phase: {
                    stages: workflowConfig.workflow_phases.manual_phase.stages,
                    description: workflowConfig.workflow_phases.manual_phase.description
                }
            },
            stage_descriptions: workflowConfig.stage_descriptions
        };

        res.status(200).json({
            success: true,
            data: publicConfig
        });

    } catch (error) {
        logger.error('Failed to get workflow config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow config',
            details: error.message
        });
    }
});

/**
 * @route GET /api/workflow/stats
 * @desc Get workflow statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getWorkflowStats();
        
        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Failed to get workflow stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow stats',
            details: error.message
        });
    }
});

/**
 * @route GET /api/employee/workload
 * @desc Get employee workload statistics
 * @access Employee
 */
router.get('/employee/workload',
    authenticateEmployee,
    async (req, res) => {
        try {
            const employeeId = req.employeeId;
            
            const workloadStats = await getEmployeeWorkloadStats(employeeId);
            
            res.status(200).json({
                success: true,
                data: workloadStats
            });

        } catch (error) {
            logger.error('Failed to get employee workload:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get employee workload',
                details: error.message
            });
        }
    }
);

// Helper functions

async function getWorkflowStatus(workflowId) {
    try {
        const db = require('../middleware/config/database');
        
        const query = `
            SELECT 
                wt.workflow_id,
                wt.workflow_version,
                wt.current_phase,
                wt.status,
                wt.created_at,
                wt.updated_at,
                wt.manual_phase_started_at,
                wt.assigned_employee_id,
                wt.assigned_employee_name,
                wt.application_data->>'$.personal_info.first_name' as first_name,
            wt.application_data->>'$.personal_info.last_name' as last_name,
            (wt.application_data->>'$.loan_request.requested_amount')::numeric as loan_amount,
                (
                    SELECT COUNT(*) 
                    FROM workflow_stage_tracking wst 
                    WHERE wst.workflow_id = wt.workflow_id AND wst.status = 'completed'
                ) as completed_automated_stages,
                (
                    SELECT COUNT(*) 
                    FROM manual_stage_tracking mst 
                    WHERE mst.workflow_id = wt.workflow_id AND mst.status = 'completed'
                ) as completed_manual_stages
            FROM workflow_tracking wt
            WHERE wt.workflow_id = ?
        `;

        const result = await db.query(query, [workflowId]);
        const rows = result.rows;
        
        if (rows.length === 0) {
            return null;
        }

        const workflow = rows[0];
        
        return {
            workflowId: workflow.workflow_id,
            workflowVersion: workflow.workflow_version,
            currentPhase: workflow.current_phase,
            status: workflow.status,
            applicantName: `${workflow.first_name || ''} ${workflow.last_name || ''}`.trim(),
            loanAmount: parseFloat(workflow.loan_amount) || 0,
            createdAt: workflow.created_at,
            updatedAt: workflow.updated_at,
            manualPhaseStartedAt: workflow.manual_phase_started_at,
            assignedEmployee: workflow.assigned_employee_id ? {
                id: workflow.assigned_employee_id,
                name: workflow.assigned_employee_name
            } : null,
            progress: {
                automatedStagesCompleted: workflow.completed_automated_stages,
                manualStagesCompleted: workflow.completed_manual_stages
            },
            timeline: await getWorkflowTimeline(workflowId)
        };

    } catch (error) {
        logger.error('Failed to get workflow status from database:', error);
        return null;
    }
}

async function getWorkflowTimeline(workflowId) {
    try {
        const db = require('../middleware/config/database');
        
        const timelineEvents = [];

        // Get automated stage events
        const automatedQuery = `
            SELECT 'automated' as phase, stage_name, status, updated_at
            FROM workflow_stage_tracking 
            WHERE workflow_id = ?
            ORDER BY updated_at ASC
        `;

        const automatedResult = await db.query(automatedQuery, [workflowId]);
        const automatedRows = automatedResult.rows;
        automatedRows.forEach(row => {
            timelineEvents.push({
                phase: 'automated',
                stage: row.stage_name,
                status: row.status,
                timestamp: row.updated_at,
                description: `${row.stage_name.replace('-', ' ')} ${row.status}`
            });
        });

        // Get manual stage events
        const manualQuery = `
            SELECT 'manual' as phase, stage_name, status, updated_at, employee_id
            FROM manual_stage_tracking 
            WHERE workflow_id = ?
            ORDER BY updated_at ASC
        `;

        const manualResult = await db.query(manualQuery, [workflowId]);
        const manualRows = manualResult.rows;
        manualRows.forEach(row => {
            timelineEvents.push({
                phase: 'manual',
                stage: row.stage_name,
                status: row.status,
                timestamp: row.updated_at,
                employeeId: row.employee_id,
                description: `${row.stage_name.replace('-', ' ')} ${row.status} by employee`
            });
        });

        // Sort by timestamp
        timelineEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return timelineEvents;

    } catch (error) {
        logger.error('Failed to get workflow timeline:', error);
        return [];
    }
}

async function getWorkflowStats() {
    try {
        const db = require('../middleware/config/database');
        
        const query = `
            SELECT 
                COUNT(*) as total_workflows,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN current_phase = 'automated' THEN 1 END) as in_automated_phase,
                COUNT(CASE WHEN current_phase = 'manual' THEN 1 END) as in_manual_phase,
                AVG(CASE WHEN status IN ('completed', 'failed') 
                    THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_completion_hours,
                COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_started,
                COUNT(CASE WHEN DATE(updated_at) = CURRENT_DATE AND status IN ('completed', 'failed') THEN 1 END) as today_completed
            FROM workflow_tracking
            WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        `;

        const result = await db.query(query);
        const rows = result.rows;
        const stats = rows[0] || {};

        const successRate = (stats.completed + stats.failed) > 0 
            ? (stats.completed / (stats.completed + stats.failed) * 100).toFixed(1)
            : 0;

        return {
            totalWorkflows: stats.total_workflows || 0,
            inProgress: stats.in_progress || 0,
            completed: stats.completed || 0,
            failed: stats.failed || 0,
            inAutomatedPhase: stats.in_automated_phase || 0,
            inManualPhase: stats.in_manual_phase || 0,
            successRate: `${successRate}%`,
            averageCompletionTime: stats.avg_completion_hours 
                ? `${Math.round(stats.avg_completion_hours)} hours`
                : 'N/A',
            todayStarted: stats.today_started || 0,
            todayCompleted: stats.today_completed || 0
        };

    } catch (error) {
        logger.error('Failed to get workflow stats from database:', error);
        return {
            totalWorkflows: 0,
            inProgress: 0,
            completed: 0,
            failed: 0,
            successRate: '0%',
            averageCompletionTime: 'N/A'
        };
    }
}

async function getEmployeeWorkloadStats(employeeId) {
    try {
        const db = require('../middleware/config/database');
        
        const query = `
            SELECT 
                COUNT(CASE WHEN ea.status IN ('assigned', 'in_progress') THEN 1 END) as active_assignments,
                COUNT(CASE WHEN wt.status = 'completed' THEN 1 END) as completed_assignments,
                AVG(CASE WHEN wt.status IN ('completed', 'failed') 
                    THEN EXTRACT(EPOCH FROM (wt.updated_at - ea.assigned_at))/3600 END) as avg_processing_hours,
                COUNT(CASE WHEN DATE(ea.assigned_at) = CURRENT_DATE THEN 1 END) as today_assigned,
                 COUNT(CASE WHEN DATE(wt.updated_at) = CURRENT_DATE AND wt.status IN ('completed', 'failed') THEN 1 END) as today_completed,
                MAX(e.max_concurrent_applications) as max_capacity
            FROM employee_assignments ea
            JOIN workflow_tracking wt ON ea.workflow_id = wt.workflow_id
            JOIN employees e ON ea.employee_id = e.id
            WHERE ea.employee_id = ?
              AND ea.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        `;

        const result = await db.query(query, [employeeId]);
        const rows = result.rows;
        const stats = rows[0] || {};

        const utilizationRate = stats.max_capacity > 0 
            ? (stats.active_assignments / stats.max_capacity * 100).toFixed(1)
            : 0;

        return {
            activeAssignments: stats.active_assignments || 0,
            maxCapacity: stats.max_capacity || 0,
            utilizationRate: `${utilizationRate}%`,
            completedAssignments: stats.completed_assignments || 0,
            averageProcessingTime: stats.avg_processing_hours 
                ? `${Math.round(stats.avg_processing_hours)} hours`
                : 'N/A',
            todayAssigned: stats.today_assigned || 0,
            todayCompleted: stats.today_completed || 0
        };

    } catch (error) {
        logger.error('Failed to get employee workload stats:', error);
        return {
            activeAssignments: 0,
            maxCapacity: 0,
            utilizationRate: '0%',
            completedAssignments: 0,
            averageProcessingTime: 'N/A',
            todayAssigned: 0,
            todayCompleted: 0
        };
    }
}

// Error handling middleware
router.use((error, req, res, next) => {
    logger.error('Dual-phase workflow route error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

module.exports = router;