const mysql = require('mysql2/promise');

async function checkApplications() {
    try {
        // Database connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'alpha',
            password: process.env.DB_PASSWORD || 'Alpha#777',
            database: process.env.DB_NAME || 'loan_origination_system'
        });

        console.log('Checking existing applications...\n');

        // Get all applications
        const [applications] = await connection.execute(`
            SELECT 
                application_number,
                current_stage,
                current_status,
                created_at,
                updated_at
            FROM applications 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        console.log('Recent Applications:');
        console.log('===================');
        
        if (applications.length === 0) {
            console.log('No applications found in database.');
        } else {
            applications.forEach((app, index) => {
                console.log(`${index + 1}. ${app.application_number}`);
                console.log(`   Stage: ${app.current_stage}`);
                console.log(`   Status: ${app.current_status}`);
                console.log(`   Created: ${app.created_at}`);
                console.log(`   Updated: ${app.updated_at}`);
                console.log('');
            });
        }

        // Check for approved pre-qualification applications
        const [approvedApps] = await connection.execute(`
            SELECT 
                application_number,
                current_stage,
                current_status,
                created_at
            FROM applications 
            WHERE current_stage = 'pre_qualification' 
            AND current_status = 'approved'
            ORDER BY created_at DESC
        `);

        console.log('Approved Pre-Qualification Applications:');
        console.log('=======================================');
        
        if (approvedApps.length === 0) {
            console.log('No approved pre-qualification applications found.');
        } else {
            approvedApps.forEach((app, index) => {
                console.log(`${index + 1}. ${app.application_number} (${app.created_at})`);
            });
        }

        await connection.end();

    } catch (error) {
        console.error('Error checking applications:', error);
    }
}

checkApplications();
