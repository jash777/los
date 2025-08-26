# Loan Management System - API Testing Guide

## Overview
This guide provides comprehensive instructions for testing the 7-stage loan origination system with both automated and manual phases using the provided Postman collection.

## Prerequisites

### 1. Environment Setup
- **Server**: Ensure the loan management system is running on `http://localhost:3000`
- **Database**: Verify database connectivity and initial data setup
- **Postman**: Import the `Loan-Management-System-Postman-Collection.json` file

### 2. Collection Variables
The collection uses the following variables that are automatically set during test execution:
- `base_url`: Server base URL (default: http://localhost:3000)
- `auth_token`: JWT authentication token (set after login)
- `employee_id`: Employee ID for manual processing (default: emp_001)
- Various stage IDs that are automatically captured during workflow execution

## Testing Scenarios

### Scenario 1: Complete Automated Workflow (Happy Path)

**Objective**: Test the complete 7-stage loan process for a qualified applicant

**Steps**:
1. **Authentication**
   - Run "Admin Login" to get authentication token
   - Verify successful login and token storage

2. **Stage 1: Pre-qualification**
   - Run "Process Pre-qualification" with valid applicant data
   - Verify eligibility checks pass
   - Check application ID is generated and stored

3. **Stage 2: Loan Application**
   - Run "Process Loan Application" using pre-qualification ID
   - Verify detailed application processing
   - Confirm KYC/AML verification

4. **Stage 3: Application Processing**
   - Run "Process Application Processing"
   - Verify credit bureau checks and employment verification
   - Confirm debt-to-income ratio calculation

5. **Stage 4: Underwriting**
   - Run "Process Underwriting"
   - Verify automated decision engine execution
   - Check risk scoring and policy validation

6. **Stage 5: Credit Decision**
   - Run "Process Credit Decision"
   - Verify final approval decision
   - Check terms and conditions setting

7. **Stage 6: Quality Check**
   - Run "Process Quality Check"
   - Verify compliance verification
   - Check transition to manual phase decision

8. **Stage 7: Loan Funding (Manual Phase)**
   - Switch to employee authentication
   - Run "Process Loan Funding" with employee credentials
   - Verify manual review and approval
   - Check disbursement processing

**Expected Results**:
- All stages complete successfully
- Application progresses through automated phase (Stages 1-5)
- Quality check determines manual phase requirement
- Employee successfully processes loan funding
- Final loan disbursement is approved

### Scenario 2: Dual-Phase Workflow Testing

**Objective**: Test the complete workflow using the dual-phase orchestrator

**Steps**:
1. **Start Complete Workflow**
   - Run "Start Complete Workflow" with comprehensive application data
   - Verify workflow ID generation

2. **Monitor Progress**
   - Run "Get Workflow Status" periodically
   - Check automated phase completion
   - Verify transition to manual phase

3. **Employee Processing**
   - Login as employee
   - Run "Get Manual Assignments"
   - Process assigned applications
   - Add notes and handle escalations if needed

4. **Final Verification**
   - Check workflow completion status
   - Verify all stages completed successfully

### Scenario 3: High-Value Loan Testing

**Objective**: Test system behavior with high-value loans requiring additional approvals

**Steps**:
1. Run "High-Value Loan Application" test scenario
2. Verify additional validation rules
3. Check escalation to senior management
4. Confirm enhanced due diligence processes

### Scenario 4: Rejection Testing

**Objective**: Test system behavior with applications that should be rejected

**Steps**:
1. Run "Low-Income Rejection Test" scenario
2. Verify rejection at appropriate stage
3. Check rejection reasons and notifications
4. Confirm proper audit trail logging

### Scenario 5: Self-Employed Application Testing

**Objective**: Test specialized processing for self-employed applicants

**Steps**:
1. Run "Self-Employed Business Loan" scenario
2. Verify additional documentation requirements
3. Check enhanced verification processes
4. Confirm business-specific risk assessment

## Employee Dashboard Testing

### Manual Processing Workflow
1. **Employee Authentication**
   - Run "Employee Login"
   - Verify employee-specific permissions

2. **Dashboard Operations**
   - Run "Get Employee Dashboard"
   - Check pending applications count
   - Verify workload statistics

3. **Assignment Management**
   - Run "Get Manual Assignments"
   - Check load balancing algorithm
   - Verify skill-based routing

4. **Application Processing**
   - Run "Get Assigned Applications"
   - Process applications using "Process Manual Stage"
   - Add notes using "Add Application Note"
   - Escalate if needed using "Escalate Application"

## System Health Monitoring

### Health Check Sequence
Run all health check endpoints in the "System Health & Monitoring" folder:
1. System Health Check
2. All Phases Overview
3. Individual stage health checks (Pre-qualification through Loan Funding)

**Expected Results**:
- All services report "healthy" status
- Database connectivity confirmed
- External service availability verified
- Performance metrics within acceptable ranges

## Requirements & Documentation Testing

### API Documentation Verification
Run all endpoints in "Requirements & Documentation" folder:
1. Verify each stage's requirements are properly documented
2. Check disbursement methods availability
3. Test fee calculator with various loan types
4. Verify processing timeline information

## Error Handling Testing

### Invalid Data Testing
1. **Validation Errors**
   - Submit requests with missing required fields
   - Use invalid data formats (e.g., invalid PAN, mobile numbers)
   - Verify proper error messages and status codes

2. **Authentication Errors**
   - Test with invalid/expired tokens
   - Verify unauthorized access prevention
   - Check role-based access control

3. **Business Logic Errors**
   - Submit applications with conflicting data
   - Test edge cases (e.g., zero income, negative amounts)
   - Verify proper business rule enforcement

## Performance Testing

### Load Testing Recommendations
1. **Concurrent Users**
   - Test with multiple simultaneous login attempts
   - Verify system stability under load

2. **Stage Processing**
   - Submit multiple applications simultaneously
   - Monitor processing times and resource usage

3. **Database Performance**
   - Monitor query execution times
   - Check for proper indexing and optimization

## Security Testing

### Authentication & Authorization
1. **Token Security**
   - Verify JWT token expiration
   - Test token refresh mechanisms
   - Check for proper token invalidation on logout

2. **Data Protection**
   - Verify sensitive data masking in logs
   - Check for proper input sanitization
   - Test for SQL injection vulnerabilities

3. **Access Control**
   - Verify role-based permissions
   - Test unauthorized endpoint access
   - Check for proper audit trail logging

## Troubleshooting Common Issues

### Authentication Issues
- **Problem**: Login fails with valid credentials
- **Solution**: Check database connectivity and user status
- **Verification**: Run system health check

### Stage Processing Failures
- **Problem**: Stage processing returns errors
- **Solution**: Verify previous stage completion and data integrity
- **Verification**: Check stage-specific health endpoints

### Manual Phase Issues
- **Problem**: Employee cannot access assigned applications
- **Solution**: Verify employee authentication and permissions
- **Verification**: Check employee dashboard and assignment endpoints

### Database Connection Issues
- **Problem**: Database-related errors in responses
- **Solution**: Verify database server status and connection strings
- **Verification**: Run health check endpoints

## Test Data Management

### Sample Test Data
The collection includes realistic test data for:
- **Personal Information**: Valid PAN, Aadhar, mobile numbers
- **Financial Data**: Realistic income, expense, and asset values
- **Employment Details**: Various employment types and companies
- **Loan Requests**: Different loan types and amounts

### Data Cleanup
After testing:
1. Clear test applications from database
2. Reset employee assignments
3. Clear audit logs if needed
4. Verify system is ready for next test cycle

## Reporting and Documentation

### Test Results Documentation
1. **Success Metrics**
   - Record successful completion rates for each stage
   - Document processing times
   - Note any performance issues

2. **Error Analysis**
   - Document all errors encountered
   - Categorize by type (validation, business logic, system)
   - Provide recommendations for fixes

3. **Performance Metrics**
   - Record response times for each endpoint
   - Document system resource usage
   - Note any bottlenecks or optimization opportunities

## Conclusion

This comprehensive testing guide ensures thorough validation of the loan management system's functionality, performance, and security. Regular execution of these test scenarios will help maintain system reliability and identify potential issues before they impact production operations.

For additional support or questions about the testing process, refer to the system documentation or contact the development team.