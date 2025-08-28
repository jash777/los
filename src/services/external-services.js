/**
 * External Services Integration
 * Handles communication with third-party APIs (via simulator)
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ExternalServicesClient {
    constructor() {
        this.baseURL = process.env.THIRD_PARTY_API_URL || 'http://localhost:4000/api';
        this.timeout = 10000; // 10 seconds timeout
        
        // Create axios instance with default config
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                logger.info(`External API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('External API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`External API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error(`External API Error: ${error.response?.status} ${error.config?.url}`, error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Verify PAN card details with DOB cross-verification
     */
    async verifyPAN(panNumber, name, dateOfBirth = null) {
        try {
            logger.info(`Verifying PAN: ${panNumber} for ${name} with DOB: ${dateOfBirth}`);
            
            const requestBody = {
                pan_number: panNumber,
                name: name
            };
            
            // Include DOB if provided for cross-verification
            if (dateOfBirth) {
                requestBody.date_of_birth = dateOfBirth;
            }
            
            const response = await this.client.post('/pan/verify', requestBody);

            return {
                success: true,
                data: response.data,
                verification_status: response.data.success && response.data.data?.pan_status === 'Valid' ? 'verified' : 'failed',
                name_match: response.data.name_match || false,
                dob_match: response.data.dob_match,
                name_match_score: response.data.name_match_score
            };
        } catch (error) {
            logger.error('PAN verification failed:', error.message);
            
            // Handle DOB mismatch specifically
            if (error.response?.data?.error === 'DOB_MISMATCH') {
                return {
                    success: false,
                    error: 'Date of birth does not match PAN records',
                    verification_status: 'dob_mismatch',
                    dob_match: false
                };
            }
            
            return {
                success: false,
                error: error.message,
                verification_status: 'error'
            };
        }
    }

    /**
     * Get CIBIL credit score
     */
    async getCreditScore(panNumber, name, dateOfBirth, mobileNumber) {
        try {
            logger.info(`Fetching credit score for PAN: ${panNumber}`);
            
            const response = await this.client.post('/cibil/credit-score', {
                pan_number: panNumber,
                name: name,
                date_of_birth: dateOfBirth,
                mobile_number: mobileNumber
            });

            // Extract credit score from the response structure
            const creditScore = response.data.credit_score || 
                               response.data.data?.score_info?.cibil_score || 
                               response.data.data?.cibil_score;

            return {
                success: true,
                data: response.data,
                credit_score: creditScore,
                credit_grade: response.data.credit_grade || response.data.data?.score_info?.score_grade,
                existing_loans: response.data.existing_loans || response.data.data?.credit_accounts?.filter(acc => acc.account_type !== 'Credit Card') || [],
                credit_cards: response.data.credit_cards || response.data.data?.credit_accounts?.filter(acc => acc.account_type === 'Credit Card') || []
            };
        } catch (error) {
            logger.error('Credit score fetch failed:', error.message);
            return {
                success: false,
                error: error.message,
                credit_score: null
            };
        }
    }

    /**
     * Get bank statements via Account Aggregator
     */
    async getBankStatements(accountNumber, ifscCode, fromDate, toDate) {
        try {
            logger.info(`Fetching bank statements for account: ${accountNumber}`);
            
            const response = await this.client.post('/account-aggregator/bank-statements', {
                account_number: accountNumber,
                ifsc_code: ifscCode,
                consent_id: `CONSENT_${Date.now()}`,
                from_date: fromDate,
                to_date: toDate
            });

            return {
                success: true,
                data: response.data,
                summary: response.data.summary,
                transactions: response.data.transactions,
                analysis: response.data.analysis
            };
        } catch (error) {
            logger.error('Bank statements fetch failed:', error.message);
            return {
                success: false,
                error: error.message,
                summary: null
            };
        }
    }

    /**
     * Verify employment details
     */
    async verifyEmployment(employeeId, companyName, employeeName, designation) {
        try {
            logger.info(`Verifying employment for ${employeeName} at ${companyName}`);
            
            const response = await this.client.post('/employment/verify', {
                employee_id: employeeId,
                company_name: companyName,
                employee_name: employeeName,
                designation: designation
            });

            return {
                success: true,
                data: response.data,
                employment_status: response.data.employment_status,
                current_salary: response.data.current_salary,
                joining_date: response.data.joining_date
            };
        } catch (error) {
            logger.error('Employment verification failed:', error.message);
            return {
                success: false,
                error: error.message,
                employment_status: 'unverified'
            };
        }
    }

    /**
     * Verify GST details
     */
    async verifyGST(gstin, companyName) {
        try {
            logger.info(`Verifying GST: ${gstin} for ${companyName}`);
            
            const response = await this.client.post('/gst/verify', {
                gstin: gstin,
                company_name: companyName
            });

            return {
                success: true,
                data: response.data,
                legal_name: response.data.legal_name,
                status: response.data.status,
                registration_date: response.data.registration_date
            };
        } catch (error) {
            logger.error('GST verification failed:', error.message);
            return {
                success: false,
                error: error.message,
                status: 'unverified'
            };
        }
    }

    /**
     * Verify Aadhar details
     */
    async verifyAadhar(aadharNumber, name) {
        try {
            logger.info(`Verifying Aadhar: ${aadharNumber} for ${name}`);
            
            const response = await this.client.post('/aadhar/verify', {
                aadhar_number: aadharNumber,
                name: name
            });

            return {
                success: true,
                data: response.data,
                verification_status: response.data.verification_status,
                name_match: response.data.name_match,
                address: response.data.address
            };
        } catch (error) {
            logger.error('Aadhar verification failed:', error.message);
            return {
                success: false,
                error: error.message,
                verification_status: 'error'
            };
        }
    }

    /**
     * Check if external services are available
     */
    async checkServiceHealth() {
        try {
            const response = await axios.get(`${this.baseURL.replace('/api', '')}/health`, {
                timeout: 5000
            });
            
            return {
                available: true,
                services: response.data.services,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            logger.error('External services health check failed:', error.message);
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Batch verification for multiple services
     */
    async batchVerify(verifications) {
        const results = {};
        
        for (const [key, verification] of Object.entries(verifications)) {
            try {
                switch (verification.type) {
                    case 'pan':
                        results[key] = await this.verifyPAN(verification.pan_number, verification.name);
                        break;
                    case 'aadhar':
                        results[key] = await this.verifyAadhar(verification.aadhar_number, verification.name);
                        break;
                    case 'employment':
                        results[key] = await this.verifyEmployment(
                            verification.employee_id,
                            verification.company_name,
                            verification.employee_name,
                            verification.designation
                        );
                        break;
                    case 'gst':
                        results[key] = await this.verifyGST(verification.gstin, verification.company_name);
                        break;
                    default:
                        results[key] = { success: false, error: 'Unknown verification type' };
                }
            } catch (error) {
                results[key] = { success: false, error: error.message };
            }
        }
        
        return results;
    }
}

module.exports = ExternalServicesClient;