/**
 * Dashboard-Driven Workflow Routes
 * API endpoints for employee-managed loan processing workflow
 */

const express = require('express');
const router = express.Router();
const dashboardWorkflowController = require('../controllers/dashboard-workflow-controller');

/**
 * @swagger
 * tags:
 *   name: Dashboard Workflow
 *   description: Employee-managed loan processing workflow
 */

/**
 * @swagger
 * /api/dashboard-workflow/applications:
 *   post:
 *     summary: Create new dashboard-driven application
 *     tags: [Dashboard Workflow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicant_name
 *               - email
 *               - phone
 *               - pan_number
 *               - loan_amount
 *               - loan_purpose
 *             properties:
 *               applicant_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               pan_number:
 *                 type: string
 *               aadhar_number:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               loan_amount:
 *                 type: number
 *               loan_purpose:
 *                 type: string
 *               employment_type:
 *                 type: string
 *                 enum: [salaried, self_employed, business_owner, professional, retired]
 *               monthly_income:
 *                 type: number
 *               company_name:
 *                 type: string
 *               designation:
 *                 type: string
 *               priority_level:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               created_by:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/applications', dashboardWorkflowController.createDashboardApplication);

/**
 * @swagger
 * /api/dashboard-workflow/applications/{application_number}/review:
 *   get:
 *     summary: Get application for dashboard review
 *     tags: [Dashboard Workflow]
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
router.get('/applications/:application_number/review', dashboardWorkflowController.getApplicationForReview);

/**
 * @swagger
 * /api/dashboard-workflow/applications/{application_number}/stages/{stage_name}/process:
 *   post:
 *     summary: Process stage in dashboard workflow
 *     tags: [Dashboard Workflow]
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
 *               - decision
 *               - decision_reason
 *               - employee_id
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected, conditional, refer_manual, escalate]
 *               decision_reason:
 *                 type: string
 *               employee_id:
 *                 type: string
 *               next_stage:
 *                 type: string
 *               stage_data:
 *                 type: object
 *               conditions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stage processed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/applications/:application_number/stages/:stage_name/process', dashboardWorkflowController.processStage);

/**
 * @swagger
 * /api/dashboard-workflow/applications/{application_number}/profile:
 *   put:
 *     summary: Update applicant profile
 *     tags: [Dashboard Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               primary_email:
 *                 type: string
 *               primary_mobile:
 *                 type: string
 *               employment_type:
 *                 type: string
 *               monthly_income:
 *                 type: number
 *               company_name:
 *                 type: string
 *               designation:
 *                 type: string
 *               cibil_score:
 *                 type: integer
 *               risk_category:
 *                 type: string
 *               updated_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put('/applications/:application_number/profile', dashboardWorkflowController.updateApplicantProfile);

/**
 * @swagger
 * /api/dashboard-workflow/applications/{application_number}/workflow:
 *   patch:
 *     summary: Switch workflow type
 *     tags: [Dashboard Workflow]
 *     parameters:
 *       - in: path
 *         name: application_number
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
 *               - new_workflow_type
 *               - reason
 *               - employee_id
 *             properties:
 *               new_workflow_type:
 *                 type: string
 *                 enum: [los_automated, dashboard_driven, hybrid]
 *               reason:
 *                 type: string
 *               employee_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workflow type switched successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.patch('/applications/:application_number/workflow', dashboardWorkflowController.switchWorkflowType);

/**
 * @swagger
 * /api/dashboard-workflow/dashboard:
 *   get:
 *     summary: Get dual workflow dashboard
 *     tags: [Dashboard Workflow]
 *     responses:
 *       200:
 *         description: Dashboard data for both workflows
 *       500:
 *         description: Server error
 */
router.get('/dashboard', dashboardWorkflowController.getDualWorkflowDashboard);

/**
 * @swagger
 * /api/dashboard-workflow/workflows/{workflow_type}/applications:
 *   get:
 *     summary: Get applications by workflow type
 *     tags: [Dashboard Workflow]
 *     parameters:
 *       - in: path
 *         name: workflow_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [los_automated, dashboard_driven, hybrid]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of applications
 *       500:
 *         description: Server error
 */
router.get('/workflows/:workflow_type/applications', dashboardWorkflowController.getApplicationsByWorkflow);

module.exports = router;
