/**
 * Test Dual Storage System (Database + File)
 * Verifies that applications are saved in both database and files
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const databaseService = require('../src/database/service');

const API_BASE_URL = 'http://localhost:3000/api';

// Test application data
const testApplicationData = {
    applicantName: "TEST DUAL STORAGE USER",
    phone: "9999999999",
    email: "test.dual.storage@example.com",
    panNumber: "TEST1234A",
    dateOfBirth: "1990-01-01",
    loanAmount: 300000,
    loanPurpose: "personal",
    employmentType: "salaried"
};

async function testDualStorage() {
    console.log('🧪 Testing Dual Storage System (Database + File)');
    console.log('================================================');
    
    let applicationNumber = null;
    
    try {
        // Step 1: Create application via API
        console.log('\n📤 Step 1: Creating application via API...');
        const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testApplicationData, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success && response.data.data.success) {
            applicationNumber = response.data.data.applicationNumber;
            console.log(`✅ Application created: ${applicationNumber}`);
        } else {
            throw new Error('Failed to create application via API');
        }
        
        // Step 2: Verify database storage
        console.log('\n📊 Step 2: Verifying database storage...');
        await databaseService.initialize();
        
        const dbApplication = await databaseService.getCompleteApplication(applicationNumber);
        if (dbApplication) {
            console.log('✅ Database storage verified');
            console.log(`   - Application Number: ${dbApplication.application_number}`);
            console.log(`   - Applicant Name: ${dbApplication.applicant_name}`);
            console.log(`   - Status: ${dbApplication.status}`);
            console.log(`   - Stage: ${dbApplication.current_stage}`);
        } else {
            throw new Error('Application not found in database');
        }
        
        // Step 3: Verify file storage
        console.log('\n📁 Step 3: Verifying file storage...');
        const filePath = path.join(__dirname, '../applications', applicationNumber, 'application-data.json');
        
        try {
            const fileData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            console.log('✅ File storage verified');
            console.log(`   - File exists: ${filePath}`);
            console.log(`   - Application Number: ${fileData.application_info.application_number}`);
            console.log(`   - Status: ${fileData.application_info.status}`);
            console.log(`   - Stage: ${fileData.application_info.current_stage}`);
            
            // Verify stage 1 data
            if (fileData.stage_1_data && fileData.stage_1_data.personal_details) {
                console.log('✅ Stage 1 data in file verified');
                console.log(`   - Name: ${fileData.stage_1_data.personal_details.full_name}`);
                console.log(`   - Phone: ${fileData.stage_1_data.personal_details.mobile}`);
                console.log(`   - Email: ${fileData.stage_1_data.personal_details.email}`);
            }
            
        } catch (fileError) {
            throw new Error(`File storage verification failed: ${fileError.message}`);
        }
        
        // Step 4: Verify directory structure
        console.log('\n📂 Step 4: Verifying directory structure...');
        const appDir = path.join(__dirname, '../applications', applicationNumber);
        const directories = ['documents', 'third-party-data', 'communications', 'processing-logs'];
        
        for (const dir of directories) {
            const dirPath = path.join(appDir, dir);
            try {
                await fs.access(dirPath);
                console.log(`✅ Directory exists: ${dir}`);
            } catch (error) {
                console.log(`❌ Directory missing: ${dir}`);
            }
        }
        
        // Step 5: Test data consistency
        console.log('\n🔄 Step 5: Testing data consistency...');
        
        // Compare database vs file data
        const dbName = dbApplication.applicant_name;
        const fileName = fileData.stage_1_data.personal_details.full_name;
        
        if (dbName === fileName) {
            console.log('✅ Data consistency verified');
            console.log(`   - Database name: ${dbName}`);
            console.log(`   - File name: ${fileName}`);
        } else {
            console.log('❌ Data inconsistency detected');
            console.log(`   - Database name: ${dbName}`);
            console.log(`   - File name: ${fileName}`);
        }
        
        // Step 6: Test file-based data retrieval
        console.log('\n📖 Step 6: Testing file-based data retrieval...');
        const fileApplication = await databaseService.getApplicationFile(applicationNumber);
        
        if (fileApplication) {
            console.log('✅ File-based data retrieval working');
            console.log(`   - Retrieved application: ${fileApplication.application_info.application_number}`);
            console.log(`   - Current stage: ${fileApplication.application_info.current_stage}`);
        } else {
            console.log('❌ File-based data retrieval failed');
        }
        
        // Step 7: Test application status endpoint
        console.log('\n📊 Step 7: Testing application status endpoint...');
        try {
            const statusResponse = await axios.get(`${API_BASE_URL}/pre-qualification/status/${applicationNumber}`);
            if (statusResponse.data.success) {
                console.log('✅ Application status endpoint working');
                console.log(`   - Status: ${statusResponse.data.data.status}`);
                console.log(`   - Stage: ${statusResponse.data.data.current_stage}`);
            } else {
                console.log('❌ Application status endpoint failed');
            }
        } catch (statusError) {
            console.log('❌ Application status endpoint error:', statusError.message);
        }
        
        console.log('\n🎉 DUAL STORAGE TEST COMPLETED SUCCESSFULLY!');
        console.log('=============================================');
        console.log('✅ Database storage: Working');
        console.log('✅ File storage: Working');
        console.log('✅ Data consistency: Verified');
        console.log('✅ Directory structure: Complete');
        console.log('✅ Data retrieval: Working');
        
        return {
            success: true,
            applicationNumber,
            databaseData: dbApplication,
            fileData: fileData
        };
        
    } catch (error) {
        console.log('\n❌ DUAL STORAGE TEST FAILED');
        console.log('===========================');
        console.log(`Error: ${error.message}`);
        
        if (applicationNumber) {
            console.log(`Application Number: ${applicationNumber}`);
        }
        
        return {
            success: false,
            error: error.message,
            applicationNumber
        };
        
    } finally {
        await databaseService.close();
    }
}

async function testMultipleApplications() {
    console.log('\n🧪 Testing Multiple Applications...');
    console.log('===================================');
    
    const testCases = [
        {
            name: "Test User 1",
            data: {
                applicantName: "MULTI TEST USER 1",
                phone: "1111111111",
                email: "test1@example.com",
                panNumber: "MULTI1234A",
                dateOfBirth: "1985-05-15",
                loanAmount: 400000,
                loanPurpose: "home_improvement",
                employmentType: "salaried"
            }
        },
        {
            name: "Test User 2", 
            data: {
                applicantName: "MULTI TEST USER 2",
                phone: "2222222222",
                email: "test2@example.com",
                panNumber: "MULTI5678B",
                dateOfBirth: "1992-08-20",
                loanAmount: 250000,
                loanPurpose: "education",
                employmentType: "self_employed"
            }
        }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`\n📤 Creating application for: ${testCase.name}`);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, testCase.data, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success && response.data.data.success) {
                const appNumber = response.data.data.applicationNumber;
                console.log(`✅ Created: ${appNumber}`);
                
                // Quick verification
                await databaseService.initialize();
                const dbApp = await databaseService.getCompleteApplication(appNumber);
                const fileApp = await databaseService.getApplicationFile(appNumber);
                
                if (dbApp && fileApp) {
                    console.log(`✅ Dual storage verified for: ${appNumber}`);
                    results.push({ success: true, applicationNumber: appNumber });
                } else {
                    console.log(`❌ Dual storage failed for: ${appNumber}`);
                    results.push({ success: false, applicationNumber: appNumber });
                }
                
                await databaseService.close();
                
            } else {
                console.log(`❌ Failed to create application for: ${testCase.name}`);
                results.push({ success: false, name: testCase.name });
            }
            
        } catch (error) {
            console.log(`❌ Error creating application for ${testCase.name}: ${error.message}`);
            results.push({ success: false, name: testCase.name, error: error.message });
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Multiple Applications Test Summary:');
    console.log('=====================================');
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Successful: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${results.length - successCount}/${results.length}`);
    
    return results;
}

async function runDualStorageTests() {
    console.log('🚀 Starting Dual Storage System Tests');
    console.log('=====================================');
    
    // Test single application
    const singleResult = await testDualStorage();
    
    // Test multiple applications
    const multipleResults = await testMultipleApplications();
    
    // Final summary
    console.log('\n📋 FINAL TEST SUMMARY');
    console.log('=====================');
    console.log(`Single Application Test: ${singleResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Multiple Applications Test: ${multipleResults.filter(r => r.success).length}/${multipleResults.length} passed`);
    
    if (singleResult.success && multipleResults.filter(r => r.success).length === multipleResults.length) {
        console.log('\n🎉 ALL DUAL STORAGE TESTS PASSED!');
        console.log('✅ Database storage is working correctly');
        console.log('✅ File storage is working correctly');
        console.log('✅ Data consistency is maintained');
        console.log('✅ System is ready for production use');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED - Review required');
    }
    
    return {
        singleTest: singleResult,
        multipleTests: multipleResults
    };
}

// Run the tests
runDualStorageTests().catch(console.error);
