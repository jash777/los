/**
 * Credit Decision Routes (Stage 4)
 */

const express = require('express');
const CreditDecisionController = require('../controllers/credit-decision');

const router = express.Router();
const creditDecisionController = new CreditDecisionController();

/**
 * @route POST /api/credit-decision/:applicationNumber
 * @desc Process credit decision (Stage 4)
 * @access Public
 */
router.post('/process/:applicationNumber', async (req, res) => {
    await creditDecisionController.processCreditDecision(req, res);
});

/**
 * @route POST /api/credit-decision/:applicationNumber
 * @desc Process credit decision (Stage 5) - Legacy endpoint
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await creditDecisionController.processCreditDecision(req, res);
});

/**
 * @route GET /api/credit-decision/:applicationNumber/status
 * @desc Get credit decision status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await creditDecisionController.getCreditDecisionStatus(req, res);
});

module.exports = router;