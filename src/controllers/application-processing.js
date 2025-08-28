/**
 * Application Processing Controller (Stage 2)
 */

const ApplicationProcessingService = require('../services/application-processing');
const logger = require('../utils/logger');

class ApplicationProcessingController {
    constructor() {
        this.applicationProcessingService = new ApplicationProcessingService();
    }

    /**
     * Process loan application (Stage 2)
     */
    async processApplication(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;
            const applicationData = req.body;

            logger.info(`[${requestId}] Processing application: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Process the application
            const result = await this.applicationProcessingService.processApplication(
                applicationNumber, 
                applicationData, 
                requestId
            );

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
            logger.error(`[${requestId}] Application processing controller error:`, {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            res.status(500).json({
                success: false,
                error: 'Internal server error during application processing',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get application processing status
     */
    async getProcessingStatus(req, res) {
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

            const status = await this.applicationProcessingService.getProcessingStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get processing status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = ApplicationProcessingController;