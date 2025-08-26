const logger = require('../../middleware/utils/logger');

/**
 * Base Rule Engine class that provides common functionality for all rule engines
 * This class should be extended by specific rule engines (KYC, CIBIL, etc.)
 */
class BaseRuleEngine {
    constructor(ruleConfig = {}) {
        this.ruleConfig = ruleConfig;
        this.rules = [];
        this.results = {
            passed: [],
            failed: [],
            warnings: [],
            flags: [],
            score: 0,
            decision: 'pending'
        };
    }

    /**
     * Add a rule to the engine
     * @param {Object} rule - Rule configuration
     */
    addRule(rule) {
        if (!rule.id || !rule.condition || !rule.action) {
            throw new Error('Rule must have id, condition, and action properties');
        }
        this.rules.push(rule);
    }

    /**
     * Execute all rules against the provided data
     * @param {Object} data - Data to evaluate
     * @param {Object} options - Execution options
     * @returns {Object} Rule execution results
     */
    async executeRules(data, options = {}) {
        const startTime = Date.now();
        const { requestId, applicationId } = options;

        try {
            logger.info('Starting rule execution', {
                requestId,
                applicationId,
                ruleCount: this.rules.length,
                engineType: this.constructor.name
            });

            // Reset results
            this.resetResults();

            // Execute each rule
            for (const rule of this.rules) {
                try {
                    const ruleResult = await this.executeRule(rule, data, options);
                    this.processRuleResult(rule, ruleResult);
                } catch (error) {
                    logger.error('Rule execution failed', {
                        requestId,
                        applicationId,
                        ruleId: rule.id,
                        error: error.message
                    });
                    
                    this.results.failed.push({
                        ruleId: rule.id,
                        error: error.message,
                        severity: 'high'
                    });
                }
            }

            // Calculate final score and decision
            this.calculateFinalResult();

            logger.info('Rule execution completed', {
                requestId,
                applicationId,
                engineType: this.constructor.name,
                finalScore: this.results.score,
                decision: this.results.decision,
                processingTime: Date.now() - startTime
            });

            return this.results;

        } catch (error) {
            logger.error('Rule engine execution failed', {
                requestId,
                applicationId,
                engineType: this.constructor.name,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Execute a single rule
     * @param {Object} rule - Rule to execute
     * @param {Object} data - Data to evaluate
     * @param {Object} options - Execution options
     * @returns {Object} Rule result
     */
    async executeRule(rule, data, options = {}) {
        try {
            // Evaluate condition
            const conditionResult = await this.evaluateCondition(rule.condition, data);
            
            return {
                ruleId: rule.id,
                conditionMet: conditionResult,
                action: rule.action,
                severity: rule.severity || 'medium',
                message: rule.message || '',
                flag: rule.flag || null,
                score: rule.score || 0,
                metadata: rule.metadata || {}
            };
        } catch (error) {
            throw new Error(`Rule ${rule.id} execution failed: ${error.message}`);
        }
    }

    /**
     * Evaluate a rule condition
     * @param {String|Function} condition - Condition to evaluate
     * @param {Object} data - Data context
     * @returns {Boolean} Condition result
     */
    async evaluateCondition(condition, data) {
        if (typeof condition === 'function') {
            return await condition(data);
        }
        
        if (typeof condition === 'string') {
            // Simple string-based condition evaluation
            return this.evaluateStringCondition(condition, data);
        }
        
        throw new Error('Invalid condition type. Must be function or string.');
    }

    /**
     * Evaluate string-based conditions
     * @param {String} condition - String condition
     * @param {Object} data - Data context
     * @returns {Boolean} Evaluation result
     */
    evaluateStringCondition(condition, data) {
        try {
            // Create a safe evaluation context
            const context = { ...data };
            
            // Replace data references in condition
            let evaluableCondition = condition;
            
            // Simple variable replacement (can be enhanced with proper parser)
            Object.keys(context).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                evaluableCondition = evaluableCondition.replace(regex, context[key]);
            });
            
            // Use Function constructor for safe evaluation (limited scope)
            const func = new Function('return ' + evaluableCondition);
            return func();
        } catch (error) {
            logger.warn('String condition evaluation failed', {
                condition,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Process the result of a rule execution
     * @param {Object} rule - Original rule
     * @param {Object} result - Rule execution result
     */
    processRuleResult(rule, result) {
        if (result.conditionMet) {
            switch (result.action) {
                case 'approve':
                case 'pass':
                    this.results.passed.push(result);
                    break;
                case 'reject':
                case 'fail':
                    this.results.failed.push(result);
                    break;
                case 'flag':
                case 'warning':
                    this.results.warnings.push(result);
                    break;
                case 'conditional':
                    this.results.flags.push(result);
                    break;
                default:
                    this.results.warnings.push(result);
            }
            
            // Add to score if applicable
            if (result.score) {
                this.results.score += result.score;
            }
        }
    }

    /**
     * Calculate final result based on rule outcomes
     */
    calculateFinalResult() {
        const { passed, failed, warnings, flags } = this.results;
        
        // Default decision logic (can be overridden by specific engines)
        if (failed.length > 0) {
            const highSeverityFailures = failed.filter(f => f.severity === 'high');
            if (highSeverityFailures.length > 0) {
                this.results.decision = 'reject';
            } else {
                this.results.decision = 'conditional';
            }
        } else if (flags.length > 0) {
            this.results.decision = 'conditional';
        } else if (passed.length > 0) {
            this.results.decision = 'approve';
        } else {
            this.results.decision = 'pending';
        }
        
        // Normalize score (0-100)
        if (this.results.score > 100) {
            this.results.score = 100;
        } else if (this.results.score < 0) {
            this.results.score = 0;
        }
    }

    /**
     * Reset results for new execution
     */
    resetResults() {
        this.results = {
            passed: [],
            failed: [],
            warnings: [],
            flags: [],
            score: 0,
            decision: 'pending'
        };
    }

    /**
     * Get summary of rule execution
     * @returns {Object} Execution summary
     */
    getSummary() {
        return {
            totalRules: this.rules.length,
            passed: this.results.passed.length,
            failed: this.results.failed.length,
            warnings: this.results.warnings.length,
            flags: this.results.flags.length,
            score: this.results.score,
            decision: this.results.decision
        };
    }
}

module.exports = BaseRuleEngine;