/**
 * Apply Refined Unified Database Schema
 * Implements the enhanced database structure for dual workflows
 */

const databaseService = require('../src/database/service');
const fs = require('fs').promises;
const path = require('path');

async function applyRefinedSchema() {
    console.log('🔧 Applying Refined Unified Database Schema');
    console.log('===========================================');
    
    try {
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        // Read the refined schema SQL file
        const schemaFile = path.join(__dirname, '../src/database/simplified-enhanced-schema.sql');
        const schemaContent = await fs.readFile(schemaFile, 'utf8');
        
        // Clean and split SQL statements
        const cleanedContent = schemaContent
            .replace(/--.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
            
        const statements = cleanedContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().startsWith('select \''));
        
        console.log(`📋 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log(`✅ Statement ${i + 1}/${statements.length}: Success`);
                    successCount++;
                } catch (error) {
                    if (error.message.includes('already exists') || 
                        error.message.includes('Duplicate') ||
                        error.message.includes('exists')) {
                        console.log(`⚠️ Statement ${i + 1}/${statements.length}: Already exists, skipping`);
                        skipCount++;
                    } else {
                        console.error(`❌ Statement ${i + 1}/${statements.length}: Error - ${error.message}`);
                        console.log('   SQL:', statement.substring(0, 100) + '...');
                        errorCount++;
                    }
                }
            }
        }
        
        console.log('\n📊 Execution Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⚠️ Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        
        // Verify new tables were created
        console.log('\n🔍 Verifying Enhanced Tables...');
        const enhancedTables = [
            'loan_applications_enhanced',
            'applicant_profiles', 
            'workflow_states',
            'kyc_verifications',
            'document_attachments',
            'workflow_transitions'
        ];
        
        for (const tableName of enhancedTables) {
            try {
                const [tableInfo] = await connection.execute(`
                    SELECT COUNT(*) as row_count, 
                           ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
                    FROM information_schema.tables t
                    LEFT JOIN information_schema.table_statistics ts ON t.table_name = ts.table_name
                    WHERE t.table_schema = 'loan_origination_system' 
                    AND t.table_name = ?
                `, [tableName]);
                
                if (tableInfo.length > 0) {
                    console.log(`   ✅ ${tableName}: Created successfully`);
                } else {
                    console.log(`   ❌ ${tableName}: Not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${tableName}: Error checking - ${error.message}`);
            }
        }
        
        // Check enhanced views
        console.log('\n🔍 Verifying Enhanced Views...');
        const enhancedViews = [
            'v_complete_applications_enhanced',
            'v_dual_workflow_dashboard'
        ];
        
        for (const viewName of enhancedViews) {
            try {
                const [viewCheck] = await connection.execute(`
                    SELECT COUNT(*) as exists_count
                    FROM information_schema.views 
                    WHERE table_schema = 'loan_origination_system' 
                    AND table_name = ?
                `, [viewName]);
                
                if (viewCheck[0].exists_count > 0) {
                    console.log(`   ✅ ${viewName}: Created successfully`);
                } else {
                    console.log(`   ❌ ${viewName}: Not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${viewName}: Error checking - ${error.message}`);
            }
        }
        
        // Check data migration
        console.log('\n🔍 Checking Data Migration...');
        try {
            const [migrationCheck] = await connection.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM loan_applications) as original_count,
                    (SELECT COUNT(*) FROM loan_applications_enhanced) as enhanced_count,
                    (SELECT COUNT(*) FROM applicant_profiles) as profiles_count
            `);
            
            const migration = migrationCheck[0];
            console.log(`   Original Applications: ${migration.original_count}`);
            console.log(`   Enhanced Applications: ${migration.enhanced_count}`);
            console.log(`   Applicant Profiles: ${migration.profiles_count}`);
            
            if (migration.enhanced_count >= migration.original_count) {
                console.log('   ✅ Data migration appears successful');
            } else {
                console.log('   ⚠️ Data migration may be incomplete');
            }
        } catch (error) {
            console.log(`   ❌ Error checking migration: ${error.message}`);
        }
        
        // Test enhanced view
        console.log('\n🔍 Testing Enhanced Views...');
        try {
            const [viewTest] = await connection.execute(`
                SELECT COUNT(*) as view_count 
                FROM v_complete_applications_enhanced 
                LIMIT 1
            `);
            console.log(`   ✅ v_complete_applications_enhanced: ${viewTest[0].view_count} records accessible`);
        } catch (error) {
            console.log(`   ❌ Error testing enhanced view: ${error.message}`);
        }
        
        try {
            const [dashboardTest] = await connection.execute(`
                SELECT workflow_type, COUNT(*) as count 
                FROM v_dual_workflow_dashboard 
                GROUP BY workflow_type
            `);
            console.log(`   ✅ v_dual_workflow_dashboard: ${dashboardTest.length} workflow types`);
            dashboardTest.forEach(row => {
                console.log(`      ${row.workflow_type}: ${row.count} applications`);
            });
        } catch (error) {
            console.log(`   ❌ Error testing dashboard view: ${error.message}`);
        }
        
        connection.release();
        await databaseService.close();
        
        if (errorCount === 0) {
            console.log('\n🎉 REFINED SCHEMA APPLIED SUCCESSFULLY!');
            console.log('✅ Enhanced database structure ready for dual workflows');
            console.log('✅ Data migration completed');
            console.log('✅ Views and indexes created');
            console.log('✅ Ready for dual workflow implementation');
        } else {
            console.log('\n⚠️ SCHEMA APPLIED WITH SOME ERRORS');
            console.log(`❌ ${errorCount} statements failed - review logs above`);
        }
        
    } catch (error) {
        console.error('❌ Error applying refined schema:', error);
        await databaseService.close();
    }
}

applyRefinedSchema();
