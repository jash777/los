/**
 * Check Database Status and Application Data
 */

const databaseService = require('../src/database/service');

async function checkDatabaseStatus() {
    console.log('🔍 Checking Database Status...');
    console.log('=============================');
    
    try {
        await databaseService.initialize();
        
        // Check all tables
        const connection = await databaseService.pool.getConnection();
        
        // Check loan_applications table
        const [applications] = await connection.execute('SELECT * FROM loan_applications ORDER BY created_at DESC LIMIT 10');
        console.log(`\n📊 Loan Applications (${applications.length} records):`);
        applications.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.application_number} - ${app.applicant_name} - ${app.status} - ${app.created_at}`);
        });
        
        // Check stage_processing table (using correct column name)
        const [stageProcessing] = await connection.execute('SELECT * FROM stage_processing ORDER BY started_at DESC LIMIT 10');
        console.log(`\n📋 Stage Processing (${stageProcessing.length} records):`);
        stageProcessing.forEach((stage, index) => {
            console.log(`  ${index + 1}. ${stage.application_number} - ${stage.stage_name} - ${stage.status} - ${stage.started_at}`);
        });
        
        // Check audit_logs table
        const [auditLogs] = await connection.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10');
        console.log(`\n📝 Audit Logs (${auditLogs.length} records):`);
        auditLogs.forEach((log, index) => {
            console.log(`  ${index + 1}. ${log.application_number} - ${log.action} - ${log.created_at}`);
        });
        
        // Check external_verifications table
        const [verifications] = await connection.execute('SELECT * FROM external_verifications ORDER BY created_at DESC LIMIT 5');
        console.log(`\n🔍 External Verifications (${verifications.length} records):`);
        verifications.forEach((verif, index) => {
            console.log(`  ${index + 1}. ${verif.application_number} - ${verif.verification_type} - ${verif.status}`);
        });
        
        // Check credit_decisions table
        const [decisions] = await connection.execute('SELECT * FROM credit_decisions ORDER BY decided_at DESC LIMIT 5');
        console.log(`\n💳 Credit Decisions (${decisions.length} records):`);
        decisions.forEach((decision, index) => {
            console.log(`  ${index + 1}. ${decision.application_number} - ${decision.decision} - ${decision.decided_at}`);
        });
        
        connection.release();
        
        console.log('\n✅ Database status check completed');
        
    } catch (error) {
        console.error('❌ Error checking database status:', error);
    } finally {
        await databaseService.close();
    }
}

checkDatabaseStatus().catch(console.error);
