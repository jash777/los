/**
 * Quality Check Routes (Stage 6)
 */

const express = require('express');
const QualityCheckController = require('../controllers/quality-check');

const router = express.Router();
const qualityCheckController = new QualityCheckController();

/**
 * @route POST /api/quality-check/:applicationNumber
 * @desc Process quality check (Stage 6)
 * @access Public
 */
router.post('/process/:applicationNumber', async (req, res) => {
    await qualityCheckController.processQualityCheck(req, res);
});

/**
 * @route POST /api/quality-check/:applicationNumber
 * @desc Process quality check (Stage 6) - Legacy endpoint
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await qualityCheckController.processQualityCheck(req, res);
});

/**
 * @route GET /api/quality-check/:applicationNumber/status
 * @desc Get quality check status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await qualityCheckController.getQualityCheckStatus(req, res);
});

module.exports = router;