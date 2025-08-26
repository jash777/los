/**
 * Pre-Qualification Phase Controller
 * Handles HTTP requests for the pre-qualification phase
 */

const PreQualificationService = require('./service');
const logger = require('../../middleware/utils/logger');
const { validationResult } = require('express-validator');

class PreQualificationController {
    constructor() {
        this.preQualificationService = new PreQualificationService();
    }

    /**
     * Process pre-qualification request
     */
    async processPreQualification(req, res) {
        const requestId = `preq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    requestId
                });
            }

            logger.info(`[${requestId}] Pre-qualification request received`, {
                applicantName: `${req.body.personal_info?.first_name} ${req.body.personal_info?.last_name}`,
                loanType: req.body.loan_request?.loan_type,
                requestedAmount: req.body.loan_request?.requested_amount
            });

            // Process pre-qualification
            const result = await this.preQualificationService.processPreQualification(req.body, requestId);

            // Return response based on result
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result,
                    requestId,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(200).json({
                    success: false,
                    data: result,
                    requestId,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Pre-qualification processing failed`, {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                message: 'Internal server error during pre-qualification processing',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Processing failed',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get pre-qualification status
     */
    async getPreQualificationStatus(req, res) {
        const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { applicationId } = req.params;

        try {
            logger.info(`[${requestId}] Pre-qualification status request`, { applicationId });

            // Get status from service
            const status = await this.preQualificationService.getApplicationStatus(applicationId);

            res.status(200).json({
                success: true,
                data: status,
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error(`[${requestId}] Failed to get pre-qualification status`, {
                error: error.message,
                applicationId
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve pre-qualification status',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Status retrieval failed',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get pre-qualification requirements
     */
    async getPreQualificationRequirements(req, res) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            const requirements = {
                phase: 'pre-qualification',
                description: 'Initial assessment to determine loan eligibility',
                requiredFields: {
                    personal_info: {
                        first_name: { required: true, type: 'string', description: 'First name' },
                        last_name: { required: true, type: 'string', description: 'Last name' },
                        date_of_birth: { required: true, type: 'date', description: 'Date of birth (YYYY-MM-DD)' },
                        mobile: { required: true, type: 'string', description: 'Mobile number' },
                        email: { required: true, type: 'email', description: 'Email address' },
                        pan_number: { required: true, type: 'string', description: 'PAN number' },
                        aadhar_number: { required: true, type: 'string', description: 'Aadhar number' }
                    },
                    address_info: {
                        current_address: { required: true, type: 'object', description: 'Current address details' },
                        permanent_address: { required: false, type: 'object', description: 'Permanent address details' }
                    },
                    employment_details: {
                        employment_type: { required: true, type: 'string', description: 'Employment type (salaried/self-employed)' },
                        company_name: { required: true, type: 'string', description: 'Company name' },
                        monthly_income: { required: true, type: 'number', description: 'Monthly income' },
                        work_experience: { required: true, type: 'number', description: 'Work experience in years' }
                    },
                    loan_request: {
                        loan_type: { required: true, type: 'string', description: 'Type of loan' },
                        requested_amount: { required: true, type: 'number', description: 'Requested loan amount' },
                        loan_purpose: { required: true, type: 'string', description: 'Purpose of loan' },
                        preferred_tenure: { required: false, type: 'number', description: 'Preferred tenure in months' }
                    }
                },
                eligibilityCriteria: {
                    age: { min: 21, max: 65, description: 'Age should be between 21-65 years' },
                    income: { min: 25000, description: 'Minimum monthly income of ₹25,000' },
                    cibilScore: { min: 650, description: 'Minimum CIBIL score of 650' },
                    employmentType: { allowed: ['salaried', 'self-employed'], description: 'Only salaried and self-employed allowed' }
                },
                stages: [
                    {
                        name: 'Preliminary Assessment',
                        description: 'Basic validation and initial scoring'
                    },
                    {
                        name: 'Identity Verification',
                        description: 'PAN, Aadhar, mobile and email verification'
                    },
                    {
                        name: 'CIBIL Check',
                        description: 'Credit score and history verification'
                    },
                    {
                        name: 'Employment Verification',
                        description: 'Employment and income verification'
                    },
                    {
                        name: 'Eligibility Assessment',
                        description: 'Final eligibility calculation and decision'
                    }
                ],
                expectedOutcome: {
                    approved: {
                        description: 'Pre-qualified for loan application',
                        nextSteps: 'Proceed to detailed loan application phase'
                    },
                    rejected: {
                        description: 'Did not meet pre-qualification criteria',
                        nextSteps: 'Review recommendations and reapply after improvements'
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
     * Health check for pre-qualification phase
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                phase: 'pre-qualification',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                availableEndpoints: [
                    'POST /api/phases/pre-qualification/process',
                    'GET /api/phases/pre-qualification/status/:applicationId',
                    'GET /api/phases/pre-qualification/requirements',
                    'GET /api/phases/pre-qualification/health'
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                phase: 'pre-qualification',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = PreQualificationController;