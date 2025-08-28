/**
 * Dashboard Controller
 * Handles dashboard data for LOS and LMS systems
 * Updated to use correct database tables (loan_applications instead of applications)
 */

const databaseConfig = require('../config/database');
const logger = require('../utils/logger');

class DashboardController {
    constructor() {
        this.pool = null;
        this.initialize();
    }

    async initialize() {
        try {
            await databaseConfig.initialize();
            this.pool = databaseConfig.getPool();
            logger.info('Dashboard controller initialized with database connection');
        } catch (error) {
            logger.error('Failed to initialize dashboard controller:', error);
        }
    }

    // Health check endpoint
    healthCheck = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();

            res.json({
                success: true,
                message: 'Dashboard service is healthy',
                timestamp: new Date().toISOString(),
                database: 'connected'
            });
        } catch (error) {
            logger.error('Health check failed:', error);
            res.status(500).json({
                success: false,
                message: 'Dashboard service is unhealthy',
                error: error.message
            });
        }
    };

    // LOS Overview
    getLOSOverview = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();
            
            // Get basic metrics from loan_applications table
            const [metricsResult] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN status = 'conditional_approval' THEN 1 END) as conditional_approval_applications,
                    COUNT(CASE WHEN current_stage = 'pre_qualification' THEN 1 END) as pre_qualification_count,
                    COUNT(CASE WHEN current_stage = 'application_processing' THEN 1 END) as loan_application_count
                FROM loan_applications
            `);

            // Get recent applications from loan_applications table
            const [recentApps] = await connection.execute(`
                SELECT 
                    application_number,
                    applicant_name,
                    email,
                    phone,
                    pan_number,
                    loan_amount,
                    loan_purpose,
                    employment_type,
                    monthly_income,
                    current_stage,
                    status,
                    created_at,
                    updated_at
                FROM loan_applications
                ORDER BY created_at DESC
                LIMIT 10
            `);

            // Get status distribution
            const [statusDistribution] = await connection.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM loan_applications
                GROUP BY status
                ORDER BY count DESC
            `);

            // Get stage distribution
            const [stageDistribution] = await connection.execute(`
                SELECT 
                    current_stage,
                    COUNT(*) as count
                FROM loan_applications
                GROUP BY current_stage
                ORDER BY count DESC
            `);

            // Get recent credit decisions
            const [recentDecisions] = await connection.execute(`
                SELECT 
                    application_number,
                    decision,
                    approved_amount,
                    interest_rate,
                    risk_score,
                    decided_at
                FROM credit_decisions
                ORDER BY decided_at DESC
                LIMIT 5
            `);

            connection.release();

            const overview = {
                metrics: {
                    total_applications: metricsResult[0].total_applications || 0,
                    pending_applications: metricsResult[0].pending_applications || 0,
                    approved_applications: metricsResult[0].approved_applications || 0,
                    rejected_applications: metricsResult[0].rejected_applications || 0,
                    conditional_approval_applications: metricsResult[0].conditional_approval_applications || 0,
                    pre_qualification_count: metricsResult[0].pre_qualification_count || 0,
                    loan_application_count: metricsResult[0].loan_application_count || 0
                },
                recent_applications: recentApps.map(app => ({
                    application_number: app.application_number,
                    applicant_name: app.applicant_name,
                    email: app.email,
                    phone: app.phone,
                    pan_number: app.pan_number,
                    loan_amount: app.loan_amount,
                    loan_purpose: app.loan_purpose,
                    employment_type: app.employment_type,
                    monthly_income: app.monthly_income,
                    current_stage: app.current_stage,
                    status: app.status,
                    created_at: app.created_at,
                    updated_at: app.updated_at
                })),
                status_distribution: statusDistribution.map(item => ({
                    status: item.status,
                    count: item.count
                })),
                stage_distribution: stageDistribution.map(item => ({
                    stage: item.current_stage,
                    count: item.count
                })),
                recent_decisions: recentDecisions.map(decision => ({
                    application_number: decision.application_number,
                    decision: decision.decision,
                    approved_amount: decision.approved_amount,
                    interest_rate: decision.interest_rate,
                    risk_score: decision.risk_score,
                    decided_at: decision.decided_at
                }))
            };

            res.json({
                success: true,
                data: {
                    overview,
                    timestamp: new Date().toISOString(),
                    total_records: metricsResult[0].total_applications || 0
                }
            });

        } catch (error) {
            logger.error('Error getting LOS overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get LOS overview',
                error: error.message
            });
        }
    };

    // LOS Applications List
    getLOSApplications = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();
            
            // Get applications from loan_applications table with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            const [applications] = await connection.execute(`
                SELECT 
                    id,
                    application_number,
                    applicant_name,
                    email,
                    phone,
                    pan_number,
                    loan_amount,
                    loan_purpose,
                    employment_type,
                    monthly_income,
                    current_stage,
                    status,
                    created_at,
                    updated_at
                FROM loan_applications
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `);

            // Get total count
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM loan_applications
            `);

            // Get additional data from related tables
            const applicationNumbers = applications.map(app => app.application_number);
            let stageProcessingData = [];
            let creditDecisionsData = [];
            
            if (applicationNumbers.length > 0) {
                // Get stage processing data
                const [stageProcessing] = await connection.execute(`
                    SELECT 
                        application_number,
                        stage_name,
                        status,
                        started_at,
                        completed_at,
                        processing_time_ms
                    FROM stage_processing
                    WHERE application_number IN (${applicationNumbers.map(app => `'${app}'`).join(',')})
                    ORDER BY started_at DESC
                `);

                // Get credit decisions data
                const [creditDecisions] = await connection.execute(`
                    SELECT 
                        application_number,
                        decision,
                        approved_amount,
                        interest_rate,
                        risk_score,
                        decided_at
                    FROM credit_decisions
                    WHERE application_number IN (${applicationNumbers.map(app => `'${app}'`).join(',')})
                    ORDER BY decided_at DESC
                `);

                stageProcessingData = stageProcessing;
                creditDecisionsData = creditDecisions;
            }

            connection.release();

            const total = countResult[0].total;

            // Combine data
            const enrichedApplications = applications.map(app => {
                const stageData = stageProcessingData.find(sp => sp.application_number === app.application_number);
                const decisionData = creditDecisionsData.find(cd => cd.application_number === app.application_number);
                
                return {
                    id: app.id,
                    application_number: app.application_number,
                    applicant_name: app.applicant_name,
                    email: app.email,
                    phone: app.phone,
                    pan_number: app.pan_number,
                    loan_amount: app.loan_amount,
                    loan_purpose: app.loan_purpose,
                    employment_type: app.employment_type,
                    monthly_income: app.monthly_income,
                    current_stage: app.current_stage,
                    status: app.status,
                    created_at: app.created_at,
                    updated_at: app.updated_at,
                    stage_processing: stageData || null,
                    credit_decision: decisionData || null
                };
            });

            res.json({
                success: true,
                data: {
                    applications: enrichedApplications,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: Math.ceil(total / limit)
                    },
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error getting LOS applications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get LOS applications',
                error: error.message
            });
        }
    };

    // LOS Application Details
    getLOSApplicationDetails = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const { applicationNumber } = req.params;
            const connection = await this.pool.getConnection();

            // Get main application data
            const [applications] = await connection.execute(`
                SELECT *
                FROM loan_applications
                WHERE application_number = ?
            `, [applicationNumber]);

            if (applications.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const application = applications[0];

            // Get stage processing data
            const [stageProcessing] = await connection.execute(`
                SELECT *
                FROM stage_processing
                WHERE application_number = ?
                ORDER BY started_at DESC
            `, [applicationNumber]);

            // Get credit decisions
            const [creditDecisions] = await connection.execute(`
                SELECT *
                FROM credit_decisions
                WHERE application_number = ?
                ORDER BY decided_at DESC
            `, [applicationNumber]);

            // Get audit logs
            const [auditLogs] = await connection.execute(`
                SELECT *
                FROM audit_logs
                WHERE application_number = ?
                ORDER BY created_at DESC
                LIMIT 20
            `, [applicationNumber]);

            // Get external verifications
            const [verifications] = await connection.execute(`
                SELECT *
                FROM external_verifications
                WHERE application_number = ?
                ORDER BY created_at DESC
            `, [applicationNumber]);

            connection.release();

            const details = {
                application: {
                    id: application.id,
                    application_number: application.application_number,
                    applicant_name: application.applicant_name,
                    email: application.email,
                    phone: application.phone,
                    pan_number: application.pan_number,
                    aadhar_number: application.aadhar_number,
                    loan_amount: application.loan_amount,
                    loan_purpose: application.loan_purpose,
                    employment_type: application.employment_type,
                    monthly_income: application.monthly_income,
                    current_stage: application.current_stage,
                    status: application.status,
                    created_at: application.created_at,
                    updated_at: application.updated_at
                },
                stage_processing: stageProcessing,
                credit_decisions: creditDecisions,
                audit_logs: auditLogs,
                verifications: verifications
            };

            res.json({
                success: true,
                data: details,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting application details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get application details',
                error: error.message
            });
        }
    };

    // LMS Overview (for approved loans)
    getLMSOverview = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();

            // Get approved loans metrics
            const [metricsResult] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_approved_loans,
                    SUM(loan_amount) as total_disbursed_amount,
                    AVG(loan_amount) as average_loan_amount,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as active_loans
                FROM loan_applications
                WHERE status IN ('approved', 'conditional_approval')
            `);

            // Get recent approved loans
            const [recentLoans] = await connection.execute(`
                SELECT 
                    application_number,
                    applicant_name,
                    loan_amount,
                    loan_purpose,
                    employment_type,
                    monthly_income,
                    created_at,
                    status
                FROM loan_applications
                WHERE status IN ('approved', 'conditional_approval')
                ORDER BY created_at DESC
                LIMIT 10
            `);

            // Get loan purpose distribution
            const [purposeDistribution] = await connection.execute(`
                SELECT 
                    loan_purpose,
                    COUNT(*) as count,
                    SUM(loan_amount) as total_amount
                FROM loan_applications
                WHERE status IN ('approved', 'conditional_approval')
                GROUP BY loan_purpose
                ORDER BY count DESC
            `);

            connection.release();

            const overview = {
                metrics: {
                    total_approved_loans: metricsResult[0].total_approved_loans || 0,
                    total_disbursed_amount: metricsResult[0].total_disbursed_amount || 0,
                    average_loan_amount: metricsResult[0].average_loan_amount || 0,
                    active_loans: metricsResult[0].active_loans || 0
                },
                recent_loans: recentLoans,
                purpose_distribution: purposeDistribution
            };

            res.json({
                success: true,
                data: {
                    overview,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error getting LMS overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get LMS overview',
                error: error.message
            });
        }
    };

    // Recent Activities
    getRecentActivities = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();

            // Get recent audit logs
            const [recentLogs] = await connection.execute(`
                SELECT 
                    application_number,
                    action,
                    stage,
                    created_at
                FROM audit_logs
                ORDER BY created_at DESC
                LIMIT 20
            `);

            // Get recent stage processing updates
            const [recentStages] = await connection.execute(`
                SELECT 
                    application_number,
                    stage_name,
                    status,
                    started_at,
                    completed_at
                FROM stage_processing
                ORDER BY started_at DESC
                LIMIT 10
            `);

            connection.release();

            const activities = {
                audit_logs: recentLogs,
                stage_updates: recentStages,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: activities
            });

        } catch (error) {
            logger.error('Error getting recent activities:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recent activities',
                error: error.message
            });
        }
    };

    // Dashboard Stats
    getDashboardStats = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();

            // Get comprehensive stats
            const [statsResult] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'conditional_approval' THEN 1 END) as conditional,
                    SUM(loan_amount) as total_loan_amount,
                    AVG(loan_amount) as avg_loan_amount,
                    COUNT(CASE WHEN current_stage = 'pre_qualification' THEN 1 END) as stage1_count,
                    COUNT(CASE WHEN current_stage = 'application_processing' THEN 1 END) as stage2_count
                FROM loan_applications
            `);

            // Get daily application trends (last 7 days)
            const [dailyTrends] = await connection.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as applications,
                    SUM(loan_amount) as total_amount
                FROM loan_applications
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

            connection.release();

            const stats = {
                overview: {
                    total_applications: statsResult[0].total_applications || 0,
                    pending: statsResult[0].pending || 0,
                    approved: statsResult[0].approved || 0,
                    rejected: statsResult[0].rejected || 0,
                    conditional: statsResult[0].conditional || 0,
                    total_loan_amount: statsResult[0].total_loan_amount || 0,
                    avg_loan_amount: statsResult[0].avg_loan_amount || 0,
                    stage1_count: statsResult[0].stage1_count || 0,
                    stage2_count: statsResult[0].stage2_count || 0
                },
                daily_trends: dailyTrends,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Error getting dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard stats',
                error: error.message
            });
        }
    };
}

module.exports = new DashboardController();
