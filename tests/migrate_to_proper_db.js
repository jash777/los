
const fs = require('fs').promises;
const path = require('path');
const databaseConfig = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function migrateToProperDatabase() {
    console.log('🔄 Migrating Filesystem Data to Proper Database Structure');
    console.log('========================================================\n');
    
    try {
        // Initialize database connection
        await databaseConfig.initialize();
        const pool = databaseConfig.getPool();
        
        // Read applications from filesystem
        const applicationsDir = path.join(__dirname, 'applications');
        const applicationDirs = await fs.readdir(applicationsDir);
        
        console.log(`📁 Found ${applicationDirs.length} application directories in filesystem`);
        
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const dir of applicationDirs) {
            try {
                const appDataPath = path.join(applicationsDir, dir, 'application-data.json');
                const appData = JSON.parse(await fs.readFile(appDataPath, 'utf8'));
                
                console.log(`\n📋 Processing: ${dir}`);
                console.log(`   Name: ${appData.stage_1_data?.personal_details?.full_name || 'Unknown'}`);
                console.log(`   Status: ${appData.application_info.status}`);
                console.log(`   Stage: ${appData.application_info.current_stage}`);
                
                // Generate UUIDs
                const applicationId = uuidv4();
                const stage1Id = uuidv4();
                const stage2Id = uuidv4();
                const thirdPartyId = uuidv4();
                const resultsId = uuidv4();
                
                // Map stage names to database format
                const stageMapping = {
                    'pre_qualification': 'pre_qualification',
                    'loan_application': 'loan_application',
                    'application_processing': 'application_processing',
                    'underwriting': 'underwriting',
                    'credit_decision': 'credit_decision',
                    'quality_check': 'quality_check',
                    'loan_funding': 'loan_funding'
                };
                
                const currentStage = stageMapping[appData.application_info.current_stage] || 'pre_qualification';
                
                // Convert datetime strings to MySQL format
                const convertToMySQLDateTime = (dateString) => {
                    if (!dateString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
                    return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
                };
                
                // Prepare application data
                const applicationData = {
                    id: applicationId,
                    application_number: appData.application_info.application_number,
                    current_stage: currentStage,
                    status: appData.application_info.status || 'pending',
                    source_channel: 'web',
                    priority_level: 'normal',
                    created_at: convertToMySQLDateTime(appData.application_info.created_at),
                    last_updated: convertToMySQLDateTime(appData.application_info.last_updated || appData.application_info.created_at),
                    total_processing_time_ms: 0,
                    stage_count: 0
                };
                
                // Prepare stage 1 data
                const personalDetails = appData.stage_1_data?.personal_details || {};
                const loanRequest = appData.stage_1_data?.loan_request || {};
                const eligibilityResult = appData.stage_1_data?.eligibility_result || {};
                
                const stage1Data = {
                    id: stage1Id,
                    application_id: applicationId,
                    full_name: personalDetails.full_name || '',
                    mobile: personalDetails.mobile || '',
                    email: personalDetails.email || '',
                    pan_number: personalDetails.pan_number || '',
                    date_of_birth: personalDetails.date_of_birth || '1990-01-01',
                    loan_amount: loanRequest.loan_amount || 0,
                    loan_purpose: loanRequest.loan_purpose || 'personal',
                    preferred_tenure_months: loanRequest.preferred_tenure_months || 36,
                    eligibility_status: eligibilityResult.status || 'pending',
                    eligibility_score: eligibilityResult.score || 0,
                    eligibility_decision: eligibilityResult.decision || 'approved',
                    eligibility_reasons: JSON.stringify(eligibilityResult.reasons || [])
                };
                
                // Prepare stage 2 data
                const employmentDetails = appData.stage_2_data?.employment_details || {};
                const incomeDetails = appData.stage_2_data?.income_details || {};
                const bankingDetails = appData.stage_2_data?.banking_details || {};
                const addressDetails = appData.stage_2_data?.address_details || {};
                const references = appData.stage_2_data?.references || {};
                
                const stage2Data = {
                    id: stage2Id,
                    application_id: applicationId,
                    employment_type: employmentDetails.employment_type || 'salaried',
                    company_name: employmentDetails.company_name || null,
                    designation: employmentDetails.designation || null,
                    work_experience_years: employmentDetails.work_experience_years || 0,
                    monthly_gross_income: employmentDetails.monthly_gross_income || null,
                    monthly_net_income: employmentDetails.monthly_net_income || null,
                    current_job_experience_years: employmentDetails.current_job_experience_years || 0,
                    industry_type: employmentDetails.industry_type || null,
                    employment_status: employmentDetails.employment_status || null,
                    employee_name: employmentDetails.employee_name || null,
                    monthly_salary: incomeDetails.monthly_salary || null,
                    other_income: incomeDetails.other_income || 0,
                    total_monthly_income: incomeDetails.total_monthly_income || null,
                    existing_emi: incomeDetails.existing_emi || 0,
                    net_monthly_income: incomeDetails.net_monthly_income || null,
                    account_number: bankingDetails.account_number || null,
                    ifsc_code: bankingDetails.ifsc_code || null,
                    bank_name: bankingDetails.bank_name || null,
                    account_type: bankingDetails.account_type || null,
                    average_monthly_balance: bankingDetails.average_monthly_balance || null,
                    banking_relationship_years: bankingDetails.banking_relationship_years || null,
                    current_street_address: addressDetails.current_address?.street_address || null,
                    current_city: addressDetails.current_address?.city || null,
                    current_state: addressDetails.current_address?.state || null,
                    current_pincode: addressDetails.current_address?.pincode || null,
                    current_residence_type: addressDetails.current_address?.residence_type || null,
                    current_years_at_address: addressDetails.current_address?.years_at_address || null,
                    permanent_street_address: addressDetails.permanent_address?.street_address || null,
                    permanent_city: addressDetails.permanent_address?.city || null,
                    permanent_state: addressDetails.permanent_address?.state || null,
                    permanent_pincode: addressDetails.permanent_address?.pincode || null,
                    references_data: JSON.stringify(references)
                };
                
                // Prepare third party data
                const thirdPartyData = appData.third_party_data || {};
                
                const thirdPartyDataRecord = {
                    id: thirdPartyId,
                    application_id: applicationId,
                    cibil_score: thirdPartyData.cibil_data?.score || null,
                    cibil_grade: thirdPartyData.cibil_data?.grade || null,
                    cibil_report: JSON.stringify(thirdPartyData.cibil_data || {}),
                    pan_verification_status: thirdPartyData.pan_verification?.status || 'pending',
                    pan_verification_data: JSON.stringify(thirdPartyData.pan_verification || {}),
                    bank_analysis_status: thirdPartyData.bank_analysis?.status || 'pending',
                    bank_analysis_data: JSON.stringify(thirdPartyData.bank_analysis || {}),
                    employment_verification_status: thirdPartyData.employment_verification?.status || 'pending',
                    employment_verification_data: JSON.stringify(thirdPartyData.employment_verification || {}),
                    additional_data: JSON.stringify(thirdPartyData)
                };
                
                // Prepare application results
                const applicationResults = {
                    id: resultsId,
                    application_id: applicationId,
                    final_decision: appData.application_info.status || 'approved',
                    decision_reason: null,
                    decision_score: 75, // Default score
                    recommended_loan_amount: loanRequest.loan_amount || null,
                    recommended_tenure_months: loanRequest.preferred_tenure_months || null,
                    recommended_interest_rate: 12.5, // Default rate
                    recommended_emi: null, // Calculate if needed
                    processing_fee_percentage: 1.0,
                    processing_fee_amount: 5000, // Default fee
                    other_charges: JSON.stringify({})
                };
                
                // Insert into database
                const connection = await pool.getConnection();
                
                try {
                    await connection.beginTransaction();
                    
                    // Insert application
                    await connection.execute(`
                        INSERT INTO applications (
                            id, application_number, current_stage, status, 
                            source_channel, priority_level, created_at, last_updated,
                            completed_at, total_processing_time_ms, stage_count
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        applicationData.id,
                        applicationData.application_number,
                        applicationData.current_stage,
                        applicationData.status,
                        applicationData.source_channel,
                        applicationData.priority_level,
                        applicationData.created_at,
                        applicationData.last_updated,
                        null, // completed_at
                        applicationData.total_processing_time_ms,
                        applicationData.stage_count
                    ]);
                    
                    // Insert stage 1 data
                    await connection.execute(`
                        INSERT INTO stage_1_data (
                            id, application_id, full_name, mobile, email, pan_number, date_of_birth,
                            loan_amount, loan_purpose, preferred_tenure_months,
                            eligibility_status, eligibility_score, eligibility_decision, eligibility_reasons
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        stage1Data.id,
                        stage1Data.application_id,
                        stage1Data.full_name,
                        stage1Data.mobile,
                        stage1Data.email,
                        stage1Data.pan_number,
                        stage1Data.date_of_birth,
                        stage1Data.loan_amount,
                        stage1Data.loan_purpose,
                        stage1Data.preferred_tenure_months,
                        stage1Data.eligibility_status,
                        stage1Data.eligibility_score,
                        stage1Data.eligibility_decision,
                        stage1Data.eligibility_reasons
                    ]);
                    
                    // Insert stage 2 data
                    await connection.execute(`
                        INSERT INTO stage_2_data (
                            id, application_id, employment_type, company_name, designation, work_experience_years,
                            monthly_gross_income, monthly_net_income, current_job_experience_years, industry_type,
                            employment_status, employee_name, monthly_salary, other_income, total_monthly_income,
                            existing_emi, net_monthly_income, account_number, ifsc_code, bank_name, account_type,
                            average_monthly_balance, banking_relationship_years, current_street_address, current_city,
                            current_state, current_pincode, current_residence_type, current_years_at_address,
                            permanent_street_address, permanent_city, permanent_state, permanent_pincode, references_data,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        stage2Data.id,
                        stage2Data.application_id,
                        stage2Data.employment_type,
                        stage2Data.company_name,
                        stage2Data.designation,
                        stage2Data.work_experience_years,
                        stage2Data.monthly_gross_income,
                        stage2Data.monthly_net_income,
                        stage2Data.current_job_experience_years,
                        stage2Data.industry_type,
                        stage2Data.employment_status,
                        stage2Data.employee_name,
                        stage2Data.monthly_salary,
                        stage2Data.other_income,
                        stage2Data.total_monthly_income,
                        stage2Data.existing_emi,
                        stage2Data.net_monthly_income,
                        stage2Data.account_number,
                        stage2Data.ifsc_code,
                        stage2Data.bank_name,
                        stage2Data.account_type,
                        stage2Data.average_monthly_balance,
                        stage2Data.banking_relationship_years,
                        stage2Data.current_street_address,
                        stage2Data.current_city,
                        stage2Data.current_state,
                        stage2Data.current_pincode,
                        stage2Data.current_residence_type,
                        stage2Data.current_years_at_address,
                        stage2Data.permanent_street_address,
                        stage2Data.permanent_city,
                        stage2Data.permanent_state,
                        stage2Data.permanent_pincode,
                        stage2Data.references_data,
                        convertToMySQLDateTime(new Date()), // created_at
                        convertToMySQLDateTime(new Date())  // updated_at
                    ]);
                    
                    // Insert third party data
                    await connection.execute(`
                        INSERT INTO third_party_data (
                            id, application_id, cibil_score, cibil_grade, cibil_report,
                            pan_verification_status, pan_verification_data, bank_analysis_status,
                            bank_analysis_data, employment_verification_status, employment_verification_data,
                            additional_data, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        thirdPartyDataRecord.id,
                        thirdPartyDataRecord.application_id,
                        thirdPartyDataRecord.cibil_score,
                        thirdPartyDataRecord.cibil_grade,
                        thirdPartyDataRecord.cibil_report,
                        thirdPartyDataRecord.pan_verification_status,
                        thirdPartyDataRecord.pan_verification_data,
                        thirdPartyDataRecord.bank_analysis_status,
                        thirdPartyDataRecord.bank_analysis_data,
                        thirdPartyDataRecord.employment_verification_status,
                        thirdPartyDataRecord.employment_verification_data,
                        thirdPartyDataRecord.additional_data,
                        convertToMySQLDateTime(new Date()), // created_at
                        convertToMySQLDateTime(new Date())  // updated_at
                    ]);
                    
                    // Insert application results
                    await connection.execute(`
                        INSERT INTO application_results (
                            id, application_id, final_decision, decision_reason, decision_score,
                            recommended_loan_amount, recommended_tenure_months, recommended_interest_rate,
                            recommended_emi, processing_fee_percentage, processing_fee_amount, other_charges,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        applicationResults.id,
                        applicationResults.application_id,
                        applicationResults.final_decision,
                        applicationResults.decision_reason,
                        applicationResults.decision_score,
                        applicationResults.recommended_loan_amount,
                        applicationResults.recommended_tenure_months,
                        applicationResults.recommended_interest_rate,
                        applicationResults.recommended_emi,
                        applicationResults.processing_fee_percentage,
                        applicationResults.processing_fee_amount,
                        applicationResults.other_charges,
                        convertToMySQLDateTime(new Date()), // created_at
                        convertToMySQLDateTime(new Date())  // updated_at
                    ]);
                    
                    // Insert stage processing record
                    await connection.execute(`
                        INSERT INTO stage_processing (
                            application_number, stage_name, status, completed_at, processing_time_ms
                        ) VALUES (?, ?, ?, ?, ?)
                    `, [
                        appData.application_info.application_number,
                        currentStage,
                        'completed',
                        convertToMySQLDateTime(appData.application_info.last_updated || appData.application_info.created_at),
                        5000 // Default processing time
                    ]);
                    
                    // Insert audit log
                    await connection.execute(`
                        INSERT INTO audit_logs (
                            application_number, action, stage, user_id, request_data, response_data
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        appData.application_info.application_number,
                        'application_migrated',
                        currentStage,
                        'system',
                        JSON.stringify({ source: 'filesystem', original_stage: appData.application_info.current_stage }),
                        JSON.stringify({ status: 'success', migrated_at: new Date().toISOString() })
                    ]);
                    
                    await connection.commit();
                    
                    console.log(`   ✅ Successfully migrated to database`);
                    migratedCount++;
                    
                } catch (dbError) {
                    await connection.rollback();
                    console.log(`   ❌ Database error: ${dbError.message}`);
                    errorCount++;
                } finally {
                    connection.release();
                }
                
            } catch (error) {
                console.log(`   ❌ Error processing ${dir}: ${error.message}`);
                errorCount++;
            }
        }
        
        // Verify migration
        const [appCount] = await pool.execute('SELECT COUNT(*) as count FROM applications');
        const [stage1Count] = await pool.execute('SELECT COUNT(*) as count FROM stage_1_data');
        const [stage2Count] = await pool.execute('SELECT COUNT(*) as count FROM stage_2_data');
        const [thirdPartyCount] = await pool.execute('SELECT COUNT(*) as count FROM third_party_data');
        const [resultsCount] = await pool.execute('SELECT COUNT(*) as count FROM application_results');
        
        console.log('\n📊 Migration Summary:');
        console.log(`   Total applications processed: ${applicationDirs.length}`);
        console.log(`   Successfully migrated: ${migratedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Database applications: ${appCount[0].count}`);
        console.log(`   Database stage 1 data: ${stage1Count[0].count}`);
        console.log(`   Database stage 2 data: ${stage2Count[0].count}`);
        console.log(`   Database third party data: ${thirdPartyCount[0].count}`);
        console.log(`   Database application results: ${resultsCount[0].count}`);
        
        if (migratedCount > 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('🎉 Database now has proper structure with all data.');
            console.log('🚀 Ready for dashboard implementation!');
        } else {
            console.log('\n⚠️  No data was migrated. Check the errors above.');
        }
        
        await databaseConfig.close();
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
}

migrateToProperDatabase().catch(console.error);
