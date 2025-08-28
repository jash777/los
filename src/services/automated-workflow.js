/**
 * Automated Workflow Service
 * Orchestrates automatic execution of stages 3-7 after Stage 2 completion
 */

const logger = require('../utils/logger');
const ApplicationProcessingService = require('./application-processing');
const UnderwritingService = require('./underwriting');
const CreditDecisionService = require('./credit-decision');
const QualityCheckService = require('./quality-check');
const LoanFundingService = require('./loan-funding');
const ApplicationTemplateService = require('./application-template');
const databaseService = require('../database/service');

class AutomatedWorkflowService {
    constructor() {
        this.templateService = new ApplicationTemplateService();
        this.applicationProcessingService = new ApplicationProcessingService();
        this.underwritingService = new UnderwritingService();
        this.creditDecisionService = new CreditDecisionService();
        this.qualityCheckService = new QualityCheckService();
        this.loanFundingService = new LoanFundingService();
        
        this.stageSequence = [
            { stage: 'application_processing', service: 'applicationProcessingService', method: 'processApplication' },
            { stage: 'underwriting', service: 'underwritingService', method: 'processUnderwriting' },
            { stage: 'credit_decision', service: 'creditDecisionService', method: 'processCreditDecision' },
            { stage: 'quality_check', service: 'qualityCheckService', method: 'processQualityCheck' },
            { stage: 'loan_funding', service: 'loanFundingService', method: 'processLoanFunding' }
        ];
    }

    /**
     * Start automated processing after Stage 2 completion
     */
    async startAutomatedProcessing(applicationNumber, requestId) {
        const startTime = Date.now();
        
        logger.info(`[${requestId}] Starting automated workflow for application ${applicationNumber}`);

        try {
            // Verify application is ready for automated processing
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            if (application.current_stage !== 'loan_application' || application.current_status !== 'approved') {
                throw new Error(`Application must complete comprehensive loan application stage. Current: ${application.current_stage}/${application.current_status}`);
            }

            // Log workflow start
            await this.logWorkflowEvent(application.id, 'workflow_started', {
                trigger_stage: application.current_stage,
                start_time: new Date().toISOString(),
                request_id: requestId
            });

            // Step 1: Fetch and update third-party data
            logger.info(`[${requestId}] Fetching third-party data for ${applicationNumber}`);
            try {
                await this.fetchAndUpdateThirdPartyData(applicationNumber, requestId);
                logger.info(`[${requestId}] Third-party data updated successfully`);
            } catch (thirdPartyError) {
                logger.warn(`[${requestId}] Failed to update third-party data: ${thirdPartyError.message}`);
            }

            const results = [];
            let currentStageIndex = 0;

            // Process each stage in sequence
            for (const stageConfig of this.stageSequence) {
                currentStageIndex++;
                
                logger.info(`[${requestId}] Processing stage ${currentStageIndex}/${this.stageSequence.length}: ${stageConfig.stage}`);
                
                try {
                    // Execute stage
                    const stageResult = await this.executeStage(stageConfig, applicationNumber, requestId);
                    
                    results.push({
                        stage: stageConfig.stage,
                        status: stageResult.status,
                        result: stageResult,
                        processed_at: new Date().toISOString()
                    });

                    // Check if stage was approved
                    if (stageResult.status !== 'approved') {
                        logger.warn(`[${requestId}] Stage ${stageConfig.stage} was not approved. Status: ${stageResult.status}`);
                        
                        // Log rejection and stop workflow
                        await this.logWorkflowEvent(application.id, 'workflow_stopped', {
                            stopped_at_stage: stageConfig.stage,
                            reason: stageResult.status,
                            rejection_reason: stageResult.rejection_reason || 'Stage not approved',
                            processed_stages: currentStageIndex,
                            total_stages: this.stageSequence.length
                        });

                        return this.createWorkflowResponse(applicationNumber, 'rejected', results, startTime, stageResult.rejection_reason);
                    }

                    logger.info(`[${requestId}] Stage ${stageConfig.stage} completed successfully`);

                } catch (stageError) {
                    logger.error(`[${requestId}] Error in stage ${stageConfig.stage}:`, stageError);
                    
                    // Log error and stop workflow
                    await this.logWorkflowEvent(application.id, 'workflow_error', {
                        error_at_stage: stageConfig.stage,
                        error_message: stageError.message,
                        processed_stages: currentStageIndex - 1,
                        total_stages: this.stageSequence.length
                    });

                    return this.createWorkflowResponse(applicationNumber, 'error', results, startTime, stageError.message);
                }
            }

            // All stages completed successfully
            logger.info(`[${requestId}] Automated workflow completed successfully for ${applicationNumber}`);
            
            await this.logWorkflowEvent(application.id, 'workflow_completed', {
                completion_time: new Date().toISOString(),
                total_processing_time_ms: Date.now() - startTime,
                processed_stages: this.stageSequence.length,
                final_status: 'approved'
            });

            return this.createWorkflowResponse(applicationNumber, 'approved', results, startTime);

        } catch (error) {
            logger.error(`[${requestId}] Automated workflow failed:`, error);
            return this.createWorkflowResponse(applicationNumber, 'error', [], startTime, error.message);
        }
    }

    /**
     * Execute individual stage
     */
    async executeStage(stageConfig, applicationNumber, requestId) {
        const service = this[stageConfig.service];
        const method = stageConfig.method;
        
        if (!service || !service[method]) {
            throw new Error(`Service method ${stageConfig.service}.${method} not found`);
        }

        // Execute the stage method
        const result = await service[method](applicationNumber, requestId);
        
        return result;
    }

    /**
     * Get workflow status
     */
    async getWorkflowStatus(applicationNumber, requestId) {
        try {
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            // Get workflow events
            const workflowEvents = await this.getWorkflowEvents(application.id);
            
            // Determine current workflow status
            const currentStage = application.current_stage;
            const currentStatus = application.current_status;
            
            let workflowStatus = 'not_started';
            if (currentStage === 'loan_application' && currentStatus === 'approved') {
                workflowStatus = 'ready_to_start';
            } else if (['application_processing', 'underwriting', 'credit_decision', 'quality_check'].includes(currentStage)) {
                workflowStatus = 'in_progress';
            } else if (currentStage === 'loan_funding' && currentStatus === 'completed') {
                workflowStatus = 'completed';
            } else if (currentStatus === 'rejected') {
                workflowStatus = 'rejected';
            }

            return {
                application_number: applicationNumber,
                workflow_status: workflowStatus,
                current_stage: currentStage,
                current_status: currentStatus,
                workflow_events: workflowEvents,
                stage_progress: this.calculateStageProgress(currentStage),
                estimated_completion_time: this.estimateCompletionTime(currentStage)
            };

        } catch (error) {
            logger.error(`[${requestId}] Error getting workflow status:`, error);
            throw error;
        }
    }

    /**
     * Log workflow events
     */
    async logWorkflowEvent(applicationId, eventType, eventData) {
        try {
            await databaseService.insertAuditLog({
                application_id: applicationId,
                event_type: eventType,
                event_data: eventData,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Error logging workflow event:', error);
        }
    }

    /**
     * Get workflow events for application
     */
    async getWorkflowEvents(applicationId) {
        try {
            const events = await databaseService.getAuditLogs(applicationId, {
                event_types: ['workflow_started', 'workflow_stopped', 'workflow_completed', 'workflow_error']
            });
            return events;
        } catch (error) {
            logger.error('Error getting workflow events:', error);
            return [];
        }
    }

    /**
     * Calculate stage progress percentage
     */
    calculateStageProgress(currentStage) {
        const stageIndex = this.stageSequence.findIndex(s => s.stage === currentStage);
        if (stageIndex === -1) {
            return currentStage === 'loan_application' ? 0 : 100;
        }
        return Math.round(((stageIndex + 1) / this.stageSequence.length) * 100);
    }

    /**
     * Estimate completion time based on current stage
     */
    estimateCompletionTime(currentStage) {
        const stageIndex = this.stageSequence.findIndex(s => s.stage === currentStage);
        if (stageIndex === -1) {
            return currentStage === 'loan_application' ? '15-20 minutes' : 'Completed';
        }
        
        const remainingStages = this.stageSequence.length - stageIndex;
        const estimatedMinutes = remainingStages * 3; // Assume 3 minutes per stage
        
        return `${estimatedMinutes}-${estimatedMinutes + 5} minutes`;
    }

    /**
     * Fetch and update third-party data in application template
     */
    async fetchAndUpdateThirdPartyData(applicationNumber, requestId) {
        try {
            // Get current application data from template
            const applicationData = await this.templateService.getApplicationData(applicationNumber);
            if (!applicationData) {
                throw new Error('Application template not found');
            }

            const thirdPartyData = {};

            // Fetch CIBIL data if PAN is available
            if (applicationData.stage1_data?.personal_details?.pan_number) {
                logger.info(`[${requestId}] Fetching CIBIL data for PAN: ${applicationData.stage1_data.personal_details.pan_number}`);
                try {
                    const cibilData = await this.fetchCibilData(applicationData.stage1_data.personal_details.pan_number, requestId);
                    thirdPartyData.cibil = cibilData;
                } catch (cibilError) {
                    logger.warn(`[${requestId}] CIBIL fetch failed: ${cibilError.message}`);
                    thirdPartyData.cibil = { error: cibilError.message, fetched_at: new Date().toISOString() };
                }
            }

            // Fetch PAN verification if PAN is available
            if (applicationData.stage1_data?.personal_details?.pan_number) {
                logger.info(`[${requestId}] Verifying PAN: ${applicationData.stage1_data.personal_details.pan_number}`);
                try {
                    const panData = await this.fetchPanVerification(applicationData.stage1_data.personal_details.pan_number, requestId);
                    thirdPartyData.pan_verification = panData;
                } catch (panError) {
                    logger.warn(`[${requestId}] PAN verification failed: ${panError.message}`);
                    thirdPartyData.pan_verification = { error: panError.message, fetched_at: new Date().toISOString() };
                }
            }

            // Fetch employment verification if company details are available
            if (applicationData.stage2_data?.employment_details?.company_name) {
                logger.info(`[${requestId}] Verifying employment at ${applicationData.stage2_data.employment_details.company_name}`);
                try {
                    const employmentData = await this.fetchEmploymentVerification(applicationData.stage2_data.employment_details, requestId);
                    thirdPartyData.employment_verification = employmentData;
                } catch (empError) {
                    logger.warn(`[${requestId}] Employment verification failed: ${empError.message}`);
                    thirdPartyData.employment_verification = { error: empError.message, fetched_at: new Date().toISOString() };
                }
            }

            // Fetch bank statement analysis if banking details are available
            if (applicationData.stage2_data?.banking_details?.account_number) {
                logger.info(`[${requestId}] Analyzing bank statements`);
                try {
                    const bankAnalysisData = await this.fetchBankStatementAnalysis(applicationData.stage2_data.banking_details, requestId);
                    thirdPartyData.bank_statement_analysis = bankAnalysisData;
                } catch (bankError) {
                    logger.warn(`[${requestId}] Bank statement analysis failed: ${bankError.message}`);
                    thirdPartyData.bank_statement_analysis = { error: bankError.message, fetched_at: new Date().toISOString() };
                }
            }

            // Update application template with third-party data
            await this.templateService.updateWithThirdPartyData(applicationNumber, thirdPartyData);
            logger.info(`[${requestId}] Third-party data updated in application template`);

        } catch (error) {
            logger.error(`[${requestId}] Error fetching third-party data:`, error);
            throw error;
        }
    }

    /**
     * Fetch CIBIL data from third-party API
     */
    async fetchCibilData(panNumber, requestId) {
        // Simulate CIBIL API call
        return {
            score: Math.floor(Math.random() * (850 - 300) + 300),
            grade: 'Good',
            report_date: new Date().toISOString(),
            credit_accounts: Math.floor(Math.random() * 10) + 1,
            total_credit_limit: Math.floor(Math.random() * 1000000) + 100000,
            credit_utilization: Math.floor(Math.random() * 80) + 10,
            payment_history: 'Regular',
            fetched_at: new Date().toISOString()
        };
    }

    /**
     * Fetch PAN verification from third-party API
     */
    async fetchPanVerification(panNumber, requestId) {
        // Simulate PAN verification API call
        return {
            pan_number: panNumber,
            is_valid: true,
            name_match: 'Exact Match',
            status: 'Active',
            verified_at: new Date().toISOString(),
            fetched_at: new Date().toISOString()
        };
    }

    /**
     * Fetch employment verification from third-party API
     */
    async fetchEmploymentVerification(employmentDetails, requestId) {
        // Simulate employment verification API call
        return {
            company_name: employmentDetails.company_name,
            designation: employmentDetails.designation,
            employment_status: 'Active',
            salary_verified: true,
            experience_verified: true,
            company_rating: 'A',
            verified_at: new Date().toISOString(),
            fetched_at: new Date().toISOString()
        };
    }

    /**
     * Fetch bank statement analysis from third-party API
     */
    async fetchBankStatementAnalysis(bankingDetails, requestId) {
        // Simulate bank statement analysis API call
        return {
            account_number: bankingDetails.account_number,
            average_balance: Math.floor(Math.random() * 100000) + 10000,
            monthly_credits: Math.floor(Math.random() * 200000) + 50000,
            monthly_debits: Math.floor(Math.random() * 180000) + 40000,
            bounce_count: Math.floor(Math.random() * 3),
            salary_credits_regular: true,
            account_stability: 'High',
            analysis_period: '6 months',
            analyzed_at: new Date().toISOString(),
            fetched_at: new Date().toISOString()
        };
    }

    /**
     * Create workflow response
     */
    createWorkflowResponse(applicationNumber, status, results, startTime, errorMessage = null) {
        return {
            application_number: applicationNumber,
            workflow_status: status,
            processing_time_ms: Date.now() - startTime,
            stages_processed: results.length,
            total_stages: this.stageSequence.length,
            stage_results: results,
            error_message: errorMessage,
            completed_at: new Date().toISOString()
        };
    }
}

module.exports = AutomatedWorkflowService;