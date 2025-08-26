const mongoose = require('mongoose');
const { UNDERWRITING_STAGES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

// Sub-schemas
const CollateralDetailsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['property', 'vehicle', 'securities', 'gold'],
        required: false
    },
    estimated_value: {
        type: Number,
        min: 0,
        required: false
    },
    ownership_proof: {
        type: String,
        maxlength: 500,
        required: false
    },
    valuation_certificate: {
        type: String,
        maxlength: 500,
        required: false
    }
}, { _id: false });

const AdditionalIncomeSourceSchema = new mongoose.Schema({
    source_type: {
        type: String,
        enum: ['rental', 'investment', 'freelance', 'business'],
        required: true
    },
    monthly_amount: {
        type: Number,
        min: 0,
        required: true
    },
    proof_document: {
        type: String,
        maxlength: 500,
        required: false
    }
}, { _id: false });

const UnderwritingDataSchema = new mongoose.Schema({
    credit_bureau_preference: {
        type: String,
        enum: ['CIBIL', 'Experian', 'Equifax', 'CRIF'],
        default: 'CIBIL'
    },
    collateral_details: CollateralDetailsSchema,
    additional_income_sources: [AdditionalIncomeSourceSchema],
    risk_mitigation_factors: [{
        type: String,
        enum: [
            'existing_customer',
            'salary_account_holder',
            'insurance_coverage',
            'guarantor_available',
            'stable_employment_history',
            'property_ownership'
        ]
    }]
}, { _id: false });

const CreditAnalysisSchema = new mongoose.Schema({
    cibil_score: {
        type: Number,
        min: 300,
        max: 900,
        required: true
    },
    credit_history_length: {
        type: Number, // in months
        min: 0,
        required: true
    },
    payment_history: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        required: true
    },
    credit_utilization: {
        type: Number, // percentage
        min: 0,
        max: 100,
        required: true
    },
    credit_mix: {
        type: String,
        enum: ['diverse', 'moderate', 'limited'],
        required: true
    },
    recent_inquiries: {
        type: Number,
        min: 0,
        required: true
    },
    analysis_date: {
        type: Date,
        default: Date.now
    },
    bureau_source: {
        type: String,
        enum: ['CIBIL', 'Experian', 'Equifax', 'CRIF'],
        required: true
    }
}, { _id: false });

const DTIAnalysisSchema = new mongoose.Schema({
    monthly_income: {
        type: Number,
        min: 0,
        required: true
    },
    existing_debt_obligations: {
        type: Number,
        min: 0,
        required: true
    },
    proposed_emi: {
        type: Number,
        min: 0,
        required: true
    },
    total_debt_obligations: {
        type: Number,
        min: 0,
        required: true
    },
    debt_to_income_ratio: {
        type: Number, // percentage
        min: 0,
        required: true
    },
    disposable_income: {
        type: Number,
        required: true
    },
    analysis_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const CollateralAssessmentSchema = new mongoose.Schema({
    assessment_required: {
        type: Boolean,
        required: true
    },
    collateral_type: {
        type: String,
        enum: ['property', 'vehicle', 'securities', 'gold'],
        required: function() { return this.assessment_required; }
    },
    estimated_value: {
        type: Number,
        min: 0,
        required: function() { return this.assessment_required; }
    },
    loan_to_value_ratio: {
        type: Number, // percentage
        min: 0,
        max: 200,
        required: function() { return this.assessment_required; }
    },
    valuation_method: {
        type: String,
        enum: ['automated_valuation_model', 'professional_appraisal', 'market_comparison'],
        required: function() { return this.assessment_required; }
    },
    market_conditions: {
        type: String,
        enum: ['stable', 'rising', 'declining', 'volatile'],
        required: function() { return this.assessment_required; }
    },
    liquidity_assessment: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: function() { return this.assessment_required; }
    },
    assessment_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const RiskFactorsSchema = new mongoose.Schema({
    employment_stability: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    income_stability: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    geographic_risk: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    industry_risk: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    loan_purpose_risk: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    behavioral_indicators: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    }
}, { _id: false });

const RiskAssessmentSchema = new mongoose.Schema({
    risk_factors: {
        type: RiskFactorsSchema,
        required: true
    },
    overall_risk_score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    risk_category: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    mitigation_factors: [{
        type: String,
        enum: [
            'existing_customer',
            'salary_account_holder',
            'insurance_coverage',
            'guarantor_available',
            'stable_employment_history',
            'property_ownership'
        ]
    }],
    assessment_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const UnderwritingScoresSchema = new mongoose.Schema({
    credit_score_impact: {
        type: Number,
        default: 0
    },
    dti_impact: {
        type: Number,
        default: 0
    },
    collateral_impact: {
        type: Number,
        default: 0
    },
    risk_impact: {
        type: Number,
        default: 0
    }
}, { _id: false });

const AutomatedDecisionSchema = new mongoose.Schema({
    total_underwriting_score: {
        type: Number,
        required: true
    },
    score_breakdown: {
        type: UnderwritingScoresSchema,
        required: true
    },
    decision_rules_applied: [{
        type: String,
        required: true
    }],
    automated_recommendation: {
        type: String,
        enum: ['approved', 'conditional_approval', 'rejected'],
        required: true
    },
    confidence_level: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    decision_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const UnderwritingResultSchema = new mongoose.Schema({
    decision: {
        type: String,
        enum: ['approved', 'conditional_approval', 'rejected'],
        required: true
    },
    approved_amount: {
        type: Number,
        min: 0,
        required: true
    },
    conditions: [{
        type: String,
        maxlength: 500
    }],
    interest_rate_category: {
        type: String,
        enum: ['prime', 'standard', 'subprime', 'high_risk'],
        required: true
    },
    validity_period: {
        type: Number, // days
        min: 1,
        default: 30
    },
    decision_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const ProcessingLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    stage: {
        type: String,
        enum: Object.values(UNDERWRITING_STAGES)
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    log_type: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info'
    },
    logged_by: {
        type: String,
        enum: ['system', 'user', 'admin'],
        default: 'system'
    }
}, { _id: false });

// Main Underwriting Schema
const UnderwritingSchema = new mongoose.Schema({
    application_processing_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApplicationProcessing',
        required: true,
        index: true
    },
    loan_application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoanApplication',
        required: true,
        index: true
    },
    current_stage: {
        type: String,
        enum: Object.values(UNDERWRITING_STAGES),
        default: UNDERWRITING_STAGES.CREDIT_SCORE_ANALYSIS,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(PHASE_STATUS),
        default: PHASE_STATUS.PENDING,
        required: true,
        index: true
    },
    underwriting_data: {
        type: UnderwritingDataSchema,
        required: true
    },
    credit_analysis: {
        type: CreditAnalysisSchema,
        required: false
    },
    dti_analysis: {
        type: DTIAnalysisSchema,
        required: false
    },
    collateral_assessment: {
        type: CollateralAssessmentSchema,
        required: false
    },
    risk_assessment: {
        type: RiskAssessmentSchema,
        required: false
    },
    underwriting_scores: {
        type: UnderwritingScoresSchema,
        default: () => ({})
    },
    automated_decision: {
        type: AutomatedDecisionSchema,
        required: false
    },
    underwriting_result: {
        type: UnderwritingResultSchema,
        required: false
    },
    processing_logs: {
        type: [ProcessingLogSchema],
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
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'underwritings'
});

// Indexes
UnderwritingSchema.index({ application_processing_id: 1, status: 1 });
UnderwritingSchema.index({ loan_application_id: 1, current_stage: 1 });
UnderwritingSchema.index({ 'underwriting_result.decision': 1, created_at: -1 });
UnderwritingSchema.index({ 'credit_analysis.cibil_score': 1 });
UnderwritingSchema.index({ 'dti_analysis.debt_to_income_ratio': 1 });

// Instance Methods
UnderwritingSchema.methods.addLog = function(message, loggedBy = 'system', logType = 'info') {
    this.processing_logs.push({
        timestamp: new Date(),
        stage: this.current_stage,
        message,
        log_type: logType,
        logged_by: loggedBy
    });
    return this.save();
};

UnderwritingSchema.methods.updateStatus = function(newStatus, message) {
    this.status = newStatus;
    if (message) {
        this.processing_logs.push({
            timestamp: new Date(),
            stage: this.current_stage,
            message,
            log_type: 'info',
            logged_by: 'system'
        });
    }
    return this.save();
};

UnderwritingSchema.methods.getProgressPercentage = function() {
    const stageOrder = [
        UNDERWRITING_STAGES.CREDIT_SCORE_ANALYSIS,
        UNDERWRITING_STAGES.DEBT_TO_INCOME_ANALYSIS,
        UNDERWRITING_STAGES.COLLATERAL_ASSESSMENT,
        UNDERWRITING_STAGES.RISK_ASSESSMENT,
        UNDERWRITING_STAGES.AUTOMATED_DECISION,
        UNDERWRITING_STAGES.DECISION_FINALIZATION
    ];
    
    const currentIndex = stageOrder.indexOf(this.current_stage);
    if (currentIndex === -1) return 0;
    
    if (this.status === PHASE_STATUS.COMPLETED) return 100;
    return Math.round(((currentIndex + 1) / stageOrder.length) * 100);
};

UnderwritingSchema.methods.getUnderwritingSummary = function() {
    return {
        underwriting_id: this._id,
        status: this.status,
        current_stage: this.current_stage,
        progress_percentage: this.getProgressPercentage(),
        decision: this.underwriting_result?.decision,
        approved_amount: this.underwriting_result?.approved_amount,
        credit_score: this.credit_analysis?.cibil_score,
        dti_ratio: this.dti_analysis?.debt_to_income_ratio,
        risk_category: this.risk_assessment?.risk_category,
        total_score: this.automated_decision?.total_underwriting_score,
        created_at: this.created_at,
        updated_at: this.updated_at
    };
};

// Static Methods
UnderwritingSchema.statics.findByApplicationProcessingId = function(applicationProcessingId) {
    return this.findOne({ application_processing_id: applicationProcessingId })
        .populate('loan_application_id', 'loan_details applicant_info')
        .populate('application_processing_id', 'processing_result');
};

UnderwritingSchema.statics.findByLoanApplicationId = function(loanApplicationId) {
    return this.findOne({ loan_application_id: loanApplicationId })
        .populate('application_processing_id', 'processing_result');
};

UnderwritingSchema.statics.findByStatus = function(status) {
    return this.find({ status })
        .populate('loan_application_id', 'loan_details applicant_info')
        .sort({ created_at: -1 });
};

UnderwritingSchema.statics.findByDecision = function(decision) {
    return this.find({ 'underwriting_result.decision': decision })
        .populate('loan_application_id', 'loan_details applicant_info')
        .sort({ created_at: -1 });
};

UnderwritingSchema.statics.findByCreditScoreRange = function(minScore, maxScore) {
    return this.find({
        'credit_analysis.cibil_score': {
            $gte: minScore,
            $lte: maxScore
        }
    }).populate('loan_application_id', 'loan_details applicant_info');
};

UnderwritingSchema.statics.findByDTIRange = function(minDTI, maxDTI) {
    return this.find({
        'dti_analysis.debt_to_income_ratio': {
            $gte: minDTI,
            $lte: maxDTI
        }
    }).populate('loan_application_id', 'loan_details applicant_info');
};

UnderwritingSchema.statics.getUnderwritingStatistics = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$underwriting_result.decision',
                count: { $sum: 1 },
                avg_credit_score: { $avg: '$credit_analysis.cibil_score' },
                avg_dti_ratio: { $avg: '$dti_analysis.debt_to_income_ratio' },
                avg_total_score: { $avg: '$automated_decision.total_underwriting_score' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

UnderwritingSchema.statics.getProcessingTimeStats = function() {
    return this.aggregate([
        {
            $match: {
                status: PHASE_STATUS.COMPLETED,
                created_at: { $exists: true },
                updated_at: { $exists: true }
            }
        },
        {
            $project: {
                processing_time: {
                    $divide: [
                        { $subtract: ['$updated_at', '$created_at'] },
                        1000 * 60 // Convert to minutes
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                avg_processing_time: { $avg: '$processing_time' },
                min_processing_time: { $min: '$processing_time' },
                max_processing_time: { $max: '$processing_time' },
                total_processed: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Underwriting', UnderwritingSchema);