const mongoose = require('mongoose');
const { CREDIT_DECISION_OUTCOMES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

// Decision Data Schema
const decisionDataSchema = new mongoose.Schema({
    manual_review_required: {
        type: Boolean,
        default: false
    },
    reviewer_notes: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    override_reason: {
        type: String,
        maxlength: 500,
        trim: true
    },
    additional_conditions: [{
        type: String,
        maxlength: 200,
        trim: true
    }]
}, { _id: false });

// Decision Factors Schema
const decisionFactorsSchema = new mongoose.Schema({
    underwriting_score: {
        type: Number,
        required: true
    },
    credit_score: {
        type: Number,
        required: true
    },
    dti_ratio: {
        type: Number,
        required: true
    },
    risk_category: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    collateral_ltv: {
        type: Number,
        min: 0,
        max: 100
    },
    policy_compliance: {
        type: Boolean,
        required: true
    }
}, { _id: false });

// Processing Summary Schema
const processingSummarySchema = new mongoose.Schema({
    total_processing_time: {
        type: Number, // in minutes
        required: true
    },
    automated_decision: {
        type: Boolean,
        required: true
    },
    manual_override_applied: {
        type: Boolean,
        default: false
    },
    conditions_count: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Decision Result Schema
const decisionResultSchema = new mongoose.Schema({
    final_decision: {
        type: String,
        enum: Object.values(CREDIT_DECISION_OUTCOMES),
        required: true
    },
    approved_loan_amount: {
        type: Number,
        min: 0,
        required: true
    },
    interest_rate: {
        type: Number,
        min: 0,
        max: 50,
        required: true
    },
    approved_tenure: {
        type: Number, // in months
        min: 1,
        max: 360,
        required: true
    },
    monthly_emi: {
        type: Number,
        min: 0,
        required: true
    },
    loan_conditions: [{
        type: String,
        maxlength: 200,
        trim: true
    }],
    validity_period: {
        type: Number, // in days
        min: 0,
        required: true
    },
    decision_factors: {
        type: decisionFactorsSchema,
        required: true
    },
    processing_summary: {
        type: processingSummarySchema,
        required: true
    },
    decision_date: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { _id: false });

// Processing Log Schema
const processingLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    action: {
        type: String,
        required: true,
        maxlength: 200
    },
    details: {
        type: String,
        maxlength: 500
    },
    performed_by: {
        type: String,
        enum: ['system', 'user', 'admin', 'reviewer'],
        default: 'system'
    }
}, { _id: false });

// Main Credit Decision Schema
const creditDecisionSchema = new mongoose.Schema({
    underwriting_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Underwriting',
        required: true,
        index: true
    },
    loan_application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoanApplication',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(PHASE_STATUS),
        default: PHASE_STATUS.PENDING,
        required: true,
        index: true
    },
    decision_data: {
        type: decisionDataSchema,
        required: true
    },
    decision_result: {
        type: decisionResultSchema
    },
    processing_logs: [processingLogSchema],
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'credit_decisions'
});

// Indexes for better query performance
creditDecisionSchema.index({ underwriting_id: 1, status: 1 });
creditDecisionSchema.index({ loan_application_id: 1, status: 1 });
creditDecisionSchema.index({ 'decision_result.final_decision': 1, created_at: -1 });
creditDecisionSchema.index({ 'decision_result.decision_date': -1 });
creditDecisionSchema.index({ status: 1, created_at: -1 });

// Instance Methods

/**
 * Add a processing log entry
 */
creditDecisionSchema.methods.addLog = function(action, performedBy = 'system', details = '') {
    this.processing_logs.push({
        action,
        details,
        performed_by: performedBy,
        timestamp: new Date()
    });
    return this.save();
};

/**
 * Update credit decision status
 */
creditDecisionSchema.methods.updateStatus = function(newStatus, logMessage = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    
    const message = logMessage || `Status changed from ${oldStatus} to ${newStatus}`;
    this.processing_logs.push({
        action: message,
        performed_by: 'system',
        timestamp: new Date()
    });
    
    return this.save();
};

/**
 * Get decision summary
 */
creditDecisionSchema.methods.getDecisionSummary = function() {
    if (!this.decision_result) {
        return {
            status: this.status,
            decision: 'pending',
            processing_stage: 'in_progress'
        };
    }

    return {
        decision_id: this._id,
        final_decision: this.decision_result.final_decision,
        approved_amount: this.decision_result.approved_loan_amount,
        interest_rate: this.decision_result.interest_rate,
        monthly_emi: this.decision_result.monthly_emi,
        tenure: this.decision_result.approved_tenure,
        conditions_count: this.decision_result.loan_conditions.length,
        validity_days: this.decision_result.validity_period,
        decision_date: this.decision_result.decision_date,
        processing_time: this.decision_result.processing_summary.total_processing_time,
        automated: this.decision_result.processing_summary.automated_decision
    };
};

/**
 * Check if decision is still valid
 */
creditDecisionSchema.methods.isDecisionValid = function() {
    if (!this.decision_result || this.decision_result.validity_period === 0) {
        return false;
    }

    const decisionDate = new Date(this.decision_result.decision_date);
    const validityEndDate = new Date(decisionDate.getTime() + (this.decision_result.validity_period * 24 * 60 * 60 * 1000));
    
    return new Date() <= validityEndDate;
};

/**
 * Get remaining validity days
 */
creditDecisionSchema.methods.getRemainingValidityDays = function() {
    if (!this.isDecisionValid()) {
        return 0;
    }

    const decisionDate = new Date(this.decision_result.decision_date);
    const validityEndDate = new Date(decisionDate.getTime() + (this.decision_result.validity_period * 24 * 60 * 60 * 1000));
    const remainingMs = validityEndDate.getTime() - new Date().getTime();
    
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
};

/**
 * Get processing timeline
 */
creditDecisionSchema.methods.getProcessingTimeline = function() {
    return this.processing_logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: log.details,
        performed_by: log.performed_by
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Static Methods

/**
 * Find credit decision by underwriting ID
 */
creditDecisionSchema.statics.findByUnderwritingId = function(underwritingId) {
    return this.findOne({ underwriting_id: underwritingId })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('underwriting_id', 'underwriting_result automated_decision');
};

/**
 * Find credit decision by loan application ID
 */
creditDecisionSchema.statics.findByLoanApplicationId = function(loanApplicationId) {
    return this.findOne({ loan_application_id: loanApplicationId })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('underwriting_id', 'underwriting_result automated_decision');
};

/**
 * Find credit decisions by status
 */
creditDecisionSchema.statics.findByStatus = function(status, limit = 50) {
    return this.find({ status })
        .populate('loan_application_id', 'loan_details applicant_info')
        .sort({ created_at: -1 })
        .limit(limit);
};

/**
 * Find credit decisions by final decision
 */
creditDecisionSchema.statics.findByDecision = function(decision, limit = 50) {
    return this.find({ 'decision_result.final_decision': decision })
        .populate('loan_application_id', 'loan_details applicant_info')
        .sort({ 'decision_result.decision_date': -1 })
        .limit(limit);
};

/**
 * Find credit decisions requiring manual review
 */
creditDecisionSchema.statics.findManualReviewRequired = function(limit = 20) {
    return this.find({ 
        'decision_data.manual_review_required': true,
        status: { $in: [PHASE_STATUS.IN_PROGRESS, PHASE_STATUS.PENDING] }
    })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('underwriting_id', 'underwriting_result')
        .sort({ created_at: 1 })
        .limit(limit);
};

/**
 * Find expiring decisions
 */
creditDecisionSchema.statics.findExpiringDecisions = function(daysThreshold = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return this.find({
        'decision_result.final_decision': { $in: [CREDIT_DECISION_OUTCOMES.APPROVED, CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL] },
        'decision_result.decision_date': { $exists: true }
    })
        .populate('loan_application_id', 'loan_details applicant_info')
        .sort({ 'decision_result.decision_date': 1 });
};

/**
 * Get credit decision statistics
 */
creditDecisionSchema.statics.getDecisionStatistics = function(startDate, endDate) {
    const matchStage = {
        'decision_result.decision_date': {
            $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
            $lte: endDate || new Date()
        }
    };

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total_decisions: { $sum: 1 },
                approved: {
                    $sum: {
                        $cond: [{ $eq: ['$decision_result.final_decision', CREDIT_DECISION_OUTCOMES.APPROVED] }, 1, 0]
                    }
                },
                conditional_approval: {
                    $sum: {
                        $cond: [{ $eq: ['$decision_result.final_decision', CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL] }, 1, 0]
                    }
                },
                rejected: {
                    $sum: {
                        $cond: [{ $eq: ['$decision_result.final_decision', CREDIT_DECISION_OUTCOMES.REJECTED] }, 1, 0]
                    }
                },
                total_approved_amount: {
                    $sum: {
                        $cond: [
                            { $in: ['$decision_result.final_decision', [CREDIT_DECISION_OUTCOMES.APPROVED, CREDIT_DECISION_OUTCOMES.CONDITIONAL_APPROVAL]] },
                            '$decision_result.approved_loan_amount',
                            0
                        ]
                    }
                },
                avg_processing_time: { $avg: '$decision_result.processing_summary.total_processing_time' },
                automated_decisions: {
                    $sum: {
                        $cond: ['$decision_result.processing_summary.automated_decision', 1, 0]
                    }
                },
                manual_reviews: {
                    $sum: {
                        $cond: ['$decision_data.manual_review_required', 1, 0]
                    }
                },
                avg_interest_rate: { $avg: '$decision_result.interest_rate' }
            }
        },
        {
            $project: {
                _id: 0,
                total_decisions: 1,
                approved: 1,
                conditional_approval: 1,
                rejected: 1,
                approval_rate: {
                    $multiply: [
                        { $divide: [{ $add: ['$approved', '$conditional_approval'] }, '$total_decisions'] },
                        100
                    ]
                },
                rejection_rate: {
                    $multiply: [
                        { $divide: ['$rejected', '$total_decisions'] },
                        100
                    ]
                },
                total_approved_amount: 1,
                avg_processing_time_minutes: { $round: ['$avg_processing_time', 2] },
                automation_rate: {
                    $multiply: [
                        { $divide: ['$automated_decisions', '$total_decisions'] },
                        100
                    ]
                },
                manual_review_rate: {
                    $multiply: [
                        { $divide: ['$manual_reviews', '$total_decisions'] },
                        100
                    ]
                },
                avg_interest_rate: { $round: ['$avg_interest_rate', 2] }
            }
        }
    ]);
};

/**
 * Get processing time statistics
 */
creditDecisionSchema.statics.getProcessingTimeStats = function() {
    return this.aggregate([
        {
            $match: {
                'decision_result.processing_summary.total_processing_time': { $exists: true }
            }
        },
        {
            $group: {
                _id: null,
                avg_processing_time: { $avg: '$decision_result.processing_summary.total_processing_time' },
                min_processing_time: { $min: '$decision_result.processing_summary.total_processing_time' },
                max_processing_time: { $max: '$decision_result.processing_summary.total_processing_time' },
                total_decisions: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                avg_processing_time_minutes: { $round: ['$avg_processing_time', 2] },
                min_processing_time_minutes: '$min_processing_time',
                max_processing_time_minutes: '$max_processing_time',
                total_decisions: 1
            }
        }
    ]);
};

module.exports = mongoose.model('CreditDecision', creditDecisionSchema);