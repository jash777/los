/**
 * Manual Workflow Routes
 * API endpoints for manual approval workflow
 */

const express = require('express');
const router = express.Router();
const manualWorkflowController = require('../controllers/manual-workflow-controller');

/**
 * @swagger
 * tags:
 *   name: Manual Workflow
 *   description: Manual approval workflow management
 */

/**
 * @swagger
 * /api/manual-workflow/reviews/pending:
 *   get:
 *     summary: Get pending manual reviews
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: query
 *         name: reviewer_id
 *         schema:
 *           type: string
 *         description: Filter by specific reviewer ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of reviews to return
 *     responses:
 *       200:
 *         description: List of pending reviews
 *       500:
 *         description: Server error
 */
router.get('/reviews/pending', manualWorkflowController.getPendingReviews);

/**
 * @swagger
 * /api/manual-workflow/reviewers/workload:
 *   get:
 *     summary: Get reviewer workload information
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: query
 *         name: reviewer_id
 *         schema:
 *           type: string
 *         description: Filter by specific reviewer ID
 *     responses:
 *       200:
 *         description: Reviewer workload data
 *       500:
 *         description: Server error
 */
router.get('/reviewers/workload', manualWorkflowController.getReviewerWorkload);

/**
 * @swagger
 * /api/manual-workflow/applications/{application_number}/stages/{stage_name}/assign:
 *   post:
 *     summary: Assign application to reviewer
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stage_name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewer_id
 *             properties:
 *               reviewer_id:
 *                 type: string
 *               assigned_by:
 *                 type: string
 *                 default: admin
 *     responses:
 *       200:
 *         description: Assignment successful
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/applications/:application_number/stages/:stage_name/assign', manualWorkflowController.assignToReviewer);

/**
 * @swagger
 * /api/manual-workflow/applications/{application_number}/stages/{stage_name}/decide:
 *   post:
 *     summary: Process manual decision
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stage_name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewer_id
 *               - decision
 *               - decision_reason
 *             properties:
 *               reviewer_id:
 *                 type: string
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected, conditional_approval, refer_back, escalate]
 *               decision_reason:
 *                 type: string
 *               conditions:
 *                 type: string
 *               recommended_terms:
 *                 type: object
 *               internal_notes:
 *                 type: string
 *               time_spent_minutes:
 *                 type: integer
 *               decision_score:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Decision processed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/applications/:application_number/stages/:stage_name/decide', manualWorkflowController.processManualDecision);

/**
 * @swagger
 * /api/manual-workflow/applications/{application_number}/stages/{stage_name}/queue:
 *   post:
 *     summary: Add application to manual review queue
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stage_name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review_type
 *             properties:
 *               review_type:
 *                 type: string
 *                 enum: [underwriting, verification, final_approval, quality_check]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               assigned_to:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to queue successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/applications/:application_number/stages/:stage_name/queue', manualWorkflowController.addToQueue);

/**
 * @swagger
 * /api/manual-workflow/applications/{application_number}/review:
 *   get:
 *     summary: Get application details for manual review
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application details for review
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.get('/applications/:application_number/review', manualWorkflowController.getApplicationForReview);

/**
 * @swagger
 * /api/manual-workflow/applications/{application_number}/stages/{stage_name}/comments:
 *   post:
 *     summary: Add review comment
 *     tags: [Manual Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stage_name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewer_id
 *               - comment
 *             properties:
 *               reviewer_id:
 *                 type: string
 *               comment:
 *                 type: string
 *               comment_type:
 *                 type: string
 *                 enum: [note, question, concern, recommendation, internal]
 *                 default: note
 *               is_internal:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/applications/:application_number/stages/:stage_name/comments', manualWorkflowController.addReviewComment);

/**
 * @swagger
 * /api/manual-workflow/dashboard:
 *   get:
 *     summary: Get manual workflow dashboard data
 *     tags: [Manual Workflow]
 *     responses:
 *       200:
 *         description: Dashboard data
 *       500:
 *         description: Server error
 */
router.get('/dashboard', manualWorkflowController.getDashboardData);

module.exports = router;
