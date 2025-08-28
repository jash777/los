/**
 * Dashboard Controller
 * Handles dashboard data for LOS and LMS systems
 * Updated to use database instead of filesystem
 */

const databaseConfig = require('../config/database');
const logger = require('../utils/logger');

class DashboardController {
    constructor() {
        this.pool = null;
        this.initialize();
    }

    /**
     * Initialize database connection
     */
    async initialize() {
        try {
            await databaseConfig.initialize();
            this.pool = databaseConfig.getPool();
            logger.info('Dashboard controller initialized with database connection');
        } catch (error) {
            logger.error('Failed to initialize dashboard controller:', error);
        }
    }

    /**
     * Get LOS Dashboard Overview
     */
    getLOSDashboard = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            logger.info(`[${requestId}] Generating LOS Dashboard data`);

            // Get all applications from database
            const applications = await this.getAllApplicationsFromDB();
            
            // Calculate dashboard metrics
            const dashboardData = this.calculateLOSMetrics(applications);

            logger.info(`[${requestId}] LOS Dashboard data generated successfully`);

            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('LOS Dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate LOS dashboard data',
                details: error.message
            });
        }
    }

    /**
     * Get LMS Dashboard Overview
     */
    getLMSDashboard = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            logger.info(`[${requestId}] Generating LMS Dashboard data`);

            // Get all applications from database
            const applications = await this.getAllApplicationsFromDB();
            
            // Calculate dashboard metrics
            const dashboardData = this.calculateLMSMetrics(applications);

            logger.info(`[${requestId}] LMS Dashboard data generated successfully`);

            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('LMS Dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate LMS dashboard data',
                details: error.message
            });
        }
    }

    /**
     * Get Applications List with Filters
     */
    getApplicationsList = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            const { status, stage, limit = 50, offset = 0, search } = req.query;

            logger.info(`[${requestId}] Fetching applications list with filters`);

            // Get applications from database with filters
            const { applications, totalCount } = await this.getApplicationsFromDBWithFilters({
                status,
                stage,
                search,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            logger.info(`[${requestId}] Applications list generated successfully`);

            res.json({
                success: true,
                data: {
                    applications: applications,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        has_more: offset + parseInt(limit) < totalCount
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Applications List error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch applications list',
                details: error.message
            });
        }
    }

    /**
     * Get Application Details
     */
    getApplicationDetails = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            const { applicationNumber } = req.params;

            logger.info(`[${requestId}] Fetching application details for: ${applicationNumber}`);

            const applicationData = await this.getApplicationByNumberFromDB(applicationNumber);
            
            if (!applicationData) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            logger.info(`[${requestId}] Application details fetched successfully`);

            res.json({
                success: true,
                data: applicationData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Application Details error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch application details',
                details: error.message
            });
        }
    }

    /**
     * Get Analytics Data
     */
    getAnalyticsData = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            const { type, period = '30d' } = req.query;

            logger.info(`[${requestId}] Fetching analytics data for type: ${type}, period: ${period}`);

            const applications = await this.getAllApplicationsFromDB();
            let analyticsData = {};

            switch (type) {
                case 'applications_trend':
                    analyticsData = this.getApplicationsTrend(applications, period);
                    break;
                case 'cibil_distribution':
                    analyticsData = this.getCIBILDistribution(applications);
                    break;
                case 'processing_time':
                    analyticsData = this.getProcessingTimeAnalytics(applications);
                    break;
                case 'revenue_analytics':
                    analyticsData = this.getRevenueAnalytics(applications);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid analytics type'
                    });
            }

            logger.info(`[${requestId}] Analytics data generated successfully`);

            res.json({
                success: true,
                data: analyticsData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate analytics data',
                details: error.message
            });
        }
    }

    /**
     * Get Recent Activities
     */
    getRecentActivities = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            const { limit = 10 } = req.query;

            logger.info(`[${requestId}] Fetching recent activities`);

            const activities = await this.getRecentActivitiesFromDB(parseInt(limit));

            logger.info(`[${requestId}] Recent activities generated successfully`);

            res.json({
                success: true,
                data: activities,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Recent Activities error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch recent activities',
                details: error.message
            });
        }
    }

    /**
     * Get Dashboard Stats
     */
    getDashboardStats = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();

            logger.info(`[${requestId}] Fetching dashboard stats`);

            const applications = await this.getAllApplicationsFromDB();
            const losMetrics = this.calculateLOSMetrics(applications);
            const lmsMetrics = this.calculateLMSMetrics(applications);

            const stats = {
                total_applications: losMetrics.overview.total_applications,
                pending_applications: losMetrics.overview.pending_applications,
                approved_applications: losMetrics.overview.approved_applications,
                total_loan_amount: losMetrics.loan_analytics.total_loan_amount,
                average_loan_amount: losMetrics.loan_analytics.average_loan_amount,
                average_cibil_score: losMetrics.cibil_analytics.average_score,
                portfolio_value: lmsMetrics.portfolio_overview.total_portfolio_value,
                active_loans: lmsMetrics.portfolio_overview.active_loans,
                emi_collection_rate: lmsMetrics.performance_metrics.emi_collection_rate,
                total_revenue: lmsMetrics.financial_analytics.total_revenue
            };

            logger.info(`[${requestId}] Dashboard stats generated successfully`);

            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Dashboard Stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard stats',
                details: error.message
            });
        }
    }

    /**
     * Get Status Distribution
     */
    getStatusDistribution = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();

            logger.info(`[${requestId}] Fetching status distribution`);

            const applications = await this.getAllApplicationsFromDB();
            const losMetrics = this.calculateLOSMetrics(applications);

            const statusDistribution = {
                pending: losMetrics.overview.pending_applications,
                approved: losMetrics.overview.approved_applications,
                rejected: losMetrics.overview.rejected_applications,
                conditional_approval: losMetrics.overview.conditional_approval,
                stage_distribution: losMetrics.stage_distribution
            };

            logger.info(`[${requestId}] Status distribution generated successfully`);

            res.json({
                success: true,
                data: statusDistribution,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Status Distribution error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch status distribution',
                details: error.message
            });
        }
    }

    /**
     * Get Disbursement Trends
     */
    getDisbursementTrends = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();
            const { period = '30d' } = req.query;

            logger.info(`[${requestId}] Fetching disbursement trends for period: ${period}`);

            const applications = await this.getAllApplicationsFromDB();
            const approvedApplications = applications.filter(app => 
                app.current_status === 'approved' || app.current_status === 'conditional_approval'
            );

            const trends = this.getDisbursementTrendData(approvedApplications, period);

            logger.info(`[${requestId}] Disbursement trends generated successfully`);

            res.json({
                success: true,
                data: trends,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Disbursement Trends error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch disbursement trends',
                details: error.message
            });
        }
    }

    /**
     * Get Risk Distribution
     */
    getRiskDistribution = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'dashboard-' + Date.now();

            logger.info(`[${requestId}] Fetching risk distribution`);

            const applications = await this.getAllApplicationsFromDB();
            const riskDistribution = this.calculateRiskDistribution(applications);

            logger.info(`[${requestId}] Risk distribution generated successfully`);

            res.json({
                success: true,
                data: riskDistribution,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Risk Distribution error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch risk distribution',
                details: error.message
            });
        }
    }

    // =====================================================
    // DATABASE METHODS
    // =====================================================

    /**
     * Get all applications from database
     */
    async getAllApplicationsFromDB() {
        if (!this.pool) {
            await this.initialize();
        }

        const connection = await this.pool.getConnection();
        
        try {
            const [applications] = await connection.execute(`
                SELECT 
                    a.id,
                    a.application_number,
                    a.current_stage,
                    a.current_status,
                    a.created_at,
                    a.updated_at,
                    a.completed_at,
                    a.total_processing_time_ms,
                    a.stage_count,
                    ap.personal_info,
                    ap.employment_info,
                    ap.banking_details,
                    ap.loan_details,
                    ap.third_party_data
                FROM applications a
                LEFT JOIN applicants ap ON a.id = ap.application_id
                ORDER BY a.created_at DESC
            `);

            return applications.map(app => ({
                application_info: {
                    application_number: app.application_number,
                    created_at: app.created_at,
                    last_updated: app.updated_at,
                    current_stage: app.current_stage,
                    status: app.current_status
                },
                stage_1_data: {
                    personal_details: app.personal_info ? JSON.parse(app.personal_info) : {},
                    loan_request: app.loan_details ? JSON.parse(app.loan_details) : {}
                },
                stage_2_data: {
                    employment_details: app.employment_info ? JSON.parse(app.employment_info) : {},
                    banking_details: app.banking_details ? JSON.parse(app.banking_details) : {}
                },
                third_party_data: app.third_party_data ? JSON.parse(app.third_party_data) : {}
            }));

        } catch (error) {
            logger.error('Error reading applications from database:', error);
            return [];
        } finally {
            connection.release();
        }
    }

    /**
     * Get applications from database with filters
     */
    async getApplicationsFromDBWithFilters(filters) {
        if (!this.pool) {
            await this.initialize();
        }

        const connection = await this.pool.getConnection();
        
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filters.status) {
                whereClause += ' AND a.current_status = ?';
                params.push(filters.status);
            }

            if (filters.stage) {
                whereClause += ' AND a.current_stage = ?';
                params.push(filters.stage);
            }

            if (filters.search) {
                whereClause += ' AND (a.application_number LIKE ? OR ap.personal_info LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }

            // Get total count
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM applications a
                LEFT JOIN applicants ap ON a.id = ap.application_id
                ${whereClause}
            `, params);

            const totalCount = countResult[0].total;

            // Get paginated results
            const [applications] = await connection.execute(`
                SELECT 
                    a.application_number,
                    a.current_stage,
                    a.current_status,
                    a.created_at,
                    a.updated_at,
                    ap.personal_info,
                    ap.loan_details,
                    ap.third_party_data
                FROM applications a
                LEFT JOIN applicants ap ON a.id = ap.application_id
                ${whereClause}
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, filters.limit, filters.offset]);

            const formattedApplications = applications.map(app => {
                const personalInfo = app.personal_info ? JSON.parse(app.personal_info) : {};
                const loanDetails = app.loan_details ? JSON.parse(app.loan_details) : {};
                const thirdPartyData = app.third_party_data ? JSON.parse(app.third_party_data) : {};

                return {
                    application_number: app.application_number,
                    applicant_name: `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim() || 'Unknown',
                    status: app.current_status,
                    stage: app.current_stage,
                    loan_amount: loanDetails.loan_amount || 0,
                    cibil_score: thirdPartyData.cibil_data?.score || 'N/A',
                    created_date: app.created_at,
                    last_updated: app.updated_at,
                    processing_time: this.calculateProcessingTime(app.created_at, app.updated_at)
                };
            });

            return { applications: formattedApplications, totalCount };

        } catch (error) {
            logger.error('Error reading applications with filters from database:', error);
            return { applications: [], totalCount: 0 };
        } finally {
            connection.release();
        }
    }

    /**
     * Get application by number from database
     */
    async getApplicationByNumberFromDB(applicationNumber) {
        if (!this.pool) {
            await this.initialize();
        }

        const connection = await this.pool.getConnection();
        
        try {
            const [applications] = await connection.execute(`
                SELECT 
                    a.*,
                    ap.personal_info,
                    ap.employment_info,
                    ap.banking_details,
                    ap.loan_details,
                    ap.third_party_data,
                    ap.address_info
                FROM applications a
                LEFT JOIN applicants ap ON a.id = ap.application_id
                WHERE a.application_number = ?
            `, [applicationNumber]);

            if (applications.length === 0) {
                return null;
            }

            const app = applications[0];
            return {
                application_info: {
                    application_number: app.application_number,
                    created_at: app.created_at,
                    last_updated: app.updated_at,
                    current_stage: app.current_stage,
                    status: app.current_status
                },
                stage_1_data: {
                    personal_details: app.personal_info ? JSON.parse(app.personal_info) : {},
                    loan_request: app.loan_details ? JSON.parse(app.loan_details) : {}
                },
                stage_2_data: {
                    employment_details: app.employment_info ? JSON.parse(app.employment_info) : {},
                    banking_details: app.banking_details ? JSON.parse(app.banking_details) : {},
                    address_details: app.address_info ? JSON.parse(app.address_info) : {}
                },
                third_party_data: app.third_party_data ? JSON.parse(app.third_party_data) : {}
            };

        } catch (error) {
            logger.error(`Error reading application ${applicationNumber} from database:`, error);
            return null;
        } finally {
            connection.release();
        }
    }

    /**
     * Get recent activities from database
     */
    async getRecentActivitiesFromDB(limit) {
        if (!this.pool) {
            await this.initialize();
        }

        const connection = await this.pool.getConnection();
        
        try {
            const [activities] = await connection.execute(`
                SELECT 
                    a.application_number,
                    a.current_stage,
                    a.current_status,
                    a.updated_at,
                    ap.personal_info,
                    ap.loan_details
                FROM applications a
                LEFT JOIN applicants ap ON a.id = ap.application_id
                ORDER BY a.updated_at DESC
                LIMIT ?
            `, [limit]);

            return activities.map(app => {
                const personalInfo = app.personal_info ? JSON.parse(app.personal_info) : {};
                const loanDetails = app.loan_details ? JSON.parse(app.loan_details) : {};
                const applicantName = `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim() || 'Unknown';

                return {
                    id: app.application_number,
                    type: this.getActivityType(app.current_status, app.current_stage),
                    title: `${applicantName} - ${app.current_status}`,
                    description: this.getActivityDescription(app.current_status, app.current_stage),
                    timestamp: app.updated_at,
                    status: app.current_status,
                    stage: app.current_stage,
                    loan_amount: loanDetails.loan_amount || 0,
                    applicant_name: applicantName
                };
            });

        } catch (error) {
            logger.error('Error reading recent activities from database:', error);
            return [];
        } finally {
            connection.release();
        }
    }

    // =====================================================
    // CALCULATION METHODS (Updated for database structure)
    // =====================================================

    /**
     * Calculate LOS Dashboard Metrics
     */
    calculateLOSMetrics(applications) {
        const totalApplications = applications.length;
        const statusCounts = {};
        const stageCounts = {};
        const cibilScores = [];
        const processingTimes = [];
        const loanAmounts = [];

        applications.forEach(app => {
            // Status counts
            const status = app.application_info.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            // Stage counts
            const stage = app.application_info.current_stage;
            stageCounts[stage] = (stageCounts[stage] || 0) + 1;

            // CIBIL scores
            if (app.third_party_data?.cibil_data?.score) {
                cibilScores.push(app.third_party_data.cibil_data.score);
            }

            // Processing times
            const processingTime = this.calculateProcessingTime(
                app.application_info.created_at,
                app.application_info.last_updated
            );
            if (processingTime > 0) {
                processingTimes.push(processingTime);
            }

            // Loan amounts
            if (app.stage_1_data?.loan_request?.loan_amount) {
                loanAmounts.push(app.stage_1_data.loan_request.loan_amount);
            }
        });

        return {
            overview: {
                total_applications: totalApplications,
                pending_applications: statusCounts.pending || 0,
                approved_applications: statusCounts.approved || 0,
                rejected_applications: statusCounts.rejected || 0,
                conditional_approval: statusCounts.conditional_approval || 0
            },
            stage_distribution: stageCounts,
            cibil_analytics: {
                average_score: cibilScores.length > 0 ? (cibilScores.reduce((a, b) => a + b, 0) / cibilScores.length).toFixed(2) : 0,
                score_distribution: this.getScoreDistribution(cibilScores),
                total_with_cibil: cibilScores.length
            },
            processing_metrics: {
                average_processing_time: processingTimes.length > 0 ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(2) : 0,
                fastest_processing: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
                slowest_processing: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
            },
            loan_analytics: {
                total_loan_amount: loanAmounts.reduce((a, b) => a + b, 0),
                average_loan_amount: loanAmounts.length > 0 ? (loanAmounts.reduce((a, b) => a + b, 0) / loanAmounts.length).toFixed(2) : 0,
                loan_amount_distribution: this.getLoanAmountDistribution(loanAmounts)
            }
        };
    }

    /**
     * Calculate LMS Dashboard Metrics
     */
    calculateLMSMetrics(applications) {
        const approvedApplications = applications.filter(app => 
            app.application_info.status === 'approved' || app.application_info.status === 'conditional_approval'
        );

        const totalPortfolioValue = approvedApplications.reduce((total, app) => {
            return total + (app.stage_1_data?.loan_request?.loan_amount || 0);
        }, 0);

        const activeLoans = approvedApplications.length;
        const disbursedAmount = totalPortfolioValue * 0.85; // Assuming 85% disbursal rate
        const pendingAmount = totalPortfolioValue - disbursedAmount;

        // Calculate revenue metrics
        const processingFees = approvedApplications.reduce((total, app) => {
            const loanAmount = app.stage_1_data?.loan_request?.loan_amount || 0;
            const processingFeeRate = app.stage_2_data?.application_result?.recommended_terms?.fees?.processing_fee_percentage || 1;
            return total + (loanAmount * processingFeeRate / 100);
        }, 0);

        const interestRevenue = disbursedAmount * 0.12 / 12; // Assuming 12% annual interest

        return {
            portfolio_overview: {
                total_portfolio_value: totalPortfolioValue,
                active_loans: activeLoans,
                disbursed_amount: disbursedAmount,
                pending_amount: pendingAmount,
                average_loan_size: activeLoans > 0 ? (totalPortfolioValue / activeLoans).toFixed(2) : 0
            },
            performance_metrics: {
                emi_collection_rate: 95.5, // Mock data
                overdue_loans: Math.floor(activeLoans * 0.05), // 5% overdue
                npa_percentage: 2.3, // Mock data
                average_emi_amount: activeLoans > 0 ? (disbursedAmount / activeLoans / 36).toFixed(2) : 0 // Assuming 36 months
            },
            customer_analytics: {
                total_borrowers: activeLoans,
                new_borrowers_this_month: Math.floor(activeLoans * 0.1), // Mock data
                repeat_borrowers: Math.floor(activeLoans * 0.15), // Mock data
                customer_satisfaction_score: 4.2 // Mock data
            },
            financial_analytics: {
                total_interest_earned: interestRevenue,
                processing_fees_collected: processingFees,
                total_revenue: interestRevenue + processingFees,
                revenue_growth_rate: 12.5 // Mock data
            }
        };
    }

    /**
     * Calculate processing time in hours
     */
    calculateProcessingTime(createdAt, updatedAt) {
        const created = new Date(createdAt);
        const updated = new Date(updatedAt);
        return (updated - created) / (1000 * 60 * 60); // Convert to hours
    }

    /**
     * Get CIBIL score distribution
     */
    getScoreDistribution(scores) {
        const distribution = {
            '300-500': 0,
            '501-700': 0,
            '701-800': 0,
            '801-900': 0
        };

        scores.forEach(score => {
            if (score >= 300 && score <= 500) distribution['300-500']++;
            else if (score >= 501 && score <= 700) distribution['501-700']++;
            else if (score >= 701 && score <= 800) distribution['701-800']++;
            else if (score >= 801 && score <= 900) distribution['801-900']++;
        });

        return distribution;
    }

    /**
     * Get loan amount distribution
     */
    getLoanAmountDistribution(amounts) {
        const distribution = {
            '0-2L': 0,
            '2L-5L': 0,
            '5L-10L': 0,
            '10L+': 0
        };

        amounts.forEach(amount => {
            if (amount <= 200000) distribution['0-2L']++;
            else if (amount <= 500000) distribution['2L-5L']++;
            else if (amount <= 1000000) distribution['5L-10L']++;
            else distribution['10L+']++;
        });

        return distribution;
    }

    /**
     * Get applications trend data
     */
    getApplicationsTrend(applications, period) {
        const now = new Date();
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const trendData = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayApplications = applications.filter(app => {
                const appDate = new Date(app.application_info.created_at).toISOString().split('T')[0];
                return appDate === dateStr;
            });

            trendData.push({
                date: dateStr,
                applications: dayApplications.length,
                approved: dayApplications.filter(app => app.application_info.status === 'approved').length,
                rejected: dayApplications.filter(app => app.application_info.status === 'rejected').length
            });
        }

        return trendData;
    }

    /**
     * Get CIBIL distribution analytics
     */
    getCIBILDistribution(applications) {
        const cibilScores = applications
            .map(app => app.third_party_data?.cibil_data?.score)
            .filter(score => score && score > 0);

        return {
            average_score: cibilScores.length > 0 ? (cibilScores.reduce((a, b) => a + b, 0) / cibilScores.length).toFixed(2) : 0,
            distribution: this.getScoreDistribution(cibilScores),
            total_applications_with_cibil: cibilScores.length,
            score_ranges: {
                excellent: cibilScores.filter(score => score >= 750).length,
                good: cibilScores.filter(score => score >= 650 && score < 750).length,
                fair: cibilScores.filter(score => score >= 550 && score < 650).length,
                poor: cibilScores.filter(score => score < 550).length
            }
        };
    }

    /**
     * Get processing time analytics
     */
    getProcessingTimeAnalytics(applications) {
        const processingTimes = applications
            .map(app => this.calculateProcessingTime(app.application_info.created_at, app.application_info.last_updated))
            .filter(time => time > 0);

        return {
            average_time: processingTimes.length > 0 ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(2) : 0,
            fastest: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
            slowest: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
            time_distribution: {
                '0-2h': processingTimes.filter(time => time <= 2).length,
                '2-6h': processingTimes.filter(time => time > 2 && time <= 6).length,
                '6-24h': processingTimes.filter(time => time > 6 && time <= 24).length,
                '24h+': processingTimes.filter(time => time > 24).length
            }
        };
    }

    /**
     * Get revenue analytics
     */
    getRevenueAnalytics(applications) {
        const approvedApplications = applications.filter(app => 
            app.application_info.status === 'approved' || app.application_info.status === 'conditional_approval'
        );

        const totalLoanAmount = approvedApplications.reduce((total, app) => {
            return total + (app.stage_1_data?.loan_request?.loan_amount || 0);
        }, 0);

        const processingFees = approvedApplications.reduce((total, app) => {
            const loanAmount = app.stage_1_data?.loan_request?.loan_amount || 0;
            const processingFeeRate = app.stage_2_data?.application_result?.recommended_terms?.fees?.processing_fee_percentage || 1;
            return total + (loanAmount * processingFeeRate / 100);
        }, 0);

        return {
            total_loan_amount: totalLoanAmount,
            processing_fees: processingFees,
            estimated_interest_revenue: totalLoanAmount * 0.12 / 12, // 12% annual interest
            revenue_per_application: approvedApplications.length > 0 ? (processingFees / approvedApplications.length).toFixed(2) : 0
        };
    }

    /**
     * Get activity type based on status and stage
     */
    getActivityType(status, stage) {
        switch (status) {
            case 'approved':
                return 'approval';
            case 'rejected':
                return 'rejection';
            case 'conditional_approval':
                return 'conditional_approval';
            case 'pending':
                return stage === 'pre-qualification' ? 'pre_qualification' : 'application_review';
            default:
                return 'application_update';
        }
    }

    /**
     * Get activity description based on status and stage
     */
    getActivityDescription(status, stage) {
        switch (status) {
            case 'approved':
                return 'Application approved successfully';
            case 'rejected':
                return 'Application rejected';
            case 'conditional_approval':
                return 'Application approved with conditions';
            case 'pending':
                return stage === 'pre-qualification' ? 'Pre-qualification in progress' : 'Application under review';
            default:
                return 'Application status updated';
        }
    }

    /**
     * Get disbursement trend data
     */
    getDisbursementTrendData(approvedApplications, period) {
        try {
            const now = new Date();
            const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
            const trendData = [];

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayApplications = approvedApplications.filter(app => {
                    try {
                        const appDate = new Date(app.application_info.last_updated).toISOString().split('T')[0];
                        return appDate === dateStr;
                    } catch (error) {
                        logger.warn(`Error parsing date for application ${app.application_info.application_number}: ${error.message}`);
                        return false;
                    }
                });

                const totalDisbursed = dayApplications.reduce((total, app) => {
                    return total + (app.stage_1_data?.loan_request?.loan_amount || 0);
                }, 0);

                trendData.push({
                    date: dateStr,
                    applications: dayApplications.length,
                    amount_disbursed: totalDisbursed,
                    average_disbursement: dayApplications.length > 0 ? (totalDisbursed / dayApplications.length) : 0
                });
            }

            return trendData;
        } catch (error) {
            logger.error('Error in getDisbursementTrendData:', error);
            throw new Error(`Invalid time value: ${error.message}`);
        }
    }

    /**
     * Calculate risk distribution based on CIBIL scores
     */
    calculateRiskDistribution(applications) {
        const cibilScores = applications
            .map(app => app.third_party_data?.cibil_data?.score)
            .filter(score => score && score > 0);

        const riskDistribution = {
            low_risk: 0,    // 750+
            medium_risk: 0, // 650-749
            high_risk: 0,   // 550-649
            very_high_risk: 0 // <550
        };

        cibilScores.forEach(score => {
            if (score >= 750) riskDistribution.low_risk++;
            else if (score >= 650) riskDistribution.medium_risk++;
            else if (score >= 550) riskDistribution.high_risk++;
            else riskDistribution.very_high_risk++;
        });

        return {
            ...riskDistribution,
            total_applications: cibilScores.length,
            average_score: cibilScores.length > 0 ? (cibilScores.reduce((a, b) => a + b, 0) / cibilScores.length).toFixed(2) : 0
        };
    }
}

const dashboardController = new DashboardController();
module.exports = dashboardController;
