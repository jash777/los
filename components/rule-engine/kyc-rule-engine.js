const BaseRuleEngine = require('./base-rule-engine');
const JsonRuleEngine = require('./json-rule-engine');
const logger = require('../../middleware/utils/logger');

/**
 * KYC Rule Engine - JSON-based implementation
 * Migrated from hardcoded rules to flexible JSON configuration
 * Based on existing KYC-AML stage logic and RBI compliance requirements
 */
class KYCRuleEngine extends BaseRuleEngine {
    constructor(ruleConfig = {}) {
        super(ruleConfig);
        this.jsonRuleEngine = new JsonRuleEngine();
        this.initializeKYCRules();
    }

    /**
     * Initialize KYC-specific rules (now using JSON configuration)
     */
    initializeKYCRules() {
        logger.info('Initializing KYC Rule Engine with JSON configuration', {
            engine: 'KYCRuleEngine',
            configVersion: this.jsonRuleEngine.getRuleConfiguration()?.version
        });

        // Validate JSON configuration
        const validation = this.jsonRuleEngine.validateConfiguration();
        if (!validation.valid) {
            logger.error('KYC Rule configuration validation failed', {
                errors: validation.errors,
                warnings: validation.warnings
            });
            throw new Error('Invalid KYC rule configuration');
        }

        if (validation.warnings.length > 0) {
            logger.warn('KYC Rule configuration warnings', {
                warnings: validation.warnings
            });
        }
    }

    /**
     * Process KYC verification using JSON-based rules
     * @param {Object} applicationData - Application data to verify
     * @param {string} requestId - Request ID for tracking
     * @returns {Object} KYC verification results
     */
    async processKYCVerification(applicationData, requestId) {
        logger.info('Starting KYC verification process', {
            requestId,
            applicantName: `${applicationData.personal_info?.first_name} ${applicationData.personal_info?.last_name}`.trim()
        });

        try {
            // Execute KYC rules using JSON configuration
            const kycResults = this.jsonRuleEngine.executeRules('kyc_rules', applicationData, requestId);
            
            // Process results and determine KYC status
            const kycVerification = this.processKYCResults(kycResults, applicationData, requestId);
            
            logger.info('KYC verification completed', {
                requestId,
                status: kycVerification.status,
                score: kycVerification.score,
                flags: kycVerification.flags.length
            });

            return kycVerification;

        } catch (error) {
            logger.error('KYC verification failed', {
                requestId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                status: 'FAILED',
                error: {
                    message: error.message,
                    code: 'KYC_PROCESSING_ERROR'
                },
                score: 0,
                flags: ['KYC_PROCESSING_FAILED'],
                verificationChecks: {},
                recommendations: ['Manual review required due to processing error']
            };
        }
    }

    /**
     * Process KYC rule execution results
     * @param {Object} kycResults - Results from JSON rule engine
     * @param {Object} applicationData - Original application data
     * @param {string} requestId - Request ID
     * @returns {Object} Processed KYC verification results
     */
    processKYCResults(kycResults, applicationData, requestId) {
        const verification = {
            success: true,
            status: 'PENDING',
            score: kycResults.totalScore,
            maxScore: this.calculateMaxPossibleScore(),
            flags: kycResults.flags,
            messages: kycResults.messages,
            verificationChecks: {
                documentVerification: false,
                identityVerification: false,
                addressVerification: false,
                panVerification: false,
                aadharVerification: false
            },
            ruleResults: kycResults.ruleResults,
            recommendations: [],
            riskLevel: 'MEDIUM'
        };

        // Analyze rule results to determine verification status
        this.analyzeDocumentVerification(verification, kycResults);
        this.analyzeIdentityVerification(verification, kycResults);
        this.determineOverallKYCStatus(verification, kycResults);
        this.generateRecommendations(verification, applicationData);

        return verification;
    }

    /**
     * Analyze document verification results
     * @param {Object} verification - Verification object to update
     * @param {Object} kycResults - KYC rule results
     */
    analyzeDocumentVerification(verification, kycResults) {
        const docFlags = ['MANDATORY_DOCS_VERIFIED', 'ADDRESS_VERIFIED', 'PAN_FORMAT_VALID', 'AADHAR_FORMAT_VALID'];
        
        verification.verificationChecks.documentVerification = 
            docFlags.some(flag => verification.flags.includes(flag));
        
        verification.verificationChecks.panVerification = 
            verification.flags.includes('PAN_FORMAT_VALID');
        
        verification.verificationChecks.aadharVerification = 
            verification.flags.includes('AADHAR_FORMAT_VALID');
        
        verification.verificationChecks.addressVerification = 
            verification.flags.includes('ADDRESS_VERIFIED');
    }

    /**
     * Analyze identity verification results
     * @param {Object} verification - Verification object to update
     * @param {Object} kycResults - KYC rule results
     */
    analyzeIdentityVerification(verification, kycResults) {
        verification.verificationChecks.identityVerification = 
            verification.flags.includes('NAME_MATCH_SUCCESS');
    }

    /**
     * Determine overall KYC status based on rule results
     * @param {Object} verification - Verification object to update
     * @param {Object} kycResults - KYC rule results
     */
    determineOverallKYCStatus(verification, kycResults) {
        const criticalChecks = [
            verification.verificationChecks.documentVerification,
            verification.verificationChecks.panVerification,
            verification.verificationChecks.aadharVerification
        ];

        const passedCriticalChecks = criticalChecks.filter(check => check).length;
        const totalCriticalChecks = criticalChecks.length;

        // Determine status based on rule results and critical checks
        if (kycResults.overallAction === 'reject') {
            verification.status = 'REJECTED';
            verification.riskLevel = 'HIGH';
        } else if (passedCriticalChecks === totalCriticalChecks && 
                   verification.verificationChecks.identityVerification) {
            verification.status = 'APPROVED';
            verification.riskLevel = 'LOW';
        } else if (passedCriticalChecks >= totalCriticalChecks * 0.7) {
            verification.status = 'CONDITIONAL';
            verification.riskLevel = 'MEDIUM';
        } else {
            verification.status = 'REJECTED';
            verification.riskLevel = 'HIGH';
        }

        // Calculate score percentage
        const scorePercentage = (verification.score / verification.maxScore) * 100;
        if (scorePercentage < 50 && verification.status === 'APPROVED') {
            verification.status = 'CONDITIONAL';
        }
    }

    /**
     * Generate recommendations based on verification results
     * @param {Object} verification - Verification object to update
     * @param {Object} applicationData - Application data
     */
    generateRecommendations(verification, applicationData) {
        const recommendations = [];

        if (verification.status === 'REJECTED') {
            recommendations.push('Application rejected due to KYC verification failure');
            recommendations.push('Applicant should provide valid documents and reapply');
        } else if (verification.status === 'CONDITIONAL') {
            if (!verification.verificationChecks.documentVerification) {
                recommendations.push('Additional document verification required');
            }
            if (!verification.verificationChecks.identityVerification) {
                recommendations.push('Manual identity verification recommended');
            }
            if (!verification.verificationChecks.addressVerification) {
                recommendations.push('Address proof verification needed');
            }
        } else if (verification.status === 'APPROVED') {
            recommendations.push('KYC verification successful - proceed to next stage');
        }

        // Add specific recommendations based on missing verifications
        if (!verification.verificationChecks.panVerification) {
            recommendations.push('PAN verification required');
        }
        if (!verification.verificationChecks.aadharVerification) {
            recommendations.push('Aadhar verification required');
        }

        verification.recommendations = recommendations;
    }

    /**
     * Calculate maximum possible score for KYC rules
     * @returns {number} Maximum possible score
     */
    calculateMaxPossibleScore() {
        const kycRules = this.jsonRuleEngine.getRuleConfiguration('kyc_rules');
        let maxScore = 0;

        if (kycRules) {
            for (const [subcategory, rules] of Object.entries(kycRules)) {
                for (const [ruleId, rule] of Object.entries(rules)) {
                    if (rule.score > 0) {
                        maxScore += rule.score;
                    }
                }
            }
        }

        return maxScore;
    }

    /**
     * Get KYC verification statistics
     * @param {Object} verificationResult - KYC verification result
     * @returns {Object} Statistics object
     */
    getKYCStats(verificationResult) {
        return {
            totalChecks: Object.keys(verificationResult.verificationChecks).length,
            passedChecks: Object.values(verificationResult.verificationChecks).filter(check => check).length,
            score: verificationResult.score,
            maxScore: verificationResult.maxScore,
            scorePercentage: Math.round((verificationResult.score / verificationResult.maxScore) * 100),
            status: verificationResult.status,
            riskLevel: verificationResult.riskLevel,
            flagsCount: verificationResult.flags.length,
            recommendationsCount: verificationResult.recommendations.length
        };
    }

    /**
     * Update KYC rule configuration (reload from JSON)
     */
    updateConfiguration() {
        try {
            this.jsonRuleEngine.reloadConfiguration();
            this.initializeKYCRules();
            logger.info('KYC rule configuration updated successfully');
        } catch (error) {
            logger.error('Failed to update KYC rule configuration', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get current rule configuration
     * @returns {Object} Current KYC rule configuration
     */
    getCurrentConfiguration() {
        return this.jsonRuleEngine.getRuleConfiguration('kyc_rules');
    }
}

module.exports = KYCRuleEngine;