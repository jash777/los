/**
 * Quality Check Controller (Stage 6)
 */

const QualityCheckService = require('../services/quality-check');
const logger = require('../utils/logger');

class QualityCheckController {
    constructor() {
        this.qualityCheckService = new QualityCheckService();
    }

    /**
     * Process quality check (Stage 6)
     */
    async processQualityCheck(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            logger.info(`[${requestId}] Processing quality check: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Process quality check
            const result = await this.qualityCheckService.processQualityCheck(applicationNumber, requestId);

            // Return response based on result
            if (result.success) {
                res.status(200).json({
                    ...result,
                    requestId
                });
            } else {
                res.status(400).json({
                    ...result,
                    requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Quality check controller error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during quality check',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get quality check status
     */
    async getQualityCheckStatus(req, res) {
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

            const status = await this.qualityCheckService.getQualityCheckStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get quality check status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = QualityCheckController;