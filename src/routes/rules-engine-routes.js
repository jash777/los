/**
 * Rules Engine Routes
 * API endpoints to expose rules engine logic and evaluation results
 */

const express = require('express');
const router = express.Router();
const rulesEngineController = require('../controllers/rules-engine-controller');

/**
 * @swagger
 * tags:
 *   name: Rules Engine
 *   description: Rules engine logic and evaluation
 */

/**
 * @swagger
 * /api/rules-engine:
 *   get:
 *     summary: Get complete rules engine configuration
 *     tags: [Rules Engine]
 *     responses:
 *       200:
 *         description: Complete rules engine configuration
 *       500:
 *         description: Server error
 */
router.get('/', rulesEngineController.getRulesEngine);

/**
 * @swagger
 * /api/rules-engine/endpoints:
 *   get:
 *     summary: Get available rules engine endpoints
 *     tags: [Rules Engine]
 *     responses:
 *       200:
 *         description: List of available endpoints
 *       500:
 *         description: Server error
 */
router.get('/endpoints', rulesEngineController.getRulesEndpoints);

/**
 * @swagger
 * /api/rules-engine/stages/{stage_name}:
 *   get:
 *     summary: Get rules for a specific stage
 *     tags: [Rules Engine]
 *     parameters:
 *       - in: path
 *         name: stage_name
 *         required: true
 *         schema:
 *           type: string
 *         description: Stage name (e.g., stage_1_pre_qualification, stage_2_loan_application)
 *     responses:
 *       200:
 *         description: Stage-specific rules
 *       404:
 *         description: Stage not found
 *       500:
 *         description: Server error
 */
router.get('/stages/:stage_name', rulesEngineController.getStageRules);

/**
 * @swagger
 * /api/rules-engine/applications/{application_number}/evaluate:
 *   get:
 *     summary: Evaluate rules for an application
 *     tags: [Rules Engine]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Application number
 *       - in: query
 *         name: stage_name
 *         schema:
 *           type: string
 *         description: Specific stage to evaluate (optional, uses current stage if not provided)
 *     responses:
 *       200:
 *         description: Rules evaluation results
 *       404:
 *         description: Application or stage not found
 *       500:
 *         description: Server error
 */
router.get('/applications/:application_number/evaluate', rulesEngineController.evaluateRules);

/**
 * @swagger
 * /api/rules-engine/applications/{application_number}/history:
 *   get:
 *     summary: Get applied rules history for an application
 *     tags: [Rules Engine]
 *     parameters:
 *       - in: path
 *         name: application_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Application number
 *     responses:
 *       200:
 *         description: Applied rules history
 *       500:
 *         description: Server error
 */
router.get('/applications/:application_number/history', rulesEngineController.getAppliedRulesHistory);

/**
 * @swagger
 * /api/rules-engine/compare:
 *   get:
 *     summary: Compare current implementation with rules-engine.json
 *     tags: [Rules Engine]
 *     responses:
 *       200:
 *         description: Implementation comparison results
 *       500:
 *         description: Server error
 */
router.get('/compare', rulesEngineController.compareRulesImplementation);

module.exports = router;
