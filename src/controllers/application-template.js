const ApplicationTemplateService = require('../services/application-template');
const logger = require('../utils/logger');

class ApplicationTemplateController {
    constructor() {
        this.templateService = new ApplicationTemplateService();
    }

    // Create new application folder and template
    async createApplication(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            logger.info(`[${requestId}] Creating new application template`);
            
            const { applicationNumber } = req.body;
            
            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Application number is required',
                    request_id: requestId
                });
            }
            
            const result = await this.templateService.createApplicationFolder(applicationNumber);
            
            logger.info(`[${requestId}] Application template created successfully: ${applicationNumber}`);
            
            res.status(201).json({
                success: true,
                message: 'Application template created successfully',
                data: result,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error creating application template:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create application template',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Update application with Stage 1 data
    async updateStage1Data(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            const stage1Data = req.body;
            
            logger.info(`[${requestId}] Updating Stage 1 data for application: ${applicationNumber}`);
            
            const updatedTemplate = await this.templateService.updateWithStage1Data(applicationNumber, stage1Data);
            
            logger.info(`[${requestId}] Stage 1 data updated successfully`);
            
            res.status(200).json({
                success: true,
                message: 'Stage 1 data updated successfully',
                data: updatedTemplate,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error updating Stage 1 data:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update Stage 1 data',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Update application with Stage 2 data
    async updateStage2Data(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            const stage2Data = req.body;
            
            logger.info(`[${requestId}] Updating Stage 2 data for application: ${applicationNumber}`);
            
            const updatedTemplate = await this.templateService.updateWithStage2Data(applicationNumber, stage2Data);
            
            logger.info(`[${requestId}] Stage 2 data updated successfully`);
            
            res.status(200).json({
                success: true,
                message: 'Stage 2 data updated successfully',
                data: updatedTemplate,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error updating Stage 2 data:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update Stage 2 data',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Update application with third-party data
    async updateThirdPartyData(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            const thirdPartyData = req.body;
            
            logger.info(`[${requestId}] Updating third-party data for application: ${applicationNumber}`);
            
            const updatedTemplate = await this.templateService.updateWithThirdPartyData(applicationNumber, thirdPartyData);
            
            logger.info(`[${requestId}] Third-party data updated successfully`);
            
            res.status(200).json({
                success: true,
                message: 'Third-party data updated successfully',
                data: updatedTemplate,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error updating third-party data:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update third-party data',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Update processing stage
    async updateProcessingStage(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber, stageName } = req.params;
            const stageData = req.body;
            
            logger.info(`[${requestId}] Updating processing stage ${stageName} for application: ${applicationNumber}`);
            
            const updatedTemplate = await this.templateService.updateProcessingStage(applicationNumber, stageName, stageData);
            
            logger.info(`[${requestId}] Processing stage updated successfully`);
            
            res.status(200).json({
                success: true,
                message: `Processing stage ${stageName} updated successfully`,
                data: updatedTemplate,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error updating processing stage:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to update processing stage',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Get application data
    async getApplicationData(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            
            logger.info(`[${requestId}] Retrieving application data: ${applicationNumber}`);
            
            const applicationData = await this.templateService.getApplicationData(applicationNumber);
            
            res.status(200).json({
                success: true,
                data: applicationData,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error retrieving application data:`, error);
            
            res.status(404).json({
                success: false,
                error: 'Application not found',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Get application summary
    async getApplicationSummary(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            
            logger.info(`[${requestId}] Generating application summary: ${applicationNumber}`);
            
            const summary = await this.templateService.generateApplicationSummary(applicationNumber);
            
            res.status(200).json({
                success: true,
                data: summary,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error generating application summary:`, error);
            
            res.status(404).json({
                success: false,
                error: 'Application not found',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // List all applications
    async listApplications(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            logger.info(`[${requestId}] Listing all applications`);
            
            const applications = await this.templateService.listApplications();
            
            res.status(200).json({
                success: true,
                data: applications,
                count: applications.length,
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error listing applications:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to list applications',
                details: error.message,
                request_id: requestId
            });
        }
    }

    // Save document to application folder
    async saveDocument(req, res) {
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const { applicationNumber } = req.params;
            const { documentType, filename } = req.body;
            const documentData = req.file ? req.file.buffer : req.body.documentData;
            
            if (!documentData) {
                return res.status(400).json({
                    success: false,
                    error: 'Document data is required',
                    request_id: requestId
                });
            }
            
            logger.info(`[${requestId}] Saving document for application: ${applicationNumber}`);
            
            const filePath = await this.templateService.saveDocument(
                applicationNumber,
                documentType,
                documentData,
                filename
            );
            
            logger.info(`[${requestId}] Document saved successfully`);
            
            res.status(200).json({
                success: true,
                message: 'Document saved successfully',
                data: { filePath },
                request_id: requestId
            });
            
        } catch (error) {
            logger.error(`[${requestId}] Error saving document:`, error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to save document',
                details: error.message,
                request_id: requestId
            });
        }
    }
}

module.exports = ApplicationTemplateController;