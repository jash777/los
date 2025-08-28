#!/usr/bin/env python3
"""
Comprehensive Loan Origination System (LOS) Test Suite

This script tests all 7 stages of the loan origination system:
1. Pre-Qualification
2. Loan Application
3. Application Processing
4. Underwriting
5. Credit Decision
6. Quality Check
7. Loan Funding

Author: System Test Suite
Version: 1.0
Date: 2024
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('los_test_results.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TestResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"

@dataclass
class TestCase:
    name: str
    description: str
    expected_status: int
    expected_result: str
    test_data: Dict
    result: Optional[TestResult] = None
    response: Optional[Dict] = None
    error_message: Optional[str] = None
    execution_time: Optional[float] = None

class LOSTestSuite:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.application_ids = []
        
        # Test data templates
        self.valid_pan_numbers = ["ABCDE1234F", "XYZAB5678C", "PQRST9012D"]
        self.valid_phone_numbers = ["9876543210", "8765432109", "7654321098"]
        self.valid_aadhaar_numbers = ["123456789012", "987654321098", "456789123456"]
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> Tuple[int, Dict]:
        """Make HTTP request and return status code and response"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "POST":
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == "GET":
                response = self.session.get(url, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}

    def run_test_case(self, test_case: TestCase, endpoint: str, method: str = "POST") -> TestCase:
        """Execute a single test case"""
        start_time = time.time()
        
        try:
            status_code, response = self.make_request(method, endpoint, test_case.test_data)
            test_case.execution_time = time.time() - start_time
            test_case.response = response
            
            # Check status code
            if status_code == test_case.expected_status:
                # Check expected result in response
                if test_case.expected_result in str(response).lower():
                    test_case.result = TestResult.PASS
                else:
                    test_case.result = TestResult.FAIL
                    test_case.error_message = f"Expected '{test_case.expected_result}' not found in response"
            else:
                test_case.result = TestResult.FAIL
                test_case.error_message = f"Expected status {test_case.expected_status}, got {status_code}"
                
        except Exception as e:
            test_case.result = TestResult.FAIL
            test_case.error_message = str(e)
            test_case.execution_time = time.time() - start_time
            
        return test_case

    def test_stage1_prequalification(self) -> List[TestCase]:
        """Test Stage 1: Pre-Qualification"""
        logger.info("Testing Stage 1: Pre-Qualification")
        
        test_cases = [
            # Valid pre-qualification cases
            TestCase(
                name="Valid Pre-qualification - High Credit Score",
                description="Test pre-qualification with valid data and high credit score",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "personal_info": {
                        "first_name": "John",
                        "last_name": "Doe",
                        "date_of_birth": "1990-01-15",
                        "mobile": "9876543210",
                        "email": "john.doe@example.com",
                        "pan_number": "ABCDE1234F"
                    }
                }
            ),
            TestCase(
                name="Valid Pre-qualification - Medium Credit Score",
                description="Test pre-qualification with medium credit score",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "personal_info": {
                        "first_name": "Jane",
                        "last_name": "Smith",
                        "date_of_birth": "1985-05-20",
                        "mobile": "8765432109",
                        "email": "jane.smith@example.com",
                        "pan_number": "XYZAB5678C"
                    }
                }
            ),
            TestCase(
                name="Low Credit Score Rejection",
                description="Test rejection due to low credit score",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "personal_info": {
                        "first_name": "Poor",
                        "last_name": "Credit",
                        "date_of_birth": "1980-12-10",
                        "mobile": "7654321098",
                        "email": "poor.credit@example.com",
                        "pan_number": "LOWSC0123D"
                    }
                }
            ),
            # Invalid input cases
            TestCase(
                name="Invalid Phone Number",
                description="Test with invalid phone number format",
                expected_status=400,
                expected_result="validation error",
                test_data={
                    "personal_info": {
                        "first_name": "Test",
                        "last_name": "User",
                        "date_of_birth": "1990-01-15",
                        "mobile": "123",  # Invalid phone number
                        "email": "test.user@example.com",
                        "pan_number": "ABCDE1234F"
                    }
                }
            ),
            TestCase(
                name="Invalid PAN Number",
                description="Test with invalid PAN number format",
                expected_status=400,
                expected_result="validation error",
                test_data={
                    "personal_info": {
                        "first_name": "Test",
                        "last_name": "User",
                        "date_of_birth": "1990-01-15",
                        "mobile": "9876543210",
                        "email": "test.user@example.com",
                        "pan_number": "INVALID"  # Invalid PAN format
                    }
                }
            ),
            TestCase(
                name="Missing Required Fields",
                description="Test with missing required fields",
                expected_status=400,
                expected_result="validation error",
                test_data={
                    "personal_info": {
                        "first_name": "Test"
                        # Missing required fields
                    }
                }
            ),
            TestCase(
                name="Empty Request Body",
                description="Test with empty request body",
                expected_status=400,
                expected_result="validation error",
                test_data={}
            )
        ]
        
        results = []
        for test_case in test_cases:
            result = self.run_test_case(test_case, "/api/pre-qualification/process")
            results.append(result)
            
            # Store successful application IDs for later stages
            if result.result == TestResult.PASS and result.response.get('data', {}).get('applicationId'):
                self.application_ids.append(result.response['data']['applicationId'])
                
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage2_loan_application(self) -> List[TestCase]:
        """Test Stage 2: Loan Application"""
        logger.info("Testing Stage 2: Loan Application")
        
        if not self.application_ids:
            logger.warning("No valid application IDs from Stage 1. Creating test applications.")
            # Create some test application IDs
            self.application_ids = ["TEST_APP_001", "TEST_APP_002"]
        
        test_cases = [
            # Valid loan application cases
            TestCase(
                name="Complete Loan Application - Salaried",
                description="Test complete loan application for salaried employee",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "TEST_APP_001",
                    "aadhaarNumber": "123456789012",
                    "currentAddress": {
                        "street": "123 Main Street",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "pincode": "400001"
                    },
                    "permanentAddress": {
                        "street": "123 Main Street",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "pincode": "400001"
                    },
                    "employmentDetails": {
                        "employmentType": "salaried",
                        "companyName": "Tech Corp Ltd",
                        "companyAddress": "456 Business Park, Mumbai",
                        "monthlyIncome": 75000,
                        "workExperience": 36
                    },
                    "bankingDetails": {
                        "accountNumber": "1234567890123456",
                        "ifscCode": "HDFC0000123",
                        "bankName": "HDFC Bank"
                    },
                    "references": [
                        {
                            "name": "Reference One",
                            "mobileNumber": "9876543210",
                            "relationship": "friend"
                        },
                        {
                            "name": "Reference Two",
                            "mobileNumber": "8765432109",
                            "relationship": "colleague"
                        }
                    ]
                }
            ),
            TestCase(
                name="Complete Loan Application - Self Employed",
                description="Test complete loan application for self-employed",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": self.application_ids[1] if len(self.application_ids) > 1 else "TEST_APP_002",
                    "aadhaarNumber": "987654321098",
                    "currentAddress": {
                        "street": "789 Business Street",
                        "city": "Delhi",
                        "state": "Delhi",
                        "pincode": "110001"
                    },
                    "permanentAddress": {
                        "street": "789 Business Street",
                        "city": "Delhi",
                        "state": "Delhi",
                        "pincode": "110001"
                    },
                    "employmentDetails": {
                        "employmentType": "self-employed",
                        "companyName": "My Business Pvt Ltd",
                        "companyAddress": "789 Business Street, Delhi",
                        "monthlyIncome": 100000,
                        "workExperience": 60
                    },
                    "bankingDetails": {
                        "accountNumber": "9876543210987654",
                        "ifscCode": "ICIC0000456",
                        "bankName": "ICICI Bank"
                    },
                    "references": [
                        {
                            "name": "Business Partner",
                            "mobileNumber": "9123456789",
                            "relationship": "colleague"
                        },
                        {
                            "name": "Family Member",
                            "mobileNumber": "8123456789",
                            "relationship": "family"
                        }
                    ]
                }
            ),
            # Invalid cases
            TestCase(
                name="Invalid Aadhaar Number",
                description="Test with invalid Aadhaar number",
                expected_status=400,
                expected_result="validation error",
                test_data={
                    "applicationId": "TEST_APP_003",
                    "aadhaarNumber": "123",  # Invalid Aadhaar
                    "currentAddress": {
                        "street": "123 Main Street",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "pincode": "400001"
                    }
                }
            ),
            TestCase(
                name="Low Income Rejection",
                description="Test rejection due to low income",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "TEST_APP_004",
                    "aadhaarNumber": "456789123456",
                    "currentAddress": {
                        "street": "123 Low Income Street",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "pincode": "400001"
                    },
                    "employmentDetails": {
                        "employmentType": "salaried",
                        "companyName": "Small Company",
                        "monthlyIncome": 10000,  # Below minimum threshold
                        "workExperience": 12
                    }
                }
            ),
            TestCase(
                name="Missing Required Fields",
                description="Test with missing employment details",
                expected_status=400,
                expected_result="validation error",
                test_data={
                    "applicationId": "TEST_APP_005",
                    "aadhaarNumber": "789123456789"
                    # Missing other required fields
                }
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/loan-application/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage3_application_processing(self) -> List[TestCase]:
        """Test Stage 3: Application Processing"""
        logger.info("Testing Stage 3: Application Processing")
        
        test_cases = [
            TestCase(
                name="Valid Application Processing",
                description="Test application processing with valid data",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "TEST_APP_001"
                }
            ),
            TestCase(
                name="Document Verification Failure",
                description="Test processing with document verification issues",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "INVALID_DOC_APP"
                }
            ),
            TestCase(
                name="Non-existent Application",
                description="Test processing with non-existent application ID",
                expected_status=404,
                expected_result="not found",
                test_data={
                    "applicationId": "NON_EXISTENT_APP"
                }
            ),
            TestCase(
                name="Missing Application ID",
                description="Test processing without application ID",
                expected_status=400,
                expected_result="validation error",
                test_data={}
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/application-processing/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage4_underwriting(self) -> List[TestCase]:
        """Test Stage 4: Underwriting"""
        logger.info("Testing Stage 4: Underwriting")
        
        test_cases = [
            TestCase(
                name="High Score Auto-Approval",
                description="Test underwriting with high score for auto-approval",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "HIGH_SCORE_APP"
                }
            ),
            TestCase(
                name="Medium Score Conditional Approval",
                description="Test underwriting with medium score for conditional approval",
                expected_status=200,
                expected_result="conditional",
                test_data={
                    "applicationId": "MEDIUM_SCORE_APP"
                }
            ),
            TestCase(
                name="Low Score Rejection",
                description="Test underwriting with low score for rejection",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "LOW_SCORE_APP"
                }
            ),
            TestCase(
                name="High Risk Category",
                description="Test underwriting with high risk factors",
                expected_status=200,
                expected_result="manual review",
                test_data={
                    "applicationId": "HIGH_RISK_APP"
                }
            ),
            TestCase(
                name="Policy Violation",
                description="Test underwriting with policy violations",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "POLICY_VIOLATION_APP"
                }
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/underwriting/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage5_credit_decision(self) -> List[TestCase]:
        """Test Stage 5: Credit Decision"""
        logger.info("Testing Stage 5: Credit Decision")
        
        test_cases = [
            TestCase(
                name="Final Credit Approval",
                description="Test final credit decision approval",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "APPROVED_APP"
                }
            ),
            TestCase(
                name="Credit Committee Manual Review",
                description="Test credit decision requiring manual review",
                expected_status=200,
                expected_result="manual review",
                test_data={
                    "applicationId": "MANUAL_REVIEW_APP"
                }
            ),
            TestCase(
                name="Final Credit Rejection",
                description="Test final credit decision rejection",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "FINAL_REJECT_APP"
                }
            ),
            TestCase(
                name="Terms Optimization",
                description="Test credit decision with optimized terms",
                expected_status=200,
                expected_result="approved",
                test_data={
                    "applicationId": "OPTIMIZE_TERMS_APP"
                }
            ),
            TestCase(
                name="Regulatory Compliance Failure",
                description="Test credit decision with regulatory compliance issues",
                expected_status=200,
                expected_result="rejected",
                test_data={
                    "applicationId": "COMPLIANCE_FAIL_APP"
                }
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/credit-decision/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage6_quality_check(self) -> List[TestCase]:
        """Test Stage 6: Quality Check"""
        logger.info("Testing Stage 6: Quality Check")
        
        test_cases = [
            TestCase(
                name="Quality Check Pass - Grade A+",
                description="Test quality check with excellent quality (A+ grade)",
                expected_status=200,
                expected_result="pass",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "QUALITY_A_PLUS_APP"
                }
            ),
            TestCase(
                name="Quality Check Pass - Grade A",
                description="Test quality check with good quality (A grade)",
                expected_status=200,
                expected_result="pass",
                test_data={
                    "applicationId": "QUALITY_A_APP"
                }
            ),
            TestCase(
                name="Quality Check Fail - Low Score",
                description="Test quality check failure due to low overall score",
                expected_status=200,
                expected_result="fail",
                test_data={
                    "applicationId": "QUALITY_FAIL_APP"
                }
            ),
            TestCase(
                name="Document Completeness Issue",
                description="Test quality check with document completeness below threshold",
                expected_status=200,
                expected_result="fail",
                test_data={
                    "applicationId": "DOC_INCOMPLETE_APP"
                }
            ),
            TestCase(
                name="Data Accuracy Issue",
                description="Test quality check with data accuracy below threshold",
                expected_status=200,
                expected_result="fail",
                test_data={
                    "applicationId": "DATA_ACCURACY_APP"
                }
            ),
            TestCase(
                name="Compliance Adherence Failure",
                description="Test quality check with compliance adherence failure",
                expected_status=200,
                expected_result="fail",
                test_data={
                    "applicationId": "COMPLIANCE_FAIL_QC_APP"
                }
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/quality-check/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_stage7_loan_funding(self) -> List[TestCase]:
        """Test Stage 7: Loan Funding"""
        logger.info("Testing Stage 7: Loan Funding")
        
        test_cases = [
            TestCase(
                name="Successful NEFT Disbursement",
                description="Test successful loan funding via NEFT",
                expected_status=200,
                expected_result="funded",
                test_data={
                    "applicationId": self.application_ids[0] if self.application_ids else "NEFT_FUNDING_APP",
                    "disbursementMethod": "NEFT"
                }
            ),
            TestCase(
                name="Successful RTGS Disbursement",
                description="Test successful loan funding via RTGS",
                expected_status=200,
                expected_result="funded",
                test_data={
                    "applicationId": "RTGS_FUNDING_APP",
                    "disbursementMethod": "RTGS"
                }
            ),
            TestCase(
                name="Successful IMPS Disbursement",
                description="Test successful loan funding via IMPS",
                expected_status=200,
                expected_result="funded",
                test_data={
                    "applicationId": "IMPS_FUNDING_APP",
                    "disbursementMethod": "IMPS"
                }
            ),
            TestCase(
                name="Successful UPI Disbursement",
                description="Test successful loan funding via UPI",
                expected_status=200,
                expected_result="funded",
                test_data={
                    "applicationId": "UPI_FUNDING_APP",
                    "disbursementMethod": "UPI"
                }
            ),
            TestCase(
                name="Account Setup Failure",
                description="Test loan funding failure due to account setup issues",
                expected_status=400,
                expected_result="account setup failed",
                test_data={
                    "applicationId": "ACCOUNT_SETUP_FAIL_APP"
                }
            ),
            TestCase(
                name="Disbursement Failure",
                description="Test loan funding failure during disbursement",
                expected_status=400,
                expected_result="disbursement failed",
                test_data={
                    "applicationId": "DISBURSEMENT_FAIL_APP"
                }
            ),
            TestCase(
                name="Agreement Finalization Failure",
                description="Test loan funding failure during agreement finalization",
                expected_status=400,
                expected_result="agreement failed",
                test_data={
                    "applicationId": "AGREEMENT_FAIL_APP"
                }
            )
        ]
        
        results = []
        for test_case in test_cases:
            # Extract application ID from test data for URL path
            app_id = test_case.test_data.get('applicationId', 'TEST_APP_001')
            endpoint = f"/api/loan-funding/{app_id}"
            result = self.run_test_case(test_case, endpoint)
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def test_complete_workflow(self) -> List[TestCase]:
        """Test complete end-to-end workflow"""
        logger.info("Testing Complete End-to-End Workflow")
        
        workflow_results = []
        
        # Test successful complete workflow
        test_case = TestCase(
            name="Complete Successful Workflow",
            description="Test complete workflow from pre-qualification to funding",
            expected_status=200,
            expected_result="success",
            test_data={}
        )
        
        start_time = time.time()
        
        try:
            # Stage 1: Pre-qualification
            stage1_data = {
                "applicantName": "Complete Workflow Test",
                "phoneNumber": "9999999999",
                "panNumber": "WORKF1234W"
            }
            
            status, response = self.make_request("POST", "/api/pre-qualification/process", stage1_data)
            if status != 200 or 'approved' not in str(response).lower():
                raise Exception(f"Stage 1 failed: {response}")
            
            app_id = response.get('data', {}).get('applicationId')
            if not app_id:
                raise Exception("No application ID returned from Stage 1")
            
            # Stage 2: Loan Application
            stage2_data = {
                "applicationId": app_id,
                "aadhaarNumber": "999999999999",
                "currentAddress": {
                    "street": "Workflow Test Street",
                    "city": "Test City",
                    "state": "Test State",
                    "pincode": "999999"
                },
                "permanentAddress": {
                    "street": "Workflow Test Street",
                    "city": "Test City",
                    "state": "Test State",
                    "pincode": "999999"
                },
                "employmentDetails": {
                    "employmentType": "salaried",
                    "companyName": "Workflow Test Company",
                    "companyAddress": "Test Company Address",
                    "monthlyIncome": 80000,
                    "workExperience": 48
                },
                "bankingDetails": {
                    "accountNumber": "9999999999999999",
                    "ifscCode": "TEST0000999",
                    "bankName": "Test Bank"
                },
                "references": [
                    {
                        "name": "Test Reference 1",
                        "mobileNumber": "9999999998",
                        "relationship": "friend"
                    },
                    {
                        "name": "Test Reference 2",
                        "mobileNumber": "9999999997",
                        "relationship": "colleague"
                    }
                ]
            }
            
            status, response = self.make_request("POST", f"/api/loan-application/{app_id}", stage2_data)
            if status != 200:
                raise Exception(f"Stage 2 failed: {response}")
            
            # Continue with remaining stages...
            stages = [
                (f"/api/application-processing/{app_id}", {}),
                (f"/api/underwriting/{app_id}", {}),
                (f"/api/credit-decision/{app_id}", {}),
                (f"/api/quality-check/{app_id}", {}),
                (f"/api/loan-funding/{app_id}", {})
            ]
            
            for stage_endpoint, stage_data in stages:
                status, response = self.make_request("POST", stage_endpoint, stage_data)
                if status not in [200, 201]:
                    raise Exception(f"Stage {stage_endpoint} failed: {response}")
                
                # Add small delay between stages
                time.sleep(0.5)
            
            test_case.result = TestResult.PASS
            test_case.response = {"message": "Complete workflow successful"}
            
        except Exception as e:
            test_case.result = TestResult.FAIL
            test_case.error_message = str(e)
            
        test_case.execution_time = time.time() - start_time
        workflow_results.append(test_case)
        
        logger.info(f"Complete Workflow Test: {test_case.result.value}")
        if test_case.error_message:
            logger.error(f"Workflow Error: {test_case.error_message}")
            
        return workflow_results

    def test_status_endpoints(self) -> List[TestCase]:
        """Test status check endpoints for all stages"""
        logger.info("Testing Status Check Endpoints")
        
        test_cases = [
            TestCase(
                name="Pre-qualification Status Check",
                description="Test pre-qualification status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Loan Application Status Check",
                description="Test loan application status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Application Processing Status Check",
                description="Test application processing status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Underwriting Status Check",
                description="Test underwriting status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Credit Decision Status Check",
                description="Test credit decision status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Quality Check Status Check",
                description="Test quality check status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            ),
            TestCase(
                name="Loan Funding Status Check",
                description="Test loan funding status endpoint",
                expected_status=200,
                expected_result="status",
                test_data={}
            )
        ]
        
        status_endpoints = [
            "/api/pre-qualification/status",
            "/api/loan-application/status",
            "/api/application-processing/status",
            "/api/underwriting/status",
            "/api/credit-decision/status",
            "/api/quality-check/status",
            "/api/loan-funding/status"
        ]
        
        results = []
        for i, test_case in enumerate(test_cases):
            app_id = self.application_ids[0] if self.application_ids else "TEST_STATUS_APP"
            endpoint = f"{status_endpoints[i]}/{app_id}"
            result = self.run_test_case(test_case, endpoint, "GET")
            results.append(result)
            logger.info(f"Test: {test_case.name} - {result.result.value}")
            if result.error_message:
                logger.error(f"Error: {result.error_message}")
                
        return results

    def generate_test_report(self, all_results: List[List[TestCase]]) -> str:
        """Generate comprehensive test report"""
        report = []
        report.append("=" * 80)
        report.append("LOAN ORIGINATION SYSTEM - COMPREHENSIVE TEST REPORT")
        report.append("=" * 80)
        report.append(f"Test Execution Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Base URL: {self.base_url}")
        report.append("")
        
        total_tests = 0
        total_passed = 0
        total_failed = 0
        total_skipped = 0
        total_execution_time = 0
        
        stage_names = [
            "Stage 1: Pre-Qualification",
            "Stage 2: Loan Application", 
            "Stage 3: Application Processing",
            "Stage 4: Underwriting",
            "Stage 5: Credit Decision",
            "Stage 6: Quality Check",
            "Stage 7: Loan Funding",
            "Complete Workflow Tests",
            "Status Endpoint Tests"
        ]
        
        for i, stage_results in enumerate(all_results):
            if i < len(stage_names):
                report.append(f"\n{stage_names[i]}")
                report.append("-" * len(stage_names[i]))
            
            stage_passed = 0
            stage_failed = 0
            stage_skipped = 0
            stage_time = 0
            
            for test_case in stage_results:
                total_tests += 1
                if test_case.execution_time:
                    total_execution_time += test_case.execution_time
                    stage_time += test_case.execution_time
                
                if test_case.result == TestResult.PASS:
                    total_passed += 1
                    stage_passed += 1
                    status_icon = "✅"
                elif test_case.result == TestResult.FAIL:
                    total_failed += 1
                    stage_failed += 1
                    status_icon = "❌"
                else:
                    total_skipped += 1
                    stage_skipped += 1
                    status_icon = "⏭️"
                
                report.append(f"{status_icon} {test_case.name}")
                report.append(f"   Description: {test_case.description}")
                if test_case.execution_time:
                    report.append(f"   Execution Time: {test_case.execution_time:.2f}s")
                if test_case.error_message:
                    report.append(f"   Error: {test_case.error_message}")
                report.append("")
            
            # Stage summary
            report.append(f"Stage Summary: {stage_passed} passed, {stage_failed} failed, {stage_skipped} skipped")
            report.append(f"Stage Execution Time: {stage_time:.2f}s")
            report.append("")
        
        # Overall summary
        report.append("=" * 80)
        report.append("OVERALL TEST SUMMARY")
        report.append("=" * 80)
        report.append(f"Total Tests: {total_tests}")
        report.append(f"Passed: {total_passed} ({(total_passed/total_tests*100):.1f}%)")
        report.append(f"Failed: {total_failed} ({(total_failed/total_tests*100):.1f}%)")
        report.append(f"Skipped: {total_skipped} ({(total_skipped/total_tests*100):.1f}%)")
        report.append(f"Total Execution Time: {total_execution_time:.2f}s")
        report.append("")
        
        # Test environment info
        report.append("TEST ENVIRONMENT")
        report.append("-" * 16)
        report.append(f"Python Version: {__import__('sys').version}")
        report.append(f"Requests Version: {requests.__version__}")
        report.append("")
        
        return "\n".join(report)

    def run_all_tests(self) -> None:
        """Run all test suites"""
        logger.info("Starting Comprehensive LOS Test Suite")
        logger.info(f"Testing against: {self.base_url}")
        
        # Check if server is running
        try:
            status, response = self.make_request("GET", "/")
            if status != 200:
                logger.warning(f"Server health check failed: {status}")
        except Exception as e:
            logger.error(f"Cannot connect to server: {e}")
            return
        
        all_results = []
        
        # Run all test stages
        test_methods = [
            self.test_stage1_prequalification,
            self.test_stage2_loan_application,
            self.test_stage3_application_processing,
            self.test_stage4_underwriting,
            self.test_stage5_credit_decision,
            self.test_stage6_quality_check,
            self.test_stage7_loan_funding,
            self.test_complete_workflow,
            self.test_status_endpoints
        ]
        
        for test_method in test_methods:
            try:
                results = test_method()
                all_results.append(results)
                # Small delay between test stages
                time.sleep(1)
            except Exception as e:
                logger.error(f"Test method {test_method.__name__} failed: {e}")
                all_results.append([])
        
        # Generate and save report
        report = self.generate_test_report(all_results)
        
        # Save report to file
        report_filename = f"los_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        # Print report to console
        print(report)
        
        logger.info(f"Test report saved to: {report_filename}")
        logger.info("Comprehensive LOS Test Suite Completed")

def main():
    """Main function to run the test suite"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Comprehensive LOS Test Suite')
    parser.add_argument('--url', default='http://localhost:3000', 
                       help='Base URL of the LOS API (default: http://localhost:3000)')
    parser.add_argument('--stage', choices=['1', '2', '3', '4', '5', '6', '7', 'workflow', 'status', 'all'],
                       default='all', help='Specific stage to test (default: all)')
    
    args = parser.parse_args()
    
    # Create test suite instance
    test_suite = LOSTestSuite(base_url=args.url)
    
    if args.stage == 'all':
        test_suite.run_all_tests()
    else:
        # Run specific stage tests
        stage_methods = {
            '1': test_suite.test_stage1_prequalification,
            '2': test_suite.test_stage2_loan_application,
            '3': test_suite.test_stage3_application_processing,
            '4': test_suite.test_stage4_underwriting,
            '5': test_suite.test_stage5_credit_decision,
            '6': test_suite.test_stage6_quality_check,
            '7': test_suite.test_stage7_loan_funding,
            'workflow': test_suite.test_complete_workflow,
            'status': test_suite.test_status_endpoints
        }
        
        if args.stage in stage_methods:
            logger.info(f"Running Stage {args.stage} tests only")
            results = stage_methods[args.stage]()
            
            # Generate simple report for single stage
            passed = sum(1 for r in results if r.result == TestResult.PASS)
            failed = sum(1 for r in results if r.result == TestResult.FAIL)
            total = len(results)
            
            print(f"\nStage {args.stage} Test Results:")
            print(f"Total: {total}, Passed: {passed}, Failed: {failed}")
            print(f"Success Rate: {(passed/total*100):.1f}%")

if __name__ == "__main__":
    main()