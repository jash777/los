const express = require('express');
const { body, param, validationResult } = require('express-validator');
const underwritingController = require('./controller');

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

// Validation rules for processing underwriting
const validateProcessUnderwriting = [
    param('application_processing_id')
        .isMongoId()
        .withMessage('Valid application processing ID is required'),
    
    body('credit_bureau_preference')
        .optional()
        .isIn(['CIBIL', 'Experian', 'Equifax', 'CRIF'])
        .withMessage('Credit bureau preference must be one of: CIBIL, Experian, Equifax, CRIF'),
    
    body('collateral_details')
        .optional()
        .isObject()
        .withMessage('Collateral details must be an object'),
    
    body('collateral_details.type')
        .optional()
        .isIn(['property', 'vehicle', 'securities', 'gold'])
        .withMessage('Collateral type must be one of: property, vehicle, securities, gold'),
    
    body('collateral_details.estimated_value')
        .optional()
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Estimated value must be a positive number'),
    
    body('collateral_details.ownership_proof')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Ownership proof must be a string between 1-500 characters'),
    
    body('collateral_details.valuation_certificate')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Valuation certificate must be a string between 1-500 characters'),
    
    body('additional_income_sources')
        .optional()
        .isArray()
        .withMessage('Additional income sources must be an array'),
    
    body('additional_income_sources.*.source_type')
        .optional()
        .isIn(['rental', 'investment', 'freelance', 'business'])
        .withMessage('Income source type must be one of: rental, investment, freelance, business'),
    
    body('additional_income_sources.*.monthly_amount')
        .optional()
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Monthly amount must be a positive number'),
    
    body('additional_income_sources.*.proof_document')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Proof document must be a string between 1-500 characters'),
    
    body('risk_mitigation_factors')
        .optional()
        .isArray()
        .withMessage('Risk mitigation factors must be an array'),
    
    body('risk_mitigation_factors.*')
        .optional()
        .isIn([
            'existing_customer',
            'salary_account_holder', 
            'insurance_coverage',
            'guarantor_available',
            'stable_employment_history',
            'property_ownership'
        ])
        .withMessage('Invalid risk mitigation factor'),
    
    handleValidationErrors
];

// Validation rules for getting underwriting status
const validateGetStatus = [
    param('underwritingId')
        .isMongoId()
        .withMessage('Valid underwriting ID is required'),
    
    handleValidationErrors
];

// Routes

/**
 * @route POST /api/phases/underwriting/process/:application_processing_id
 * @desc Process underwriting for an application
 * @access Private
 */
router.post('/process/:application_processing_id', 
    validateProcessUnderwriting,
    underwritingController.processUnderwriting
);

/**
 * @route GET /api/phases/underwriting/status/:underwritingId
 * @desc Get underwriting status and details
 * @access Private
 */
router.get('/status/:underwritingId',
    validateGetStatus,
    underwritingController.getUnderwritingStatus
);

/**
 * @route GET /api/phases/underwriting/requirements
 * @desc Get underwriting requirements and information
 * @access Public
 */
router.get('/requirements',
    underwritingController.getUnderwritingRequirements
);

/**
 * @route GET /api/phases/underwriting/health
 * @desc Health check for underwriting phase
 * @access Public
 */
router.get('/health',
    underwritingController.healthCheck
);

module.exports = router;