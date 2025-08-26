/**
 * Rule Engine Module Index
 * Exports all rule engines for easy importing and usage
 */

const BaseRuleEngine = require('./base-rule-engine');
const KYCRuleEngine = require('./kyc-rule-engine');
const CIBILRuleEngine = require('./cibil-rule-engine');
const EligibilityRuleEngine = require('./eligibility-rule-engine');
const RiskAssessmentRuleEngine = require('./risk-assessment-rule-engine');

module.exports = {
    BaseRuleEngine,
    KYCRuleEngine,
    CIBILRuleEngine,
    EligibilityRuleEngine,
    RiskAssessmentRuleEngine,
    
    // Factory function to create rule engines
    createRuleEngine: (type, config = {}) => {
        switch (type.toLowerCase()) {
            case 'kyc':
                return new KYCRuleEngine(config);
            case 'cibil':
            case 'credit':
            case 'credit-bureau':
                return new CIBILRuleEngine(config);
            case 'eligibility':
                return new EligibilityRuleEngine(config);
            case 'risk':
            case 'risk-assessment':
                return new RiskAssessmentRuleEngine(config);
            case 'base':
                return new BaseRuleEngine(config);
            default:
                throw new Error(`Unknown rule engine type: ${type}`);
        }
    },
    
    // Get all available rule engine types
    getAvailableTypes: () => {
        return ['kyc', 'cibil', 'eligibility', 'risk-assessment', 'base'];
    },
    
    // Validate rule engine type
    isValidType: (type) => {
        const validTypes = ['kyc', 'cibil', 'credit', 'credit-bureau', 'eligibility', 'risk', 'risk-assessment', 'base'];
        return validTypes.includes(type.toLowerCase());
    }
};