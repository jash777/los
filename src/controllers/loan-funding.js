/**
 * Loan Funding Controller (Stage 7)
 */

const LoanFundingService = require('../services/loan-funding');
const logger = require('../utils/logger');

class LoanFundingController {
    constructor() {
        this.loanFundingService = new LoanFundingService();
    }

    /**
     * Process loan funding (Stage 7)
     */
    async processLoanFunding(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
        
        try {
            const { applicationNumber } = req.params;

            logger.info(`[${requestId}] Processing loan funding: ${applicationNumber}`);

            // Validate required fields
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    requestId
                });
            }

            // Process loan funding
            const result = await this.loanFundingService.processLoanFunding(applicationNumber, requestId);

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
            logger.error(`[${requestId}] Loan funding controller error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during loan funding',
                message: error.message,
                requestId
            });
        }
    }

    /**
     * Get loan funding status
     */
    async getLoanFundingStatus(req, res) {
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

            const status = await this.loanFundingService.getLoanFundingStatus(applicationNumber);

            res.status(200).json({
                success: true,
                applicationNumber,
                status,
                requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Get loan funding status error:`, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
                requestId
            });
        }
    }
}

module.exports = LoanFundingController;