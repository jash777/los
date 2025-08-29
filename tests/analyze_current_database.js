/**
 * Current Database Structure Analysis
 * Analyzes the existing database schema to identify areas for refinement
 */

const databaseService = require('../src/database/service');

async function analyzeCurrentDatabase() {
    console.log('🔍 Analyzing Current Database Structure');
    console.log('=====================================');
    
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        // Get all tables
        const [tables] = await connection.execute(`
            SELECT table_name, table_rows, data_length, index_length,
                   ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = 'loan_origination_system'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Current Tables:');
        console.log('==================');
        tables.forEach(table => {
            console.log(`   ${table.table_name}: ${table.table_rows} rows (${table.size_mb} MB)`);
        });
        
        // Analyze loan applications table structure
        const [loanAppColumns] = await connection.execute(`
            SHOW COLUMNS FROM loan_applications
        `);
        
        console.log('\n📊 loan_applications Table Structure:');
        console.log('====================================');
        loanAppColumns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        
        // Check for data consistency issues
        const [dataConsistency] = await connection.execute(`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(DISTINCT application_number) as unique_app_numbers,
                COUNT(CASE WHEN applicant_name IS NULL OR applicant_name = '' THEN 1 END) as missing_names,
                COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_emails,
                COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as missing_phones,
                COUNT(CASE WHEN pan_number IS NULL OR pan_number = '' THEN 1 END) as missing_pan,
                COUNT(CASE WHEN loan_amount IS NULL OR loan_amount = 0 THEN 1 END) as missing_loan_amount
            FROM loan_applications
        `);
        
        console.log('\n🔍 Data Consistency Analysis:');
        console.log('=============================');
        const consistency = dataConsistency[0];
        console.log(`   Total Applications: ${consistency.total_applications}`);
        console.log(`   Unique App Numbers: ${consistency.unique_app_numbers}`);
        console.log(`   Missing Names: ${consistency.missing_names}`);
        console.log(`   Missing Emails: ${consistency.missing_emails}`);
        console.log(`   Missing Phones: ${consistency.missing_phones}`);
        console.log(`   Missing PAN: ${consistency.missing_pan}`);
        console.log(`   Missing Loan Amount: ${consistency.missing_loan_amount}`);
        
        // Check stage processing consistency
        const [stageConsistency] = await connection.execute(`
            SELECT 
                sp.stage_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT sp.application_number) as unique_applications,
                COUNT(CASE WHEN la.application_number IS NULL THEN 1 END) as orphaned_records
            FROM stage_processing sp
            LEFT JOIN loan_applications la ON sp.application_number = la.application_number
            GROUP BY sp.stage_name
            ORDER BY sp.stage_name
        `);
        
        console.log('\n📈 Stage Processing Consistency:');
        console.log('===============================');
        stageConsistency.forEach(stage => {
            console.log(`   ${stage.stage_name}: ${stage.total_records} records, ${stage.unique_applications} apps, ${stage.orphaned_records} orphaned`);
        });
        
        // Check for missing KYC data
        const [kycAnalysis] = await connection.execute(`
            SELECT 
                COUNT(*) as total_apps,
                COUNT(CASE WHEN aadhar_number IS NOT NULL AND aadhar_number != '' THEN 1 END) as has_aadhar,
                COUNT(CASE WHEN pan_number IS NOT NULL AND pan_number != '' THEN 1 END) as has_pan,
                COUNT(CASE WHEN monthly_income IS NOT NULL AND monthly_income > 0 THEN 1 END) as has_income
            FROM loan_applications
        `);
        
        console.log('\n🆔 KYC Data Analysis:');
        console.log('====================');
        const kyc = kycAnalysis[0];
        console.log(`   Total Applications: ${kyc.total_apps}`);
        console.log(`   Has Aadhar: ${kyc.has_aadhar} (${((kyc.has_aadhar/kyc.total_apps)*100).toFixed(1)}%)`);
        console.log(`   Has PAN: ${kyc.has_pan} (${((kyc.has_pan/kyc.total_apps)*100).toFixed(1)}%)`);
        console.log(`   Has Income: ${kyc.has_income} (${((kyc.has_income/kyc.total_apps)*100).toFixed(1)}%)`);
        
        // Check external verifications
        const [verificationAnalysis] = await connection.execute(`
            SELECT 
                verification_type,
                COUNT(*) as total_verifications,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
            FROM external_verifications
            GROUP BY verification_type
            ORDER BY verification_type
        `);
        
        console.log('\n✅ External Verifications Analysis:');
        console.log('==================================');
        if (verificationAnalysis.length > 0) {
            verificationAnalysis.forEach(verification => {
                console.log(`   ${verification.verification_type}: ${verification.total_verifications} total, ${verification.completed} completed, ${verification.pending} pending, ${verification.failed} failed`);
            });
        } else {
            console.log('   No external verifications found');
        }
        
        // Identify potential issues
        console.log('\n⚠️ Identified Issues:');
        console.log('====================');
        const issues = [];
        
        if (consistency.total_applications !== consistency.unique_app_numbers) {
            issues.push('Duplicate application numbers detected');
        }
        
        if (consistency.missing_names > 0) {
            issues.push(`${consistency.missing_names} applications missing applicant names`);
        }
        
        if (consistency.missing_emails > 0) {
            issues.push(`${consistency.missing_emails} applications missing email addresses`);
        }
        
        if (consistency.missing_pan > 0) {
            issues.push(`${consistency.missing_pan} applications missing PAN numbers`);
        }
        
        // Check for orphaned stage processing records
        const totalOrphaned = stageConsistency.reduce((sum, stage) => sum + stage.orphaned_records, 0);
        if (totalOrphaned > 0) {
            issues.push(`${totalOrphaned} orphaned stage processing records`);
        }
        
        if (issues.length === 0) {
            console.log('   ✅ No major data consistency issues found');
        } else {
            issues.forEach(issue => {
                console.log(`   ❌ ${issue}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 Recommendations for Database Refinement:');
        console.log('==========================================');
        console.log('   1. Create unified applicant_profiles table for comprehensive KYC data');
        console.log('   2. Implement proper foreign key constraints across all tables');
        console.log('   3. Add comprehensive indexes for performance optimization');
        console.log('   4. Create audit tables for complete traceability');
        console.log('   5. Implement data validation triggers');
        console.log('   6. Add workflow state management table');
        console.log('   7. Create document management system integration');
        console.log('   8. Implement dual workflow support with workflow_type field');
        
        connection.release();
        await databaseService.close();
        
        console.log('\n🎯 Analysis Complete - Ready for Database Refinement');
        
    } catch (error) {
        console.error('❌ Error analyzing database:', error);
        await databaseService.close();
    }
}

analyzeCurrentDatabase();
