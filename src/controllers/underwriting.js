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
}

module.exports = UnderwritingController;