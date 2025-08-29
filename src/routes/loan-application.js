/**
 * Loan Application Routes (Stage 2)
 * Enhanced loan application processing with Indian market requirements
 */

const express = require('express');
const LoanApplicationController = require('../controllers/loan-application');

const router = express.Router();
const loanApplicationController = new LoanApplicationController();

/**
 * @route POST /api/loan-application/process/:applicationNumber
 * @desc Process comprehensive loan application (Stage 2)
 * @access Public
 */
router.post('/process/:applicationNumber', async (req, res) => {
    await loanApplicationController.processLoanApplication(req, res);
});

/**
 * @route POST /api/loan-application/:applicationNumber
 * @desc Process comprehensive loan application (Stage 2) - Legacy endpoint
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await loanApplicationController.processLoanApplication(req, res);
});

/**
 * @route GET /api/loan-application/:applicationNumber/status
 * @desc Get loan application processing status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await loanApplicationController.getLoanApplicationStatus(req, res);
});

/**
 * @route GET /api/loan-application/fields
 * @desc Get required fields for loan application
 * @access Public
 */
router.get('/fields', async (req, res) => {
    await loanApplicationController.getRequiredFields(req, res);
});

module.exports = router;