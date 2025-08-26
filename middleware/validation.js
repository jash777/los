/**
 * Validation Middleware for Indian Loan System
 */

const Joi = require('joi');
const config = require('./config/app.config');

/**
 * Indian-specific validation schemas
 */
const indianValidationSchemas = {
    // PAN number validation
    panNumber: Joi.string()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .required()
        .messages({
            'string.pattern.base': 'PAN number must be in format ABCDE1234F',
            'any.required': 'PAN number is required'
        }),

    // Indian mobile number validation
    mobileNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits starting with 6-9',
            'any.required': 'Mobile number is required'
        }),

    // IFSC code validation
    ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'IFSC code must be in format ABCD0123456',
            'any.required': 'IFSC code is required'
        }),

    // Indian pincode validation
    pincode: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'Pincode must be exactly 6 digits',
            'any.required': 'Pincode is required'
        }),

    // Age validation (configurable from environment)
    dateOfBirth: Joi.date()
        .max('now')
        .custom((value, helpers) => {
            const today = new Date();
            const birthDate = new Date(value);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < config.business.minAge || age > config.business.maxAge) {
                return helpers.error('custom.age');
            }
            
            return value;
        })
        .required()
        .messages({
            'custom.age': `Age must be between ${config.business.minAge} and ${config.business.maxAge} years`,
            'date.max': 'Date of birth cannot be in the future',
            'any.required': 'Date of birth is required'
        })
};

/**
 * Preliminary check validation schema
 */
const preliminaryCheckSchema = Joi.object({
    first_name: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters',
            'string.pattern.base': 'First name can only contain letters and spaces',
            'any.required': 'First name is required'
        }),
    
    last_name: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters',
            'string.pattern.base': 'Last name can only contain letters and spaces',
            'any.required': 'Last name is required'
        }),
    
    pan_number: indianValidationSchemas.panNumber,
    date_of_birth: indianValidationSchemas.dateOfBirth,
    
    gender: Joi.string()
        .valid('male', 'female', 'other')
        .required()
        .messages({
            'any.only': 'Gender must be male, female, or other',
            'any.required': 'Gender is required'
        }),
    
    employment_type: Joi.string()
        .valid('salaried', 'self_employed')
        .required()
        .messages({
            'any.only': 'Employment type must be salaried or self_employed',
            'any.required': 'Employment type is required'
        }),
    
    monthly_income: Joi.number()
        .min(10000)
        .max(10000000)
        .required()
        .messages({
            'number.min': 'Monthly income must be at least ₹10,000',
            'number.max': 'Monthly income cannot exceed ₹1,00,00,000',
            'any.required': 'Monthly income is required'
        }),
    
    company_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.max': 'Company name cannot exceed 100 characters',
            'any.required': 'Company name is required'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    
    address: Joi.string()
        .min(10)
        .max(200)
        .required()
        .messages({
            'string.min': 'Address must be at least 10 characters',
            'string.max': 'Address cannot exceed 200 characters',
            'any.required': 'Address is required'
        }),
    
    pincode: indianValidationSchemas.pincode,
    
    office_email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid office email address',
            'any.required': 'Office email is required'
        }),
    
    location: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Location must be at least 2 characters',
            'string.max': 'Location cannot exceed 50 characters',
            'any.required': 'Location is required'
        }),
    
    // Optional fields
    mobile: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits starting with 6-9'
        }),
    
    requested_amount: Joi.number()
        .min(config.business.minLoanAmount)
        .max(config.business.maxLoanAmount)
        .optional()
        .messages({
            'number.min': `Loan amount must be at least ₹${config.business.minLoanAmount.toLocaleString()}`,
            'number.max': `Loan amount cannot exceed ₹${config.business.maxLoanAmount.toLocaleString()}`
        })
});

/**
 * EMI calculation validation schema
 */
const emiCalculationSchema = Joi.object({
    loan_amount: Joi.number()
        .min(config.business.minLoanAmount)
        .max(config.business.maxLoanAmount)
        .required()
        .messages({
            'number.min': `Loan amount must be at least ₹${config.business.minLoanAmount.toLocaleString()}`,
            'number.max': `Loan amount cannot exceed ₹${config.business.maxLoanAmount.toLocaleString()}`,
            'any.required': 'Loan amount is required'
        }),
    
    interest_rate: Joi.number()
        .min(6)
        .max(30)
        .required()
        .messages({
            'number.min': 'Interest rate must be at least 6%',
            'number.max': 'Interest rate cannot exceed 30%',
            'any.required': 'Interest rate is required'
        }),
    
    tenure_months: Joi.number()
        .integer()
        .min(config.business.minTenure)
        .max(config.business.maxTenure)
        .required()
        .messages({
            'number.integer': 'Tenure must be a whole number',
            'number.min': `Tenure must be at least ${config.business.minTenure} months`,
            'number.max': `Tenure cannot exceed ${config.business.maxTenure} months`,
            'any.required': 'Tenure is required'
        })
});

/**
 * Validation middleware factory
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
                message: 'Please check the provided data and try again'
            });
        }

        // Replace request body with validated and sanitized data
        req.body = value;
        next();
    };
};

/**
 * Specific validation middlewares
 */
const validatePreliminaryCheck = validateRequest(preliminaryCheckSchema);
const validateEmiCalculation = validateRequest(emiCalculationSchema);

/**
 * Custom validation functions
 */
const validatePAN = (panNumber) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber);
};

const validateMobile = (mobileNumber) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobileNumber);
};

const validateIFSC = (ifscCode) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscCode);
};

const validatePincode = (pincode) => {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
};

const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

const validateAge = (dateOfBirth) => {
    const age = calculateAge(dateOfBirth);
    return age >= config.business.minAge && age <= config.business.maxAge;
};

/**
 * Sanitization functions
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeInput(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    
    return sanitized;
};

/**
 * Input sanitization middleware
 */
const sanitizeRequestData = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    
    next();
};

module.exports = {
    // Validation schemas
    indianValidationSchemas,
    preliminaryCheckSchema,
    emiCalculationSchema,
    
    // Validation middlewares
    validateRequest,
    validatePreliminaryCheck,
    validateEmiCalculation,
    
    // Custom validation functions
    validatePAN,
    validateMobile,
    validateIFSC,
    validatePincode,
    validateAge,
    calculateAge,
    
    // Sanitization
    sanitizeInput,
    sanitizeObject,
    sanitizeRequestData
};