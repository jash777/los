/**
 * Pre-Qualification Controller
 * Clean, efficient HTTP request handling for pre-qualification
 */

const PreQualificationService = require('../services/pre-qualification');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PreQualificationController {
    constructor() {
        this.preQualificationService = new PreQualificationService();
    }

    /**
     * Process pre-qualification request
     */
    async processPreQualification(req, res) {
        const requestId = req.headers['x-request-id'] || uuidv4();
        
        try {
            logger.info(`[${requestId}] Pre-qualification request received`);

            // Validate request body
            const validationResult = this.validateRequest(req.body);
            if (!validationResult.valid) {
                logger.warn(`[${requestId}] Request validation failed`, {
                    errors: validationResult.errors
                });
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validationResult.errors,
                    requestId,
                    timestamp: new Date().toISOString()
                });
            }

            // Normalize request data for service layer
            const normalizedData = this.normalizeFieldNames(req.body);
            
            // Process pre-qualification
            const result = await this.preQualificationService.processPreQualification(
                normalizedData,
                requestId
            );

            // Format response
            const response = {
                success: result.success,
                data: result,
                requestId,
                timestamp: new Date().toISOString()
            };
            
            logger.info(`[${requestId}] Pre-qualification completed`, {
                success: result.success,
                status: result.status,
                applicationNumber: result.applicationNumber
            });

            return res.status(result.success ? 200 : 400).json(response);

        } catch (error) {
            logger.error(`[${requestId}] Pre-qualification failed`, {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during pre-qualification processing',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get application status
     */
    async getApplicationStatus(req, res) {
        const requestId = req.headers['x-request-id'] || uuidv4();
        const { applicationNumber } = req.params;
        
        try {
            logger.info(`[${requestId}] Application status request`, { applicationNumber });
            
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Get application status
            const statusResult = await this.preQualificationService.getApplicationStatus(applicationNumber);
            
            if (!statusResult.success) {
                return res.status(404).json({
                    success: false,
                    error: statusResult.error,
                    applicationNumber,
                    requestId,
                    timestamp: new Date().toISOString()
                });
            }

            const response = {
                success: true,
                data: statusResult.data,
                requestId,
                timestamp: new Date().toISOString()
            };
            
            return res.status(200).json(response);
            
        } catch (error) {
            logger.error(`[${requestId}] Status check failed`, {
                error: error.message,
                applicationNumber
            });
            
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve application status',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get pre-qualification requirements - OPTIMIZED STAGE 1
     */
    async getRequirements(req, res) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            const requirements = {
                phase: 'pre_qualification_optimized',
                description: 'Optimized Stage 1: Quick pre-qualification with minimal essential data (2-3 minutes)',
                version: '4.0',
                processingTime: '2-3 minutes',
                purpose: 'Fast eligibility check with minimal friction',
                
                requiredFields: {
                    // Essential Personal Information
                    full_name: { 
                        required: true, 
                        type: 'string', 
                        minLength: 3,
                        maxLength: 100,
                        description: 'Full name as per official documents',
                        example: 'Rajesh Kumar Sharma'
                    },
                    phone: { 
                        required: true, 
                        type: 'string', 
                        pattern: '^[6-9][0-9]{9}$',
                        description: 'Valid Indian mobile number (10 digits)',
                        example: '9876543210'
                    },
                    email: { 
                        required: true, 
                        type: 'email', 
                        description: 'Valid email address for communication',
                        example: 'rajesh.sharma@example.com'
                    },
                    pan_number: { 
                        required: true, 
                        type: 'string', 
                        pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
                        description: 'Valid PAN number for identity verification',
                        example: 'ABCDE1234F'
                    },
                    date_of_birth: { 
                        required: true, 
                        type: 'date', 
                        format: 'YYYY-MM-DD',
                        description: 'Date of birth (age must be 21-65 years)',
                        example: '1985-06-15'
                    },
                    
                    // Basic Loan Requirements
                    requested_loan_amount: {
                        required: true,
                        type: 'number',
                        minimum: 50000,
                        maximum: 5000000,
                        description: 'Loan amount required (₹50K - ₹50L)',
                        example: 500000
                    },
                    loan_purpose: {
                        required: true,
                        type: 'string',
                        enum: ['personal', 'home_improvement', 'medical', 'education', 'business', 'debt_consolidation', 'travel', 'wedding', 'other'],
                        description: 'Purpose of the loan',
                        example: 'personal'
                    },
                    employment_type: {
                        required: true,
                        type: 'string',
                        enum: ['salaried', 'self_employed', 'business_owner', 'professional', 'retired'],
                        description: 'Type of employment',
                        example: 'salaried'
                    }
                },
                
                systemProcessing: {
                    description: 'Automated processing after data submission',
                    steps: [
                        'Basic data validation',
                        'PAN verification via third-party',
                        'CIBIL score retrieval',
                        'Age and employment eligibility check',
                        'Fraud risk assessment',
                        'Preliminary approval/rejection decision'
                    ]
                },
                
                decisionCriteria: {
                    approved: {
                        description: 'Eligible for Stage 2 (Comprehensive Application)',
                        criteria: [
                            'Age between 21-65 years',
                            'CIBIL score ≥ 650',
                            'Valid PAN verification',
                            'No critical fraud flags',
                            'Employment type acceptable'
                        ]
                    },
                    rejected: {
                        description: 'Not eligible for loan',
                        criteria: [
                            'Age outside 21-65 range',
                            'CIBIL score < 650',
                            'PAN verification failed',
                            'High fraud risk detected',
                            'Ineligible employment type'
                        ]
                    },
                    conditional: {
                        description: 'Marginal cases requiring manual review',
                        criteria: [
                            'CIBIL score 600-649 (borderline)',
                            'Minor data inconsistencies',
                            'Medium fraud risk'
                        ]
                    }
                },
                
                nextSteps: {
                    onApproval: {
                        description: 'Proceed to Stage 2: Comprehensive Application',
                        timeRequired: '10-15 minutes',
                        dataRequired: 'Complete employment, financial, address, and banking details'
                    },
                    onRejection: {
                        description: 'Application cannot proceed',
                        recommendations: [
                            'Improve CIBIL score if below threshold',
                            'Verify PAN details are correct',
                            'Consider reapplying after 3-6 months'
                        ]
                    }
                },
                
                businessRules: {
                    ageEligibility: {
                        minimum: 21,
                        maximum: 65,
                        description: 'Stricter age criteria for better risk assessment'
                    },
                    creditScore: {
                        minimum: 650,
                        description: 'Higher CIBIL threshold for quality applications',
                        categories: {
                            excellent: '750+',
                            good: '700-749',
                            acceptable: '650-699',
                            rejected: 'Below 650'
                        }
                    },
                    loanAmount: {
                        minimum: 50000,
                        maximum: 5000000,
                        description: 'Loan amount range for personal loans'
                    }
                },
                
                automatedProcessing: {
                    description: 'Fully automated Stage 1 processing',
                    steps: [
                        'Data validation and sanitization',
                        'PAN verification via government API',
                        'CIBIL score retrieval and analysis',
                        'Age and employment eligibility check',
                        'Fraud risk assessment using ML models',
                        'Automated decision based on business rules'
                    ],
                    averageProcessingTime: '30-60 seconds'
                },
                
                dataFlow: {
                    stage1: {
                        description: 'Collect minimal essential data',
                        outcome: 'Approved/Rejected for Stage 2'
                    },
                    stage2: {
                        description: 'Collect comprehensive data for underwriting',
                        outcome: 'Complete application ready for automated processing'
                    },
                    stages3to7: {
                        description: 'Fully automated processing pipeline',
                        outcome: 'Final loan decision and funding'
                    }
                }
            };

            res.status(200).json({
                success: true,
                data: requirements,
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error(`[${requestId}] Failed to get pre-qualification requirements`, {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve pre-qualification requirements',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                phase: 'pre-qualification',
                version: '3.0-enhanced',
                status: 'healthy',
                features: [
                    'MySQL database persistence',
                    'Complete application lifecycle',
                    'Enhanced fraud detection',
                    'Real-time verification',
                    'Comprehensive audit trail'
                ],
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                phase: 'pre-qualification',
                version: '3.0-enhanced',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Validate request body - OPTIMIZED STAGE 1
     * Supports both old and new field name formats for backward compatibility
     */
    validateRequest(body) {
        const errors = [];
        
        if (!body) {
            errors.push('Request body is required');
            return { valid: false, errors };
        }

        // Normalize field names for backward compatibility
        const normalizedBody = this.normalizeFieldNames(body);

        // Essential Personal Information
        if (!normalizedBody.applicantName) {
            errors.push('applicantName is required');
        } else if (normalizedBody.applicantName.length < 3) {
            errors.push('applicantName must be at least 3 characters');
        } else if (normalizedBody.applicantName.length > 100) {
            errors.push('applicantName cannot exceed 100 characters');
        }
        
        if (!normalizedBody.phone) {
            errors.push('phone is required');
        } else {
            const cleanPhone = normalizedBody.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
            if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
                errors.push('Invalid phone number format (must be 10 digits starting with 6-9)');
            }
        }
        
        if (!normalizedBody.email) {
            errors.push('email is required');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedBody.email)) {
                errors.push('Invalid email format');
            }
        }
        
        if (!normalizedBody.panNumber) {
            errors.push('panNumber is required');
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(normalizedBody.panNumber)) {
            errors.push('Invalid PAN number format (expected: AAAAA0000A)');
        }
        
        if (!normalizedBody.dateOfBirth) {
            errors.push('dateOfBirth is required');
        } else {
            // Validate date format and age
            const dob = new Date(normalizedBody.dateOfBirth);
            if (isNaN(dob.getTime())) {
                errors.push('Invalid dateOfBirth format (expected: YYYY-MM-DD)');
            } else {
                const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                if (age < 21) {
                    errors.push('Applicant must be at least 21 years old');
                } else if (age > 65) {
                    errors.push('Applicant age cannot exceed 65 years');
                }
            }
        }
        
        // Basic Loan Requirements
        if (!normalizedBody.loanAmount) {
            errors.push('loanAmount is required');
        } else {
            const amount = Number(normalizedBody.loanAmount);
            if (isNaN(amount) || amount < 50000) {
                errors.push('loanAmount must be at least ₹50,000');
            } else if (amount > 5000000) {
                errors.push('loanAmount cannot exceed ₹50,00,000');
            }
        }
        
        if (!normalizedBody.loanPurpose) {
            errors.push('loanPurpose is required');
        } else {
            const validPurposes = ['personal', 'home_improvement', 'medical', 'education', 'business', 'debt_consolidation', 'travel', 'wedding', 'other'];
            if (!validPurposes.includes(normalizedBody.loanPurpose)) {
                errors.push(`Invalid loanPurpose. Must be one of: ${validPurposes.join(', ')}`);
            }
        }
        
        if (!normalizedBody.employmentType) {
            errors.push('employmentType is required');
        } else {
            const validEmploymentTypes = ['salaried', 'self_employed', 'business_owner', 'professional', 'retired'];
            if (!validEmploymentTypes.includes(normalizedBody.employmentType)) {
                errors.push(`Invalid employmentType. Must be one of: ${validEmploymentTypes.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Normalize field names for backward compatibility
     * Supports both camelCase and snake_case formats
     */
    normalizeFieldNames(body) {
        return {
            applicantName: body.applicantName || body.full_name || body.applicant_name,
            phone: body.phone || body.mobile,
            email: body.email,
            panNumber: body.panNumber || body.pan_number,
            dateOfBirth: body.dateOfBirth || body.date_of_birth,
            loanAmount: body.loanAmount || body.requested_loan_amount || body.loan_amount,
            loanPurpose: body.loanPurpose || body.loan_purpose,
            employmentType: body.employmentType || body.employment_type
        };
    }

    /**
     * Calculate age from date of birth
     */
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }
}

module.exports = PreQualificationController;