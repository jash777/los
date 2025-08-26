# API ID Mapping Guide - Loan Management System

## 🔍 **Issue Identified**

The pre-qualification API returns **two different IDs**, and the Postman collection was capturing the wrong one:

### **API Response Structure:**
```json
{
  "success": true,
  "data": {
    "applicationId": "APP_1756146701919_g8yxzadee",  // ← CORRECT ID to use
    "status": "approved",
    // ... other data
  },
  "requestId": "preq_1756146701917_et4ofg2tq"       // ← Request tracking ID (not for next stage)
}
```

## ✅ **Fixed ID Mapping**

| Stage | Variable Name | Correct Field Path | Example Value |
|-------|---------------|-------------------|---------------|
| Pre-qualification | `prequalification_id` | `response.data.applicationId` | `APP_1756146701919_g8yxzadee` |
| Loan Application | `loan_application_id` | `response.data.applicationId` | `LOANAPP_xxx_xxx` |
| Application Processing | `application_processing_id` | `response.data.applicationId` | `APPPROC_xxx_xxx` |
| Underwriting | `underwriting_id` | `response.data.underwritingId` | `UW_xxx_xxx` |
| Credit Decision | `credit_decision_id` | `response.data.creditDecisionId` | `CD_xxx_xxx` |
| Quality Check | `quality_check_id` | `response.data.qualityCheckId` | `QC_xxx_xxx` |
| Loan Funding | `loan_funding_id` | `response.data.loanFundingId` | `LF_xxx_xxx` |

## 🔧 **Updated Test Scripts**

The Postman collection now includes **robust ID capture logic** that:

1. **Tries multiple field name variations** (camelCase, snake_case)
2. **Logs captured IDs** to console for debugging
3. **Falls back to applicationId** if specific ID fields aren't found
4. **Handles API response inconsistencies**

### **Example Test Script:**
```javascript
pm.test('Pre-qualification processed successfully', () => {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    
    // Capture the correct applicationId from the response
    if (response.data && response.data.applicationId) {
        pm.collectionVariables.set('prequalification_id', response.data.applicationId);
        console.log('Pre-qualification ID captured:', response.data.applicationId);
    }
    
    // Also capture requestId for reference
    if (response.requestId) {
        pm.collectionVariables.set('prequalification_request_id', response.requestId);
        console.log('Request ID captured:', response.requestId);
    }
});
```

## 🚀 **Testing Workflow**

### **Step 1: Pre-qualification**
```bash
POST /api/loan-origination/pre-qualification/process
```
**Response:** `applicationId: "APP_1756146701919_g8yxzadee"`
**Captured as:** `{{prequalification_id}}`

### **Step 2: Check Status**
```bash
GET /api/loan-origination/pre-qualification/status/{{prequalification_id}}
```
**Uses:** `APP_1756146701919_g8yxzadee` ✅

### **Step 3: Loan Application**
```bash
POST /api/loan-origination/loan-application/process
Body: { "pre_qualification_id": "{{prequalification_id}}" }
```
**Uses:** `APP_1756146701919_g8yxzadee` ✅

## 🐛 **Debugging Tips**

### **Check Console Logs**
The updated test scripts log all captured IDs:
```
Pre-qualification ID captured: APP_1756146701919_g8yxzadee
Request ID captured: preq_1756146701917_et4ofg2tq
```

### **Verify Variables**
In Postman, check the **Variables** tab to see captured values:
- `prequalification_id` = `APP_1756146701919_g8yxzadee`
- `prequalification_request_id` = `preq_1756146701917_et4ofg2tq`

### **Manual Override**
If automatic capture fails, manually set the variable:
```javascript
pm.collectionVariables.set('prequalification_id', 'APP_1756146701919_g8yxzadee');
```

## 📋 **API Endpoint Patterns**

### **Status Check Endpoints:**
- Pre-qualification: `/status/{applicationId}` ← Use `applicationId`
- Loan Application: `/status/{applicationId}` ← Use `applicationId`
- Other stages: `/status/{stageSpecificId}` ← Use stage-specific ID

### **Processing Endpoints:**
- Stage 1: `POST /pre-qualification/process` → Returns `applicationId`
- Stage 2: `POST /loan-application/process` → Requires `pre_qualification_id`
- Stage 3: `POST /application-processing/process` → Requires `loan_application_id`
- And so on...

## ✅ **Verification**

After importing the updated collection:

1. **Run Pre-qualification** → Should capture `APP_xxx` format ID
2. **Check Console** → Should see "Pre-qualification ID captured: APP_xxx"
3. **Run Status Check** → Should use the correct ID and return 200 OK
4. **Proceed to Stage 2** → Should pass the correct ID in request body

The collection is now **robust and handles API response variations** automatically!