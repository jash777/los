/**
 * Loan Origination Phases Constants
 * Defines the new 7-phase loan origination workflow structure
 */

// Loan Origination Phases
const LOAN_ORIGINATION_PHASES = {
    PRE_QUALIFICATION: 'pre-qualification',
    LOAN_APPLICATION: 'loan-application', 
    APPLICATION_PROCESSING: 'application-processing',
    UNDERWRITING: 'underwriting',
    CREDIT_DECISION: 'credit-decision',
    QUALITY_CHECK: 'quality-check',
    LOAN_FUNDING: 'loan-funding'
};

// Phase statuses
const PHASE_STATUS = {
    PENDING: 'pending',
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    REQUIRES_REVIEW: 'requires_review'
};

// Pre-Qualification sub-stages
const PRE_QUALIFICATION_STAGES = {
    PRELIMINARY_ASSESSMENT: 'preliminary-assessment',
    IDENTITY_VERIFICATION: 'identity-verification',
    CIBIL_CHECK: 'cibil-check',
    EMPLOYMENT_VERIFICATION: 'employment-verification',
    ELIGIBILITY_ASSESSMENT: 'eligibility-assessment'
};

// Application Processing sub-stages
const APPLICATION_PROCESSING_STAGES = {
    IDENTITY_EMPLOYMENT_VERIFICATION: 'identity-employment-verification',
    FINANCIAL_DOCUMENT_VERIFICATION: 'financial-document-verification',
    INCONSISTENCY_CHECK: 'inconsistency-check',
    AUTOMATED_FLAGGING: 'automated-flagging',
    EXTERNAL_DATABASE_VALIDATION: 'external-database-validation'
};

// Underwriting sub-stages
const UNDERWRITING_STAGES = {
    CREDIT_SCORE_ASSESSMENT: 'credit-score-assessment',
    DTI_RATIO_CALCULATION: 'dti-ratio-calculation',
    COLLATERAL_ASSESSMENT: 'collateral-assessment',
    EMPLOYMENT_STABILITY_CHECK: 'employment-stability-check',
    AUTOMATED_UNDERWRITING: 'automated-underwriting'
};

// Credit Decision outcomes
const CREDIT_DECISION_OUTCOMES = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CONDITIONAL_APPROVAL: 'conditional-approval',
    REQUIRES_MANUAL_REVIEW: 'requires-manual-review'
};

// Quality Check types
const QUALITY_CHECK_TYPES = {
    DOCUMENT_VERIFICATION: 'document-verification',
    REGULATORY_COMPLIANCE: 'regulatory-compliance',
    INTERNAL_STANDARDS: 'internal-standards',
    RISK_VALIDATION: 'risk-validation'
};

// Loan Funding Status
const FUNDING_STATUS = {
    PENDING: 'pending',
    PRE_DISBURSEMENT_CHECKS: 'pre_disbursement_checks',
    ACCOUNT_CREATION: 'account_creation',
    DISBURSEMENT_PROCESSING: 'disbursement_processing',
    DISBURSED: 'disbursed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// Phase dependencies (which phases must complete before this phase can start)
const PHASE_DEPENDENCIES = {
    [LOAN_ORIGINATION_PHASES.PRE_QUALIFICATION]: [],
    [LOAN_ORIGINATION_PHASES.LOAN_APPLICATION]: [LOAN_ORIGINATION_PHASES.PRE_QUALIFICATION],
    [LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING]: [LOAN_ORIGINATION_PHASES.LOAN_APPLICATION],
    [LOAN_ORIGINATION_PHASES.UNDERWRITING]: [LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING],
    [LOAN_ORIGINATION_PHASES.CREDIT_DECISION]: [LOAN_ORIGINATION_PHASES.UNDERWRITING],
    [LOAN_ORIGINATION_PHASES.QUALITY_CHECK]: [LOAN_ORIGINATION_PHASES.CREDIT_DECISION],
    [LOAN_ORIGINATION_PHASES.LOAN_FUNDING]: [LOAN_ORIGINATION_PHASES.QUALITY_CHECK]
};

// Phase order for sequential processing
const PHASE_ORDER = [
    LOAN_ORIGINATION_PHASES.PRE_QUALIFICATION,
    LOAN_ORIGINATION_PHASES.LOAN_APPLICATION,
    LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING,
    LOAN_ORIGINATION_PHASES.UNDERWRITING,
    LOAN_ORIGINATION_PHASES.CREDIT_DECISION,
    LOAN_ORIGINATION_PHASES.QUALITY_CHECK,
    LOAN_ORIGINATION_PHASES.LOAN_FUNDING
];

// Phase descriptions
const PHASE_DESCRIPTIONS = {
    [LOAN_ORIGINATION_PHASES.PRE_QUALIFICATION]: {
        name: 'Pre-Qualification',
        description: 'Preliminary assessment with eligibility, identity, CIBIL and employment checks',
        purpose: 'Rule out ineligible applicants early and provide quick pre-approval',
        stages: PRE_QUALIFICATION_STAGES
    },
    [LOAN_ORIGINATION_PHASES.LOAN_APPLICATION]: {
        name: 'Loan Application',
        description: 'Detailed financial information collection for formal loan application',
        purpose: 'Gather comprehensive financial data for underwriting',
        stages: []
    },
    [LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING]: {
        name: 'Application Processing',
        description: 'Rigorous verification and validation of all provided information',
        purpose: 'Ensure accuracy and completeness of application data',
        stages: APPLICATION_PROCESSING_STAGES
    },
    [LOAN_ORIGINATION_PHASES.UNDERWRITING]: {
        name: 'Underwriting Process',
        description: 'Meticulous assessment of creditworthiness and risk',
        purpose: 'Evaluate borrower\'s ability to repay and associated risks',
        stages: UNDERWRITING_STAGES
    },
    [LOAN_ORIGINATION_PHASES.CREDIT_DECISION]: {
        name: 'Credit Decision',
        description: 'Definitive credit decision based on underwriting results',
        purpose: 'Make final approval/rejection decision with terms',
        stages: []
    },
    [LOAN_ORIGINATION_PHASES.QUALITY_CHECK]: {
        name: 'Quality Check',
        description: 'Final compliance and accuracy verification before funding',
        purpose: 'Ensure regulatory compliance and minimize risks',
        stages: QUALITY_CHECK_TYPES
    },
    [LOAN_ORIGINATION_PHASES.LOAN_FUNDING]: {
        name: 'Loan Funding',
        description: 'Final disbursement of approved loan amount',
        purpose: 'Complete the loan origination process with fund transfer',
        stages: []
    }
};

// Application statuses for new workflow
const APPLICATION_STATUS_NEW = {
    // Pre-Qualification statuses
    PRE_QUALIFICATION_PENDING: 'pre_qualification_pending',
    PRE_QUALIFICATION_IN_PROGRESS: 'pre_qualification_in_progress',
    PRE_QUALIFICATION_APPROVED: 'pre_qualification_approved',
    PRE_QUALIFICATION_REJECTED: 'pre_qualification_rejected',
    
    // Loan Application statuses
    LOAN_APPLICATION_PENDING: 'loan_application_pending',
    LOAN_APPLICATION_IN_PROGRESS: 'loan_application_in_progress',
    LOAN_APPLICATION_COMPLETED: 'loan_application_completed',
    
    // Application Processing statuses
    APPLICATION_PROCESSING_PENDING: 'application_processing_pending',
    APPLICATION_PROCESSING_IN_PROGRESS: 'application_processing_in_progress',
    APPLICATION_PROCESSING_COMPLETED: 'application_processing_completed',
    APPLICATION_PROCESSING_FLAGGED: 'application_processing_flagged',
    
    // Underwriting statuses
    UNDERWRITING_PENDING: 'underwriting_pending',
    UNDERWRITING_IN_PROGRESS: 'underwriting_in_progress',
    UNDERWRITING_COMPLETED: 'underwriting_completed',
    UNDERWRITING_REQUIRES_REVIEW: 'underwriting_requires_review',
    
    // Credit Decision statuses
    CREDIT_DECISION_PENDING: 'credit_decision_pending',
    CREDIT_DECISION_APPROVED: 'credit_decision_approved',
    CREDIT_DECISION_REJECTED: 'credit_decision_rejected',
    CREDIT_DECISION_CONDITIONAL: 'credit_decision_conditional',
    
    // Quality Check statuses
    QUALITY_CHECK_PENDING: 'quality_check_pending',
    QUALITY_CHECK_IN_PROGRESS: 'quality_check_in_progress',
    QUALITY_CHECK_PASSED: 'quality_check_passed',
    QUALITY_CHECK_FAILED: 'quality_check_failed',
    
    // Final statuses
    LOAN_FUNDED: 'loan_funded',
    LOAN_CANCELLED: 'loan_cancelled',
    LOAN_EXPIRED: 'loan_expired'
};

module.exports = {
    LOAN_ORIGINATION_PHASES,
    PHASE_STATUS,
    PRE_QUALIFICATION_STAGES,
    APPLICATION_PROCESSING_STAGES,
    UNDERWRITING_STAGES,
    CREDIT_DECISION_OUTCOMES,
    QUALITY_CHECK_TYPES,
    FUNDING_STATUS,
    PHASE_DEPENDENCIES,
    PHASE_ORDER,
    PHASE_DESCRIPTIONS,
    APPLICATION_STATUS_NEW
};