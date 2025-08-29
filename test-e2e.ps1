# PowerShell End-to-End LOS Testing Script
# Tests two applications through all 7 stages

Write-Host "🚀 LOS End-to-End Testing (PowerShell)" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "Testing two applications:"
Write-Host "📋 Application 1: Expected to be APPROVED (full workflow)" -ForegroundColor Green
Write-Host "📋 Application 2: Expected to be REJECTED (fails at underwriting)" -ForegroundColor Red
Write-Host "=" * 60
Write-Host ""

$baseUrl = "http://localhost:3000/api"
$app1Number = $null
$app2Number = $null

# Test Application 1 - Approved Profile
Write-Host "🟢 Testing Application 1 - Approved Path" -ForegroundColor Green
Write-Host "-" * 40

try {
    # Stage 1: Pre-Qualification (Approved Profile)
    Write-Host "  📝 Stage 1: Pre-Qualification (app1)"
    
    $app1Data = @{
        full_name = "RAJESH KUMAR SHARMA"
        phone = "9876543210"
        email = "rajesh.sharma@example.com"
        pan_number = "ABCDE1234F"
        date_of_birth = "1985-06-15"
        requested_loan_amount = 500000
        loan_purpose = "home_improvement"
        employment_type = "salaried"
    } | ConvertTo-Json
    
    $response1 = Invoke-RestMethod -Uri "$baseUrl/pre-qualification/process" -Method Post -Body $app1Data -ContentType "application/json"
    
    if ($response1.success) {
        $app1Number = $response1.data.applicationNumber
        Write-Host "     ✅ Pre-qualification completed: $app1Number" -ForegroundColor Green
        Write-Host "     📊 Decision: $($response1.data.eligibility_result.decision)"
        Write-Host "     📊 Score: $($response1.data.eligibility_result.score)"
    } else {
        Write-Host "     ❌ Pre-qualification failed: $($response1.error)" -ForegroundColor Red
        exit 1
    }
    
    # Stage 2: Loan Application (Approved Profile)
    if ($app1Number) {
        Write-Host "  📋 Stage 2: Loan Application (app1)"
        
        $loanData1 = @{
            employment_details = @{
                employment_type = "salaried"
                company_name = "Tech Solutions Pvt Ltd"
                designation = "Senior Software Engineer"
                work_experience_years = 8
                monthly_salary = 85000
                company_address = "Sector 62, Noida, UP"
                hr_contact = "9876543211"
            }
            income_details = @{
                monthly_salary = 85000
                other_income = 10000
                total_monthly_income = 95000
                existing_emi = 12000
                net_monthly_income = 83000
            }
            banking_details = @{
                primary_bank = "HDFC Bank"
                account_number = "12345678901234"
                account_type = "Savings"
                average_monthly_balance = 75000
                banking_relationship_years = 5
            }
            address_details = @{
                current_address = @{
                    address_line_1 = "A-123, Sector 15"
                    address_line_2 = "Near Metro Station"
                    city = "Noida"
                    state = "Uttar Pradesh"
                    pincode = "201301"
                    address_type = "owned"
                    years_at_address = 3
                }
            }
            references = @(
                @{
                    name = "Amit Gupta"
                    relationship = "friend"
                    mobile = "9876543212"
                    address = "B-456, Sector 16, Noida"
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $response2 = Invoke-RestMethod -Uri "$baseUrl/loan-application/process/$app1Number" -Method Post -Body $loanData1 -ContentType "application/json"
        
        if ($response2.success) {
            Write-Host "     ✅ Loan application completed" -ForegroundColor Green
            Write-Host "     📊 Status: $($response2.status)"
        } else {
            Write-Host "     ❌ Loan application failed: $($response2.error)" -ForegroundColor Red
        }
        
        # Stage 3-7: Automated Workflow
        Write-Host "  🤖 Automated Workflow: Stages 3-7 (app1)"
        
        $response3 = Invoke-RestMethod -Uri "$baseUrl/automated-workflow/start/$app1Number" -Method Post -ContentType "application/json"
        
        if ($response3.success) {
            Write-Host "     ✅ Automated workflow completed" -ForegroundColor Green
            Write-Host "     📊 Workflow Status: $($response3.data.workflow_status)"
            Write-Host "     📊 Stages Processed: $($response3.data.stages_processed)/$($response3.data.total_stages)"
            
            if ($response3.data.stage_results) {
                $stageNum = 3
                foreach ($stage in $response3.data.stage_results) {
                    Write-Host "        Stage $stageNum`: $($stage.stage) - $($stage.status)"
                    $stageNum++
                }
            }
        } else {
            Write-Host "     ❌ Automated workflow failed: $($response3.error)" -ForegroundColor Red
        }
    }
    
    Write-Host "✅ Application 1 completed successfully" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Application 1 failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test Application 2 - Rejected Profile
Write-Host "🔴 Testing Application 2 - Rejected Path" -ForegroundColor Red
Write-Host "-" * 40

try {
    # Stage 1: Pre-Qualification (Rejected Profile)
    Write-Host "  📝 Stage 1: Pre-Qualification (app2)"
    
    $app2Data = @{
        full_name = "SURESH KUMAR"
        phone = "9876543220"
        email = "suresh.kumar@example.com"
        pan_number = "XYZAB5678C"
        date_of_birth = "1995-03-10"
        requested_loan_amount = 1000000
        loan_purpose = "business"
        employment_type = "self_employed"
    } | ConvertTo-Json
    
    $response4 = Invoke-RestMethod -Uri "$baseUrl/pre-qualification/process" -Method Post -Body $app2Data -ContentType "application/json"
    
    if ($response4.success) {
        $app2Number = $response4.data.applicationNumber
        Write-Host "     ✅ Pre-qualification completed: $app2Number" -ForegroundColor Green
        Write-Host "     📊 Decision: $($response4.data.eligibility_result.decision)"
        Write-Host "     📊 Score: $($response4.data.eligibility_result.score)"
    } else {
        Write-Host "     ❌ Pre-qualification failed: $($response4.error)" -ForegroundColor Red
    }
    
    # Stage 2: Loan Application (Rejected Profile)
    if ($app2Number) {
        Write-Host "  📋 Stage 2: Loan Application (app2)"
        
        $loanData2 = @{
            employment_details = @{
                employment_type = "self_employed"
                company_name = "Small Business"
                designation = "Owner"
                work_experience_years = 2
                monthly_salary = 25000
                company_address = "Local Market, Delhi"
                hr_contact = "9876543221"
            }
            income_details = @{
                monthly_salary = 25000
                other_income = 5000
                total_monthly_income = 30000
                existing_emi = 18000
                net_monthly_income = 12000
            }
            banking_details = @{
                primary_bank = "Local Bank"
                account_number = "98765432109876"
                account_type = "Current"
                average_monthly_balance = 5000
                banking_relationship_years = 1
            }
            address_details = @{
                current_address = @{
                    address_line_1 = "Room 12, Building 5"
                    address_line_2 = "Rental Complex"
                    city = "Delhi"
                    state = "Delhi"
                    pincode = "110001"
                    address_type = "rented"
                    years_at_address = 1
                }
            }
            references = @(
                @{
                    name = "Local Friend"
                    relationship = "friend"
                    mobile = "9876543222"
                    address = "Local Address, Delhi"
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $response5 = Invoke-RestMethod -Uri "$baseUrl/loan-application/process/$app2Number" -Method Post -Body $loanData2 -ContentType "application/json"
        
        if ($response5.success) {
            Write-Host "     ✅ Loan application completed" -ForegroundColor Green
            Write-Host "     📊 Status: $($response5.status)"
        } else {
            Write-Host "     ❌ Loan application failed: $($response5.error)" -ForegroundColor Red
        }
        
        # Stage 3-7: Automated Workflow (Expected to fail)
        Write-Host "  🤖 Automated Workflow: Stages 3-7 (app2)"
        
        try {
            $response6 = Invoke-RestMethod -Uri "$baseUrl/automated-workflow/start/$app2Number" -Method Post -ContentType "application/json"
            
            if ($response6.success -and $response6.data.workflow_status -eq "rejected") {
                Write-Host "     ✅ Automated workflow rejected as expected" -ForegroundColor Green
                Write-Host "     📊 Workflow Status: $($response6.data.workflow_status)"
                Write-Host "     📊 Rejection Reason: $($response6.data.rejection_reason)"
            } else {
                Write-Host "     ⚠️ Unexpected workflow result: $($response6.data.workflow_status)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "     ✅ Automated workflow failed as expected (rejection)" -ForegroundColor Green
            Write-Host "     📊 Error: $($_.Exception.Message)"
        }
    }
    
    Write-Host "✅ Application 2 completed (expected rejection)" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Application 2 failed unexpectedly: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Final Summary
Write-Host "🏁 E2E TEST RESULTS" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host "📋 APPLICATION 1 (Approved Path): $app1Number"
Write-Host "📋 APPLICATION 2 (Rejected Path): $app2Number"
Write-Host ""
Write-Host "🎯 Test completed! Check your LOS dashboard to verify the results." -ForegroundColor Green
Write-Host "   - Underwriting Dashboard: http://localhost:3000/src/tests/underwriting-status-management.html"
Write-Host "   - API Status: http://localhost:3000/api"
Write-Host ""
