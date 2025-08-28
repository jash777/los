/**
 * Manual Workflow and Rules Engine Testing
 * Tests the manual approval workflow and rules engine endpoints
 */

const axios = require('axios');
const databaseService = require('../src/database/service');

const API_BASE_URL = 'http://localhost:3000/api';

async function testManualWorkflowAndRulesEngine() {
    console.log('🧪 Testing Manual Workflow and Rules Engine');
    console.log('============================================');
    
    const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testResults: {}
    };

    try {
        // Test 1: Rules Engine - Get Complete Configuration
        console.log('\n📊 Test 1: Rules Engine - Complete Configuration');
        console.log('================================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/rules-engine`);
            
            if (response.data.success) {
                console.log('✅ Rules engine configuration retrieved');
                console.log(`   Version: ${response.data.data.version}`);
                console.log(`   Stages Available: ${Object.keys(response.data.data.rules_engine.loan_origination_rules_engine.stages).length}`);
                
                results.passedTests++;
                results.testResults.rulesEngineConfig = { success: true, data: response.data };
            } else {
                throw new Error('Rules engine returned success: false');
            }
        } catch (error) {
            console.log('❌ Rules engine configuration test failed:', error.message);
            results.failedTests++;
            results.testResults.rulesEngineConfig = { success: false, error: error.message };
        }

        // Test 2: Rules Engine - Get Stage Rules
        console.log('\n📊 Test 2: Rules Engine - Stage Rules');
        console.log('====================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/rules-engine/stages/stage_1_pre_qualification`);
            
            if (response.data.success) {
                console.log('✅ Stage rules retrieved');
                console.log(`   Stage: ${response.data.data.stage_name}`);
                console.log(`   Business Rules: ${Object.keys(response.data.data.rules.business_rules).length}`);
                console.log(`   Decision Criteria: ${Object.keys(response.data.data.rules.decision_criteria).length}`);
                
                results.passedTests++;
                results.testResults.stageRules = { success: true, data: response.data };
            } else {
                throw new Error('Stage rules returned success: false');
            }
        } catch (error) {
            console.log('❌ Stage rules test failed:', error.message);
            results.failedTests++;
            results.testResults.stageRules = { success: false, error: error.message };
        }

        // Test 3: Rules Engine - Compare Implementation
        console.log('\n📊 Test 3: Rules Engine - Implementation Comparison');
        console.log('==================================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/rules-engine/compare`);
            
            if (response.data.success) {
                console.log('✅ Implementation comparison completed');
                console.log(`   Rules File Version: ${response.data.data.rules_file_version}`);
                console.log(`   Stages Analyzed: ${Object.keys(response.data.data.implementation_status).length}`);
                console.log(`   Discrepancies: ${response.data.data.discrepancies.length}`);
                console.log(`   Recommendations: ${response.data.data.recommendations.length}`);
                
                results.passedTests++;
                results.testResults.implementationComparison = { success: true, data: response.data };
            } else {
                throw new Error('Implementation comparison returned success: false');
            }
        } catch (error) {
            console.log('❌ Implementation comparison test failed:', error.message);
            results.failedTests++;
            results.testResults.implementationComparison = { success: false, error: error.message };
        }

        // Test 4: Manual Workflow - Get Pending Reviews
        console.log('\n📊 Test 4: Manual Workflow - Pending Reviews');
        console.log('============================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/manual-workflow/reviews/pending?limit=10`);
            
            if (response.data.success) {
                console.log('✅ Pending reviews retrieved');
                console.log(`   Total Reviews: ${response.data.data.total}`);
                console.log(`   Reviews Returned: ${response.data.data.reviews.length}`);
                
                results.passedTests++;
                results.testResults.pendingReviews = { success: true, data: response.data };
            } else {
                throw new Error('Pending reviews returned success: false');
            }
        } catch (error) {
            console.log('❌ Pending reviews test failed:', error.message);
            results.failedTests++;
            results.testResults.pendingReviews = { success: false, error: error.message };
        }

        // Test 5: Manual Workflow - Reviewer Workload
        console.log('\n📊 Test 5: Manual Workflow - Reviewer Workload');
        console.log('==============================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/manual-workflow/reviewers/workload`);
            
            if (response.data.success) {
                console.log('✅ Reviewer workload retrieved');
                console.log(`   Total Reviewers: ${response.data.data.total_reviewers}`);
                
                if (response.data.data.workload.length > 0) {
                    const reviewer = response.data.data.workload[0];
                    console.log(`   Sample Reviewer: ${reviewer.employee_name} (${reviewer.role})`);
                    console.log(`   Workload: ${reviewer.current_workload}/${reviewer.max_workload}`);
                }
                
                results.passedTests++;
                results.testResults.reviewerWorkload = { success: true, data: response.data };
            } else {
                throw new Error('Reviewer workload returned success: false');
            }
        } catch (error) {
            console.log('❌ Reviewer workload test failed:', error.message);
            results.failedTests++;
            results.testResults.reviewerWorkload = { success: false, error: error.message };
        }

        // Test 6: Manual Workflow - Dashboard Data
        console.log('\n📊 Test 6: Manual Workflow - Dashboard Data');
        console.log('==========================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/manual-workflow/dashboard`);
            
            if (response.data.success) {
                console.log('✅ Manual workflow dashboard data retrieved');
                console.log(`   Queue Statistics: ${response.data.data.queue_statistics.length} entries`);
                console.log(`   Reviewer Performance: ${response.data.data.reviewer_performance.length} reviewers`);
                console.log(`   Overdue Items: ${response.data.data.overdue_items}`);
                
                results.passedTests++;
                results.testResults.workflowDashboard = { success: true, data: response.data };
            } else {
                throw new Error('Workflow dashboard returned success: false');
            }
        } catch (error) {
            console.log('❌ Workflow dashboard test failed:', error.message);
            results.failedTests++;
            results.testResults.workflowDashboard = { success: false, error: error.message };
        }

        // Test 7: Test Manual Review Queue Addition (with sample application)
        console.log('\n📊 Test 7: Manual Workflow - Add to Queue');
        console.log('=========================================');
        results.totalTests++;
        
        try {
            // First, get a sample application number from the database
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            const [applications] = await connection.execute(
                'SELECT application_number FROM loan_applications ORDER BY created_at DESC LIMIT 1'
            );
            
            connection.release();
            
            if (applications.length > 0) {
                const applicationNumber = applications[0].application_number;
                
                const response = await axios.post(
                    `${API_BASE_URL}/manual-workflow/applications/${applicationNumber}/stages/underwriting/queue`,
                    {
                        review_type: 'underwriting',
                        priority: 'normal'
                    }
                );
                
                if (response.data.success) {
                    console.log('✅ Application added to manual review queue');
                    console.log(`   Application: ${applicationNumber}`);
                    console.log(`   Stage: underwriting`);
                    console.log(`   Due Date: ${response.data.data.dueDate}`);
                    
                    results.passedTests++;
                    results.testResults.addToQueue = { success: true, data: response.data };
                } else {
                    throw new Error('Add to queue returned success: false');
                }
            } else {
                console.log('⚠️ No applications found to test queue addition');
                results.passedTests++;
                results.testResults.addToQueue = { success: true, message: 'No applications available' };
            }
            
        } catch (error) {
            console.log('❌ Add to queue test failed:', error.message);
            results.failedTests++;
            results.testResults.addToQueue = { success: false, error: error.message };
        } finally {
            await databaseService.close();
        }

        // Test 8: Rules Engine Endpoints List
        console.log('\n📊 Test 8: Rules Engine - Available Endpoints');
        console.log('=============================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/rules-engine/endpoints`);
            
            if (response.data.success) {
                console.log('✅ Rules engine endpoints retrieved');
                console.log(`   Available Endpoints: ${Object.keys(response.data.data.available_endpoints).length}`);
                console.log(`   Stages Available: ${response.data.data.stages_available.length}`);
                console.log(`   Version: ${response.data.data.version}`);
                
                results.passedTests++;
                results.testResults.rulesEngineEndpoints = { success: true, data: response.data };
            } else {
                throw new Error('Rules engine endpoints returned success: false');
            }
        } catch (error) {
            console.log('❌ Rules engine endpoints test failed:', error.message);
            results.failedTests++;
            results.testResults.rulesEngineEndpoints = { success: false, error: error.message };
        }

        // Final Summary
        console.log('\n📋 MANUAL WORKFLOW & RULES ENGINE TEST SUMMARY');
        console.log('==============================================');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        if (results.failedTests === 0) {
            console.log('\n🎉 ALL MANUAL WORKFLOW & RULES ENGINE TESTS PASSED!');
            console.log('✅ Rules engine is exposing configuration and evaluation logic');
            console.log('✅ Manual workflow system is operational');
            console.log('✅ Dashboard endpoints are working correctly');
            console.log('✅ Implementation comparison is available');
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
        console.log('\n❌ Manual workflow and rules engine testing failed:', error.message);
        return {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests + 1,
            error: error.message
        };
    }
}

// Run the tests
testManualWorkflowAndRulesEngine().catch(console.error);
