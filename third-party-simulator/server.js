/**
 * Third-Party API Simulator - SurePass Style
 * Simulates external services with realistic data structures
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.SIMULATOR_PORT || 4000;

// Load realistic response data
const panResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pan-responses.json'), 'utf8'));
const cibilResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/cibil-responses.json'), 'utf8'));
const bankResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/bank-statement-responses.json'), 'utf8'));
const employmentResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/employment-responses.json'), 'utf8'));

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[${timestamp}] Request Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

/**
 * PAN Verification Service - SurePass Style
 */
app.post('/api/pan/verify', (req, res) => {
    const { pan_number, name, date_of_birth } = req.body;
    
    // Simulate processing delay
    setTimeout(() => {
        console.log(`[PAN] Verifying PAN: ${pan_number} for ${name} with DOB: ${date_of_birth}`);
        
        // Check for specific PAN responses
        if (panResponses.valid_responses[pan_number]) {
            const response = { ...panResponses.valid_responses[pan_number] };
            
            // Calculate name match score
            const nameMatch = calculateNameMatch(name, response.data.name_on_pan);
            response.name_match = nameMatch.isMatch;
            response.name_match_score = nameMatch.score;
            response.name_provided = name;
            
            // Validate date of birth if provided
            if (date_of_birth && response.data.date_of_birth) {
                const dobMatch = date_of_birth === response.data.date_of_birth;
                response.dob_match = dobMatch;
                response.dob_provided = date_of_birth;
                response.dob_on_pan = response.data.date_of_birth;
                
                // If DOB doesn't match, return verification failure
                if (!dobMatch) {
                    return res.status(400).json({
                        success: false,
                        status_code: 400,
                        error: "DOB_MISMATCH",
                        message: "Date of birth does not match PAN records",
                        pan_number,
                        name_provided: name,
                        dob_provided: date_of_birth,
                        dob_match: false,
                        response_code: "1005",
                        response_message: "DOB mismatch",
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            return res.status(200).json(response);
        }
        
        // Check for invalid responses
        if (panResponses.invalid_responses[pan_number]) {
            return res.status(panResponses.invalid_responses[pan_number].status_code)
                     .json(panResponses.invalid_responses[pan_number]);
        }
        
        // Validate format
        const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number);
        if (!isValidFormat) {
            return res.status(400).json(panResponses.invalid_responses.INVALID123);
        }
        
        // PAN not found in database
        return res.status(404).json({
            success: false,
            status_code: 404,
            error: "PAN_NOT_FOUND",
            message: "PAN number not found in our database",
            pan_number,
            response_code: "1404",
            response_message: "PAN not found",
            timestamp: new Date().toISOString()
        });
    }, 1000 + Math.random() * 500); // 1-1.5 second delay
});

/**
 * CIBIL Credit Score Service - SurePass Style
 */
app.post('/api/cibil/credit-score', (req, res) => {
    const { pan_number, name, date_of_birth, mobile_number } = req.body;
    
    setTimeout(() => {
        console.log(`[CIBIL] Fetching credit score for PAN: ${pan_number}`);
        
        // Check for specific PAN responses only
        let profileResponse;
        
        if (pan_number === 'ABCDE1234F' || name.toUpperCase().includes('RAJESH')) {
            profileResponse = cibilResponses.excellent_profile;
        } else if (pan_number === 'EMMPP2177M' || name.toUpperCase().includes('JASHUVA')) {
            profileResponse = cibilResponses.good_profile;
        } else if (pan_number === 'BXZPM1234C' || name.toUpperCase().includes('AMIT')) {
            profileResponse = cibilResponses.fair_profile;
        } else {
            // PAN not found in CIBIL database
            return res.status(404).json({
                success: false,
                status_code: 404,
                error: "CIBIL_RECORD_NOT_FOUND",
                message: "No CIBIL record found for the provided PAN",
                pan_number,
                response_code: "2404",
                response_message: "CIBIL record not found",
                timestamp: new Date().toISOString()
            });
        }
        
        // Customize response with provided data
        const response = JSON.parse(JSON.stringify(profileResponse));
        if (response.data && response.data.consumer_info) {
            response.data.consumer_info.name = name.toUpperCase();
            response.data.consumer_info.pan = pan_number;
            response.data.consumer_info.date_of_birth = date_of_birth;
            response.data.consumer_info.mobile = mobile_number;
        }
        
        // Add backward compatibility fields
        if (response.data && response.data.score_info) {
            response.credit_score = response.data.score_info.cibil_score;
            response.credit_grade = response.data.score_info.score_grade;
            response.existing_loans = response.data.credit_accounts?.filter(acc => acc.account_type !== 'Credit Card') || [];
            response.credit_cards = response.data.credit_accounts?.filter(acc => acc.account_type === 'Credit Card') || [];
            response.factors = response.data.score_info.score_factors;
        }
        
        res.status(200).json(response);
    }, 2000 + Math.random() * 1000); // 2-3 second delay
});

/**
 * Account Aggregator - Bank Statement Service - SurePass Style
 */
app.post('/api/account-aggregator/bank-statements', (req, res) => {
    const { account_number, ifsc_code, consent_id, from_date, to_date } = req.body;
    
    setTimeout(() => {
        console.log(`[BANK] Fetching statements for account: ${account_number}`);
        
        // Check for specific account responses only
        let accountResponse;
        
        if (account_number === '12345678901234' || ifsc_code?.startsWith('HDFC')) {
            accountResponse = bankResponses.hdfc_account;
        } else if (account_number === '98765432109876' || ifsc_code?.startsWith('ICIC')) {
            accountResponse = bankResponses.icici_account;
        } else {
            // Account not found in database
            return res.status(404).json({
                success: false,
                status_code: 404,
                error: "ACCOUNT_NOT_FOUND",
                message: "Bank account not found or consent not available",
                account_number,
                ifsc_code,
                response_code: "3404",
                response_message: "Account not found",
                timestamp: new Date().toISOString()
            });
        }
        
        // Customize response with provided data
        const response = JSON.parse(JSON.stringify(accountResponse));
        if (response.data && response.data.account_info) {
            response.data.account_info.account_number = account_number;
            response.data.statement_period.from_date = from_date;
            response.data.statement_period.to_date = to_date;
        }
        
        // Add backward compatibility fields
        if (response.data) {
            response.account_number = account_number;
            response.ifsc_code = ifsc_code;
            response.account_holder_name = response.data.account_info.account_holder_name;
            response.bank_name = response.data.account_info.bank_name;
            response.branch_name = response.data.account_info.branch_name;
            response.statement_period = response.data.statement_period;
            response.summary = response.data.account_summary;
            response.transactions = response.data.recent_transactions || [];
            response.analysis = {
                monthly_income: response.data.income_analysis?.total_monthly_income || 0,
                monthly_expenses: response.data.expense_analysis?.total_monthly_expenses || 0,
                banking_behavior: response.data.banking_behavior?.account_maintenance || 'Good',
                bounce_count: response.data.banking_behavior?.bounce_count || 0,
                minimum_balance_violations: response.data.banking_behavior?.minimum_balance_violations || 0
            };
        }
        
        res.status(200).json(response);
    }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
});

/**
 * Employment Verification Service - SurePass Style
 */
app.post('/api/employment/verify', (req, res) => {
    const { employee_id, company_name, employee_name, designation } = req.body;
    
    setTimeout(() => {
        console.log(`[EMPLOYMENT] Verifying ${employee_name} at ${company_name}`);
        
        // Check for specific employment responses only
        let employmentResponse;
        
        if (company_name === 'Tech Solutions Pvt Ltd' || employee_name.toUpperCase().includes('RAJESH')) {
            employmentResponse = employmentResponses.tech_solutions;
        } else if (company_name === 'Infosys Limited' || employee_name.toUpperCase().includes('JASHUVA')) {
            employmentResponse = employmentResponses.infosys;
        } else {
            // Employee or company not found in database
            return res.status(404).json({
                success: false,
                status_code: 404,
                error: "EMPLOYMENT_RECORD_NOT_FOUND",
                message: "Employment record not found for the provided details",
                employee_id,
                company_name,
                employee_name,
                response_code: "4404",
                response_message: "Employment record not found",
                timestamp: new Date().toISOString()
            });
        }
        
        // Customize response with provided data
        const response = JSON.parse(JSON.stringify(employmentResponse));
        if (response.data && response.data.employee_info) {
            response.data.employee_info.employee_id = employee_id;
            response.data.employee_info.employee_name = employee_name.toUpperCase();
            response.data.employee_info.designation = designation;
        }
        if (response.data && response.data.company_info) {
            response.data.company_info.company_name = company_name;
        }
        
        // Add backward compatibility fields
        if (response.data) {
            response.employee_id = employee_id;
            response.company_name = company_name;
            response.employee_name = employee_name;
            response.designation = designation;
            response.employment_status = response.data.employment_details?.employment_status;
            response.joining_date = response.data.employment_details?.joining_date;
            response.current_salary = response.data.employment_details?.monthly_gross_salary;
            response.employment_type = response.data.employment_details?.employment_type;
            response.department = response.data.employee_info?.department;
            response.reporting_manager = response.data.reporting_structure?.reporting_manager;
            response.company_details = {
                company_type: response.data.company_info?.company_type,
                industry: response.data.company_info?.industry,
                employee_count: response.data.company_info?.employee_count,
                established_year: response.data.company_info?.established_year
            };
            response.verification_timestamp = new Date().toISOString();
            response.verified_by = response.data.verification_details?.verified_by;
        }
        
        res.status(200).json(response);
    }, 1200 + Math.random() * 800); // 1.2-2 second delay
});

/**
 * GST Verification Service (for company verification)
 */
app.post('/api/gst/verify', (req, res) => {
    const { gstin, company_name } = req.body;
    
    setTimeout(() => {
        // Mock GST verification
        const isValidFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
        
        if (!isValidFormat) {
            return res.status(400).json({
                success: false,
                error: 'Invalid GSTIN format',
                gstin
            });
        }

        res.status(200).json({
            success: true,
            gstin,
            legal_name: company_name.toUpperCase(),
            trade_name: company_name,
            registration_date: '2018-07-01',
            status: 'Active',
            taxpayer_type: 'Regular',
            constitution: 'Private Limited Company',
            business_nature: 'Service Provision',
            address: {
                building: 'Tech Park',
                street: 'Sector 5',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            },
            filing_status: 'Regular Filer',
            last_return_filed: '2024-01-20',
            verification_timestamp: new Date().toISOString()
        });
    }, 800); // 0.8 second delay
});

/**
 * Aadhar Verification Service
 */
app.post('/api/aadhar/verify', (req, res) => {
    const { aadhar_number, name } = req.body;
    
    setTimeout(() => {
        // Mock Aadhar verification
        const isValidFormat = /^[0-9]{12}$/.test(aadhar_number);
        
        if (!isValidFormat) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Aadhar format',
                aadhar_number
            });
        }

        res.status(200).json({
            success: true,
            aadhar_number: aadhar_number.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3'),
            name_provided: name,
            name_on_aadhar: name.toUpperCase(),
            verification_status: 'verified',
            name_match: true,
            address: {
                house: '123',
                street: 'MG Road',
                landmark: 'Near City Mall',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            },
            date_of_birth: '1985-06-15',
            gender: 'Male',
            verification_timestamp: new Date().toISOString()
        });
    }, 1000); // 1 second delay
});

/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Third-Party API Simulator is running',
        services: {
            pan_verification: 'Active',
            cibil_credit_score: 'Active',
            account_aggregator: 'Active',
            employment_verification: 'Active',
            gst_verification: 'Active',
            aadhar_verification: 'Active'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Service Status
 */
app.get('/api/status', (req, res) => {
    res.status(200).json({
        success: true,
        simulator_name: 'LOS Third-Party API Simulator',
        version: '1.0.0',
        services: [
            {
                name: 'PAN Verification',
                endpoint: '/api/pan/verify',
                status: 'Active',
                response_time: '~1s'
            },
            {
                name: 'CIBIL Credit Score',
                endpoint: '/api/cibil/credit-score',
                status: 'Active',
                response_time: '~2s'
            },
            {
                name: 'Account Aggregator',
                endpoint: '/api/account-aggregator/bank-statements',
                status: 'Active',
                response_time: '~1.5s'
            },
            {
                name: 'Employment Verification',
                endpoint: '/api/employment/verify',
                status: 'Active',
                response_time: '~1.2s'
            },
            {
                name: 'GST Verification',
                endpoint: '/api/gst/verify',
                status: 'Active',
                response_time: '~0.8s'
            },
            {
                name: 'Aadhar Verification',
                endpoint: '/api/aadhar/verify',
                status: 'Active',
                response_time: '~1s'
            }
        ],
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Simulator error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal simulator error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /health',
            'GET /api/status',
            'POST /api/pan/verify',
            'POST /api/cibil/credit-score',
            'POST /api/account-aggregator/bank-statements',
            'POST /api/employment/verify',
            'POST /api/gst/verify',
            'POST /api/aadhar/verify'
        ],
        timestamp: new Date().toISOString()
    });
});

// Helper Functions
function calculateNameMatch(providedName, officialName) {
    if (!providedName || !officialName) {
        return { isMatch: false, score: 0 };
    }
    
    const provided = providedName.toUpperCase().replace(/[^A-Z]/g, '');
    const official = officialName.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Simple matching algorithm
    const similarity = calculateStringSimilarity(provided, official);
    const isMatch = similarity >= 0.8;
    const score = Math.round(similarity * 100);
    
    return { isMatch, score };
}

function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Helper functions for default responses removed - now using strict data matching only

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Third-Party API Simulator (SurePass Style) running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Service status: http://localhost:${PORT}/api/status`);
    console.log('🔧 Available Services:');
    console.log('   • PAN Verification (SurePass Style)');
    console.log('   • CIBIL Credit Score (Detailed Reports)');
    console.log('   • Account Aggregator (Comprehensive Analysis)');
    console.log('   • Employment Verification (HR Integration)');
    console.log('   • GST Verification');
    console.log('   • Aadhar Verification');
    console.log('');
    console.log('📁 Predefined Data Available (Strict Matching Only):');
    console.log(`   • PAN Records: ${Object.keys(panResponses.valid_responses).length} valid PANs`);
    console.log(`     - ${Object.keys(panResponses.valid_responses).join(', ')}`);
    console.log(`   • CIBIL Profiles: 2 profiles (ABCDE1234F, EMMPP2177M)`);
    console.log(`   • Bank Accounts: 2 accounts (HDFC: 12345678901234, ICICI: 98765432109876)`);
    console.log(`   • Employment Records: 2 companies (Tech Solutions, Infosys)`);
    console.log('   • ⚠️  No fallback responses - only exact matches will succeed');
});

module.exports = app;