const mongoose = require('mongoose');
const { PHASE_STATUS, QUALITY_CHECK_TYPES } = require('../../middleware/constants/loan-origination-phases');

// Sub-schema for quality check data
const checkDataSchema = new mongoose.Schema({
    priority_level: {
        type: String,
        enum: ['standard', 'high', 'urgent'],
        default: 'standard'
    },
    manual_review_required: {
        type: Boolean,
        default: false
    },
    reviewer_notes: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    additional_checks: [{
        type: {
            type: String,
            required: true,
            maxlength: 100
        },
        name: {
            type: String,
            required: true,
            maxlength: 200
        },
        parameters: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }]
}, { _id: false });

// Sub-schema for individual quality check results
const qualityCheckResultSchema = new mongoose.Schema({
    check_type: {
        type: String,
        required: true,
        enum: Object.values(QUALITY_CHECK_TYPES)
    },
    status: {
        type: String,
        required: true,
        enum: ['passed', 'warning', 'failed']
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    issues: [{
        type: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            required: true,
            enum: ['critical', 'warning', 'info']
        },
        description: {
            type: String,
            required: true
        },
        field: String,
        document_type: String,
        document_id: mongoose.Schema.Types.ObjectId,
        regulation: String,
        policy: String,
        risk_factor: String,
        calculation_type: String
    }],
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    manual_review: {
        type: Boolean,
        default: false
    }
}, { _id: false });

// Sub-schema for check summary
const checkSummarySchema = new mongoose.Schema({
    total_checks: {
        type: Number,
        required: true,
        min: 0
    },
    passed_checks: {
        type: Number,
        required: true,
        min: 0
    },
    failed_checks: {
        type: Number,
        required: true,
        min: 0
    },
    warning_checks: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Sub-schema for processing summary
const processingSummarySchema = new mongoose.Schema({
    total_processing_time: {
        type: Number,
        required: true,
        min: 0
    },
    automated_checks: {
        type: Number,
        required: true,
        min: 0
    },
    manual_reviews: {
        type: Number,
        required: true,
        min: 0
    },
    critical_issues: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Sub-schema for issues found
const issueSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        required: true,
        enum: ['critical', 'warning', 'info']
    },
    description: {
        type: String,
        required: true
    },
    check_type: {
        type: String,
        required: true
    },
    field: String,
    document_type: String,
    document_id: mongoose.Schema.Types.ObjectId,
    regulation: String,
    policy: String,
    risk_factor: String,
    calculation_type: String
}, { _id: false });

// Sub-schema for recommendations
const recommendationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['high', 'medium', 'low']
    },
    description: {
        type: String,
        required: true
    },
    action_required: {
        type: String,
        required: true
    }
}, { _id: false });

// Sub-schema for quality result
const qualityResultSchema = new mongoose.Schema({
    overall_status: {
        type: String,
        required: true,
        enum: ['passed', 'warning', 'failed']
    },
    compliance_score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    accuracy_score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    quality_checks: {
        type: Map,
        of: qualityCheckResultSchema,
        required: true
    },
    issues_found: [issueSchema],
    recommendations: [recommendationSchema],
    check_summary: {
        type: checkSummarySchema,
        required: true
    },
    processing_summary: {
        type: processingSummarySchema,
        required: true
    },
    check_date: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { _id: false });

// Sub-schema for processing logs
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
    user_type: {
        type: String,
        enum: ['system', 'user', 'admin'],
        default: 'system'
    },
    user_id: {
        type: String,
        maxlength: 100
    }
}, { _id: false });

// Main Quality Check schema
const qualityCheckSchema = new mongoose.Schema({
    credit_decision_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditDecision',
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
        index: true
    },
    check_data: {
        type: checkDataSchema,
        required: true
    },
    quality_result: {
        type: qualityResultSchema,
        default: null
    },
    processing_logs: {
        type: [processingLogSchema],
        default: []
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'quality_checks'
});

// Indexes for better query performance
qualityCheckSchema.index({ credit_decision_id: 1, status: 1 });
qualityCheckSchema.index({ loan_application_id: 1, status: 1 });
qualityCheckSchema.index({ status: 1, created_at: -1 });
qualityCheckSchema.index({ 'quality_result.overall_status': 1 });
qualityCheckSchema.index({ 'quality_result.compliance_score': 1 });
qualityCheckSchema.index({ 'quality_result.accuracy_score': 1 });
qualityCheckSchema.index({ 'check_data.priority_level': 1, status: 1 });

// Instance methods
qualityCheckSchema.methods.addLog = function(action, userType = 'system', userId = null, details = null) {
    this.processing_logs.push({
        action,
        user_type: userType,
        user_id: userId,
        details,
        timestamp: new Date()
    });
    return this.save();
};

qualityCheckSchema.methods.updateStatus = function(newStatus) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    if (newStatus === PHASE_STATUS.COMPLETED || newStatus === PHASE_STATUS.FAILED) {
        this.completed_at = new Date();
    }
    
    return this.addLog(`Status changed from ${oldStatus} to ${newStatus}`, 'system');
};

qualityCheckSchema.methods.getQualitySummary = function() {
    if (!this.quality_result) {
        return {
            status: this.status,
            overall_status: null,
            compliance_score: null,
            accuracy_score: null,
            issues_count: 0,
            recommendations_count: 0
        };
    }
    
    return {
        status: this.status,
        overall_status: this.quality_result.overall_status,
        compliance_score: this.quality_result.compliance_score,
        accuracy_score: this.quality_result.accuracy_score,
        issues_count: this.quality_result.issues_found.length,
        recommendations_count: this.quality_result.recommendations.length,
        critical_issues: this.quality_result.issues_found.filter(issue => issue.severity === 'critical').length,
        processing_time: this.quality_result.processing_summary.total_processing_time
    };
};

qualityCheckSchema.methods.getCriticalIssues = function() {
    if (!this.quality_result || !this.quality_result.issues_found) {
        return [];
    }
    
    return this.quality_result.issues_found.filter(issue => issue.severity === 'critical');
};

qualityCheckSchema.methods.getHighPriorityRecommendations = function() {
    if (!this.quality_result || !this.quality_result.recommendations) {
        return [];
    }
    
    return this.quality_result.recommendations.filter(rec => rec.priority === 'high');
};

qualityCheckSchema.methods.getProcessingTimeline = function() {
    const logs = this.processing_logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const timeline = [];
    
    logs.forEach(log => {
        timeline.push({
            timestamp: log.timestamp,
            action: log.action,
            details: log.details,
            user_type: log.user_type
        });
    });
    
    return timeline;
};

// Static methods
qualityCheckSchema.statics.findByCreditDecisionId = function(creditDecisionId) {
    return this.findOne({ credit_decision_id: creditDecisionId })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('credit_decision_id', 'decision_result');
};

qualityCheckSchema.statics.findByLoanApplicationId = function(loanApplicationId) {
    return this.find({ loan_application_id: loanApplicationId })
        .populate('credit_decision_id', 'decision_result')
        .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findByStatus = function(status) {
    return this.find({ status })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('credit_decision_id', 'decision_result')
        .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findByOverallStatus = function(overallStatus) {
    return this.find({ 'quality_result.overall_status': overallStatus })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('credit_decision_id', 'decision_result')
        .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findByPriorityLevel = function(priorityLevel) {
    return this.find({ 'check_data.priority_level': priorityLevel })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('credit_decision_id', 'decision_result')
        .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findWithCriticalIssues = function() {
    return this.find({ 
        'quality_result.issues_found': {
            $elemMatch: { severity: 'critical' }
        }
    })
    .populate('loan_application_id', 'loan_details applicant_info')
    .populate('credit_decision_id', 'decision_result')
    .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findRequiringManualReview = function() {
    return this.find({
        $or: [
            { 'check_data.manual_review_required': true },
            { 'quality_result.quality_checks': { $exists: true } }
        ]
    })
    .populate('loan_application_id', 'loan_details applicant_info')
    .populate('credit_decision_id', 'decision_result')
    .sort({ created_at: -1 });
};

qualityCheckSchema.statics.findByComplianceScoreRange = function(minScore, maxScore) {
    return this.find({
        'quality_result.compliance_score': {
            $gte: minScore,
            $lte: maxScore
        }
    })
    .populate('loan_application_id', 'loan_details applicant_info')
    .populate('credit_decision_id', 'decision_result')
    .sort({ 'quality_result.compliance_score': -1 });
};

qualityCheckSchema.statics.findByAccuracyScoreRange = function(minScore, maxScore) {
    return this.find({
        'quality_result.accuracy_score': {
            $gte: minScore,
            $lte: maxScore
        }
    })
    .populate('loan_application_id', 'loan_details applicant_info')
    .populate('credit_decision_id', 'decision_result')
    .sort({ 'quality_result.accuracy_score': -1 });
};

qualityCheckSchema.statics.getQualityCheckStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                total_quality_checks: { $sum: 1 },
                completed_checks: {
                    $sum: {
                        $cond: [{ $eq: ['$status', PHASE_STATUS.COMPLETED] }, 1, 0]
                    }
                },
                failed_checks: {
                    $sum: {
                        $cond: [{ $eq: ['$status', PHASE_STATUS.FAILED] }, 1, 0]
                    }
                },
                passed_checks: {
                    $sum: {
                        $cond: [{ $eq: ['$quality_result.overall_status', 'passed'] }, 1, 0]
                    }
                },
                warning_checks: {
                    $sum: {
                        $cond: [{ $eq: ['$quality_result.overall_status', 'warning'] }, 1, 0]
                    }
                },
                failed_quality_checks: {
                    $sum: {
                        $cond: [{ $eq: ['$quality_result.overall_status', 'failed'] }, 1, 0]
                    }
                },
                avg_compliance_score: { $avg: '$quality_result.compliance_score' },
                avg_accuracy_score: { $avg: '$quality_result.accuracy_score' },
                avg_processing_time: { $avg: '$quality_result.processing_summary.total_processing_time' }
            }
        }
    ]);
};

qualityCheckSchema.statics.getProcessingTimeStats = function() {
    return this.aggregate([
        {
            $match: {
                status: PHASE_STATUS.COMPLETED,
                'quality_result.processing_summary.total_processing_time': { $exists: true }
            }
        },
        {
            $group: {
                _id: null,
                avg_processing_time: { $avg: '$quality_result.processing_summary.total_processing_time' },
                min_processing_time: { $min: '$quality_result.processing_summary.total_processing_time' },
                max_processing_time: { $max: '$quality_result.processing_summary.total_processing_time' },
                total_processed: { $sum: 1 }
            }
        }
    ]);
};

const QualityCheck = mongoose.model('QualityCheck', qualityCheckSchema);

module.exports = QualityCheck;