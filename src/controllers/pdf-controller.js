/**
 * PDF Controller
 * API endpoints for generating and serving loan application PDFs
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const EnhancedPDFGeneratorService = require('../services/enhanced-pdf-generator');
const databaseService = require('../database/service');

class PDFController {
    constructor() {
        this.pdfGenerator = new EnhancedPDFGeneratorService();
        
        // Bind methods to preserve 'this' context
        this.generateApplicationPDF = this.generateApplicationPDF.bind(this);
        this.getApplicationPDF = this.getApplicationPDF.bind(this);
        this.downloadApplicationPDF = this.downloadApplicationPDF.bind(this);
        this.listApplicationPDFs = this.listApplicationPDFs.bind(this);
        this.regenerateApplicationPDF = this.regenerateApplicationPDF.bind(this);
    }

    /**
     * Generate PDF for a specific loan application
     * POST /api/pdf/generate/:applicationNumber
     */
    async generateApplicationPDF(req, res) {
        try {
            const { applicationNumber } = req.params;
            const requestId = req.headers['x-request-id'] || `pdf_gen_${Date.now()}`;
            
            logger.info(`[${requestId}] Generating PDF for application: ${applicationNumber}`);

            // Load application data
            const applicationDataPath = path.join(__dirname, `../../applications/${applicationNumber}/application-data.json`);
            
            let applicationData;
            try {
                const data = await fs.readFile(applicationDataPath, 'utf8');
                applicationData = JSON.parse(data);
            } catch (error) {
                logger.error(`[${requestId}] Application data not found: ${applicationNumber}`);
                return res.status(404).json({
                    success: false,
                    error: 'Application not found',
                    message: `No application data found for ${applicationNumber}`
                });
            }

            // Generate PDF
            const outputPath = path.join(__dirname, `../../applications/${applicationNumber}/loan-application-${applicationNumber}.pdf`);
            const result = await this.pdfGenerator.generateCompleteLoanApplicationPDF(applicationData, outputPath);

            if (result.success) {
                logger.info(`[${requestId}] PDF generated successfully: ${result.path}`);
                
                res.status(200).json({
                    success: true,
                    data: {
                        application_number: applicationNumber,
                        pdf_path: `/api/pdf/view/${applicationNumber}`,
                        download_path: `/api/pdf/download/${applicationNumber}`,
                        file_size: result.size,
                        generated_at: new Date().toISOString()
                    },
                    message: 'PDF generated successfully',
                    requestId
                });
            } else {
                logger.error(`[${requestId}] PDF generation failed: ${result.error}`);
                res.status(500).json({
                    success: false,
                    error: 'PDF generation failed',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error generating application PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * Get/View PDF for a specific loan application
     * GET /api/pdf/view/:applicationNumber
     */
    async getApplicationPDF(req, res) {
        try {
            const { applicationNumber } = req.params;
            const { download } = req.query;
            
            logger.info(`Serving PDF for application: ${applicationNumber}`);

            // Check for existing PDF
            const pdfPath = path.join(__dirname, `../../applications/${applicationNumber}/loan-application-${applicationNumber}.pdf`);
            
            try {
                await fs.access(pdfPath);
            } catch (error) {
                // PDF doesn't exist, try to generate it
                logger.info(`PDF not found, generating for application: ${applicationNumber}`);
                
                const applicationDataPath = path.join(__dirname, `../../applications/${applicationNumber}/application-data.json`);
                try {
                    const data = await fs.readFile(applicationDataPath, 'utf8');
                    const applicationData = JSON.parse(data);
                    
                    const result = await this.pdfGenerator.generateCompleteLoanApplicationPDF(applicationData, pdfPath);
                    if (!result.success) {
                        throw new Error(result.error);
                    }
                } catch (genError) {
                    logger.error(`Failed to generate PDF: ${genError.message}`);
                    return res.status(404).json({
                        success: false,
                        error: 'PDF not found',
                        message: `No PDF available for application ${applicationNumber} and generation failed`
                    });
                }
            }

            // Serve the PDF
            const pdfBuffer = await fs.readFile(pdfPath);
            
            // Set appropriate headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length);
            
            if (download === 'true') {
                res.setHeader('Content-Disposition', `attachment; filename="loan-application-${applicationNumber}.pdf"`);
            } else {
                res.setHeader('Content-Disposition', `inline; filename="loan-application-${applicationNumber}.pdf"`);
            }

            res.send(pdfBuffer);

        } catch (error) {
            logger.error('Error serving application PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to serve PDF',
                message: error.message
            });
        }
    }

    /**
     * Download PDF for a specific loan application
     * GET /api/pdf/download/:applicationNumber
     */
    async downloadApplicationPDF(req, res) {
        req.query.download = 'true';
        return this.getApplicationPDF(req, res);
    }

    /**
     * List all available application PDFs
     * GET /api/pdf/list
     */
    async listApplicationPDFs(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `pdf_list_${Date.now()}`;
            
            logger.info(`[${requestId}] Listing all application PDFs`);

            const applicationsDir = path.join(__dirname, '../../applications');
            const applications = [];

            try {
                const dirs = await fs.readdir(applicationsDir);
                
                for (const dir of dirs) {
                    const applicationPath = path.join(applicationsDir, dir);
                    const stats = await fs.stat(applicationPath);
                    
                    if (stats.isDirectory()) {
                        // Check for application data
                        const dataPath = path.join(applicationPath, 'application-data.json');
                        const pdfPath = path.join(applicationPath, `loan-application-${dir}.pdf`);
                        
                        let applicationData = null;
                        let pdfExists = false;
                        let pdfSize = 0;
                        let pdfModified = null;

                        try {
                            const data = await fs.readFile(dataPath, 'utf8');
                            applicationData = JSON.parse(data);
                        } catch (error) {
                            // Skip if no application data
                            continue;
                        }

                        try {
                            const pdfStats = await fs.stat(pdfPath);
                            pdfExists = true;
                            pdfSize = pdfStats.size;
                            pdfModified = pdfStats.mtime.toISOString();
                        } catch (error) {
                            // PDF doesn't exist yet
                        }

                        applications.push({
                            application_number: dir,
                            applicant_name: applicationData.stage_1_data?.personal_details?.full_name || 
                                           applicationData.stage_1_data?.personal_details?.applicant_name || 'N/A',
                            loan_amount: applicationData.stage_1_data?.loan_request?.loan_amount || 0,
                            status: applicationData.application_info?.status || 'unknown',
                            created_at: applicationData.application_info?.created_at || null,
                            pdf_available: pdfExists,
                            pdf_size: pdfExists ? `${(pdfSize / 1024).toFixed(2)} KB` : null,
                            pdf_modified: pdfModified,
                            view_url: `/api/pdf/view/${dir}`,
                            download_url: `/api/pdf/download/${dir}`,
                            generate_url: `/api/pdf/generate/${dir}`
                        });
                    }
                }

                // Sort by creation date (newest first)
                applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                res.status(200).json({
                    success: true,
                    data: {
                        total_applications: applications.length,
                        applications_with_pdf: applications.filter(app => app.pdf_available).length,
                        applications: applications
                    },
                    message: 'Application PDFs listed successfully',
                    requestId
                });

            } catch (error) {
                logger.error(`[${requestId}] Error reading applications directory:`, error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to list applications',
                    message: 'Could not access applications directory',
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error listing application PDFs:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * Regenerate PDF for a specific loan application
     * POST /api/pdf/regenerate/:applicationNumber
     */
    async regenerateApplicationPDF(req, res) {
        try {
            const { applicationNumber } = req.params;
            const requestId = req.headers['x-request-id'] || `pdf_regen_${Date.now()}`;
            
            logger.info(`[${requestId}] Regenerating PDF for application: ${applicationNumber}`);

            // Load application data
            const applicationDataPath = path.join(__dirname, `../../applications/${applicationNumber}/application-data.json`);
            
            let applicationData;
            try {
                const data = await fs.readFile(applicationDataPath, 'utf8');
                applicationData = JSON.parse(data);
            } catch (error) {
                logger.error(`[${requestId}] Application data not found: ${applicationNumber}`);
                return res.status(404).json({
                    success: false,
                    error: 'Application not found',
                    message: `No application data found for ${applicationNumber}`
                });
            }

            // Delete existing PDF if it exists
            const outputPath = path.join(__dirname, `../../applications/${applicationNumber}/loan-application-${applicationNumber}.pdf`);
            try {
                await fs.unlink(outputPath);
                logger.info(`[${requestId}] Deleted existing PDF for regeneration`);
            } catch (error) {
                // File doesn't exist, which is fine
            }

            // Generate new PDF
            const result = await this.pdfGenerator.generateCompleteLoanApplicationPDF(applicationData, outputPath);

            if (result.success) {
                logger.info(`[${requestId}] PDF regenerated successfully: ${result.path}`);
                
                res.status(200).json({
                    success: true,
                    data: {
                        application_number: applicationNumber,
                        pdf_path: `/api/pdf/view/${applicationNumber}`,
                        download_path: `/api/pdf/download/${applicationNumber}`,
                        file_size: result.size,
                        regenerated_at: new Date().toISOString()
                    },
                    message: 'PDF regenerated successfully',
                    requestId
                });
            } else {
                logger.error(`[${requestId}] PDF regeneration failed: ${result.error}`);
                res.status(500).json({
                    success: false,
                    error: 'PDF regeneration failed',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error regenerating application PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }
}

module.exports = new PDFController();
