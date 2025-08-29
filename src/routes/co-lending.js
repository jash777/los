/**
 * Co-Lending Routes
 * Routes for co-lending partnerships, ratios, and distribution management
 */

const express = require('express');
const router = express.Router();
const coLendingController = require('../controllers/co-lending-controller');
const logger = require('../utils/logger');

// Middleware to log co-lending requests
router.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || `colending_${Date.now()}`;
    req.headers['x-request-id'] = requestId;
    logger.info(`[${requestId}] Co-Lending API Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Partner Management Routes
/**
 * @route   GET /api/co-lending/partners
 * @desc    Get all co-lending partners
 * @access  Public
 * @query   type (bank|nbfc|fintech), status (active|inactive|suspended)
 */
router.get('/partners', coLendingController.getPartners);

/**
 * @route   POST /api/co-lending/partners
 * @desc    Create new co-lending partner
 * @access  Public
 */
router.post('/partners', coLendingController.createPartner);

/**
 * @route   PUT /api/co-lending/partners/:partnerId
 * @desc    Update co-lending partner
 * @access  Public
 */
router.put('/partners/:partnerId', coLendingController.updatePartner);

// Ratio Management Routes
/**
 * @route   GET /api/co-lending/ratios
 * @desc    Get all co-lending ratios and rules
 * @access  Public
 */
router.get('/ratios', coLendingController.getRatios);

/**
 * @route   POST /api/co-lending/ratios
 * @desc    Create new co-lending ratio rule
 * @access  Public
 */
router.post('/ratios', coLendingController.createRatio);

/**
 * @route   PUT /api/co-lending/ratios/:ratioId
 * @desc    Update co-lending ratio rule
 * @access  Public
 */
router.put('/ratios/:ratioId', coLendingController.updateRatio);

// Transaction Management Routes
/**
 * @route   POST /api/co-lending/optimal-arrangement
 * @desc    Get optimal co-lending arrangement for a loan application
 * @access  Public
 */
router.post('/optimal-arrangement', coLendingController.getOptimalArrangement);

/**
 * @route   POST /api/co-lending/transactions
 * @desc    Create co-lending transaction
 * @access  Public
 */
router.post('/transactions', coLendingController.createTransaction);

/**
 * @route   GET /api/co-lending/transactions
 * @desc    Get co-lending transactions
 * @access  Public
 * @query   status, application_number, limit, offset
 */
router.get('/transactions', coLendingController.getTransactions);

/**
 * @route   POST /api/co-lending/process/:transactionId
 * @desc    Process distributed loan via bank APIs
 * @access  Public
 */
router.post('/process/:transactionId', coLendingController.processDistributedLoan);

// Analytics and Reporting Routes
/**
 * @route   GET /api/co-lending/analytics
 * @desc    Get co-lending analytics and metrics
 * @access  Public
 * @query   date_range (days)
 */
router.get('/analytics', coLendingController.getAnalytics);

/**
 * @route   GET /api/co-lending/portfolio
 * @desc    Get portfolio analytics for partners
 * @access  Public
 * @query   partner_id, partner_type
 */
router.get('/portfolio', coLendingController.getPortfolioAnalytics);

/**
 * @route   GET /api/co-lending/settlements
 * @desc    Get settlement tracking data
 * @access  Public
 * @query   transaction_id, settlement_type, status, limit, offset
 */
router.get('/settlements', coLendingController.getSettlements);

/**
 * @route   GET /api/co-lending/api-logs
 * @desc    Get API integration logs
 * @access  Public
 * @query   partner_id, transaction_id, limit, offset
 */
router.get('/api-logs', coLendingController.getAPILogs);

/**
 * @route   GET /api/co-lending/health
 * @desc    Health check for co-lending service
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'Co-Lending Management Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        features: {
            partner_management: true,
            ratio_management: true,
            transaction_processing: true,
            bank_api_integration: true,
            analytics_reporting: true,
            settlement_tracking: true
        },
        endpoints: {
            partners: {
                list: 'GET /api/co-lending/partners',
                create: 'POST /api/co-lending/partners',
                update: 'PUT /api/co-lending/partners/:partnerId'
            },
            ratios: {
                list: 'GET /api/co-lending/ratios',
                create: 'POST /api/co-lending/ratios',
                update: 'PUT /api/co-lending/ratios/:ratioId'
            },
            transactions: {
                optimal_arrangement: 'POST /api/co-lending/optimal-arrangement',
                create: 'POST /api/co-lending/transactions',
                list: 'GET /api/co-lending/transactions',
                process: 'POST /api/co-lending/process/:transactionId'
            },
            analytics: {
                overview: 'GET /api/co-lending/analytics',
                portfolio: 'GET /api/co-lending/portfolio',
                settlements: 'GET /api/co-lending/settlements',
                api_logs: 'GET /api/co-lending/api-logs'
            }
        }
    });
});

module.exports = router;
