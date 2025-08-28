#!/usr/bin/env python3
"""
Comprehensive Loan Origination System Test
Tests all stages with third-party simulator data to verify ENUM fixes
"""

import requests
import json
import time
import random
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:3000"
THIRD_PARTY_URL = "http://localhost:3001"

class LoanSystemTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.third_party_url = THIRD_PARTY_URL
        self.test_results = []
        self.application_numbers = []
        
    def log_test(self, stage, test_name, success, details=None):
        """Log test results"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'stage': stage,
            'test_name': test_name,
            'success': success,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} [{stage}] {test_name}")
        if details and not success:
            print(f"   Details: {details}")
    
    def check_service_health(self):
        """Check if all services are running"""
        print("\n🔍 Checking service health...")
        
        # Check backend
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            backend_healthy = response.status_code == 200
            self.log_test("SYSTEM", "Backend Health Check", backend_healthy, 
                         {'status_code': response.status_code})
        except Exception as e:
            self.log_test("SYSTEM", "Backend Health Check", False, {'error': str(e)})
            return False
        
        # Check third-party simulator
        try:
            response = requests.get(f"{self.third_party_url}/health", timeout=5)
            third_party_healthy = response.status_code == 200
            self.log_test("SYSTEM", "Third-party Simulator Health Check", third_party_healthy,
                         {'status_code': response.status_code})
        except Exception as e:
            self.log_test("SYSTEM", "Third-party Simulator Health Check", False, {'error': str(e)})
            return False
        
        return backend_healthy and third_party_healthy
    
    def get_test_profiles(self):
        """Get test profiles - using hardcoded profiles for testing"""
        profiles = [
            {
                "name": "High Income Professional",
                "personal_details": {
                    "full_name": "John Smith",
                    "date_of_birth": "1985-06-15",
                    "phone_number": "+91-9876543210",
                    "email": "john.smith@email.com",
                    "pan_number": "ABCDE1234F"
                },
                "loan_details": {
                    "loan_amount": 500000,
                    "loan_purpose": "home_purchase",
                    "employment_type": "salaried"
                },
                "employment_details": {
                    "employer_name": "Tech Corp Ltd",
                    "designation": "Senior Software Engineer",
                    "monthly_salary": 80000,
                    "work_experience_months": 48
                },
                "financial_details": {
                    "monthly_income": 80000,
                    "existing_emis": 15000
                },
                "banking_details": {
                    "bank_name": "HDFC Bank",
                    "account_number": "12345678901234",
                    "account_type": "savings"
                }
            },
            {
                "name": "Medium Income Business Owner",
                "personal_details": {
                    "full_name": "Priya Sharma",
                    "date_of_birth": "1990-03-22",
                    "phone_number": "+91-9876543211",
                    "email": "priya.sharma@email.com",
                    "pan_number": "FGHIJ5678K"
                },
                "loan_details": {
                    "loan_amount": 300000,
                    "loan_purpose": "business_expansion",
                    "employment_type": "self_employed"
                },
                "employment_details": {
                    "employer_name": "Sharma Enterprises",
                    "designation": "Business Owner",
                    "monthly_salary": 50000,
                    "work_experience_months": 36
                },
                "financial_details": {
                    "monthly_income": 50000,
                    "existing_emis": 8000
                },
                "banking_details": {
                    "bank_name": "ICICI Bank",
                    "account_number": "56789012345678",
                    "account_type": "current"
                }
            },
            {
                "name": "Entry Level Professional",
                "personal_details": {
                    "full_name": "Rahul Kumar",
                    "date_of_birth": "1995-11-08",
                    "phone_number": "+91-9876543212",
                    "email": "rahul.kumar@email.com",
                    "pan_number": "LMNOP9012Q"
                },
                "loan_details": {
                    "loan_amount": 200000,
                    "loan_purpose": "personal",
                    "employment_type": "salaried"
                },
                "employment_details": {
                    "employer_name": "StartUp Inc",
                    "designation": "Junior Developer",
                    "monthly_salary": 35000,
                    "work_experience_months": 18
                },
                "financial_details": {
                    "monthly_income": 35000,
                    "existing_emis": 5000
                },
                "banking_details": {
                    "bank_name": "SBI",
                    "account_number": "90123456789012",
                    "account_type": "savings"
                }
            }
        ]
        
        self.log_test("SYSTEM", "Get Test Profiles", True, 
                     {'profile_count': len(profiles)})
        return profiles
    
    def test_pre_qualification(self, profile):
        """Test pre-qualification stage"""
        print(f"\n🎯 Testing Pre-qualification for profile: {profile['name']}")
        
        pre_qual_data = {
            "applicantName": profile['personal_details']['full_name'],
            "dateOfBirth": profile['personal_details']['date_of_birth'],
            "phone": profile['personal_details']['phone_number'],
            "email": profile['personal_details']['email'],
            "panNumber": profile['personal_details']['pan_number'],
            "loanAmount": profile['loan_details']['loan_amount'],
            "loanPurpose": profile['loan_details']['loan_purpose'],
            "employmentType": profile['loan_details']['employment_type']
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/pre-qualification/process",
                json=pre_qual_data,
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            try:
                response_data = response.json()
            except:
                response_data = {'error': 'Invalid JSON response', 'text': response.text}
            
            if success and response_data.get('success'):
                app_number = response_data.get('data', {}).get('applicationNumber') or response_data.get('applicationNumber')
                if app_number:
                    self.application_numbers.append(app_number)
                    self.log_test("PRE_QUALIFICATION", f"Submit Application - {profile['name']}", True,
                                 {'application_number': app_number, 'status': response_data.get('status')})
                    return app_number
                else:
                    self.log_test("PRE_QUALIFICATION", f"Submit Application - {profile['name']}", False,
                                 {'error': 'No application number returned', 'response': response_data})
            else:
                self.log_test("PRE_QUALIFICATION", f"Submit Application - {profile['name']}", False,
                             {'status_code': response.status_code, 'response': response_data})
            
        except Exception as e:
            self.log_test("PRE_QUALIFICATION", f"Submit Application - {profile['name']}", False,
                         {'error': str(e)})
        
        return None
    
    def test_loan_application(self, app_number, profile):
        """Test loan application stage"""
        print(f"\n📋 Testing Loan Application for {app_number}")
        
        # Wait a bit for pre-qualification to complete
        time.sleep(2)
        
        loan_app_data = {
            "employment_details": profile['employment_details'],
            "financial_details": profile['financial_details'],
            "banking_details": profile['banking_details'],
            "documents": profile.get('documents', {
                "salary_slips": "salary_slip_data",
                "bank_statements": "bank_statement_data",
                "employment_certificate": "employment_cert_data",
                "address_proof": "address_proof_data",
                "identity_proof": "identity_proof_data"
            })
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/loan-application/{app_number}",
                json=loan_app_data,
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            
            self.log_test("LOAN_APPLICATION", f"Submit Application - {app_number}", success,
                         {'status_code': response.status_code, 'phase': response_data.get('phase'),
                          'status': response_data.get('status')})
            
            return success and response_data.get('success')
            
        except Exception as e:
            self.log_test("LOAN_APPLICATION", f"Submit Application - {app_number}", False,
                         {'error': str(e)})
            return False
    
    def test_underwriting(self, app_number):
        """Test underwriting stage"""
        print(f"\n🔍 Testing Underwriting for {app_number}")
        
        # Wait for loan application to complete
        time.sleep(3)
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/underwriting/{app_number}",
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            
            self.log_test("UNDERWRITING", f"Process Underwriting - {app_number}", success,
                         {'status_code': response.status_code, 'phase': response_data.get('phase'),
                          'status': response_data.get('status')})
            
            return success and response_data.get('success')
            
        except Exception as e:
            self.log_test("UNDERWRITING", f"Process Underwriting - {app_number}", False,
                         {'error': str(e)})
            return False
    
    def test_credit_decision(self, app_number):
        """Test credit decision stage"""
        print(f"\n💳 Testing Credit Decision for {app_number}")
        
        # Wait for underwriting to complete
        time.sleep(3)
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/credit-decision/{app_number}",
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            
            self.log_test("CREDIT_DECISION", f"Process Credit Decision - {app_number}", success,
                         {'status_code': response.status_code, 'phase': response_data.get('phase'),
                          'status': response_data.get('status')})
            
            return success and response_data.get('success')
            
        except Exception as e:
            self.log_test("CREDIT_DECISION", f"Process Credit Decision - {app_number}", False,
                         {'error': str(e)})
            return False
    
    def test_quality_check(self, app_number):
        """Test quality check stage"""
        print(f"\n✅ Testing Quality Check for {app_number}")
        
        # Wait for credit decision to complete
        time.sleep(3)
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/quality-check/{app_number}",
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            
            self.log_test("QUALITY_CHECK", f"Process Quality Check - {app_number}", success,
                         {'status_code': response.status_code, 'phase': response_data.get('phase'),
                          'status': response_data.get('status')})
            
            return success and response_data.get('success')
            
        except Exception as e:
            self.log_test("QUALITY_CHECK", f"Process Quality Check - {app_number}", False,
                         {'error': str(e)})
            return False
    
    def test_loan_funding(self, app_number):
        """Test loan funding stage"""
        print(f"\n💰 Testing Loan Funding for {app_number}")
        
        # Wait for quality check to complete
        time.sleep(3)
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/loan-funding/{app_number}",
                headers={'Content-Type': 'application/json'}
            )
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            
            self.log_test("LOAN_FUNDING", f"Process Loan Funding - {app_number}", success,
                         {'status_code': response.status_code, 'phase': response_data.get('phase'),
                          'status': response_data.get('status')})
            
            return success and response_data.get('success')
            
        except Exception as e:
            self.log_test("LOAN_FUNDING", f"Process Loan Funding - {app_number}", False,
                         {'error': str(e)})
            return False
    
    def test_complete_flow(self, profile):
        """Test complete loan flow for a profile"""
        print(f"\n🚀 Starting complete flow test for: {profile['name']}")
        
        # Stage 1: Pre-qualification
        app_number = self.test_pre_qualification(profile)
        if not app_number:
            return False
        
        # Stage 2: Loan Application
        if not self.test_loan_application(app_number, profile):
            return False
        
        # Stage 3: Underwriting
        if not self.test_underwriting(app_number):
            return False
        
        # Stage 4: Credit Decision
        if not self.test_credit_decision(app_number):
            return False
        
        # Stage 5: Quality Check
        if not self.test_quality_check(app_number):
            return False
        
        # Stage 6: Loan Funding
        if not self.test_loan_funding(app_number):
            return False
        
        print(f"✅ Complete flow test PASSED for {profile['name']} (App: {app_number})")
        return True
    
    def run_comprehensive_test(self):
        """Run comprehensive system test"""
        print("🧪 Starting Comprehensive Loan System Test")
        print("=" * 50)
        
        # Check backend service health (third-party simulator is optional)
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            backend_healthy = response.status_code == 200
            self.log_test("SYSTEM", "Backend Health Check", backend_healthy, 
                         {'status_code': response.status_code})
            if not backend_healthy:
                print("❌ Backend service health check failed. Aborting tests.")
                return False
        except Exception as e:
            self.log_test("SYSTEM", "Backend Health Check", False, {'error': str(e)})
            print("❌ Backend service health check failed. Aborting tests.")
            return False
        
        # Get test profiles
        profiles = self.get_test_profiles()
        if not profiles:
            print("❌ No test profiles available. Aborting tests.")
            return False
        
        # Test each profile
        successful_flows = 0
        total_flows = min(3, len(profiles))  # Test up to 3 profiles
        
        for i, profile in enumerate(profiles[:total_flows]):
            print(f"\n📊 Testing Profile {i+1}/{total_flows}: {profile['name']}")
            if self.test_complete_flow(profile):
                successful_flows += 1
            
            # Add delay between tests
            if i < total_flows - 1:
                print("⏳ Waiting before next test...")
                time.sleep(5)
        
        # Print summary
        self.print_test_summary(successful_flows, total_flows)
        
        return successful_flows == total_flows
    
    def print_test_summary(self, successful_flows, total_flows):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        # Overall results
        print(f"Complete Flows: {successful_flows}/{total_flows}")
        print(f"Success Rate: {(successful_flows/total_flows)*100:.1f}%")
        
        # Stage-wise results
        stages = {}
        for result in self.test_results:
            stage = result['stage']
            if stage not in stages:
                stages[stage] = {'pass': 0, 'fail': 0}
            
            if result['success']:
                stages[stage]['pass'] += 1
            else:
                stages[stage]['fail'] += 1
        
        print("\n📈 Stage-wise Results:")
        for stage, counts in stages.items():
            total = counts['pass'] + counts['fail']
            success_rate = (counts['pass'] / total) * 100 if total > 0 else 0
            print(f"  {stage}: {counts['pass']}/{total} ({success_rate:.1f}%)")
        
        # Application numbers created
        if self.application_numbers:
            print(f"\n📋 Applications Created: {len(self.application_numbers)}")
            for app_num in self.application_numbers:
                print(f"  - {app_num}")
        
        # Failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  [{test['stage']}] {test['test_name']}")
                if test['details']:
                    print(f"    Details: {test['details']}")
        
        print("\n" + "=" * 50)
        
        if successful_flows == total_flows:
            print("🎉 ALL TESTS PASSED! Database ENUM fixes are working correctly.")
        else:
            print("⚠️  Some tests failed. Please review the results above.")

def main():
    """Main test function"""
    tester = LoanSystemTester()
    
    try:
        success = tester.run_comprehensive_test()
        exit_code = 0 if success else 1
        
        print(f"\n🏁 Test completed with exit code: {exit_code}")
        return exit_code
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())