/**
 * Automated Workflow Controller
 * Handles API requests for automated processing of stages 3-7
 */

const AutomatedWorkflowService = require('../services/automated-workflow');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AutomatedWorkflowController {
    constructor() {
        this.automatedWorkflowService = new AutomatedWorkflowService();
    }

    /**
     * Start automated processing workflow
     */
    async startAutomatedProcessing(req, res) {
        const requestId = uuidv4();
        const { applicationNumber } = req.params;

        logger.info(`[${requestId}] Starting automated processing for application: ${applicationNumber}`);

        try {
            // Validate request
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    request_id: requestId
                });
            }

            // Start automated workflow
            const result = await this.automatedWorkflowService.startAutomatedProcessing(applicationNumber, requestId);

            // Return response based on workflow status
            if (result.workflow_status === 'approved') {
                logger.info(`[${requestId}] Automated processing completed successfully for ${applicationNumber}`);
                return res.status(200).json({
                    success: true,
                    message: 'Automated processing completed successfully',
                    data: result,
                    request_id: requestId
                });
            } else if (result.workflow_status === 'rejected') {
                logger.warn(`[${requestId}] Application ${applicationNumber} was rejected during automated processing`);
                return res.status(200).json({
                    success: true,
                    message: 'Application was rejected during automated processing',
                    data: result,
                    request_id: requestId
                });
            } else {
                logger.error(`[${requestId}] Automated processing failed for ${applicationNumber}`);
                return res.status(500).json({
                    success: false,
                    error: 'Automated processing failed',
                    data: result,
                    request_id: requestId
                });
            }

        } catch (error) {
            logger.error(`[${requestId}] Error in automated processing:`, error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error during automated processing',
                message: error.message,
                request_id: requestId
            });
        }
    }

    /**
     * Get workflow status
     */
    async getWorkflowStatus(req, res) {
        const requestId = uuidv4();
        const { applicationNumber } = req.params;

        logger.info(`[${requestId}] Getting workflow status for application: ${applicationNumber}`);

        try {
            // Validate request
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    request_id: requestId
                });
            }

            // Get workflow status
            const status = await this.automatedWorkflowService.getWorkflowStatus(applicationNumber, requestId);

            logger.info(`[${requestId}] Workflow status retrieved for ${applicationNumber}`);
            return res.status(200).json({
                success: true,
                message: 'Workflow status retrieved successfully',
                data: status,
                request_id: requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Error getting workflow status:`, error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error while getting workflow status',
                message: error.message,
                request_id: requestId
            });
        }
    }

    /**
     * Trigger automated processing after Stage 2 completion
     * This endpoint is called automatically when Stage 2 is approved
     */
    async triggerAfterStage2(req, res) {
        const requestId = uuidv4();
        const { applicationNumber } = req.body;

        logger.info(`[${requestId}] Triggering automated processing after Stage 2 for: ${applicationNumber}`);

        try {
            // Validate request
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    request_id: requestId
                });
            }

            // Start automated workflow asynchronously
            // We don't wait for completion as this could take several minutes
            this.automatedWorkflowService.startAutomatedProcessing(applicationNumber, requestId)
                .then(result => {
                    logger.info(`[${requestId}] Automated workflow completed for ${applicationNumber} with status: ${result.workflow_status}`);
                })
                .catch(error => {
                    logger.error(`[${requestId}] Automated workflow failed for ${applicationNumber}:`, error);
                });

            // Return immediate response
            return res.status(202).json({
                success: true,
                message: 'Automated processing has been initiated',
                data: {
                    application_number: applicationNumber,
                    status: 'processing_started',
                    estimated_completion: '15-20 minutes'
                },
                request_id: requestId
            });

        } catch (error) {
            logger.error(`[${requestId}] Error triggering automated processing:`, error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error while triggering automated processing',
                message: error.message,
                request_id: requestId
            });
        }
    }
}

module.exports = AutomatedWorkflowController;