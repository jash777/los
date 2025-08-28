/**
 * Loan Application Controller (Stage 2)
 * Enhanced loan application processing with Indian market requirements
 */

const LoanApplicationService = require('../services/loan-application');
const logger = require('../utils/logger');

class LoanApplicationController {
    constructor() {
        this.loanApplicationService = new LoanApplicationService();
    }

    /**
     * Process comprehensive loan application (Stage 2)
     */
    async processLoanApplication(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;
            const applicationData = req.body;

            logger.info(`[${requestId}] Processing loan application: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Validate required application data
            if (!applicationData || Object.keys(applicationData).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Application data is required',
                    requestId
                });
            }

            // Process the loan application
            const result = await this.loanApplicationService.processLoanApplication(
                applicationNumber, 
                applicationData, 
                requestId
            );

            // Return response based on result
            if (result.success) {
                res.status(200).json({
                    ...result,
                    requestId
                });
            } else {
                res.status(400).json({
                    ...result,
                    requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Loan application controller error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during loan application processing',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get loan application processing status
     */
    async getLoanApplicationStatus(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            const status = await this.loanApplicationService.getLoanApplicationStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get loan application status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get required data fields for comprehensive loan application (Stage 2)
     * Collects ALL data needed for underwriting decision
     */
    async getRequiredFields(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const requiredFields = {
                success: true,
                message: 'Comprehensive data collection for Stage 2 - ALL underwriting data required',
                description: 'Stage 2 collects complete information needed for automated underwriting decision (Stages 3-7)',
                data: {
                    // Additional Personal Details (beyond Stage 1)
                    personal_details: {
                        aadhaar_number: {
                            type: 'string',
                            required: true,
                            pattern: '^[0-9]{12}$',
                            description: 'Aadhaar number for identity verification'
                        },
                        marital_status: {
                            type: 'string',
                            required: true,
                            enum: ['single', 'married', 'divorced', 'widowed'],
                            description: 'Marital status'
                        },
                        spouse_name: {
                            type: 'string',
                            required: false,
                            description: 'Spouse name (if married)'
                        },
                        dependents_count: {
                            type: 'number',
                            required: true,
                            minimum: 0,
                            maximum: 10,
                            description: 'Number of dependents'
                        },
                        education_level: {
                            type: 'string',
                            required: true,
                            enum: ['high_school', 'diploma', 'graduate', 'post_graduate', 'professional'],
                            description: 'Highest education level'
                        }
                    },
                    // Comprehensive Employment & Income Details
                    employment_details: {
                        employment_type: {
                            type: 'string',
                            required: true,
                            enum: ['salaried', 'self_employed', 'business_owner', 'professional', 'retired'],
                            description: 'Type of employment (from Stage 1)'
                        },
                        company_name: {
                            type: 'string',
                            required: true,
                            minLength: 2,
                            maxLength: 100,
                            description: 'Name of employer/company/business'
                        },
                        company_address: {
                            type: 'object',
                            required: true,
                            properties: {
                                street: { type: 'string', required: true, minLength: 5 },
                                city: { type: 'string', required: true, minLength: 2 },
                                state: { type: 'string', required: true, minLength: 2 },
                                pincode: { type: 'string', required: true, pattern: '^[0-9]{6}$' }
                            },
                            description: 'Complete company/business address'
                        },
                        designation: {
                            type: 'string',
                            required: true,
                            minLength: 2,
                            description: 'Job title/designation/business type'
                        },
                        monthly_gross_income: {
                            type: 'number',
                            required: true,
                            minimum: 15000,
                            maximum: 10000000,
                            description: 'Monthly gross income in INR'
                        },
                        monthly_net_income: {
                            type: 'number',
                            required: true,
                            minimum: 10000,
                            maximum: 8000000,
                            description: 'Monthly net/take-home income in INR'
                        },
                        work_experience_years: {
                            type: 'number',
                            required: true,
                            minimum: 0.5,
                            maximum: 45,
                            description: 'Total work experience in years'
                        },
                        current_job_experience_years: {
                            type: 'number',
                            required: true,
                            minimum: 0.1,
                            maximum: 45,
                            description: 'Experience in current job/business in years'
                        },
                        industry_type: {
                            type: 'string',
                            required: true,
                            enum: ['it_software', 'banking_finance', 'healthcare', 'education', 'manufacturing', 'retail', 'government', 'consulting', 'real_estate', 'other'],
                            description: 'Industry/sector type'
                        },
                        employment_status: {
                            type: 'string',
                            required: true,
                            enum: ['permanent', 'contract', 'probation', 'consultant'],
                            description: 'Employment status'
                        },
                        office_email: {
                            type: 'string',
                            required: false,
                            format: 'email',
                            description: 'Official email ID (if available)'
                        },
                        office_phone: {
                            type: 'string',
                            required: false,
                            pattern: '^[0-9]{10,11}$',
                            description: 'Office phone number'
                        }
                    },
                    address_details: {
                        current_address: {
                            type: 'object',
                            required: true,
                            properties: {
                                street: 'string',
                                city: 'string',
                                state: 'string',
                                pincode: 'string (6 digits)'
                            }
                        },
                        permanent_address: {
                            type: 'object',
                            required: true,
                            properties: {
                                street: 'string',
                                city: 'string',
                                state: 'string',
                                pincode: 'string (6 digits)'
                            }
                        }
                    },
                    // Comprehensive Banking & Financial Details
                    banking_details: {
                        primary_account: {
                            type: 'object',
                            required: true,
                            properties: {
                                account_number: {
                                    type: 'string',
                                    required: true,
                                    minLength: 9,
                                    maxLength: 18,
                                    description: 'Primary bank account number'
                                },
                                ifsc_code: {
                                    type: 'string',
                                    required: true,
                                    pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
                                    description: 'IFSC code of primary bank'
                                },
                                bank_name: {
                                    type: 'string',
                                    required: true,
                                    minLength: 3,
                                    description: 'Name of the primary bank'
                                },
                                account_type: {
                                    type: 'string',
                                    required: true,
                                    enum: ['savings', 'current', 'salary'],
                                    description: 'Type of bank account'
                                },
                                account_holder_name: {
                                    type: 'string',
                                    required: true,
                                    description: 'Account holder name (should match applicant name)'
                                },
                                branch_name: {
                                    type: 'string',
                                    required: true,
                                    description: 'Bank branch name'
                                },
                                account_opening_date: {
                                    type: 'string',
                                    required: true,
                                    format: 'date',
                                    description: 'Account opening date (YYYY-MM-DD)'
                                },
                                average_monthly_balance: {
                                    type: 'number',
                                    required: true,
                                    minimum: 0,
                                    description: 'Average monthly balance in last 6 months'
                                }
                            },
                            description: 'Primary bank account details for salary/income credit'
                        },
                        existing_loans: {
                            type: 'array',
                            required: true,
                            items: {
                                type: 'object',
                                properties: {
                                    loan_type: {
                                        type: 'string',
                                        enum: ['home_loan', 'personal_loan', 'car_loan', 'education_loan', 'business_loan', 'credit_card', 'other'],
                                        description: 'Type of existing loan'
                                    },
                                    bank_name: {
                                        type: 'string',
                                        description: 'Lender name'
                                    },
                                    outstanding_amount: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Outstanding loan amount'
                                    },
                                    monthly_emi: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Monthly EMI amount'
                                    },
                                    remaining_tenure_months: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Remaining tenure in months'
                                    }
                                }
                            },
                            description: 'List of existing loans (empty array if none)'
                        },
                        credit_cards: {
                            type: 'array',
                            required: true,
                            items: {
                                type: 'object',
                                properties: {
                                    bank_name: {
                                        type: 'string',
                                        description: 'Credit card issuing bank'
                                    },
                                    credit_limit: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Credit card limit'
                                    },
                                    outstanding_amount: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Current outstanding amount'
                                    }
                                }
                            },
                            description: 'List of credit cards (empty array if none)'
                        },
                        monthly_expenses: {
                            type: 'object',
                            required: true,
                            properties: {
                                rent_mortgage: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Monthly rent or mortgage payment'
                                },
                                utilities: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Monthly utilities (electricity, water, gas, etc.)'
                                },
                                food_groceries: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Monthly food and groceries'
                                },
                                transportation: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Monthly transportation costs'
                                },
                                other_expenses: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Other monthly expenses'
                                },
                                total_monthly_expenses: {
                                    type: 'number',
                                    minimum: 0,
                                    description: 'Total monthly expenses'
                                }
                            },
                            description: 'Detailed monthly expense breakdown'
                        }
                    },
                    references: {
                        type: 'array',
                        required: true,
                        minItems: 2,
                        maxItems: 3,
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    required: true,
                                    minLength: 2,
                                    maxLength: 50,
                                    description: 'Reference person full name'
                                },
                                mobile: {
                                    type: 'string',
                                    required: true,
                                    pattern: '^[0-9]{10}$',
                                    description: 'Reference person mobile number'
                                },
                                relationship: {
                                    type: 'string',
                                    required: true,
                                    enum: ['family', 'friend', 'colleague', 'neighbor', 'business_associate'],
                                    description: 'Relationship with applicant'
                                },
                                address: {
                                    type: 'string',
                                    required: true,
                                    minLength: 10,
                                    description: 'Reference person address'
                                },
                                years_known: {
                                    type: 'number',
                                    required: true,
                                    minimum: 1,
                                    maximum: 50,
                                    description: 'Number of years known to applicant'
                                }
                            }
                        },
                        description: 'Personal references (2-3 required)'
                    },

                    // Document Requirements for Verification
                    required_documents: {
                        type: 'object',
                        required: true,
                        properties: {
                            identity_proof: {
                                type: 'object',
                                required: true,
                                properties: {
                                    document_type: {
                                        type: 'string',
                                        enum: ['aadhaar', 'passport', 'voter_id', 'driving_license'],
                                        description: 'Type of identity document'
                                    },
                                    document_number: {
                                        type: 'string',
                                        required: true,
                                        description: 'Document number'
                                    },
                                    document_url: {
                                        type: 'string',
                                        required: true,
                                        format: 'uri',
                                        description: 'Uploaded document URL'
                                    }
                                }
                            },
                            address_proof: {
                                type: 'object',
                                required: true,
                                properties: {
                                    document_type: {
                                        type: 'string',
                                        enum: ['aadhaar', 'utility_bill', 'bank_statement', 'rental_agreement', 'property_tax'],
                                        description: 'Type of address proof document'
                                    },
                                    document_url: {
                                        type: 'string',
                                        required: true,
                                        format: 'uri',
                                        description: 'Uploaded document URL'
                                    }
                                }
                            },
                            income_proof: {
                                type: 'object',
                                required: true,
                                properties: {
                                    document_type: {
                                        type: 'string',
                                        enum: ['salary_slips', 'bank_statements', 'itr', 'form16', 'business_financials'],
                                        description: 'Type of income proof document'
                                    },
                                    documents: {
                                        type: 'array',
                                        required: true,
                                        minItems: 1,
                                        items: {
                                            type: 'object',
                                            properties: {
                                                document_name: {
                                                    type: 'string',
                                                    description: 'Document name/description'
                                                },
                                                document_url: {
                                                    type: 'string',
                                                    format: 'uri',
                                                    description: 'Uploaded document URL'
                                                },
                                                document_date: {
                                                    type: 'string',
                                                    format: 'date',
                                                    description: 'Document date'
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            bank_statements: {
                                type: 'object',
                                required: true,
                                properties: {
                                    months_provided: {
                                        type: 'number',
                                        required: true,
                                        minimum: 3,
                                        maximum: 12,
                                        description: 'Number of months of bank statements provided'
                                    },
                                    statements: {
                                        type: 'array',
                                        required: true,
                                        minItems: 3,
                                        items: {
                                            type: 'object',
                                            properties: {
                                                month_year: {
                                                    type: 'string',
                                                    pattern: '^(0[1-9]|1[0-2])-20[0-9]{2}$',
                                                    description: 'Month-Year (MM-YYYY)'
                                                },
                                                document_url: {
                                                    type: 'string',
                                                    format: 'uri',
                                                    description: 'Bank statement document URL'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        description: 'All required documents for loan processing'
                    },

                    // Additional Verification Fields
                    additional_information: {
                        type: 'object',
                        required: true,
                        properties: {
                            loan_purpose_details: {
                                type: 'string',
                                required: true,
                                minLength: 10,
                                maxLength: 500,
                                description: 'Detailed explanation of loan purpose'
                            },
                            repayment_source: {
                                type: 'string',
                                required: true,
                                enum: ['salary', 'business_income', 'rental_income', 'other_income', 'mixed_sources'],
                                description: 'Primary source for loan repayment'
                            },
                            preferred_tenure_months: {
                                type: 'number',
                                required: true,
                                minimum: 6,
                                maximum: 84,
                                description: 'Preferred loan tenure in months'
                            },
                            existing_relationship_with_bank: {
                                type: 'boolean',
                                required: true,
                                description: 'Whether applicant has existing relationship with our bank'
                            },
                            co_applicant_required: {
                                type: 'boolean',
                                required: true,
                                description: 'Whether co-applicant is required'
                            },
                            property_owned: {
                                type: 'boolean',
                                required: true,
                                description: 'Whether applicant owns any property'
                            },
                            insurance_coverage: {
                                type: 'object',
                                required: true,
                                properties: {
                                    life_insurance: {
                                        type: 'boolean',
                                        description: 'Has life insurance coverage'
                                    },
                                    health_insurance: {
                                        type: 'boolean',
                                        description: 'Has health insurance coverage'
                                    },
                                    total_coverage_amount: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Total insurance coverage amount'
                                    }
                                }
                            }
                        },
                        description: 'Additional information for comprehensive assessment'
                    }
                },
                requestId
            };

            res.status(200).json(requiredFields);

        } catch (error) {
            logger.error(`[${requestId}] Get required fields error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = LoanApplicationController;