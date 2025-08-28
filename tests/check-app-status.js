/**
 * Quick script to check application status
 */

const databaseService = require('../src/database/service');

async function checkApplicationStatus() {
    try {
        console.log('🔍 Checking application status...');
        
        const app1 = await databaseService.getCompleteApplication('EL_1756289891512_kjon6pewc');
        const app2 = await databaseService.getCompleteApplication('EL_1756289304431_e6iwx5peg');
        
        console.log('\n📋 Application Status:');
        console.log('App 1 (EL_1756289891512_kjon6pewc):', app1 ? {
            current_stage: app1.current_stage,
            current_status: app1.current_status || app1.status,
            id: app1.id
        } : 'Not found');
        
        console.log('App 2 (EL_1756289304431_e6iwx5peg):', app2 ? {
            current_stage: app2.current_stage,
            current_status: app2.current_status || app2.status,
            id: app2.id
        } : 'Not found');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkApplicationStatus();