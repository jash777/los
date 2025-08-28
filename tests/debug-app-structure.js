const databaseService = require('../src/database/service.js');

async function debugApplicationStructure() {
    try {
        console.log('Initializing database service...');
        await databaseService.initialize();
        
        console.log('Getting complete application data...');
        const data = await databaseService.getCompleteApplication('EL_1756293271534_etwgb5e14');
        
        if (!data) {
            console.log('No application found');
            return;
        }
        
        console.log('Application data structure:');
        console.log('Keys:', Object.keys(data));
        console.log('\nFull data:');
        console.log(JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await databaseService.close();
        process.exit(0);
    }
}

debugApplicationStructure();