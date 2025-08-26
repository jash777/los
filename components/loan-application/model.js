/**
 * Loan Application Phase Model
 * Mongoose schema for storing detailed loan application data
 */

const mongoose = require('mongoose');
const { LOAN_ORIGINATION_PHASES, PHASE_STATUS } = require('../../middleware/constants/loan-origination-phases');

// Asset sub-schema
const AssetSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['property', 'vehicle', 'investment', 'other']
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Liability sub-schema
const LiabilitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['loan', 'credit_card', 'other']
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    monthly_payment: {
        type: Number,
        min: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Document sub-schema
const DocumentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['income_proof', 'bank_statements', 'address_proof', 'identity_proof', 'other']
    },
    filename: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: Number,
        min: 0
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    },
    verification_notes: {
        type: String,
        trim: true
    }
}, { _id: false });

// Financial details sub-schema
const FinancialDetailsSchema = new mongoose.Schema({
    monthly_income: {
        type: Number,
        required: true,
        min: 0
    },
    monthly_expenses: {
        type: Number,
        required: true,
        min: 0
    },
    existing_emis: {
        type: Number,
        required: true,
        min: 0
    },
    bank_balance: {
        type: Number,
        required: true
    },
    assets: [AssetSchema],
    liabilities: [LiabilitySchema],
    // Calculated fields
    disposable_income: {
        type: Number,
        min: 0
    },
    debt_to_income_ratio: {
        type: Number,
        min: 0,
        max: 1
    },
    net_worth: {
        type: Number
    },
    total_assets_value: {
        type: Number,
        min: 0
    },
    total_liabilities_amount: {
        type: Number,
        min: 0
    }
}, { _id: false });

// Loan details sub-schema
const LoanDetailsSchema = new mongoose.Schema({
    loan_type: {
        type: String,
        required: true,
        enum: ['personal', 'home', 'car', 'business', 'education']
    },
    requested_amount: {
        type: Number,
        required: true,
        min: 50000,
        max: 10000000
    },
    tenure: {
        type: Number,
        required: true,
        min: 6,
        max: 84
    },
    loan_purpose: {
        type: String,
        required: true,
        trim: true,
        minlength: 10
    },
    interest_rate_preference: {
        type: String,
        enum: ['fixed', 'floating'],
        default: 'fixed'
    },
    // Calculated/suggested fields
    eligible_amount: {
        type: Number,
        min: 0
    },
    suggested_tenure: {
        type: Number,
        min: 6,
        max: 84
    },
    indicative_interest_rate: {
        type: Number,
        min: 0,
        max: 50
    },
    monthly_emi: {
        type: Number,
        min: 0
    }
}, { _id: false });

// Employment details sub-schema
const EmploymentDetailsSchema = new mongoose.Schema({
    employment_type: {
        type: String,
        required: true,
        enum: ['salaried', 'self-employed']
    },
    company_name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    designation: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    work_experience: {
        type: Number,
        required: true,
        min: 0,
        max: 50
    },
    current_job_experience: {
        type: Number,
        required: true,
        min: 0
    },
    industry_type: {
        type: String,
        trim: true
    },
    company_address: {
        type: String,
        trim: true
    },
    // Stability assessment
    employment_stability_score: {
        type: Number,
        min: 0,
        max: 100
    }
}, { _id: false });

// Risk assessment sub-schema
const RiskAssessmentSchema = new mongoose.Schema({
    overall_risk_score: {
        type: Number,
        min: 0,
        max: 1000
    },
    risk_category: {
        type: String,
        enum: ['low', 'medium', 'high', 'very_high']
    },
    financial_stability_score: {
        type: Number,
        min: 0,
        max: 100
    },
    loan_to_income_ratio: {
        type: Number,
        min: 0
    },
    asset_coverage_ratio: {
        type: Number,
        min: 0
    },
    risk_factors: [{
        factor: String,
        impact: {
            type: String,
            enum: ['positive', 'negative', 'neutral']
        },
        weight: Number,
        description: String
    }],
    calculated_at: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Processing log sub-schema
const ProcessingLogSchema = new mongoose.Schema({
    stage: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['started', 'completed', 'failed', 'skipped']
    },
    message: {
        type: String,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    processing_time_ms: {
        type: Number,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Main Loan Application schema
const LoanApplicationSchema = new mongoose.Schema({
    application_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    pre_qualification_id: {
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
        required: true,
        default: LOAN_ORIGINATION_PHASES.LOAN_APPLICATION,
        enum: Object.values(LOAN_ORIGINATION_PHASES)
    },
    status: {
        type: String,
        required: true,
        default: PHASE_STATUS.PENDING,
        enum: Object.values(PHASE_STATUS)
    },
    
    // Main application data
    loan_details: {
        type: LoanDetailsSchema,
        required: true
    },
    financial_details: {
        type: FinancialDetailsSchema,
        required: true
    },
    employment_details: {
        type: EmploymentDetailsSchema,
        required: true
    },
    documents: {
        type: [DocumentSchema],
        required: true,
        validate: {
            validator: function(docs) {
                return docs && docs.length > 0;
            },
            message: 'At least one document is required'
        }
    },
    
    // Assessment results
    risk_assessment: RiskAssessmentSchema,
    
    // Application outcome
    application_result: {
        approved: {
            type: Boolean,
            default: false
        },
        rejection_reason: {
            type: String,
            trim: true
        },
        approval_conditions: [{
            condition: String,
            description: String,
            mandatory: Boolean
        }],
        next_phase: {
            type: String,
            enum: Object.values(LOAN_ORIGINATION_PHASES)
        }
    },
    
    // Processing metadata
    processing_logs: [ProcessingLogSchema],
    processing_started_at: {
        type: Date
    },
    processing_completed_at: {
        type: Date
    },
    total_processing_time_ms: {
        type: Number,
        min: 0
    },
    
    // Timestamps
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
    collection: 'loan_applications'
});

// Indexes for better query performance
LoanApplicationSchema.index({ pre_qualification_id: 1, status: 1 });
LoanApplicationSchema.index({ 'loan_details.loan_type': 1, status: 1 });
LoanApplicationSchema.index({ 'risk_assessment.risk_category': 1 });
LoanApplicationSchema.index({ created_at: -1 });

// Instance methods
LoanApplicationSchema.methods.addProcessingLog = function(stage, status, message, data, processingTime) {
    this.processing_logs.push({
        stage,
        status,
        message,
        data,
        processing_time_ms: processingTime,
        timestamp: new Date()
    });
    return this.save();
};

LoanApplicationSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.status = newStatus;
    this.updated_at = new Date();
    
    if (additionalData) {
        Object.assign(this, additionalData);
    }
    
    return this.save();
};

LoanApplicationSchema.methods.calculateFinancialRatios = function() {
    const financial = this.financial_details;
    
    // Calculate disposable income
    financial.disposable_income = financial.monthly_income - financial.monthly_expenses - financial.existing_emis;
    
    // Calculate debt-to-income ratio
    financial.debt_to_income_ratio = (financial.existing_emis + (this.loan_details.monthly_emi || 0)) / financial.monthly_income;
    
    // Calculate total assets and liabilities
    financial.total_assets_value = financial.assets.reduce((sum, asset) => sum + asset.value, 0);
    financial.total_liabilities_amount = financial.liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    
    // Calculate net worth
    financial.net_worth = financial.total_assets_value - financial.total_liabilities_amount + financial.bank_balance;
    
    return this.save();
};

// Static methods
LoanApplicationSchema.statics.findByPreQualificationId = function(preQualificationId) {
    return this.findOne({ pre_qualification_id: preQualificationId });
};

LoanApplicationSchema.statics.findByStatus = function(status) {
    return this.find({ status });
};

LoanApplicationSchema.statics.findByRiskCategory = function(riskCategory) {
    return this.find({ 'risk_assessment.risk_category': riskCategory });
};

LoanApplicationSchema.statics.getApplicationStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: { $avg: '$total_processing_time_ms' }
            }
        }
    ]);
};

// Pre-save middleware
LoanApplicationSchema.pre('save', function(next) {
    if (this.isModified('financial_details') || this.isModified('loan_details')) {
        this.calculateFinancialRatios();
    }
    next();
});

const LoanApplication = mongoose.model('LoanApplication', LoanApplicationSchema);

module.exports = LoanApplication;