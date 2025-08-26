const express = require('express');
const router = express.Router();
const LoanFundingController = require('./controller');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

// Validation rules
const validateQualityCheckId = [
    param('quality_check_id')
        .isMongoId()
        .withMessage('Quality check ID must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

const validateLoanFundingId = [
    param('loan_funding_id')
        .isMongoId()
        .withMessage('Loan funding ID must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

const validateFundingData = [
    body('disbursement_method')
        .optional()
        .isIn(['bank_transfer', 'rtgs', 'neft'])
        .withMessage('Disbursement method must be one of: bank_transfer, rtgs, neft'),
    
    body('disbursement_priority')
        .optional()
        .isIn(['standard', 'high', 'urgent'])
        .withMessage('Disbursement priority must be one of: standard, high, urgent'),
    
    body('special_instructions')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Special instructions must be a string with maximum 500 characters'),
    
    body('beneficiary_verification_required')
        .optional()
        .isBoolean()
        .withMessage('Beneficiary verification required must be a boolean'),
    
    body('third_party_disbursement')
        .optional()
        .isBoolean()
        .withMessage('Third party disbursement must be a boolean'),
    
    body('disbursement_schedule')
        .optional()
        .isIn(['immediate', 'next_business_day', 'scheduled'])
        .withMessage('Disbursement schedule must be one of: immediate, next_business_day, scheduled'),
    
    body('scheduled_date')
        .optional()
        .custom((value, { req }) => {
            if (req.body.disbursement_schedule === 'scheduled' && !value) {
                throw new Error('Scheduled date is required when disbursement schedule is set to scheduled');
            }
            if (value && !Date.parse(value)) {
                throw new Error('Scheduled date must be a valid date');
            }
            if (value && new Date(value) <= new Date()) {
                throw new Error('Scheduled date must be in the future');
            }
            return true;
        }),
    
    body('disbursement_amount_override')
        .optional()
        .isNumeric()
        .custom(value => {
            if (value <= 0) {
                throw new Error('Disbursement amount override must be greater than 0');
            }
            return true;
        }),
    
    body('processing_fee_waiver')
        .optional()
        .isBoolean()
        .withMessage('Processing fee waiver must be a boolean'),
    
    body('insurance_opt_out')
        .optional()
        .isBoolean()
        .withMessage('Insurance opt out must be a boolean'),
    
    body('custom_account_details')
        .optional()
        .isObject()
        .withMessage('Custom account details must be an object'),
    
    body('custom_account_details.account_number')
        .optional()
        .isString()
        .isLength({ min: 9, max: 18 })
        .withMessage('Account number must be between 9 and 18 characters'),
    
    body('custom_account_details.ifsc_code')
        .optional()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .withMessage('IFSC code must be in valid format (e.g., HDFC0000123)'),
    
    body('custom_account_details.account_holder_name')
        .optional()
        .isString()
        .isLength({ min: 2, max: 100 })
        .withMessage('Account holder name must be between 2 and 100 characters'),
    
    body('custom_account_details.bank_name')
        .optional()
        .isString()
        .isLength({ min: 2, max: 100 })
        .withMessage('Bank name must be between 2 and 100 characters'),
    
    body('notification_preferences')
        .optional()
        .isObject()
        .withMessage('Notification preferences must be an object'),
    
    body('notification_preferences.sms')
        .optional()
        .isBoolean()
        .withMessage('SMS notification preference must be a boolean'),
    
    body('notification_preferences.email')
        .optional()
        .isBoolean()
        .withMessage('Email notification preference must be a boolean'),
    
    body('notification_preferences.push')
        .optional()
        .isBoolean()
        .withMessage('Push notification preference must be a boolean'),
    
    handleValidationErrors
];

const validateReportFormat = [
    query('format')
        .optional()
        .isIn(['json', 'pdf'])
        .withMessage('Report format must be either json or pdf'),
    handleValidationErrors
];

/**
 * @route POST /api/phases/loan-funding/process/:quality_check_id
 * @desc Process loan funding for a passed quality check
 * @access Private
 */
router.post('/process/:quality_check_id', 
    validateQualityCheckId,
    validateFundingData,
    LoanFundingController.processLoanFunding
);

/**
 * @route GET /api/phases/loan-funding/status/:loan_funding_id
 * @desc Get loan funding status and details
 * @access Private
 */
router.get('/status/:loan_funding_id',
    validateLoanFundingId,
    LoanFundingController.getLoanFundingStatus
);

/**
 * @route GET /api/phases/loan-funding/report/:loan_funding_id
 * @desc Generate comprehensive loan funding report
 * @access Private
 */
router.get('/report/:loan_funding_id',
    validateLoanFundingId,
    validateReportFormat,
    LoanFundingController.generateLoanFundingReport
);

/**
 * @route GET /api/phases/loan-funding/requirements
 * @desc Get detailed requirements for loan funding phase
 * @access Public
 */
router.get('/requirements', LoanFundingController.getLoanFundingRequirements);

/**
 * @route GET /api/phases/loan-funding/health
 * @desc Check health status of loan funding service
 * @access Public
 */
router.get('/health', LoanFundingController.healthCheck);

// Additional utility routes

/**
 * @route GET /api/phases/loan-funding/disbursement-methods
 * @desc Get available disbursement methods and their details
 * @access Public
 */
router.get('/disbursement-methods', (req, res) => {
    try {
        const disbursementMethods = [
            {
                method: 'bank_transfer',
                name: 'Bank Transfer',
                description: 'Standard bank transfer using NEFT/RTGS',
                processing_time: '1-2 business days',
                charges: 'As per bank charges',
                minimum_amount: 1,
                maximum_amount: null,
                availability: '24x7',
                recommended_for: ['All loan types']
            },
            {
                method: 'rtgs',
                name: 'Real Time Gross Settlement',
                description: 'Immediate high-value fund transfer',
                processing_time: 'Same day (within banking hours)',
                charges: 'Higher charges apply',
                minimum_amount: 200000,
                maximum_amount: null,
                availability: 'Banking hours only',
                recommended_for: ['High-value loans', 'Urgent disbursements']
            },
            {
                method: 'neft',
                name: 'National Electronic Funds Transfer',
                description: 'Standard electronic fund transfer',
                processing_time: '1 business day',
                charges: 'Standard charges',
                minimum_amount: 1,
                maximum_amount: 1000000,
                availability: '24x7',
                recommended_for: ['Standard disbursements']
            }
        ];

        res.status(200).json({
            success: true,
            message: 'Disbursement methods retrieved successfully',
            data: {
                methods: disbursementMethods,
                default_method: 'bank_transfer',
                selection_criteria: [
                    'Loan amount',
                    'Urgency requirement',
                    'Cost consideration',
                    'Processing time preference'
                ]
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get disbursement methods error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving disbursement methods',
            code: 'DISBURSEMENT_METHODS_ERROR'
        });
    }
});

/**
 * @route GET /api/phases/loan-funding/fee-calculator
 * @desc Calculate fees and charges for loan funding
 * @access Public
 */
router.get('/fee-calculator', [
    query('loan_amount')
        .isNumeric()
        .custom(value => {
            if (value <= 0) {
                throw new Error('Loan amount must be greater than 0');
            }
            return true;
        }),
    
    query('loan_type')
        .isIn(['personal_loan', 'home_loan', 'car_loan', 'education_loan', 'business_loan', 'loan_against_property'])
        .withMessage('Invalid loan type'),
    
    query('include_insurance')
        .optional()
        .isBoolean()
        .withMessage('Include insurance must be a boolean'),
    
    handleValidationErrors
], (req, res) => {
    try {
        const { loan_amount, loan_type, include_insurance = false } = req.query;
        const amount = parseFloat(loan_amount);
        
        // Fee calculation logic (same as in service)
        const feeRates = {
            'personal_loan': 0.02,
            'home_loan': 0.005,
            'car_loan': 0.01,
            'education_loan': 0.01,
            'business_loan': 0.015,
            'loan_against_property': 0.01
        };
        
        const rate = feeRates[loan_type] || 0.02;
        const processingFee = Math.min(amount * rate, loan_type === 'personal_loan' ? 50000 : 100000);
        const gst = processingFee * 0.18;
        const insurancePremium = (include_insurance && loan_type === 'personal_loan') ? amount * 0.005 : 0;
        const otherCharges = 500;
        
        const totalDeductions = processingFee + gst + insurancePremium + otherCharges;
        const netDisbursementAmount = amount - totalDeductions;
        
        const feeBreakdown = {
            loan_amount: amount,
            loan_type: loan_type,
            fee_breakdown: {
                processing_fee: processingFee,
                gst_on_processing_fee: gst,
                insurance_premium: insurancePremium,
                other_charges: otherCharges,
                total_deductions: totalDeductions
            },
            disbursement_details: {
                gross_loan_amount: amount,
                total_deductions: totalDeductions,
                net_disbursement_amount: netDisbursementAmount,
                deduction_percentage: ((totalDeductions / amount) * 100).toFixed(2)
            },
            fee_structure_info: {
                processing_fee_rate: `${(rate * 100).toFixed(2)}%`,
                processing_fee_cap: loan_type === 'personal_loan' ? '₹50,000' : '₹100,000',
                gst_rate: '18%',
                insurance_premium_rate: loan_type === 'personal_loan' ? '0.5% (optional)' : 'Not applicable',
                other_charges_description: 'Documentation and administrative charges'
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Fee calculation completed successfully',
            data: feeBreakdown,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Fee calculator error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during fee calculation',
            code: 'FEE_CALCULATION_ERROR'
        });
    }
});

/**
 * @route GET /api/phases/loan-funding/processing-timeline
 * @desc Get estimated processing timeline for different scenarios
 * @access Public
 */
router.get('/processing-timeline', (req, res) => {
    try {
        const timeline = {
            standard_processing: {
                description: 'Normal processing with standard verification',
                estimated_time: '2-4 hours',
                stages: [
                    { stage: 'Pre-disbursement checks', duration: '30-60 minutes' },
                    { stage: 'Loan account creation', duration: '15-30 minutes' },
                    { stage: 'Disbursement calculation', duration: '5-10 minutes' },
                    { stage: 'Beneficiary validation', duration: '15-30 minutes' },
                    { stage: 'Disbursement processing', duration: '30-90 minutes' },
                    { stage: 'Documentation generation', duration: '15-30 minutes' },
                    { stage: 'Servicing setup', duration: '15-30 minutes' },
                    { stage: 'Notifications', duration: '5-10 minutes' }
                ]
            },
            expedited_processing: {
                description: 'Fast-track processing for urgent cases',
                estimated_time: '1-2 hours',
                additional_charges: '₹1,000 expedite fee',
                conditions: ['High-priority customer', 'Pre-approved beneficiary', 'Standard loan amount']
            },
            complex_processing: {
                description: 'Extended processing for complex cases',
                estimated_time: '4-8 hours or 1 business day',
                scenarios: [
                    'First-time beneficiary requiring additional verification',
                    'High-value loans requiring additional approvals',
                    'Third-party disbursement cases',
                    'Custom disbursement arrangements'
                ]
            },
            factors_affecting_timeline: [
                'Disbursement method selected',
                'Bank processing times',
                'Beneficiary verification requirements',
                'Loan amount and complexity',
                'System load and peak hours',
                'Additional compliance checks',
                'Third-party integrations availability'
            ],
            sla_commitments: {
                standard_cases: 'Within 4 hours during business hours',
                complex_cases: 'Within 1 business day',
                expedited_cases: 'Within 2 hours (additional charges apply)',
                business_hours: 'Monday to Friday, 9:00 AM to 6:00 PM IST'
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Processing timeline information retrieved successfully',
            data: timeline,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Get processing timeline error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving processing timeline',
            code: 'TIMELINE_ERROR'
        });
    }
});

module.exports = router;