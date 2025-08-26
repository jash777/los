/**
 * Loan Application Phase Controller
 * Handles HTTP requests for the detailed loan application phase
 */

const LoanApplicationService = require('./service');
const logger = require('../../middleware/utils/logger');
const { validationResult } = require('express-validator');

class LoanApplicationController {
    constructor() {
        this.loanApplicationService = new LoanApplicationService();
    }

    /**
     * Process detailed loan application
     */
    async processLoanApplication(req, res) {
        const requestId = `loanapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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

            const { pre_qualification_id } = req.body;
            
            logger.info(`[${requestId}] Loan application request received`, {
                preQualificationId: pre_qualification_id,
                loanType: req.body.loan_details?.loan_type,
                requestedAmount: req.body.loan_details?.requested_amount
            });

            // Process loan application
            const result = await this.loanApplicationService.processLoanApplication(
                req.body,
                pre_qualification_id,
                requestId
            );

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
            logger.error(`[${requestId}] Loan application processing failed`, {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                message: 'Internal server error during loan application processing',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Processing failed',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get loan application status
     */
    async getLoanApplicationStatus(req, res) {
        const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { applicationId } = req.params;

        try {
            logger.info(`[${requestId}] Loan application status request`, { applicationId });

            // Get status from service
            const status = await this.loanApplicationService.getApplicationStatus(applicationId);

            res.status(200).json({
                success: true,
                data: status,
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error(`[${requestId}] Failed to get loan application status`, {
                error: error.message,
                applicationId
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve loan application status',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Status retrieval failed',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get loan application requirements
     */
    async getLoanApplicationRequirements(req, res) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            const requirements = {
                phase: 'loan-application',
                description: 'Detailed loan application with comprehensive financial information',
                prerequisites: {
                    pre_qualification: {
                        required: true,
                        status: 'approved',
                        description: 'Must have completed and passed pre-qualification phase'
                    }
                },
                requiredFields: {
                    pre_qualification_id: {
                        required: true,
                        type: 'string',
                        description: 'Pre-qualification application ID'
                    },
                    loan_details: {
                        loan_type: { required: true, type: 'string', description: 'Type of loan (personal/home/car/business/education)' },
                        requested_amount: { required: true, type: 'number', description: 'Requested loan amount (₹50,000 - ₹1,00,00,000)' },
                        tenure: { required: true, type: 'number', description: 'Loan tenure in months (6-84)' },
                        loan_purpose: { required: true, type: 'string', description: 'Detailed purpose of loan (min 10 characters)' },
                        interest_rate_preference: { required: false, type: 'string', description: 'Fixed or floating rate preference' }
                    },
                    financial_details: {
                        monthly_income: { required: true, type: 'number', description: 'Monthly gross income' },
                        monthly_expenses: { required: true, type: 'number', description: 'Monthly household expenses' },
                        existing_emis: { required: true, type: 'number', description: 'Total existing EMI obligations' },
                        bank_balance: { required: true, type: 'number', description: 'Current bank balance' },
                        assets: {
                            required: false,
                            type: 'array',
                            description: 'List of assets with type and value',
                            items: {
                                type: { required: true, type: 'string', description: 'Asset type (property/vehicle/investment/other)' },
                                description: { required: true, type: 'string', description: 'Asset description' },
                                value: { required: true, type: 'number', description: 'Current market value' }
                            }
                        },
                        liabilities: {
                            required: false,
                            type: 'array',
                            description: 'List of liabilities with type and amount',
                            items: {
                                type: { required: true, type: 'string', description: 'Liability type (loan/credit_card/other)' },
                                description: { required: true, type: 'string', description: 'Liability description' },
                                amount: { required: true, type: 'number', description: 'Outstanding amount' },
                                monthly_payment: { required: false, type: 'number', description: 'Monthly payment amount' }
                            }
                        }
                    },
                    employment_details: {
                        employment_type: { required: true, type: 'string', description: 'Employment type (salaried/self-employed)' },
                        company_name: { required: true, type: 'string', description: 'Current employer name' },
                        designation: { required: true, type: 'string', description: 'Job designation/title' },
                        work_experience: { required: true, type: 'number', description: 'Total work experience in years' },
                        current_job_experience: { required: true, type: 'number', description: 'Experience in current job (years)' },
                        industry_type: { required: false, type: 'string', description: 'Industry sector' },
                        company_address: { required: false, type: 'string', description: 'Company address' }
                    },
                    documents: {
                        required: true,
                        type: 'array',
                        description: 'Supporting documents',
                        items: {
                            type: { required: true, type: 'string', description: 'Document type' },
                            filename: { required: true, type: 'string', description: 'File name' },
                            size: { required: false, type: 'number', description: 'File size in bytes' },
                            uploaded_at: { required: false, type: 'string', description: 'Upload timestamp' }
                        }
                    }
                },
                requiredDocuments: [
                    {
                        type: 'income_proof',
                        name: 'Income Proof',
                        description: 'Salary slips (last 3 months) or ITR (last 2 years)',
                        formats: ['PDF', 'JPG', 'PNG'],
                        maxSize: '5MB'
                    },
                    {
                        type: 'bank_statements',
                        name: 'Bank Statements',
                        description: 'Bank statements for last 6 months',
                        formats: ['PDF'],
                        maxSize: '10MB'
                    },
                    {
                        type: 'address_proof',
                        name: 'Address Proof',
                        description: 'Utility bill, rental agreement, or property documents',
                        formats: ['PDF', 'JPG', 'PNG'],
                        maxSize: '5MB'
                    },
                    {
                        type: 'identity_proof',
                        name: 'Identity Proof',
                        description: 'PAN card, Aadhar card, or passport',
                        formats: ['PDF', 'JPG', 'PNG'],
                        maxSize: '5MB'
                    }
                ],
                assessmentCriteria: {
                    financial_stability: {
                        description: 'Comprehensive financial health assessment',
                        factors: ['DTI ratio', 'Net worth', 'Income stability', 'Asset coverage']
                    },
                    risk_assessment: {
                        description: 'Overall risk evaluation',
                        factors: ['Credit score', 'Employment stability', 'Loan-to-income ratio', 'Asset base']
                    },
                    eligibility_calculation: {
                        description: 'Loan amount and terms determination',
                        factors: ['Disposable income', 'Risk category', 'Asset coverage', 'Credit profile']
                    }
                },
                processingSteps: [
                    {
                        step: 1,
                        name: 'Pre-qualification Validation',
                        description: 'Verify pre-qualification status and retrieve data'
                    },
                    {
                        step: 2,
                        name: 'Financial Information Processing',
                        description: 'Analyze comprehensive financial details and calculate ratios'
                    },
                    {
                        step: 3,
                        name: 'Loan Details Validation',
                        description: 'Validate loan amount, tenure, and purpose'
                    },
                    {
                        step: 4,
                        name: 'Document Processing',
                        description: 'Verify document completeness and requirements'
                    },
                    {
                        step: 5,
                        name: 'Risk Score Calculation',
                        description: 'Calculate comprehensive risk score and category'
                    },
                    {
                        step: 6,
                        name: 'Application Decision',
                        description: 'Determine approval status and eligible terms'
                    }
                ],
                expectedOutcome: {
                    approved: {
                        description: 'Application approved for processing',
                        nextSteps: 'Proceed to Application Processing phase for verification',
                        includes: ['Eligible loan amount', 'Suggested terms', 'Interest rate indication']
                    },
                    rejected: {
                        description: 'Application does not meet criteria',
                        nextSteps: 'Address issues and resubmit application',
                        includes: ['Rejection reasons', 'Improvement recommendations']
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
            logger.error(`[${requestId}] Failed to get loan application requirements`, {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve loan application requirements',
                requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check for loan application phase
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                phase: 'loan-application',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                availableEndpoints: [
                    'POST /api/phases/loan-application/process',
                    'GET /api/phases/loan-application/status/:applicationId',
                    'GET /api/phases/loan-application/requirements',
                    'GET /api/phases/loan-application/health'
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                phase: 'loan-application',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = LoanApplicationController;