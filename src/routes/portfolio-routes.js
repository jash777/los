/**
 * Portfolio Routes
 * API endpoints for portfolio management and co-lending
 */

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio-controller');

/**
 * Portfolio Management Routes
 */

// Get Portfolio Overview
router.get('/overview', portfolioController.getPortfolioOverview);

// Update Portfolio Limit
router.put('/limit', portfolioController.updatePortfolioLimit);

// Get Portfolio History
router.get('/history', portfolioController.getPortfolioHistory);

// Get Portfolio Analytics
router.get('/analytics', portfolioController.getPortfolioAnalytics);

/**
 * Co-lending Management Routes
 */

// Get Co-lending Configuration
router.get('/co-lending/config', portfolioController.getCoLendingConfig);

// Update Co-lending Configuration
router.put('/co-lending/config', portfolioController.updateCoLendingConfig);

/**
 * Bank Accounts Management Routes
 */

// Get Bank Accounts
router.get('/bank-accounts', portfolioController.getBankAccounts);

// Add Bank Account
router.post('/bank-accounts', portfolioController.addBankAccount);

// Update Bank Account Balance
router.put('/bank-accounts/:account_id/balance', portfolioController.updateBankAccountBalance);

module.exports = router;
