const mongoose = require('mongoose');
const { PHASE_STATUS, FUNDING_STATUS } = require('../../middleware/constants/loan-origination-phases');

// Sub-schema for funding data
const fundingDataSchema = new mongoose.Schema({
    disbursement_method: {
        type: String,
        enum: ['bank_transfer', 'rtgs', 'neft'],
        default: 'bank_transfer'
    },
    disbursement_priority: {
        type: String,
        enum: ['standard', 'high', 'urgent'],
        default: 'standard'
    },
    special_instructions: {
        type: String,
        maxlength: 500,
        default: ''
    },
    beneficiary_verification_required: {
        type: Boolean,
        default: false
    },
    third_party_disbursement: {
        type: Boolean,
        default: false
    },
    disbursement_schedule: {
        type: String,
        enum: ['immediate', 'next_business_day', 'scheduled'],
        default: 'immediate'
    },
    scheduled_date: {
        type: Date
    },
    disbursement_amount_override: {
        type: Number,
        min: 0
    },
    processing_fee_waiver: {
        type: Boolean,
        default: false
    },
    insurance_opt_out: {
        type: Boolean,
        default: false
    },
    custom_account_details: {
        account_number: String,
        ifsc_code: String,
        account_holder_name: String,
        bank_name: String,
        branch_name: String
    },
    notification_preferences: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    }
}, { _id: false });

// Sub-schema for pre-disbursement checks
const preDisbursementChecksSchema = new mongoose.Schema({
    all_checks_passed: {
        type: Boolean,
        required: true
    },
    critical_failures: {
        type: Number,
        default: 0
    },
    checks: {
        credit_decision_validity: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        },
        loan_conditions_met: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        },
        regulatory_compliance: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        },
        fraud_check: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        },
        duplicate_check: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        },
        sanctions_screening: {
            status: { type: String, enum: ['passed', 'failed', 'warning'] },
            critical: Boolean,
            details: mongoose.Schema.Types.Mixed
        }
    },
    summary: {
        total_checks: Number,
        passed_checks: Number,
        failed_checks: Number,
        warning_checks: Number
    }
}, { _id: false });

// Sub-schema for loan account
const loanAccountSchema = new mongoose.Schema({
    loan_account_number: {
        type: String,
        required: true,
        unique: true
    },
    loan_type: {
        type: String,
        required: true
    },
    principal_amount: {
        type: Number,
        required: true,
        min: 0
    },
    interest_rate: {
        type: Number,
        required: true,
        min: 0
    },
    tenure_months: {
        type: Number,
        required: true,
        min: 1
    },
    monthly_emi: {
        type: Number,
        required: true,
        min: 0
    },
    account_opening_date: {
        type: Date,
        required: true
    },
    first_emi_date: {
        type: Date,
        required: true
    },
    maturity_date: {
        type: Date,
        required: true
    },
    account_status: {
        type: String,
        enum: ['active', 'inactive', 'closed', 'suspended'],
        default: 'active'
    },
    repayment_frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
        default: 'monthly'
    },
    compounding_frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
        default: 'monthly'
    }
}, { _id: false });

// Sub-schema for disbursement details
const disbursementDetailsSchema = new mongoose.Schema({
    approved_loan_amount: {
        type: Number,
        required: true,
        min: 0
    },
    processing_fee: {
        type: Number,
        required: true,
        min: 0
    },
    gst_on_processing_fee: {
        type: Number,
        required: true,
        min: 0
    },
    insurance_premium: {
        type: Number,
        default: 0,
        min: 0
    },
    other_charges: {
        type: Number,
        default: 0,
        min: 0
    },
    total_deductions: {
        type: Number,
        required: true,
        min: 0
    },
    net_disbursement_amount: {
        type: Number,
        required: true,
        min: 0
    },
    disbursement_breakdown: {
        principal_disbursement: Number,
        fee_deductions: Number
    },
    disbursement_reference: String,
    disbursement_date: Date,
    expected_credit_date: Date,
    actual_disbursement_amount: Number
}, { _id: false });

// Sub-schema for beneficiary validation
const beneficiaryValidationSchema = new mongoose.Schema({
    is_valid: {
        type: Boolean,
        required: true
    },
    validation_status: {
        type: String,
        enum: ['passed', 'failed', 'warning'],
        required: true
    },
    validation_errors: [String],
    beneficiary_details: {
        account_number: String,
        ifsc_code: String,
        account_holder_name: String,
        bank_name: String,
        branch_name: String
    },
    name_match_score: {
        type: Number,
        min: 0,
        max: 1
    },
    name_match_status: {
        type: String,
        enum: ['matched', 'partial_match', 'no_match']
    },
    validation_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Sub-schema for disbursement result
const disbursementResultSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        required: true
    },
    reference_number: String,
    disbursement_date: Date,
    expected_credit_date: Date,
    amount: {
        type: Number,
        min: 0
    },
    disbursement_method: {
        type: String,
        enum: ['bank_transfer', 'rtgs', 'neft']
    },
    beneficiary_account: String,
    beneficiary_ifsc: String,
    transaction_id: String,
    processing_bank: String,
    processing_status: {
        type: String,
        enum: ['initiated', 'processing', 'completed', 'failed']
    },
    failure_reason: String
}, { _id: false });

// Sub-schema for loan documentation
const loanDocumentationSchema = new mongoose.Schema({
    loan_agreement: {
        document_id: String,
        generated_date: Date,
        document_type: String,
        status: { type: String, enum: ['generated', 'sent', 'acknowledged'] }
    },
    disbursement_letter: {
        document_id: String,
        generated_date: Date,
        document_type: String,
        status: { type: String, enum: ['generated', 'sent', 'acknowledged'] }
    },
    repayment_schedule: {
        document_id: String,
        generated_date: Date,
        document_type: String,
        status: { type: String, enum: ['generated', 'sent', 'acknowledged'] }
    },
    welcome_kit: {
        document_id: String,
        generated_date: Date,
        document_type: String,
        status: { type: String, enum: ['generated', 'sent', 'acknowledged'] }
    }
}, { _id: false });

// Sub-schema for loan servicing
const loanServicingSchema = new mongoose.Schema({
    servicing_setup_date: {
        type: Date,
        required: true
    },
    loan_account_number: {
        type: String,
        required: true
    },
    repayment_method: {
        type: String,
        enum: ['auto_debit', 'manual', 'standing_instruction'],
        default: 'auto_debit'
    },
    emi_collection_date: {
        type: Number,
        min: 1,
        max: 31,
        default: 5
    },
    customer_portal_access: {
        username: String,
        temporary_password: String,
        portal_url: String
    },
    customer_service: {
        relationship_manager: String,
        contact_number: String,
        email: String
    },
    automated_services: {
        emi_reminders: { type: Boolean, default: true },
        payment_confirmations: { type: Boolean, default: true },
        statement_generation: { type: Boolean, default: true },
        overdue_notifications: { type: Boolean, default: true }
    }
}, { _id: false });

// Sub-schema for notifications
const notificationsSchema = new mongoose.Schema({
    sms_notification: {
        sent: Boolean,
        sent_date: Date,
        mobile: String,
        message: String,
        delivery_status: { type: String, enum: ['sent', 'delivered', 'failed'] }
    },
    email_notification: {
        sent: Boolean,
        sent_date: Date,
        email: String,
        subject: String,
        template: String,
        delivery_status: { type: String, enum: ['sent', 'delivered', 'failed'] }
    },
    push_notification: {
        sent: Boolean,
        sent_date: Date,
        title: String,
        message: String,
        delivery_status: { type: String, enum: ['sent', 'delivered', 'failed'] }
    }
}, { _id: false });

// Sub-schema for processing summary
const processingSummarySchema = new mongoose.Schema({
    total_processing_time: {
        type: Number, // in minutes
        min: 0
    },
    completed_successfully: {
        type: Boolean,
        default: false
    },
    failed_at_stage: String,
    disbursement_method: String,
    processing_stages: [String]
}, { _id: false });

// Sub-schema for funding result
const fundingResultSchema = new mongoose.Schema({
    funding_status: {
        type: String,
        enum: Object.values(FUNDING_STATUS),
        required: true
    },
    failure_reason: String,
    pre_disbursement_checks: preDisbursementChecksSchema,
    loan_account: loanAccountSchema,
    disbursement_details: disbursementDetailsSchema,
    beneficiary_validation: beneficiaryValidationSchema,
    disbursement_result: disbursementResultSchema,
    loan_documentation: loanDocumentationSchema,
    loan_servicing: loanServicingSchema,
    notifications: notificationsSchema,
    processing_summary: processingSummarySchema,
    funding_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Sub-schema for processing logs
const processingLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    message: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        default: 'info'
    },
    source: {
        type: String,
        default: 'system'
    },
    details: mongoose.Schema.Types.Mixed
}, { _id: false });

// Main Loan Funding Schema
const loanFundingSchema = new mongoose.Schema({
    quality_check_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QualityCheck',
        required: true,
        index: true
    },
    loan_application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoanApplication',
        required: true,
        index: true
    },
    credit_decision_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditDecision',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(PHASE_STATUS),
        default: PHASE_STATUS.PENDING,
        index: true
    },
    funding_data: {
        type: fundingDataSchema,
        required: true
    },
    funding_result: fundingResultSchema,
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
    collection: 'loan_fundings'
});

// Indexes for better query performance
loanFundingSchema.index({ quality_check_id: 1, status: 1 });
loanFundingSchema.index({ loan_application_id: 1, status: 1 });
loanFundingSchema.index({ credit_decision_id: 1, status: 1 });
loanFundingSchema.index({ 'funding_result.funding_status': 1 });
loanFundingSchema.index({ 'funding_result.loan_account.loan_account_number': 1 });
loanFundingSchema.index({ 'funding_result.disbursement_details.disbursement_reference': 1 });
loanFundingSchema.index({ created_at: -1 });
loanFundingSchema.index({ updated_at: -1 });

// Instance Methods
loanFundingSchema.methods.addLog = function(message, source = 'system', level = 'info', details = null) {
    this.processing_logs.push({
        message,
        source,
        level,
        details,
        timestamp: new Date()
    });
    return this.save();
};

loanFundingSchema.methods.updateStatus = function(newStatus, logMessage = null) {
    this.status = newStatus;
    if (logMessage) {
        this.processing_logs.push({
            message: logMessage,
            source: 'system',
            level: 'info',
            timestamp: new Date()
        });
    }
    return this.save();
};

loanFundingSchema.methods.getFundingSummary = function() {
    return {
        loan_funding_id: this._id,
        status: this.status,
        funding_status: this.funding_result?.funding_status,
        disbursement_amount: this.funding_result?.disbursement_details?.net_disbursement_amount,
        loan_account_number: this.funding_result?.loan_account?.loan_account_number,
        disbursement_reference: this.funding_result?.disbursement_details?.disbursement_reference,
        funding_date: this.funding_result?.funding_date,
        processing_time: this.funding_result?.processing_summary?.total_processing_time,
        created_at: this.created_at,
        updated_at: this.updated_at
    };
};

loanFundingSchema.methods.getDisbursementDetails = function() {
    if (!this.funding_result || !this.funding_result.disbursement_details) {
        return null;
    }
    
    return {
        approved_amount: this.funding_result.disbursement_details.approved_loan_amount,
        net_disbursement: this.funding_result.disbursement_details.net_disbursement_amount,
        total_deductions: this.funding_result.disbursement_details.total_deductions,
        disbursement_reference: this.funding_result.disbursement_details.disbursement_reference,
        disbursement_date: this.funding_result.disbursement_details.disbursement_date,
        expected_credit_date: this.funding_result.disbursement_details.expected_credit_date,
        disbursement_method: this.funding_result.disbursement_result?.disbursement_method
    };
};

loanFundingSchema.methods.getLoanAccountDetails = function() {
    if (!this.funding_result || !this.funding_result.loan_account) {
        return null;
    }
    
    return {
        loan_account_number: this.funding_result.loan_account.loan_account_number,
        principal_amount: this.funding_result.loan_account.principal_amount,
        interest_rate: this.funding_result.loan_account.interest_rate,
        tenure_months: this.funding_result.loan_account.tenure_months,
        monthly_emi: this.funding_result.loan_account.monthly_emi,
        first_emi_date: this.funding_result.loan_account.first_emi_date,
        maturity_date: this.funding_result.loan_account.maturity_date,
        account_status: this.funding_result.loan_account.account_status
    };
};

loanFundingSchema.methods.getProcessingTimeline = function() {
    const logs = this.processing_logs.sort((a, b) => a.timestamp - b.timestamp);
    const timeline = logs.map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        source: log.source,
        level: log.level
    }));
    
    return {
        total_logs: logs.length,
        timeline: timeline,
        processing_duration: this.funding_result?.processing_summary?.total_processing_time,
        started_at: this.created_at,
        completed_at: this.status === PHASE_STATUS.COMPLETED ? this.updated_at : null
    };
};

// Static Methods
loanFundingSchema.statics.findByQualityCheckId = function(qualityCheckId) {
    return this.find({ quality_check_id: qualityCheckId })
        .populate('loan_application_id')
        .populate('credit_decision_id')
        .populate('quality_check_id')
        .sort({ created_at: -1 });
};

loanFundingSchema.statics.findByLoanApplicationId = function(loanApplicationId) {
    return this.find({ loan_application_id: loanApplicationId })
        .populate('credit_decision_id')
        .populate('quality_check_id')
        .sort({ created_at: -1 });
};

loanFundingSchema.statics.findByStatus = function(status) {
    return this.find({ status: status })
        .populate('loan_application_id', 'applicant_info loan_details')
        .sort({ created_at: -1 });
};

loanFundingSchema.statics.findByFundingStatus = function(fundingStatus) {
    return this.find({ 'funding_result.funding_status': fundingStatus })
        .populate('loan_application_id', 'applicant_info loan_details')
        .sort({ created_at: -1 });
};

loanFundingSchema.statics.findByLoanAccountNumber = function(loanAccountNumber) {
    return this.findOne({ 'funding_result.loan_account.loan_account_number': loanAccountNumber })
        .populate('loan_application_id')
        .populate('credit_decision_id')
        .populate('quality_check_id');
};

loanFundingSchema.statics.findByDisbursementReference = function(disbursementReference) {
    return this.findOne({ 'funding_result.disbursement_details.disbursement_reference': disbursementReference })
        .populate('loan_application_id')
        .populate('credit_decision_id')
        .populate('quality_check_id');
};

loanFundingSchema.statics.findByDisbursementMethod = function(disbursementMethod) {
    return this.find({ 'funding_data.disbursement_method': disbursementMethod })
        .populate('loan_application_id', 'applicant_info loan_details')
        .sort({ created_at: -1 });
};

loanFundingSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        created_at: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    })
    .populate('loan_application_id', 'applicant_info loan_details')
    .sort({ created_at: -1 });
};

loanFundingSchema.statics.findPendingFundings = function() {
    return this.find({ 
        status: { $in: [PHASE_STATUS.PENDING, PHASE_STATUS.IN_PROGRESS] }
    })
    .populate('loan_application_id', 'applicant_info loan_details')
    .sort({ created_at: 1 }); // Oldest first for processing queue
};

loanFundingSchema.statics.findFailedFundings = function() {
    return this.find({ 
        $or: [
            { status: PHASE_STATUS.FAILED },
            { 'funding_result.funding_status': FUNDING_STATUS.FAILED }
        ]
    })
    .populate('loan_application_id', 'applicant_info loan_details')
    .sort({ created_at: -1 });
};

loanFundingSchema.statics.getFundingStatistics = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total_amount: { 
                    $sum: '$funding_result.disbursement_details.net_disbursement_amount' 
                },
                avg_processing_time: { 
                    $avg: '$funding_result.processing_summary.total_processing_time' 
                }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

loanFundingSchema.statics.getDisbursementMethodStatistics = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$funding_data.disbursement_method',
                count: { $sum: 1 },
                total_amount: { 
                    $sum: '$funding_result.disbursement_details.net_disbursement_amount' 
                },
                avg_processing_time: { 
                    $avg: '$funding_result.processing_summary.total_processing_time' 
                }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

loanFundingSchema.statics.getProcessingTimeStatistics = function() {
    return this.aggregate([
        {
            $match: {
                'funding_result.processing_summary.total_processing_time': { $exists: true }
            }
        },
        {
            $group: {
                _id: null,
                avg_processing_time: { 
                    $avg: '$funding_result.processing_summary.total_processing_time' 
                },
                min_processing_time: { 
                    $min: '$funding_result.processing_summary.total_processing_time' 
                },
                max_processing_time: { 
                    $max: '$funding_result.processing_summary.total_processing_time' 
                },
                total_fundings: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('LoanFunding', loanFundingSchema);