# 🏦 Complete Loan Origination System - Postman Collection Guide

## 📋 Overview

This comprehensive Postman collection provides complete testing coverage for the 7-stage Loan Origination System (LOS) with real-world Indian market integrations including PAN verification, CIBIL credit checks, Aadhaar validation, and bank statement analysis.

## 🚀 Quick Setup

### Prerequisites
1. **Start Services**: Run both main LOS and third-party simulator
   ```bash
   # Terminal 1: Start main LOS service
   cd E:\LOS
   node server.js
   
   # Terminal 2: Start third-party simulator
   cd E:\LOS\third-party-simulator
   node server.js
   ```

2. **Import Collection**: Import `LOS_Complete_Postman_Collection.json` into Postman

3. **Environment Setup**: The collection includes pre-configured environment variables:
   - `base_url`: http://localhost:3000 (Main LOS API)
   - `simulator_url`: http://localhost:4000 (Third-party simulator)
   - Dynamic variables for unique testing data

## 📊 Collection Structure

### 🏥 System Health & Status
- **Main LOS Health Check**: Verify main service is running
- **Third-Party Simulator Health**: Verify simulator service is running
- **System Statistics**: Get application counts and system stats
- **Third-Party Services Status**: Check all third-party service endpoints

### 🎯 Stage 1: Pre-Qualification
- **Submit Pre-Qualification (High Income - Should Pass)**: Test successful pre-qualification
- **Check Pre-Qualification Status**: Monitor application status
- **Submit Pre-Qualification (Low Income - Should Fail)**: Test rejection scenario
- **Submit Pre-Qualification (Invalid PAN - Should Fail)**: Test validation failure

### 📝 Stage 2: Loan Application
- **Get Required Fields**: Retrieve all required fields for loan application
- **Process Loan Application**: Submit comprehensive loan application with:
  - Personal details (name, DOB, gender, marital status)
  - Contact information (addresses, phone, email)
  - Identification (PAN, Aadhaar, driving license, passport)
  - Employment details (company, designation, experience)
  - Financial information (income, expenses, existing loans)
  - Loan requirements (amount, purpose, tenure)
  - Property details (for home loans)
  - References
- **Check Loan Application Status**: Monitor processing status

### 📋 Stage 3: Application Processing
- **Process Application**: Document verification and data validation
- **Check Application Processing Status**: Monitor processing status

### 🔍 Stage 4: Underwriting
- **Process Underwriting**: Risk assessment with:
  - Employment stability analysis
  - Income consistency verification
  - Debt-to-income ratio calculation
  - Collateral valuation
  - Credit profile assessment
- **Check Underwriting Status**: Monitor underwriting results

### ✅ Stage 5: Credit Decision
- **Make Credit Decision (Approval)**: Test approval scenario with loan terms
- **Check Credit Decision Status**: Monitor decision status
- **Make Credit Decision (Rejection Example)**: Test rejection scenario

### 🔍 Stage 6: Quality Check
- **Perform Quality Check**: Final verification including:
  - Document verification score
  - Credit verification status
  - Income verification results
  - Property verification (for secured loans)
  - Compliance checks (KYC, AML)
- **Check Quality Check Status**: Monitor quality assurance results

### 💰 Stage 7: Loan Funding
- **Process Loan Funding**: Final disbursement with:
  - Disbursement details (amount, method, account)
  - Loan account setup
  - EMI schedule generation
- **Check Loan Funding Status**: Monitor funding status

### 🔧 Third-Party API Tests
- **Test PAN Verification (Valid)**: Test successful PAN verification
- **Test PAN Verification (Invalid)**: Test PAN validation failure
- **Test CIBIL Credit Score (Excellent)**: Test high credit score scenario
- **Test CIBIL Credit Score (Poor)**: Test low credit score scenario
- **Test Bank Statement Analysis**: Test account aggregator integration
- **Test Employment Verification**: Test employment validation

### 📊 Complete Workflow Tests
- **Test Complete Workflow (Success Case)**: End-to-end successful application
- **Get All Applications (Admin View)**: System statistics and application overview
- **Test End-to-End Workflow (Automated)**: Comprehensive automated testing

## 🎯 Testing Strategies

### 1. Sequential Testing (Recommended)
Run requests in the following order for complete workflow testing:
1. System Health checks
2. Pre-Qualification → Loan Application → Application Processing → Underwriting → Credit Decision → Quality Check → Loan Funding
3. Third-party API validation

### 2. Individual Stage Testing
Test specific stages independently using the application number from previous stages.

### 3. Error Scenario Testing
Use the provided negative test cases to validate error handling:
- Invalid PAN numbers
- Low income scenarios
- Missing required fields
- Invalid data formats

### 4. Load Testing
Use the automated end-to-end test for repeated execution to test system performance.

## 🔍 Key Features

### Automated Test Scripts
- **Pre-request Scripts**: Generate unique test data (emails, phone numbers)
- **Test Scripts**: Validate responses and extract application numbers
- **Environment Variables**: Automatically store and reuse application data

### Comprehensive Data Models
- **Indian Market Specific**: PAN, Aadhaar, IFSC codes, Indian addresses
- **Real-world Scenarios**: Multiple loan types, employment types, income sources
- **Edge Cases**: Invalid data, boundary conditions, error scenarios

### Third-party Integration Testing
- **PAN Verification**: SurePass-style API simulation
- **CIBIL Integration**: Credit score and report generation
- **Bank Statement Analysis**: Account aggregator simulation
- **Employment Verification**: HR system integration

## 📈 Expected Results

### Successful Flow
1. **Pre-Qualification**: `200 OK` with `decision: "approved"`
2. **Loan Application**: `200 OK` with comprehensive application data
3. **Application Processing**: `200 OK` with `decision: "approved"`
4. **Underwriting**: `200 OK` with risk assessment scores
5. **Credit Decision**: `200 OK` with loan terms and approval
6. **Quality Check**: `200 OK` with quality scores
7. **Loan Funding**: `200 OK` with disbursement details

### Error Scenarios
- **Invalid Data**: `400 Bad Request` with validation errors
- **Business Rule Violations**: `200 OK` with `decision: "rejected"`
- **System Errors**: `500 Internal Server Error` with error details

## 🛠️ Troubleshooting

### Common Issues
1. **Connection Refused**: Ensure both services are running on correct ports
2. **Application Not Found**: Check if application number is correctly set in environment
3. **Validation Errors**: Review request body format and required fields
4. **Stage Sequence**: Ensure previous stages are completed before proceeding

### Debug Tips
1. Check Postman Console for detailed logs
2. Review environment variables for correct application numbers
3. Use individual stage status endpoints to verify completion
4. Check server logs for detailed error information

## 📝 Customization

### Adding New Test Cases
1. Duplicate existing requests
2. Modify request body with new test data
3. Update test scripts for expected results
4. Add appropriate environment variables

### Environment Configuration
- Modify `base_url` and `simulator_url` for different environments
- Add authentication headers if required
- Configure timeout settings for long-running processes

## 🔗 Related Documentation
- `POSTMAN_TESTING_GUIDE.md`: Basic testing guide
- `rules-engine.json`: Business rules and validation logic
- `INTEGRATION_COMPLETE.md`: System integration details
- `PROJECT_STRUCTURE.md`: Complete system architecture

## 📞 Support

For issues or questions:
1. Check server logs in both terminals
2. Review API documentation in route files
3. Validate request formats against service schemas
4. Test individual third-party endpoints first

This collection provides comprehensive testing coverage for the complete loan origination workflow with real-world Indian market requirements and third-party integrations.