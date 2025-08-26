const BaseRuleEngine = require('./base-rule-engine');
const JsonRuleEngine = require('./json-rule-engine');
const logger = require('../../middleware/utils/logger');

/**
 * Risk Assessment Rule Engine for comprehensive risk evaluation
 * Based on existing risk assessment stage logic and banking risk models
 */
class RiskAssessmentRuleEngine extends BaseRuleEngine {
    constructor(ruleConfig = {}) {
        super(ruleConfig);
        this.jsonRuleEngine = new JsonRuleEngine();
        this.initializeRiskEngine();
    }

    /**
     * Initialize risk assessment engine with JSON configuration
     */
    initializeRiskEngine() {
        try {
            // Validate JSON configuration on initialization
            const validation = this.jsonRuleEngine.validateConfiguration();
            if (!validation.valid) {
                logger.error('Risk assessment rule engine configuration validation failed', {
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }
            
            logger.info('Risk assessment rule engine initialized with JSON configuration');
        } catch (error) {
            logger.error('Failed to initialize risk assessment rule engine', { error: error.message });
            throw error;
        }
    }

    /**
     * Initialize risk assessment specific rules
     */
    initializeRiskRules() {
        // Income stability and variance rules
        this.addRule({
            id: 'RISK_001',
            name: 'Low Income Variance',
            condition: (data) => {
                const variance = data.income_variance || 0;
                return variance <= 10;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Low income variance (≤10%) - Stable income pattern',
            flag: 'LOW_INCOME_VARIANCE',
            score: 25
        });

        this.addRule({
            id: 'RISK_002',
            name: 'Moderate Income Variance',
            condition: (data) => {
                const variance = data.income_variance || 0;
                return variance > 10 && variance <= 20;
            },
            action: 'conditional',
            severity: 'low',
            message: 'Moderate income variance (10-20%) - Acceptable fluctuation',
            flag: 'MODERATE_INCOME_VARIANCE',
            score: 10
        });

        this.addRule({
            id: 'RISK_003',
            name: 'High Income Variance',
            condition: (data) => {
                const variance = data.income_variance || 0;
                return variance > 20 && variance <= 30;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'High income variance (20-30%) - Requires additional verification',
            flag: 'HIGH_INCOME_VARIANCE',
            score: -10
        });

        this.addRule({
            id: 'RISK_004',
            name: 'Very High Income Variance',
            condition: (data) => {
                const variance = data.income_variance || 0;
                return variance > 30;
            },
            action: 'reject',
            severity: 'high',
            message: 'Very high income variance (>30%) - Potential income misrepresentation',
            flag: 'VERY_HIGH_INCOME_VARIANCE',
            score: -40
        });

        // Surplus analysis rules
        this.addRule({
            id: 'RISK_005',
            name: 'Excellent Monthly Surplus',
            condition: (data) => {
                const surplus = data.monthly_surplus || 0;
                return surplus >= 20000;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Excellent monthly surplus (≥₹20,000) - Low repayment risk',
            flag: 'EXCELLENT_SURPLUS',
            score: 30
        });

        this.addRule({
            id: 'RISK_006',
            name: 'Adequate Monthly Surplus',
            condition: (data) => {
                const surplus = data.monthly_surplus || 0;
                return surplus >= 10000 && surplus < 20000;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Adequate monthly surplus (₹10K-₹20K) - Acceptable repayment capacity',
            flag: 'ADEQUATE_SURPLUS',
            score: 20
        });

        this.addRule({
            id: 'RISK_007',
            name: 'Low Monthly Surplus',
            condition: (data) => {
                const surplus = data.monthly_surplus || 0;
                return surplus >= 5000 && surplus < 10000;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Low monthly surplus (₹5K-₹10K) - Higher risk of default',
            flag: 'LOW_SURPLUS',
            score: 5
        });

        this.addRule({
            id: 'RISK_008',
            name: 'Insufficient Monthly Surplus',
            condition: (data) => {
                const surplus = data.monthly_surplus || 0;
                return surplus < 5000;
            },
            action: 'reject',
            severity: 'high',
            message: 'Insufficient monthly surplus (<₹5,000) - High default risk',
            flag: 'INSUFFICIENT_SURPLUS',
            score: -50
        });

        // Banking behavior rules
        this.addRule({
            id: 'RISK_009',
            name: 'No Bounce History',
            condition: (data) => {
                const bounces6m = data.bounces_last_6_months || 0;
                return bounces6m === 0;
            },
            action: 'approve',
            severity: 'positive',
            message: 'No bounces in 6 months - Excellent payment discipline',
            flag: 'NO_BOUNCES',
            score: 25
        });

        this.addRule({
            id: 'RISK_010',
            name: 'Minor Bounce History',
            condition: (data) => {
                const bounces6m = data.bounces_last_6_months || 0;
                return bounces6m > 0 && bounces6m <= 2;
            },
            action: 'conditional',
            severity: 'low',
            message: 'Minor bounce history (1-2 in 6 months) - Acceptable',
            flag: 'MINOR_BOUNCES',
            score: 5
        });

        this.addRule({
            id: 'RISK_011',
            name: 'Moderate Bounce History',
            condition: (data) => {
                const bounces6m = data.bounces_last_6_months || 0;
                return bounces6m > 2 && bounces6m <= 3;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Moderate bounce history (2-3 in 6 months) - Payment discipline concern',
            flag: 'MODERATE_BOUNCES',
            score: -10
        });

        this.addRule({
            id: 'RISK_012',
            name: 'High Bounce History',
            condition: (data) => {
                const bounces6m = data.bounces_last_6_months || 0;
                return bounces6m > 3;
            },
            action: 'reject',
            severity: 'high',
            message: 'High bounce history (>3 in 6 months) - Poor payment discipline',
            flag: 'HIGH_BOUNCES',
            score: -40
        });

        // Debt-to-Income ratio rules
        this.addRule({
            id: 'RISK_013',
            name: 'Low DTI Ratio',
            condition: (data) => {
                const dtiRatio = data.dti_percentage || 0;
                return dtiRatio <= 30;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Low DTI ratio (≤30%) - Excellent debt management',
            flag: 'LOW_DTI',
            score: 25
        });

        this.addRule({
            id: 'RISK_014',
            name: 'Moderate DTI Ratio',
            condition: (data) => {
                const dtiRatio = data.dti_percentage || 0;
                return dtiRatio > 30 && dtiRatio <= 50;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Moderate DTI ratio (30-50%) - Acceptable debt level',
            flag: 'MODERATE_DTI',
            score: 10
        });

        this.addRule({
            id: 'RISK_015',
            name: 'High DTI Ratio',
            condition: (data) => {
                const dtiRatio = data.dti_percentage || 0;
                return dtiRatio > 50 && dtiRatio <= 60;
            },
            action: 'conditional',
            severity: 'high',
            message: 'High DTI ratio (50-60%) - High debt burden',
            flag: 'HIGH_DTI',
            score: -15
        });

        this.addRule({
            id: 'RISK_016',
            name: 'Very High DTI Ratio',
            condition: (data) => {
                const dtiRatio = data.dti_percentage || 0;
                return dtiRatio > 60;
            },
            action: 'reject',
            severity: 'high',
            message: 'Very high DTI ratio (>60%) - Excessive debt burden',
            flag: 'VERY_HIGH_DTI',
            score: -50
        });

        // Employment risk rules
        this.addRule({
            id: 'RISK_017',
            name: 'Stable Employment Sector',
            condition: (data) => {
                const stableSectors = ['Government', 'PSU', 'Banking', 'IT', 'Healthcare', 'Education'];
                const sector = data.employment_sector || '';
                return stableSectors.some(stable => 
                    sector.toLowerCase().includes(stable.toLowerCase())
                );
            },
            action: 'approve',
            severity: 'positive',
            message: 'Employment in stable sector - Lower job risk',
            flag: 'STABLE_EMPLOYMENT_SECTOR',
            score: 15
        });

        this.addRule({
            id: 'RISK_018',
            name: 'Volatile Employment Sector',
            condition: (data) => {
                const volatileSectors = ['Real Estate', 'Construction', 'Hospitality', 'Travel', 'Entertainment'];
                const sector = data.employment_sector || '';
                return volatileSectors.some(volatile => 
                    sector.toLowerCase().includes(volatile.toLowerCase())
                );
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Employment in volatile sector - Higher job risk',
            flag: 'VOLATILE_EMPLOYMENT_SECTOR',
            score: -10
        });

        // Age-based risk rules
        this.addRule({
            id: 'RISK_019',
            name: 'Prime Age Group',
            condition: (data) => {
                const age = data.age || 0;
                return age >= 25 && age <= 45;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Prime age group (25-45) - Peak earning years',
            flag: 'PRIME_AGE_GROUP',
            score: 15
        });

        this.addRule({
            id: 'RISK_020',
            name: 'Young Professional Risk',
            condition: (data) => {
                const age = data.age || 0;
                return age >= 21 && age < 25;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Young professional - Career stability risk',
            flag: 'YOUNG_PROFESSIONAL_RISK',
            score: -5
        });

        this.addRule({
            id: 'RISK_021',
            name: 'Pre-Retirement Risk',
            condition: (data) => {
                const age = data.age || 0;
                return age > 55 && age <= 65;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Pre-retirement age - Income reduction risk',
            flag: 'PRE_RETIREMENT_RISK',
            score: -10
        });

        // Loan amount vs income risk rules
        this.addRule({
            id: 'RISK_022',
            name: 'Conservative Loan Amount',
            condition: (data) => {
                const loanAmount = data.loan_amount || 0;
                const monthlyIncome = data.monthly_income || 1;
                const ratio = loanAmount / monthlyIncome;
                return ratio <= 5;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Conservative loan amount (≤5x monthly income)',
            flag: 'CONSERVATIVE_LOAN_AMOUNT',
            score: 20
        });

        this.addRule({
            id: 'RISK_023',
            name: 'Aggressive Loan Amount',
            condition: (data) => {
                const loanAmount = data.loan_amount || 0;
                const monthlyIncome = data.monthly_income || 1;
                const ratio = loanAmount / monthlyIncome;
                return ratio > 8;
            },
            action: 'conditional',
            severity: 'high',
            message: 'Aggressive loan amount (>8x monthly income)',
            flag: 'AGGRESSIVE_LOAN_AMOUNT',
            score: -20
        });

        // Banking relationship rules
        this.addRule({
            id: 'RISK_024',
            name: 'Long Banking Relationship',
            condition: (data) => {
                const relationshipMonths = data.banking_relationship_months || 0;
                return relationshipMonths >= 24;
            },
            action: 'approve',
            severity: 'positive',
            message: 'Long banking relationship (24+ months) - Established customer',
            flag: 'LONG_BANKING_RELATIONSHIP',
            score: 15
        });

        this.addRule({
            id: 'RISK_025',
            name: 'New Banking Relationship',
            condition: (data) => {
                const relationshipMonths = data.banking_relationship_months || 0;
                return relationshipMonths < 6;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'New banking relationship (<6 months) - Limited history',
            flag: 'NEW_BANKING_RELATIONSHIP',
            score: -10
        });

        // Existing loan performance rules
        this.addRule({
            id: 'RISK_026',
            name: 'Excellent Existing Loan Performance',
            condition: (data) => {
                const existingLoans = data.existing_loans || [];
                if (existingLoans.length === 0) return true; // No existing loans is good
                return existingLoans.every(loan => 
                    loan.payment_status === 'regular' && 
                    (loan.dpd_count || 0) === 0
                );
            },
            action: 'approve',
            severity: 'positive',
            message: 'Excellent existing loan performance - No delays',
            flag: 'EXCELLENT_LOAN_PERFORMANCE',
            score: 20
        });

        this.addRule({
            id: 'RISK_027',
            name: 'Poor Existing Loan Performance',
            condition: (data) => {
                const existingLoans = data.existing_loans || [];
                return existingLoans.some(loan => 
                    loan.payment_status === 'irregular' || 
                    (loan.dpd_count || 0) > 3
                );
            },
            action: 'conditional',
            severity: 'high',
            message: 'Poor existing loan performance - Payment delays detected',
            flag: 'POOR_LOAN_PERFORMANCE',
            score: -30
        });

        // Geographic risk rules
        this.addRule({
            id: 'RISK_028',
            name: 'Low Risk Geography',
            condition: (data) => {
                const lowRiskStates = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Delhi', 'Haryana'];
                const state = data.state || '';
                return lowRiskStates.some(lowRisk => 
                    state.toLowerCase().includes(lowRisk.toLowerCase())
                );
            },
            action: 'approve',
            severity: 'positive',
            message: 'Low risk geography - Stable economic environment',
            flag: 'LOW_RISK_GEOGRAPHY',
            score: 10
        });

        this.addRule({
            id: 'RISK_029',
            name: 'High Risk Geography',
            condition: (data) => {
                const highRiskStates = ['Bihar', 'Jharkhand', 'Odisha', 'Chhattisgarh'];
                const state = data.state || '';
                return highRiskStates.some(highRisk => 
                    state.toLowerCase().includes(highRisk.toLowerCase())
                );
            },
            action: 'conditional',
            severity: 'medium',
            message: 'High risk geography - Additional verification required',
            flag: 'HIGH_RISK_GEOGRAPHY',
            score: -15
        });

        // Critical failure rules
        this.addRule({
            id: 'RISK_F001',
            name: 'Fraudulent Application Indicators',
            condition: (data) => {
                return data.fraud_indicators && data.fraud_indicators.length > 0;
            },
            action: 'reject',
            severity: 'critical',
            message: 'Fraudulent application indicators detected',
            flag: 'FRAUD_INDICATORS',
            score: -100
        });

        this.addRule({
            id: 'RISK_F002',
            name: 'Negative Database Hit',
            condition: (data) => {
                return data.negative_database_hit === true;
            },
            action: 'reject',
            severity: 'critical',
            message: 'Negative database match found',
            flag: 'NEGATIVE_DATABASE_HIT',
            score: -100
        });

        this.addRule({
            id: 'RISK_F003',
            name: 'Bankruptcy History',
            condition: (data) => {
                return data.bankruptcy_history === true;
            },
            action: 'reject',
            severity: 'critical',
            message: 'Bankruptcy history found',
            flag: 'BANKRUPTCY_HISTORY',
            score: -100
        });
    }

    /**
     * Perform comprehensive risk assessment using JSON rule engine
     * @param {Object} applicationData - Application data to assess
     * @param {String} requestId - Request identifier
     * @param {Object} options - Assessment options
     * @returns {Object} Risk assessment results
     */
    async performRiskAssessment(applicationData, requestId, options = {}) {
        const startTime = Date.now();
        const applicationId = applicationData.application_id || 'UNKNOWN';

        try {
            logger.info('Starting JSON-based risk assessment', {
                requestId,
                applicationId,
                engine: 'JSON-based'
            });

            // Execute JSON-based risk assessment rules
            const results = this.jsonRuleEngine.executeRules('risk_assessment_rules', applicationData, requestId);

            // Add risk-specific metadata
            results.assessment_type = 'RISK_ASSESSMENT';
            results.risk_grade = this.getRiskGrade(results.totalScore);
            results.risk_category = this.getRiskCategory(results);
            results.recommended_action = this.getRecommendedAction(results);
            results.risk_factors = this.analyzeRiskFactors(results);
            results.processing_time = Date.now() - startTime;

            logger.info('JSON-based risk assessment completed', {
                requestId,
                applicationId,
                riskGrade: results.risk_grade,
                riskCategory: results.risk_category,
                score: results.totalScore,
                processingTime: results.processing_time
            });

            return {
                success: true,
                status: results.overallAction === 'reject' ? 'rejected' : 'approved',
                score: results.totalScore,
                maxScore: results.maxScore,
                risk_grade: results.risk_grade,
                risk_category: results.risk_category,
                recommended_action: results.recommended_action,
                risk_factors: results.risk_factors,
                flags: results.flags,
                messages: results.messages,
                riskLevel: this.calculateRiskLevel(results.totalScore, results.maxScore),
                processing_time: results.processing_time,
                assessment_type: 'RISK_ASSESSMENT',
                requestId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('JSON-based risk assessment failed', {
                requestId,
                applicationId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                status: 'error',
                error: error.message,
                assessment_type: 'RISK_ASSESSMENT',
                processing_time: Date.now() - startTime,
                requestId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyze risk factors from assessment results
     * @param {Object} results - Rule execution results
     * @returns {Object} Risk factor analysis
     */
    analyzeRiskFactors(results) {
        const factors = {
            debt_analysis: { score: 0, status: 'unknown' },
            employment_stability: { score: 0, status: 'unknown' },
            credit_behavior: { score: 0, status: 'unknown' },
            banking_behavior: { score: 0, status: 'unknown' },
            income_stability: { score: 0, status: 'unknown' },
            geographic_risk: { score: 0, status: 'unknown' }
        };

        // Analyze rule results by category
        Object.entries(results.ruleResults || {}).forEach(([ruleId, result]) => {
            const rule = this.jsonRuleEngine.getRuleById(ruleId);
            if (rule && factors[rule.category]) {
                factors[rule.category].score += result.score || 0;
                if (result.passed) {
                    factors[rule.category].status = factors[rule.category].status === 'unknown' ? 'good' : factors[rule.category].status;
                } else {
                    factors[rule.category].status = 'risk';
                }
            }
        });

        return factors;
    }

    /**
     * Calculate overall risk level
     * @param {Number} score - Current score
     * @param {Number} maxScore - Maximum possible score
     * @returns {String} Risk level
     */
    calculateRiskLevel(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        
        if (percentage >= 80) return 'LOW';
        if (percentage >= 60) return 'MEDIUM';
        if (percentage >= 40) return 'HIGH';
        return 'VERY_HIGH';
    }

    /**
     * Get current configuration
     * @returns {Object} Current rule configuration
     */
    getCurrentConfiguration() {
        return this.jsonRuleEngine.getCurrentConfiguration();
    }

    /**
     * Update rule configuration
     * @param {Object} newConfig - New configuration
     * @returns {Boolean} Update success status
     */
    updateConfiguration(newConfig) {
        return this.jsonRuleEngine.updateConfiguration(newConfig);
    }

    /**
     * Get risk assessment statistics
     * @param {Object} results - Assessment results
     * @returns {Object} Risk statistics
     */
    getRiskStats(results) {
        return {
            total_rules_executed: Object.keys(results.ruleResults || {}).length,
            rules_passed: Object.values(results.ruleResults || {}).filter(r => r.passed).length,
            rules_failed: Object.values(results.ruleResults || {}).filter(r => !r.passed).length,
            score_percentage: Math.round((results.totalScore / results.maxScore) * 100),
            risk_level: this.calculateRiskLevel(results.totalScore, results.maxScore),
            flags_count: results.flags ? results.flags.length : 0,
            messages_count: results.messages ? results.messages.length : 0
        };
    }

    /**
     * Prepare risk data from application data
     * @param {Object} applicationData - Raw application data
     * @returns {Object} Prepared risk data
     */
    prepareRiskData(applicationData) {
        const personalInfo = applicationData.personal_info || {};
        const employmentInfo = applicationData.employment_info || {};
        const financialInfo = applicationData.financial_info || {};
        const bankingInfo = applicationData.banking_info || {};
        const loanInfo = applicationData.loan_info || {};
        const addressInfo = applicationData.address_info || {};
        const riskInfo = applicationData.risk_info || {};
        
        return {
            age: personalInfo.age || 0,
            monthly_income: personalInfo.monthly_income || employmentInfo.monthly_income || 0,
            employment_sector: employmentInfo.sector || '',
            income_variance: financialInfo.income_variance || 0,
            monthly_surplus: financialInfo.monthly_surplus || 0,
            bounces_last_6_months: bankingInfo.bounces_last_6_months || 0,
            dti_percentage: financialInfo.dti_percentage || 0,
            banking_relationship_months: bankingInfo.relationship_months || 0,
            existing_loans: bankingInfo.existing_loans || [],
            loan_amount: loanInfo.loan_amount || 0,
            state: addressInfo.state || '',
            fraud_indicators: riskInfo.fraud_indicators || [],
            negative_database_hit: riskInfo.negative_database_hit || false,
            bankruptcy_history: riskInfo.bankruptcy_history || false
        };
    }

    /**
     * Get risk grade based on score
     * @param {Number} score - Risk score
     * @returns {String} Risk grade
     */
    getRiskGrade(score) {
        if (score >= 80) return 'A1';
        if (score >= 70) return 'A2';
        if (score >= 60) return 'B1';
        if (score >= 50) return 'B2';
        if (score >= 40) return 'C1';
        if (score >= 30) return 'C2';
        return 'D';
    }

    /**
     * Get risk category based on results
     * @param {Object} results - Rule execution results
     * @returns {String} Risk category
     */
    getRiskCategory(results) {
        const criticalFailures = results.failed.filter(f => f.severity === 'critical');
        const highFailures = results.failed.filter(f => f.severity === 'high');
        
        if (criticalFailures.length > 0) {
            return 'VERY_HIGH_RISK';
        } else if (highFailures.length > 2) {
            return 'HIGH_RISK';
        } else if (results.score >= 70) {
            return 'LOW_RISK';
        } else if (results.score >= 50) {
            return 'MEDIUM_RISK';
        } else {
            return 'HIGH_RISK';
        }
    }

    /**
     * Get recommended interest rate based on risk assessment
     * @param {Object} results - Risk assessment results
     * @returns {Number} Recommended interest rate
     */
    getRecommendedInterestRate(results) {
        const baseRate = 12.0; // Base interest rate
        const riskPremium = this.calculateRiskPremium(results);
        
        return Math.min(baseRate + riskPremium, 24.0); // Cap at 24%
    }

    /**
     * Calculate risk premium based on assessment
     * @param {Object} results - Risk assessment results
     * @returns {Number} Risk premium percentage
     */
    calculateRiskPremium(results) {
        if (results.score >= 80) return 0.0;   // No premium for excellent risk
        if (results.score >= 70) return 1.0;   // 1% premium for good risk
        if (results.score >= 60) return 2.5;   // 2.5% premium for fair risk
        if (results.score >= 50) return 4.0;   // 4% premium for poor risk
        if (results.score >= 40) return 6.0;   // 6% premium for high risk
        return 8.0; // 8% premium for very high risk
    }

    /**
     * Override base class decision calculation for risk-specific logic
     */
    calculateFinalResult() {
        const { passed, failed, warnings, flags } = this.results;
        
        // Risk-specific decision logic
        const criticalFailures = failed.filter(f => f.severity === 'critical');
        const highFailures = failed.filter(f => f.severity === 'high');
        
        if (criticalFailures.length > 0) {
            this.results.decision = 'reject';
        } else if (highFailures.length > 3) {
            this.results.decision = 'reject';
        } else if (this.results.score >= 70) {
            this.results.decision = 'approve';
        } else if (this.results.score >= 40) {
            this.results.decision = 'conditional';
        } else {
            this.results.decision = 'reject';
        }
        
        // Normalize score
        if (this.results.score > 100) {
            this.results.score = 100;
        } else if (this.results.score < 0) {
            this.results.score = 0;
        }
    }
}

module.exports = RiskAssessmentRuleEngine;