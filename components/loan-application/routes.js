/**
 * Loan Application Phase Routes
 * Defines API endpoints for the detailed loan application phase
 */

const express = require('express');
const { body, param } = require('express-validator');
const LoanApplicationController = require('./controller');
const router = express.Router();

// Initialize controller
const loanApplicationController = new LoanApplicationController();

// Validation middleware for loan application processing
const validateLoanApplication = [
    // Pre-qualification ID validation
    body('pre_qualification_id')
        .notEmpty()
        .withMessage('Pre-qualification ID is required')
        .isString()
        .withMessage('Pre-qualification ID must be a string'),

    // Loan details validation
    body('loan_details.loan_type')
        .notEmpty()
        .withMessage('Loan type is required')
        .isIn(['personal', 'home', 'car', 'business', 'education'])
        .withMessage('Invalid loan type'),
    
    body('loan_details.requested_amount')
        .isNumeric()
        .withMessage('Requested amount must be numeric')
        .custom((value) => {
            if (value < 50000 || value > 10000000) {
                throw new Error('Requested amount must be between ₹50,000 and ₹1,00,00,000');
            }
            return true;
        }),
    
    body('loan_details.tenure')
        .isInt({ min: 6, max: 84 })
        .withMessage('Loan tenure must be between 6 and 84 months'),
    
    body('loan_details.loan_purpose')
        .notEmpty()
        .withMessage('Loan purpose is required')
        .isLength({ min: 10 })
        .withMessage('Loan purpose must be at least 10 characters'),

    // Financial details validation
    body('financial_details.monthly_income')
        .isNumeric()
        .withMessage('Monthly income must be numeric')
        .custom((value) => {
            if (value <= 0) {
                throw new Error('Monthly income must be greater than 0');
            }
            return true;
        }),
    
    body('financial_details.monthly_expenses')
        .isNumeric()
        .withMessage('Monthly expenses must be numeric')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Monthly expenses cannot be negative');
            }
            return true;
        }),
    
    body('financial_details.existing_emis')
        .isNumeric()
        .withMessage('Existing EMIs must be numeric')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Existing EMIs cannot be negative');
            }
            return true;
        }),
    
    body('financial_details.bank_balance')
        .isNumeric()
        .withMessage('Bank balance must be numeric'),

    // Assets validation (optional)
    body('financial_details.assets')
        .optional()
        .isArray()
        .withMessage('Assets must be an array'),
    
    body('financial_details.assets.*.type')
        .optional()
        .isIn(['property', 'vehicle', 'investment', 'other'])
        .withMessage('Invalid asset type'),
    
    body('financial_details.assets.*.description')
        .optional()
        .notEmpty()
        .withMessage('Asset description is required'),
    
    body('financial_details.assets.*.value')
        .optional()
        .isNumeric()
        .withMessage('Asset value must be numeric'),

    // Liabilities validation (optional)
    body('financial_details.liabilities')
        .optional()
        .isArray()
        .withMessage('Liabilities must be an array'),
    
    body('financial_details.liabilities.*.type')
        .optional()
        .isIn(['loan', 'credit_card', 'other'])
        .withMessage('Invalid liability type'),
    
    body('financial_details.liabilities.*.description')
        .optional()
        .notEmpty()
        .withMessage('Liability description is required'),
    
    body('financial_details.liabilities.*.amount')
        .optional()
        .isNumeric()
        .withMessage('Liability amount must be numeric'),

    // Employment details validation
    body('employment_details.employment_type')
        .notEmpty()
        .withMessage('Employment type is required')
        .isIn(['salaried', 'self-employed'])
        .withMessage('Invalid employment type'),
    
    body('employment_details.company_name')
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),
    
    body('employment_details.designation')
        .notEmpty()
        .withMessage('Designation is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Designation must be between 2 and 50 characters'),
    
    body('employment_details.work_experience')
        .isNumeric()
        .withMessage('Work experience must be numeric')
        .custom((value) => {
            if (value < 0 || value > 50) {
                throw new Error('Work experience must be between 0 and 50 years');
            }
            return true;
        }),
    
    body('employment_details.current_job_experience')
        .isNumeric()
        .withMessage('Current job experience must be numeric')
        .custom((value, { req }) => {
            if (value < 0) {
                throw new Error('Current job experience cannot be negative');
            }
            if (value > req.body.employment_details?.work_experience) {
                throw new Error('Current job experience cannot exceed total work experience');
            }
            return true;
        }),

    // Documents validation
    body('documents')
        .isArray({ min: 1 })
        .withMessage('At least one document is required'),
    
    body('documents.*.type')
        .notEmpty()
        .withMessage('Document type is required')
        .isIn(['income_proof', 'bank_statements', 'address_proof', 'identity_proof', 'other'])
        .withMessage('Invalid document type'),
    
    body('documents.*.filename')
        .notEmpty()
        .withMessage('Document filename is required')
];

// Validation middleware for application ID parameter
const validateApplicationId = [
    param('applicationId')
        .notEmpty()
        .withMessage('Application ID is required')
        .isString()
        .withMessage('Application ID must be a string')
];

// Routes

/**
 * @route POST /api/phases/loan-application/process
 * @desc Process detailed loan application
 * @access Public
 */
router.post('/process', validateLoanApplication, (req, res) => {
    loanApplicationController.processLoanApplication(req, res);
});

/**
 * @route GET /api/phases/loan-application/status/:applicationId
 * @desc Get loan application status
 * @access Public
 */
router.get('/status/:applicationId', validateApplicationId, (req, res) => {
    loanApplicationController.getLoanApplicationStatus(req, res);
});

/**
 * @route GET /api/phases/loan-application/requirements
 * @desc Get loan application requirements and field specifications
 * @access Public
 */
router.get('/requirements', (req, res) => {
    loanApplicationController.getLoanApplicationRequirements(req, res);
});

/**
 * @route GET /api/phases/loan-application/health
 * @desc Health check for loan application phase
 * @access Public
 */
router.get('/health', (req, res) => {
    loanApplicationController.healthCheck(req, res);
});

module.exports = router;