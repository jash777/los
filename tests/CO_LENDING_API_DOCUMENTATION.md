# Co-Lending System API Documentation

## 🎯 Overview

This document provides comprehensive API documentation for the Co-Lending System integration. All endpoints are RESTful and return JSON responses.

**Base URL**: `http://localhost:3000/api/co-lending`

**Authentication**: Currently public (add authentication headers as needed)
**Content-Type**: `application/json`

---

## 📋 Table of Contents

1. [Health Check](#health-check)
2. [Partner Management](#partner-management)
3. [Ratio Management](#ratio-management)
4. [Transaction Processing](#transaction-processing)
5. [Analytics & Reporting](#analytics--reporting)
6. [Error Handling](#error-handling)
7. [Frontend Integration Examples](#frontend-integration-examples)

---

## 🔍 Health Check

### GET `/health`

Check if the co-lending service is running.

**Response:**
```json
{
  "success": true,
  "service": "Co-Lending Management Service",
  "status": "healthy",
  "timestamp": "2025-08-28T18:30:00.000Z",
  "features": {
    "partner_management": true,
    "ratio_management": true,
    "transaction_processing": true,
    "bank_api_integration": true,
    "analytics_reporting": true,
    "settlement_tracking": true
  },
  "endpoints": {
    "partners": {
      "list": "GET /api/co-lending/partners",
      "create": "POST /api/co-lending/partners",
      "update": "PUT /api/co-lending/partners/:partnerId"
    },
    "ratios": {
      "list": "GET /api/co-lending/ratios",
      "create": "POST /api/co-lending/ratios",
      "update": "PUT /api/co-lending/ratios/:ratioId"
    },
    "transactions": {
      "optimal_arrangement": "POST /api/co-lending/optimal-arrangement",
      "create": "POST /api/co-lending/transactions",
      "list": "GET /api/co-lending/transactions",
      "process": "POST /api/co-lending/process/:transactionId"
    },
    "analytics": {
      "overview": "GET /api/co-lending/analytics",
      "portfolio": "GET /api/co-lending/portfolio",
      "settlements": "GET /api/co-lending/settlements",
      "api_logs": "GET /api/co-lending/api-logs"
    }
  }
}
```

---

## 🏦 Partner Management

### GET `/partners`

Get all co-lending partners with optional filtering.

**Query Parameters:**
- `type` (optional): Filter by partner type (`bank`, `nbfc`, `fintech`)
- `status` (optional): Filter by status (`active`, `inactive`, `suspended`)

**Response:**
```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "id": 1,
        "partner_code": "HDFC_BANK",
        "partner_name": "HDFC Bank Limited",
        "partner_type": "bank",
        "license_number": null,
        "regulatory_authority": null,
        "contact_details": {
          "email": "contact@hdfc_bank.com",
          "phone": "+91-22-12345678",
          "contact_person": "Partner Manager"
        },
        "status": "active",
        "risk_rating": "AAA",
        "minimum_ticket_size": "50000.00",
        "maximum_ticket_size": "5000000.00",
        "preferred_sectors": null,
        "created_at": "2025-08-28T18:30:00.000Z",
        "updated_at": "2025-08-28T18:30:00.000Z"
      }
    ],
    "total_count": 6,
    "banks_count": 3,
    "nbfcs_count": 3,
    "active_count": 6
  },
  "message": "Co-lending partners retrieved successfully",
  "requestId": "partners_1756405800000"
}
```

### POST `/partners`

Create a new co-lending partner.

**Request Body:**
```json
{
  "partner_code": "NEW_BANK_001",
  "partner_name": "New Bank Limited",
  "partner_type": "bank",
  "license_number": "BL123456789",
  "regulatory_authority": "RBI",
  "contact_details": {
    "email": "contact@newbank.com",
    "phone": "+91-22-87654321",
    "contact_person": "John Doe"
  },
  "api_endpoint": "https://api.newbank.com/colending",
  "api_credentials": {
    "api_key": "your_api_key",
    "secret": "your_secret"
  },
  "status": "active",
  "risk_rating": "AA",
  "minimum_ticket_size": 100000,
  "maximum_ticket_size": 5000000,
  "preferred_sectors": ["personal", "home_improvement"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partner_code": "NEW_BANK_001",
    "partner_name": "New Bank Limited",
    "partner_type": "bank",
    "status": "active"
  },
  "message": "Co-lending partner created successfully",
  "requestId": "create_partner_1756405800000"
}
```

### PUT `/partners/:partnerId`

Update an existing co-lending partner.

**Request Body:**
```json
{
  "partner_name": "Updated Bank Limited",
  "status": "active",
  "risk_rating": "AAA",
  "contact_details": {
    "email": "updated@newbank.com",
    "phone": "+91-22-87654321",
    "contact_person": "Jane Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partner_id": 1,
    "updated_fields": ["partner_name", "status", "risk_rating", "contact_details"]
  },
  "message": "Co-lending partner updated successfully",
  "requestId": "update_partner_1756405800000"
}
```

---

## ⚖️ Ratio Management

### GET `/ratios`

Get all co-lending ratio rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "ratios": [
      {
        "id": 1,
        "rule_name": "Default 80-20 Rule",
        "loan_amount_min": "0.00",
        "loan_amount_max": "99999999.00",
        "cibil_score_min": 0,
        "cibil_score_max": 900,
        "loan_purpose": null,
        "bank_partner_id": 1,
        "nbfc_partner_id": 4,
        "bank_ratio": "80.00",
        "nbfc_ratio": "20.00",
        "is_default": true,
        "priority_order": 1,
        "status": "active",
        "bank_name": "HDFC Bank Limited",
        "bank_code": "HDFC_BANK",
        "nbfc_name": "Bajaj Finserv Limited",
        "nbfc_code": "BAJAJ_FINSERV",
        "created_at": "2025-08-28T18:30:00.000Z",
        "updated_at": "2025-08-28T18:30:00.000Z"
      }
    ],
    "total_count": 5,
    "active_count": 5,
    "default_rule": {
      "id": 1,
      "rule_name": "Default 80-20 Rule",
      "bank_ratio": "80.00",
      "nbfc_ratio": "20.00"
    }
  },
  "message": "Co-lending ratios retrieved successfully",
  "requestId": "ratios_1756405800000"
}
```

### POST `/ratios`

Create a new co-lending ratio rule.

**Request Body:**
```json
{
  "rule_name": "Premium Customer Rule",
  "loan_amount_min": 0,
  "loan_amount_max": 99999999,
  "cibil_score_min": 800,
  "cibil_score_max": 900,
  "loan_purpose": "personal",
  "bank_partner_id": 1,
  "nbfc_partner_id": 6,
  "bank_ratio": 90.00,
  "nbfc_ratio": 10.00,
  "is_default": false,
  "priority_order": 5,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule_name": "Premium Customer Rule",
    "bank_ratio": 90.00,
    "nbfc_ratio": 10.00,
    "status": "active"
  },
  "message": "Co-lending ratio rule created successfully",
  "requestId": "create_ratio_1756405800000"
}
```

### PUT `/ratios/:ratioId`

Update an existing co-lending ratio rule.

**Request Body:**
```json
{
  "bank_ratio": 85.00,
  "nbfc_ratio": 15.00,
  "priority_order": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ratio_id": 1,
    "updated_fields": ["bank_ratio", "nbfc_ratio", "priority_order"]
  },
  "message": "Co-lending ratio updated successfully",
  "requestId": "update_ratio_1756405800000"
}
```

---

## 💼 Transaction Processing

### POST `/optimal-arrangement`

Get the optimal co-lending arrangement for a loan application.

**Request Body:**
```json
{
  "loan_amount": 500000,
  "cibil_score": 750,
  "loan_purpose": "personal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule_id": 1,
    "rule_name": "Default 80-20 Rule",
    "bank_partner": {
      "id": 1,
      "name": "HDFC Bank Limited",
      "code": "HDFC_BANK",
      "api_endpoint": null
    },
    "nbfc_partner": {
      "id": 4,
      "name": "Bajaj Finserv Limited",
      "code": "BAJAJ_FINSERV",
      "api_endpoint": null
    },
    "bank_ratio": 80.00,
    "nbfc_ratio": 20.00,
    "bank_amount": "400000.00",
    "nbfc_amount": "100000.00"
  },
  "message": "Optimal co-lending arrangement found",
  "requestId": "optimal_1756405800000"
}
```

### POST `/transactions`

Create a new co-lending transaction.

**Request Body:**
```json
{
  "application_number": "APP_2025_001",
  "loan_amount": 500000,
  "arrangement": {
    "rule_id": 1,
    "rule_name": "Default 80-20 Rule",
    "bank_partner": {
      "id": 1,
      "name": "HDFC Bank Limited",
      "code": "HDFC_BANK"
    },
    "nbfc_partner": {
      "id": 4,
      "name": "Bajaj Finserv Limited",
      "code": "BAJAJ_FINSERV"
    },
    "bank_ratio": 80.00,
    "nbfc_ratio": 20.00,
    "bank_amount": "400000.00",
    "nbfc_amount": "100000.00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_id": "CLT_1756405800000_abc123def",
    "arrangement": {
      "rule_id": 1,
      "rule_name": "Default 80-20 Rule",
      "bank_partner": {
        "id": 1,
        "name": "HDFC Bank Limited",
        "code": "HDFC_BANK"
      },
      "nbfc_partner": {
        "id": 4,
        "name": "Bajaj Finserv Limited",
        "code": "BAJAJ_FINSERV"
      },
      "bank_ratio": 80.00,
      "nbfc_ratio": 20.00,
      "bank_amount": "400000.00",
      "nbfc_amount": "100000.00"
    }
  },
  "message": "Co-lending transaction created successfully",
  "requestId": "create_txn_1756405800000"
}
```

### GET `/transactions`

Get co-lending transactions with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by transaction status
- `application_number` (optional): Filter by application number
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "transaction_id": "CLT_1756405800000_abc123def",
        "application_number": "APP_2025_001",
        "loan_amount": "500000.00",
        "bank_partner_id": 1,
        "nbfc_partner_id": 4,
        "bank_amount": "400000.00",
        "nbfc_amount": "100000.00",
        "bank_ratio": "80.00",
        "nbfc_ratio": "20.00",
        "transaction_status": "initiated",
        "bank_approval_status": "pending",
        "nbfc_approval_status": "pending",
        "bank_transaction_ref": null,
        "nbfc_transaction_ref": null,
        "disbursement_date": null,
        "settlement_status": "pending",
        "transaction_details": {
          "rule_name": "Default 80-20 Rule",
          "created_by": "system",
          "created_at": "2025-08-28T18:30:00.000Z"
        },
        "bank_name": "HDFC Bank Limited",
        "bank_code": "HDFC_BANK",
        "nbfc_name": "Bajaj Finserv Limited",
        "nbfc_code": "BAJAJ_FINSERV",
        "created_at": "2025-08-28T18:30:00.000Z",
        "updated_at": "2025-08-28T18:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  },
  "message": "Co-lending transactions retrieved successfully",
  "requestId": "transactions_1756405800000"
}
```

### POST `/process/:transactionId`

Process a distributed loan via bank APIs.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_id": "CLT_1756405800000_abc123def",
    "bank_status": "fulfilled",
    "nbfc_status": "fulfilled",
    "processing_summary": {
      "bank_success": true,
      "nbfc_success": true,
      "overall_status": "success"
    }
  },
  "message": "Distributed loan processing completed",
  "requestId": "process_1756405800000"
}
```

---

## 📊 Analytics & Reporting

### GET `/analytics`

Get comprehensive co-lending analytics.

**Query Parameters:**
- `date_range` (optional): Number of days for analytics (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_transactions": 1,
      "total_loan_amount": "500000.00",
      "average_loan_amount": "500000.00",
      "total_bank_amount": "400000.00",
      "total_nbfc_amount": "100000.00",
      "both_approved_count": 0,
      "disbursed_count": 0,
      "average_bank_ratio": "80.00",
      "average_nbfc_ratio": "20.00"
    },
    "partners": [
      {
        "partner_code": "HDFC_BANK",
        "partner_name": "HDFC Bank Limited",
        "partner_type": "bank",
        "status": "active",
        "risk_rating": "AAA",
        "total_transactions": 1,
        "total_amount": "400000.00",
        "average_amount": "400000.00",
        "disbursed_count": 0,
        "disbursed_amount": "0.00"
      }
    ],
    "monthly_trends": [
      {
        "month_year": "2025-08",
        "total_transactions": 1,
        "total_loan_amount": "500000.00",
        "average_loan_amount": "500000.00",
        "total_bank_amount": "400000.00",
        "total_nbfc_amount": "100000.00",
        "average_bank_ratio": "80.00",
        "average_nbfc_ratio": "20.00",
        "disbursed_count": 0,
        "disbursed_amount": "0.00"
      }
    ],
    "date_range_days": 30
  },
  "message": "Co-lending analytics retrieved successfully",
  "requestId": "analytics_1756405800000"
}
```

### GET `/portfolio`

Get portfolio analytics for partners.

**Query Parameters:**
- `partner_id` (optional): Filter by specific partner
- `partner_type` (optional): Filter by partner type

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio_data": [],
    "summary": {
      "total_partners": 0,
      "latest_date": null,
      "total_active_loans": 0,
      "total_outstanding": 0
    }
  },
  "message": "Portfolio analytics retrieved successfully",
  "requestId": "portfolio_1756405800000"
}
```

### GET `/settlements`

Get settlement tracking data.

**Query Parameters:**
- `transaction_id` (optional): Filter by transaction ID
- `settlement_type` (optional): Filter by settlement type
- `status` (optional): Filter by settlement status
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "settlements": [],
    "pagination": {
      "limit": 50,
      "offset": 0
    }
  },
  "message": "Settlement data retrieved successfully",
  "requestId": "settlements_1756405800000"
}
```

### GET `/api-logs`

Get API integration logs.

**Query Parameters:**
- `partner_id` (optional): Filter by partner ID
- `transaction_id` (optional): Filter by transaction ID
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "api_logs": [],
    "pagination": {
      "limit": 100,
      "offset": 0
    }
  },
  "message": "API logs retrieved successfully",
  "requestId": "api_logs_1756405800000"
}
```

---

## ❌ Error Handling

All endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "requestId": "request_id_1756405800000"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `500`: Internal Server Error

**Example Error Responses:**

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "loan_amount and cibil_score are required",
  "requestId": "optimal_1756405800000"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": "Partner not found",
  "message": "No partner found with ID: 999",
  "requestId": "update_partner_1756405800000"
}
```

**Conflict Error (409):**
```json
{
  "success": false,
  "error": "Partner already exists",
  "message": "Partner code already exists",
  "requestId": "create_partner_1756405800000"
}
```

---

## 🎨 Frontend Integration Examples

### JavaScript/TypeScript Examples

**1. Get All Partners:**
```javascript
const getPartners = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/co-lending/partners');
    const data = await response.json();
    
    if (data.success) {
      console.log('Partners:', data.data.partners);
      return data.data.partners;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

**2. Get Optimal Arrangement:**
```javascript
const getOptimalArrangement = async (loanAmount, cibilScore, loanPurpose) => {
  try {
    const response = await fetch('http://localhost:3000/api/co-lending/optimal-arrangement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loan_amount: loanAmount,
        cibil_score: cibilScore,
        loan_purpose: loanPurpose
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Optimal arrangement:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

**3. Create Transaction:**
```javascript
const createTransaction = async (applicationNumber, loanAmount, arrangement) => {
  try {
    const response = await fetch('http://localhost:3000/api/co-lending/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_number: applicationNumber,
        loan_amount: loanAmount,
        arrangement: arrangement
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Transaction created:', data.data.transaction_id);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

**4. Process Distributed Loan:**
```javascript
const processDistributedLoan = async (transactionId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/co-lending/process/${transactionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Processing result:', data.data.processing_summary);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

**5. Get Analytics:**
```javascript
const getAnalytics = async (dateRange = 30) => {
  try {
    const response = await fetch(`http://localhost:3000/api/co-lending/analytics?date_range=${dateRange}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Analytics:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useCoLending = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPartners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/co-lending/partners');
      const data = await response.json();
      
      if (data.success) {
        setPartners(data.data.partners);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getOptimalArrangement = async (loanAmount, cibilScore, loanPurpose) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/co-lending/optimal-arrangement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loan_amount: loanAmount,
          cibil_score: cibilScore,
          loan_purpose: loanPurpose
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        setError(data.message);
        return null;
      }
    } catch (error) {
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPartners();
  }, []);

  return {
    partners,
    loading,
    error,
    getPartners,
    getOptimalArrangement
  };
};

export default useCoLending;
```

### Axios Configuration

```javascript
import axios from 'axios';

// Create axios instance
const coLendingAPI = axios.create({
  baseURL: 'http://localhost:3000/api/co-lending',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
coLendingAPI.interceptors.request.use(
  (config) => {
    // Add request ID
    config.headers['x-request-id'] = `frontend_${Date.now()}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
coLendingAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default coLendingAPI;
```

---

## 🚀 Complete Workflow Example

Here's a complete example of the co-lending workflow:

```javascript
const completeCoLendingWorkflow = async (applicationData) => {
  try {
    // 1. Get optimal arrangement
    const arrangement = await getOptimalArrangement(
      applicationData.loan_amount,
      applicationData.cibil_score,
      applicationData.loan_purpose
    );
    
    if (!arrangement) {
      throw new Error('Failed to get optimal arrangement');
    }
    
    // 2. Create transaction
    const transaction = await createTransaction(
      applicationData.application_number,
      applicationData.loan_amount,
      arrangement
    );
    
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }
    
    // 3. Process distributed loan
    const processingResult = await processDistributedLoan(transaction.transaction_id);
    
    if (!processingResult) {
      throw new Error('Failed to process distributed loan');
    }
    
    // 4. Check processing status
    if (processingResult.processing_summary.overall_status === 'success') {
      console.log('✅ Co-lending workflow completed successfully');
      return {
        success: true,
        transaction_id: transaction.transaction_id,
        arrangement: arrangement,
        processing_result: processingResult
      };
    } else {
      console.log('⚠️ Partial success or failure in processing');
      return {
        success: false,
        transaction_id: transaction.transaction_id,
        arrangement: arrangement,
        processing_result: processingResult
      };
    }
    
  } catch (error) {
    console.error('❌ Co-lending workflow failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Usage
const applicationData = {
  application_number: 'APP_2025_001',
  loan_amount: 500000,
  cibil_score: 750,
  loan_purpose: 'personal'
};

completeCoLendingWorkflow(applicationData)
  .then(result => {
    if (result.success) {
      console.log('Workflow completed:', result);
    } else {
      console.log('Workflow failed:', result);
    }
  });
```

---

## 📝 Notes

1. **Request IDs**: All requests include a `requestId` for tracking and debugging
2. **Error Handling**: Always check the `success` field in responses
3. **Validation**: Required fields are validated on the server side
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **Authentication**: Add authentication headers as needed for production
6. **CORS**: Ensure CORS is properly configured for your frontend domain

---

## ✅ Testing Checklist

- [ ] Health check endpoint
- [ ] Get all partners
- [ ] Create new partner
- [ ] Update partner
- [ ] Get all ratios
- [ ] Create new ratio
- [ ] Update ratio
- [ ] Get optimal arrangement
- [ ] Create transaction
- [ ] Get transactions
- [ ] Process distributed loan
- [ ] Get analytics
- [ ] Get portfolio data
- [ ] Get settlements
- [ ] Get API logs
- [ ] Error handling
- [ ] Validation errors
- [ ] Network errors

---

**🎉 Your co-lending system is ready for frontend integration!**
