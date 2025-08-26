/**
 * Pre-Qualification Phase Model
 * Defines data structure and validation for pre-qualification phase
 */

const mongoose = require('mongoose');
const { LOAN_ORIGINATION_PHASES, PHASE_STATUS, PRE_QUALIFICATION_STAGES } = require('../../middleware/constants/loan-origination-phases');

// Address Schema
const addressSchema = new mongoose.Schema({
    address_line_1: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    address_line_2: {
        type: String,
        trim: true,
        maxlength: 100
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    pincode: {
        type: String,
        required: true,
        match: /^\d{6}$/
    },
    country: {
        type: String,
        default: 'India',
        trim: true
    }
}, { _id: false });

// Personal Information Schema
const personalInfoSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    date_of_birth: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                return age >= 18 && age <= 70;
            },
            message: 'Age must be between 18-70 years'
        }
    },
    mobile: {
        type: String,
        required: true,
        match: /^[6-9]\d{9}$/,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    pan_number: {
        type: String,
        required: true,
        uppercase: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        unique: true
    },
    aadhar_number: {
        type: String,
        required: true,
        match: /^\d{12}$/
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: false
    },
    marital_status: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed'],
        required: false
    }
}, { _id: false });

// Employment Details Schema
const employmentDetailsSchema = new mongoose.Schema({
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
        trim: true,
        maxlength: 50
    },
    monthly_income: {
        type: Number,
        required: true,
        min: 10000,
        max: 10000000
    },
    work_experience: {
        type: Number,
        required: true,
        min: 0,
        max: 50
    },
    company_address: {
        type: String,
        trim: true,
        maxlength: 200
    },
    industry_type: {
        type: String,
        trim: true,
        maxlength: 50
    }
}, { _id: false });

// Loan Request Schema
const loanRequestSchema = new mongoose.Schema({
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
    loan_purpose: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 200
    },
    preferred_tenure: {
        type: Number,
        min: 6,
        max: 84
    }
}, { _id: false });

// Verification Results Schema
const verificationResultsSchema = new mongoose.Schema({
    preliminary_assessment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        completed_at: Date
    },
    identity_verification: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        pan_verified: {
            type: Boolean,
            default: false
        },
        aadhar_verified: {
            type: Boolean,
            default: false
        },
        mobile_verified: {
            type: Boolean,
            default: false
        },
        email_verified: {
            type: Boolean,
            default: false
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        completed_at: Date
    },
    cibil_check: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        cibil_score: {
            type: Number,
            min: 300,
            max: 900
        },
        credit_history: {
            type: mongoose.Schema.Types.Mixed
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        completed_at: Date
    },
    employment_verification: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        employment_verified: {
            type: Boolean,
            default: false
        },
        income_verified: {
            type: Boolean,
            default: false
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        completed_at: Date
    },
    eligibility_assessment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        eligible: {
            type: Boolean,
            default: false
        },
        eligible_amount: {
            type: Number,
            min: 0
        },
        risk_category: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        completed_at: Date
    }
}, { _id: false });

// Pre-Qualification Application Schema
const preQualificationSchema = new mongoose.Schema({
    application_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    request_id: {
        type: String,
        required: true,
        index: true
    },
    phase: {
        type: String,
        default: LOAN_ORIGINATION_PHASES.PRE_QUALIFICATION,
        enum: Object.values(LOAN_ORIGINATION_PHASES)
    },
    phase_status: {
        type: String,
        default: PHASE_STATUS.PENDING,
        enum: Object.values(PHASE_STATUS)
    },
   current_stage: {
        type: String,
        required: true,
        default: PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT,
        enum: Object.values(PRE_QUALIFICATION_STAGES)
    },
    personal_info: {
        type: personalInfoSchema,
        required: true
    },
    address_info: {
        current_address: {
            type: addressSchema,
            required: true
        },
        permanent_address: {
            type: addressSchema,
            required: false
        },
        same_as_current: {
            type: Boolean,
            default: false
        }
    },
    employment_details: {
        type: employmentDetailsSchema,
        required: true
    },
    loan_request: {
        type: loanRequestSchema,
        required: true
    },
    verification_results: {
        type: verificationResultsSchema,
        default: {}
    },
    overall_result: {
        approved: {
            type: Boolean,
            default: false
        },
        rejection_reason: {
            type: String,
            trim: true
        },
        recommendations: [{
            type: String,
            trim: true
        }],
        next_steps: {
            type: String,
            trim: true
        }
    },
    processing_logs: [{
        stage: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        }
    }],
    metadata: {
        ip_address: String,
        user_agent: String,
        source: String,
        utm_params: {
            type: mongoose.Schema.Types.Mixed
        }
    }
}, {
    timestamps: true,
    collection: 'pre_qualification_applications'
});

// Indexes for better query performance
preQualificationSchema.index({ 'personal_info.mobile': 1 });
preQualificationSchema.index({ 'personal_info.pan_number': 1 });
preQualificationSchema.index({ 'personal_info.email': 1 });
preQualificationSchema.index({ phase_status: 1, current_stage: 1 });
preQualificationSchema.index({ createdAt: -1 });
preQualificationSchema.index({ 'overall_result.approved': 1 });

// Virtual for full name
preQualificationSchema.virtual('personal_info.full_name').get(function() {
    return `${this.personal_info.first_name} ${this.personal_info.last_name}`;
});

// Virtual for age calculation
preQualificationSchema.virtual('personal_info.age').get(function() {
    if (!this.personal_info.date_of_birth) return null;
    return Math.floor((Date.now() - this.personal_info.date_of_birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Pre-save middleware
preQualificationSchema.pre('save', function(next) {
    // Generate application ID if not exists
    if (!this.application_id) {
        this.application_id = `PQ${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    
    // Set permanent address same as current if specified
    if (this.address_info.same_as_current && !this.address_info.permanent_address) {
        this.address_info.permanent_address = this.address_info.current_address;
    }
    
    next();
});

// Instance methods
preQualificationSchema.methods.addProcessingLog = function(stage, status, message, details = null) {
    this.processing_logs.push({
        stage,
        status,
        message,
        details,
        timestamp: new Date()
    });
};

preQualificationSchema.methods.updateStageStatus = function(stage, status, details = null) {
    if (this.verification_results[stage]) {
        this.verification_results[stage].status = status;
        if (details) {
            this.verification_results[stage].details = details;
        }
        if (status === 'completed') {
            this.verification_results[stage].completed_at = new Date();
        }
    }
};

preQualificationSchema.methods.isStageCompleted = function(stage) {
    return this.verification_results[stage] && this.verification_results[stage].status === 'completed';
};

preQualificationSchema.methods.getAllCompletedStages = function() {
    const completedStages = [];
    Object.keys(this.verification_results).forEach(stage => {
        if (this.isStageCompleted(stage)) {
            completedStages.push(stage);
        }
    });
    return completedStages;
};

// Static methods
preQualificationSchema.statics.findByApplicationId = function(applicationId) {
    return this.findOne({ application_id: applicationId });
};

preQualificationSchema.statics.findByMobile = function(mobile) {
    return this.findOne({ 'personal_info.mobile': mobile });
};

preQualificationSchema.statics.findByPAN = function(panNumber) {
    return this.findOne({ 'personal_info.pan_number': panNumber.toUpperCase() });
};

preQualificationSchema.statics.getApprovedApplications = function(limit = 10) {
    return this.find({ 'overall_result.approved': true })
        .sort({ createdAt: -1 })
        .limit(limit);
};

preQualificationSchema.statics.getRejectedApplications = function(limit = 10) {
    return this.find({ 'overall_result.approved': false, phase_status: PHASE_STATUS.COMPLETED })
        .sort({ createdAt: -1 })
        .limit(limit);
};

const PreQualificationApplication = mongoose.model('PreQualificationApplication', preQualificationSchema);

module.exports = PreQualificationApplication;