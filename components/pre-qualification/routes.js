/**
 * Pre-Qualification Phase Routes
 * Defines API endpoints for the pre-qualification phase
 */

const express = require('express');
const { body, param } = require('express-validator');
const PreQualificationController = require('./controller');
const router = express.Router();

// Initialize controller
const preQualificationController = new PreQualificationController();

// Validation middleware for pre-qualification request
const preQualificationValidation = [
    // Personal Information
    body('personal_info.first_name')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2-50 characters'),
    
    body('personal_info.last_name')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2-50 characters'),
    
    body('personal_info.date_of_birth')
        .notEmpty()
        .withMessage('Date of birth is required')
        .isISO8601()
        .withMessage('Date of birth must be in YYYY-MM-DD format'),
    
    body('personal_info.mobile')
        .notEmpty()
        .withMessage('Mobile number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Mobile number must be a valid 10-digit Indian number'),
    
    body('personal_info.email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email must be valid'),
    
    body('personal_info.pan_number')
        .notEmpty()
        .withMessage('PAN number is required')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .withMessage('PAN number must be in valid format (e.g., ABCDE1234F)'),
    
    body('personal_info.aadhar_number')
        .notEmpty()
        .withMessage('Aadhar number is required')
        .matches(/^\d{12}$/)
        .withMessage('Aadhar number must be 12 digits'),
    
    // Address Information
    body('address_info.current_address.address_line_1')
        .notEmpty()
        .withMessage('Current address line 1 is required'),
    
    body('address_info.current_address.city')
        .notEmpty()
        .withMessage('Current city is required'),
    
    body('address_info.current_address.state')
        .notEmpty()
        .withMessage('Current state is required'),
    
    body('address_info.current_address.pincode')
        .notEmpty()
        .withMessage('Current pincode is required')
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be 6 digits'),
    
    // Employment Details
    body('employment_details.employment_type')
        .notEmpty()
        .withMessage('Employment type is required')
        .isIn(['salaried', 'self-employed'])
        .withMessage('Employment type must be either salaried or self-employed'),
    
    body('employment_details.company_name')
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2-100 characters'),
    
    body('employment_details.monthly_income')
        .notEmpty()
        .withMessage('Monthly income is required')
        .isNumeric()
        .withMessage('Monthly income must be numeric')
        .custom((value) => {
            if (value < 10000) {
                throw new Error('Monthly income must be at least ₹10,000');
            }
            return true;
        }),
    
    body('employment_details.work_experience')
        .notEmpty()
        .withMessage('Work experience is required')
        .isNumeric()
        .withMessage('Work experience must be numeric')
        .custom((value) => {
            if (value < 0 || value > 50) {
                throw new Error('Work experience must be between 0-50 years');
            }
            return true;
        }),
    
    // Loan Request
    body('loan_request.loan_type')
        .notEmpty()
        .withMessage('Loan type is required')
        .isIn(['personal', 'home', 'car', 'business', 'education'])
        .withMessage('Invalid loan type'),
    
    body('loan_request.requested_amount')
        .notEmpty()
        .withMessage('Requested amount is required')
        .isNumeric()
        .withMessage('Requested amount must be numeric')
        .custom((value) => {
            if (value < 50000) {
                throw new Error('Minimum loan amount is ₹50,000');
            }
            if (value > 10000000) {
                throw new Error('Maximum loan amount is ₹1,00,00,000');
            }
            return true;
        }),
    
    body('loan_request.loan_purpose')
        .notEmpty()
        .withMessage('Loan purpose is required')
        .isLength({ min: 10, max: 200 })
        .withMessage('Loan purpose must be between 10-200 characters'),
    
    body('loan_request.preferred_tenure')
        .optional()
        .isNumeric()
        .withMessage('Preferred tenure must be numeric')
        .custom((value) => {
            if (value && (value < 6 || value > 84)) {
                throw new Error('Preferred tenure must be between 6-84 months');
            }
            return true;
        })
];

// Application ID validation
const applicationIdValidation = [
    param('applicationId')
        .notEmpty()
        .withMessage('Application ID is required')
        .isLength({ min: 10, max: 50 })
        .withMessage('Invalid application ID format')
];

/**
 * @route POST /api/phases/pre-qualification/process
 * @desc Process pre-qualification request
 * @access Public
 */
router.post('/process', 
    preQualificationValidation,
    (req, res) => preQualificationController.processPreQualification(req, res)
);

/**
 * @route GET /api/phases/pre-qualification/status/:applicationId
 * @desc Get pre-qualification status
 * @access Public
 */
router.get('/status/:applicationId',
    applicationIdValidation,
    (req, res) => preQualificationController.getPreQualificationStatus(req, res)
);

/**
 * @route GET /api/phases/pre-qualification/requirements
 * @desc Get pre-qualification requirements and criteria
 * @access Public
 */
router.get('/requirements',
    (req, res) => preQualificationController.getPreQualificationRequirements(req, res)
);

/**
 * @route GET /api/phases/pre-qualification/health
 * @desc Health check for pre-qualification phase
 * @access Public
 */
router.get('/health',
    (req, res) => preQualificationController.healthCheck(req, res)
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
    console.error('Pre-qualification route error:', error);
    res.status(500).json({
        success: false,
        message: 'Pre-qualification phase error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;