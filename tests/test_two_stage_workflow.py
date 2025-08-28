#!/usr/bin/env python3
"""
Two-Stage Loan Application Testing Script

This script tests both Stage 1 (Pre-qualification) and Stage 2 (Loan Application)
using test data from the third-party simulator.

Usage: python test_two_stage_workflow.py
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Configuration
BASE_URL = "http://localhost:3000/api"
PRE_QUALIFICATION_URL = f"{BASE_URL}/pre-qualification/process"
LOAN_APPLICATION_URL = f"{BASE_URL}/loan-application/process"

# Test Data - Based on third-party simulator responses
TEST_APPLICATIONS = [
    {
        "name": "Excellent Credit Profile",
        "data": {
            "applicantName": "RAJESH KUMAR SHARMA",
            "phone": "9876543210",
            "email": "rajesh.sharma@techsolutions.com",
            "dateOfBirth": "1985-06-15",
            "panNumber": "ABCDE1234F",
            "loanAmount": 500000,
            "loanPurpose": "home_improvement",
            "employmentType": "salaried",
            "monthlyIncome": 75000,
            "companyName": "Tech Solutions Pvt Ltd",
            "workExperienceYears": 6,
            "existingEmi": 37000
        },
        "expected_stage1": "approved",
        "expected_stage2": "approved"
    },
    {
        "name": "Good Credit Profile",
        "data": {
            "applicantName": "JASHUVA PEYYALA",
            "phone": "9876543211",
            "email": "jashuva.peyyala@infosys.com",
            "dateOfBirth": "1997-08-06",
            "panNumber": "EMMPP2177M",
            "loanAmount": 300000,
            "loanPurpose": "personal",
            "employmentType": "salaried",
            "monthlyIncome": 50000,
            "companyName": "Infosys Limited",
            "workExperienceYears": 3,
            "existingEmi": 12000
        },
        "expected_stage1": "approved",
        "expected_stage2": "approved"
    },
    {
        "name": "Fair Credit Profile",
        "data": {
            "applicantName": "AMIT KUMAR SINGH",
            "phone": "9876543212",
            "email": "amit.singh@example.com",
            "dateOfBirth": "1990-12-25",
            "panNumber": "BXZPM1234C",
            "loanAmount": 200000,
            "loanPurpose": "business",
            "employmentType": "self_employed",
            "monthlyIncome": 40000,
            "companyName": "Singh Enterprises",
            "workExperienceYears": 5,
            "existingEmi": 8000
        },
        "expected_stage1": "approved",
        "expected_stage2": "conditional"
    },
    {
        "name": "Invalid PAN Profile",
        "data": {
            "applicantName": "TEST USER",
            "phone": "9876543213",
            "email": "test.user@example.com",
            "dateOfBirth": "1988-05-10",
            "panNumber": "INVALID123",
            "loanAmount": 150000,
            "loanPurpose": "personal",
            "employmentType": "salaried",
            "monthlyIncome": 35000,
            "companyName": "Test Company",
            "workExperienceYears": 2,
            "existingEmi": 5000
        },
        "expected_stage1": "rejected",
        "expected_stage2": "not_applicable"
    }
]

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_test_result(test_name, stage, expected, actual, details=None):
    """Print formatted test results"""
    status = "✅ PASS" if expected == actual else "❌ FAIL"
    print(f"{status} | {test_name} | Stage {stage} | Expected: {expected} | Actual: {actual}")
    if details:
        print(f"    Details: {details}")

def test_stage1_prequalification(app_data):
    """Test Stage 1 - Pre-qualification"""
    try:
        response = requests.post(PRE_QUALIFICATION_URL, json=app_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            data = result.get("data", {})
            return {
                "success": True,
                "status": data.get("status", "unknown"),
                "application_id": data.get("applicationNumber"),
                "message": data.get("message", ""),
                "estimated_loan_amount": data.get("estimated_loan_amount"),
                "response": result
            }
        else:
            return {
                "success": False,
                "status": "rejected",
                "error": f"HTTP {response.status_code}: {response.text}",
                "response": None
            }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "response": None
        }

def test_stage2_loan_application(application_id, app_data):
    """Test Stage 2 - Loan Application"""
    # Comprehensive Stage 2 data structure matching exact validation requirements
    stage2_data = {
        "personal_details": {
            "aadhaar_number": "123456789012",
            "marital_status": "single",
            "number_of_dependents": 0,
            "education_level": "graduate"
        },
        "employment_details": {
            "employment_type": app_data["employmentType"],
            "company_name": app_data["companyName"],
            "designation": "Software Engineer",
            "monthly_gross_income": app_data["monthlyIncome"],
            "monthly_net_income": int(app_data["monthlyIncome"] * 0.8),
            "work_experience_years": app_data["workExperienceYears"],
            "current_job_experience_years": 2,
            "industry_type": "it_software",
            "employment_status": "permanent",
            "company_address": {
                "street": "Tech Park, Sector 5",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            }
        },
        "address_details": {
            "current_address": {
                "street_address": "123 Main Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "residence_type": "rented",
                "years_at_address": 3
            },
            "permanent_address": {
                "street_address": "123 Main Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "same_as_current": True
        },
        "banking_details": {
            "primary_account": {
                "account_number": "1234567890123456",
                "ifsc_code": "HDFC0000123",
                "bank_name": "HDFC Bank",
                "account_type": "savings",
                "account_holder_name": app_data["applicantName"],
                "branch_name": "Mumbai Main Branch",
                "account_opening_date": "2020-01-15",
                "average_monthly_balance": 50000
            },
            "monthly_expenses": {
                "total_monthly_expenses": 25000
            }
        },
        "references": [
            {
                "name": "John Doe",
                "mobile": "9876543210",
                "relationship": "friend",
                "address": "456 Reference Street, Mumbai, Maharashtra, 400002",
                "years_known": 5
            },
            {
                "name": "Jane Smith",
                "mobile": "9876543211",
                "relationship": "colleague",
                "address": "789 Colleague Avenue, Mumbai, Maharashtra, 400003",
                "years_known": 3
            }
        ],
        "required_documents": {
            "identity_proof": {
                "document_type": "pan_card",
                "document_url": "https://example.com/pan.pdf"
            },
            "address_proof": {
                "document_type": "aadhaar_card",
                "document_url": "https://example.com/aadhaar.pdf"
            },
            "income_proof": {
                "document_type": "salary_slips",
                "document_url": "https://example.com/salary.pdf"
            },
            "bank_statements": {
                "document_type": "bank_statements",
                "document_url": "https://example.com/bank.pdf"
            }
        },
        "additional_information": {
            "loan_purpose_details": f"Detailed explanation for {app_data['loanPurpose']} loan requirement",
            "repayment_source": "salary",
            "preferred_tenure_months": 36,
            "existing_relationship_with_bank": False,
            "co_applicant_required": False,
            "property_owned": False
        }
    }
    
    # Debug: Print the data being sent
    print(f"\n🔍 Debug: Sending Stage 2 data for {application_id}")
    print(f"Personal details: {stage2_data['personal_details']}")
    print(f"Address details: {stage2_data['address_details']}")
    
    try:
        # Use application_id in URL path as expected by the API
        stage2_url = f"{BASE_URL}/loan-application/{application_id}"
        response = requests.post(stage2_url, json=stage2_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "status": result.get("status", "unknown"),
                "message": result.get("message", ""),
                "loan_amount": result.get("approved_loan_amount"),
                "response": result
            }
        else:
            return {
                "success": False,
                "status": "rejected",
                "error": f"HTTP {response.status_code}: {response.text}",
                "response": None
            }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "response": None
        }

def main():
    """Main test execution"""
    print_header("Two-Stage Loan Application Testing")
    print(f"Testing against: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    total_tests = 0
    passed_tests = 0
    test_results = []
    
    for i, test_case in enumerate(TEST_APPLICATIONS, 1):
        print_header(f"Test Case {i}: {test_case['name']}")
        
        # Stage 1 Testing
        print("\n🔍 Testing Stage 1 - Pre-qualification...")
        stage1_result = test_stage1_prequalification(test_case["data"])
        
        total_tests += 1
        stage1_passed = stage1_result["status"] == test_case["expected_stage1"]
        if stage1_passed:
            passed_tests += 1
        
        print_test_result(
            test_case["name"],
            1,
            test_case["expected_stage1"],
            stage1_result["status"],
            stage1_result.get("message") or stage1_result.get("error")
        )
        
        # Stage 2 Testing (only if Stage 1 was approved)
        stage2_result = None
        if stage1_result["status"] == "approved" and stage1_result.get("application_id"):
            print(f"\n🔍 Testing Stage 2 - Loan Application (App ID: {stage1_result['application_id']})...")
            time.sleep(1)  # Brief pause between stages
            
            stage2_result = test_stage2_loan_application(
                stage1_result["application_id"],
                test_case["data"]
            )
            
            total_tests += 1
            stage2_passed = (
                test_case["expected_stage2"] == "not_applicable" or
                stage2_result["status"] == test_case["expected_stage2"]
            )
            if stage2_passed:
                passed_tests += 1
            
            print_test_result(
                test_case["name"],
                2,
                test_case["expected_stage2"],
                stage2_result["status"],
                stage2_result.get("message") or stage2_result.get("error")
            )
        elif test_case["expected_stage2"] != "not_applicable":
            print("\n⏭️  Skipping Stage 2 - Stage 1 was not approved")
            total_tests += 1
            print_test_result(
                test_case["name"],
                2,
                test_case["expected_stage2"],
                "skipped",
                "Stage 1 was not approved"
            )
        
        # Store results for summary
        test_results.append({
            "name": test_case["name"],
            "stage1": stage1_result,
            "stage2": stage2_result
        })
        
        print("\n" + "-"*40)
        time.sleep(2)  # Pause between test cases
    
    # Print Summary
    print_header("Test Summary")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    # Detailed Results
    print("\n📊 Detailed Results:")
    for result in test_results:
        print(f"\n{result['name']}:")
        print(f"  Stage 1: {result['stage1']['status']} - {result['stage1'].get('message', result['stage1'].get('error', ''))}")
        if result['stage2']:
            print(f"  Stage 2: {result['stage2']['status']} - {result['stage2'].get('message', result['stage2'].get('error', ''))}")
        else:
            print(f"  Stage 2: Not tested")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Exit with appropriate code
    sys.exit(0 if passed_tests == total_tests else 1)

if __name__ == "__main__":
    main()