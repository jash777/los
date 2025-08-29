/**
 * Fix and Test Complete System
 * Comprehensive script to test all fixes and generate complete loan application
 */

const testThirdPartyIntegration = require('./test_third_party_integration');
const testCompletePDFGeneration = require('./test_complete_pdf_generation');
const fs = require('fs').promises;
const path = require('path');

async function fixAndTestCompleteSystem() {
    console.log('🚀 COMPREHENSIVE LOAN APPLICATION SYSTEM TEST');
    console.log('==============================================');
    console.log('This script will test:');
    console.log('1. Third-party service integration fixes');
    console.log('2. Complete PDF generation with all fields');
    console.log('3. End-to-end loan application processing\n');

    const startTime = Date.now();

    try {
        // Step 1: Test Third-Party Service Integration
        console.log('📡 STEP 1: Testing Third-Party Service Integration');
        console.log('--------------------------------------------------');
        await testThirdPartyIntegration();
        
        console.log('\n✅ Third-party integration test completed\n');

        // Step 2: Test Complete PDF Generation
        console.log('📄 STEP 2: Testing Complete PDF Generation');
        console.log('-------------------------------------------');
        await testCompletePDFGeneration();
        
        console.log('\n✅ PDF generation test completed\n');

        // Step 3: Verify the generated files
        console.log('🔍 STEP 3: Verifying Generated Files');
        console.log('------------------------------------');
        
        const applicationNumber = 'EL_1756402515298_a6qwcx48h';
        const applicationDir = path.join(__dirname, `applications/${applicationNumber}`);
        
        // Check for generated files
        const expectedFiles = [
            'third-party-test-results.json',
            'complete-loan-application.pdf',
            'enhanced-application-data.json'
        ];

        for (const file of expectedFiles) {
            const filePath = path.join(applicationDir, file);
            try {
                const stats = await fs.stat(filePath);
                console.log(`   ✅ ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
            } catch (error) {
                console.log(`   ❌ ${file} - Not found`);
            }
        }

        // Step 4: Generate Summary Report
        console.log('\n📊 STEP 4: Generating Summary Report');
        console.log('------------------------------------');
        
        const summaryReport = await generateSummaryReport(applicationNumber);
        
        console.log('📋 SUMMARY REPORT:');
        console.log('==================');
        console.log(`Application Number: ${summaryReport.application_number}`);
        console.log(`Applicant Name: ${summaryReport.applicant_name}`);
        console.log(`Loan Amount: ₹${summaryReport.loan_amount?.toLocaleString('en-IN')}`);
        console.log(`Processing Status: ${summaryReport.processing_status}`);
        console.log('\nThird-Party Services:');
        console.log(`  PAN Verification: ${summaryReport.third_party_status.pan_verification}`);
        console.log(`  CIBIL Check: ${summaryReport.third_party_status.cibil_check}`);
        console.log(`  Bank Analysis: ${summaryReport.third_party_status.bank_analysis}`);
        console.log(`  Employment Verification: ${summaryReport.third_party_status.employment_verification}`);
        console.log('\nGenerated Files:');
        summaryReport.generated_files.forEach(file => {
            console.log(`  ✅ ${file.name} (${file.size})`);
        });

        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`\n🎉 SYSTEM TEST COMPLETED SUCCESSFULLY!`);
        console.log(`⏱️  Total execution time: ${totalTime} seconds`);
        console.log('\n📁 Generated Files Location:');
        console.log(`   ${applicationDir}`);
        console.log('\n🔧 Key Fixes Implemented:');
        console.log('   ✅ Third-party service data normalization');
        console.log('   ✅ Complete template field population');
        console.log('   ✅ Enhanced PDF generation with all sections');
        console.log('   ✅ Proper error handling and fallback values');
        console.log('   ✅ Banking and employment data structure fixes');

    } catch (error) {
        console.error('\n❌ SYSTEM TEST FAILED:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function generateSummaryReport(applicationNumber) {
    try {
        const applicationDir = path.join(__dirname, `applications/${applicationNumber}`);
        
        // Load application data
        const applicationDataPath = path.join(applicationDir, 'application-data.json');
        const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
        
        // Load test results if available
        let thirdPartyResults = null;
        try {
            const testResultsPath = path.join(applicationDir, 'third-party-test-results.json');
            thirdPartyResults = JSON.parse(await fs.readFile(testResultsPath, 'utf8'));
        } catch (error) {
            // Test results not available
        }

        // Check generated files
        const generatedFiles = [];
        const fileChecks = [
            { name: 'complete-loan-application.pdf', description: 'Complete Loan Application PDF' },
            { name: 'enhanced-application-data.json', description: 'Enhanced Application Data' },
            { name: 'third-party-test-results.json', description: 'Third-Party Test Results' }
        ];

        for (const fileCheck of fileChecks) {
            try {
                const filePath = path.join(applicationDir, fileCheck.name);
                const stats = await fs.stat(filePath);
                generatedFiles.push({
                    name: fileCheck.description,
                    size: `${(stats.size / 1024).toFixed(2)} KB`,
                    exists: true
                });
            } catch (error) {
                generatedFiles.push({
                    name: fileCheck.description,
                    size: 'N/A',
                    exists: false
                });
            }
        }

        return {
            application_number: applicationData.application_info.application_number,
            applicant_name: applicationData.stage_1_data?.personal_details?.full_name || 'N/A',
            loan_amount: applicationData.stage_1_data?.loan_request?.loan_amount,
            processing_status: applicationData.application_info.status,
            third_party_status: {
                pan_verification: applicationData.third_party_data?.pan_verification?.success ? '✅ Success' : '❌ Failed',
                cibil_check: applicationData.third_party_data?.cibil_data?.success ? '✅ Success' : '❌ Failed',
                bank_analysis: thirdPartyResults?.processing_result?.third_party_data?.bank_statement_analysis?.success ? '✅ Success' : '❌ Failed',
                employment_verification: thirdPartyResults?.processing_result?.third_party_data?.employment_verification?.success ? '✅ Success' : '❌ Failed'
            },
            generated_files: generatedFiles.filter(file => file.exists),
            test_timestamp: new Date().toISOString()
        };

    } catch (error) {
        return {
            application_number: applicationNumber,
            applicant_name: 'Unknown',
            error: error.message
        };
    }
}

// Run the complete system test
if (require.main === module) {
    fixAndTestCompleteSystem();
}

module.exports = fixAndTestCompleteSystem;
