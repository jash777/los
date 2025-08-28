/**
 * Credit Decision Controller (Stage 4)
 */

const CreditDecisionService = require('../services/credit-decision');
const logger = require('../utils/logger');

class CreditDecisionController {
    constructor() {
        this.creditDecisionService = new CreditDecisionService();
    }

    /**
     * Process credit decision (Stage 4)
     */
    async processCreditDecision(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            logger.info(`[${requestId}] Processing credit decision: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Process credit decision
            const result = await this.creditDecisionService.processCreditDecision(applicationNumber, requestId);

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
            logger.error(`[${requestId}] Credit decision controller error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during credit decision',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get credit decision status
     */
    async getCreditDecisionStatus(req, res) {
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

            const status = await this.creditDecisionService.getCreditDecisionStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get credit decision status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = CreditDecisionController;