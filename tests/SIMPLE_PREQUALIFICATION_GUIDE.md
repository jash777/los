# 🚀 Simplified Pre-Qualification Guide

## Overview

The pre-qualification stage has been simplified to collect only the **essential information** needed for a basic eligibility check. This follows real-world lending practices where minimal information is collected initially.

## Required Fields (Only 4!)

### 1. **Applicant Name** (`applicantName`)
- Full name of the applicant
- Minimum 2 characters
- Used for identity verification

### 2. **Date of Birth** (`dateOfBirth`)
- Format: `YYYY-MM-DD`
- Used for age verification (18-70 years)
- Required for CIBIL check

### 3. **Phone Number** (`phone`)
- 10-digit Indian mobile number
- Must start with 6, 7, 8, or 9
- Used for verification and contact

### 4. **PAN Number** (`panNumber`)
- Format: `AAAAA0000A` (5 letters, 4 digits, 1 letter)
- Used for CIBIL credit score check
- Primary identity verification

## API Endpoint

```
POST /api/pre-qualification/process
```

## Sample Request

```json
{
  "applicantName": "Rajesh Kumar Sharma",
  "dateOfBirth": "1985-06-15",
  "phone": "9876543210",
  "panNumber": "ABCDE1234F"
}
```

## What Happens During Pre-Qualification

### 1. **Basic Validation**
- Name format and length
- Age verification (18-70 years)
- Phone number format
- PAN number format

### 2. **PAN Verification**
- Verifies PAN number with government records
- Checks name matching
- Validates PAN status

### 3. **CIBIL Credit Check**
- Fetches basic credit score
- Checks credit history
- Determines creditworthiness

### 4. **Eligibility Decision**
- Combines all verification results
- Provides preliminary approval/rejection
- Suggests next steps

## Sample Responses

### ✅ Approved Pre-Qualification

```json
{
  "success": true,
  "data": {
    "application_number": "LOS20250827001",
    "eligibility_result": {
      "eligible": true,
      "estimatedLoanAmount": 500000,
      "riskCategory": "low",
      "reasons": ["Good credit score", "Valid identity verification"]
    },
    "verification_results": {
      "pan_verification": {
        "status": "verified",
        "name_match": true
      },
      "cibil_score": {
        "score": 750,
        "status": "good"
      }
    },
    "next_steps": {
      "phase": "application-processing",
      "message": "Proceed with full loan application"
    }
  }
}
```

### ❌ Rejected Pre-Qualification

```json
{
  "success": true,
  "data": {
    "application_number": "LOS20250827002",
    "eligibility_result": {
      "eligible": false,
      "reasons": ["Credit score below minimum threshold", "High risk profile"]
    },
    "verification_results": {
      "pan_verification": {
        "status": "verified",
        "name_match": true
      },
      "cibil_score": {
        "score": 580,
        "status": "poor"
      }
    },
    "next_steps": {
      "phase": "rejected",
      "message": "Application does not meet pre-qualification criteria"
    }
  }
}
```

## Testing

### Quick Test with cURL

```bash
curl -X POST http://localhost:3000/api/pre-qualification/process \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicantName": "Rajesh Kumar Sharma",
    "dateOfBirth": "1985-06-15", 
    "phone": "9876543210",
    "panNumber": "ABCDE1234F"
  }'
```

### Test with Node.js Script

```bash
node test-simple-prequalification.js
```

## Validation Rules

### Age Validation
- **Minimum Age**: 18 years
- **Maximum Age**: 70 years
- Calculated from `dateOfBirth`

### Phone Validation
- Must be 10 digits
- Must start with 6, 7, 8, or 9
- Indian mobile number format

### PAN Validation
- Format: `AAAAA0000A`
- 5 uppercase letters + 4 digits + 1 uppercase letter
- Must be valid with government records

## Error Responses

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "applicantName is required",
    "Invalid PAN number format (expected: AAAAA0000A)",
    "Applicant must be at least 18 years old"
  ]
}
```

### Processing Errors

```json
{
  "success": false,
  "error": "Pre-qualification processing failed",
  "details": [
    "PAN verification failed",
    "CIBIL score below minimum threshold"
  ]
}
```

## Benefits of Simplified Pre-Qualification

### 🎯 **User Experience**
- **Quick Process**: Only 4 fields to fill
- **Fast Response**: Basic eligibility in seconds
- **Low Friction**: Minimal information required

### 🔒 **Privacy**
- **Data Minimization**: Only essential data collected
- **Reduced Risk**: Less sensitive information exposed
- **Compliance**: Follows data protection principles

### ⚡ **Performance**
- **Faster Processing**: Fewer validations required
- **Lower API Calls**: Minimal external verifications
- **Better Conversion**: Higher completion rates

### 🏦 **Business Logic**
- **Real-World Practice**: Matches industry standards
- **Risk Management**: Basic risk assessment
- **Lead Generation**: Captures qualified prospects

## Next Steps After Pre-Qualification

### If **Approved** ✅
1. **Application Processing** - Collect detailed information
2. **Document Upload** - Income proof, address proof
3. **Employment Verification** - Salary slips, employment letter
4. **Bank Statement Analysis** - Financial behavior analysis

### If **Rejected** ❌
1. **Reason Provided** - Clear rejection reasons
2. **Improvement Suggestions** - How to improve eligibility
3. **Alternative Products** - Other loan options
4. **Re-application Timeline** - When to apply again

---

**This simplified approach ensures a smooth user experience while maintaining robust risk assessment capabilities.**