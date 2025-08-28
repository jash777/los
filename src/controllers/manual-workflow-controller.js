/**
 * Manual Workflow Controller
 * API endpoints for manual approval workflow
 */

const logger = require('../utils/logger');
const manualWorkflowService = require('../services/manual-workflow');
const databaseService = require('../database/service');

class ManualWorkflowController {
    
    /**
     * Get pending manual reviews
     */
    async getPendingReviews(req, res) {
        try {
            const { reviewer_id, limit = 20 } = req.query;
            const requestId = req.headers['x-request-id'] || `manual_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting pending reviews for reviewer: ${reviewer_id || 'all'}`);
            
            const reviews = await manualWorkflowService.getPendingReviews(reviewer_id, parseInt(limit));
            
            res.json({
                success: true,
                data: {
                    reviews,
                    total: reviews.length,
                    reviewer_id: reviewer_id || null
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting pending reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pending reviews',
                message: error.message
            });
        }
    }

    /**
     * Get reviewer workload
     */
    async getReviewerWorkload(req, res) {
        try {
            const { reviewer_id } = req.query;
            const requestId = req.headers['x-request-id'] || `workload_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting workload for reviewer: ${reviewer_id || 'all'}`);
            
            const workload = await manualWorkflowService.getReviewerWorkload(reviewer_id);
            
            res.json({
                success: true,
                data: {
                    workload,
                    total_reviewers: workload.length
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting reviewer workload:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get reviewer workload',
                message: error.message
            });
        }
    }

    /**
     * Assign application to reviewer
     */
    async assignToReviewer(req, res) {
        try {
            const { application_number, stage_name } = req.params;
            const { reviewer_id, assigned_by = 'admin' } = req.body;
            const requestId = req.headers['x-request-id'] || `assign_${Date.now()}`;
            
            logger.info(`[${requestId}] Assigning ${application_number} to reviewer ${reviewer_id}`);
            
            if (!reviewer_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Reviewer ID is required'
                });
            }
            
            const result = await manualWorkflowService.assignToReviewer(
                application_number, stage_name, reviewer_id, assigned_by
            );
            
            res.json({
                success: true,
                data: result,
                message: `Application ${application_number} assigned to reviewer ${reviewer_id}`,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error assigning to reviewer:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to assign to reviewer',
                message: error.message
            });
        }
    }

    /**
     * Process manual decision
     */
    async processManualDecision(req, res) {
        try {
            const { application_number, stage_name } = req.params;
            const { 
                reviewer_id, 
                decision, 
                decision_reason,
                conditions,
                recommended_terms,
                internal_notes,
                time_spent_minutes = 0,
                decision_score = 0
            } = req.body;
            
            const requestId = req.headers['x-request-id'] || `decision_${Date.now()}`;
            
            logger.info(`[${requestId}] Processing manual decision for ${application_number}: ${decision}`);
            
            // Validate required fields
            if (!reviewer_id || !decision || !decision_reason) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['reviewer_id', 'decision', 'decision_reason']
                });
            }
            
            const validDecisions = ['approved', 'rejected', 'conditional_approval', 'refer_back', 'escalate'];
            if (!validDecisions.includes(decision)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid decision',
                    valid_decisions: validDecisions
                });
            }
            
            const decisionData = {
                decision_reason,
                conditions,
                recommended_terms,
                internal_notes,
                time_spent_minutes: parseInt(time_spent_minutes),
                decision_score: parseInt(decision_score)
            };
            
            const result = await manualWorkflowService.processManualDecision(
                application_number, stage_name, reviewer_id, decision, decisionData
            );
            
            res.json({
                success: true,
                data: result,
                message: `Manual decision processed: ${decision}`,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error processing manual decision:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process manual decision',
                message: error.message
            });
        }
    }

    /**
     * Add application to manual review queue
     */
    async addToQueue(req, res) {
        try {
            const { application_number, stage_name } = req.params;
            const { 
                review_type, 
                priority = 'normal', 
                assigned_to = null 
            } = req.body;
            
            const requestId = req.headers['x-request-id'] || `queue_${Date.now()}`;
            
            logger.info(`[${requestId}] Adding ${application_number} to manual review queue`);
            
            if (!review_type) {
                return res.status(400).json({
                    success: false,
                    error: 'Review type is required'
                });
            }
            
            const validReviewTypes = ['underwriting', 'verification', 'final_approval', 'quality_check'];
            if (!validReviewTypes.includes(review_type)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid review type',
                    valid_types: validReviewTypes
                });
            }
            
            const result = await manualWorkflowService.addToManualReviewQueue(
                application_number, stage_name, review_type, priority, assigned_to
            );
            
            res.json({
                success: true,
                data: result,
                message: `Application ${application_number} added to manual review queue`,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error adding to manual review queue:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add to manual review queue',
                message: error.message
            });
        }
    }

    /**
     * Get application details for manual review
     */
    async getApplicationForReview(req, res) {
        try {
            const { application_number } = req.params;
            const requestId = req.headers['x-request-id'] || `review_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting application details for review: ${application_number}`);
            
            // Get complete application data
            const application = await databaseService.getCompleteApplication(application_number);
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            // Get manual review history
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            const [manualDecisions] = await connection.execute(
                'SELECT * FROM manual_decisions WHERE application_number = ? ORDER BY decided_at DESC',
                [application_number]
            );
            
            const [reviewComments] = await connection.execute(
                'SELECT * FROM review_comments WHERE application_number = ? ORDER BY created_at DESC',
                [application_number]
            );
            
            const [queueHistory] = await connection.execute(
                'SELECT * FROM manual_review_queue WHERE application_number = ? ORDER BY created_at DESC',
                [application_number]
            );
            
            connection.release();
            
            res.json({
                success: true,
                data: {
                    application,
                    manual_decisions: manualDecisions,
                    review_comments: reviewComments,
                    queue_history: queueHistory
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting application for review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get application details',
                message: error.message
            });
        }
    }

    /**
     * Add review comment
     */
    async addReviewComment(req, res) {
        try {
            const { application_number, stage_name } = req.params;
            const { 
                reviewer_id, 
                comment, 
                comment_type = 'note',
                is_internal = true 
            } = req.body;
            
            const requestId = req.headers['x-request-id'] || `comment_${Date.now()}`;
            
            logger.info(`[${requestId}] Adding review comment for ${application_number}`);
            
            if (!reviewer_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: 'Reviewer ID and comment are required'
                });
            }
            
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            await connection.execute(`
                INSERT INTO review_comments 
                (application_number, stage_name, reviewer_id, comment_type, comment, is_internal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [application_number, stage_name, reviewer_id, comment_type, comment, is_internal]);
            
            connection.release();
            
            res.json({
                success: true,
                message: 'Review comment added successfully',
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error adding review comment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add review comment',
                message: error.message
            });
        }
    }

    /**
     * Get manual workflow dashboard data
     */
    async getDashboardData(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `dashboard_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting manual workflow dashboard data`);
            
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            // Get queue statistics
            const [queueStats] = await connection.execute(`
                SELECT 
                    status,
                    priority,
                    review_type,
                    COUNT(*) as count
                FROM manual_review_queue 
                WHERE status IN ('pending', 'assigned', 'in_review')
                GROUP BY status, priority, review_type
                ORDER BY status, priority, review_type
            `);
            
            // Get reviewer performance
            const [reviewerStats] = await connection.execute(`
                SELECT 
                    r.employee_name,
                    r.role,
                    r.current_workload,
                    r.max_workload,
                    COUNT(md.id) as decisions_today,
                    AVG(md.time_spent_minutes) as avg_time_per_decision
                FROM reviewers r
                LEFT JOIN manual_decisions md ON r.employee_id = md.reviewer_id 
                    AND DATE(md.decided_at) = CURDATE()
                WHERE r.is_active = TRUE
                GROUP BY r.id
                ORDER BY r.role, r.employee_name
            `);
            
            // Get overdue items
            const [overdueItems] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM manual_review_queue 
                WHERE due_date < NOW() AND status IN ('pending', 'assigned', 'in_review')
            `);
            
            connection.release();
            
            res.json({
                success: true,
                data: {
                    queue_statistics: queueStats,
                    reviewer_performance: reviewerStats,
                    overdue_items: overdueItems[0].count,
                    timestamp: new Date().toISOString()
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting dashboard data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard data',
                message: error.message
            });
        }
    }
}

module.exports = new ManualWorkflowController();
