const databaseService = require('../database/service');

async function debugCurrentApp() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        const applicationNumber = 'EL_1756307048291_ab72m564n';
        console.log(`\nFetching application: ${applicationNumber}`);
        
        const app = await databaseService.getCompleteApplication(applicationNumber);
        
        if (app) {
            console.log('Application found:');
            console.log('ID:', app.id);
            console.log('Current Stage:', app.current_stage);
            console.log('Status:', app.status);
            console.log('Current Status:', app.current_status);
            console.log('Application Number:', app.application_number);
            console.log('Applicant Name:', app.applicant_name);
            console.log('\nAll fields:');
            console.log(Object.keys(app));
        } else {
            console.log('❌ Application not found!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await databaseService.close();
        process.exit(0);
    }
}

debugCurrentApp();