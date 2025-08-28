/**
 * Pre-Qualification Routes
 * Clean, efficient routing for pre-qualification endpoints
 */

const express = require('express');
const PreQualificationController = require('../controllers/pre-qualification');
const logger = require('../utils/logger');

const router = express.Router();
const controller = new PreQualificationController();

// Middleware for request logging
router.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    
    logger.info(`[${requestId}] Pre-qualification API: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    
    next();
});

/**
 * @swagger
 * /api/pre-qualification/process:
 *   post:
 *     summary: Process optimized pre-qualification request (Stage 1)
 *     description: Optimized Stage 1 - Quick pre-qualification with minimal essential data collection (2-3 minutes)
 *     tags: [Pre-Qualification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - phone
 *               - email
 *               - pan_number
 *               - date_of_birth
 *               - requested_loan_amount
 *               - loan_purpose
 *               - employment_type
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Full name as per official documents
 *                 example: "Rajesh Kumar Sharma"
 *               phone:
 *                 type: string
 *                 pattern: "^[6-9][0-9]{9}$"
 *                 description: Valid Indian mobile number (10 digits)
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address for communication
 *                 example: "rajesh.sharma@example.com"
 *               pan_number:
 *                 type: string
 *                 pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
 *                 description: Valid PAN number for identity verification
 *                 example: "ABCDE1234F"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (age must be 21-65 years)
 *                 example: "1985-06-15"
 *               requested_loan_amount:
 *                 type: number
 *                 minimum: 50000
 *                 maximum: 5000000
 *                 description: Loan amount required (₹50K - ₹50L)
 *                 example: 500000
 *               loan_purpose:
 *                 type: string
 *                 enum: [personal, home_improvement, medical, education, business, debt_consolidation, travel, wedding, other]
 *                 description: Purpose of the loan
 *                 example: "personal"
 *               employment_type:
 *                 type: string
 *                 enum: [salaried, self_employed, business_owner, professional, retired]
 *                 description: Type of employment
 *                 example: "salaried"
 *     responses:
 *       200:
 *         description: Pre-qualification processed successfully
 *       400:
 *         description: Validation failed or application rejected
 *       500:
 *         description: Internal server error
 */
router.post('/process', async (req, res) => {
    await controller.processPreQualification(req, res);
});

/**
 * @swagger
 * /api/pre-qualification/status/{applicationNumber}:
 *   get:
 *     summary: Get application status
 *     description: Retrieve complete application status and history
 *     tags: [Pre-Qualification]
 *     parameters:
 *       - in: path
 *         name: applicationNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Application number
 *         example: "EL_1756275924476_ixqhqhqhq"
 *     responses:
 *       200:
 *         description: Application status retrieved successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.get('/status/:applicationNumber', async (req, res) => {
    await controller.getApplicationStatus(req, res);
});

/**
 * @swagger
 * /api/pre-qualification/requirements:
 *   get:
 *     summary: Get pre-qualification requirements
 *     description: Retrieve detailed requirements and specifications
 *     tags: [Pre-Qualification]
 *     responses:
 *       200:
 *         description: Requirements retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/requirements', async (req, res) => {
    await controller.getRequirements(req, res);
});

/**
 * @swagger
 * /api/pre-qualification/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the pre-qualification service
 *     tags: [Pre-Qualification]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       500:
 *         description: Service is unhealthy
 */
router.get('/health', async (req, res) => {
    await controller.healthCheck(req, res);
});

// Error handling middleware
router.use((error, req, res, next) => {
    const requestId = req.headers['x-request-id'];
    
    logger.error(`[${requestId}] Pre-qualification route error:`, {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred in the pre-qualification service',
        requestId,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;