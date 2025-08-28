/**
 * Rules Engine Controller
 * API endpoints to expose rules engine logic and evaluation results
 */

const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const databaseService = require('../database/service');

class RulesEngineController {
    constructor() {
        this.rulesEngineConfig = null;
        this.rulesEngineLoaded = false;
        this.loadRulesEngine();
    }

    /**
     * Load rules engine configuration from file
     */
    async loadRulesEngine() {
        try {
            const rulesPath = path.join(__dirname, '../../rules-engine.json');
            const rulesContent = await fs.readFile(rulesPath, 'utf8');
            this.rulesEngineConfig = JSON.parse(rulesContent);
            this.rulesEngineLoaded = true;
            logger.info('Rules engine configuration loaded');
        } catch (error) {
            logger.error('Error loading rules engine configuration:', error);
            this.rulesEngineConfig = null;
            this.rulesEngineLoaded = false;
        }
    }

    /**
     * Get complete rules engine configuration
     */
    async getRulesEngine(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `rules_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting complete rules engine configuration`);

            if (!this.rulesEngineLoaded || !this.rulesEngineConfig) {
                await this.loadRulesEngine();
            }

            res.json({
                success: true,
                data: {
                    rules_engine: this.rulesEngineConfig,
                    timestamp: new Date().toISOString(),
                    version: this.rulesEngineConfig?.loan_origination_rules_engine?.version || '1.0.0'
                },
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting rules engine:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get rules engine configuration',
                message: error.message
            });
        }
    }

    /**
     * Get rules for a specific stage
     */
    async getStageRules(req, res) {
        try {
            const { stage_name } = req.params;
            const requestId = req.headers['x-request-id'] || `stage_rules_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting rules for stage: ${stage_name}`);

            if (!this.rulesEngineLoaded || !this.rulesEngineConfig) {
                await this.loadRulesEngine();
            }

            const stages = this.rulesEngineConfig?.loan_origination_rules_engine?.stages || {};
            const stageRules = stages[stage_name];

            if (!stageRules) {
                return res.status(404).json({
                    success: false,
                    error: 'Stage not found',
                    available_stages: Object.keys(stages)
                });
            }

            res.json({
                success: true,
                data: {
                    stage_name,
                    rules: stageRules,
                    timestamp: new Date().toISOString()
                },
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting stage rules:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get stage rules',
                message: error.message
            });
        }
    }

    /**
     * Evaluate rules for an application
     */
    async evaluateRules(req, res) {
        try {
            const { application_number } = req.params;
            const { stage_name } = req.query;
            const requestId = req.headers['x-request-id'] || `eval_${Date.now()}`;
            
            logger.info(`[${requestId}] Evaluating rules for application: ${application_number}`);

            // Get application data
            const application = await databaseService.getCompleteApplication(application_number);
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            // Get rules for the stage
            if (!this.rulesEngineLoaded || !this.rulesEngineConfig) {
                await this.loadRulesEngine();
            }

            const targetStage = stage_name || application.current_stage;
            const stages = this.rulesEngineConfig?.loan_origination_rules_engine?.stages || {};
            const stageRules = stages[`stage_${targetStage}`] || stages[targetStage];

            if (!stageRules) {
                return res.status(404).json({
                    success: false,
                    error: 'Stage rules not found',
                    stage: targetStage,
                    available_stages: Object.keys(stages)
                });
            }

            // Evaluate rules
            const evaluation = await this.performRulesEvaluation(application, stageRules, targetStage);

            res.json({
                success: true,
                data: {
                    application_number,
                    stage: targetStage,
                    evaluation_timestamp: new Date().toISOString(),
                    rules_applied: evaluation.rules_applied,
                    evaluation_results: evaluation.results,
                    final_decision: evaluation.final_decision,
                    decision_factors: evaluation.decision_factors,
                    score_breakdown: evaluation.score_breakdown
                },
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error evaluating rules:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to evaluate rules',
                message: error.message
            });
        }
    }

    /**
     * Get applied rules history for an application
     */
    async getAppliedRulesHistory(req, res) {
        try {
            const { application_number } = req.params;
            const requestId = req.headers['x-request-id'] || `history_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting applied rules history for: ${application_number}`);

            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();

            // Get credit decisions with rule applications
            const [decisions] = await connection.execute(`
                SELECT 
                    cd.*,
                    la.current_stage,
                    la.status as application_status,
                    sp.result_data as stage_result
                FROM credit_decisions cd
                LEFT JOIN loan_applications la ON cd.application_number = la.application_number
                LEFT JOIN stage_processing sp ON cd.application_number = sp.application_number 
                WHERE cd.application_number = ?
                ORDER BY cd.decided_at DESC
            `, [application_number]);

            // Get manual decisions if any
            const [manualDecisions] = await connection.execute(`
                SELECT * FROM manual_decisions 
                WHERE application_number = ? 
                ORDER BY decided_at DESC
            `, [application_number]);

            // Get workflow rules applied
            const [workflowRules] = await connection.execute(`
                SELECT wr.*, mrq.created_at as applied_at
                FROM workflow_rules wr
                JOIN manual_review_queue mrq ON wr.stage_name = mrq.stage_name
                WHERE mrq.application_number = ?
                ORDER BY mrq.created_at DESC
            `, [application_number]);

            connection.release();

            res.json({
                success: true,
                data: {
                    application_number,
                    automated_decisions: decisions,
                    manual_decisions: manualDecisions,
                    workflow_rules_applied: workflowRules,
                    total_decisions: decisions.length + manualDecisions.length
                },
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting applied rules history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get applied rules history',
                message: error.message
            });
        }
    }

    /**
     * Compare current implementation with rules-engine.json
     */
    async compareRulesImplementation(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `compare_${Date.now()}`;
            
            logger.info(`[${requestId}] Comparing rules implementation`);

            if (!this.rulesEngineLoaded || !this.rulesEngineConfig) {
                await this.loadRulesEngine();
            }

            const comparison = {
                timestamp: new Date().toISOString(),
                rules_file_version: this.rulesEngineConfig?.loan_origination_rules_engine?.version,
                implementation_status: {},
                discrepancies: [],
                recommendations: []
            };

            // Check each stage implementation
            const stages = this.rulesEngineConfig?.loan_origination_rules_engine?.stages || {};
            
            for (const [stageName, stageConfig] of Object.entries(stages)) {
                const implementation = await this.checkStageImplementation(stageName, stageConfig);
                comparison.implementation_status[stageName] = implementation;
                
                if (!implementation.fully_implemented) {
                    comparison.discrepancies.push({
                        stage: stageName,
                        missing_features: implementation.missing_features,
                        partially_implemented: implementation.partially_implemented
                    });
                }
            }

            // Generate recommendations
            if (comparison.discrepancies.length > 0) {
                comparison.recommendations.push(
                    'Update service implementations to match rules-engine.json specifications',
                    'Implement missing business rules for complete compliance',
                    'Add automated tests for rule validation'
                );
            } else {
                comparison.recommendations.push('Implementation is fully compliant with rules-engine.json');
            }

            res.json({
                success: true,
                data: comparison,
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error comparing rules implementation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to compare rules implementation',
                message: error.message
            });
        }
    }

    /**
     * Get available rules and endpoints
     */
    async getRulesEndpoints(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `endpoints_${Date.now()}`;
            
            if (!this.rulesEngineLoaded || !this.rulesEngineConfig) {
                await this.loadRulesEngine();
            }
            
            res.json({
                success: true,
                data: {
                    available_endpoints: {
                        'GET /api/rules-engine': 'Get complete rules engine configuration',
                        'GET /api/rules-engine/stages/:stage_name': 'Get rules for specific stage',
                        'GET /api/rules-engine/applications/:application_number/evaluate': 'Evaluate rules for application',
                        'GET /api/rules-engine/applications/:application_number/history': 'Get applied rules history',
                        'GET /api/rules-engine/compare': 'Compare implementation with rules-engine.json',
                        'GET /api/rules-engine/endpoints': 'This endpoint - list all available endpoints'
                    },
                    stages_available: this.rulesEngineConfig?.loan_origination_rules_engine?.stages ? 
                        Object.keys(this.rulesEngineConfig.loan_origination_rules_engine.stages) : [],
                    version: this.rulesEngineConfig?.loan_origination_rules_engine?.version || '1.0.0'
                },
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting rules endpoints:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get rules endpoints',
                message: error.message
            });
        }
    }

    // Helper methods
    async performRulesEvaluation(application, stageRules, stageName) {
        const evaluation = {
            rules_applied: [],
            results: {},
            final_decision: 'pending',
            decision_factors: {
                positive_factors: [],
                negative_factors: [],
                risk_factors: []
            },
            score_breakdown: {}
        };

        try {
            // Extract application data for evaluation
            const appData = {
                age: this.calculateAge(application.date_of_birth),
                loan_amount: application.loan_amount,
                monthly_income: application.monthly_income,
                cibil_score: this.extractCibilScore(application),
                employment_type: application.employment_type
            };

            // Evaluate business rules
            if (stageRules.business_rules) {
                for (const [ruleName, ruleConfig] of Object.entries(stageRules.business_rules)) {
                    const ruleResult = this.evaluateBusinessRule(ruleName, ruleConfig, appData);
                    evaluation.rules_applied.push({
                        rule_name: ruleName,
                        rule_type: 'business_rule',
                        passed: ruleResult.passed,
                        score: ruleResult.score,
                        details: ruleResult.details
                    });
                    evaluation.results[ruleName] = ruleResult;
                }
            }

            // Evaluate decision criteria
            if (stageRules.decision_criteria) {
                const decisionResult = this.evaluateDecisionCriteria(stageRules.decision_criteria, appData, evaluation.results);
                evaluation.final_decision = decisionResult.decision;
                evaluation.decision_factors = decisionResult.factors;
            }

            return evaluation;

        } catch (error) {
            logger.error('Error in rules evaluation:', error);
            evaluation.final_decision = 'error';
            evaluation.decision_factors.negative_factors.push('Rules evaluation error');
            return evaluation;
        }
    }

    evaluateBusinessRule(ruleName, ruleConfig, appData) {
        const result = {
            passed: true,
            score: 100,
            details: {}
        };

        try {
            switch (ruleName) {
                case 'age_validation':
                    if (ruleConfig.min_age && appData.age < ruleConfig.min_age) {
                        result.passed = false;
                        result.details.reason = `Age ${appData.age} below minimum ${ruleConfig.min_age}`;
                    }
                    if (ruleConfig.max_age && appData.age > ruleConfig.max_age) {
                        result.passed = false;
                        result.details.reason = `Age ${appData.age} above maximum ${ruleConfig.max_age}`;
                    }
                    break;

                case 'cibil_score_thresholds':
                    if (ruleConfig.minimum_score && appData.cibil_score < ruleConfig.minimum_score) {
                        result.passed = false;
                        result.details.reason = `CIBIL score ${appData.cibil_score} below minimum ${ruleConfig.minimum_score}`;
                    }
                    result.score = this.calculateCibilScore(appData.cibil_score, ruleConfig);
                    break;

                case 'loan_amount_estimation':
                    const maxAmount = this.calculateMaxLoanAmount(appData, ruleConfig);
                    if (appData.loan_amount > maxAmount) {
                        result.passed = false;
                        result.details.reason = `Requested amount ${appData.loan_amount} exceeds maximum ${maxAmount}`;
                    }
                    break;

                default:
                    result.details.note = 'Rule evaluation not implemented';
            }

        } catch (error) {
            result.passed = false;
            result.details.error = error.message;
        }

        return result;
    }

    evaluateDecisionCriteria(decisionCriteria, appData, businessRuleResults) {
        const factors = {
            positive_factors: [],
            negative_factors: [],
            risk_factors: []
        };

        let decision = 'pending';

        try {
            // Check auto-approve conditions
            if (decisionCriteria.auto_approve) {
                const autoApprove = this.checkConditions(decisionCriteria.auto_approve.conditions, appData, businessRuleResults);
                if (autoApprove) {
                    decision = 'approved';
                    factors.positive_factors.push('Meets auto-approval criteria');
                }
            }

            // Check auto-reject conditions
            if (decisionCriteria.auto_reject) {
                const autoReject = this.checkConditions(decisionCriteria.auto_reject.conditions, appData, businessRuleResults);
                if (autoReject) {
                    decision = 'rejected';
                    factors.negative_factors.push('Meets auto-rejection criteria');
                }
            }

        } catch (error) {
            factors.negative_factors.push('Decision criteria evaluation error');
        }

        return { decision, factors };
    }

    checkConditions(conditions, appData, businessRuleResults) {
        // Simplified condition checking
        for (const condition of conditions) {
            if (condition.includes('age >= 21') && appData.age < 21) return false;
            if (condition.includes('age <= 65') && appData.age > 65) return false;
            if (condition.includes('cibil_score >= 650') && appData.cibil_score < 650) return false;
        }
        return true;
    }

    async checkStageImplementation(stageName, stageConfig) {
        const implementation = {
            fully_implemented: true,
            missing_features: [],
            partially_implemented: [],
            implementation_notes: []
        };

        // Check if stage service exists
        const serviceFiles = ['pre-qualification.js', 'loan-application.js', 'application-processing.js', 'underwriting.js'];
        const expectedService = serviceFiles.find(file => file.includes(stageName.replace('stage_', '').replace('_', '-')));
        
        if (!expectedService) {
            implementation.fully_implemented = false;
            implementation.missing_features.push('Service implementation');
        }

        // Check business rules implementation
        if (stageConfig.business_rules) {
            const ruleCount = Object.keys(stageConfig.business_rules).length;
            implementation.implementation_notes.push(`${ruleCount} business rules defined`);
        }

        return implementation;
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    extractCibilScore(application) {
        // Try to extract CIBIL score from various sources
        if (application.decisions && application.decisions.length > 0) {
            const latestDecision = application.decisions[0];
            if (latestDecision.decision_factors) {
                try {
                    const factors = JSON.parse(latestDecision.decision_factors);
                    return factors.cibil_score || 0;
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
        return 0;
    }

    calculateCibilScore(cibilScore, ruleConfig) {
        if (cibilScore >= (ruleConfig.excellent_score || 800)) return 100;
        if (cibilScore >= (ruleConfig.good_score || 700)) return 80;
        if (cibilScore >= (ruleConfig.minimum_score || 650)) return 60;
        return 20;
    }

    calculateMaxLoanAmount(appData, ruleConfig) {
        let maxAmount = ruleConfig.base_amount || 200000;
        
        if (appData.cibil_score >= 800) {
            maxAmount = ruleConfig.excellent_cibil || 1500000;
        } else if (appData.cibil_score >= 700) {
            maxAmount = ruleConfig.good_cibil || 800000;
        }
        
        return maxAmount;
    }
}

module.exports = new RulesEngineController();
