# 📋 Dashboard API Postman Collection Guide

## 🚀 Quick Start

### 1. Import the Collection
1. Open Postman
2. Click **Import** button
3. Select the `DASHBOARD_API_POSTMAN_COLLECTION.json` file
4. The collection will be imported with all endpoints ready to use

### 2. Configure Environment Variables
The collection uses these variables:
- `base_url`: `http://localhost:3000/api/dashboard` (default)
- `application_number`: Auto-populated from responses

### 3. Start Testing
1. Ensure your server is running (`npm start`)
2. Start with **Health Check** to verify connectivity
3. Run through the collection systematically

---

## 📊 Collection Structure

### 🔍 Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Verify API connectivity
- **Expected Response**: 200 OK with health status

### 🏢 LOS Dashboard
**Loan Origination System endpoints for application management**

1. **LOS Overview**
   - **Endpoint**: `GET /los/overview`
   - **Purpose**: Get comprehensive LOS dashboard metrics
   - **Data**: Total applications, status distribution, CIBIL analytics, processing metrics

2. **Applications List**
   - **Endpoint**: `GET /los/applications`
   - **Query Parameters**:
     - `status`: Filter by status (pending, approved, rejected, conditional_approval)
     - `limit`: Records per page (default: 50, max: 100)
     - `offset`: Records to skip (default: 0)
     - `search`: Search by application number, name, or mobile
     - `stage`: Filter by stage (stage_1, stage_2)

3. **Application Details**
   - **Endpoint**: `GET /los/applications/{application_number}`
   - **Purpose**: Get complete application information
   - **Note**: `application_number` is auto-populated from Applications List response

4. **Analytics Endpoints**:
   - **Applications Trend**: `GET /los/analytics?type=applications_trend&period=7d`
   - **CIBIL Distribution**: `GET /los/analytics?type=cibil_distribution`
   - **Processing Time**: `GET /los/analytics?type=processing_time`

### 💼 LMS Dashboard
**Loan Management System endpoints for portfolio management**

1. **LMS Overview**
   - **Endpoint**: `GET /lms/overview`
   - **Purpose**: Get comprehensive LMS dashboard metrics
   - **Data**: Portfolio overview, performance metrics, customer analytics, financial analytics

2. **Loans List**
   - **Endpoint**: `GET /lms/loans`
   - **Purpose**: Get approved loans for portfolio management
   - **Query Parameters**: Same as Applications List

3. **Loan Details**
   - **Endpoint**: `GET /lms/loans/{application_number}`
   - **Purpose**: Get detailed loan information

4. **Revenue Analytics**
   - **Endpoint**: `GET /lms/analytics?type=revenue_analytics`
   - **Purpose**: Get financial analytics and revenue data

### 🔄 Legacy Dashboard
**Backward compatibility endpoints**

1. **Recent Activities**
   - **Endpoint**: `GET /dashboard/recent-activities?limit=10`
   - **Purpose**: Get recent application activities with timestamps

2. **Dashboard Stats**
   - **Endpoint**: `GET /dashboard/stats`
   - **Purpose**: Get combined LOS and LMS statistics

3. **Status Distribution**
   - **Endpoint**: `GET /dashboard/status-distribution`
   - **Purpose**: Get application status breakdown

4. **Disbursement Trends**
   - **Endpoint**: `GET /dashboard/disbursement-trends?period=30d`
   - **Purpose**: Get time-series disbursement data

5. **Risk Distribution**
   - **Endpoint**: `GET /dashboard/risk-distribution`
   - **Purpose**: Get CIBIL score-based risk categorization

### 🔗 Combined Dashboard
- **Endpoint**: `GET /combined`
- **Purpose**: Get both LOS and LMS data in single request

---

## 🧪 Testing Workflow

### Step 1: Health Check
```bash
GET {{base_url}}/health
```
**Expected Response**:
```json
{
  "success": true,
  "message": "Dashboard API is healthy",
  "timestamp": "2025-08-28T06:59:56.217Z",
  "version": "1.0.0"
}
```

### Step 2: LOS Overview
```bash
GET {{base_url}}/los/overview
```
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_applications": 4,
      "pending_applications": 0,
      "approved_applications": 0,
      "rejected_applications": 0,
      "conditional_approval": 4
    },
    "stage_distribution": {
      "stage_2": 4
    },
    "cibil_analytics": {
      "average_score": "742.5",
      "score_distribution": {
        "300-500": 0,
        "501-700": 1,
        "701-800": 3,
        "801-900": 0
      },
      "total_with_cibil": 4
    }
  }
}
```

### Step 3: Applications List
```bash
GET {{base_url}}/los/applications?limit=10&offset=0
```
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "application_number": "EL_1756357120212_vqutijowi",
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
      "total": 4,
      "limit": 10,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### Step 4: Application Details
```bash
GET {{base_url}}/los/applications/{{application_number}}
```
**Note**: `application_number` is automatically set from the previous response.

### Step 5: Analytics Testing
Test different analytics types:
- Applications Trend: `?type=applications_trend&period=7d`
- CIBIL Distribution: `?type=cibil_distribution`
- Processing Time: `?type=processing_time`

### Step 6: LMS Testing
Follow the same pattern for LMS endpoints:
1. LMS Overview
2. Loans List
3. Revenue Analytics

### Step 7: Legacy Endpoints
Test all legacy endpoints for backward compatibility:
1. Recent Activities
2. Dashboard Stats
3. Status Distribution
4. Disbursement Trends
5. Risk Distribution

### Step 8: Combined Dashboard
```bash
GET {{base_url}}/combined
```

---

## 🔧 Advanced Features

### Automatic Tests
The collection includes automatic tests that run on every request:
- ✅ Status code validation (200)
- ✅ Response structure validation
- ✅ Response time validation (< 5 seconds)
- ✅ Automatic application number extraction

### Pre-request Scripts
- Automatically adds `X-Request-ID` header
- Logs request details to console

### Environment Variables
- `base_url`: Configure for different environments
- `application_number`: Auto-populated for detail requests

### Query Parameter Examples

#### Applications List with Filters
```bash
# All applications
GET {{base_url}}/los/applications

# Approved applications only
GET {{base_url}}/los/applications?status=approved

# Search by name
GET {{base_url}}/los/applications?search=JASHUVA

# Pagination
GET {{base_url}}/los/applications?limit=5&offset=10

# Stage filter
GET {{base_url}}/los/applications?stage=stage_2
```

#### Analytics with Different Periods
```bash
# 7 days trend
GET {{base_url}}/los/analytics?type=applications_trend&period=7d

# 30 days trend
GET {{base_url}}/los/analytics?type=applications_trend&period=30d

# 90 days trend
GET {{base_url}}/los/analytics?type=applications_trend&period=90d
```

---

## 🚨 Error Handling

### Common Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Route GET /api/dashboard/invalid-endpoint not found",
  "availableRoutes": [...],
  "timestamp": "2025-08-28T06:59:56.217Z"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid analytics type",
  "timestamp": "2025-08-28T06:59:56.217Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to generate LOS dashboard data",
  "details": "Error message details",
  "timestamp": "2025-08-28T06:59:56.217Z"
}
```

---

## 📈 Performance Testing

### Response Time Expectations
- **Health Check**: < 100ms
- **Overview endpoints**: < 500ms
- **List endpoints**: < 1000ms
- **Analytics endpoints**: < 2000ms
- **Combined dashboard**: < 3000ms

### Load Testing
Use Postman's Collection Runner to:
1. Run all endpoints in sequence
2. Test with different query parameters
3. Verify response consistency
4. Monitor response times

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Refused
- **Cause**: Server not running
- **Solution**: Start server with `npm start`

#### 2. 404 Errors
- **Cause**: Wrong base URL or endpoint
- **Solution**: Verify `base_url` variable and endpoint path

#### 3. Empty Responses
- **Cause**: No application data available
- **Solution**: Run loan application tests first to generate data

#### 4. Slow Response Times
- **Cause**: Large dataset or server issues
- **Solution**: Check server logs and optimize queries

### Debug Steps
1. Check server health: `GET {{base_url}}/health`
2. Verify base URL in collection variables
3. Check server logs for errors
4. Test with smaller limit values
5. Verify application data exists

---

## 📝 Best Practices

### Testing Order
1. Start with Health Check
2. Test LOS endpoints first
3. Test LMS endpoints
4. Test legacy endpoints
5. Test combined dashboard
6. Test error scenarios

### Data Validation
- Verify response structure
- Check data types and formats
- Validate pagination logic
- Test filtering functionality

### Performance Monitoring
- Monitor response times
- Check for memory leaks
- Verify error handling
- Test concurrent requests

---

## 🎯 Success Criteria

### All Tests Should Pass
- ✅ Status code: 200
- ✅ Response structure: Valid JSON
- ✅ Success field: true
- ✅ Response time: < 5 seconds
- ✅ Data consistency: Valid across endpoints

### Expected Data Quality
- Real application data (not empty)
- Consistent timestamps
- Valid CIBIL scores
- Proper pagination
- Accurate calculations

---

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify endpoint documentation
3. Test with curl commands
4. Review error responses
5. Check data availability

The collection is designed to be comprehensive and self-documenting. Each request includes descriptions and expected responses to help with testing and debugging.
