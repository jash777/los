/**
 * Workflow constants for the Lend-1 application
 * Defines stage names, statuses, and other workflow-related constants
 */

// Workflow stages
const WORKFLOW_STAGES = {
    INTAKE: 'intake',
    ELIGIBILITY: 'eligibility',
    KYC_AML: 'kyc-aml',
    CREDIT_BUREAU: 'credit-bureau',
    BANK_ANALYSIS: 'bank-analysis',
    RISK_ASSESSMENT: 'risk-assessment',
    OFFER_GENERATION: 'offer-generation',
    DOCUMENT_GENERATION: 'document-generation',
    APPROVAL: 'approval',
    DISBURSEMENT: 'disbursement'
};

// Stage statuses
const STAGE_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    CANCELLED: 'cancelled'
};

// Workflow statuses
const WORKFLOW_STATUS = {
    INITIATED: 'initiated',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Application statuses
const APPLICATION_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    INTAKE_COMPLETED: 'intake_completed',
    PRELIMINARY_ELIGIBLE: 'preliminary_eligible',
    PRELIMINARY_REJECTED: 'preliminary_rejected',
    SECONDARY_ELIGIBLE: 'secondary_eligible',
    SECONDARY_REJECTED: 'secondary_rejected',
    ELIGIBILITY_PASSED: 'eligibility_passed',
    ELIGIBILITY_FAILED: 'eligibility_failed',
    KYC_COMPLETED: 'kyc_completed',
    KYC_FAILED: 'kyc_failed',
    CREDIT_BUREAU_COMPLETED: 'credit_bureau_completed',
    RISK_ASSESSMENT_COMPLETED: 'risk_assessment_completed',
    OFFER_GENERATED: 'offer_generated',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    DISBURSED: 'disbursed'
};

// Priority levels
const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Risk levels
const RISK_LEVELS = {
    VERY_LOW: 'very_low',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    VERY_HIGH: 'very_high'
};

// Decision types
const DECISION_TYPES = {
    APPROVE: 'approve',
    REJECT: 'reject',
    REVIEW: 'review',
    CONDITIONAL: 'conditional'
};

// Stage order for sequential processing
const STAGE_ORDER = [
    WORKFLOW_STAGES.INTAKE,
    WORKFLOW_STAGES.ELIGIBILITY,
    WORKFLOW_STAGES.KYC_AML,
    WORKFLOW_STAGES.CREDIT_BUREAU,
    WORKFLOW_STAGES.BANK_ANALYSIS,
    WORKFLOW_STAGES.RISK_ASSESSMENT,
    WORKFLOW_STAGES.OFFER_GENERATION,
    WORKFLOW_STAGES.DOCUMENT_GENERATION,
    WORKFLOW_STAGES.APPROVAL,
    WORKFLOW_STAGES.DISBURSEMENT
];

// Stage dependencies (which stages must complete before this stage can start)
const STAGE_DEPENDENCIES = {
    [WORKFLOW_STAGES.INTAKE]: [],
    [WORKFLOW_STAGES.ELIGIBILITY]: [WORKFLOW_STAGES.INTAKE],
    [WORKFLOW_STAGES.KYC_AML]: [WORKFLOW_STAGES.ELIGIBILITY],
    [WORKFLOW_STAGES.CREDIT_BUREAU]: [WORKFLOW_STAGES.KYC_AML],
    [WORKFLOW_STAGES.BANK_ANALYSIS]: [WORKFLOW_STAGES.CREDIT_BUREAU],
    [WORKFLOW_STAGES.RISK_ASSESSMENT]: [WORKFLOW_STAGES.BANK_ANALYSIS],
    [WORKFLOW_STAGES.OFFER_GENERATION]: [WORKFLOW_STAGES.RISK_ASSESSMENT],
    [WORKFLOW_STAGES.DOCUMENT_GENERATION]: [WORKFLOW_STAGES.OFFER_GENERATION],
    [WORKFLOW_STAGES.APPROVAL]: [WORKFLOW_STAGES.DOCUMENT_GENERATION],
    [WORKFLOW_STAGES.DISBURSEMENT]: [WORKFLOW_STAGES.APPROVAL]
};

// Timeout configurations (in milliseconds)
const STAGE_TIMEOUTS = {
    [WORKFLOW_STAGES.INTAKE]: 30000, // 30 seconds
    [WORKFLOW_STAGES.ELIGIBILITY]: 60000, // 1 minute
    [WORKFLOW_STAGES.KYC_AML]: 120000, // 2 minutes
    [WORKFLOW_STAGES.CREDIT_BUREAU]: 180000, // 3 minutes
    [WORKFLOW_STAGES.BANK_ANALYSIS]: 300000, // 5 minutes
    [WORKFLOW_STAGES.RISK_ASSESSMENT]: 120000, // 2 minutes
    [WORKFLOW_STAGES.OFFER_GENERATION]: 60000, // 1 minute
    [WORKFLOW_STAGES.DOCUMENT_GENERATION]: 120000, // 2 minutes
    [WORKFLOW_STAGES.APPROVAL]: 60000, // 1 minute
    [WORKFLOW_STAGES.DISBURSEMENT]: 300000 // 5 minutes
};

// Export with both naming conventions for compatibility
module.exports = {
    WORKFLOW_STAGES,
    STAGE_STATUS,
    WORKFLOW_STATUS,
    APPLICATION_STATUS,
    ApplicationStatus: APPLICATION_STATUS, // Alias for compatibility
    StageStatus: STAGE_STATUS, // Alias for compatibility
    PRIORITY_LEVELS,
    RISK_LEVELS,
    DECISION_TYPES,
    STAGE_ORDER,
    STAGE_DEPENDENCIES,
    STAGE_TIMEOUTS
};