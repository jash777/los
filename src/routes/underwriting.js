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

module.exports = router;