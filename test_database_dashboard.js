const axios = require('axios');
const databaseConfig = require('./src/config/database');

// Configure axios
const api = axios.create({
    baseURL: 'http://localhost:3000/api/dashboard',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': 'db-test-' + Date.now()
    }
});

console.log('🔍 Testing Database Dashboard Integration');
console.log('=========================================\n');

async function testDatabaseConnection() {
    console.log('📊 Testing Database Connection...');
    
    try {
        await databaseConfig.initialize();
        const pool = databaseConfig.getPool();
        
        // Test basic connection
        const connection = await pool.getConnection();
        const [result] = await connection.execute('SELECT NOW() as current_time');
        connection.release();
        
        console.log('✅ Database connection successful');
        console.log(`   Current time: ${result[0].current_time}`);
        
        // Check if tables exist
        const [tables] = await pool.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name IN ('applications', 'applicants')
        `);
        
        console.log(`📋 Found ${tables.length} required tables: ${tables.map(t => t.table_name).join(', ')}`);
        
        // Check application count
        const [appCount] = await pool.execute('SELECT COUNT(*) as count FROM applications');
        console.log(`📈 Total applications in database: ${appCount[0].count}`);
        
        // Check applicant count
        const [applicantCount] = await pool.execute('SELECT COUNT(*) as count FROM applicants');
        console.log(`👥 Total applicants in database: ${applicantCount[0].count}`);
        
        // Show sample applications
        const [applications] = await pool.execute(`
            SELECT 
                a.application_number,
                a.current_stage,
                a.current_status,
                a.created_at,
                ap.personal_info
            FROM applications a
            LEFT JOIN applicants ap ON a.id = ap.application_id
            LIMIT 5
        `);
        
        console.log('\n📋 Sample Applications:');
        applications.forEach((app, index) => {
            const personalInfo = app.personal_info ? JSON.parse(app.personal_info) : {};
            const name = `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim() || 'Unknown';
            console.log(`   ${index + 1}. ${app.application_number} - ${name} (${app.current_status})`);
        });
        
        await databaseConfig.close();
        return true;
        
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        return false;
    }
}

async function testDashboardEndpoints() {
    console.log('\n🌐 Testing Dashboard Endpoints...');
    
    const endpoints = [
        { name: 'Health Check', endpoint: '/health' },
        { name: 'LOS Overview', endpoint: '/los/overview' },
        { name: 'Applications List', endpoint: '/los/applications?limit=5' },
        { name: 'LMS Overview', endpoint: '/lms/overview' },
        { name: 'Recent Activities', endpoint: '/dashboard/recent-activities?limit=5' },
        { name: 'Dashboard Stats', endpoint: '/dashboard/stats' }
    ];
    
    let passed = 0;
    let total = 0;
    
    for (const test of endpoints) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            const response = await api.get(test.endpoint);
            
            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ PASSED - Status: ${response.status}`);
                
                // Show key data
                const data = response.data.data;
                if (data) {
                    if (data.overview) {
                        console.log(`   📊 Total Applications: ${data.overview.total_applications || 'N/A'}`);
                    } else if (data.applications) {
                        console.log(`   📋 Applications: ${data.applications.length} found`);
                    } else if (data.total_applications) {
                        console.log(`   📈 Total Applications: ${data.total_applications}`);
                    }
                }
                passed++;
            } else {
                console.log(`   ❌ FAILED - Status: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ FAILED - Error: ${error.message}`);
        }
        total++;
        console.log('');
    }
    
    console.log(`📊 Dashboard Test Summary: ${passed}/${total} passed`);
    return passed === total;
}

async function runDatabaseTests() {
    console.log('🚀 Starting Database Dashboard Tests\n');
    
    // Test database connection
    const dbSuccess = await testDatabaseConnection();
    
    if (!dbSuccess) {
        console.log('\n❌ Database connection failed. Cannot proceed with dashboard tests.');
        return;
    }
    
    // Test dashboard endpoints
    const dashboardSuccess = await testDashboardEndpoints();
    
    console.log('\n📋 Final Results:');
    console.log(`   Database Connection: ${dbSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Dashboard Endpoints: ${dashboardSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (dbSuccess && dashboardSuccess) {
        console.log('\n🎉 All tests passed! Dashboard is working with database.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
    }
}

runDatabaseTests().catch(error => {
    console.error(`❌ Test execution failed: ${error.message}`);
    process.exit(1);
});
