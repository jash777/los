# 📊 Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive endpoints for both LOS (Loan Origination System) and LMS (Loan Management System) dashboards. These endpoints deliver real-time analytics, application management, and portfolio insights.

## Base URL
```
http://localhost:3000/api/dashboard
```

## Authentication
Currently, the API doesn't require authentication for development purposes. In production, implement proper authentication middleware.

## Response Format
All endpoints return responses in the following format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-08-28T05:37:41.235Z"
}
```

## 📋 API Endpoints

### 1. Health Check
**GET** `/health`

Check if the dashboard API is healthy and running.

**Response:**
```json
{
  "success": true,
  "message": "Dashboard API is healthy",
  "timestamp": "2025-08-28T05:37:41.235Z",
  "version": "1.0.0"
}
```

---

### 2. LOS Dashboard Overview
**GET** `/los/overview`

Get comprehensive overview data for the Loan Origination System dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_applications": 15,
      "pending_applications": 3,
      "approved_applications": 8,
      "rejected_applications": 2,
      "conditional_approval": 2
    },
    "stage_distribution": {
      "stage_1": 3,
      "stage_2": 12
    },
    "cibil_analytics": {
      "average_score": 742.5,
      "score_distribution": {
        "300-500": 0,
        "501-700": 2,
        "701-800": 10,
        "801-900": 3
      },
      "total_with_cibil": 15
    },
    "processing_metrics": {
      "average_processing_time": 2.5,
      "fastest_processing": 0.5,
      "slowest_processing": 8.2
    },
    "loan_analytics": {
      "total_loan_amount": 7500000,
      "average_loan_amount": 500000,
      "loan_amount_distribution": {
        "0-2L": 2,
        "2L-5L": 8,
        "5L-10L": 4,
        "10L+": 1
      }
    }
  }
}
```

---

### 3. LMS Dashboard Overview
**GET** `/lms/overview`

Get comprehensive overview data for the Loan Management System dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio_overview": {
      "total_portfolio_value": 8500000,
      "active_loans": 10,
      "disbursed_amount": 7225000,
      "pending_amount": 1275000,
      "average_loan_size": 850000
    },
    "performance_metrics": {
      "emi_collection_rate": 95.5,
      "overdue_loans": 1,
      "npa_percentage": 2.3,
      "average_emi_amount": 23569.44
    },
    "customer_analytics": {
      "total_borrowers": 10,
      "new_borrowers_this_month": 1,
      "repeat_borrowers": 2,
      "customer_satisfaction_score": 4.2
    },
    "financial_analytics": {
      "total_interest_earned": 722500,
      "processing_fees_collected": 85000,
      "total_revenue": 807500,
      "revenue_growth_rate": 12.5
    }
  }
}
```

---

### 4. Applications List (LOS)
**GET** `/los/applications`

Get a paginated list of all loan applications with filtering options.

**Query Parameters:**
- `status` (optional): Filter by application status (`pending`, `approved`, `rejected`, `conditional_approval`)
- `stage` (optional): Filter by current stage (`stage_1`, `stage_2`)
- `search` (optional): Search by application number, applicant name, or mobile number
- `limit` (optional): Number of records per page (default: 50, max: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Example Request:**
```
GET /api/dashboard/los/applications?status=approved&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "application_number": "EL_1756359392860_f97i4u1l4",
        "applicant_name": "JASHUVA PEYYALA",
        "status": "conditional_approval",
        "stage": "stage_2",
        "loan_amount": 500000,
        "cibil_score": 742,
        "created_date": "2025-08-28T05:37:41.235Z",
        "last_updated": "2025-08-28T05:37:45.278Z",
        "processing_time": 2.5
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

### 5. Loans List (LMS)
**GET** `/lms/loans`

Get a paginated list of approved loans for portfolio management.

**Query Parameters:** Same as applications list

**Response:** Same format as applications list, but only includes approved loans

---

### 6. Application Details
**GET** `/los/applications/:applicationNumber`

Get detailed information for a specific application.

**Path Parameters:**
- `applicationNumber`: The unique application identifier

**Example Request:**
```
GET /api/dashboard/los/applications/EL_1756359392860_f97i4u1l4
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application_info": {
      "application_number": "EL_1756359392860_f97i4u1l4",
      "status": "conditional_approval",
      "current_stage": "stage_2",
      "created_at": "2025-08-28T05:37:41.235Z",
      "updated_at": "2025-08-28T05:37:45.278Z"
    },
    "stage_1_data": { ... },
    "stage_2_data": { ... },
    "third_party_data": { ... }
  }
}
```

---

### 7. Analytics Data
**GET** `/los/analytics` or **GET** `/lms/analytics`

Get various analytics data for charts and reports.

**Query Parameters:**
- `type` (required): Type of analytics data
  - `applications_trend`: Daily application trends
  - `cibil_distribution`: CIBIL score distribution
  - `processing_time`: Processing time analytics
  - `revenue_analytics`: Revenue and financial analytics (LMS only)
- `period` (optional): Time period for trend data (`7d`, `30d`, `90d`, default: `30d`)

**Example Requests:**
```
GET /api/dashboard/los/analytics?type=applications_trend&period=7d
GET /api/dashboard/los/analytics?type=cibil_distribution
GET /api/dashboard/lms/analytics?type=revenue_analytics
```

**Response Examples:**

**Applications Trend:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-08-22",
      "applications": 2,
      "approved": 1,
      "rejected": 0
    },
    {
      "date": "2025-08-23",
      "applications": 3,
      "approved": 2,
      "rejected": 1
    }
  ]
}
```

**CIBIL Distribution:**
```json
{
  "success": true,
  "data": {
    "average_score": 742.5,
    "distribution": {
      "300-500": 0,
      "501-700": 2,
      "701-800": 10,
      "801-900": 3
    },
    "total_applications_with_cibil": 15,
    "score_ranges": {
      "excellent": 3,
      "good": 10,
      "fair": 2,
      "poor": 0
    }
  }
}
```

**Processing Time Analytics:**
```json
{
  "success": true,
  "data": {
    "average_time": 2.5,
    "fastest": 0.5,
    "slowest": 8.2,
    "time_distribution": {
      "0-2h": 8,
      "2-6h": 5,
      "6-24h": 2,
      "24h+": 0
    }
  }
}
```

**Revenue Analytics:**
```json
{
  "success": true,
  "data": {
    "total_loan_amount": 8500000,
    "processing_fees": 85000,
    "estimated_interest_revenue": 722500,
    "revenue_per_application": 8500
  }
}
```

---

### 8. Combined Dashboard
**GET** `/combined`

Get both LOS and LMS dashboard data in a single request.

**Response:**
```json
{
  "success": true,
  "data": {
    "los": { /* LOS dashboard data */ },
    "lms": { /* LMS dashboard data */ }
  }
}
```

---

## 📊 Dashboard Features

### LOS Dashboard Features:
1. **Application Overview**
   - Total applications count
   - Status distribution (pending, approved, rejected, conditional approval)
   - Stage-wise distribution

2. **CIBIL Analytics**
   - Average CIBIL score
   - Score distribution across ranges
   - Applications with CIBIL data

3. **Processing Metrics**
   - Average processing time
   - Fastest and slowest processing times
   - Time distribution analysis

4. **Loan Analytics**
   - Total loan amount requested
   - Average loan amount
   - Loan amount distribution

5. **Application Management**
   - List all applications with filters
   - Search functionality
   - Pagination support
   - Detailed application view

### LMS Dashboard Features:
1. **Portfolio Overview**
   - Total portfolio value
   - Active loans count
   - Disbursed vs pending amounts
   - Average loan size

2. **Performance Metrics**
   - EMI collection rate
   - Overdue loans tracking
   - NPA percentage
   - Average EMI amount

3. **Customer Analytics**
   - Total borrowers
   - New borrowers this month
   - Repeat borrowers
   - Customer satisfaction score

4. **Financial Analytics**
   - Total interest earned
   - Processing fees collected
   - Total revenue
   - Revenue growth rate

## 🔧 Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **404**: Not Found (application not found)
- **500**: Internal Server Error

Error responses include:
```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message",
  "timestamp": "2025-08-28T05:37:41.235Z"
}
```

## 📈 Usage Examples

### Frontend Integration Examples:

**React/Vue.js:**
```javascript
// Fetch LOS dashboard data
const fetchLOSDashboard = async () => {
  const response = await fetch('/api/dashboard/los/overview');
  const data = await response.json();
  return data.data;
};

// Fetch applications with filters
const fetchApplications = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/dashboard/los/applications?${params}`);
  const data = await response.json();
  return data.data;
};

// Fetch analytics data
const fetchAnalytics = async (type, period = '30d') => {
  const response = await fetch(`/api/dashboard/los/analytics?type=${type}&period=${period}`);
  const data = await response.json();
  return data.data;
};
```

**Angular:**
```typescript
// Dashboard service
@Injectable()
export class DashboardService {
  private baseUrl = '/api/dashboard';

  getLOSDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/los/overview`);
  }

  getApplications(filters: any): Observable<any> {
    const params = new HttpParams({ fromObject: filters });
    return this.http.get(`${this.baseUrl}/los/applications`, { params });
  }

  getAnalytics(type: string, period: string = '30d'): Observable<any> {
    return this.http.get(`${this.baseUrl}/los/analytics`, {
      params: { type, period }
    });
  }
}
```

## 🚀 Performance Considerations

1. **Caching**: Consider implementing Redis caching for dashboard data
2. **Pagination**: Always use pagination for large datasets
3. **Filtering**: Use server-side filtering to reduce data transfer
4. **Real-time Updates**: Consider WebSocket integration for real-time dashboard updates

## 🔒 Security Considerations

1. **Authentication**: Implement proper authentication for production
2. **Authorization**: Add role-based access control
3. **Rate Limiting**: Already implemented in the main application
4. **Data Validation**: Validate all input parameters
5. **Logging**: All requests are logged with request IDs

## 📝 Testing

Use the provided test script to verify all endpoints:
```bash
node test_dashboard_endpoints.js
```

This will test all dashboard endpoints and provide a comprehensive report of their functionality.
