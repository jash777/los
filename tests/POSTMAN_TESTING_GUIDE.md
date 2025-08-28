# 🧪 Complete Postman Testing Guide for LOS

## 🚀 Quick Start

### 1. Start Your System
```bash
# Start both services
npm run start:all
```

### 2. Import Postman Collection
1. Open Postman
2. Click "Import" 
3. Select `LOS_Complete_Postman_Collection.json`
4. Collection will be imported with all 30+ test requests

### 3. Set Environment Variables (Optional)
The collection has default values, but you can customize:
- `base_url`: http://localhost:3000 (LOS Server)
- `simulator_url`: http://localhost:4000 (Third-Party Simulator)
- `application_number`: Auto-populated during testing

## 📋 Test Categories

### 🏥 System Health & Status (4 requests)
- **Main LOS Health Check** - Verify main server is running
- **Third-Party Simulator Health** - Verify simulator is running  
- **System Statistics** - Get database and processing stats
- **Third-Party Services Status** - Check all simulator services

### 🎯 Stage 1: Pre-Qualification (2 requests)
- **Submit Pre-Qualification (High Income)** - Should pass ✅
- **Submit Pre-Qualification (Low Income)** - Should fail ❌
- **Check Pre-Qualification Status** - Get processing status

### 📋 Stage 2: Application Processing (2 requests)
- **Process Application** - Document verification and additional info
- **Check Application Processing Status** - Get processing status

### 🔍 Stage 3: Underwriting (2 requests)
- **Process Underwriting** - Risk assessment and financial analysis
- **Check Underwriting Status** - Get processing status

### ✅ Stage 4: Credit Decision (3 requests)
- **Make Credit Decision (Approval)** - Approve with terms
- **Make Credit Decision (Rejection)** - Example rejection
- **Check Credit Decision Status** - Get decision status

### 🔍 Stage 6: Quality Check (2 requests)
- **Perform Quality Check** - Final verification before funding
- **Check Quality Check Status** - Get quality check status

### 💰 Stage 7: Loan Funding (2 requests)
- **Process Loan Funding** - Disbursement processing
- **Check Loan Funding Status** - Get funding status

### 🔧 Third-Party API Tests (6 requests)
- **Test PAN Verification (Valid)** - Should return verified ✅
- **Test PAN Verification (Invalid)** - Should return error ❌
- **Test CIBIL Credit Score (Excellent)** - 750+ score
- **Test CIBIL Credit Score (Poor)** - 550- score
- **Test Bank Statement Analysis** - Comprehensive financial analysis
- **Test Employment Verification** - HR-level employment details

### 📊 Complete Workflow Tests (2 requests)
- **Test Complete Workflow** - End-to-end success case
- **Get All Applications** - Admin view of all applications

## 🎯 Recommended Testing Flow

### Option 1: Complete Workflow Test
1. **System Health Check** - Verify everything is running
2. **Submit Pre-Qualification** - Start with high income case
3. **Process through all 7 stages** in sequence:
   - Application Processing
   - Underwriting  
   - Credit Decision
   - Quality Check
   - Loan Funding

### Option 2: Individual Stage Testing
Test each stage independently with different scenarios:
- High income vs Low income applicants
- Good credit vs Poor credit profiles
- Different loan amounts and purposes

### Option 3: Third-Party API Testing
Test all external integrations:
- Valid vs Invalid PAN numbers
- Different credit score profiles
- Various bank account scenarios
- Employment verification cases

## 📊 Expected Results

### ✅ Success Responses
```json
{
  "success": true,
  "message": "Stage completed successfully",
  "data": {
    "applicationNumber": "LOS_20240827_001",
    "status": "completed",
    "processingTime": "245ms"
  }
}
```

### ❌ Error Responses
```json
{
  "success": false,
  "message": "Pre-qualification failed",
  "error": "Insufficient income for requested loan amount",
  "data": {
    "applicationNumber": "LOS_20240827_002",
    "status": "rejected"
  }
}
```

## 🔧 Automated Testing

### Run Complete System Test
```bash
# Run automated test suite
node test-complete-system.js
```

This will:
- Test all 7 stages automatically
- Verify third-party integrations
- Generate detailed test report
- Complete in ~30 seconds

### Sample Output
```
🚀 Starting Complete Loan Origination System Test
============================================================
✅ System Health Check - PASSED (156ms)
✅ Third-Party API Integration - PASSED (892ms)
✅ Stage 1: Pre-Qualification - PASSED (234ms)
✅ Stage 2: Application Processing - PASSED (187ms)
✅ Stage 3: Underwriting - PASSED (203ms)
✅ Stage 4: Credit Decision - PASSED (178ms)
✅ Stage 6: Quality Check - PASSED (165ms)
✅ Stage 7: Loan Funding - PASSED (198ms)

📊 Test Summary
============================================================
✅ Passed: 8
❌ Failed: 0
⏱️  Total Time: 2213ms
📋 Test Application: LOS_20240827_001

🎉 All tests passed! Your Loan Origination System is working perfectly!
```

## 🎯 Test Data Profiles

### High Income Applicant (Should Pass)
- **Name**: Rajesh Kumar Sharma
- **PAN**: ABCDE1234F
- **Income**: ₹75,000/month
- **Loan Amount**: ₹5,00,000
- **Credit Score**: 750+

### Low Income Applicant (Should Fail)
- **Name**: Amit Singh  
- **PAN**: FGHIJ5678K
- **Income**: ₹25,000/month
- **Loan Amount**: ₹10,00,000
- **Credit Score**: 650-

### Business Applicant
- **Name**: Priya Sharma
- **PAN**: KLMNO5678P
- **Income**: ₹85,000/month
- **Employment**: Self-employed
- **Loan Amount**: ₹7,50,000

## 🔍 Debugging Tips

### Check Logs
```bash
# View real-time logs
tail -f logs/application.log
```

### Database Verification
```sql
-- Check application status
SELECT application_number, current_stage, status 
FROM loan_applications 
ORDER BY created_at DESC LIMIT 5;

-- Check stage processing
SELECT application_number, stage_name, status, completed_at 
FROM stage_processing 
WHERE application_number = 'YOUR_APP_NUMBER';
```

### Common Issues
1. **Connection Refused** - Services not started
2. **Database Errors** - Run `node create-tables.js`
3. **Invalid Application Number** - Check if pre-qualification passed
4. **Third-Party Timeouts** - Simulator might be overloaded

## 🎉 Success Indicators

### All Systems Working ✅
- Health checks return 200 OK
- Pre-qualification creates application number
- All stages process successfully
- Third-party APIs return realistic data
- Database stores all transaction data
- Complete workflow takes 2-5 seconds

### Ready for Production 🚀
- All Postman tests pass
- Automated test suite passes
- Database has proper audit trails
- External API integration working
- Error handling functioning correctly

---

**Your complete 7-stage Loan Origination System is ready for comprehensive testing!** 🎊