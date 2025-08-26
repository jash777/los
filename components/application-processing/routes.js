/**
 * Application Processing Phase Routes
 * Defines API endpoints for the application processing phase
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ApplicationProcessingController = require('./controller');
const logger = require('../../middleware/utils/logger');

const router = express.Router();
const controller = new ApplicationProcessingController();

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        logger.warn(`[${requestId}] Validation errors in application processing`, {
            errors: errors.array(),
            body: req.body,
            params: req.params
        });

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
            phase: 'application-processing'
        });
    }
    next();
};

/**
 * Validation rules for processing application processing
 */
const validateProcessApplicationProcessing = [
    body('loan_application_id')
        .notEmpty()
        .withMessage('Loan application ID is required')
        .isString()
        .withMessage('Loan application ID must be a string')
        .matches(/^loanapp_\d+_[a-z0-9]+$/)
        .withMessage('Invalid loan application ID format'),
    
    body('applicant_data')
        .optional()
        .isObject()
        .withMessage('Applicant data must be an object'),
    
    body('applicant_data.additional_documents')
        .optional()
        .isArray()
        .withMessage('Additional documents must be an array'),
    
    body('applicant_data.additional_documents.*.type')
        .optional()
        .isIn(['identity', 'financial', 'employment', 'address', 'other'])
        .withMessage('Invalid document type'),
    
    body('applicant_data.additional_documents.*.name')
        .optional()
        .isString()
        .withMessage('Document name must be a string'),
    
    body('applicant_data.additional_documents.*.url')
        .optional()
        .isURL()
        .withMessage('Document URL must be valid'),
    
    body('applicant_data.verification_preferences')
        .optional()
        .isObject()
        .withMessage('Verification preferences must be an object'),
    
    body('applicant_data.verification_preferences.identity_method')
        .optional()
        .isIn(['automatic', 'manual', 'hybrid'])
        .withMessage('Invalid identity verification method'),
    
    body('applicant_data.verification_preferences.employment_method')
        .optional()
        .isIn(['automatic', 'manual', 'hybrid'])
        .withMessage('Invalid employment verification method'),
    
    body('applicant_data.verification_preferences.financial_method')
        .optional()
        .isIn(['automatic', 'manual', 'hybrid'])
        .withMessage('Invalid financial verification method'),
    
    body('verification_requests')
        .optional()
        .isArray()
        .withMessage('Verification requests must be an array'),
    
    body('verification_requests.*.type')
        .optional()
        .isIn(['identity', 'employment', 'financial', 'address'])
        .withMessage('Invalid verification request type'),
    
    body('verification_requests.*.priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Invalid verification request priority'),
    
    body('verification_requests.*.details')
        .optional()
        .isString()
        .withMessage('Verification request details must be a string'),
    
    handleValidationErrors
];

/**
 * Validation rules for getting application status
 */
const validateGetApplicationStatus = [
    param('applicationId')
        .notEmpty()
        .withMessage('Application ID is required')
        .isString()
        .withMessage('Application ID must be a string')
        .matches(/^appproc_\d+_[a-z0-9]+$/)
        .withMessage('Invalid application processing ID format'),
    
    handleValidationErrors
];

/**
 * Routes
 */

/**
 * @route POST /api/phases/application-processing/process
 * @desc Process application processing phase
 * @access Public
 */
router.post('/process', validateProcessApplicationProcessing, async (req, res) => {
    await controller.processApplicationProcessing(req, res);
});

/**
 * @route GET /api/phases/application-processing/status/:applicationId
 * @desc Get application processing status
 * @access Public
 */
router.get('/status/:applicationId', validateGetApplicationStatus, async (req, res) => {
    await controller.getApplicationStatus(req, res);
});

/**
 * @route GET /api/phases/application-processing/requirements
 * @desc Get application processing requirements
 * @access Public
 */
router.get('/requirements', async (req, res) => {
    await controller.getRequirements(req, res);
});

/**
 * @route GET /api/phases/application-processing/health
 * @desc Health check for application processing phase
 * @access Public
 */
router.get('/health', async (req, res) => {
    await controller.healthCheck(req, res);
});

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    
    logger.error(`[${requestId}] Application processing route error`, {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        success: false,
        message: 'Internal server error in application processing phase',
        error: error.message,
        phase: 'application-processing',
        requestId
    });
});

module.exports = router;