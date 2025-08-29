/**
 * Application Processing Routes (Stage 2)
 */

const express = require('express');
const ApplicationProcessingController = require('../controllers/application-processing');

const router = express.Router();
const applicationProcessingController = new ApplicationProcessingController();

/**
 * @route POST /api/application-processing/process/:applicationNumber
 * @desc Process loan application (Stage 3)
 * @access Public
 */
router.post('/process/:applicationNumber', async (req, res) => {
    await applicationProcessingController.processApplication(req, res);
});

/**
 * @route POST /api/application-processing/:applicationNumber
 * @desc Process loan application (Stage 3) - Legacy endpoint
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await applicationProcessingController.processApplication(req, res);
});

/**
 * @route GET /api/application-processing/:applicationNumber/status
 * @desc Get application processing status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await applicationProcessingController.getProcessingStatus(req, res);
});

module.exports = router;