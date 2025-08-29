/**
 * Underwriting Controller (Stage 3)
 */

const UnderwritingService = require('../services/underwriting');
const logger = require('../utils/logger');

class UnderwritingController {
    constructor() {
        this.underwritingService = new UnderwritingService();
    }

    /**
     * Process underwriting (Stage 3)
     */
    async processUnderwriting(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            logger.info(`[${requestId}] Processing underwriting: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Process underwriting
            const result = await this.underwritingService.processUnderwriting(applicationNumber, requestId);

            // Return response based on result
            // Both approvals and rejections are successful processing outcomes
            if (result.success || result.status === 'rejected') {
                res.status(200).json({
                    ...result,
                    requestId
                });
            } else {
                // Only return 400 for actual system errors
                res.status(400).json({
                    ...result,
                    requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Underwriting controller error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during underwriting',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get underwriting status
     */
    async getUnderwritingStatus(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            const status = await this.underwritingService.getUnderwritingStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get underwriting status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get comprehensive underwriting dashboard data
     */
    async getUnderwritingDashboardData(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            logger.info(`[${requestId}] Getting underwriting dashboard data: ${applicationNumber}`);

            const dashboardData = await this.underwritingService.getUnderwritingDashboardData(applicationNumber, requestId);

            if (dashboardData.success) {
                res.status(200).json({
                    success: true,
                    data: dashboardData.data,
                    requestId
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: dashboardData.error || 'Application not found',
                    requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Get underwriting dashboard data error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Manual underwriting decision (Approve/Reject/Review)
     */
    async makeManualDecision(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;
            const { decision, comments, reviewer, conditions } = req.body;

            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            if (!decision || !['approve', 'reject', 'review'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid decision is required (approve, reject, review)',
                    requestId
                });
            }

            if (!reviewer) {
                return res.status(400).json({
                    success: false,
                    error: 'Reviewer information is required',
                    requestId
                });
            }

            logger.info(`[${requestId}] Manual underwriting decision: ${applicationNumber} - ${decision}`);

            const result = await this.underwritingService.makeManualUnderwritingDecision(
                applicationNumber, 
                {
                    decision,
                    comments: comments || '',
                    reviewer,
                    conditions: conditions || [],
                    requestId
                }
            );

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    message: `Underwriting ${decision} decision recorded successfully`,
                    requestId
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Manual underwriting decision error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get applications pending underwriting review
     */
    async getPendingApplications(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { limit = 20, offset = 0, priority, assignedTo } = req.query;

            logger.info(`[${requestId}] Getting pending underwriting applications`);

            const result = await this.underwritingService.getPendingUnderwritingApplications({
                limit: parseInt(limit),
                offset: parseInt(offset),
                priority,
                assignedTo,
                requestId
            });

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get pending applications error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = UnderwritingController;