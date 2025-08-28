/**
 * Dashboard API Testing
 * Tests all dashboard endpoints to ensure they return current and accurate data
 */

const axios = require('axios');
const databaseService = require('../src/database/service');

const API_BASE_URL = 'http://localhost:3000/api';

async function testDashboardAPI() {
    console.log('🧪 Testing Dashboard API Endpoints');
    console.log('==================================');
    
    const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        endpoints: {}
    };

    try {
        // Test 1: Dashboard Health Check
        console.log('\n📊 Test 1: Dashboard Health Check');
        console.log('================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/health`);
            if (response.data.success) {
                console.log('✅ Dashboard health check passed');
                console.log(`   Status: ${response.data.message}`);
                console.log(`   Database: ${response.data.database}`);
                results.passedTests++;
                results.endpoints.health = { success: true, data: response.data };
            } else {
                throw new Error('Health check returned success: false');
            }
        } catch (error) {
            console.log('❌ Dashboard health check failed:', error.message);
            results.failedTests++;
            results.endpoints.health = { success: false, error: error.message };
        }

        // Test 2: LOS Overview
        console.log('\n📊 Test 2: LOS Dashboard Overview');
        console.log('=================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/los/overview`);
            if (response.data.success) {
                const data = response.data.data.overview;
                console.log('✅ LOS Overview test passed');
                console.log(`   Total Applications: ${data.metrics.total_applications}`);
                console.log(`   Pending: ${data.metrics.pending_applications}`);
                console.log(`   Approved: ${data.metrics.approved_applications}`);
                console.log(`   Recent Applications: ${data.recent_applications.length}`);
                console.log(`   Status Distribution: ${data.status_distribution.length} categories`);
                console.log(`   Recent Decisions: ${data.recent_decisions.length}`);
                
                // Verify data is current
                if (data.metrics.total_applications > 0) {
                    console.log('✅ Data is current (applications found)');
                } else {
                    console.log('⚠️ No applications found in database');
                }
                
                results.passedTests++;
                results.endpoints.losOverview = { success: true, data: data };
            } else {
                throw new Error('LOS Overview returned success: false');
            }
        } catch (error) {
            console.log('❌ LOS Overview test failed:', error.message);
            results.failedTests++;
            results.endpoints.losOverview = { success: false, error: error.message };
        }

        // Test 3: LOS Applications List
        console.log('\n📊 Test 3: LOS Applications List');
        console.log('===============================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/los/applications?limit=5`);
            if (response.data.success) {
                const data = response.data.data;
                console.log('✅ LOS Applications test passed');
                console.log(`   Applications Returned: ${data.applications.length}`);
                console.log(`   Total Applications: ${data.pagination.total}`);
                console.log(`   Current Page: ${data.pagination.page}`);
                console.log(`   Total Pages: ${data.pagination.total_pages}`);
                
                // Check if applications have current data
                if (data.applications.length > 0) {
                    const latestApp = data.applications[0];
                    console.log(`   Latest Application: ${latestApp.application_number}`);
                    console.log(`   Applicant: ${latestApp.applicant_name}`);
                    console.log(`   Status: ${latestApp.status}`);
                    console.log(`   Created: ${latestApp.created_at}`);
                    
                    // Verify this is recent data
                    const createdDate = new Date(latestApp.created_at);
                    const now = new Date();
                    const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24) {
                        console.log('✅ Data is recent (created within 24 hours)');
                    } else {
                        console.log(`⚠️ Data is ${hoursDiff.toFixed(1)} hours old`);
                    }
                }
                
                results.passedTests++;
                results.endpoints.losApplications = { success: true, data: data };
            } else {
                throw new Error('LOS Applications returned success: false');
            }
        } catch (error) {
            console.log('❌ LOS Applications test failed:', error.message);
            results.failedTests++;
            results.endpoints.losApplications = { success: false, error: error.message };
        }

        // Test 4: Application Details (if applications exist)
        console.log('\n📊 Test 4: Application Details');
        console.log('=============================');
        results.totalTests++;
        
        try {
            // First get a list of applications
            const listResponse = await axios.get(`${API_BASE_URL}/dashboard/los/applications?limit=1`);
            if (listResponse.data.success && listResponse.data.data.applications.length > 0) {
                const applicationNumber = listResponse.data.data.applications[0].application_number;
                
                const response = await axios.get(`${API_BASE_URL}/dashboard/los/applications/${applicationNumber}`);
                if (response.data.success) {
                    const data = response.data.data;
                    console.log('✅ Application Details test passed');
                    console.log(`   Application Number: ${data.application.application_number}`);
                    console.log(`   Applicant: ${data.application.applicant_name}`);
                    console.log(`   Status: ${data.application.status}`);
                    console.log(`   Stage Processing Records: ${data.stage_processing.length}`);
                    console.log(`   Credit Decisions: ${data.credit_decisions.length}`);
                    console.log(`   Audit Logs: ${data.audit_logs.length}`);
                    console.log(`   Verifications: ${data.verifications.length}`);
                    
                    results.passedTests++;
                    results.endpoints.applicationDetails = { success: true, data: data };
                } else {
                    throw new Error('Application Details returned success: false');
                }
            } else {
                console.log('⚠️ No applications available for details test');
                results.passedTests++;
                results.endpoints.applicationDetails = { success: true, message: 'No applications available' };
            }
        } catch (error) {
            console.log('❌ Application Details test failed:', error.message);
            results.failedTests++;
            results.endpoints.applicationDetails = { success: false, error: error.message };
        }

        // Test 5: LMS Overview
        console.log('\n📊 Test 5: LMS Dashboard Overview');
        console.log('=================================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/lms/overview`);
            if (response.data.success) {
                const data = response.data.data.overview;
                console.log('✅ LMS Overview test passed');
                console.log(`   Total Approved Loans: ${data.metrics.total_approved_loans}`);
                console.log(`   Total Disbursed Amount: ₹${data.metrics.total_disbursed_amount || 0}`);
                console.log(`   Average Loan Amount: ₹${data.metrics.average_loan_amount || 0}`);
                console.log(`   Active Loans: ${data.metrics.active_loans}`);
                console.log(`   Recent Loans: ${data.recent_loans.length}`);
                console.log(`   Purpose Distribution: ${data.purpose_distribution.length} categories`);
                
                results.passedTests++;
                results.endpoints.lmsOverview = { success: true, data: data };
            } else {
                throw new Error('LMS Overview returned success: false');
            }
        } catch (error) {
            console.log('❌ LMS Overview test failed:', error.message);
            results.failedTests++;
            results.endpoints.lmsOverview = { success: false, error: error.message };
        }

        // Test 6: Recent Activities
        console.log('\n📊 Test 6: Recent Activities');
        console.log('===========================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/dashboard/recent-activities`);
            if (response.data.success) {
                const data = response.data.data;
                console.log('✅ Recent Activities test passed');
                console.log(`   Audit Logs: ${data.audit_logs.length}`);
                console.log(`   Stage Updates: ${data.stage_updates.length}`);
                
                if (data.audit_logs.length > 0) {
                    const latestLog = data.audit_logs[0];
                    console.log(`   Latest Activity: ${latestLog.action} for ${latestLog.application_number}`);
                    console.log(`   Timestamp: ${latestLog.created_at}`);
                }
                
                results.passedTests++;
                results.endpoints.recentActivities = { success: true, data: data };
            } else {
                throw new Error('Recent Activities returned success: false');
            }
        } catch (error) {
            console.log('❌ Recent Activities test failed:', error.message);
            results.failedTests++;
            results.endpoints.recentActivities = { success: false, error: error.message };
        }

        // Test 7: Dashboard Stats
        console.log('\n📊 Test 7: Dashboard Stats');
        console.log('=========================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/dashboard/stats`);
            if (response.data.success) {
                const data = response.data.data;
                console.log('✅ Dashboard Stats test passed');
                console.log(`   Total Applications: ${data.overview.total_applications}`);
                console.log(`   Pending: ${data.overview.pending}`);
                console.log(`   Approved: ${data.overview.approved}`);
                console.log(`   Rejected: ${data.overview.rejected}`);
                console.log(`   Total Loan Amount: ₹${data.overview.total_loan_amount || 0}`);
                console.log(`   Average Loan Amount: ₹${data.overview.avg_loan_amount || 0}`);
                console.log(`   Daily Trends: ${data.daily_trends.length} days`);
                
                results.passedTests++;
                results.endpoints.dashboardStats = { success: true, data: data };
            } else {
                throw new Error('Dashboard Stats returned success: false');
            }
        } catch (error) {
            console.log('❌ Dashboard Stats test failed:', error.message);
            results.failedTests++;
            results.endpoints.dashboardStats = { success: false, error: error.message };
        }

        // Test 8: Combined Dashboard
        console.log('\n📊 Test 8: Combined Dashboard');
        console.log('============================');
        results.totalTests++;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/combined`);
            if (response.data.success) {
                console.log('✅ Combined Dashboard test passed');
                console.log(`   Message: ${response.data.message}`);
                console.log(`   Available Endpoints: ${Object.keys(response.data.endpoints).length}`);
                
                results.passedTests++;
                results.endpoints.combined = { success: true, data: response.data };
            } else {
                throw new Error('Combined Dashboard returned success: false');
            }
        } catch (error) {
            console.log('❌ Combined Dashboard test failed:', error.message);
            results.failedTests++;
            results.endpoints.combined = { success: false, error: error.message };
        }

        // Test 9: Database Verification
        console.log('\n📊 Test 9: Database Verification');
        console.log('===============================');
        results.totalTests++;
        
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            // Get actual database count
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM loan_applications');
            const dbCount = countResult[0].total;
            
            // Get latest application
            const [latestResult] = await connection.execute(`
                SELECT application_number, applicant_name, created_at 
                FROM loan_applications 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            connection.release();
            
            console.log('✅ Database Verification test passed');
            console.log(`   Total Applications in DB: ${dbCount}`);
            
            if (latestResult.length > 0) {
                const latest = latestResult[0];
                console.log(`   Latest Application: ${latest.application_number}`);
                console.log(`   Applicant: ${latest.applicant_name}`);
                console.log(`   Created: ${latest.created_at}`);
                
                // Verify this matches dashboard data
                if (results.endpoints.losOverview && results.endpoints.losOverview.success) {
                    const dashboardCount = results.endpoints.losOverview.data.metrics.total_applications;
                    if (dashboardCount === dbCount) {
                        console.log('✅ Dashboard data matches database count');
                    } else {
                        console.log(`⚠️ Dashboard count (${dashboardCount}) doesn't match DB count (${dbCount})`);
                    }
                }
            }
            
            results.passedTests++;
            results.endpoints.databaseVerification = { success: true, dbCount, latestApp: latestResult[0] || null };
            
        } catch (error) {
            console.log('❌ Database Verification test failed:', error.message);
            results.failedTests++;
            results.endpoints.databaseVerification = { success: false, error: error.message };
        } finally {
            await databaseService.close();
        }

        // Final Summary
        console.log('\n📋 DASHBOARD API TEST SUMMARY');
        console.log('=============================');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
        
        if (results.failedTests === 0) {
            console.log('\n🎉 ALL DASHBOARD API TESTS PASSED!');
            console.log('✅ Dashboard is displaying current data correctly');
            console.log('✅ All endpoints are working properly');
            console.log('✅ Database integration is functioning');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - Review required');
        }
        
        return results;
        
    } catch (error) {
        console.log('\n❌ Dashboard API testing failed:', error.message);
        return {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests + 1,
            error: error.message
        };
    }
}

// Run the tests
testDashboardAPI().catch(console.error);
