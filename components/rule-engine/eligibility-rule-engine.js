const BaseRuleEngine = require('./base-rule-engine');
const JsonRuleEngine = require('./json-rule-engine');
const logger = require('../../middleware/utils/logger');

/**
 * Eligibility Rule Engine for loan eligibility assessment
 * Based on existing eligibility stage logic and RBI guidelines
 */
class EligibilityRuleEngine extends BaseRuleEngine {
    constructor(ruleConfig = {}) {
        super(ruleConfig);
        this.jsonRuleEngine = new JsonRuleEngine();
        this.initializeEligibilityEngine();
    }

    /**
     * Initialize eligibility engine with JSON configuration
     */
    initializeEligibilityEngine() {
        try {
            // Validate JSON configuration on initialization
            const validation = this.jsonRuleEngine.validateConfiguration();
            if (!validation.valid) {
                logger.error('Eligibility rule engine configuration validation failed', {
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }
            
            logger.info('Eligibility rule engine initialized with JSON configuration');
        } catch (error) {
            logger.error('Failed to initialize eligibility rule engine', { error: error.message });
            throw error;
        }
    }

    /**
     * Initialize eligibility-specific rules (legacy method for backward compatibility)
     */
    initializeEligibilityRules() {
        // Age eligibility rules
        this.addRule({
            id: 'ELIG_001',
            name: 'Age Eligibility Check',
            condition: (data) => {
                const age = data.age || 0;
                return age >= 21 && age <= 65;
            },
            action: 'approve',
            severity: 'high',
            message: 'Age is within eligible range (21-65 years)',
            flag: 'AGE_ELIGIBLE',
            score: 15
        });

        this.addRule({
            id: 'ELIG_002',
            name: 'Senior Citizen Special Terms',
            condition: (data) => {
                const age = data.age || 0;
                return age >= 60 && age <= 65;
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Senior citizen - special terms and reduced tenure may apply',
            flag: 'SENIOR_CITIZEN_TERMS',
            score: 5
        });

        // Income eligibility rules
        this.addRule({
            id: 'ELIG_003',
            name: 'Salaried Income Eligibility',
            condition: (data) => {
                const income = data.monthly_income || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Salaried') && income >= 20000;
            },
            action: 'approve',
            severity: 'high',
            message: 'Salaried income meets minimum requirement (₹20,000)',
            flag: 'SALARIED_INCOME_ELIGIBLE',
            score: 20
        });

        this.addRule({
            id: 'ELIG_004',
            name: 'Self-Employed Income Eligibility',
            condition: (data) => {
                const income = data.monthly_income || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Self-Employed') && income >= 25000;
            },
            action: 'approve',
            severity: 'high',
            message: 'Self-employed income meets minimum requirement (₹25,000)',
            flag: 'SELF_EMPLOYED_INCOME_ELIGIBLE',
            score: 20
        });

        this.addRule({
            id: 'ELIG_005',
            name: 'Professional Income Eligibility',
            condition: (data) => {
                const income = data.monthly_income || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Professional') && income >= 30000;
            },
            action: 'approve',
            severity: 'high',
            message: 'Professional income meets minimum requirement (₹30,000)',
            flag: 'PROFESSIONAL_INCOME_ELIGIBLE',
            score: 25
        });

        // Employment type eligibility rules
        this.addRule({
            id: 'ELIG_006',
            name: 'Allowed Employment Type',
            condition: (data) => {
                const allowedTypes = [
                    'Salaried - Private',
                    'Salaried - Government',
                    'Salaried - PSU',
                    'Self-Employed - Business',
                    'Self-Employed - Professional',
                    'Pensioner'
                ];
                return allowedTypes.includes(data.employment_type);
            },
            action: 'approve',
            severity: 'high',
            message: 'Employment type is acceptable for loan',
            flag: 'EMPLOYMENT_TYPE_ALLOWED',
            score: 15
        });

        this.addRule({
            id: 'ELIG_007',
            name: 'Preferred Employer Bonus',
            condition: (data) => {
                const preferredEmployers = ['Fortune 500', 'Government', 'PSU', 'MNC'];
                return preferredEmployers.some(emp => 
                    data.employer_name?.toLowerCase().includes(emp.toLowerCase())
                );
            },
            action: 'approve',
            severity: 'positive',
            message: 'Preferred employer - additional benefits may apply',
            flag: 'PREFERRED_EMPLOYER',
            score: 10
        });

        // Employment stability rules
        this.addRule({
            id: 'ELIG_008',
            name: 'Salaried Employment Stability',
            condition: (data) => {
                const continuityMonths = data.employment_continuity_months || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Salaried') && continuityMonths >= 6;
            },
            action: 'approve',
            severity: 'high',
            message: 'Adequate employment continuity for salaried (6+ months)',
            flag: 'SALARIED_STABILITY',
            score: 15
        });

        this.addRule({
            id: 'ELIG_009',
            name: 'Self-Employed Business Vintage',
            condition: (data) => {
                const vintageMonths = data.business_vintage_months || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Self-Employed - Business') && vintageMonths >= 24;
            },
            action: 'approve',
            severity: 'high',
            message: 'Adequate business vintage (24+ months)',
            flag: 'BUSINESS_VINTAGE_ADEQUATE',
            score: 15
        });

        this.addRule({
            id: 'ELIG_010',
            name: 'Professional Practice Vintage',
            condition: (data) => {
                const vintageMonths = data.practice_vintage_months || 0;
                const employmentType = data.employment_type;
                return employmentType?.includes('Self-Employed - Professional') && vintageMonths >= 24;
            },
            action: 'approve',
            severity: 'high',
            message: 'Adequate practice vintage (24+ months)',
            flag: 'PRACTICE_VINTAGE_ADEQUATE',
            score: 15
        });

        // Loan amount eligibility rules
        this.addRule({
            id: 'ELIG_011',
            name: 'Loan Amount Within Limits',
            condition: (data) => {
                const loanAmount = data.loan_amount || 0;
                return loanAmount >= 25000 && loanAmount <= 2000000;
            },
            action: 'approve',
            severity: 'high',
            message: 'Loan amount within acceptable range (₹25K - ₹20L)',
            flag: 'LOAN_AMOUNT_WITHIN_LIMITS',
            score: 10
        });

        this.addRule({
            id: 'ELIG_012',
            name: 'Income Multiplier Check',
            condition: (data) => {
                const loanAmount = data.loan_amount || 0;
                const monthlyIncome = data.monthly_income || 1;
                const employmentType = data.employment_type || '';
                
                let multiplier = 8; // Default
                if (employmentType.includes('Salaried')) multiplier = 10;
                else if (employmentType.includes('Self-Employed')) multiplier = 8;
                else if (employmentType.includes('Pensioner')) multiplier = 6;
                
                return loanAmount <= (monthlyIncome * multiplier);
            },
            action: 'approve',
            severity: 'high',
            message: 'Loan amount within income multiplier limits',
            flag: 'INCOME_MULTIPLIER_OK',
            score: 15
        });

        // Loan purpose eligibility rules
        this.addRule({
            id: 'ELIG_013',
            name: 'Allowed Loan Purpose',
            condition: (data) => {
                const allowedPurposes = [
                    'Personal',
                    'Medical Emergency',
                    'Education',
                    'Home Renovation',
                    'Travel',
                    'Wedding',
                    'Debt Consolidation',
                    'Consumer Durables'
                ];
                return allowedPurposes.includes(data.loan_purpose);
            },
            action: 'approve',
            severity: 'high',
            message: 'Loan purpose is acceptable',
            flag: 'LOAN_PURPOSE_ALLOWED',
            score: 10
        });

        this.addRule({
            id: 'ELIG_014',
            name: 'Restricted Loan Purpose',
            condition: (data) => {
                const restrictedPurposes = [
                    'Speculation',
                    'Investment in Securities',
                    'Real Estate Investment',
                    'Business Purpose'
                ];
                return restrictedPurposes.includes(data.loan_purpose);
            },
            action: 'reject',
            severity: 'high',
            message: 'Loan purpose is not allowed for personal loans',
            flag: 'LOAN_PURPOSE_RESTRICTED',
            score: -50
        });

        // Geographical eligibility rules
        this.addRule({
            id: 'ELIG_015',
            name: 'Tier 1 City Eligibility',
            condition: (data) => {
                const tier1Cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
                const city = data.city || '';
                return tier1Cities.some(t1City => 
                    city.toLowerCase().includes(t1City.toLowerCase())
                );
            },
            action: 'approve',
            severity: 'positive',
            message: 'Tier 1 city location - higher loan limits available',
            flag: 'TIER_1_CITY',
            score: 10
        });

        this.addRule({
            id: 'ELIG_016',
            name: 'Rural Area Additional Verification',
            condition: (data) => {
                const ruralIndicators = ['village', 'rural', 'gram'];
                const address = (data.address || '').toLowerCase();
                return ruralIndicators.some(indicator => address.includes(indicator));
            },
            action: 'conditional',
            severity: 'medium',
            message: 'Rural area - additional verification required',
            flag: 'RURAL_AREA_VERIFICATION',
            score: 0
        });

        // Net take-home eligibility rules
        this.addRule({
            id: 'ELIG_017',
            name: 'Adequate Net Take-Home',
            condition: (data) => {
                const netTakeHome = data.net_take_home || 0;
                const employmentType = data.employment_type || '';
                
                if (employmentType.includes('Salaried')) {
                    return netTakeHome >= 15000;
                }
                return true; // Not applicable for non-salaried
            },
            action: 'approve',
            severity: 'high',
            message: 'Net take-home salary meets minimum requirement',
            flag: 'NET_TAKEHOME_ADEQUATE',
            score: 15
        });

        // Professional qualification rules
        this.addRule({
            id: 'ELIG_018',
            name: 'Professional Qualification Verified',
            condition: (data) => {
                const employmentType = data.employment_type || '';
                if (employmentType.includes('Self-Employed - Professional')) {
                    return data.professional_qualification_verified === true;
                }
                return true; // Not applicable for non-professionals
            },
            action: 'approve',
            severity: 'high',
            message: 'Professional qualification verified',
            flag: 'PROFESSIONAL_QUALIFICATION_OK',
            score: 10
        });

        // ITR eligibility rules
        this.addRule({
            id: 'ELIG_019',
            name: 'ITR Filed for Self-Employed',
            condition: (data) => {
                const employmentType = data.employment_type || '';
                if (employmentType.includes('Self-Employed')) {
                    const annualITR = data.annual_itr_amount || 0;
                    return annualITR >= 300000;
                }
                return true; // Not applicable for salaried
            },
            action: 'approve',
            severity: 'high',
            message: 'ITR amount meets minimum requirement (₹3L annually)',
            flag: 'ITR_ADEQUATE',
            score: 15
        });

        // Failure rules
        this.addRule({
            id: 'ELIG_F001',
            name: 'Age Ineligibility',
            condition: (data) => {
                const age = data.age || 0;
                return age < 21 || age > 65;
            },
            action: 'reject',
            severity: 'high',
            message: 'Age is outside eligible range (must be 21-65 years)',
            flag: 'AGE_INELIGIBLE',
            score: -100
        });

        this.addRule({
            id: 'ELIG_F002',
            name: 'Insufficient Income',
            condition: (data) => {
                const income = data.monthly_income || 0;
                const employmentType = data.employment_type || '';
                
                if (employmentType.includes('Salaried')) {
                    return income < 20000;
                } else if (employmentType.includes('Self-Employed - Business')) {
                    return income < 25000;
                } else if (employmentType.includes('Self-Employed - Professional')) {
                    return income < 30000;
                }
                return false;
            },
            action: 'reject',
            severity: 'high',
            message: 'Monthly income below minimum requirement',
            flag: 'INSUFFICIENT_INCOME',
            score: -50
        });

        this.addRule({
            id: 'ELIG_F003',
            name: 'Unacceptable Employment Type',
            condition: (data) => {
                const allowedTypes = [
                    'Salaried - Private',
                    'Salaried - Government',
                    'Salaried - PSU',
                    'Self-Employed - Business',
                    'Self-Employed - Professional',
                    'Pensioner'
                ];
                return !allowedTypes.includes(data.employment_type);
            },
            action: 'reject',
            severity: 'high',
            message: 'Employment type not acceptable for personal loan',
            flag: 'EMPLOYMENT_TYPE_UNACCEPTABLE',
            score: -100
        });

        this.addRule({
            id: 'ELIG_F004',
            name: 'Insufficient Employment Stability',
            condition: (data) => {
                const employmentType = data.employment_type || '';
                
                if (employmentType.includes('Salaried')) {
                    const continuity = data.employment_continuity_months || 0;
                    return continuity < 6;
                } else if (employmentType.includes('Self-Employed - Business')) {
                    const vintage = data.business_vintage_months || 0;
                    return vintage < 24;
                } else if (employmentType.includes('Self-Employed - Professional')) {
                    const vintage = data.practice_vintage_months || 0;
                    return vintage < 24;
                }
                return false;
            },
            action: 'reject',
            severity: 'high',
            message: 'Insufficient employment stability/vintage',
            flag: 'INSUFFICIENT_STABILITY',
            score: -40
        });

        this.addRule({
            id: 'ELIG_F005',
            name: 'Loan Amount Out of Range',
            condition: (data) => {
                const loanAmount = data.loan_amount || 0;
                return loanAmount < 25000 || loanAmount > 2000000;
            },
            action: 'reject',
            severity: 'high',
            message: 'Loan amount outside acceptable range (₹25K - ₹20L)',
            flag: 'LOAN_AMOUNT_OUT_OF_RANGE',
            score: -30
        });
    }

    /**
     * Perform comprehensive eligibility assessment
     * @param {Object} applicationData - Application data to assess
     * @param {Object} options - Assessment options
     * @returns {Object} Eligibility assessment result
     */
    async performEligibilityAssessment(applicationData, options = {}) {
        const startTime = Date.now();
        const { requestId, applicationId } = options;

        try {
            logger.info('Starting eligibility assessment', {
                requestId,
                applicationId,
                engine: 'JSON-based'
            });

            // Use JSON rule engine for assessment
            const results = await this.jsonRuleEngine.executeRules('eligibility_rules', applicationData, requestId);

            // Add eligibility-specific metadata
            results.assessment_type = 'ELIGIBILITY';
            results.eligibility_grade = this.getEligibilityGrade(results.totalScore, 50);
            results.recommended_amount = this.getRecommendedAmount(applicationData, results);
            results.processing_time = Date.now() - startTime;

            logger.info('Eligibility assessment completed', {
                requestId,
                applicationId,
                decision: results.decision,
                score: results.totalScore,
                eligibilityGrade: results.eligibility_grade,
                recommendedAmount: results.recommended_amount,
                processingTime: results.processing_time
            });

            return results;

        } catch (error) {
            logger.error('Eligibility assessment failed', {
                requestId,
                applicationId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Process eligibility assessment using JSON-based rules
     * @param {Object} applicationData - Application data
     * @param {String} requestId - Request identifier
     * @param {Object} options - Processing options
     * @returns {Object} Eligibility assessment results
     */
    async processEligibilityAssessment(applicationData, requestId, options = {}) {
        const startTime = Date.now();
        const applicationId = applicationData.application_id || 'UNKNOWN';

        try {
            logger.info('Starting eligibility assessment', {
                requestId,
                applicationId,
                engine: 'JSON-based'
            });

            // Use JSON rule engine for eligibility rules
            const results = this.jsonRuleEngine.executeRules('eligibility_rules', applicationData, requestId);

            // Add eligibility-specific metadata
            results.assessment_type = 'ELIGIBILITY';
            results.eligibility_grade = this.getEligibilityGrade(results.totalScore, 50);
            results.recommended_amount = this.getRecommendedAmount(applicationData, results);
            results.processing_time = Date.now() - startTime;

            // Determine overall eligibility status
            results.eligible = this.determineEligibilityStatus(results);
            results.eligibility_reasons = this.generateEligibilityReasons(results);
            results.eligibility_checks = this.analyzeEligibilityResults(results);

            logger.info('Eligibility assessment completed', {
                requestId,
                applicationId,
                eligible: results.eligible,
                score: results.totalScore,
                grade: results.eligibility_grade,
                processingTime: results.processing_time
            });

            return {
                success: true,
                eligible: results.eligible,
                status: results.eligible ? 'approved' : 'rejected',
                score: results.totalScore,
                maxScore: results.maxScore,
                eligibility_grade: results.eligibility_grade,
                recommended_amount: results.recommended_amount,
                eligibility_checks: results.eligibility_checks,
                flags: results.flags,
                messages: results.messages,
                recommendations: results.eligibility_reasons,
                riskLevel: this.calculateRiskLevel(results.totalScore, results.maxScore),
                processing_time: results.processing_time,
                assessment_type: 'ELIGIBILITY',
                requestId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Eligibility assessment failed', {
                requestId,
                applicationId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                eligible: false,
                status: 'error',
                error: error.message,
                assessment_type: 'ELIGIBILITY',
                processing_time: Date.now() - startTime,
                requestId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyze eligibility results and provide detailed checks
     * @param {Object} results - Rule execution results
     * @returns {Object} Detailed eligibility analysis
     */
    analyzeEligibilityResults(results) {
        const checks = {
            age_verification: false,
            income_verification: false,
            employment_verification: false,
            loan_amount_verification: false,
            geographic_verification: false,
            loan_purpose_verification: false
        };

        // Analyze rule results by category
        Object.entries(results.ruleResults || {}).forEach(([ruleId, result]) => {
            if (result.passed) {
                const rule = this.jsonRuleEngine.getRuleById(ruleId);
                if (rule) {
                    switch (rule.category) {
                        case 'age_verification':
                            checks.age_verification = true;
                            break;
                        case 'income_verification':
                            checks.income_verification = true;
                            break;
                        case 'employment_verification':
                            checks.employment_verification = true;
                            break;
                        case 'loan_amount':
                            checks.loan_amount_verification = true;
                            break;
                        case 'geographic':
                            checks.geographic_verification = true;
                            break;
                        case 'loan_purpose':
                            checks.loan_purpose_verification = true;
                            break;
                    }
                }
            }
        });

        return checks;
    }

    /**
     * Calculate risk level based on eligibility score
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
     * Determine eligibility status based on results
     * @param {Object} results - Assessment results
     * @returns {Boolean} Eligibility status
     */
    determineEligibilityStatus(results) {
        const scorePercentage = results.maxScore > 0 ? (results.totalScore / results.maxScore) * 100 : 0;
        
        const hasBlockingFlags = results.flags && results.flags.some(flag => 
            flag.includes('INELIGIBLE') || flag.includes('RESTRICTED') || flag.includes('UNACCEPTABLE')
        );
        
        const isEligible = !hasBlockingFlags && scorePercentage >= 60;
        
        return isEligible;
    }

    /**
     * Generate eligibility reasons and recommendations
     * @param {Object} results - Assessment results
     * @returns {Array} Array of eligibility reasons
     */
    generateEligibilityReasons(results) {
        const reasons = [];
        
        if (results.eligible) {
            reasons.push('All basic eligibility criteria met');
            if (results.totalScore >= 80) {
                reasons.push('Strong eligibility profile with excellent score');
            }
        } else {
            if (results.flags) {
                results.flags.forEach(flag => {
                    if (flag.includes('AGE_INELIGIBLE')) {
                        reasons.push('Age does not meet eligibility criteria');
                    }
                    if (flag.includes('INSUFFICIENT_INCOME')) {
                        reasons.push('Monthly income below minimum requirement');
                    }
                    if (flag.includes('EMPLOYMENT_TYPE_UNACCEPTABLE')) {
                        reasons.push('Employment type not acceptable for personal loan');
                    }
                });
            }
        }
        
        return reasons;
    }

    /**
     * Prepare eligibility data from application data
     * @param {Object} applicationData - Raw application data
     * @returns {Object} Prepared eligibility data
     */
    prepareEligibilityData(applicationData) {
        const personalInfo = applicationData.personal_info || {};
        const employmentInfo = applicationData.employment_info || {};
        const loanInfo = applicationData.loan_info || {};
        const addressInfo = applicationData.address_info || {};
        
        return {
            age: personalInfo.age || 0,
            monthly_income: personalInfo.monthly_income || employmentInfo.monthly_income || 0,
            net_take_home: employmentInfo.net_take_home || 0,
            employment_type: employmentInfo.employment_type || '',
            employer_name: employmentInfo.employer_name || '',
            employment_continuity_months: employmentInfo.continuity_months || 0,
            business_vintage_months: employmentInfo.business_vintage_months || 0,
            practice_vintage_months: employmentInfo.practice_vintage_months || 0,
            professional_qualification_verified: employmentInfo.professional_qualification_verified || false,
            annual_itr_amount: employmentInfo.annual_itr_amount || 0,
            loan_amount: loanInfo.loan_amount || 0,
            loan_purpose: loanInfo.loan_purpose || '',
            city: addressInfo.city || '',
            address: addressInfo.full_address || ''
        };
    }

    /**
     * Get eligibility grade based on score
     * @param {Number} score - Eligibility score
     * @param {Number} maxScore - Maximum possible score (defaults to 50 for eligibility rules)
     * @returns {String} Eligibility grade
     */
    getEligibilityGrade(score, maxScore = 50) {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Very Good';
        if (percentage >= 70) return 'Good';
        if (percentage >= 60) return 'Fair';
        if (percentage >= 50) return 'Poor';
        return 'Very Poor';
    }

    /**
     * Get recommended loan amount based on eligibility
     * @param {Object} applicationData - Application data
     * @param {Object} results - Assessment results
     * @returns {Number} Recommended amount
     */
    getRecommendedAmount(applicationData, results) {
        const loanInfo = applicationData.loan_info || {};
        const employmentInfo = applicationData.employment_info || {};
        const personalInfo = applicationData.personal_info || {};
        
        const requestedAmount = loanInfo.loan_amount || 0;
        const monthlyIncome = personalInfo.monthly_income || employmentInfo.monthly_income || 0;
        const employmentType = employmentInfo.employment_type || '';
        
        // Calculate maximum eligible amount based on income multiplier
        let multiplier = 8; // Default
        if (employmentType.includes('Salaried')) multiplier = 10;
        else if (employmentType.includes('Self-Employed')) multiplier = 8;
        else if (employmentType.includes('Pensioner')) multiplier = 6;
        
        const maxEligibleAmount = monthlyIncome * multiplier;
        
        // Adjust based on eligibility score
        let scoreMultiplier = 1.0;
        if (results.score >= 80) scoreMultiplier = 1.0;
        else if (results.score >= 70) scoreMultiplier = 0.9;
        else if (results.score >= 60) scoreMultiplier = 0.8;
        else if (results.score >= 50) scoreMultiplier = 0.7;
        else scoreMultiplier = 0.6;
        
        const adjustedMaxAmount = maxEligibleAmount * scoreMultiplier;
        
        return Math.min(requestedAmount, adjustedMaxAmount, 2000000);
    }

    /**
     * Override base class decision calculation for eligibility-specific logic
     */
    calculateFinalResult() {
        const { passed, failed, warnings, flags } = this.results;
        
        // Eligibility-specific decision logic
        const highFailures = failed.filter(f => f.severity === 'high');
        const criticalFailures = failed.filter(f => f.severity === 'critical');
        
        if (criticalFailures.length > 0 || highFailures.length > 0) {
            this.results.decision = 'reject';
        } else if (this.results.score >= 70) {
            this.results.decision = 'approve';
        } else if (this.results.score >= 50) {
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

module.exports = EligibilityRuleEngine;