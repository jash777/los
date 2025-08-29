# Frontend Integration API Documentation
## Dashboard Employee Workflow - Manual Approval System

**Version:** 1.0.0  
**Last Updated:** 2025-01-28  
**Base URL:** `http://localhost:3000/api`

---

## 📋 Overview

This documentation covers all dashboard endpoints required for the employee-driven workflow that begins after Stage 2 (Loan Application) completion. The system supports manual approval processes through Underwriting, Verification, Offer, Approval, and Disbursement stages.

### Application Lifecycle Stages

```
Stage 2 (Automated) → Stage 3+ (Manual Employee Workflow)
├── application_submitted     (Initial)
├── initial_review           (Employee Review)
├── kyc_verification         (KYC Processing)
├── employment_verification  (Employment Check)
├── financial_assessment     (Financial Analysis)
├── credit_evaluation        (Credit Decision)
├── underwriting            (Underwriting Review)
├── credit_decision         (Final Credit Decision)
├── approval_processing     (Approval Processing)
├── loan_funding           (Disbursement)
└── completed              (Final State)
```

### Application Status Values
- `pending` - Awaiting action
- `in_progress` - Currently being processed
- `approved` - Stage approved, moving to next
- `rejected` - Application rejected
- `on_hold` - Temporarily paused
- `completed` - Final completion
- `cancelled` - Application cancelled

---

## 🚀 Authentication & Headers

All requests require the following headers:

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: unique_request_identifier (optional)
Authorization: Bearer <jwt_token> (when implemented)
```

---

## 📊 Dashboard Overview Endpoints

### 1. Get Dual Workflow Dashboard

**Endpoint:** `GET /api/dashboard-workflow/dashboard`

**Description:** Retrieves comprehensive dashboard data for both automated and manual workflows.

**Request:**
```http
GET /api/dashboard-workflow/dashboard
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "workflow_statistics": [
      {
        "workflow_type": "dashboard_driven",
        "current_stage": "kyc_verification",
        "current_status": "pending",
        "application_count": 15,
        "avg_processing_hours": "2.5000"
      }
    ],
    "stage_distribution": [
      {
        "current_stage": "initial_review",
        "pending_count": 8,
        "in_progress_count": 3,
        "approved_count": 12,
        "rejected_count": 2
      }
    ],
    "recent_activity": [
      {
        "application_number": "ENH_1756385536024_kaquqrxuc",
        "from_stage": "initial_review",
        "to_stage": "kyc_verification",
        "transitioned_at": "2025-01-28T10:30:00.000Z",
        "triggered_by": "EMP001"
      }
    ],
    "performance_metrics": {
      "dashboard_driven": {
        "total_applications": 25,
        "avg_processing_hours": 4.2,
        "approval_rate": 0.85,
        "rejection_rate": 0.15
      }
    }
  },
  "requestId": "dashboard_1756385536024",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to get dual workflow dashboard",
  "message": "Database connection error",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

## 📝 Application Management Endpoints

### 2. Create Dashboard-Driven Application

**Endpoint:** `POST /api/dashboard-workflow/applications`

**Description:** Creates a new application that will be processed through the employee dashboard workflow.

**Request:**
```http
POST /api/dashboard-workflow/applications
Content-Type: application/json

{
  "applicant_name": "John Smith",
  "email": "john.smith@email.com",
  "phone": "9876543210",
  "pan_number": "ABCDE1234F",
  "aadhar_number": "123456789012",
  "date_of_birth": "1990-05-15",
  "loan_amount": 750000,
  "loan_purpose": "home_improvement",
  "employment_type": "salaried",
  "monthly_income": 85000,
  "company_name": "Tech Solutions Pvt Ltd",
  "designation": "Senior Developer",
  "priority_level": "normal",
  "created_by": "EMP001"
}
```

**Required Fields:**
- `applicant_name` (string): Full name of applicant
- `email` (string): Valid email address
- `phone` (string): 10-digit mobile number
- `pan_number` (string): Valid PAN format (ABCDE1234F)
- `loan_amount` (number): Loan amount requested
- `loan_purpose` (string): Purpose of loan

**Optional Fields:**
- `aadhar_number` (string): 12-digit Aadhar number
- `date_of_birth` (string): YYYY-MM-DD format
- `employment_type` (enum): salaried, self_employed, business_owner, professional, retired
- `monthly_income` (number): Monthly income amount
- `company_name` (string): Employer name
- `designation` (string): Job title
- `priority_level` (enum): low, normal, high, urgent
- `created_by` (string): Employee ID creating the application

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "application_id": "04a7fd56-23e8-47e7-a995-b81513906b80",
    "application_number": "ENH_1756385371825_wj2fa7085",
    "workflow_type": "dashboard_driven",
    "initial_stage": "application_submitted",
    "profile_id": "profile_uuid_here",
    "created_at": "2025-01-28T10:30:00.000Z"
  },
  "message": "Dashboard-driven application created successfully",
  "requestId": "dashboard_1756385371825",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "missing_fields": ["applicant_name", "email", "loan_amount"],
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

### 3. Get Applications by Workflow Type

**Endpoint:** `GET /api/dashboard-workflow/workflows/{workflow_type}/applications`

**Description:** Retrieves paginated list of applications filtered by workflow type and optional filters.

**Path Parameters:**
- `workflow_type` (string): los_automated, dashboard_driven, or hybrid

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of applications per page
- `stage` (string, optional): Filter by current stage
- `status` (string, optional): Filter by current status

**Request:**
```http
GET /api/dashboard-workflow/workflows/dashboard_driven/applications?page=1&limit=10&stage=kyc_verification&status=pending
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "04a7fd56-23e8-47e7-a995-b81513906b80",
        "application_number": "ENH_1756385371825_wj2fa7085",
        "workflow_type": "dashboard_driven",
        "current_stage": "kyc_verification",
        "current_status": "pending",
        "loan_amount": "750000.00",
        "loan_purpose": "home_improvement",
        "priority_level": "normal",
        "assigned_to": null,
        "created_at": "2025-01-28T10:30:00.000Z",
        "updated_at": "2025-01-28T10:30:00.000Z",
        "full_name": "John Smith",
        "primary_email": "john.smith@email.com",
        "primary_mobile": "9876543210",
        "pan_number": "ABCDE1234F",
        "employment_type": "salaried",
        "monthly_income": "85000.00",
        "cibil_score": null,
        "risk_category": null,
        "kyc_status": "pending",
        "processing_hours": "0.0000"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    },
    "filters": {
      "workflow_type": "dashboard_driven",
      "stage": "kyc_verification",
      "status": "pending"
    }
  },
  "requestId": "list_1756385371825",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

### 4. Get Application for Review

**Endpoint:** `GET /api/dashboard-workflow/applications/{application_number}/review`

**Description:** Retrieves complete application details for employee review and decision-making.

**Path Parameters:**
- `application_number` (string): Unique application identifier

**Request:**
```http
GET /api/dashboard-workflow/applications/ENH_1756385371825_wj2fa7085/review
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "04a7fd56-23e8-47e7-a995-b81513906b80",
      "application_number": "ENH_1756385371825_wj2fa7085",
      "workflow_type": "dashboard_driven",
      "current_stage": "kyc_verification",
      "current_status": "pending",
      "loan_amount": "750000.00",
      "loan_purpose": "home_improvement",
      "requested_tenure_months": 36,
      "priority_level": "normal",
      "assigned_to": null,
      "source_channel": "web",
      "created_at": "2025-01-28T10:30:00.000Z",
      "updated_at": "2025-01-28T10:30:00.000Z"
    },
    "applicant_profile": {
      "id": "profile_uuid_here",
      "full_name": "John Smith",
      "first_name": "John",
      "last_name": "Smith",
      "date_of_birth": "1990-05-15",
      "age": 34,
      "primary_email": "john.smith@email.com",
      "primary_mobile": "9876543210",
      "pan_number": "ABCDE1234F",
      "aadhar_number": "123456789012",
      "employment_type": "salaried",
      "company_name": "Tech Solutions Pvt Ltd",
      "designation": "Senior Developer",
      "monthly_income": "85000.00",
      "annual_income": "1020000.00",
      "current_address": {
        "address": "123 Tech Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001",
        "residence_type": "owned"
      },
      "cibil_score": 750,
      "risk_category": "medium",
      "kyc_status": "pending"
    },
    "workflow_history": [
      {
        "stage_name": "application_submitted",
        "status": "completed",
        "started_at": "2025-01-28T10:30:00.000Z",
        "completed_at": "2025-01-28T10:31:00.000Z",
        "processed_by": "system",
        "decision": "approved",
        "decision_reason": "Application submitted successfully"
      }
    ],
    "next_actions": [
      "Verify KYC documents",
      "Validate employment details",
      "Check credit history"
    ]
  },
  "requestId": "review_1756385371825",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Application not found",
  "message": "No application found with number: ENH_1756385371825_wj2fa7085",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

## ⚡ Stage Processing Endpoints

### 5. Process Application Stage

**Endpoint:** `POST /api/dashboard-workflow/applications/{application_number}/stages/{stage_name}/process`

**Description:** Processes a specific stage with employee decision and moves application to next stage or status.

**Path Parameters:**
- `application_number` (string): Unique application identifier
- `stage_name` (string): Current stage being processed

**Valid Stage Names:**
- `initial_review`
- `kyc_verification`
- `employment_verification`
- `financial_assessment`
- `credit_evaluation`
- `underwriting`
- `credit_decision`
- `approval_processing`
- `loan_funding`

**Request:**
```http
POST /api/dashboard-workflow/applications/ENH_1756385371825_wj2fa7085/stages/kyc_verification/process
Content-Type: application/json

{
  "decision": "approved",
  "decision_reason": "All KYC documents verified successfully. PAN and Aadhar validated.",
  "employee_id": "EMP001",
  "next_stage": "employment_verification",
  "stage_data": {
    "documents_verified": ["pan_card", "aadhar_card", "bank_statement"],
    "verification_score": 95,
    "risk_assessment": "low",
    "internal_notes": "Clean documentation, no discrepancies found",
    "time_spent_minutes": 15,
    "recommended_terms": {
      "interest_rate": 11.5,
      "tenure_months": 36
    }
  },
  "conditions": null
}
```

**Required Fields:**
- `decision` (enum): approved, rejected, conditional, refer_manual, escalate
- `decision_reason` (string): Detailed reason for the decision
- `employee_id` (string): ID of employee making the decision

**Optional Fields:**
- `next_stage` (string): Override next stage (system determines if not provided)
- `stage_data` (object): Additional processing data and metrics
- `conditions` (string): Special conditions if decision is conditional

**Decision Types:**
- `approved`: Stage passed, move to next stage
- `rejected`: Application rejected, end workflow
- `conditional`: Approved with conditions, may stay in current stage
- `refer_manual`: Escalate to senior employee
- `escalate`: Escalate to management level

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "application_number": "ENH_1756385371825_wj2fa7085",
    "processed_stage": "kyc_verification",
    "decision": "approved",
    "next_stage": "employment_verification",
    "status": "approved",
    "processed_by": "EMP001",
    "processed_at": "2025-01-28T10:35:00.000Z"
  },
  "message": "Stage kyc_verification processed successfully",
  "requestId": "process_1756385371825",
  "timestamp": "2025-01-28T10:35:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid decision",
  "valid_decisions": ["approved", "rejected", "conditional", "refer_manual", "escalate"],
  "timestamp": "2025-01-28T10:35:00.000Z"
}
```

---

## 👤 Applicant Profile Management

### 6. Update Applicant Profile

**Endpoint:** `PUT /api/dashboard-workflow/applications/{application_number}/profile`

**Description:** Updates applicant profile information during the review process.

**Path Parameters:**
- `application_number` (string): Unique application identifier

**Request:**
```http
PUT /api/dashboard-workflow/applications/ENH_1756385371825_wj2fa7085/profile
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "primary_email": "john.smith@newemail.com",
  "primary_mobile": "9876543210",
  "employment_type": "salaried",
  "monthly_income": 90000,
  "company_name": "New Tech Solutions Pvt Ltd",
  "designation": "Lead Developer",
  "cibil_score": 780,
  "risk_category": "low",
  "updated_by": "EMP001"
}
```

**Updatable Fields:**
- `first_name` (string): First name
- `last_name` (string): Last name
- `date_of_birth` (string): Date of birth (YYYY-MM-DD)
- `primary_email` (string): Email address
- `primary_mobile` (string): Mobile number
- `pan_number` (string): PAN number
- `aadhar_number` (string): Aadhar number
- `employment_type` (enum): Employment type
- `company_name` (string): Company name
- `designation` (string): Job designation
- `monthly_income` (number): Monthly income
- `current_address` (object): Current address
- `permanent_address` (object): Permanent address
- `cibil_score` (integer): CIBIL score
- `risk_category` (enum): low, medium, high, critical
- `kyc_status` (enum): pending, in_progress, completed, failed, expired
- `updated_by` (string): Employee ID making the update

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "application_number": "ENH_1756385371825_wj2fa7085",
    "updated_fields": ["monthly_income", "company_name", "designation", "cibil_score", "risk_category"],
    "updated_at": "2025-01-28T10:40:00.000Z"
  },
  "message": "Applicant profile updated successfully",
  "requestId": "update_1756385371825",
  "timestamp": "2025-01-28T10:40:00.000Z"
}
```

---

## 🔄 Workflow Management

### 7. Switch Workflow Type

**Endpoint:** `PATCH /api/dashboard-workflow/applications/{application_number}/workflow`

**Description:** Switches an application between different workflow types (automated, manual, hybrid).

**Path Parameters:**
- `application_number` (string): Unique application identifier

**Request:**
```http
PATCH /api/dashboard-workflow/applications/ENH_1756385371825_wj2fa7085/workflow
Content-Type: application/json

{
  "new_workflow_type": "hybrid",
  "reason": "Application requires both automated and manual processing due to complex financial structure",
  "employee_id": "EMP001"
}
```

**Required Fields:**
- `new_workflow_type` (enum): los_automated, dashboard_driven, hybrid
- `reason` (string): Reason for workflow change
- `employee_id` (string): Employee making the change

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "application_number": "ENH_1756385371825_wj2fa7085",
    "old_workflow_type": "dashboard_driven",
    "new_workflow_type": "hybrid",
    "changed_by": "EMP001",
    "changed_at": "2025-01-28T10:45:00.000Z",
    "reason": "Application requires both automated and manual processing due to complex financial structure"
  },
  "message": "Workflow type switched to hybrid",
  "requestId": "switch_1756385371825",
  "timestamp": "2025-01-28T10:45:00.000Z"
}
```

---

## 📊 Manual Workflow Integration

### 8. Add to Manual Review Queue

**Endpoint:** `POST /api/manual-workflow/reviews`

**Description:** Adds an application to manual review queue for employee assignment.

**Request:**
```http
POST /api/manual-workflow/reviews
Content-Type: application/json

{
  "application_number": "ENH_1756385371825_wj2fa7085",
  "stage_name": "underwriting",
  "review_type": "detailed_analysis",
  "priority": "high",
  "assigned_to": "EMP002",
  "notes": "Complex case requiring senior underwriter review"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "queue_id": "queue_uuid_here",
    "application_number": "ENH_1756385371825_wj2fa7085",
    "stage_name": "underwriting",
    "review_type": "detailed_analysis",
    "priority": "high",
    "assigned_to": "EMP002",
    "queue_status": "assigned",
    "created_at": "2025-01-28T10:50:00.000Z"
  },
  "message": "Application added to manual review queue",
  "timestamp": "2025-01-28T10:50:00.000Z"
}
```

### 9. Get Pending Manual Reviews

**Endpoint:** `GET /api/manual-workflow/reviews/pending`

**Description:** Retrieves list of applications pending manual review.

**Query Parameters:**
- `assigned_to` (string, optional): Filter by assigned employee
- `stage_name` (string, optional): Filter by stage
- `priority` (string, optional): Filter by priority level

**Request:**
```http
GET /api/manual-workflow/reviews/pending?assigned_to=EMP002&priority=high
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pending_reviews": [
      {
        "id": "queue_uuid_here",
        "application_number": "ENH_1756385371825_wj2fa7085",
        "stage_name": "underwriting",
        "review_type": "detailed_analysis",
        "priority": "high",
        "assigned_to": "EMP002",
        "queue_status": "assigned",
        "created_at": "2025-01-28T10:50:00.000Z",
        "assigned_at": "2025-01-28T10:50:00.000Z",
        "notes": "Complex case requiring senior underwriter review"
      }
    ],
    "total_count": 1,
    "assigned_count": 1,
    "unassigned_count": 0
  },
  "timestamp": "2025-01-28T10:55:00.000Z"
}
```

---

## 🎯 Rules Engine Integration

### 10. Get Business Rules

**Endpoint:** `GET /api/rules-engine`

**Description:** Retrieves complete business rules configuration for all stages.

**Request:**
```http
GET /api/rules-engine
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "description": "Comprehensive business rules engine for 7-stage Loan Origination System",
    "last_updated": "2025-01-27",
    "stages": {
      "stage_3_application_processing": {
        "stage_name": "Application Processing",
        "description": "Comprehensive document and data verification",
        "business_rules": {
          "document_verification": {
            "required_documents": ["pan_card", "aadhar_card", "salary_slips", "bank_statements"],
            "verification_methods": ["ocr", "manual_review", "third_party_api"],
            "acceptance_criteria": {
              "document_clarity": 85,
              "data_consistency": 90,
              "authenticity_score": 80
            }
          }
        }
      }
    }
  },
  "timestamp": "2025-01-28T11:00:00.000Z"
}
```

### 11. Get Stage-Specific Rules

**Endpoint:** `GET /api/rules-engine/stages/{stage_name}`

**Description:** Retrieves business rules for a specific stage.

**Path Parameters:**
- `stage_name` (string): Name of the stage

**Request:**
```http
GET /api/rules-engine/stages/underwriting
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stage_name": "Underwriting",
    "description": "Comprehensive risk assessment and loan structuring",
    "business_rules": {
      "risk_assessment": {
        "debt_to_income_ratio": {
          "maximum_allowed": 0.5,
          "preferred_range": 0.3,
          "calculation_method": "total_monthly_obligations / monthly_income"
        },
        "loan_to_value_ratio": {
          "maximum_allowed": 0.8,
          "property_types": {
            "residential": 0.8,
            "commercial": 0.7,
            "plot": 0.6
          }
        }
      },
      "approval_criteria": {
        "minimum_cibil_score": 650,
        "maximum_existing_loans": 3,
        "employment_stability_months": 12
      }
    },
    "decision_matrix": {
      "auto_approve": [
        "cibil_score >= 750",
        "dti_ratio <= 0.3",
        "ltv_ratio <= 0.7"
      ],
      "manual_review": [
        "cibil_score between 650-749",
        "dti_ratio between 0.3-0.5"
      ],
      "auto_reject": [
        "cibil_score < 650",
        "dti_ratio > 0.5"
      ]
    }
  },
  "timestamp": "2025-01-28T11:05:00.000Z"
}
```

---

## 🚨 Error Handling

### Standard Error Response Format

All endpoints return errors in the following standardized format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field_name",
    "value": "invalid_value",
    "constraint": "validation_rule_violated"
  },
  "timestamp": "2025-01-28T11:10:00.000Z"
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or missing required fields
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (duplicate, state mismatch)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

### Common Error Scenarios

#### Validation Errors (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "One or more fields failed validation",
  "details": {
    "email": "Invalid email format",
    "pan_number": "PAN format must be ABCDE1234F",
    "loan_amount": "Amount must be between 100000 and 5000000"
  },
  "timestamp": "2025-01-28T11:10:00.000Z"
}
```

#### Resource Not Found (404)
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Application not found",
  "code": "APPLICATION_NOT_FOUND",
  "details": {
    "application_number": "ENH_1756385371825_invalid"
  },
  "timestamp": "2025-01-28T11:10:00.000Z"
}
```

#### Business Logic Error (409)
```json
{
  "success": false,
  "error": "Business Logic Error",
  "message": "Cannot process stage: application is already completed",
  "code": "INVALID_STAGE_TRANSITION",
  "details": {
    "current_stage": "completed",
    "requested_stage": "underwriting",
    "valid_transitions": []
  },
  "timestamp": "2025-01-28T11:10:00.000Z"
}
```

---

## 🔧 Implementation Examples

### Frontend Integration Examples

#### React/TypeScript Example

```typescript
// API Service Class
class DashboardAPI {
  private baseURL = 'http://localhost:3000/api';
  
  async getApplicationsForReview(workflowType: string, filters?: {
    page?: number;
    limit?: number;
    stage?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.stage) queryParams.append('stage', filters.stage);
    if (filters?.status) queryParams.append('status', filters.status);
    
    const response = await fetch(
      `${this.baseURL}/dashboard-workflow/workflows/${workflowType}/applications?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `req_${Date.now()}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async processApplicationStage(
    applicationNumber: string,
    stageName: string,
    decision: {
      decision: 'approved' | 'rejected' | 'conditional' | 'refer_manual' | 'escalate';
      decision_reason: string;
      employee_id: string;
      stage_data?: any;
      next_stage?: string;
      conditions?: string;
    }
  ) {
    const response = await fetch(
      `${this.baseURL}/dashboard-workflow/applications/${applicationNumber}/stages/${stageName}/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `process_${Date.now()}`
        },
        body: JSON.stringify(decision)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process stage');
    }
    
    return await response.json();
  }
}

// Usage in React Component
const ApplicationReviewComponent: React.FC = () => {
  const [applications, setApplications] = useState([]);
  const dashboardAPI = new DashboardAPI();
  
  const handleStageApproval = async (applicationNumber: string, stageName: string) => {
    try {
      const result = await dashboardAPI.processApplicationStage(
        applicationNumber,
        stageName,
        {
          decision: 'approved',
          decision_reason: 'All requirements met, proceeding to next stage',
          employee_id: 'EMP001',
          stage_data: {
            verification_score: 95,
            time_spent_minutes: 10
          }
        }
      );
      
      console.log('Stage processed successfully:', result);
      // Refresh applications list
      loadApplications();
    } catch (error) {
      console.error('Error processing stage:', error);
    }
  };
  
  // Component JSX...
};
```

#### JavaScript/Fetch Example

```javascript
// Process KYC Verification
async function approveKYCVerification(applicationNumber) {
  try {
    const response = await fetch(
      `/api/dashboard-workflow/applications/${applicationNumber}/stages/kyc_verification/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `kyc_${Date.now()}`
        },
        body: JSON.stringify({
          decision: 'approved',
          decision_reason: 'All KYC documents verified successfully',
          employee_id: getCurrentEmployeeId(),
          stage_data: {
            documents_verified: ['pan_card', 'aadhar_card'],
            verification_score: 98,
            risk_assessment: 'low'
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    showSuccessMessage(`Application moved to ${result.data.next_stage}`);
    
  } catch (error) {
    showErrorMessage('Failed to process KYC verification');
    console.error('Error:', error);
  }
}
```

---

## 📋 Validation Rules Summary

### Field Validation Rules

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| `applicant_name` | string | 2-100 chars, no special chars | "John Smith" |
| `email` | string | Valid email format | "john@email.com" |
| `phone` | string | 10 digits, starts with 6-9 | "9876543210" |
| `pan_number` | string | Format: ABCDE1234F | "ABCDE1234F" |
| `aadhar_number` | string | 12 digits | "123456789012" |
| `loan_amount` | number | 100,000 - 50,00,000 | 750000 |
| `monthly_income` | number | > 25,000 | 85000 |
| `cibil_score` | integer | 300 - 900 | 750 |

### Business Rules Validation

- **Age**: 18-70 years (preferred: 21-65)
- **CIBIL Score**: Minimum 650 for approval
- **Debt-to-Income Ratio**: Maximum 50%
- **Employment**: Minimum 12 months experience
- **Loan Amount**: Based on income and CIBIL score

---

## 🚀 Getting Started

### Quick Integration Checklist

1. **Setup Base Configuration**
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   const DASHBOARD_ENDPOINTS = {
     applications: '/dashboard-workflow/applications',
     workflows: '/dashboard-workflow/workflows',
     dashboard: '/dashboard-workflow/dashboard'
   };
   ```

2. **Implement Error Handling**
   ```javascript
   const handleAPIError = (error, response) => {
     if (response?.status === 400) {
       // Handle validation errors
     } else if (response?.status === 404) {
       // Handle not found
     } else {
       // Handle server errors
     }
   };
   ```

3. **Create API Service Layer**
   - Implement all endpoint methods
   - Add proper error handling
   - Include request/response logging

4. **Build UI Components**
   - Application list with filtering
   - Application detail view
   - Stage processing forms
   - Dashboard overview

5. **Test Integration**
   - Test all CRUD operations
   - Validate error scenarios
   - Check stage transitions
   - Verify data consistency

---

This comprehensive API documentation provides everything needed for frontend integration with the dashboard employee workflow system. All endpoints are production-ready and follow consistent patterns for easy implementation.
