/**
 * Application Processing Phase Model
 * Mongoose schema for application processing phase data
 */

const mongoose = require('mongoose');
const { LOAN_ORIGINATION_PHASES, PHASE_STATUS, APPLICATION_PROCESSING_STAGES } = require('../../middleware/constants/loan-origination-phases');

/**
 * Additional Document Schema
 */
const additionalDocumentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['identity', 'financial', 'employment', 'address', 'other'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    },
    verification_notes: String
}, { _id: false });

/**
 * Verification Preferences Schema
 */
const verificationPreferencesSchema = new mongoose.Schema({
    identity_method: {
        type: String,
        enum: ['automatic', 'manual', 'hybrid'],
        default: 'automatic'
    },
    employment_method: {
        type: String,
        enum: ['automatic', 'manual', 'hybrid'],
        default: 'automatic'
    },
    financial_method: {
        type: String,
        enum: ['automatic', 'manual', 'hybrid'],
        default: 'automatic'
    },
    address_method: {
        type: String,
        enum: ['automatic', 'manual', 'hybrid'],
        default: 'automatic'
    }
}, { _id: false });

/**
 * Applicant Data Schema
 */
const applicantDataSchema = new mongoose.Schema({
    additional_documents: [additionalDocumentSchema],
    verification_preferences: verificationPreferencesSchema,
    special_instructions: String,
    priority_level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, { _id: false });

/**
 * Verification Request Schema
 */
const verificationRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['identity', 'employment', 'financial', 'address'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    details: String,
    requested_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending'
    },
    completed_at: Date,
    result: mongoose.Schema.Types.Mixed
}, { _id: false });

/**
 * Verification Check Schema
 */
const verificationCheckSchema = new mongoose.Schema({
    verified: {
        type: Boolean,
        required: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100
    },
    details: String,
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number,
    error_message: String
}, { _id: false });

/**
 * Identity Employment Verification Schema
 */
const identityEmploymentVerificationSchema = new mongoose.Schema({
    verified: {
        type: Boolean,
        required: true
    },
    checks: {
        pan_verification: verificationCheckSchema,
        employment_verification: verificationCheckSchema,
        address_verification: verificationCheckSchema
    },
    verification_score: {
        type: Number,
        min: 0,
        max: 100
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * Financial Documents Verification Schema
 */
const financialDocumentsVerificationSchema = new mongoose.Schema({
    verified: {
        type: Boolean,
        required: true
    },
    checks: {
        income_proof: verificationCheckSchema,
        bank_statements: verificationCheckSchema,
        financial_consistency: verificationCheckSchema
    },
    verification_score: {
        type: Number,
        min: 0,
        max: 100
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * Inconsistency Check Schema
 */
const inconsistencyCheckSchema = new mongoose.Schema({
    hasInconsistency: {
        type: Boolean,
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    details: String,
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * Inconsistency Check Results Schema
 */
const inconsistencyCheckResultsSchema = new mongoose.Schema({
    passed: {
        type: Boolean,
        required: true
    },
    checks: {
        income_consistency: inconsistencyCheckSchema,
        employment_consistency: inconsistencyCheckSchema,
        document_data_consistency: inconsistencyCheckSchema
    },
    inconsistency_score: {
        type: Number,
        min: 0,
        max: 100
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * Flag Schema
 */
const flagSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    description: String,
    detected_at: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Flagging Check Schema
 */
const flaggingCheckSchema = new mongoose.Schema({
    flags: [flagSchema],
    risk_level: {
        type: String,
        enum: ['low', 'normal', 'elevated', 'high']
    },
    fraud_risk: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    compliance_status: {
        type: String,
        enum: ['compliant', 'review_required', 'non_compliant']
    }
}, { _id: false });

/**
 * Automated Flagging Schema
 */
const automatedFlaggingSchema = new mongoose.Schema({
    total_flags: {
        type: Number,
        default: 0
    },
    checks: {
        risk_flags: flaggingCheckSchema,
        fraud_indicators: flaggingCheckSchema,
        compliance_flags: flaggingCheckSchema
    },
    flagging_score: {
        type: Number,
        min: 0,
        max: 100
    },
    requires_manual_review: {
        type: Boolean,
        default: false
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * External Validation Schema
 */
const externalValidationSchema = new mongoose.Schema({
    validated: {
        type: Boolean,
        required: true
    },
    checks: {
        cibil_validation: verificationCheckSchema,
        employment_database: verificationCheckSchema,
        regulatory_databases: verificationCheckSchema
    },
    validation_score: {
        type: Number,
        min: 0,
        max: 100
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    processing_time_ms: Number
}, { _id: false });

/**
 * Verification Results Schema
 */
const verificationResultsSchema = new mongoose.Schema({
    identity_employment: identityEmploymentVerificationSchema,
    financial_documents: financialDocumentsVerificationSchema,
    inconsistency_check: inconsistencyCheckResultsSchema,
    automated_flagging: automatedFlaggingSchema,
    external_validation: externalValidationSchema
}, { _id: false });

/**
 * Score Breakdown Schema
 */
const scoreBreakdownSchema = new mongoose.Schema({
    identity_employment: {
        type: Number,
        min: 0,
        max: 100
    },
    financial_documents: {
        type: Number,
        min: 0,
        max: 100
    },
    consistency_check: {
        type: Number,
        min: 0,
        max: 100
    },
    external_validation: {
        type: Number,
        min: 0,
        max: 100
    },
    flagging_penalty: {
        type: Number,
        min: 0,
        max: 100
    }
}, { _id: false });

/**
 * Flags Summary Schema
 */
const flagsSummarySchema = new mongoose.Schema({
    total_flags: {
        type: Number,
        default: 0
    },
    requires_review: {
        type: Boolean,
        default: false
    },
    high_severity_flags: {
        type: Number,
        default: 0
    },
    medium_severity_flags: {
        type: Number,
        default: 0
    },
    low_severity_flags: {
        type: Number,
        default: 0
    }
}, { _id: false });

/**
 * Processing Result Schema
 */
const processingResultSchema = new mongoose.Schema({
    approved: {
        type: Boolean,
        required: true
    },
    overall_score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    requires_manual_review: {
        type: Boolean,
        default: false
    },
    score_breakdown: scoreBreakdownSchema,
    flags_summary: flagsSummarySchema,
    recommendations: [String],
    next_steps: [String],
    failure_reason: String,
    next_phase: {
        type: String,
        enum: Object.values(LOAN_ORIGINATION_PHASES)
    }
}, { _id: false });

/**
 * Processing Log Schema
 */
const processingLogSchema = new mongoose.Schema({
    stage: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['started', 'completed', 'failed'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    details: mongoose.Schema.Types.Mixed,
    processing_time_ms: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Main Application Processing Schema
 */
const applicationProcessingSchema = new mongoose.Schema({
    application_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    loan_application_id: {
        type: String,
        required: true,
        index: true
    },
    request_id: {
        type: String,
        required: true,
        index: true
    },
    phase: {
        type: String,
        default: LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING,
        enum: [LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING]
    },
    status: {
        type: String,
        enum: Object.values(PHASE_STATUS),
        default: PHASE_STATUS.PENDING
    },
    current_stage: {
        type: String,
        enum: Object.values(APPLICATION_PROCESSING_STAGES),
        default: APPLICATION_PROCESSING_STAGES.IDENTITY_EMPLOYMENT_VERIFICATION
    },
    applicant_data: applicantDataSchema,
    verification_requests: [verificationRequestSchema],
    verification_results: verificationResultsSchema,
    processing_result: processingResultSchema,
    processing_logs: [processingLogSchema],
    processing_started_at: Date,
    processing_completed_at: Date,
    total_processing_time_ms: Number,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

/**
 * Indexes
 */
applicationProcessingSchema.index({ application_id: 1 });
applicationProcessingSchema.index({ loan_application_id: 1 });
applicationProcessingSchema.index({ request_id: 1 });
applicationProcessingSchema.index({ status: 1 });
applicationProcessingSchema.index({ current_stage: 1 });
applicationProcessingSchema.index({ created_at: -1 });
applicationProcessingSchema.index({ 'processing_result.approved': 1 });
applicationProcessingSchema.index({ 'processing_result.requires_manual_review': 1 });

/**
 * Pre-save middleware
 */
applicationProcessingSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

/**
 * Instance Methods
 */

/**
 * Add processing log
 */
applicationProcessingSchema.methods.addProcessingLog = function(stage, status, message, details = null, processingTime = null) {
    const logEntry = {
        stage,
        status,
        message,
        details,
        processing_time_ms: processingTime,
        timestamp: new Date()
    };
    
    this.processing_logs.push(logEntry);
    return this.save();
};

/**
 * Update status
 */
applicationProcessingSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.status = newStatus;
    
    // Update additional fields if provided
    Object.keys(additionalData).forEach(key => {
        if (key.includes('.')) {
            // Handle nested field updates
            const keys = key.split('.');
            let current = this;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = additionalData[key];
        } else {
            this[key] = additionalData[key];
        }
    });
    
    return this.save();
};

/**
 * Get processing summary
 */
applicationProcessingSchema.methods.getProcessingSummary = function() {
    return {
        applicationId: this.application_id,
        loanApplicationId: this.loan_application_id,
        phase: this.phase,
        status: this.status,
        currentStage: this.current_stage,
        overallScore: this.processing_result?.overall_score,
        approved: this.processing_result?.approved,
        requiresManualReview: this.processing_result?.requires_manual_review,
        totalFlags: this.verification_results?.automated_flagging?.total_flags || 0,
        processingTime: this.total_processing_time_ms,
        createdAt: this.created_at,
        updatedAt: this.updated_at
    };
};

/**
 * Calculate verification completion percentage
 */
applicationProcessingSchema.methods.getVerificationProgress = function() {
    const stages = Object.values(APPLICATION_PROCESSING_STAGES);
    const currentStageIndex = stages.indexOf(this.current_stage);
    const completionPercentage = ((currentStageIndex + 1) / stages.length) * 100;
    
    return {
        currentStage: this.current_stage,
        completedStages: currentStageIndex + 1,
        totalStages: stages.length,
        completionPercentage: Math.round(completionPercentage)
    };
};

/**
 * Static Methods
 */

/**
 * Find applications by loan application ID
 */
applicationProcessingSchema.statics.findByLoanApplicationId = function(loanApplicationId) {
    return this.find({ loan_application_id: loanApplicationId });
};

/**
 * Find applications by status
 */
applicationProcessingSchema.statics.findByStatus = function(status) {
    return this.find({ status });
};

/**
 * Find applications requiring manual review
 */
applicationProcessingSchema.statics.findRequiringManualReview = function() {
    return this.find({ 'processing_result.requires_manual_review': true });
};

/**
 * Find approved applications
 */
applicationProcessingSchema.statics.findApproved = function() {
    return this.find({ 'processing_result.approved': true });
};

/**
 * Get processing statistics
 */
applicationProcessingSchema.statics.getProcessingStats = async function(dateRange = {}) {
    const matchStage = {};
    
    if (dateRange.startDate || dateRange.endDate) {
        matchStage.created_at = {};
        if (dateRange.startDate) {
            matchStage.created_at.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
            matchStage.created_at.$lte = new Date(dateRange.endDate);
        }
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total_applications: { $sum: 1 },
                approved_applications: {
                    $sum: { $cond: [{ $eq: ['$processing_result.approved', true] }, 1, 0] }
                },
                flagged_applications: {
                    $sum: { $cond: [{ $eq: ['$processing_result.requires_manual_review', true] }, 1, 0] }
                },
                average_processing_time: { $avg: '$total_processing_time_ms' },
                average_score: { $avg: '$processing_result.overall_score' }
            }
        }
    ]);
    
    return stats[0] || {
        total_applications: 0,
        approved_applications: 0,
        flagged_applications: 0,
        average_processing_time: 0,
        average_score: 0
    };
};

const ApplicationProcessing = mongoose.model('ApplicationProcessing', applicationProcessingSchema);

module.exports = ApplicationProcessing;