/**
 * PDF Routes
 * Routes for generating and serving loan application PDFs
 */

const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf-controller');
const logger = require('../utils/logger');

// Middleware to log PDF requests
router.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || `pdf_${Date.now()}`;
    req.headers['x-request-id'] = requestId;
    logger.info(`[${requestId}] PDF API Request: ${req.method} ${req.originalUrl}`);
    next();
});

/**
 * @route   GET /api/pdf/list
 * @desc    List all available application PDFs
 * @access  Public
 */
router.get('/list', pdfController.listApplicationPDFs);

/**
 * @route   POST /api/pdf/generate/:applicationNumber
 * @desc    Generate PDF for a specific loan application
 * @access  Public
 */
router.post('/generate/:applicationNumber', pdfController.generateApplicationPDF);

/**
 * @route   GET /api/pdf/view/:applicationNumber
 * @desc    View PDF for a specific loan application (inline)
 * @access  Public
 */
router.get('/view/:applicationNumber', pdfController.getApplicationPDF);

/**
 * @route   GET /api/pdf/download/:applicationNumber
 * @desc    Download PDF for a specific loan application
 * @access  Public
 */
router.get('/download/:applicationNumber', pdfController.downloadApplicationPDF);

/**
 * @route   POST /api/pdf/regenerate/:applicationNumber
 * @desc    Regenerate PDF for a specific loan application
 * @access  Public
 */
router.post('/regenerate/:applicationNumber', pdfController.regenerateApplicationPDF);

/**
 * @route   GET /api/pdf/health
 * @desc    Health check for PDF service
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'PDF Generation Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            list: 'GET /api/pdf/list',
            generate: 'POST /api/pdf/generate/:applicationNumber',
            view: 'GET /api/pdf/view/:applicationNumber',
            download: 'GET /api/pdf/download/:applicationNumber',
            regenerate: 'POST /api/pdf/regenerate/:applicationNumber'
        }
    });
});

module.exports = router;
