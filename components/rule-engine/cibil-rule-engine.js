const BaseRuleEngine = require('./base-rule-engine');
const JsonRuleEngine = require('./json-rule-engine');
const logger = require('../../middleware/utils/logger');

/**
 * CIBIL Rule Engine - JSON-based implementation
 * Migrated from hardcoded rules to flexible JSON configuration
 * Based on existing credit-bureau stage logic and CIBIL scoring standards
 */
class CIBILRuleEngine extends BaseRuleEngine {
    constructor(ruleConfig = {}) {
        super(ruleConfig);
        this.jsonRuleEngine = new JsonRuleEngine();
        this.initializeCIBILRules();
    }

    /**
     * Initialize CIBIL-specific rules (now using JSON configuration)
     */
    initializeCIBILRules() {
        logger.info('Initializing CIBIL Rule Engine with JSON configuration', {
            engine: 'CIBILRuleEngine',
            configVersion: this.jsonRuleEngine.getRuleConfiguration()?.version
        });

        // Validate JSON configuration
        const validation = this.jsonRuleEngine.validateConfiguration();
        if (!validation.valid) {
            logger.error('CIBIL Rule configuration validation failed', {
                errors: validation.errors,
                warnings: validation.warnings
            });
            throw new Error('Invalid CIBIL rule configuration');
        }

        if (validation.warnings.length > 0) {
            logger.warn('CIBIL Rule configuration warnings', {
                warnings: validation.warnings
            });
        }
    }

    /**
     * Process CIBIL verification using JSON-based rules
     * @param {Object} applicationData - Application data with CIBIL information
     * @param {string} requestId - Request ID for tracking
     * @returns {Object} CIBIL verification results
     */
    async processCIBILVerification(applicationData, requestId) {
        logger.info('Starting CIBIL verification process', {
            requestId,
            applicantName: `${applicationData.personal_info?.first_name} ${applicationData.personal_info?.last_name}`.trim()
        });
        
        // Debug: Log the data structure being passed to rule engine
        console.log('🔍 CIBIL Rule Engine Data Structure:', {
            hasPersonalInfo: !!applicationData.personal_info,
            hasCreditReport: !!applicationData.credit_report,
            creditReportKeys: applicationData.credit_report ? Object.keys(applicationData.credit_report) : 'undefined',
            cibilScore: applicationData.credit_report?.cibil_score,
            fullDataKeys: Object.keys(applicationData)
        });

        try {
            // Execute CIBIL rules using JSON configuration
            const cibilResults = this.jsonRuleEngine.executeRules('cibil_rules', applicationData, requestId);
            
            // Process results and determine CIBIL status
            const cibilVerification = this.processCIBILResults(cibilResults, applicationData, requestId);
            
            logger.info('CIBIL verification completed', {
                requestId,
                status: cibilVerification.status,
                score: cibilVerification.score,
                creditScore: cibilVerification.creditScore
            });

            return cibilVerification;

        } catch (error) {
            logger.error('CIBIL verification failed', {
                requestId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                status: 'FAILED',
                error: {
                    message: error.message,
                    code: 'CIBIL_PROCESSING_ERROR'
                },
                score: 0,
                creditScore: null,
                flags: ['CIBIL_PROCESSING_FAILED'],
                recommendations: ['Manual credit review required due to processing error']
            };
        }
    }

    /**
     * Process CIBIL rule execution results
     * @param {Object} cibilResults - Results from JSON rule engine
     * @param {Object} applicationData - Original application data
     * @param {string} requestId - Request ID
     * @returns {Object} Processed CIBIL verification results
     */
    processCIBILResults(cibilResults, applicationData, requestId) {
        const verification = {
            success: true,
            status: 'PENDING',
            score: cibilResults.totalScore,
            maxScore: this.calculateMaxPossibleScore(),
            creditScore: applicationData.cibil_data?.score || null,
            flags: cibilResults.flags,
            messages: cibilResults.messages,
            creditChecks: {
                scoreVerification: false,
                historyVerification: false,
                defaultCheck: false,
                enquiryCheck: false,
                accountStatusCheck: false
            },
            ruleResults: cibilResults.ruleResults,
            recommendations: [],
            riskLevel: 'MEDIUM'
        };

        // Analyze rule results to determine verification status
        this.analyzeCreditScore(verification, cibilResults, applicationData);
        this.analyzeCreditHistory(verification, cibilResults, applicationData);
        this.determineOverallCIBILStatus(verification, cibilResults);
        this.generateCIBILRecommendations(verification, applicationData);

        return verification;
    }

    /**
     * Calculate maximum possible score for CIBIL rules
     * @returns {number} Maximum possible score
     */
    calculateMaxPossibleScore() {
        const cibilRules = this.jsonRuleEngine.getRuleConfiguration('cibil_rules');
        let maxScore = 0;

        if (cibilRules) {
            for (const [subcategory, rules] of Object.entries(cibilRules)) {
                for (const [ruleId, rule] of Object.entries(rules)) {
                    if (rule.score > 0) {
                        maxScore += rule.score;
                    }
                }
            }
        }

        return maxScore || 100; // Default max score if no rules found
    }

    /**
     * Analyze credit score from CIBIL data
     * @param {Object} verification - Verification object to update
     * @param {Object} cibilResults - CIBIL rule results
     * @param {Object} applicationData - Application data
     */
    analyzeCreditScore(verification, cibilResults, applicationData) {
        const creditScore = applicationData.cibil_data?.score;
        if (creditScore) {
            verification.creditChecks.scoreVerification = creditScore >= 650;
            if (creditScore < 650) {
                verification.flags.push('LOW_CREDIT_SCORE');
                verification.recommendations.push('Improve credit score before reapplying');
            }
        }
    }

    /**
     * Analyze credit history from CIBIL data
     * @param {Object} verification - Verification object to update
     * @param {Object} cibilResults - CIBIL rule results
     * @param {Object} applicationData - Application data
     */
    analyzeCreditHistory(verification, cibilResults, applicationData) {
        const creditHistory = applicationData.cibil_data?.credit_history;
        if (creditHistory) {
            verification.creditChecks.historyVerification = creditHistory.length > 0;
            verification.creditChecks.defaultCheck = !creditHistory.some(item => item.status === 'default');
        }
    }

    /**
     * Determine overall CIBIL status
     * @param {Object} verification - Verification object to update
     * @param {Object} cibilResults - CIBIL rule results
     */
    determineOverallCIBILStatus(verification, cibilResults) {
        const passedRules = cibilResults.ruleResults?.filter(r => r.passed).length || 0;
        const totalRules = cibilResults.ruleResults?.length || 1;
        const passRate = passedRules / totalRules;

        if (passRate >= 0.8) {
            verification.status = 'APPROVED';
            verification.riskLevel = 'LOW';
        } else if (passRate >= 0.6) {
            verification.status = 'CONDITIONAL';
            verification.riskLevel = 'MEDIUM';
        } else {
            verification.status = 'REJECTED';
            verification.riskLevel = 'HIGH';
        }
    }

    /**
     * Generate CIBIL recommendations
     * @param {Object} verification - Verification object to update
     * @param {Object} applicationData - Application data
     */
    generateCIBILRecommendations(verification, applicationData) {
        if (verification.status === 'REJECTED') {
            verification.recommendations.push('Credit score improvement required');
            verification.recommendations.push('Consider secured credit products');
        } else if (verification.status === 'CONDITIONAL') {
            verification.recommendations.push('Additional documentation may be required');
        }
    }

}

module.exports = CIBILRuleEngine;