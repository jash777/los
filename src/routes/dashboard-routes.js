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
router.get('/los/overview', dashboardController.getLOSOverview);

// Get Applications List with Filters
router.get('/los/applications', dashboardController.getLOSApplications);

// Get Application Details
router.get('/los/applications/:applicationNumber', dashboardController.getLOSApplicationDetails);

// Get LOS Analytics Data
router.get('/los/analytics', dashboardController.getLOSOverview);

/**
 * LMS Dashboard Routes
 */

// Get LMS Dashboard Overview
router.get('/lms/overview', dashboardController.getLMSOverview);

// Get LMS Applications List (approved loans)
router.get('/lms/loans', dashboardController.getLOSApplications);

// Get LMS Loan Details
router.get('/lms/loans/:applicationNumber', dashboardController.getLOSApplicationDetails);

// Get LMS Analytics Data
router.get('/lms/analytics', dashboardController.getLMSOverview);

/**
 * Legacy Dashboard Routes (for backward compatibility)
 */

// Get Recent Activities
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

// Get Dashboard Stats
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Get Status Distribution
router.get('/dashboard/status-distribution', dashboardController.getDashboardStats);

// Get Disbursement Trends
router.get('/dashboard/disbursement-trends', dashboardController.getDashboardStats);

// Get Risk Distribution
router.get('/dashboard/risk-distribution', dashboardController.getDashboardStats);

/**
 * Common Dashboard Routes
 */

// Get Combined Dashboard Data
router.get('/combined', async (req, res) => {
    try {
        const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
        
        res.json({
            success: true,
            message: 'Combined dashboard endpoint - use /los/overview and /lms/overview separately',
            endpoints: {
                los: '/api/dashboard/los/overview',
                lms: '/api/dashboard/lms/overview',
                applications: '/api/dashboard/los/applications'
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
