# 🧪 End-to-End Testing Guide

This guide provides comprehensive instructions for testing your Loan Origination System (LOS) from Stage 1 (Pre-Qualification) to Stage 7 (Loan Funding/Disbursement).

## 🎯 Overview

The E2E testing system includes:
- **Two test applications**: One approved path, one rejected path
- **All 7 stages**: Complete loan origination workflow
- **Manual and automated testing**: Flexible testing options
- **Real-time monitoring**: Track progress through each stage

## 🚀 Quick Start

### Method 1: Automated E2E Test (Recommended)

```bash
# Windows
run-e2e-test.bat

# Linux/Mac
./run-e2e-test.sh

# Or directly with Node.js
node src/scripts/comprehensive-end-to-end-test.js
```

### Method 2: Manual Stage Testing

```bash
# Interactive testing with manual control
node src/scripts/manual-stage-testing.js
```

### Method 3: Individual Stage Testing

```bash
# Test specific stages manually
curl -X POST http://localhost:3000/api/pre-qualification/process \
  -H "Content-Type: application/json" \
  -d @test-data/approved-applicant.json
```

## 📋 Test Scenarios

### Application 1: Approved Path
- **Profile**: Strong financial profile
- **Expected Result**: Approved through all stages
- **Final Status**: Loan disbursed

**Profile Details:**
- Name: RAJESH KUMAR SHARMA
- Income: ₹85,000/month (High income)
- CIBIL: Expected 750+ (Excellent)
- DTI Ratio: ~14% (Low debt-to-income)
- Employment: 8+ years experience
- Banking: 5+ years relationship

### Application 2: Rejected Path
- **Profile**: Weak financial profile
- **Expected Result**: Rejected at underwriting
- **Final Status**: Application rejected

**Profile Details:**
- Name: SURESH KUMAR
- Income: ₹25,000/month (Low income)
- CIBIL: Expected <600 (Poor)
- DTI Ratio: ~60% (High debt-to-income)
- Employment: 2 years experience
- Banking: 1 year relationship

## 🔄 Complete Workflow Stages

### Stage 1: Pre-Qualification
**Endpoint**: `POST /api/pre-qualification/process`

**Tests:**
- PAN verification
- CIBIL score check
- Basic eligibility assessment
- Initial risk scoring

**Expected Results:**
- Application 1: Approved with high score
- Application 2: May pass but with lower score

### Stage 2: Loan Application
**Endpoint**: `POST /api/loan-application/process/{applicationNumber}`

**Tests:**
- Employment verification
- Income assessment
- Banking relationship analysis
- Document verification
- Comprehensive risk analysis

**Expected Results:**
- Application 1: Approved, triggers automated workflow
- Application 2: Approved, triggers automated workflow

### Stage 3: Application Processing
**Endpoint**: `POST /api/application-processing/{applicationNumber}`

**Tests:**
- Document processing
- Data validation
- Cross-verification
- Compliance checks

**Expected Results:**
- Application 1: Passes all checks
- Application 2: Passes basic checks

### Stage 4: Underwriting
**Endpoint**: `POST /api/underwriting/{applicationNumber}`

**Tests:**
- Risk assessment
- Financial analysis
- Policy compliance
- Credit analysis
- DTI ratio evaluation

**Expected Results:**
- Application 1: Approved (DTI < 40%, good profile)
- Application 2: **REJECTED** (DTI > 50%, weak profile)

### Stage 5: Credit Decision
**Endpoint**: `POST /api/credit-decision/{applicationNumber}`

**Tests:**
- Final credit approval
- Loan terms determination
- Interest rate calculation
- Loan amount finalization

**Expected Results:**
- Application 1: Approved with terms
- Application 2: N/A (already rejected)

### Stage 6: Quality Check
**Endpoint**: `POST /api/quality-check/{applicationNumber}`

**Tests:**
- Final quality assurance
- Compliance validation
- Pre-disbursement checks
- Documentation completeness

**Expected Results:**
- Application 1: Passes quality checks
- Application 2: N/A (already rejected)

### Stage 7: Loan Funding
**Endpoint**: `POST /api/loan-funding/{applicationNumber}`

**Tests:**
- Disbursement processing
- Account setup
- Final loan activation
- Post-disbursement activities

**Expected Results:**
- Application 1: **LOAN DISBURSED** ✅
- Application 2: N/A (already rejected)

## 🛠️ Running Tests

### Prerequisites

1. **Start the LOS server:**
   ```bash
   npm start
   ```

2. **Verify server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

### Test Execution Options

#### Option 1: Full Automated Test

```bash
# Run complete E2E test
node src/scripts/comprehensive-end-to-end-test.js
```

**Output Example:**
```
🚀 Starting Comprehensive End-to-End LOS Testing
============================================================
Testing two applications:
📋 Application 1: Expected to be APPROVED (full workflow)
📋 Application 2: Expected to be REJECTED (fails at underwriting)
============================================================

🟢 Testing Application 1 - Approved Path
----------------------------------------
  📝 Stage 1: Pre-qualification (app1)
     ✅ Pre-qualification completed: EL_1756400000001_test1 (234ms)
     📊 Decision: approved
     📊 Score: 85

  📋 Stage 2: Loan Application (app1)
     ✅ Loan application completed (1456ms)
     📊 Status: approved
     📊 Decision: approved

  🤖 Automated Workflow: Stages 3-7 (app1)
     ✅ Automated workflow completed (3245ms)
     📊 Workflow Status: approved
     📊 Stages Processed: 5/5
        Stage 3: application_processing - approved
        Stage 4: underwriting - approved
        Stage 5: credit_decision - approved
        Stage 6: quality_check - approved
        Stage 7: loan_funding - approved

✅ Application 1 completed successfully

🔴 Testing Application 2 - Rejected Path
----------------------------------------
  📝 Stage 1: Pre-qualification (app2)
     ✅ Pre-qualification completed: EL_1756400000002_test2 (198ms)
     📊 Decision: approved
     📊 Score: 45

  📋 Stage 2: Loan Application (app2)
     ✅ Loan application completed (1123ms)
     📊 Status: approved
     📊 Decision: conditional_approval

  🤖 Automated Workflow: Stages 3-7 (app2)
     ❌ Automated workflow failed (2134ms): Workflow rejected: DTI ratio exceeds policy limit

✅ Application 2 rejected as expected at underwriting

🏁 COMPREHENSIVE E2E TEST RESULTS
============================================================
Total Test Duration: 8456ms (8.46s)

📋 APPLICATION 1 (Approved Path):
   Application Number: EL_1756400000001_test1
   Overall Status: COMPLETED
   Stage Results:
     ✅ stage1: completed (234ms)
     ✅ stage2: completed (1456ms)
     ✅ automated: approved (3245ms)

📋 APPLICATION 2 (Rejected Path):
   Application Number: EL_1756400000002_test2
   Overall Status: REJECTED_AS_EXPECTED
   Stage Results:
     ✅ stage1: completed (198ms)
     ✅ stage2: completed (1123ms)
     🔴 automated: rejected (2134ms)

📊 TEST SUMMARY:
   Application 1 (Approved): ✅ PASSED
   Application 2 (Rejected): ✅ PASSED
   Overall Test Result: 🎉 SUCCESS

🎯 Test completed! Check your LOS dashboard to verify the results.
```

#### Option 2: Manual Interactive Testing

```bash
# Start interactive testing
node src/scripts/manual-stage-testing.js
```

**Interactive Menu:**
```
🧪 Manual Stage-by-Stage LOS Testing
==================================================

Available Actions:
1. Create Approved Profile Application
2. Create Rejected Profile Application
3. Test Stage 1 - Pre-Qualification
4. Test Stage 2 - Loan Application
5. Test Stage 3 - Application Processing
6. Test Stage 4 - Underwriting
7. Test Stage 5 - Credit Decision
8. Test Stage 6 - Quality Check
9. Test Stage 7 - Loan Funding
10. Run Automated Workflow (Stages 3-7)
11. Check Application Status
12. Run Complete E2E Test
0. Exit

Select an option (0-12):
```

#### Option 3: Individual API Testing

```bash
# Test Stage 1
curl -X POST http://localhost:3000/api/pre-qualification/process \
  -H "Content-Type: application/json" \
  -d '{
    "personal_details": {
      "full_name": "RAJESH KUMAR SHARMA",
      "mobile": "9876543210",
      "email": "rajesh.sharma@example.com",
      "pan_number": "ABCDE1234F",
      "date_of_birth": "1985-06-15"
    },
    "loan_request": {
      "loan_amount": 500000,
      "loan_purpose": "home_improvement",
      "preferred_tenure_months": 36
    }
  }'

# Test Stage 2 (use application number from Stage 1)
curl -X POST http://localhost:3000/api/loan-application/process/EL_123456789 \
  -H "Content-Type: application/json" \
  -d @test-data/approved-loan-application.json

# Test Automated Workflow (Stages 3-7)
curl -X POST http://localhost:3000/api/automated-workflow/start/EL_123456789
```

## 📊 Monitoring & Verification

### Check Application Status

```bash
# Check various stage statuses
curl http://localhost:3000/api/pre-qualification/status/EL_123456789
curl http://localhost:3000/api/loan-application/status/EL_123456789
curl http://localhost:3000/api/underwriting/status/EL_123456789
curl http://localhost:3000/api/credit-decision/status/EL_123456789
curl http://localhost:3000/api/quality-check/status/EL_123456789
curl http://localhost:3000/api/loan-funding/status/EL_123456789
```

### Check System Statistics

```bash
# Get underwriting dashboard stats
curl http://localhost:3000/api/underwriting-status/stats

# Get system health
curl http://localhost:3000/health

# Get API information
curl http://localhost:3000/api
```

### Verify File System

```bash
# Check application files
ls applications/EL_123456789/
cat applications/EL_123456789/application-data.json
```

## 🎯 Expected Test Results

### ✅ Successful Test Run

**Application 1 (Approved):**
- Stage 1: ✅ Approved with high score (75+)
- Stage 2: ✅ Approved, triggers automated workflow
- Stage 3: ✅ Application processing passed
- Stage 4: ✅ Underwriting approved (DTI < 40%)
- Stage 5: ✅ Credit decision approved with terms
- Stage 6: ✅ Quality check passed
- Stage 7: ✅ **Loan disbursed successfully**

**Application 2 (Rejected):**
- Stage 1: ✅ May pass with lower score (40-60)
- Stage 2: ✅ May pass with conditions
- Stage 3: ✅ Application processing passed
- Stage 4: ❌ **Underwriting rejected** (DTI > 50%)
- Stage 5-7: N/A (workflow stopped)

### 📈 Performance Benchmarks

**Expected Processing Times:**
- Stage 1: 100-500ms
- Stage 2: 800-2000ms
- Stages 3-7 (Automated): 2000-5000ms
- Total E2E: 3000-8000ms

**Resource Usage:**
- Memory: < 200MB
- CPU: < 50% during processing
- Disk: Minimal (JSON files)

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Not Running
```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
Solution: Start server with `npm start`
```

#### 2. Database Connection Issues
```bash
Error: Database connection failed
Solution: Check MySQL connection and credentials
```

#### 3. Third-party Service Errors
```bash
Error: CIBIL verification failed
Solution: Check third-party simulator is running
```

#### 4. Application Not Found
```bash
Error: Application not found
Solution: Ensure application was created in Stage 1
```

### Debug Commands

```bash
# Check server logs
npm run logs

# Check database connection
npm run db:test

# Verify third-party services
curl http://localhost:3001/health  # Third-party simulator

# Check application files
ls -la applications/
```

## 🎉 Success Criteria

### Test Passes When:

1. **Application 1 (Approved Path):**
   - ✅ Completes all 7 stages successfully
   - ✅ Final status: "loan_funding" with "completed"
   - ✅ Loan amount disbursed
   - ✅ All stage processing times within limits

2. **Application 2 (Rejected Path):**
   - ✅ Rejected at underwriting stage (Stage 4)
   - ✅ Rejection reason related to DTI or risk assessment
   - ✅ Workflow stops at underwriting
   - ✅ No progression to later stages

3. **System Performance:**
   - ✅ Total test time < 10 seconds
   - ✅ No server errors or crashes
   - ✅ All API endpoints respond correctly
   - ✅ Database and file system updated correctly

## 🎯 Next Steps

After successful testing:

1. **Verify Dashboard**: Check underwriting dashboard shows both applications
2. **Review Logs**: Examine processing logs for any warnings
3. **Check Database**: Verify all data persisted correctly
4. **Test Manual Decisions**: Use dashboard to manually approve/reject applications
5. **Performance Testing**: Run multiple applications simultaneously

Your LOS system is now fully tested and ready for production use! 🚀

## 📞 Support

If tests fail or you encounter issues:

1. Check the troubleshooting section above
2. Review server logs: `npm run logs`
3. Verify all services are running
4. Check database connectivity
5. Ensure all required dependencies are installed

The E2E testing system provides comprehensive validation of your entire loan origination workflow from application to disbursement!
