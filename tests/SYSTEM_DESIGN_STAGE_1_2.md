# Loan Origination System - Stage 1 & 2 System Design
## Comprehensive Architecture & Flow Design

### Executive Summary
This document provides a complete system design for the first two stages of the Loan Origination System (LOS), addressing current issues and establishing a robust, efficient architecture for loan processing.

---

## Current Issues Analysis

### Critical Issues Identified:
1. **Data Flow Disruption**: User input not properly saved to application JSON
2. **CIBIL Integration**: CIBIL data available but not properly utilized in decision making
3. **Stage Transition Logic**: Inconsistent stage progression validation
4. **Data Persistence**: Application data not properly updated between stages
5. **Decision Logic**: Conditional approvals not properly handled

---

## System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   API Gateway   │───▶│  Core Services  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │ External APIs   │
                       │   (MySQL)       │    │ (CIBIL, PAN)    │
                       └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture
```
Stage 1: Pre-Qualification
User Input → Validation → External Verification → Decision → Database Save → Template Update

Stage 2: Loan Application  
User Input → Validation → Document Verification → Scoring → Decision → Database Update → Template Update
```

---

## Stage 1: Pre-Qualification Design

### Purpose & Objectives
- **Primary Goal**: Quick eligibility assessment with minimal friction
- **Processing Time**: 2-3 minutes
- **Success Criteria**: 95%+ completion rate
- **Data Collection**: Only essential fields (8 fields)

### User Input Requirements
```json
{
  "personal_info": {
    "first_name": "string (required)",
    "last_name": "string (required)", 
    "date_of_birth": "YYYY-MM-DD (required)",
    "mobile": "10 digits (required)",
    "email": "valid email (required)",
    "pan_number": "10 chars (required)"
  },
  "loan_request": {
    "loan_amount": "number (required)",
    "loan_purpose": "string (required)",
    "preferred_tenure_months": "number (required)"
  }
}
```

### System Processing Flow

#### 1. Data Validation Layer
```javascript
// Validation Rules
const validationRules = {
  age: { min: 21, max: 65 },
  mobile: { pattern: /^[6-9]\d{9}$/ },
  pan: { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  loan_amount: { min: 50000, max: 5000000 }
};
```

#### 2. External Service Integration
```javascript
// Service Integration Flow
const externalServices = {
  pan_verification: "Third-party PAN validation",
  cibil_score: "CIBIL credit score retrieval",
  fraud_detection: "Fraud risk assessment"
};
```

#### 3. Decision Engine
```javascript
// Decision Matrix
const decisionCriteria = {
  approved: {
    age: "21-65 years",
    cibil_score: "≥ 650",
    pan_verification: "successful",
    fraud_risk: "low/medium"
  },
  rejected: {
    age: "< 21 or > 65",
    cibil_score: "< 650", 
    pan_verification: "failed",
    fraud_risk: "high/critical"
  },
  conditional: {
    cibil_score: "600-649",
    age: "marginal cases",
    requires_manual_review: true
  }
};
```

### Database Schema (Stage 1)
```sql
-- Applications table (Stage 1 data)
CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    current_stage ENUM('pre_qualification', 'loan_application', 'application_processing') DEFAULT 'pre_qualification',
    current_status ENUM('pending', 'under_review', 'approved', 'rejected', 'conditional') DEFAULT 'pending',
    
    -- Stage 1 Data
    applicant_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    pan_number VARCHAR(10),
    date_of_birth DATE,
    loan_amount DECIMAL(12,2),
    loan_purpose VARCHAR(50),
    employment_type VARCHAR(30),
    
    -- Processing Results
    cibil_score INT,
    pan_verification_status VARCHAR(20),
    fraud_risk_level VARCHAR(20),
    eligibility_decision VARCHAR(20),
    eligibility_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_application_number (application_number),
    INDEX idx_stage_status (current_stage, current_status)
);
```

### API Endpoints (Stage 1)
```javascript
// POST /api/pre-qualification/process
{
  "endpoint": "/pre-qualification/process",
  "method": "POST",
  "request": {
    "personal_info": { /* user input */ },
    "loan_request": { /* loan details */ }
  },
  "response": {
    "success": true,
    "application_number": "EL_1234567890_abc123",
    "status": "approved|rejected|conditional",
    "decision": {
      "eligibility_score": 85.5,
      "cibil_score": 796,
      "recommended_amount": 500000,
      "reasons": ["Good credit score", "Valid PAN"]
    },
    "next_steps": "Proceed to loan application"
  }
}
```

---

## Stage 2: Loan Application Design

### Purpose & Objectives
- **Primary Goal**: Comprehensive data collection for detailed assessment
- **Processing Time**: 10-15 minutes
- **Success Criteria**: 90%+ completion rate
- **Data Collection**: Complete application profile (50+ fields)

### User Input Requirements
```json
{
  "personal_details": {
    "aadhaar_number": "12 digits (required)",
    "marital_status": "single|married|divorced|widowed (required)",
    "spouse_name": "string (if married)",
    "number_of_dependents": "number 0-10 (required)",
    "education_level": "high_school|diploma|graduate|post_graduate|phd (required)"
  },
  "employment_details": {
    "employment_type": "salaried|self_employed|business_owner (required)",
    "company_name": "string (required)",
    "designation": "string (required)",
    "monthly_gross_income": "number (required)",
    "monthly_net_income": "number (required)",
    "work_experience_years": "number (required)",
    "current_job_experience_years": "number (required)",
    "industry_type": "string (required)",
    "employment_status": "permanent|contract|probation (required)"
  },
  "address_details": {
    "current_address": {
      "street_address": "string (required)",
      "city": "string (required)",
      "state": "string (required)",
      "pincode": "6 digits (required)",
      "residence_type": "owned|rented|family (required)",
      "years_at_address": "number (required)"
    },
    "permanent_address": {
      "street_address": "string (required)",
      "city": "string (required)",
      "state": "string (required)",
      "pincode": "6 digits (required)",
      "same_as_current": "boolean (required)"
    }
  },
  "banking_details": {
    "account_number": "string (required)",
    "ifsc_code": "string (required)",
    "bank_name": "string (required)",
    "account_type": "savings|current (required)",
    "average_monthly_balance": "number (required)",
    "banking_relationship_years": "number (required)"
  },
  "references": {
    "personal_reference_1": {
      "name": "string (required)",
      "relationship": "family|friend|colleague|neighbor (required)",
      "mobile": "10 digits (required)",
      "email": "valid email (optional)"
    },
    "personal_reference_2": {
      "name": "string (required)",
      "relationship": "family|friend|colleague|neighbor (required)",
      "mobile": "10 digits (required)",
      "email": "valid email (optional)"
    }
  }
}
```

### System Processing Flow

#### 1. Data Validation & Verification
```javascript
// Comprehensive Validation
const validationRules = {
  aadhaar: { pattern: /^[0-9]{12}$/ },
  pincode: { pattern: /^[0-9]{6}$/ },
  mobile: { pattern: /^[6-9]\d{9}$/ },
  income: { min: 15000 },
  experience: { min: 6 },
  banking_relationship: { min: 6 }
};
```

#### 2. Document Verification
```javascript
// Verification Services
const verificationServices = {
  aadhaar_verification: "Aadhaar number validation",
  employment_verification: "Employment details confirmation",
  banking_verification: "Bank account validation",
  reference_verification: "Reference contact validation"
};
```

#### 3. Application Scoring
```javascript
// Scoring Algorithm
const scoringWeights = {
  employment_stability: 25,
  income_verification: 25,
  banking_behavior: 20,
  address_stability: 15,
  reference_quality: 15
};

const scoreCalculation = {
  excellent: "85-100",
  good: "70-84", 
  fair: "50-69",
  poor: "< 50"
};
```

#### 4. Decision Engine
```javascript
// Decision Logic
const decisionLogic = {
  approved: {
    score: "≥ 70",
    employment_verified: true,
    income_verified: true,
    references_verified: true
  },
  conditional_approval: {
    score: "50-69",
    minor_issues: true,
    requires_additional_docs: true
  },
  rejected: {
    score: "< 50",
    critical_verification_failures: true,
    insufficient_income: true
  }
};
```

### Database Schema (Stage 2)
```sql
-- Enhanced Applications table (Stage 2 data)
ALTER TABLE applications ADD COLUMN (
    -- Personal Details
    aadhaar_number VARCHAR(12),
    marital_status VARCHAR(20),
    spouse_name VARCHAR(100),
    number_of_dependents INT,
    education_level VARCHAR(30),
    
    -- Employment Details
    company_name VARCHAR(100),
    designation VARCHAR(100),
    monthly_gross_income DECIMAL(12,2),
    monthly_net_income DECIMAL(12,2),
    work_experience_years INT,
    current_job_experience_years INT,
    industry_type VARCHAR(50),
    employment_status VARCHAR(30),
    
    -- Address Details
    current_address JSON,
    permanent_address JSON,
    
    -- Banking Details
    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    account_type VARCHAR(20),
    average_monthly_balance DECIMAL(12,2),
    banking_relationship_years INT,
    
    -- References
    references JSON,
    
    -- Stage 2 Results
    application_score DECIMAL(5,2),
    employment_verified BOOLEAN DEFAULT FALSE,
    income_verified BOOLEAN DEFAULT FALSE,
    banking_verified BOOLEAN DEFAULT FALSE,
    references_verified BOOLEAN DEFAULT FALSE,
    final_decision VARCHAR(20),
    decision_reasons JSON
);
```

### API Endpoints (Stage 2)
```javascript
// POST /api/loan-application/{application_number}
{
  "endpoint": "/loan-application/{application_number}",
  "method": "POST",
  "request": {
    "personal_details": { /* personal info */ },
    "employment_details": { /* employment info */ },
    "address_details": { /* address info */ },
    "banking_details": { /* banking info */ },
    "references": { /* references */ }
  },
  "response": {
    "success": true,
    "application_number": "EL_1234567890_abc123",
    "status": "approved|conditional_approval|rejected",
    "application_score": {
      "overall_score": 78.5,
      "employment_score": 85,
      "income_score": 80,
      "banking_score": 75,
      "address_score": 70,
      "reference_score": 80
    },
    "decision": {
      "final_decision": "approved",
      "recommended_amount": 500000,
      "recommended_tenure": 36,
      "interest_rate": 12.5,
      "positive_factors": ["Good employment history", "Stable income"],
      "negative_factors": ["Limited banking history"],
      "conditions": ["Provide additional bank statements"]
    },
    "next_steps": "Proceed to document upload"
  }
}
```

---

## Data Flow & Integration Design

### Stage 1 → Stage 2 Transition
```javascript
// Transition Logic
const stageTransition = {
  prerequisites: {
    stage1_status: "approved|conditional",
    application_number: "exists",
    cibil_score: "≥ 650"
  },
  data_carryover: {
    personal_info: "name, mobile, email, pan, dob",
    loan_request: "amount, purpose, tenure",
    cibil_data: "score, history, existing_loans"
  },
  validation: {
    check_stage1_completion: true,
    verify_application_exists: true,
    validate_transition_eligibility: true
  }
};
```

### External Service Integration
```javascript
// Service Integration Matrix
const externalServices = {
  cibil: {
    endpoint: "/api/cibil/verify",
    data_required: ["pan_number", "mobile", "date_of_birth"],
    response: {
      credit_score: "number",
      credit_history: "object",
      existing_loans: "array",
      payment_history: "object"
    }
  },
  pan_verification: {
    endpoint: "/api/pan/verify", 
    data_required: ["pan_number"],
    response: {
      verified: "boolean",
      name_match: "boolean",
      status: "string"
    }
  },
  aadhaar_verification: {
    endpoint: "/api/aadhaar/verify",
    data_required: ["aadhaar_number"],
    response: {
      verified: "boolean",
      address_match: "boolean",
      status: "string"
    }
  }
};
```

---

## Error Handling & Resilience

### Error Categories
```javascript
const errorCategories = {
  validation_errors: {
    severity: "high",
    user_action: "correct_input",
    system_action: "return_validation_errors"
  },
  external_service_errors: {
    severity: "medium", 
    user_action: "retry_later",
    system_action: "fallback_processing"
  },
  system_errors: {
    severity: "critical",
    user_action: "contact_support",
    system_action: "log_error_and_alert"
  }
};
```

### Fallback Strategies
```javascript
const fallbackStrategies = {
  cibil_unavailable: {
    action: "use_cached_score",
    decision: "conditional_approval",
    message: "Credit score temporarily unavailable"
  },
  pan_verification_failed: {
    action: "manual_verification",
    decision: "conditional_approval", 
    message: "PAN verification pending"
  },
  external_service_timeout: {
    action: "proceed_without_verification",
    decision: "conditional_approval",
    message: "Verification services temporarily unavailable"
  }
};
```

---

## Performance & Scalability

### Performance Targets
```javascript
const performanceTargets = {
  stage1: {
    response_time: "< 3 seconds",
    throughput: "100 requests/minute",
    success_rate: "> 95%"
  },
  stage2: {
    response_time: "< 15 seconds", 
    throughput: "50 requests/minute",
    success_rate: "> 90%"
  }
};
```

### Scalability Considerations
```javascript
const scalabilityMeasures = {
  database: {
    indexing: "application_number, stage_status",
    partitioning: "by_date_created",
    caching: "frequently_accessed_applications"
  },
  external_services: {
    connection_pooling: true,
    circuit_breaker: true,
    retry_logic: "exponential_backoff"
  },
  processing: {
    async_operations: true,
    queue_system: "for_heavy_processing",
    load_balancing: "round_robin"
  }
};
```

---

## Security & Compliance

### Security Measures
```javascript
const securityMeasures = {
  data_encryption: {
    at_rest: "AES-256",
    in_transit: "TLS 1.3",
    sensitive_fields: ["pan_number", "aadhaar_number", "account_number"]
  },
  access_control: {
    authentication: "JWT_tokens",
    authorization: "role_based",
    audit_logging: "all_operations"
  },
  data_validation: {
    input_sanitization: true,
    sql_injection_prevention: true,
    xss_protection: true
  }
};
```

### Compliance Requirements
```javascript
const complianceRequirements = {
  rbi_guidelines: {
    kyc_verification: "mandatory",
    credit_bureau_check: "mandatory",
    risk_assessment: "mandatory"
  },
  data_protection: {
    gdpr_compliance: true,
    data_retention: "7_years",
    data_deletion: "right_to_forget"
  },
  audit_requirements: {
    transaction_logging: "complete",
    decision_trail: "traceable",
    compliance_reports: "monthly"
  }
};
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Database schema implementation
- [ ] Basic API endpoints
- [ ] Error handling framework
- [ ] Logging system

### Phase 2: Stage 1 Implementation (Week 3-4)
- [ ] Pre-qualification service
- [ ] External service integration
- [ ] Decision engine
- [ ] Frontend integration

### Phase 3: Stage 2 Implementation (Week 5-6)
- [ ] Loan application service
- [ ] Document verification
- [ ] Scoring algorithm
- [ ] Advanced validation

### Phase 4: Testing & Optimization (Week 7-8)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Security audit

---

## Success Metrics

### Key Performance Indicators
```javascript
const kpis = {
  user_experience: {
    stage1_completion_rate: "> 95%",
    stage2_completion_rate: "> 90%",
    average_processing_time: "< 10 minutes"
  },
  system_performance: {
    api_response_time: "< 5 seconds",
    system_uptime: "> 99.9%",
    error_rate: "< 1%"
  },
  business_metrics: {
    approval_rate: "> 70%",
    fraud_detection_rate: "> 95%",
    customer_satisfaction: "> 4.5/5"
  }
};
```

---

## Conclusion

This system design provides a comprehensive framework for implementing robust, scalable, and efficient loan origination stages. The architecture addresses current issues while establishing clear data flows, decision logic, and integration patterns for successful loan processing.

**Next Steps:**
1. Implement the database schema
2. Build the core services
3. Integrate external APIs
4. Develop comprehensive testing
5. Deploy with monitoring and alerting
