const fs = require('fs').promises;
const path = require('path');
const databaseConfig = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function migrateFilesystemToDatabase() {
    console.log('🔄 Migrating Filesystem Data to Database');
    console.log('========================================\n');
    
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
                
                // Generate UUIDs
                const applicationId = uuidv4();
                const applicantId = uuidv4();
                
                // Prepare application data
                const applicationData = {
                    id: applicationId,
                    application_number: appData.application_info.application_number,
                    current_stage: appData.application_info.current_stage || 'pre-qualification',
                    current_status: appData.application_info.status || 'pending',
                    source_channel: 'web',
                    priority_level: 'normal',
                    created_at: appData.application_info.created_at,
                    updated_at: appData.application_info.last_updated || appData.application_info.created_at,
                    total_processing_time_ms: 0,
                    stage_count: 0
                };
                
                // Prepare applicant data
                const personalInfo = appData.stage_1_data?.personal_details || {};
                const loanDetails = appData.stage_1_data?.loan_request || {};
                const employmentInfo = appData.stage_2_data?.employment_details || {};
                const bankingDetails = appData.stage_2_data?.banking_details || {};
                const addressInfo = appData.stage_2_data?.address_details || {};
                const thirdPartyData = appData.third_party_data || {};
                const referencesInfo = appData.stage_2_data?.references || {};
                
                const applicantData = {
                    id: applicantId,
                    application_id: applicationId,
                    personal_info: JSON.stringify(personalInfo),
                    address_info: JSON.stringify(addressInfo),
                    employment_info: JSON.stringify(employmentInfo),
                    banking_details: JSON.stringify(bankingDetails),
                    loan_details: JSON.stringify(loanDetails),
                    third_party_data: JSON.stringify(thirdPartyData),
                    references_info: JSON.stringify(referencesInfo)
                };
                
                // Insert into database
                const connection = await pool.getConnection();
                
                try {
                    await connection.beginTransaction();
                    
                    // Insert application
                    await connection.execute(`
                        INSERT INTO applications (
                            id, application_number, current_stage, current_status, 
                            source_channel, priority_level, created_at, updated_at,
                            total_processing_time_ms, stage_count
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        applicationData.id,
                        applicationData.application_number,
                        applicationData.current_stage,
                        applicationData.current_status,
                        applicationData.source_channel,
                        applicationData.priority_level,
                        applicationData.created_at,
                        applicationData.updated_at,
                        applicationData.total_processing_time_ms,
                        applicationData.stage_count
                    ]);
                    
                    // Insert applicant
                    await connection.execute(`
                        INSERT INTO applicants (
                            id, application_id, personal_info, address_info, 
                            employment_info, banking_details, loan_details, 
                            third_party_data, references_info
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        applicantData.id,
                        applicantData.application_id,
                        applicantData.personal_info,
                        applicantData.address_info,
                        applicantData.employment_info,
                        applicantData.banking_details,
                        applicantData.loan_details,
                        applicantData.third_party_data,
                        applicantData.references_info
                    ]);
                    
                    // Insert stage processing records
                    if (appData.application_info.current_stage) {
                        await connection.execute(`
                            INSERT INTO stage_processing (
                                application_number, stage_name, status, completed_at, processing_time_ms
                            ) VALUES (?, ?, ?, ?, ?)
                        `, [
                            appData.application_info.application_number,
                            appData.application_info.current_stage,
                            'completed',
                            appData.application_info.last_updated || appData.application_info.created_at,
                            5000 // Default processing time
                        ]);
                    }
                    
                    // Insert audit log
                    await connection.execute(`
                        INSERT INTO audit_logs (
                            application_number, action, stage, user_id, request_data, response_data
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        appData.application_info.application_number,
                        'application_migrated',
                        appData.application_info.current_stage || 'pre-qualification',
                        'system',
                        JSON.stringify({ source: 'filesystem' }),
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
        const [applicantCount] = await pool.execute('SELECT COUNT(*) as count FROM applicants');
        
        console.log('\n📊 Migration Summary:');
        console.log(`   Total applications processed: ${applicationDirs.length}`);
        console.log(`   Successfully migrated: ${migratedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Database applications: ${appCount[0].count}`);
        console.log(`   Database applicants: ${applicantCount[0].count}`);
        
        if (migratedCount > 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('🎉 Dashboard should now show data from database.');
        } else {
            console.log('\n⚠️  No data was migrated. Check the errors above.');
        }
        
        await databaseConfig.close();
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
}

migrateFilesystemToDatabase().catch(console.error);
