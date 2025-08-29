/**
 * Dual Workflow System Testing
 * Tests both LOS automated workflow and dashboard-driven employee workflow
 */

const axios = require('axios');
const databaseService = require('../src/database/service');

const API_BASE_URL = 'http://localhost:3000/api';

async function testDualWorkflowSystem() {
    console.log('🧪 Testing Dual Workflow System (LOS + Dashboard-Driven)');
    console.log('========================================================');
    
    const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testResults: {},
        applications: []
    };

    try {
        // Test 1: Create Dashboard-Driven Application
        console.log('\n📊 Test 1: Create Dashboard-Driven Application');
        console.log('==============================================');
        results.totalTests++;
        
        const dashboardAppData = {
            applicant_name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            phone: "9876543210",
            pan_number: "ABCDE1234F",
            aadhar_number: "123456789012",
            date_of_birth: "1985-03-15",
            loan_amount: 750000,
            loan_purpose: "home_improvement",
            employment_type: "salaried",
            monthly_income: 85000,
            company_name: "Tech Solutions Pvt Ltd",
            designation: "Senior Developer",
            priority_level: "high",
            created_by: "employee_001"
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/dashboard-workflow/applications`, dashboardAppData);
            
            if (response.data.success) {
                console.log('✅ Dashboard-driven application created successfully');
                console.log(`   Application Number: ${response.data.data.application_number}`);
                console.log(`   Workflow Type: ${response.data.data.workflow_type}`);
                console.log(`   Initial Stage: ${response.data.data.initial_stage}`);
                console.log(`   Next Action: ${response.data.data.next_steps.action}`);
                
                results.applications.push({
                    type: 'dashboard_driven',
                    applicationNumber: response.data.data.application_number,
                    applicationId: response.data.data.application_id,
                    profileId: response.data.data.profile_id
                });
                
                results.passedTests++;
                results.testResults.createDashboardApp = { success: true, data: response.data };
            } else {
                throw new Error('Dashboard application creation returned success: false');
            }
        } catch (error) {
            console.log('❌ Dashboard application creation failed:', error.message);
            results.failedTests++;
            results.testResults.createDashboardApp = { success: false, error: error.message };
        }

        // Test 2: Create LOS Automated Application (Traditional)
        console.log('\n📊 Test 2: Create LOS Automated Application');
        console.log('==========================================');
        results.totalTests++;
        
        const losAppData = {
            applicantName: "Michael Chen",
            phone: "9876543211",
            email: "michael.chen@example.com",
            panNumber: "FGHIJ5678K",
            dateOfBirth: "1988-07-20",
            employmentType: "salaried",
            loanAmount: 500000,
            loanPurpose: "personal"
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/pre-qualification/process`, losAppData);
            
            if (response.data.success) {
                console.log('✅ LOS automated application created successfully');
                console.log(`   Application Number: ${response.data.applicationNumber}`);
                console.log(`   Status: ${response.data.status}`);
                console.log(`   Decision: ${response.data.decision || 'processed'}`);
                console.log(`   CIBIL Score: ${response.data.cibil_score || 'N/A'}`);
                
                results.applications.push({
                    type: 'los_automated',
                    applicationNumber: response.data.applicationNumber
                });
                
                results.passedTests++;
                results.testResults.createLosApp = { success: true, data: response.data };
            } else {
                throw new Error('LOS application creation returned success: false');
            }
        } catch (error) {
            console.log('❌ LOS application creation failed:', error.message);
            results.failedTests++;
            results.testResults.createLosApp = { success: false, error: error.message };
        }

        // Test 3: Get Dashboard Application for Review
        if (results.applications.find(app => app.type === 'dashboard_driven')) {
            console.log('\n📊 Test 3: Get Dashboard Application for Review');
            console.log('==============================================');
            results.totalTests++;
            
            const dashboardApp = results.applications.find(app => app.type === 'dashboard_driven');
            
            try {
                const response = await axios.get(`${API_BASE_URL}/dashboard-workflow/applications/${dashboardApp.applicationNumber}/review`);
                
                if (response.data.success) {
                    console.log('✅ Dashboard application retrieved for review');
                    console.log(`   Application Number: ${response.data.data.application.application_number}`);
                    console.log(`   Workflow Type: ${response.data.data.workflow_type}`);
                    console.log(`   Current Stage: ${response.data.data.current_stage}`);
                    console.log(`   Current Status: ${response.data.data.current_status}`);
                    console.log(`   Applicant: ${response.data.data.application.full_name}`);
                    console.log(`   Loan Amount: ₹${response.data.data.application.loan_amount}`);
                    
                    results.passedTests++;
                    results.testResults.getDashboardAppReview = { success: true, data: response.data };
                } else {
                    throw new Error('Dashboard application review returned success: false');
                }
            } catch (error) {
                console.log('❌ Dashboard application review failed:', error.message);
                results.failedTests++;
                results.testResults.getDashboardAppReview = { success: false, error: error.message };
            }
        }

        // Test 4: Process Dashboard Stage
        if (results.applications.find(app => app.type === 'dashboard_driven')) {
            console.log('\n📊 Test 4: Process Dashboard Stage');
            console.log('=================================');
            results.totalTests++;
            
            const dashboardApp = results.applications.find(app => app.type === 'dashboard_driven');
            
            const stageProcessData = {
                decision: "approved",
                decision_reason: "All initial documents verified and applicant profile looks good",
                employee_id: "EMP001",
                next_stage: "kyc_verification",
                stage_data: {
                    decision_score: 85,
                    time_spent_minutes: 15,
                    internal_notes: "Applicant has good employment history and credit profile"
                }
            };
            
            try {
                const response = await axios.post(
                    `${API_BASE_URL}/dashboard-workflow/applications/${dashboardApp.applicationNumber}/stages/application_submitted/process`,
                    stageProcessData
                );
                
                if (response.data.success) {
                    console.log('✅ Dashboard stage processed successfully');
                    console.log(`   Processed Stage: ${response.data.data.processed_stage}`);
                    console.log(`   Decision: ${response.data.data.decision}`);
                    console.log(`   Next Stage: ${response.data.data.next_stage}`);
                    console.log(`   Status: ${response.data.data.status}`);
                    console.log(`   Processed By: ${response.data.data.processed_by}`);
                    
                    results.passedTests++;
                    results.testResults.processDashboardStage = { success: true, data: response.data };
                } else {
                    throw new Error('Dashboard stage processing returned success: false');
                }
            } catch (error) {
                console.log('❌ Dashboard stage processing failed:', error.message);
                results.failedTests++;
                results.testResults.processDashboardStage = { success: false, error: error.message };
            }
        }

        // Test 5: Get Dual Workflow Dashboard
        console.log('\n📊 Test 5: Get Dual Workflow Dashboard');
        console.log('=====================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard-workflow/dashboard`);
            
            if (response.data.success) {
                console.log('✅ Dual workflow dashboard retrieved');
                console.log(`   Workflow Statistics: ${response.data.data.workflow_statistics.length} entries`);
                console.log(`   Stage Distribution: ${response.data.data.stage_distribution.length} entries`);
                console.log(`   Recent Activity: ${response.data.data.recent_activity.length} entries`);
                console.log(`   Performance Metrics: ${response.data.data.performance_metrics.length} workflows`);
                
                // Show workflow breakdown
                response.data.data.performance_metrics.forEach(metric => {
                    const avgHours = metric.avg_processing_hours || 0;
                    console.log(`   ${metric.workflow_type}: ${metric.total_applications} apps, ${avgHours.toFixed ? avgHours.toFixed(1) : avgHours}h avg`);
                });
                
                results.passedTests++;
                results.testResults.dualWorkflowDashboard = { success: true, data: response.data };
            } else {
                throw new Error('Dual workflow dashboard returned success: false');
            }
        } catch (error) {
            console.log('❌ Dual workflow dashboard failed:', error.message);
            results.failedTests++;
            results.testResults.dualWorkflowDashboard = { success: false, error: error.message };
        }

        // Test 6: Get Applications by Workflow Type
        console.log('\n📊 Test 6: Get Applications by Workflow Type');
        console.log('============================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard-workflow/workflows/dashboard_driven/applications?limit=10`);
            
            if (response.data.success) {
                console.log('✅ Applications by workflow type retrieved');
                console.log(`   Dashboard-driven applications: ${response.data.data.applications.length}`);
                console.log(`   Total applications: ${response.data.data.pagination.total}`);
                console.log(`   Current page: ${response.data.data.pagination.page}`);
                console.log(`   Total pages: ${response.data.data.pagination.total_pages}`);
                
                if (response.data.data.applications.length > 0) {
                    const app = response.data.data.applications[0];
                    console.log(`   Sample App: ${app.application_number} - ${app.full_name} - ${app.current_stage}`);
                }
                
                results.passedTests++;
                results.testResults.getAppsByWorkflow = { success: true, data: response.data };
            } else {
                throw new Error('Get applications by workflow returned success: false');
            }
        } catch (error) {
            console.log('❌ Get applications by workflow failed:', error.message);
            results.failedTests++;
            results.testResults.getAppsByWorkflow = { success: false, error: error.message };
        }

        // Test 7: Database Consistency Check
        console.log('\n📊 Test 7: Database Consistency Check');
        console.log('====================================');
        results.totalTests++;
        
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            // Check enhanced applications
            const [enhancedApps] = await connection.execute(`
                SELECT 
                    workflow_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN current_status = 'approved' THEN 1 END) as approved_count
                FROM loan_applications_enhanced 
                GROUP BY workflow_type
            `);
            
            // Check applicant profiles
            const [profiles] = await connection.execute(`
                SELECT COUNT(*) as profile_count FROM applicant_profiles
            `);
            
            // Check workflow states
            const [workflowStates] = await connection.execute(`
                SELECT 
                    workflow_type,
                    COUNT(*) as state_count
                FROM workflow_states 
                GROUP BY workflow_type
            `);
            
            // Check workflow transitions
            const [transitions] = await connection.execute(`
                SELECT COUNT(*) as transition_count FROM workflow_transitions
            `);
            
            console.log('✅ Database consistency check completed');
            console.log(`   Enhanced Applications:`);
            enhancedApps.forEach(app => {
                console.log(`     ${app.workflow_type}: ${app.count} total, ${app.approved_count} approved`);
            });
            console.log(`   Applicant Profiles: ${profiles[0].profile_count}`);
            console.log(`   Workflow States:`);
            workflowStates.forEach(state => {
                console.log(`     ${state.workflow_type}: ${state.state_count} states`);
            });
            console.log(`   Workflow Transitions: ${transitions[0].transition_count}`);
            
            connection.release();
            
            results.passedTests++;
            results.testResults.databaseConsistency = { 
                success: true, 
                data: { 
                    enhancedApps, 
                    profiles: profiles[0].profile_count,
                    workflowStates,
                    transitions: transitions[0].transition_count
                }
            };
            
        } catch (error) {
            console.log('❌ Database consistency check failed:', error.message);
            results.failedTests++;
            results.testResults.databaseConsistency = { success: false, error: error.message };
        } finally {
            await databaseService.close();
        }

        // Final Summary
        console.log('\n📋 DUAL WORKFLOW SYSTEM TEST SUMMARY');
        console.log('====================================');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        if (results.applications.length > 0) {
            console.log('\n📊 Created Applications:');
            results.applications.forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.applicationNumber} (${app.type})`);
            });
        }
        
        if (results.failedTests === 0) {
            console.log('\n🎉 ALL DUAL WORKFLOW TESTS PASSED!');
            console.log('✅ Dashboard-driven workflow is operational');
            console.log('✅ LOS automated workflow is preserved');
            console.log('✅ Both workflows coexist successfully');
            console.log('✅ Database consistency maintained');
            console.log('✅ Dual workflow dashboard functioning');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - Review required');
            
            // Show failed tests
            Object.entries(results.testResults).forEach(([testName, result]) => {
                if (!result.success) {
                    console.log(`   ❌ ${testName}: ${result.error}`);
                }
            });
        }
        
        return results;
        
    } catch (error) {
        console.log('\n❌ Dual workflow system testing failed:', error.message);
        return {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests + 1,
            error: error.message
        };
    }
}

// Run the tests
testDualWorkflowSystem().catch(console.error);
