const fs = require('fs').promises;
const path = require('path');

async function debugDateParsing() {
    console.log('🔍 Debugging Date Parsing Issues');
    console.log('================================\n');
    
    const applicationsDir = path.join(__dirname, 'applications');
    
    try {
        const applicationDirs = await fs.readdir(applicationsDir);
        console.log(`Found ${applicationDirs.length} application directories\n`);
        
        for (const dir of applicationDirs) {
            const applicationDataPath = path.join(applicationsDir, dir, 'application-data.json');
            try {
                const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
                
                console.log(`📋 Application: ${dir}`);
                console.log(`   Created: ${applicationData.application_info.created_at}`);
                console.log(`   Updated: ${applicationData.application_info.last_updated}`);
                console.log(`   Status: ${applicationData.application_info.status}`);
                
                // Test date parsing
                try {
                    const createdDate = new Date(applicationData.application_info.created_at);
                    const updatedDate = new Date(applicationData.application_info.last_updated);
                    
                    console.log(`   Created Date Valid: ${!isNaN(createdDate.getTime())}`);
                    console.log(`   Updated Date Valid: ${!isNaN(updatedDate.getTime())}`);
                    
                    if (isNaN(createdDate.getTime()) || isNaN(updatedDate.getTime())) {
                        console.log(`   ❌ INVALID DATE FORMAT DETECTED!`);
                    }
                    
                } catch (dateError) {
                    console.log(`   ❌ Date parsing error: ${dateError.message}`);
                }
                
                console.log('');
                
            } catch (error) {
                console.log(`❌ Error reading ${dir}: ${error.message}\n`);
            }
        }
        
    } catch (error) {
        console.error('Error reading applications directory:', error);
    }
}

debugDateParsing().catch(console.error);
