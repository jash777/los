const fs = require('fs');
const path = require('path');
const logger = require('../../middleware/utils/logger');

/**
 * JSON-based Rule Engine
 * Executes rules defined in JSON configuration files
 * Provides flexible, maintainable rule management
 */
class JsonRuleEngine {
    constructor(configPath = null) {
        this.configPath = configPath || path.join(__dirname, '../../middleware/config/rule-engine-config.json');
        this.ruleConfig = null;
        this.loadConfiguration();
    }

    /**
     * Load rule configuration from JSON file
     */
    loadConfiguration() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            this.ruleConfig = JSON.parse(configData);
            logger.info('Rule configuration loaded successfully', {
                version: this.ruleConfig.version,
                ruleTypes: this.ruleConfig.metadata?.rule_types || []
            });
        } catch (error) {
            logger.error('Failed to load rule configuration', {
                configPath: this.configPath,
                error: error.message
            });
            throw new Error(`Rule configuration loading failed: ${error.message}`);
        }
    }

    /**
     * Reload configuration from file (useful for dynamic updates)
     */
    reloadConfiguration() {
        this.loadConfiguration();
    }

    /**
     * Execute rules for a specific category
     * @param {string} ruleCategory - Category of rules to execute (kyc_rules, cibil_rules, etc.)
     * @param {Object} data - Application data to evaluate
     * @param {string} requestId - Request ID for logging
     * @returns {Object} Rule execution results
     */
    executeRules(ruleCategory, data, requestId = null) {
        if (!this.ruleConfig || !this.ruleConfig[ruleCategory]) {
            throw new Error(`Rule category '${ruleCategory}' not found in configuration`);
        }

        const categoryRules = this.ruleConfig[ruleCategory];
        const results = {
            category: ruleCategory,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            totalScore: 0,
            flags: [],
            messages: [],
            ruleResults: [],
            overallAction: 'approve',
            executionTime: Date.now()
        };

        logger.info(`Executing ${ruleCategory} rules`, {
            requestId,
            category: ruleCategory
        });

        // Execute rules in each subcategory
        for (const [subcategory, rules] of Object.entries(categoryRules)) {
            // Handle mutually exclusive CIBIL score rules
            if (subcategory === 'credit_score' && ruleCategory === 'cibil_rules') {
                const cibilScore = this.getNestedValue(data, 'credit_report.cibil_score');
                let applicableRuleId = null;
                
                // Determine which CIBIL score rule applies
                if (cibilScore >= 750) {
                    applicableRuleId = 'CIBIL_001';
                } else if (cibilScore >= 650) {
                    applicableRuleId = 'CIBIL_002';
                } else if (cibilScore >= 550) {
                    applicableRuleId = 'CIBIL_003';
                } else {
                    applicableRuleId = 'CIBIL_004';
                }
                
                // Only execute the applicable rule
                for (const [ruleId, rule] of Object.entries(rules)) {
                    if (ruleId === applicableRuleId) {
                        try {
                            const ruleResult = this.executeRule(rule, data, ruleId, requestId);
                            results.ruleResults.push(ruleResult);
                            results.totalRules++;

                            if (ruleResult.passed) {
                                results.passedRules++;
                                results.totalScore += rule.score || 0;
                                if (rule.flag) results.flags.push(rule.flag);
                                if (rule.message) results.messages.push(rule.message);
                            } else {
                                results.failedRules++;
                                if (rule.action === 'reject') {
                                    results.overallAction = 'reject';
                                } else if (rule.action === 'conditional' && results.overallAction !== 'reject') {
                                    results.overallAction = 'conditional';
                                }
                            }

                            // Stop execution if configured to stop on reject
                            if (this.ruleConfig.rule_execution_config?.stop_on_reject && 
                                rule.action === 'reject' && !ruleResult.passed) {
                                logger.warn('Stopping rule execution due to rejection', {
                                    requestId,
                                    ruleId,
                                    category: ruleCategory
                                });
                                return results;
                            }
                        } catch (error) {
                            logger.error('Rule execution failed', {
                                requestId,
                                ruleId,
                                error: error.message
                            });
                            results.failedRules++;
                        }
                    }
                }
            } else {
                // Execute all rules normally for non-mutually-exclusive subcategories
                for (const [ruleId, rule] of Object.entries(rules)) {
                    try {
                        const ruleResult = this.executeRule(rule, data, ruleId, requestId);
                        
                        // For reject rules, only consider them "failed" if the condition is true
                        // If condition is false for a reject rule, it means the rule doesn't apply
                        const shouldProcessRule = rule.action !== 'reject' || ruleResult.conditionMet;
                        
                        if (shouldProcessRule) {
                            results.ruleResults.push(ruleResult);
                            results.totalRules++;

                            if (ruleResult.passed) {
                                results.passedRules++;
                                results.totalScore += rule.score || 0;
                                if (rule.flag) results.flags.push(rule.flag);
                                if (rule.message) results.messages.push(rule.message);
                            } else {
                                results.failedRules++;
                                if (rule.action === 'reject') {
                                    results.overallAction = 'reject';
                                } else if (rule.action === 'conditional' && results.overallAction !== 'reject') {
                                    results.overallAction = 'conditional';
                                }
                            }

                            // Stop execution if configured to stop on reject
                            if (this.ruleConfig.rule_execution_config?.stop_on_reject && 
                                rule.action === 'reject' && !ruleResult.passed) {
                                logger.warn('Stopping rule execution due to rejection', {
                                    requestId,
                                    ruleId,
                                    category: ruleCategory
                                });
                                break;
                            }
                        }
                    } catch (error) {
                        logger.error('Rule execution failed', {
                            requestId,
                            ruleId,
                            error: error.message
                        });
                        results.failedRules++;
                    }
                }
            }
        }

        results.executionTime = Date.now() - results.executionTime;
        
        // Calculate maximum possible score for this category
        results.maxScore = this.calculateMaxPossibleScore(ruleCategory);
        
        logger.info('Rule category execution completed', {
            requestId,
            category: ruleCategory,
            results: {
                totalRules: results.totalRules,
                passed: results.passedRules,
                failed: results.failedRules,
                score: results.totalScore,
                action: results.overallAction,
                executionTime: results.executionTime
            }
        });

        return results;
    }

    /**
     * Execute a single rule
     * @param {Object} rule - Rule configuration
     * @param {Object} data - Application data
     * @param {string} ruleId - Rule identifier
     * @param {string} requestId - Request ID for logging
     * @returns {Object} Rule execution result
     */
    executeRule(rule, data, ruleId, requestId) {
        const conditionResult = this.evaluateConditions(rule.conditions, rule.logical_operator || 'AND', data);
        
        const result = {
            ruleId,
            passed: conditionResult,
            conditionMet: conditionResult, // Track if condition was met
            action: rule.action,
            severity: rule.severity,
            score: rule.score || 0,
            message: rule.message,
            flag: rule.flag
        };

        logger.debug('Rule executed', {
            requestId,
            ruleId,
            passed: conditionResult,
            conditionMet: conditionResult,
            action: rule.action
        });

        return result;
    }

    /**
     * Evaluate a set of conditions
     * @param {Array} conditions - Array of condition objects
     * @param {string} logicalOperator - 'AND' or 'OR'
     * @param {Object} data - Application data
     * @returns {boolean} Whether conditions are satisfied
     */
    evaluateConditions(conditions, logicalOperator, data) {
        if (!conditions || conditions.length === 0) {
            return true;
        }

        const results = conditions.map(condition => 
            this.evaluateCondition(condition, data)
        );

        if (logicalOperator === 'OR') {
            return results.some(result => result);
        } else {
            return results.every(result => result);
        }
    }

    /**
     * Evaluate a single condition
     * @param {Object} condition - Condition object with field, operator, value
     * @param {Object} data - Application data
     * @returns {boolean} Whether condition is satisfied
     */
    evaluateCondition(condition, data) {
        const { field, operator, value } = condition;
        const fieldValue = this.getNestedValue(data, field);
        
        // Debug logging for CIBIL fields
        if (field.startsWith('credit_report.')) {
            console.log('🔍 CIBIL Field Debug:', {
                field: field,
                fieldValue: fieldValue,
                operator: operator,
                expectedValue: value,
                result: this.applyOperator(fieldValue, operator, value)
            });
        }

        return this.applyOperator(fieldValue, operator, value);
    }

    /**
     * Apply operator to compare field value with expected value
     * @param {*} fieldValue - The actual field value
     * @param {string} operator - The comparison operator
     * @param {*} value - The expected value
     * @returns {boolean} Whether condition is satisfied
     */
    applyOperator(fieldValue, operator, value) {
        switch (operator) {
            case '>':
                return fieldValue > value;
            case '<':
                return fieldValue < value;
            case '>=':
                return fieldValue >= value;
            case '<=':
                return fieldValue <= value;
            case '==':
                return fieldValue == value;
            case '!=':
                return fieldValue != value;
            case 'in':
                return Array.isArray(value) && value.includes(fieldValue);
            case 'not_in':
                return Array.isArray(value) && !value.includes(fieldValue);
            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(value);
            case 'not_contains':
                return typeof fieldValue === 'string' && !fieldValue.includes(value);
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'not_exists':
                return fieldValue === undefined || fieldValue === null;
            case 'matches_regex':
                const regex = new RegExp(value);
                return typeof fieldValue === 'string' && regex.test(fieldValue);
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search in
     * @param {string} path - Dot-separated path (e.g., 'personal_info.age')
     * @returns {*} Value at the specified path
     */
    getNestedValue(obj, path) {
        // Debug logging for CIBIL score path
        if (path === 'credit_report.cibil_score') {
            console.log('🔍 getNestedValue Debug:', {
                path,
                objKeys: Object.keys(obj || {}),
                hasCreditReport: !!obj.credit_report,
                creditReportKeys: obj.credit_report ? Object.keys(obj.credit_report) : 'undefined',
                directAccess: obj.credit_report?.cibil_score,
                objType: typeof obj
            });
        }
        
        return path.split('.').reduce((current, key) => {
            const result = current && current[key] !== undefined ? current[key] : undefined;
            
            // Debug each step for CIBIL score
            if (path === 'credit_report.cibil_score') {
                console.log(`🔍 Step: ${key}`, {
                    current: current ? Object.keys(current) : 'null/undefined',
                    key,
                    result,
                    hasKey: current && current[key] !== undefined
                });
            }
            
            return result;
        }, obj);
    }

    /**
     * Execute all rule categories for comprehensive evaluation
     * @param {Object} data - Application data
     * @param {string} requestId - Request ID for logging
     * @returns {Object} Comprehensive evaluation results
     */
    executeAllRules(data, requestId = null) {
        const executionConfig = this.ruleConfig.rule_execution_config || {};
        const executionOrder = executionConfig.execution_order || 
            ['kyc_rules', 'eligibility_rules', 'cibil_rules', 'risk_assessment_rules'];
        
        const overallResults = {
            requestId,
            executionTimestamp: new Date().toISOString(),
            categoryResults: {},
            overallScore: 0,
            weightedScore: 0,
            totalFlags: [],
            overallAction: 'approve',
            recommendation: '',
            executionSummary: {
                totalRules: 0,
                passedRules: 0,
                failedRules: 0,
                executionTime: 0
            }
        };

        const startTime = Date.now();

        logger.info('Starting comprehensive rule execution', {
            requestId,
            executionOrder
        });

        for (const category of executionOrder) {
            if (this.ruleConfig[category]) {
                try {
                    const categoryResult = this.executeRules(category, data, requestId);
                    overallResults.categoryResults[category] = categoryResult;
                    
                    // Accumulate scores and statistics
                    overallResults.overallScore += categoryResult.totalScore;
                    overallResults.totalFlags.push(...categoryResult.flags);
                    overallResults.executionSummary.totalRules += categoryResult.totalRules;
                    overallResults.executionSummary.passedRules += categoryResult.passedRules;
                    overallResults.executionSummary.failedRules += categoryResult.failedRules;

                    // Update overall action based on category results
                    if (categoryResult.overallAction === 'reject') {
                        overallResults.overallAction = 'reject';
                        if (executionConfig.stop_on_reject) {
                            logger.warn('Stopping execution due to rejection', {
                                requestId,
                                category
                            });
                            break;
                        }
                    } else if (categoryResult.overallAction === 'conditional' && 
                               overallResults.overallAction !== 'reject') {
                        overallResults.overallAction = 'conditional';
                    }
                } catch (error) {
                    logger.error('Category execution failed', {
                        requestId,
                        category,
                        error: error.message
                    });
                }
            }
        }

        // Calculate weighted score
        const weights = executionConfig.scoring_weights || {};
        overallResults.weightedScore = Object.entries(overallResults.categoryResults)
            .reduce((total, [category, result]) => {
                const weight = weights[category] || 0.25;
                return total + (result.totalScore * weight);
            }, 0);

        // Check minimum score threshold
        const minThreshold = executionConfig.minimum_score_threshold || 50;
        if (overallResults.weightedScore < minThreshold && overallResults.overallAction === 'approve') {
            overallResults.overallAction = 'conditional';
            overallResults.recommendation = `Score ${overallResults.weightedScore} below threshold ${minThreshold}`;
        }

        overallResults.executionSummary.executionTime = Date.now() - startTime;

        logger.info('Comprehensive rule execution completed', {
            requestId,
            overallAction: overallResults.overallAction,
            overallScore: overallResults.overallScore,
            weightedScore: overallResults.weightedScore,
            executionTime: overallResults.executionSummary.executionTime
        });

        return overallResults;
    }

    /**
     * Get rule configuration for a specific category
     * @param {string} category - Rule category
     * @returns {Object} Rule configuration
     */
    getRuleConfiguration(category = null) {
        if (category) {
            return this.ruleConfig[category] || null;
        }
        return this.ruleConfig;
    }

    /**
     * Calculate maximum possible score for a rule category
     * @param {string} ruleCategory - Rule category to calculate max score for
     * @returns {number} Maximum possible score
     */
    calculateMaxPossibleScore(ruleCategory) {
        if (!this.ruleConfig || !this.ruleConfig[ruleCategory]) {
            return 0;
        }

        let maxScore = 0;
        const categoryRules = this.ruleConfig[ruleCategory];

        // Iterate through all subcategories and rules
        for (const [subcategory, rules] of Object.entries(categoryRules)) {
            // Handle mutually exclusive CIBIL score rules
            if (subcategory === 'credit_score' && ruleCategory === 'cibil_rules') {
                // For CIBIL rules, only one rule applies, so take the maximum score
                let maxCibilScore = 0;
                for (const [ruleId, rule] of Object.entries(rules)) {
                    if (rule.score && rule.score > maxCibilScore) {
                        maxCibilScore = rule.score;
                    }
                }
                maxScore += maxCibilScore;
            } else {
                // For other rules, sum all positive scores
                for (const [ruleId, rule] of Object.entries(rules)) {
                    if (rule.score && rule.score > 0) {
                        maxScore += rule.score;
                    }
                }
            }
        }

        return maxScore;
    }

    /**
     * Validate rule configuration
     * @returns {Object} Validation result
     */
    validateConfiguration() {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        try {
            // Check required fields
            if (!this.ruleConfig.version) {
                validation.errors.push('Missing version field');
            }

            if (!this.ruleConfig.metadata) {
                validation.warnings.push('Missing metadata section');
            }

            // Validate rule categories
            const ruleCategories = ['kyc_rules', 'cibil_rules', 'eligibility_rules', 'risk_assessment_rules'];
            for (const category of ruleCategories) {
                if (!this.ruleConfig[category]) {
                    validation.warnings.push(`Missing rule category: ${category}`);
                }
            }

            // Validate execution config
            if (!this.ruleConfig.rule_execution_config) {
                validation.warnings.push('Missing rule execution configuration');
            }

            validation.valid = validation.errors.length === 0;

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Configuration validation failed: ${error.message}`);
        }

        return validation;
    }
}

module.exports = JsonRuleEngine;