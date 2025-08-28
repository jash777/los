const fs = require('fs').promises;
const path = require('path');
const databaseConfig = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

async function debugMigration() {
    console.log('🔍 Debugging Migration Process');
    console.log('==============================\n');
    
    try {
        await databaseConfig.initialize();
        const pool = databaseConfig.getPool();
        
        // Read one application for testing
        const applicationsDir = path.join(__dirname, 'applications');
        const applicationDirs = await fs.readdir(applicationsDir);
        
        if (applicationDirs.length === 0) {
            console.log('No applications found');
            return;
        }
        
        const testDir = applicationDirs[0];
        const appDataPath = path.join(applicationsDir, testDir, 'application-data.json');
        const appData = JSON.parse(await fs.readFile(appDataPath, 'utf8'));
        
        console.log(`📋 Testing with: ${testDir}`);
        console.log(`   Name: ${appData.stage_1_data?.personal_details?.full_name || 'Unknown'}`);
        
        // Generate UUIDs
        const applicationId = uuidv4();
        const stage1Id = uuidv4();
        
        // Convert datetime
        const convertToMySQLDateTime = (dateString) => {
            if (!dateString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
            return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
        };
        
        // Test applications table first
        console.log('\n🔍 Testing applications table...');
        const connection = await pool.getConnection();
        
        try {
            // Check table structure
            const [columns] = await connection.execute('DESCRIBE applications');
            console.log(`   Applications table has ${columns.length} columns:`);
            columns.forEach(col => console.log(`     - ${col.Field}: ${col.Type}`));
            
            // Test insert
            const applicationData = {
                id: applicationId,
                application_number: appData.application_info.application_number,
                current_stage: 'loan_application',
                status: appData.application_info.status || 'pending',
                source_channel: 'web',
                priority_level: 'normal',
                created_at: convertToMySQLDateTime(appData.application_info.created_at),
                last_updated: convertToMySQLDateTime(appData.application_info.last_updated || appData.application_info.created_at),
                completed_at: null,
                total_processing_time_ms: 0,
                stage_count: 0
            };
            
            console.log('\n   Inserting application data...');
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
                applicationData.completed_at,
                applicationData.total_processing_time_ms,
                applicationData.stage_count
            ]);
            
            console.log('   ✅ Application inserted successfully!');
            
            // Test stage_1_data table
            console.log('\n🔍 Testing stage_1_data table...');
            const [stage1Columns] = await connection.execute('DESCRIBE stage_1_data');
            console.log(`   Stage 1 table has ${stage1Columns.length} columns:`);
            stage1Columns.forEach(col => console.log(`     - ${col.Field}: ${col.Type}`));
            
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
            
            console.log('\n   Inserting stage 1 data...');
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
            
            console.log('   ✅ Stage 1 data inserted successfully!');
            
            // Verify data
            const [appCount] = await connection.execute('SELECT COUNT(*) as count FROM applications');
            const [stage1Count] = await connection.execute('SELECT COUNT(*) as count FROM stage_1_data');
            
            console.log('\n📊 Verification:');
            console.log(`   Applications: ${appCount[0].count}`);
            console.log(`   Stage 1 data: ${stage1Count[0].count}`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        } finally {
            connection.release();
        }
        
        await databaseConfig.close();
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugMigration().catch(console.error);
