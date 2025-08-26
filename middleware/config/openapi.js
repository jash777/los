const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loan Management System API',
      version: '2.0.0',
      description: 'Comprehensive API for Loan Management System with modular architecture',
      contact: {
        name: 'API Support',
        email: 'support@loanmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        LoanApplication: {
          type: 'object',
          required: ['first_name', 'last_name', 'requested_amount'],
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            application_id: {
              type: 'string',
              example: 'APP-1735200977835'
            },
            first_name: {
              type: 'string',
              example: 'Rajesh'
            },
            last_name: {
              type: 'string',
              example: 'Kumar Singh'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'rajesh.kumar@example.com'
            },
            mobile: {
              type: 'string',
              example: '9876543210'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1985-05-15'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'male'
            },
            employment_type: {
              type: 'string',
              enum: ['salaried', 'self_employed'],
              example: 'salaried'
            },
            monthly_income: {
              type: 'number',
              example: 85000
            },
            requested_amount: {
              type: 'number',
              example: 500000
            },
            status: {
              type: 'string',
              enum: ['submitted', 'processing', 'approved', 'rejected'],
              example: 'submitted'
            }
          }
        },
        PreliminaryCheckRequest: {
          type: 'object',
          required: [
            'first_name', 'last_name', 'pan_number', 'date_of_birth',
            'gender', 'employment_type', 'monthly_income', 'company_name',
            'email', 'address', 'pincode', 'office_email', 'location'
          ],
          properties: {
            first_name: {
              type: 'string',
              example: 'Rajesh'
            },
            last_name: {
              type: 'string',
              example: 'Kumar Singh'
            },
            pan_number: {
              type: 'string',
              example: 'ABCDE1234F'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1985-05-15'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'male'
            },
            employment_type: {
              type: 'string',
              enum: ['salaried', 'self_employed'],
              example: 'salaried'
            },
            monthly_income: {
              type: 'number',
              example: 85000
            },
            company_name: {
              type: 'string',
              example: 'TCS Limited'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'rajesh.kumar@example.com'
            },
            address: {
              type: 'string',
              example: '123 MG Road, Bangalore'
            },
            pincode: {
              type: 'string',
              example: '560001'
            },
            office_email: {
              type: 'string',
              format: 'email',
              example: 'rajesh.kumar@tcs.com'
            },
            location: {
              type: 'string',
              example: 'Bangalore'
            }
          }
        },
        PreliminaryCheckResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                application_id: {
                  type: 'string',
                  example: 'APP-1735200977835'
                },
                eligible: {
                  type: 'boolean',
                  example: true
                },
                eligibility_score: {
                  type: 'number',
                  example: 85
                },
                verification_results: {
                  type: 'object',
                  properties: {
                    pan_verification: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'verified'
                        },
                        verified: {
                          type: 'boolean',
                          example: true
                        }
                      }
                    },
                    cibil_check: {
                      type: 'object',
                      properties: {
                        score: {
                          type: 'number',
                          example: 742
                        },
                        grade: {
                          type: 'string',
                          example: 'good'
                        }
                      }
                    }
                  }
                },
                loan_estimate: {
                  type: 'object',
                  properties: {
                    max_eligible_amount: {
                      type: 'number',
                      example: 612000
                    },
                    estimated_interest_rate: {
                      type: 'number',
                      example: 10.5
                    },
                    estimated_emi: {
                      type: 'number',
                      example: 19500
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/modules/*/routes.js'], // Updated paths
};

const specs = swaggerJSDoc(options);

module.exports = specs;