const pool = require('../src/config/database');

async function fixSessionTokenLength() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing session_token column length...');
        
        await client.query('BEGIN');
        
        // First, clear any existing sessions to avoid conflicts
        console.log('1. Clearing existing sessions...');
        await client.query('DELETE FROM user_sessions');
        
        // Drop the unique constraint if it exists
        console.log('2. Dropping unique constraint...');
        try {
            await client.query(`
                ALTER TABLE user_sessions 
                DROP CONSTRAINT IF EXISTS user_sessions_session_token_key
            `);
        } catch (error) {
            console.log('   Constraint may not exist, continuing...');
        }
        
        // Alter the session_token column to TEXT
        console.log('3. Altering column type...');
        await client.query(`
            ALTER TABLE user_sessions 
            ALTER COLUMN session_token TYPE TEXT
        `);
        
        // Re-add the unique constraint
        console.log('4. Re-adding unique constraint...');
        await client.query(`
            ALTER TABLE user_sessions 
            ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token)
        `);
        
        await client.query('COMMIT');
        
        console.log('✅ Successfully updated session_token column to TEXT type');
        console.log('📝 JWT tokens can now be stored without length restrictions');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing session_token length:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixSessionTokenLength()
    .then(() => {
        console.log('🎉 Session token length fix completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fix failed:', error.message);
        process.exit(1);
    });