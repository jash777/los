const databaseService = require('../src/database/service');
const fs = require('fs').promises;
const path = require('path');

async function setupManualWorkflow() {
    try {
        console.log('🔧 Setting up Manual Workflow Schema...');
        console.log('=====================================');
        
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        // Read the SQL file
        const sqlFile = path.join(__dirname, '../src/database/manual-workflow-schema.sql');
        const sqlContent = await fs.readFile(sqlFile, 'utf8');
        
        // Clean and split SQL statements
        const cleanedContent = sqlContent
            .replace(/--.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
            
        const statements = cleanedContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().startsWith('select \''));
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
                } catch (error) {
                    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                        console.log(`⚠️ Statement ${i + 1} already exists, skipping`);
                    } else {
                        console.error(`❌ Error in statement ${i + 1}:`, error.message);
                        console.log('Statement:', statement.substring(0, 100) + '...');
                    }
                }
            }
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying Manual Workflow Tables...');
        const [tables] = await connection.execute(`
            SELECT table_name, table_rows 
            FROM information_schema.tables 
            WHERE table_schema = 'loan_origination_system' 
            AND table_name IN ('manual_review_queue', 'manual_decisions', 'workflow_rules', 'reviewers', 'workflow_assignments', 'review_comments')
            ORDER BY table_name
        `);
        
        console.log('📋 Manual Workflow Tables:');
        tables.forEach(table => {
            console.log(`   ${table.table_name}: ${table.table_rows} rows`);
        });
        
        // Check sample data
        const [reviewers] = await connection.execute('SELECT COUNT(*) as count FROM reviewers');
        const [rules] = await connection.execute('SELECT COUNT(*) as count FROM workflow_rules');
        
        console.log('\n📊 Sample Data:');
        console.log(`   Reviewers: ${reviewers[0].count}`);
        console.log(`   Workflow Rules: ${rules[0].count}`);
        
        connection.release();
        await databaseService.close();
        
        console.log('\n🎉 Manual Workflow Schema Setup Complete!');
        
    } catch (error) {
        console.error('❌ Error setting up manual workflow:', error);
        await databaseService.close();
    }
}

setupManualWorkflow();
