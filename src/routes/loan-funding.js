/**
 * Loan Funding Routes (Stage 7)
 */

const express = require('express');
const LoanFundingController = require('../controllers/loan-funding');

const router = express.Router();
const loanFundingController = new LoanFundingController();

/**
 * @route POST /api/loan-funding/:applicationNumber
 * @desc Process loan funding (Stage 7)
 * @access Public
 */
router.post('/:applicationNumber', async (req, res) => {
    await loanFundingController.processLoanFunding(req, res);
});

/**
 * @route GET /api/loan-funding/:applicationNumber/status
 * @desc Get loan funding status
 * @access Public
 */
router.get('/:applicationNumber/status', async (req, res) => {
    await loanFundingController.getLoanFundingStatus(req, res);
});

module.exports = router;