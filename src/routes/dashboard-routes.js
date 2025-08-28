/**
 * Dashboard Routes
 * API endpoints for LOS and LMS dashboards
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard-controller');

/**
 * LOS Dashboard Routes
 */

// Get LOS Dashboard Overview
router.get('/los/overview', dashboardController.getLOSDashboard);

// Get Applications List with Filters
router.get('/los/applications', dashboardController.getApplicationsList);

// Get Application Details
router.get('/los/applications/:applicationNumber', dashboardController.getApplicationDetails);

// Get LOS Analytics Data
router.get('/los/analytics', dashboardController.getAnalyticsData);

/**
 * LMS Dashboard Routes
 */

// Get LMS Dashboard Overview
router.get('/lms/overview', dashboardController.getLMSDashboard);

// Get LMS Applications List (approved loans)
router.get('/lms/loans', dashboardController.getApplicationsList);

// Get LMS Loan Details
router.get('/lms/loans/:applicationNumber', dashboardController.getApplicationDetails);

// Get LMS Analytics Data
router.get('/lms/analytics', dashboardController.getAnalyticsData);

/**
 * Legacy Dashboard Routes (for backward compatibility)
 */

// Get Recent Activities
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

// Get Dashboard Stats
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Get Status Distribution
router.get('/dashboard/status-distribution', dashboardController.getStatusDistribution);

// Get Disbursement Trends
router.get('/dashboard/disbursement-trends', dashboardController.getDisbursementTrends);

// Get Risk Distribution
router.get('/dashboard/risk-distribution', dashboardController.getRiskDistribution);

/**
 * Common Dashboard Routes
 */

// Get Combined Dashboard Data
router.get('/combined', async (req, res) => {
    try {
        const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
        
        // Get both LOS and LMS data
        const losData = await dashboardController.getLOSDashboard(req, res);
        const lmsData = await dashboardController.getLMSDashboard(req, res);
        
        res.json({
            success: true,
            data: {
                los: losData,
                lms: lmsData
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate combined dashboard data',
            details: error.message
        });
    }
});

// Health check for dashboard
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard API is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
