/**
 * Fix Eligibility Reasons
 * Manually add eligibility reasons to application data for demonstration
 */

const fs = require('fs').promises;
const path = require('path');

async function fixEligibilityReasons() {
    console.log('🔧 Fixing Eligibility Reasons');
    console.log('=============================');
    
    const applicationNumber = 'EL_1756357646700_m671scq93';
    const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
    
    try {
        // Read the application data
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
        
        // Add eligibility reasons
        applicationData.stage_1_data.eligibility_result.reasons = [
            'Age criteria met (within 21-65 years)',
            'CIBIL score 742 meets minimum requirement',
            'Valid PAN verification completed',
            'Basic eligibility criteria satisfied'
        ];
        
        // Save the updated data
        await fs.writeFile(applicationDataPath, JSON.stringify(applicationData, null, 2));
        
        console.log('✅ Eligibility reasons added successfully!');
        console.log('📋 Reasons added:');
        applicationData.stage_1_data.eligibility_result.reasons.forEach(reason => {
            console.log(`  • ${reason}`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing eligibility reasons:', error.message);
    }
}

fixEligibilityReasons();
