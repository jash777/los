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
            
            // Get basic metrics
            const [metricsResult] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN status = 'conditional_approval' THEN 1 END) as conditional_approval_applications,
                    COUNT(CASE WHEN current_stage = 'pre_qualification' THEN 1 END) as pre_qualification_count,
                    COUNT(CASE WHEN current_stage = 'loan_application' THEN 1 END) as loan_application_count
                FROM applications
            `);

            // Get recent applications
            const [recentApps] = await connection.execute(`
                SELECT 
                    a.application_number,
                    a.current_stage,
                    a.status,
                    a.created_at,
                    a.last_updated,
                    s1.full_name,
                    s1.loan_amount,
                    s1.loan_purpose
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
                ORDER BY a.created_at DESC
                LIMIT 10
            `);

            // Get status distribution
            const [statusDistribution] = await connection.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM applications
                GROUP BY status
                ORDER BY count DESC
            `);

            connection.release();

            const overview = {
                metrics: {
                    total_applications: metricsResult[0].total_applications,
                    pending_applications: metricsResult[0].pending_applications,
                    approved_applications: metricsResult[0].approved_applications,
                    rejected_applications: metricsResult[0].rejected_applications,
                    conditional_approval_applications: metricsResult[0].conditional_approval_applications,
                    pre_qualification_count: metricsResult[0].pre_qualification_count,
                    loan_application_count: metricsResult[0].loan_application_count
                },
                recent_applications: recentApps.map(app => ({
                    application_number: app.application_number,
                    current_stage: app.current_stage,
                    status: app.status,
                    created_at: app.created_at,
                    last_updated: app.last_updated,
                    applicant_name: app.full_name,
                    loan_amount: app.loan_amount,
                    loan_purpose: app.loan_purpose
                })),
                status_distribution: statusDistribution.map(item => ({
                    status: item.status,
                    count: item.count
                }))
            };

            res.json({
                success: true,
                data: {
                    overview
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
            
            // Simple query without pagination for now
            const [applications] = await connection.execute(`
                SELECT 
                    a.id,
                    a.application_number,
                    a.current_stage,
                    a.status,
                    a.created_at,
                    a.last_updated,
                    a.source_channel,
                    a.priority_level,
                    s1.full_name,
                    s1.mobile,
                    s1.email,
                    s1.pan_number,
                    s1.loan_amount,
                    s1.loan_purpose,
                    s1.preferred_tenure_months,
                    s1.eligibility_status,
                    s1.eligibility_score,
                    s1.eligibility_decision
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
                ORDER BY a.created_at DESC
                LIMIT 10
            `);

            // Get total count
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
            `);

            connection.release();

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    applications: applications.map(app => ({
                        id: app.id,
                        application_number: app.application_number,
                        current_stage: app.current_stage,
                        status: app.status,
                        created_at: app.created_at,
                        last_updated: app.last_updated,
                        source_channel: app.source_channel,
                        priority_level: app.priority_level,
                        applicant: {
                            full_name: app.full_name,
                            mobile: app.mobile,
                            email: app.email,
                            pan_number: app.pan_number
                        },
                        loan_details: {
                            amount: app.loan_amount,
                            purpose: app.loan_purpose,
                            tenure_months: app.preferred_tenure_months
                        },
                        eligibility: {
                            status: app.eligibility_status,
                            score: app.eligibility_score,
                            decision: app.eligibility_decision
                        }
                    })),
                    pagination: {
                        current_page: 1,
                        total_pages: 1,
                        total: total,
                        limit: 10,
                        has_next: false,
                        has_prev: false
                    }
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
            
            // Get application details
            const [applications] = await connection.execute(`
                SELECT 
                    a.*,
                    s1.*
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
                WHERE a.application_number = ?
            `, [applicationNumber]);

            if (applications.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const app = applications[0];

            // Get audit logs
            const [auditLogs] = await connection.execute(`
                SELECT * FROM audit_logs 
                WHERE application_number = ? 
                ORDER BY created_at DESC
                LIMIT 20
            `, [applicationNumber]);

            connection.release();

            const applicationDetails = {
                id: app.id,
                application_number: app.application_number,
                current_stage: app.current_stage,
                status: app.status,
                created_at: app.created_at,
                last_updated: app.last_updated,
                source_channel: app.source_channel,
                priority_level: app.priority_level,
                applicant: {
                    full_name: app.full_name,
                    mobile: app.mobile,
                    email: app.email,
                    pan_number: app.pan_number,
                    date_of_birth: app.date_of_birth
                },
                loan_details: {
                    amount: app.loan_amount,
                    purpose: app.loan_purpose,
                    tenure_months: app.preferred_tenure_months
                },
                eligibility: {
                    status: app.eligibility_status,
                    score: app.eligibility_score,
                    decision: app.eligibility_decision,
                    reasons: app.eligibility_reasons ? JSON.parse(app.eligibility_reasons) : []
                },
                audit_logs: auditLogs.map(log => ({
                    action: log.action,
                    stage: log.stage,
                    user_id: log.user_id,
                    created_at: log.created_at,
                    request_data: log.request_data ? JSON.parse(log.request_data) : {},
                    response_data: log.response_data ? JSON.parse(log.response_data) : {}
                }))
            };

            res.json({
                success: true,
                data: {
                    application: applicationDetails
                }
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

    // LMS Overview
    getLMSOverview = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();
            
            // Get loan metrics
            const [loanMetrics] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_loans,
                    SUM(loan_amount) as total_loan_amount,
                    AVG(loan_amount) as avg_loan_amount,
                    COUNT(CASE WHEN eligibility_status = 'approved' THEN 1 END) as approved_loans,
                    COUNT(CASE WHEN eligibility_status = 'rejected' THEN 1 END) as rejected_loans
                FROM stage_1_data
            `);

            // Get loan purpose distribution
            const [purposeDistribution] = await connection.execute(`
                SELECT 
                    loan_purpose,
                    COUNT(*) as count,
                    SUM(loan_amount) as total_amount
                FROM stage_1_data
                GROUP BY loan_purpose
                ORDER BY count DESC
            `);

            connection.release();

            const overview = {
                metrics: {
                    total_loans: loanMetrics[0].total_loans,
                    total_loan_amount: loanMetrics[0].total_loan_amount,
                    avg_loan_amount: loanMetrics[0].avg_loan_amount,
                    approved_loans: loanMetrics[0].approved_loans,
                    rejected_loans: loanMetrics[0].rejected_loans
                },
                purpose_distribution: purposeDistribution.map(item => ({
                    purpose: item.loan_purpose,
                    count: item.count,
                    total_amount: item.total_amount
                }))
            };

            res.json({
                success: true,
                data: {
                    overview
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

    // Legacy dashboard endpoints for backward compatibility
    getRecentActivities = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const { limit = 10 } = req.query;

            const connection = await this.pool.getConnection();
            
            const [activities] = await connection.execute(`
                SELECT 
                    a.application_number,
                    a.current_stage,
                    a.status,
                    a.created_at,
                    a.last_updated,
                    s1.full_name,
                    s1.loan_amount
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
                ORDER BY a.last_updated DESC
                LIMIT ?
            `, [parseInt(limit)]);

            connection.release();

            const recentActivities = activities.map(activity => ({
                application_number: activity.application_number,
                activity_type: this.getActivityType(activity.current_stage),
                activity_description: this.getActivityDescription(activity.current_stage, activity.status),
                timestamp: activity.last_updated,
                applicant_name: activity.full_name,
                loan_amount: activity.loan_amount
            }));

            res.json({
                success: true,
                data: {
                    activities: recentActivities
                }
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

    getDashboardStats = async (req, res) => {
        try {
            if (!this.pool) {
                await this.initialize();
            }

            const connection = await this.pool.getConnection();
            
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'conditional_approval' THEN 1 END) as conditional_approval,
                    SUM(s1.loan_amount) as total_loan_amount,
                    AVG(s1.loan_amount) as avg_loan_amount
                FROM applications a
                LEFT JOIN stage_1_data s1 ON a.id = s1.application_id
            `);

            connection.release();

            res.json({
                success: true,
                data: {
                    stats: {
                        total_applications: stats[0].total_applications,
                        pending: stats[0].pending,
                        approved: stats[0].approved,
                        rejected: stats[0].rejected,
                        conditional_approval: stats[0].conditional_approval,
                        total_loan_amount: stats[0].total_loan_amount,
                        avg_loan_amount: stats[0].avg_loan_amount
                    }
                }
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

    // Helper methods
    getActivityType = (stage) => {
        const stageMapping = {
            'pre_qualification': 'Pre-qualification',
            'loan_application': 'Loan Application',
            'application_processing': 'Application Processing',
            'underwriting': 'Underwriting',
            'credit_decision': 'Credit Decision',
            'quality_check': 'Quality Check',
            'loan_funding': 'Loan Funding'
        };
        return stageMapping[stage] || 'Unknown';
    };

    getActivityDescription = (stage, status) => {
        if (stage === 'pre_qualification') {
            return `Pre-qualification ${status}`;
        } else if (stage === 'loan_application') {
            return `Loan application ${status}`;
        }
        return `${stage} ${status}`;
    };
}

const dashboardController = new DashboardController();
module.exports = dashboardController;
