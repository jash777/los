/**
 * SurePass API Integration Service
 * Handles PAN verification and CIBIL credit report fetching
 * Includes rate limiting, error handling, and retry mechanisms
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { thirdPartyAPILimiter } = require('../rate-limiter');

class SurePassService {
    constructor() {
        this.baseURL = 'https://sandbox.surepass.app/api/v1';
        this.authToken = process.env.SUREPASS_AUTH_TOKEN || '';
        
        // Test mode configuration
        this.isTestMode = process.env.NODE_ENV === 'test' || process.env.MOCK_MODE === 'true';
        
        // Use centralized rate limiter
        this.rateLimiter = thirdPartyAPILimiter;
        
        // Retry configuration
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            backoffMultiplier: 2
        };
    }

    /**
     * Check rate limit for API calls
     */
    async checkRateLimit(endpoint) {
        try {
            const result = await this.rateLimiter.checkRateLimit('surepass', endpoint);
            logger.debug(`Rate limit check passed for ${endpoint}`, {
                remaining: result.remaining,
                resetTime: new Date(result.resetTime).toISOString()
            });
            return result;
        } catch (error) {
            logger.warn(`Rate limit exceeded for ${endpoint}`, {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, data, requestId, retryCount = 0) {
        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            });
            
            return response.data;
        } catch (error) {
            logger.error(`[${requestId}] SurePass API request failed (attempt ${retryCount + 1})`, {
                url,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            // Check if we should retry
            if (retryCount < this.retryConfig.maxRetries && this.shouldRetry(error)) {
                const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
                logger.info(`[${requestId}] Retrying request after ${delay}ms`);
                
                await this.sleep(delay);
                return this.makeRequest(url, data, requestId, retryCount + 1);
            }
            
            throw this.handleAPIError(error, requestId);
        }
    }

    /**
     * Determine if error should trigger a retry
     */
    shouldRetry(error) {
        // Retry on network errors, timeouts, and 5xx server errors
        return (
            error.code === 'ECONNABORTED' || // Timeout
            error.code === 'ENOTFOUND' || // Network error
            error.code === 'ECONNRESET' || // Connection reset
            (error.response && error.response.status >= 500) // Server errors
        );
    }

    /**
     * Handle API errors and convert to standardized format
     */
    handleAPIError(error, requestId) {
        if (error.code === 'ECONNABORTED') {
            return new Error('SurePass API timeout - please try again later');
        }
        
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Unknown API error';
            
            switch (status) {
                case 400:
                    return new Error(`Invalid request: ${message}`);
                case 401:
                    return new Error('Authentication failed - invalid token');
                case 403:
                    return new Error('Access forbidden - insufficient permissions');
                case 422:
                    return new Error(`Validation error: ${message}`);
                case 429:
                    return new Error('Rate limit exceeded - please try again later');
                case 500:
                    return new Error('SurePass server error - please try again later');
                default:
                    return new Error(`SurePass API error (${status}): ${message}`);
            }
        }
        
        return new Error(`Network error: ${error.message}`);
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verify PAN number with comprehensive details
     */
    async verifyPAN(panNumber, requestId) {
        try {
            logger.info(`[${requestId}] Starting PAN verification`, { panNumber: panNumber ? panNumber.substring(0, 5) + 'XXXXX' : 'undefined' });
            
            if (!panNumber) {
                throw new Error('PAN number is required');
            }
            
            // Return mock data in test mode
            if (this.isTestMode) {
                return this.getMockPANResponse(panNumber, requestId);
            }
            
            // Check rate limit
            await this.checkRateLimit('pan-comprehensive');
            
            // Validate PAN format
            if (!this.isValidPANFormat(panNumber)) {
                throw new Error('Invalid PAN format. Expected format: ABCDE1234F');
            }
            
            const url = `${this.baseURL}/pan/pan-comprehensive`;
            const requestData = {
                id_number: panNumber
            };
            
            const response = await this.makeRequest(url, requestData, requestId);
            
            return this.parsePANResponse(response, requestId);
            
        } catch (error) {
            logger.error(`[${requestId}] PAN verification failed`, {
                panNumber: panNumber.substring(0, 5) + 'XXXXX',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Fetch CIBIL credit report
     */
    async fetchCreditReport(name, mobile, panNumber, requestId) {
        try {
            logger.info(`[${requestId}] Starting CIBIL credit report fetch`, {
                name,
                mobile: mobile.substring(0, 6) + 'XXXX',
                panNumber: panNumber.substring(0, 5) + 'XXXXX'
            });
            
            // Check rate limit
            await this.checkRateLimit('credit-report-experian');
            
            // Validate inputs
            if (!name || !mobile || !panNumber) {
                throw new Error('Name, mobile, and PAN are required for credit report');
            }
            
            if (!this.isValidPANFormat(panNumber)) {
                throw new Error('Invalid PAN format for credit report');
            }
            
            if (!this.isValidMobileFormat(mobile)) {
                throw new Error('Invalid mobile format. Expected 10 digits');
            }
            
            const url = `${this.baseURL}/credit-report-experian/fetch-report`;
            const requestData = {
                name: name.trim(),
                consent: 'Y',
                mobile: mobile,
                pan: panNumber
            };
            
            const response = await this.makeRequest(url, requestData, requestId);
            
            const parsedResponse = this.parseCreditReportResponse(response, requestId);
            
            // Add request data for future matching
            parsedResponse.requestData = {
                name: name.trim(),
                mobile: mobile,
                pan: panNumber
            };
            
            return parsedResponse;
            
        } catch (error) {
            logger.error(`[${requestId}] Credit report fetch failed`, {
                name,
                mobile: mobile.substring(0, 6) + 'XXXX',
                panNumber: panNumber.substring(0, 5) + 'XXXXX',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validate PAN format
     */
    isValidPANFormat(panNumber) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(panNumber);
    }

    /**
     * Validate mobile format
     */
    isValidMobileFormat(mobile) {
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile);
    }

    /**
     * Parse PAN verification response
     */
    parsePANResponse(response, requestId) {
        logger.info(`[${requestId}] Parsing PAN verification response`, {
            success: response.success,
            statusCode: response.status_code
        });
        
        const result = {
            success: response.success || false,
            statusCode: response.status_code,
            message: response.message,
            clientId: response.data?.client_id,
            verification: {
                panNumber: response.data?.pan_number,
                fullName: response.data?.full_name,
                fullNameSplit: response.data?.full_name_split || [],
                maskedAadhaar: response.data?.masked_aadhaar,
                email: response.data?.email,
                phoneNumber: response.data?.phone_number,
                gender: response.data?.gender,
                dob: response.data?.dob,
                dobVerified: response.data?.dob_verified || false,
                dobCheck: response.data?.dob_check || false,
                aadhaarLinked: response.data?.aadhaar_linked,
                category: response.data?.category,
                status: response.data?.status,
                lessInfo: response.data?.less_info || false,
                address: response.data?.address || {}
            },
            timestamp: new Date().toISOString()
        };
        
        // Determine verification status
        result.isValid = response.success && response.data?.status === 'valid';
        result.isActive = result.isValid && !result.verification.lessInfo;
        
        return result;
    }

    /**
     * Parse credit report response
     */
    parseCreditReportResponse(response, requestId) {
        logger.info(`[${requestId}] Parsing credit report response`, {
            hasData: !!response.data,
            creditScore: response.data?.credit_score
        });
        
        const result = {
            success: !!response.data,
            clientId: response.data?.client_id,
            personalInfo: {
                name: response.data?.name,
                mobile: response.data?.mobile,
                panNumber: response.data?.pan
            },
            creditScore: response.data?.credit_score ? parseInt(response.data.credit_score) : null,
            creditReport: response.data?.credit_report || {},
            timestamp: new Date().toISOString()
        };
        
        // Extract key credit information
        if (result.creditReport.CAIS_Account) {
            const summary = result.creditReport.CAIS_Account.CAIS_Summary;
            result.creditSummary = {
                totalAccounts: summary?.Credit_Account?.CreditAccountTotal || 0,
                activeAccounts: summary?.Credit_Account?.CreditAccountActive || 0,
                closedAccounts: summary?.Credit_Account?.CreditAccountClosed || 0,
                defaultAccounts: summary?.Credit_Account?.CreditAccountDefault || 0,
                totalOutstanding: summary?.Total_Outstanding_Balance?.Outstanding_Balance_All || 0,
                securedOutstanding: summary?.Total_Outstanding_Balance?.Outstanding_Balance_Secured || 0,
                unsecuredOutstanding: summary?.Total_Outstanding_Balance?.Outstanding_Balance_UnSecured || 0
            };
        }
        
        // Determine credit quality
        if (result.creditScore) {
            if (result.creditScore >= 750) {
                result.creditGrade = 'Excellent';
            } else if (result.creditScore >= 700) {
                result.creditGrade = 'Good';
            } else if (result.creditScore >= 650) {
                result.creditGrade = 'Fair';
            } else {
                result.creditGrade = 'Poor';
            }
        }
        
        return result;
    }

    /**
     * Combined verification method - makes single request for both PAN and CIBIL
     * Saves responses to application-specific folders to reduce API calls
     */
    async performCombinedVerification(personalInfo, applicationId, requestId) {
        try {
            logger.info(`[${requestId}] Starting combined PAN and CIBIL verification for application ${applicationId}`);
            
            const { first_name, last_name, pan_number, mobile } = personalInfo;
            const fullName = `${first_name} ${last_name}`.trim();
            
            // Check if cached data exists
            const cachedData = await this.getCachedVerificationData(applicationId, requestId);
            if (cachedData) {
                logger.info(`[${requestId}] Using cached verification data for application ${applicationId}`);
                return cachedData;
            }
            
            // Check for existing PAN data across all applications to avoid duplicate API calls
            const existingPanData = await this.findExistingPanData(pan_number, requestId);
            if (existingPanData && existingPanData.isValid !== undefined) {
                logger.info(`[${requestId}] Found existing PAN data for ${pan_number}, reusing for application ${applicationId}`);
                
                // Create application directory and save the existing data
                await this.createApplicationDirectory(applicationId);
                
                // Check for existing credit report data to avoid duplicate API calls
                let creditResult = null;
                if (mobile) {
                    creditResult = await this.findExistingCreditData(mobile, pan_number, requestId);
                    
                    if (!creditResult) {
                        try {
                            logger.info(`[${requestId}] No existing credit data found, fetching new credit report`);
                            creditResult = await this.fetchCreditReport(fullName, mobile, pan_number, requestId);
                        } catch (creditError) {
                            logger.warn(`[${requestId}] Credit report fetch failed, using PAN data only`, {
                                error: creditError.message
                            });
                        }
                    } else {
                        logger.info(`[${requestId}] Found existing credit data, reusing to avoid API call`);
                    }
                }
                
                // Perform name matching
                const nameMatch = existingPanData && existingPanData.verification && existingPanData.verification.fullName ? 
                    this.performNameMatching(fullName, existingPanData.verification.fullName, requestId) : {
                    score: 0,
                    match: false,
                    reason: 'No name available from existing PAN data'
                };
                
                // Save verification data with enhanced metadata
                await this.saveVerificationData(applicationId, existingPanData, creditResult, requestId, personalInfo, nameMatch);
                
                // Compile verification result
                const verificationResult = {
                    success: existingPanData?.isValid || false,
                    requestId,
                    applicationId,
                    timestamp: new Date().toISOString(),
                    panVerification: existingPanData,
                    creditReport: creditResult,
                    nameMatching: nameMatch,
                    overallScore: this.calculateVerificationScore(existingPanData, creditResult, nameMatch),
                    recommendations: this.generateRecommendations(existingPanData, creditResult, nameMatch),
                    cached: false,
                    reusedPanData: true
                };
                
                logger.info(`[${requestId}] Combined verification completed using existing PAN data for application ${applicationId}`, {
                    success: verificationResult.success,
                    overallScore: verificationResult.overallScore,
                    panValid: existingPanData?.isValid,
                    creditScore: creditResult?.creditScore,
                    nameMatchScore: nameMatch.score
                });
                
                return verificationResult;
            }
            
            // Create application directory
            await this.createApplicationDirectory(applicationId);
            
            // Make both API calls concurrently to reduce total time
            const [panResult, creditResult] = await Promise.allSettled([
                this.verifyPAN(pan_number, requestId),
                mobile ? this.fetchCreditReport(fullName, mobile, pan_number, requestId) : Promise.resolve(null)
            ]);
            
            // Process results
            const panData = panResult.status === 'fulfilled' ? panResult.value : null;
            const creditData = creditResult.status === 'fulfilled' ? creditResult.value : null;
            
            // Perform name matching
            const nameMatch = panData && panData.verification && panData.verification.fullName ? 
                this.performNameMatching(fullName, panData.verification.fullName, requestId) : {
                score: 0,
                match: false,
                reason: 'PAN verification failed or no name available'
            };
            
            // Save individual responses to files with enhanced metadata
            await this.saveVerificationData(applicationId, panData, creditData, requestId, personalInfo, nameMatch);
            
            // Compile verification result
            const verificationResult = {
                success: panData?.isValid || false,
                requestId,
                applicationId,
                timestamp: new Date().toISOString(),
                panVerification: panData,
                creditReport: creditData,
                nameMatching: nameMatch,
                overallScore: this.calculateVerificationScore(panData, creditData, nameMatch),
                recommendations: this.generateRecommendations(panData, creditData, nameMatch),
                cached: false
            };
            
            logger.info(`[${requestId}] Combined verification completed for application ${applicationId}`, {
                success: verificationResult.success,
                overallScore: verificationResult.overallScore,
                panValid: panData?.isValid,
                creditScore: creditData?.creditScore,
                nameMatchScore: nameMatch.score
            });
            
            return verificationResult;
            
        } catch (error) {
            logger.error(`[${requestId}] Combined verification failed for application ${applicationId}`, {
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Find existing credit report data across all applications to avoid duplicate API calls
     */
    async findExistingCreditData(mobile, panNumber, requestId) {
        try {
            const applicationDataDir = path.join(process.cwd(), 'application_data');
            
            // Check if application_data directory exists
            try {
                await fs.access(applicationDataDir);
            } catch {
                logger.debug(`[${requestId}] No application_data directory found`);
                return null;
            }
            
            // Read all application directories
            const appDirs = await fs.readdir(applicationDataDir);
            
            for (const appDir of appDirs) {
                const creditFilePath = path.join(applicationDataDir, appDir, 'cibil_report.json');
                
                try {
                    // Check if credit report file exists
                    await fs.access(creditFilePath);
                    
                    // Read and parse the credit data
                    const creditDataRaw = await fs.readFile(creditFilePath, 'utf8');
                    const creditData = JSON.parse(creditDataRaw);
                    
                    // Check if this credit data matches the requested mobile and PAN
                    if (creditData.requestData && 
                        creditData.requestData.mobile === mobile && 
                        creditData.requestData.pan === panNumber) {
                        logger.info(`[${requestId}] Found existing credit data for mobile ${mobile.substring(0, 6)}XXXX and PAN ${panNumber} in application ${appDir}`);
                        return creditData;
                    }
                } catch (fileError) {
                    // File doesn't exist or can't be read, continue to next directory
                    continue;
                }
            }
            
            logger.debug(`[${requestId}] No existing credit data found for mobile ${mobile.substring(0, 6)}XXXX and PAN ${panNumber}`);
            return null;
            
        } catch (error) {
            logger.error(`[${requestId}] Error searching for existing credit data`, {
                error: error.message
            });
            return null;
        }
    }

    /**
     * Find existing PAN data across all applications to avoid duplicate API calls
     */
    async findExistingPanData(panNumber, requestId) {
        try {
            const applicationDataDir = path.join(process.cwd(), 'application_data');
            
            // Check if application_data directory exists
            try {
                await fs.access(applicationDataDir);
            } catch {
                logger.debug(`[${requestId}] No application_data directory found`);
                return null;
            }
            
            // Read all application directories
            const appDirs = await fs.readdir(applicationDataDir);
            
            for (const appDir of appDirs) {
                const panFilePath = path.join(applicationDataDir, appDir, 'pan_verification.json');
                
                try {
                    // Check if PAN verification file exists
                    await fs.access(panFilePath);
                    
                    // Read and parse the PAN data
                    const panDataRaw = await fs.readFile(panFilePath, 'utf8');
                    const panData = JSON.parse(panDataRaw);
                    
                    // Check if this PAN data matches the requested PAN number
                    if (panData.verification && panData.verification.panNumber === panNumber) {
                        logger.info(`[${requestId}] Found existing PAN data for ${panNumber} in application ${appDir}`);
                        return panData;
                    }
                } catch (fileError) {
                    // File doesn't exist or can't be read, continue to next directory
                    continue;
                }
            }
            
            logger.debug(`[${requestId}] No existing PAN data found for ${panNumber}`);
            return null;
            
        } catch (error) {
            logger.error(`[${requestId}] Error searching for existing PAN data`, {
                error: error.message
            });
            return null;
        }
    }

    /**
     * Create application directory for storing verification data
     */
    async createApplicationDirectory(applicationId) {
        const appDir = path.join(process.cwd(), 'application_data', applicationId);
        try {
            await fs.mkdir(appDir, { recursive: true });
            logger.debug(`Created application directory: ${appDir}`);
        } catch (error) {
            logger.warn(`Failed to create application directory: ${error.message}`);
        }
    }
    
    /**
     * Save verification data to application-specific files
     */
    async saveVerificationData(applicationId, panData, creditData, requestId, personalInfo = null, nameMatchResult = null) {
        const appDir = path.join(process.cwd(), 'application_data', applicationId);
        
        try {
            // Save PAN data
            if (panData) {
                const panFile = path.join(appDir, 'pan_verification.json');
                await fs.writeFile(panFile, JSON.stringify(panData, null, 2));
                logger.debug(`[${requestId}] Saved PAN data to ${panFile}`);
            }
            
            // Save CIBIL data
            if (creditData) {
                const cibilFile = path.join(appDir, 'cibil_report.json');
                await fs.writeFile(cibilFile, JSON.stringify(creditData, null, 2));
                logger.debug(`[${requestId}] Saved CIBIL data to ${cibilFile}`);
            }
            
            // Save application data if provided
            if (personalInfo) {
                const applicationData = {
                    applicationId,
                    timestamp: new Date().toISOString(),
                    personalInfo,
                    requestId
                };
                const appDataFile = path.join(appDir, 'application_data.json');
                await fs.writeFile(appDataFile, JSON.stringify(applicationData, null, 2));
                logger.debug(`[${requestId}] Saved application data to ${appDataFile}`);
            }
            
            // Save combined metadata with enhanced information
            const metadata = {
                applicationId,
                timestamp: new Date().toISOString(),
                panDataAvailable: !!panData,
                cibilDataAvailable: !!creditData,
                requestId,
                ...(personalInfo && {
                    providedName: `${personalInfo.first_name} ${personalInfo.last_name}`.trim(),
                    providedPAN: personalInfo.pan_number,
                    providedMobile: personalInfo.mobile
                }),
                ...(panData && panData.verification && {
                    panVerifiedName: panData.verification.fullName,
                    panStatus: panData.verification.status
                }),
                ...(nameMatchResult && {
                    nameMatching: nameMatchResult
                })
            };
            
            const metadataFile = path.join(appDir, 'verification_metadata.json');
            await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
            logger.debug(`[${requestId}] Saved enhanced metadata to ${metadataFile}`);
            
        } catch (error) {
            logger.warn(`[${requestId}] Failed to save verification data: ${error.message}`);
        }
    }
    
    /**
     * Get cached verification data if available
     */
    async getCachedVerificationData(applicationId, requestId) {
        const appDir = path.join(process.cwd(), 'application_data', applicationId);
        
        try {
            // Check if metadata file exists
            const metadataFile = path.join(appDir, 'verification_metadata.json');
            const metadataExists = await fs.access(metadataFile).then(() => true).catch(() => false);
            
            if (!metadataExists) {
                return null;
            }
            
            // Read metadata
            const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));
            
            // Check if data is recent (within 24 hours)
            const dataAge = Date.now() - new Date(metadata.timestamp).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (dataAge > maxAge) {
                logger.debug(`[${requestId}] Cached data expired for application ${applicationId}`);
                return null;
            }
            
            // Load cached data
            let panData = null;
            let creditData = null;
            
            if (metadata.panDataAvailable) {
                const panFile = path.join(appDir, 'pan_verification.json');
                panData = JSON.parse(await fs.readFile(panFile, 'utf8'));
            }
            
            if (metadata.cibilDataAvailable) {
                const cibilFile = path.join(appDir, 'cibil_report.json');
                creditData = JSON.parse(await fs.readFile(cibilFile, 'utf8'));
            }
            
            // Reconstruct verification result
            const nameMatch = panData ? this.performNameMatching(
                metadata.fullName || 'Unknown',
                panData.verification.fullName,
                requestId
            ) : { score: 0, match: false, reason: 'No cached PAN data' };
            
            return {
                success: panData?.isValid || false,
                requestId,
                applicationId,
                timestamp: metadata.timestamp,
                panVerification: panData,
                creditReport: creditData,
                nameMatching: nameMatch,
                overallScore: this.calculateVerificationScore(panData, creditData, nameMatch),
                recommendations: this.generateRecommendations(panData, creditData, nameMatch),
                cached: true
            };
            
        } catch (error) {
            logger.debug(`[${requestId}] No cached data available for application ${applicationId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Perform comprehensive identity verification
     * Combines PAN verification with name matching
     */
    async performIdentityVerification(personalInfo, requestId) {
        try {
            logger.info(`[${requestId}] Starting comprehensive identity verification`);
            
            const { first_name, last_name, pan_number, mobile } = personalInfo;
            const fullName = `${first_name} ${last_name}`.trim();
            
            // Step 1: Verify PAN
            const panResult = await this.verifyPAN(pan_number, requestId);
            
            // Step 2: Fetch credit report (if PAN is valid)
            let creditResult = null;
            if (panResult && panResult.isValid && mobile) {
                try {
                    creditResult = await this.fetchCreditReport(fullName, mobile, pan_number, requestId);
                } catch (creditError) {
                    logger.warn(`[${requestId}] Credit report fetch failed, continuing with PAN verification only`, {
                        error: creditError.message
                    });
                }
            }
            
            // Step 3: Perform name matching
            const nameMatch = this.performNameMatching(fullName, panResult.verification.fullName, requestId);
            
            // Step 4: Compile verification result
            const verificationResult = {
                success: panResult.isValid,
                requestId,
                timestamp: new Date().toISOString(),
                panVerification: panResult,
                creditReport: creditResult,
                nameMatching: nameMatch,
                overallScore: this.calculateVerificationScore(panResult, creditResult, nameMatch),
                recommendations: this.generateRecommendations(panResult, creditResult, nameMatch)
            };
            
            logger.info(`[${requestId}] Identity verification completed`, {
                success: verificationResult.success,
                overallScore: verificationResult.overallScore,
                panValid: panResult.isValid,
                creditScore: creditResult?.creditScore,
                nameMatchScore: nameMatch.score
            });
            
            return verificationResult;
            
        } catch (error) {
            logger.error(`[${requestId}] Identity verification failed`, {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Perform name matching between provided name and PAN name
     */
    performNameMatching(providedName, panName, requestId) {
        if (!panName) {
            return {
                score: 0,
                match: false,
                reason: 'No name available from PAN verification'
            };
        }
        
        const normalizedProvided = this.normalizeName(providedName);
        const normalizedPAN = this.normalizeName(panName);
        
        // Calculate similarity score
        const score = this.calculateNameSimilarity(normalizedProvided, normalizedPAN);
        const match = score >= 0.8; // 80% similarity threshold
        
        logger.info(`[${requestId}] Name matching completed`, {
            providedName: normalizedProvided,
            panName: normalizedPAN,
            score,
            match
        });
        
        return {
            score,
            match,
            providedName: normalizedProvided,
            panName: normalizedPAN,
            reason: match ? 'Names match sufficiently' : 'Names do not match sufficiently'
        };
    }

    /**
     * Normalize name for comparison
     */
    normalizeName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z\s]/g, '') // Remove non-alphabetic characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }

    /**
     * Calculate name similarity using Levenshtein distance
     */
    calculateNameSimilarity(name1, name2) {
        const matrix = [];
        const len1 = name1.length;
        const len2 = name2.length;
        
        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        // Fill matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = name1[i - 1] === name2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1, // deletion
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        
        return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
    }

    /**
     * Calculate overall verification score
     */
    calculateVerificationScore(panResult, creditResult, nameMatch) {
        let score = 0;
        let maxScore = 0;
        
        // PAN verification (40% weight)
        maxScore += 40;
        if (panResult && panResult.isValid) {
            score += 40;
            if (panResult.isActive) {
                score += 10; // Bonus for active PAN
                maxScore += 10;
            }
        }
        
        // Name matching (30% weight)
        maxScore += 30;
        score += nameMatch.score * 30;
        
        // Credit report availability (30% weight)
        maxScore += 30;
        if (creditResult && creditResult.success) {
            score += 20;
            if (creditResult.creditScore) {
                score += 10; // Bonus for having credit score
            }
        }
        
        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }

    /**
     * Generate recommendations based on verification results
     */
    generateRecommendations(panResult, creditResult, nameMatch) {
        const recommendations = [];
        
        if (!panResult || !panResult.isValid) {
            recommendations.push({
                type: 'error',
                message: 'PAN verification failed - application cannot proceed',
                action: 'Verify PAN number and resubmit'
            });
        } else if (!panResult.isActive) {
            recommendations.push({
                type: 'warning',
                message: 'PAN has limited information available',
                action: 'Consider additional identity verification'
            });
        }
        
        if (!nameMatch.match) {
            recommendations.push({
                type: 'warning',
                message: 'Name mismatch detected between application and PAN',
                action: 'Verify correct name spelling or provide additional documentation'
            });
        }
        
        if (!creditResult || !creditResult.success) {
            recommendations.push({
                type: 'info',
                message: 'Credit report not available',
                action: 'Manual credit assessment may be required'
            });
        } else if (creditResult.creditScore && creditResult.creditScore < 650) {
            recommendations.push({
                type: 'warning',
                message: 'Low credit score detected',
                action: 'Additional financial documentation may be required'
            });
        }
        
        return recommendations;
    }

    /**
     * Verify Aadhar number
     */
    async verifyAadhar(aadharData, requestId) {
        try {
            logger.info(`[${requestId}] Starting Aadhar verification`);
            
            // Return mock data in test mode
            if (this.isTestMode) {
                return this.getMockAadharResponse(aadharData, requestId);
            }
            
            // In production, implement actual Aadhar verification API call
            // For now, return a basic success response
            return {
                success: true,
                verified: true,
                confidence: 95,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`[${requestId}] Aadhar verification failed`, {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get mock PAN response for testing
     */
    getMockPANResponse(panNumber, requestId) {
        logger.info(`[${requestId}] Returning mock PAN response`);
        
        return {
            success: true,
            isValid: true,
            isActive: true,
            statusCode: 200,
            message: 'PAN verification successful',
            verification: {
                panNumber: panNumber,
                fullName: 'John Smith',
                status: 'valid',
                lessInfo: false,
                overallScore: 95
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get mock Aadhar response for testing
     */
    getMockAadharResponse(aadharData, requestId) {
        logger.info(`[${requestId}] Returning mock Aadhar response`);
        
        return {
            success: true,
            verified: true,
            confidence: 95,
            message: 'Aadhar verification successful',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SurePassService;