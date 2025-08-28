# Test Complete Workflow with Fixed Endpoints
$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

# Step 1: Pre-qualification
Write-Host "=== Step 1: Pre-qualification ===" -ForegroundColor Green
$preQualData = @{
    applicantName = "RAJESH KUMAR SHARMA"
    dateOfBirth = "1985-06-15"
    panNumber = "ABCDE1234F"
    phone = "9876543210"
} | ConvertTo-Json -Depth 3

try {
    $preQualResponse = Invoke-RestMethod -Uri "$baseUrl/api/pre-qualification/process" -Method POST -Body $preQualData -Headers $headers
    Write-Host "Pre-qualification Status: $($preQualResponse.data.status)" -ForegroundColor Yellow
    Write-Host "Application Number: $($preQualResponse.data.applicationNumber)" -ForegroundColor Yellow
    $applicationNumber = $preQualResponse.data.applicationNumber
} catch {
    Write-Host "Pre-qualification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Application Processing
Write-Host "\n=== Step 2: Application Processing ===" -ForegroundColor Green
$appProcessData = @{
    documents = @{
        identity_proof = "pan_card"
        address_proof = "aadhaar_card"
        income_proof = "salary_slips"
        bank_statements = "last_6_months"
    }
    verification_consent = $true
} | ConvertTo-Json -Depth 3

try {
    $appProcessResponse = Invoke-RestMethod -Uri "$baseUrl/api/application-processing/$applicationNumber" -Method POST -Body $appProcessData -Headers $headers
    Write-Host "Application Processing Status: $($appProcessResponse.status)" -ForegroundColor Yellow
    Write-Host "Application Processing Phase: $($appProcessResponse.phase)" -ForegroundColor Yellow
} catch {
    Write-Host "Application processing failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Underwriting (Fixed endpoint)
Write-Host "\n=== Step 3: Underwriting ===" -ForegroundColor Green
$underwritingData = @{
    risk_assessment_consent = $true
    additional_documents = @()
} | ConvertTo-Json -Depth 3

try {
    $underwritingResponse = Invoke-RestMethod -Uri "$baseUrl/api/underwriting/$applicationNumber" -Method POST -Body $underwritingData -Headers $headers
    Write-Host "Underwriting Status: $($underwritingResponse.status)" -ForegroundColor Yellow
    Write-Host "Underwriting Phase: $($underwritingResponse.phase)" -ForegroundColor Yellow
    Write-Host "Underwriting Score: $($underwritingResponse.underwriting_score)" -ForegroundColor Yellow
} catch {
    Write-Host "Underwriting failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Credit Decision
Write-Host "\n=== Step 4: Credit Decision ===" -ForegroundColor Green
$creditDecisionData = @{
    final_review_consent = $true
} | ConvertTo-Json -Depth 3

try {
    $creditResponse = Invoke-RestMethod -Uri "$baseUrl/api/credit-decision/$applicationNumber" -Method POST -Body $creditDecisionData -Headers $headers
    Write-Host "Credit Decision Status: $($creditResponse.status)" -ForegroundColor Yellow
    Write-Host "Credit Decision: $($creditResponse.decision)" -ForegroundColor Yellow
    if ($creditResponse.recommended_terms) {
        Write-Host "Loan Amount: $($creditResponse.recommended_terms.loan_amount)" -ForegroundColor Yellow
        Write-Host "Interest Rate: $($creditResponse.recommended_terms.interest_rate)%" -ForegroundColor Yellow
        Write-Host "EMI Amount: $($creditResponse.recommended_terms.emi_amount)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Credit decision failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "\n=== Workflow Test Completed Successfully! ===" -ForegroundColor Green
Write-Host "Final Application Number: $applicationNumber" -ForegroundColor Cyan