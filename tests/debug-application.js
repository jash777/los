const databaseService = require('../src/database/service');

async function debugApplication() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        const applicationNumber = 'EL_1756292481478_34trxgqg9';
        console.log(`\nFetching application: ${applicationNumber}`);
        
        const app = await databaseService.getCompleteApplication(applicationNumber);
        
        if (app) {
            console.log('Application found:');
            console.log('ID:', app.id);
            console.log('Current Stage:', app.current_stage);
            console.log('Current Status:', app.current_status);
            console.log('Application Number:', app.application_number);
            console.log('Applicant Name:', app.applicant_name);
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

debugApplication();