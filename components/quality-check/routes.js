const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const qualityCheckController = require('./controller');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for credit decision ID
const validateCreditDecisionId = [
    param('credit_decision_id')
        .isMongoId()
        .withMessage('Credit decision ID must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

// Validation rules for quality check ID
const validateQualityCheckId = [
    param('quality_check_id')
        .isMongoId()
        .withMessage('Quality check ID must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

// Validation rules for quality check processing
const validateQualityCheckData = [
    body('priority_level')
        .optional()
        .isIn(['standard', 'high', 'urgent'])
        .withMessage('Priority level must be one of: standard, high, urgent'),
    
    body('manual_review_required')
        .optional()
        .isBoolean()
        .withMessage('Manual review required must be a boolean'),
    
    body('reviewer_notes')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Reviewer notes must be a string with maximum 1000 characters'),
    
    body('additional_checks')
        .optional()
        .isArray()
        .withMessage('Additional checks must be an array'),
    
    body('additional_checks.*.type')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Additional check type must be a non-empty string with maximum 100 characters'),
    
    body('additional_checks.*.name')
        .optional()
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage('Additional check name must be a non-empty string with maximum 200 characters'),
    
    body('additional_checks.*.parameters')
        .optional()
        .isObject()
        .withMessage('Additional check parameters must be an object'),
    
    handleValidationErrors
];

// Validation rules for report format
const validateReportFormat = [
    query('format')
        .optional()
        .isIn(['json', 'pdf'])
        .withMessage('Report format must be either json or pdf'),
    handleValidationErrors
];

/**
 * @route POST /api/phases/quality-check/process/:credit_decision_id
 * @desc Process quality check for a credit decision
 * @access Private
 * @param {string} credit_decision_id - Credit Decision ID (MongoDB ObjectId)
 * @body {Object} checkData - Quality check data
 * @body {string} [checkData.priority_level] - Priority level (standard|high|urgent)
 * @body {boolean} [checkData.manual_review_required] - Force manual review
 * @body {string} [checkData.reviewer_notes] - Additional notes for reviewer
 * @body {Array} [checkData.additional_checks] - Additional custom checks
 * @returns {Object} Quality check processing result
 */
router.post('/process/:credit_decision_id', 
    validateCreditDecisionId,
    validateQualityCheckData,
    qualityCheckController.processQualityCheck
);

/**
 * @route GET /api/phases/quality-check/status/:quality_check_id
 * @desc Get quality check status and results
 * @access Private
 * @param {string} quality_check_id - Quality Check ID (MongoDB ObjectId)
 * @returns {Object} Quality check status and results
 */
router.get('/status/:quality_check_id',
    validateQualityCheckId,
    qualityCheckController.getQualityCheckStatus
);

/**
 * @route GET /api/phases/quality-check/report/:quality_check_id
 * @desc Generate quality check report
 * @access Private
 * @param {string} quality_check_id - Quality Check ID (MongoDB ObjectId)
 * @query {string} [format] - Report format (json|pdf)
 * @returns {Object} Quality check report
 */
router.get('/report/:quality_check_id',
    validateQualityCheckId,
    validateReportFormat,
    qualityCheckController.getQualityCheckReport
);

/**
 * @route GET /api/phases/quality-check/requirements
 * @desc Get quality check requirements and information
 * @access Public
 * @returns {Object} Quality check requirements, check types, compliance areas, and API documentation
 */
router.get('/requirements', qualityCheckController.getRequirements);

/**
 * @route GET /api/phases/quality-check/health
 * @desc Health check for quality check service
 * @access Public
 * @returns {Object} Service health status and metrics
 */
router.get('/health', qualityCheckController.healthCheck);

// Error handling middleware specific to quality check routes
router.use((error, req, res, next) => {
    console.error('Quality Check Route Error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Quality check validation failed',
            error: error.message
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format provided',
            error: 'Please provide a valid MongoDB ObjectId'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Quality check service error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;

/**
 * Quality Check API Documentation
 * 
 * This module provides comprehensive quality assurance and compliance verification
 * for approved loan applications before funding.
 * 
 * Key Features:
 * - Document verification and completeness check
 * - Data accuracy and consistency validation
 * - Compliance verification against policies and regulations
 * - Policy adherence checking
 * - Risk validation and assessment
 * - Financial calculation verification
 * - Regulatory compliance checking
 * - Automated scoring and decision making
 * - Detailed reporting and issue tracking
 * 
 * Quality Check Types:
 * 1. Document Verification - Ensures all required documents are present and valid
 * 2. Data Accuracy - Validates consistency and accuracy of applicant data
 * 3. Compliance Check - Verifies compliance with lending policies
 * 4. Policy Adherence - Checks adherence to internal policies
 * 5. Risk Validation - Validates risk assessment and mitigation
 * 6. Calculation Verification - Verifies financial calculations
 * 7. Regulatory Compliance - Ensures regulatory compliance
 * 
 * Scoring System:
 * - Compliance Score: 0-100 (passing threshold: 80)
 * - Accuracy Score: 0-100 (passing threshold: 80)
 * - Overall Status: passed, warning, failed
 * 
 * Processing Flow:
 * 1. Receive credit decision ID
 * 2. Validate credit decision is approved/conditionally approved
 * 3. Perform comprehensive quality checks
 * 4. Calculate compliance and accuracy scores
 * 5. Determine overall status
 * 6. Generate recommendations for issues found
 * 7. Return results with next phase indication
 * 
 * Next Phase:
 * - If quality check passes: loan-funding
 * - If quality check fails: rejection or manual review
 * 
 * Error Handling:
 * - Validates all input parameters
 * - Provides detailed error messages
 * - Handles database connection issues
 * - Manages service dependencies
 * 
 * Security:
 * - Input validation and sanitization
 * - Parameter type checking
 * - Error message sanitization
 * - Audit trail logging
 */