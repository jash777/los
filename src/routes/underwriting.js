/**
 * Underwriting Routes (Stage 3)
 */

const express = require('express');
const UnderwritingController = require('../controllers/underwriting');

const router = express.Router();
const underwritingController = new UnderwritingController();

/**
 * @route POST /api/underwriting/:applicationNumber
 * @desc Process underwriting (Stage 3)
 * @access Public
 */
router.post('/process/:applicationNumber', async (req, res) => {
    await underwritingController.processUnderwriting(req, res);
});

/**
 * @route POST /api/underwriting/:applicationNumber
 * @desc Process underwriting (Stage 4) - Legacy endpoint
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await underwritingController.processUnderwriting(req, res);
});

/**
 * @route GET /api/underwriting/:applicationNumber/status
 * @desc Get underwriting status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await underwritingController.getUnderwritingStatus(req, res);
});

/**
 * @route GET /api/underwriting/:applicationNumber/dashboard
 * @desc Get comprehensive underwriting dashboard data
 * @access Public
 */
router.get('/:applicationNumber/dashboard', async (req, res) => {
    await underwritingController.getUnderwritingDashboardData(req, res);
});

/**
 * @route POST /api/underwriting/:applicationNumber/decision
 * @desc Make manual underwriting decision (Approve/Reject/Review)
 * @access Public
 */
router.post('/:applicationNumber/decision', async (req, res) => {
    await underwritingController.makeManualDecision(req, res);
});

/**
 * @route GET /api/underwriting/pending
 * @desc Get applications pending underwriting review
 * @access Public
 */
router.get('/pending', async (req, res) => {
    await underwritingController.getPendingApplications(req, res);
});

module.exports = router;