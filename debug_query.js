const db = require('./middleware/config/database');

(async () => {
    try {
        const result = await db.query(`
            SELECT workflow_id, 
                   application_data->>'applicationId' as app_id, 
                   created_at 
            FROM workflow_tracking 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('Recent applications:', result.rows);
        
        // Also check the specific failing application
        const failingApp = 'APP_1756148155176_xsy9y8z10';
        const specificResult = await db.query(`
            SELECT workflow_id, 
                   application_data->>'applicationId' as app_id, 
                   status,
                   created_at 
            FROM workflow_tracking 
            WHERE application_data->>'applicationId' = $1
        `, [failingApp]);
        console.log(`\nLooking for ${failingApp}:`, specificResult.rows);
        
    } catch(e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
})();