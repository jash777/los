const databaseConfig = require('./src/config/database');

async function checkDatabaseStatus() {
    console.log('🔍 Checking Database Status');
    console.log('==========================\n');
    
    try {
        await databaseConfig.initialize();
        const pool = databaseConfig.getPool();
        
        // Check database structure
        console.log('📊 Database Structure:');
        const [tables] = await pool.execute(`
            SELECT table_name, table_rows, data_length, index_length
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            ORDER BY table_name
        `);
        
        tables.forEach(table => {
            console.log(`   📋 ${table.table_name}: ${table.table_rows} rows`);
        });
        
        // Check applications table specifically
        console.log('\n📈 Applications Table Details:');
        const [appCount] = await pool.execute('SELECT COUNT(*) as count FROM applications');
        console.log(`   Total applications: ${appCount[0].count}`);
        
        if (appCount[0].count > 0) {
            const [sampleApps] = await pool.execute(`
                SELECT application_number, current_stage, current_status, created_at
                FROM applications
                LIMIT 3
            `);
            
            console.log('\n📋 Sample Applications:');
            sampleApps.forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.application_number} - ${app.current_status} (${app.current_stage})`);
            });
        } else {
            console.log('   ⚠️  No applications found in database');
        }
        
        // Check applicants table
        console.log('\n👥 Applicants Table Details:');
        const [applicantCount] = await pool.execute('SELECT COUNT(*) as count FROM applicants');
        console.log(`   Total applicants: ${applicantCount[0].count}`);
        
        // Check if we have filesystem data
        console.log('\n📁 Checking Filesystem Data:');
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const applicationsDir = path.join(__dirname, 'applications');
            const applicationDirs = await fs.readdir(applicationsDir);
            console.log(`   Found ${applicationDirs.length} application directories in filesystem`);
            
            if (applicationDirs.length > 0) {
                console.log('\n📋 Filesystem Applications:');
                for (let i = 0; i < Math.min(3, applicationDirs.length); i++) {
                    const dir = applicationDirs[i];
                    const appDataPath = path.join(applicationsDir, dir, 'application-data.json');
                    try {
                        const appData = JSON.parse(await fs.readFile(appDataPath, 'utf8'));
                        const name = appData.stage_1_data?.personal_details?.full_name || 'Unknown';
                        console.log(`   ${i + 1}. ${dir} - ${name} (${appData.application_info.status})`);
                    } catch (error) {
                        console.log(`   ${i + 1}. ${dir} - Error reading data`);
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Error reading filesystem: ${error.message}`);
        }
        
        await databaseConfig.close();
        
        console.log('\n📋 Summary:');
        console.log(`   Database applications: ${appCount[0].count}`);
        console.log(`   Filesystem applications: ${applicationDirs?.length || 0}`);
        
        if (appCount[0].count === 0 && (applicationDirs?.length || 0) > 0) {
            console.log('\n💡 Recommendation: Need to migrate data from filesystem to database');
        } else if (appCount[0].count === 0) {
            console.log('\n💡 Recommendation: Need to create sample data in database');
        } else {
            console.log('\n✅ Database has data and is ready for dashboard');
        }
        
    } catch (error) {
        console.log(`❌ Error checking database: ${error.message}`);
    }
}

checkDatabaseStatus().catch(console.error);
