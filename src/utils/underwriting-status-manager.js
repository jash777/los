/**
 * Underwriting Status Management Utility
 * Helps manage application statuses for underwriting dashboard
 */

const databaseService = require('../database/service');
const logger = require('./logger');
const UnderwritingService = require('../services/underwriting');

class UnderwritingStatusManager {
    constructor() {
        this.underwritingService = new UnderwritingService();
    }

    /**
     * Move applications to underwriting stage
     * @param {Array} applicationNumbers - Array of application numbers to move
     * @param {string} status - Target status: 'pending', 'in_progress', 'under_review'
     */
    async moveToUnderwriting(applicationNumbers, status = 'pending') {
        const results = [];
        const requestId = `batch_${Date.now()}`;

        logger.info(`[${requestId}] Moving ${applicationNumbers.length} applications to underwriting with status: ${status}`);

        for (const applicationNumber of applicationNumbers) {
            try {
                // Get application details
                const application = await databaseService.getCompleteApplication(applicationNumber);
                if (!application) {
                    results.push({
                        applicationNumber,
                        success: false,
                        error: 'Application not found'
                    });
                    continue;
                }

                // Update application to underwriting stage
                await databaseService.updateApplicationStage(
                    application.id, 
                    'underwriting', 
                    status
                );

                results.push({
                    applicationNumber,
                    success: true,
                    oldStage: application.current_stage,
                    oldStatus: application.status,
                    newStage: 'underwriting',
                    newStatus: status
                });

                logger.info(`[${requestId}] Moved ${applicationNumber} to underwriting (${status})`);

            } catch (error) {
                logger.error(`[${requestId}] Error moving ${applicationNumber}:`, error);
                results.push({
                    applicationNumber,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Update underwriting status for applications already in underwriting
     * @param {Array} applicationNumbers - Array of application numbers
     * @param {string} status - Target status: 'approved', 'rejected', 'under_review', 'pending'
     * @param {Object} options - Additional options
     */
    async updateUnderwritingStatus(applicationNumbers, status, options = {}) {
        const results = [];
        const requestId = `batch_update_${Date.now()}`;
        const { reviewer = 'System Admin', comments = 'Batch status update' } = options;

        logger.info(`[${requestId}] Updating ${applicationNumbers.length} applications to status: ${status}`);

        for (const applicationNumber of applicationNumbers) {
            try {
                // Get application details
                const application = await databaseService.getCompleteApplication(applicationNumber);
                if (!application) {
                    results.push({
                        applicationNumber,
                        success: false,
                        error: 'Application not found'
                    });
                    continue;
                }

                // Ensure application is in underwriting stage
                if (application.current_stage !== 'underwriting') {
                    results.push({
                        applicationNumber,
                        success: false,
                        error: `Application not in underwriting stage (current: ${application.current_stage})`
                    });
                    continue;
                }

                let nextStage = 'underwriting';
                let finalStatus = status;

                // Determine next stage based on status
                if (status === 'approved') {
                    nextStage = 'credit_decision';
                    finalStatus = 'approved';
                } else if (status === 'rejected') {
                    nextStage = 'underwriting'; // Stay in underwriting
                    finalStatus = 'rejected';
                } else if (status === 'under_review') {
                    nextStage = 'underwriting'; // Stay in underwriting
                    finalStatus = 'under_review';
                }

                // Update application status
                await databaseService.updateApplicationStage(
                    application.id,
                    nextStage,
                    finalStatus,
                    {
                        decision: status,
                        reviewer,
                        comments,
                        updated_by: 'batch_update',
                        timestamp: new Date().toISOString()
                    }
                );

                results.push({
                    applicationNumber,
                    success: true,
                    oldStatus: application.status,
                    newStatus: finalStatus,
                    newStage: nextStage
                });

                logger.info(`[${requestId}] Updated ${applicationNumber} to ${finalStatus}`);

            } catch (error) {
                logger.error(`[${requestId}] Error updating ${applicationNumber}:`, error);
                results.push({
                    applicationNumber,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Get all applications by stage and status
     * @param {string} stage - Application stage
     * @param {string} status - Application status (optional)
     */
    async getApplicationsByStageAndStatus(stage, status = null) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();

            let query = `
                SELECT application_number, current_stage, status, 
                       applicant_name, loan_amount, created_at, updated_at
                FROM loan_applications 
                WHERE current_stage = ?
            `;
            const params = [stage];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC';

            const [applications] = await connection.execute(query, params);
            connection.release();

            return {
                success: true,
                count: applications.length,
                applications
            };

        } catch (error) {
            logger.error('Error getting applications by stage and status:', error);
            throw error;
        }
    }

    /**
     * Get underwriting statistics
     */
    async getUnderwritingStats() {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();

            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN current_stage = 'underwriting' THEN 1 END) as in_underwriting,
                    COUNT(CASE WHEN current_stage = 'underwriting' AND status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN current_stage = 'underwriting' AND status = 'under_review' THEN 1 END) as under_review,
                    COUNT(CASE WHEN current_stage = 'underwriting' AND status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN current_stage = 'underwriting' AND status = 'rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN current_stage = 'credit_decision' THEN 1 END) as moved_to_credit_decision
                FROM loan_applications
            `);

            connection.release();

            return {
                success: true,
                stats: stats[0]
            };

        } catch (error) {
            logger.error('Error getting underwriting stats:', error);
            throw error;
        }
    }

    /**
     * Batch process applications for underwriting demo
     * Creates a realistic distribution of statuses
     */
    async setupUnderwritingDemo() {
        try {
            // Get all available applications
            const allApps = await this.getApplicationsByStageAndStatus('pre_qualification');
            if (!allApps.success || allApps.applications.length === 0) {
                return {
                    success: false,
                    error: 'No applications found in pre_qualification stage'
                };
            }

            const applications = allApps.applications.map(app => app.application_number);
            const total = applications.length;

            // Calculate distribution
            const toUnderwriting = Math.min(10, Math.floor(total * 0.6)); // 60% to underwriting
            const toPending = Math.floor(toUnderwriting * 0.4); // 40% pending
            const toReview = Math.floor(toUnderwriting * 0.4); // 40% under review
            const toApproved = Math.floor(toUnderwriting * 0.15); // 15% approved
            const toRejected = toUnderwriting - toPending - toReview - toApproved; // Remaining rejected

            const results = {
                moved_to_underwriting: 0,
                set_to_pending: 0,
                set_to_review: 0,
                set_to_approved: 0,
                set_to_rejected: 0,
                errors: []
            };

            let index = 0;

            // Move applications to underwriting with pending status
            if (toPending > 0) {
                const pendingApps = applications.slice(index, index + toPending);
                const result = await this.moveToUnderwriting(pendingApps, 'pending');
                results.moved_to_underwriting += result.successful;
                results.set_to_pending = result.successful;
                index += toPending;
            }

            // Move applications to underwriting with under_review status
            if (toReview > 0) {
                const reviewApps = applications.slice(index, index + toReview);
                const result = await this.moveToUnderwriting(reviewApps, 'under_review');
                results.moved_to_underwriting += result.successful;
                results.set_to_review = result.successful;
                index += toReview;
            }

            // Move to underwriting then set to approved
            if (toApproved > 0) {
                const approvedApps = applications.slice(index, index + toApproved);
                await this.moveToUnderwriting(approvedApps, 'under_review');
                const result = await this.updateUnderwritingStatus(approvedApps, 'approved', {
                    reviewer: 'Demo Setup',
                    comments: 'Demo approved application'
                });
                results.moved_to_underwriting += toApproved;
                results.set_to_approved = result.successful;
                index += toApproved;
            }

            // Move to underwriting then set to rejected
            if (toRejected > 0) {
                const rejectedApps = applications.slice(index, index + toRejected);
                await this.moveToUnderwriting(rejectedApps, 'under_review');
                const result = await this.updateUnderwritingStatus(rejectedApps, 'rejected', {
                    reviewer: 'Demo Setup',
                    comments: 'Demo rejected application'
                });
                results.moved_to_underwriting += toRejected;
                results.set_to_rejected = result.successful;
            }

            return {
                success: true,
                message: 'Underwriting demo setup completed',
                results
            };

        } catch (error) {
            logger.error('Error setting up underwriting demo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = UnderwritingStatusManager;
