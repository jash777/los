# Comprehensive LOS Python Test Suite Guide

## Overview

This guide explains how to use the comprehensive Python test suite (`comprehensive_system_test.py`) to test all 7 stages of the Loan Origination System (LOS).

## Prerequisites

### 1. System Requirements
- Python 3.7 or higher
- LOS server running on `http://localhost:3000` (or custom URL)
- Third-party simulator running on `http://localhost:4000`

### 2. Install Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt
```

### 3. Start the LOS System

Before running tests, ensure both servers are running:

```bash
# Terminal 1: Start the main LOS server
cd e:\LOS
node server.js

# Terminal 2: Start the third-party simulator
cd e:\LOS\third-party-simulator
node server.js
```

## Test Suite Features

### 🎯 Comprehensive Coverage
- **All 7 Stages**: Tests every stage from pre-qualification to loan funding
- **Multiple Test Cases**: Each stage has 5-7 different test scenarios
- **Edge Cases**: Includes validation failures, boundary conditions, and error scenarios
- **End-to-End Workflow**: Complete application journey testing
- **Status Endpoints**: Tests all status check endpoints

### 📊 Test Categories

1. **Success Scenarios**: Valid data with expected approvals
2. **Validation Failures**: Invalid input data testing
3. **Business Rule Violations**: Testing rejection criteria
4. **Edge Cases**: Boundary conditions and special scenarios
5. **Error Handling**: System error and exception testing

### 📈 Reporting Features
- Detailed test execution logs
- Comprehensive HTML-style reports
- Execution time tracking
- Pass/fail statistics
- Error message capture

## Usage Instructions

### Basic Usage

```bash
# Run all tests (recommended)
python comprehensive_system_test.py

# Run with custom server URL
python comprehensive_system_test.py --url http://localhost:3000
```

### Stage-Specific Testing

```bash
# Test only Stage 1 (Pre-Qualification)
python comprehensive_system_test.py --stage 1

# Test only Stage 2 (Loan Application)
python comprehensive_system_test.py --stage 2

# Test only Stage 3 (Application Processing)
python comprehensive_system_test.py --stage 3

# Test only Stage 4 (Underwriting)
python comprehensive_system_test.py --stage 4

# Test only Stage 5 (Credit Decision)
python comprehensive_system_test.py --stage 5

# Test only Stage 6 (Quality Check)
python comprehensive_system_test.py --stage 6

# Test only Stage 7 (Loan Funding)
python comprehensive_system_test.py --stage 7

# Test complete workflow only
python comprehensive_system_test.py --stage workflow

# Test status endpoints only
python comprehensive_system_test.py --stage status
```

### Command Line Options

```bash
python comprehensive_system_test.py --help

usage: comprehensive_system_test.py [-h] [--url URL] [--stage {1,2,3,4,5,6,7,workflow,status,all}]

Comprehensive LOS Test Suite

optional arguments:
  -h, --help            show this help message and exit
  --url URL             Base URL of the LOS API (default: http://localhost:3000)
  --stage {1,2,3,4,5,6,7,workflow,status,all}
                        Specific stage to test (default: all)
```

## Test Cases Overview

### Stage 1: Pre-Qualification Tests
- ✅ Valid pre-qualification with high credit score
- ✅ Valid pre-qualification with medium credit score
- ❌ Low credit score rejection
- ❌ Invalid phone number format
- ❌ Invalid PAN number format
- ❌ Missing required fields
- ❌ Empty request body

### Stage 2: Loan Application Tests
- ✅ Complete salaried employee application
- ✅ Complete self-employed application
- ❌ Invalid Aadhaar number
- ❌ Low income rejection
- ❌ Missing required fields

### Stage 3: Application Processing Tests
- ✅ Valid application processing
- ❌ Document verification failure
- ❌ Non-existent application
- ❌ Missing application ID

### Stage 4: Underwriting Tests
- ✅ High score auto-approval
- ⚠️ Medium score conditional approval
- ❌ Low score rejection
- ⚠️ High risk category (manual review)
- ❌ Policy violation

### Stage 5: Credit Decision Tests
- ✅ Final credit approval
- ⚠️ Credit committee manual review
- ❌ Final credit rejection
- ✅ Terms optimization
- ❌ Regulatory compliance failure

### Stage 6: Quality Check Tests
- ✅ Quality check pass (Grade A+)
- ✅ Quality check pass (Grade A)
- ❌ Quality check fail (low score)
- ❌ Document completeness issue
- ❌ Data accuracy issue
- ❌ Compliance adherence failure

### Stage 7: Loan Funding Tests
- ✅ Successful NEFT disbursement
- ✅ Successful RTGS disbursement
- ✅ Successful IMPS disbursement
- ✅ Successful UPI disbursement
- ❌ Account setup failure
- ❌ Disbursement failure
- ❌ Agreement finalization failure

### Complete Workflow Tests
- 🔄 End-to-end successful workflow
- 🔄 Multi-stage failure handling

### Status Endpoint Tests
- 📊 All stage status endpoints
- 📊 Application tracking

## Sample Test Data

### Valid Test Data Examples

```python
# Pre-qualification data
{
    "applicantName": "John Doe",
    "phoneNumber": "9876543210",
    "panNumber": "ABCDE1234F"
}

# Loan application data
{
    "applicationId": "APP_12345",
    "aadhaarNumber": "123456789012",
    "currentAddress": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    },
    "employmentDetails": {
        "employmentType": "salaried",
        "companyName": "Tech Corp Ltd",
        "monthlyIncome": 75000,
        "workExperience": 36
    },
    "bankingDetails": {
        "accountNumber": "1234567890123456",
        "ifscCode": "HDFC0000123",
        "bankName": "HDFC Bank"
    }
}
```

## Understanding Test Results

### Test Result Symbols
- ✅ **PASS**: Test executed successfully with expected results
- ❌ **FAIL**: Test failed due to unexpected results or errors
- ⏭️ **SKIP**: Test was skipped (usually due to dependencies)

### Sample Output

```
================================================================================
LOAN ORIGINATION SYSTEM - COMPREHENSIVE TEST REPORT
================================================================================
Test Execution Date: 2024-01-15 14:30:25
Base URL: http://localhost:3000

Stage 1: Pre-Qualification
--------------------------
✅ Valid Pre-qualification - High Credit Score
   Description: Test pre-qualification with valid data and high credit score
   Execution Time: 0.45s

❌ Invalid Phone Number
   Description: Test with invalid phone number format
   Execution Time: 0.23s
   Error: Expected status 400, got 200

Stage Summary: 5 passed, 2 failed, 0 skipped
Stage Execution Time: 3.21s

================================================================================
OVERALL TEST SUMMARY
================================================================================
Total Tests: 45
Passed: 38 (84.4%)
Failed: 7 (15.6%)
Skipped: 0 (0.0%)
Total Execution Time: 23.45s
```

## Output Files

The test suite generates several output files:

1. **`los_test_results.log`**: Detailed execution log
2. **`los_test_report_YYYYMMDD_HHMMSS.txt`**: Comprehensive test report
3. **Console output**: Real-time test progress

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: Cannot connect to server: Connection refused
   ```
   **Solution**: Ensure LOS server is running on the specified URL

2. **Import Errors**
   ```
   ModuleNotFoundError: No module named 'requests'
   ```
   **Solution**: Install dependencies with `pip install -r requirements.txt`

3. **Test Failures**
   ```
   Expected status 200, got 500
   ```
   **Solution**: Check server logs for errors, verify test data format

### Debug Mode

For detailed debugging, modify the logging level in the script:

```python
# Change from INFO to DEBUG
logging.basicConfig(level=logging.DEBUG)
```

## Customization

### Adding New Test Cases

1. **Create Test Case**:
   ```python
   TestCase(
       name="Your Test Name",
       description="Test description",
       expected_status=200,
       expected_result="expected_keyword",
       test_data={"your": "test_data"}
   )
   ```

2. **Add to Test Method**:
   ```python
   def test_stage1_prequalification(self):
       test_cases = [
           # ... existing test cases
           your_new_test_case
       ]
   ```

### Modifying Test Data

Update the test data templates in the `__init__` method:

```python
self.valid_pan_numbers = ["ABCDE1234F", "XYZAB5678C", "PQRST9012D"]
self.valid_phone_numbers = ["9876543210", "8765432109", "7654321098"]
```

## Performance Testing

### Load Testing

For basic load testing, run multiple instances:

```bash
# Run 5 parallel test instances
for i in {1..5}; do
    python comprehensive_system_test.py &
done
wait
```

### Timing Analysis

The test suite tracks execution times for:
- Individual test cases
- Stage-wise execution
- Overall test suite runtime

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: LOS Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Start LOS servers
        run: |
          node server.js &
          cd third-party-simulator && node server.js &
          sleep 10
      - name: Run tests
        run: python comprehensive_system_test.py
```

## Best Practices

1. **Pre-Test Checklist**:
   - ✅ LOS server running
   - ✅ Third-party simulator running
   - ✅ Database accessible
   - ✅ Dependencies installed

2. **Test Environment**:
   - Use dedicated test database
   - Clean data between test runs
   - Monitor server resources

3. **Result Analysis**:
   - Review failed tests immediately
   - Check server logs for errors
   - Validate test data accuracy
   - Monitor performance trends

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify test data format
4. Check network connectivity

---

**Happy Testing! 🚀**

This comprehensive test suite ensures your Loan Origination System works correctly across all stages and scenarios.