const express = require('express');
const { body, param, validationResult } = require('express-validator');
const creditDecisionController = require('./controller');
const { CREDIT_DECISION_OUTCOMES } = require('../../middleware/constants/loan-origination-phases');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Validation rules for underwriting ID parameter
const validateUnderwritingId = [
    param('underwriting_id')
        .isMongoId()
        .withMessage('Invalid underwriting ID format'),
    handleValidationErrors
];

// Validation rules for credit decision ID parameter
const validateCreditDecisionId = [
    param('credit_decision_id')
        .isMongoId()
        .withMessage('Invalid credit decision ID format'),
    handleValidationErrors
];

// Validation rules for credit decision processing
const validateCreditDecisionData = [
    // Optional manual review flag
    body('manual_review_required')
        .optional()
        .isBoolean()
        .withMessage('manual_review_required must be a boolean'),

    // Optional reviewer notes
    body('reviewer_notes')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('reviewer_notes must be a string with maximum 1000 characters')
        .trim(),

    // Optional override reason
    body('override_reason')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('override_reason must be a string with maximum 500 characters')
        .trim(),

    // Optional manual decision
    body('manual_decision')
        .optional()
        .isIn(Object.values(CREDIT_DECISION_OUTCOMES))
        .withMessage(`manual_decision must be one of: ${Object.values(CREDIT_DECISION_OUTCOMES).join(', ')}`),

    // Optional manual approved amount
    body('manual_approved_amount')
        .optional()
        .isNumeric()
        .custom(value => {
            if (value < 0) {
                throw new Error('manual_approved_amount must be a positive number');
            }
            if (value > 50000000) { // 5 crores max
                throw new Error('manual_approved_amount cannot exceed ₹5,00,00,000');
            }
            return true;
        }),

    // Optional additional conditions
    body('additional_conditions')
        .optional()
        .isArray()
        .withMessage('additional_conditions must be an array'),

    body('additional_conditions.*')
        .optional()
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each condition must be a string between 1-200 characters')
        .trim(),

    // Custom validation for manual review consistency
    body().custom((value, { req }) => {
        if (req.body.manual_review_required === true) {
            if (!req.body.reviewer_notes || req.body.reviewer_notes.trim().length === 0) {
                throw new Error('reviewer_notes is required when manual_review_required is true');
            }
        }
        
        if (req.body.manual_decision && !req.body.override_reason) {
            throw new Error('override_reason is required when manual_decision is provided');
        }
        
        if (req.body.manual_approved_amount && !req.body.manual_decision) {
            throw new Error('manual_decision is required when manual_approved_amount is provided');
        }
        
        return true;
    }),

    handleValidationErrors
];

// Routes

/**
 * @route POST /api/phases/credit-decision/process/:underwriting_id
 * @desc Process credit decision for an underwriting result
 * @access Private
 * @param {string} underwriting_id - Underwriting ID (MongoDB ObjectId)
 * @body {Object} decisionData - Credit decision data
 * @body {boolean} [decisionData.manual_review_required] - Whether manual review is required
 * @body {string} [decisionData.reviewer_notes] - Notes from manual reviewer (max 1000 chars)
 * @body {string} [decisionData.override_reason] - Reason for manual override (max 500 chars)
 * @body {string} [decisionData.manual_decision] - Manual decision override (approved/conditional_approval/rejected)
 * @body {number} [decisionData.manual_approved_amount] - Manually approved loan amount (0-50000000)
 * @body {string[]} [decisionData.additional_conditions] - Additional loan conditions (max 200 chars each)
 */
router.post('/process/:underwriting_id', 
    validateUnderwritingId,
    validateCreditDecisionData,
    creditDecisionController.processCreditDecision
);

/**
 * @route GET /api/phases/credit-decision/status/:credit_decision_id
 * @desc Get credit decision status and details
 * @access Private
 * @param {string} credit_decision_id - Credit decision ID (MongoDB ObjectId)
 */
router.get('/status/:credit_decision_id',
    validateCreditDecisionId,
    creditDecisionController.getCreditDecisionStatus
);

/**
 * @route GET /api/phases/credit-decision/letter/:credit_decision_id
 * @desc Get decision letter/document
 * @access Private
 * @param {string} credit_decision_id - Credit decision ID (MongoDB ObjectId)
 */
router.get('/letter/:credit_decision_id',
    validateCreditDecisionId,
    creditDecisionController.getDecisionLetter
);

/**
 * @route GET /api/phases/credit-decision/requirements
 * @desc Get credit decision phase requirements and specifications
 * @access Public
 */
router.get('/requirements', creditDecisionController.getRequirements);

/**
 * @route GET /api/phases/credit-decision/health
 * @desc Health check for credit decision phase
 * @access Public
 */
router.get('/health', creditDecisionController.healthCheck);

// Error handling middleware specific to credit decision routes
router.use((error, req, res, next) => {
    console.error('Credit Decision Route Error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Credit decision validation failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format provided',
            timestamp: new Date().toISOString()
        });
    }
    
    // Generic error response
    res.status(500).json({
        success: false,
        message: 'Credit decision processing error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;