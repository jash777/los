/**
 * Automated Workflow Routes
 * Routes for automated processing of stages 3-7
 */

const express = require('express');
const AutomatedWorkflowController = require('../controllers/automated-workflow');

const router = express.Router();
const automatedWorkflowController = new AutomatedWorkflowController();

/**
 * @swagger
 * /api/automated-workflow/start/{applicationNumber}:
 *   post:
 *     summary: Start automated processing workflow
 *     description: Initiates automated processing of stages 3-7 for an application that has completed Stage 2
 *     tags: [Automated Workflow]
 *     parameters:
 *       - in: path
 *         name: applicationNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The application number to process
 *     responses:
 *       200:
 *         description: Automated processing completed successfully or application was rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     application_number:
 *                       type: string
 *                     workflow_status:
 *                       type: string
 *                       enum: [approved, rejected, error]
 *                     processing_time_ms:
 *                       type: number
 *                     stages_processed:
 *                       type: number
 *                     total_stages:
 *                       type: number
 *                     stage_results:
 *                       type: array
 *                     error_message:
 *                       type: string
 *                 request_id:
 *                   type: string
 *       400:
 *         description: Bad request - missing application number
 *       500:
 *         description: Internal server error
 */
router.post('/start/:applicationNumber', async (req, res) => {
    await automatedWorkflowController.startAutomatedProcessing(req, res);
});

/**
 * @swagger
 * /api/automated-workflow/status/{applicationNumber}:
 *   get:
 *     summary: Get workflow status
 *     description: Get the current status of the automated workflow for an application
 *     tags: [Automated Workflow]
 *     parameters:
 *       - in: path
 *         name: applicationNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The application number to check
 *     responses:
 *       200:
 *         description: Workflow status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     application_number:
 *                       type: string
 *                     workflow_status:
 *                       type: string
 *                       enum: [not_started, ready_to_start, in_progress, completed, rejected]
 *                     current_stage:
 *                       type: string
 *                     current_status:
 *                       type: string
 *                     workflow_events:
 *                       type: array
 *                     stage_progress:
 *                       type: number
 *                     estimated_completion_time:
 *                       type: string
 *                 request_id:
 *                   type: string
 *       400:
 *         description: Bad request - missing application number
 *       500:
 *         description: Internal server error
 */
router.get('/status/:applicationNumber', async (req, res) => {
    await automatedWorkflowController.getWorkflowStatus(req, res);
});

/**
 * @swagger
 * /api/automated-workflow/trigger:
 *   post:
 *     summary: Trigger automated processing after Stage 2
 *     description: Automatically triggered when Stage 2 is completed and approved
 *     tags: [Automated Workflow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicationNumber:
 *                 type: string
 *                 description: The application number that completed Stage 2
 *             required:
 *               - applicationNumber
 *     responses:
 *       202:
 *         description: Automated processing has been initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     application_number:
 *                       type: string
 *                     status:
 *                       type: string
 *                     estimated_completion:
 *                       type: string
 *                 request_id:
 *                   type: string
 *       400:
 *         description: Bad request - missing application number
 *       500:
 *         description: Internal server error
 */
router.post('/trigger', async (req, res) => {
    await automatedWorkflowController.triggerAfterStage2(req, res);
});

module.exports = router;