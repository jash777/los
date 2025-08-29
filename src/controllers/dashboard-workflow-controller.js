/**
 * Dashboard-Driven Workflow Controller
 * Handles employee-managed loan processing workflow immediately after application submission
 */

const logger = require('../utils/logger');
const dualWorkflowManager = require('../services/dual-workflow-manager');
const manualWorkflowService = require('../services/manual-workflow');

class DashboardWorkflowController {
    
    constructor() {
        // Bind methods to preserve 'this' context
        this.createDashboardApplication = this.createDashboardApplication.bind(this);
        this.getApplicationForReview = this.getApplicationForReview.bind(this);
        this.processStage = this.processStage.bind(this);
        this.updateApplicantProfile = this.updateApplicantProfile.bind(this);
        this.switchWorkflowType = this.switchWorkflowType.bind(this);
        this.getDualWorkflowDashboard = this.getDualWorkflowDashboard.bind(this);
        this.getApplicationsByWorkflow = this.getApplicationsByWorkflow.bind(this);
    }

    /**
     * Create new dashboard-driven application
     */
    async createDashboardApplication(req, res) {
        try {
            const applicationData = req.body;
            const requestId = req.headers['x-request-id'] || `dashboard_${Date.now()}`;
            
            logger.info(`[${requestId}] Creating dashboard-driven application`);
            
            // Validate required fields
            const requiredFields = ['applicant_name', 'email', 'phone', 'pan_number', 'loan_amount', 'loan_purpose'];
            const missingFields = requiredFields.filter(field => !applicationData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    missing_fields: missingFields
                });
            }
            
            // Add metadata
            applicationData.source_channel = 'dashboard';
            applicationData.source_ip = req.ip;
            applicationData.created_by = req.body.created_by || 'employee';
            
            // Create enhanced application
            const result = await dualWorkflowManager.createEnhancedApplication(
                applicationData, 'dashboard_driven'
            );
            
            // Automatically add to manual review queue for initial review
            await manualWorkflowService.addToManualReviewQueue(
                result.applicationNumber, 
                'application_submitted', 
                'verification', 
                applicationData.priority_level || 'normal'
            );
            
            res.status(201).json({
                success: true,
                data: {
                    application_id: result.applicationId,
                    application_number: result.applicationNumber,
                    workflow_type: result.workflowType,
                    initial_stage: result.initialStage,
                    profile_id: result.profileId,
                    created_at: result.createdAt,
                    next_steps: {
                        stage: 'initial_review',
                        action: 'Employee review required',
                        description: 'Application submitted and queued for employee review'
                    }
                },
                message: 'Dashboard-driven application created successfully',
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error creating dashboard application:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create dashboard application',
                message: error.message
            });
        }
    }

    /**
     * Get application for dashboard review
     */
    async getApplicationForReview(req, res) {
        try {
            const { application_number } = req.params;
            const requestId = req.headers['x-request-id'] || `review_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting application for dashboard review: ${application_number}`);
            
            const application = await dualWorkflowManager.getEnhancedApplication(application_number);
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            res.json({
                success: true,
                data: {
                    application,
                    workflow_type: application.workflow_type,
                    current_stage: application.current_stage,
                    current_status: application.current_status,
                    review_ready: true
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting application for review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get application for review',
                message: error.message
            });
        }
    }

    /**
     * Process stage in dashboard workflow
     */
    async processStage(req, res) {
        try {
            const { application_number, stage_name } = req.params;
            const { 
                decision, 
                decision_reason, 
                next_stage, 
                employee_id,
                stage_data,
                conditions 
            } = req.body;
            
            const requestId = req.headers['x-request-id'] || `process_${Date.now()}`;
            
            logger.info(`[${requestId}] Processing dashboard stage ${stage_name} for ${application_number}`);
            
            // Validate required fields
            if (!decision || !decision_reason || !employee_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['decision', 'decision_reason', 'employee_id']
                });
            }
            
            const validDecisions = ['approved', 'rejected', 'conditional', 'refer_manual', 'escalate'];
            if (!validDecisions.includes(decision)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid decision',
                    valid_decisions: validDecisions
                });
            }
            
            // Prepare decision data
            const decisionData = {
                decision,
                decision_reason,
                stage_data: stage_data || {},
                conditions: conditions || null,
                processed_by: employee_id,
                processing_method: 'manual'
            };
            
            // Determine next stage and status
            let targetStage = next_stage;
            let targetStatus = 'pending';
            
            if (decision === 'approved') {
                targetStatus = 'approved';
                if (!targetStage) {
                    targetStage = this.getNextStage(stage_name);
                }
            } else if (decision === 'rejected') {
                targetStage = 'rejected';
                targetStatus = 'rejected';
            } else if (decision === 'conditional') {
                targetStatus = 'on_hold';
                targetStage = stage_name; // Stay in current stage
            }
            
            // Process manual decision first
            await manualWorkflowService.processManualDecision(
                application_number, stage_name, employee_id, decision, {
                    decision_reason,
                    conditions,
                    recommended_terms: stage_data?.recommended_terms || {},
                    internal_notes: stage_data?.internal_notes || null,
                    time_spent_minutes: stage_data?.time_spent_minutes || 0,
                    decision_score: stage_data?.decision_score || 0
                }
            );
            
            // Transition to next stage if approved
            if (decision === 'approved' && targetStage !== stage_name) {
                await dualWorkflowManager.transitionToNextStage(
                    application_number, targetStage, targetStatus, decisionData, employee_id
                );
            }
            
            res.json({
                success: true,
                data: {
                    application_number,
                    processed_stage: stage_name,
                    decision,
                    next_stage: targetStage,
                    status: targetStatus,
                    processed_by: employee_id,
                    processed_at: new Date().toISOString()
                },
                message: `Stage ${stage_name} processed successfully`,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error processing dashboard stage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process stage',
                message: error.message
            });
        }
    }

    /**
     * Update applicant profile
     */
    async updateApplicantProfile(req, res) {
        try {
            const { application_number } = req.params;
            const profileUpdates = req.body;
            const requestId = req.headers['x-request-id'] || `update_${Date.now()}`;
            
            logger.info(`[${requestId}] Updating applicant profile for ${application_number}`);
            
            // Get application to find profile ID
            const application = await dualWorkflowManager.getEnhancedApplication(application_number);
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            // Update profile data
            await this.updateProfileData(application.id, profileUpdates, profileUpdates.updated_by || 'employee');
            
            res.json({
                success: true,
                data: {
                    application_number,
                    updated_fields: Object.keys(profileUpdates),
                    updated_at: new Date().toISOString()
                },
                message: 'Applicant profile updated successfully',
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error updating applicant profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update applicant profile',
                message: error.message
            });
        }
    }

    /**
     * Switch workflow type
     */
    async switchWorkflowType(req, res) {
        try {
            const { application_number } = req.params;
            const { new_workflow_type, reason, employee_id } = req.body;
            const requestId = req.headers['x-request-id'] || `switch_${Date.now()}`;
            
            logger.info(`[${requestId}] Switching workflow type for ${application_number}`);
            
            if (!new_workflow_type || !reason || !employee_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    required: ['new_workflow_type', 'reason', 'employee_id']
                });
            }
            
            const validWorkflowTypes = ['los_automated', 'dashboard_driven', 'hybrid'];
            if (!validWorkflowTypes.includes(new_workflow_type)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid workflow type',
                    valid_types: validWorkflowTypes
                });
            }
            
            const result = await dualWorkflowManager.switchWorkflowType(
                application_number, new_workflow_type, reason, employee_id
            );
            
            res.json({
                success: true,
                data: result,
                message: `Workflow type switched to ${new_workflow_type}`,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error switching workflow type:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to switch workflow type',
                message: error.message
            });
        }
    }

    /**
     * Get dual workflow dashboard
     */
    async getDualWorkflowDashboard(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `dashboard_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting dual workflow dashboard`);
            
            const dashboardData = await dualWorkflowManager.getDualWorkflowDashboard();
            
            res.json({
                success: true,
                data: dashboardData,
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting dual workflow dashboard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dual workflow dashboard',
                message: error.message
            });
        }
    }

    /**
     * Get applications by workflow type
     */
    async getApplicationsByWorkflow(req, res) {
        try {
            const { workflow_type } = req.params;
            const { page = 1, limit = 20, stage, status } = req.query;
            const requestId = req.headers['x-request-id'] || `list_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting ${workflow_type} applications`);
            
            const applications = await this.getFilteredApplications(
                workflow_type, stage, status, parseInt(page), parseInt(limit)
            );
            
            res.json({
                success: true,
                data: {
                    applications: applications.data,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: applications.total,
                        total_pages: Math.ceil(applications.total / parseInt(limit))
                    },
                    filters: {
                        workflow_type,
                        stage: stage || 'all',
                        status: status || 'all'
                    }
                },
                requestId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Error getting applications by workflow:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get applications',
                message: error.message
            });
        }
    }

    // Helper methods
    getNextStage(currentStage) {
        const stageFlow = {
            'application_submitted': 'initial_review',
            'initial_review': 'kyc_verification',
            'kyc_verification': 'employment_verification',
            'employment_verification': 'financial_assessment',
            'financial_assessment': 'credit_evaluation',
            'credit_evaluation': 'underwriting',
            'underwriting': 'credit_decision',
            'credit_decision': 'approval_processing',
            'approval_processing': 'loan_funding',
            'loan_funding': 'completed'
        };
        
        return stageFlow[currentStage] || 'completed';
    }

    async updateProfileData(applicationId, updates, updatedBy) {
        const databaseService = require('../database/service');
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Build dynamic update query
            const updateFields = [];
            const updateValues = [];
            
            const allowedFields = [
                'first_name', 'last_name', 'date_of_birth', 'primary_email', 'primary_mobile',
                'pan_number', 'aadhar_number', 'employment_type', 'company_name', 'designation',
                'monthly_income', 'current_address', 'permanent_address', 'cibil_score',
                'risk_category', 'kyc_status'
            ];
            
            Object.keys(updates).forEach(field => {
                if (allowedFields.includes(field)) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            });
            
            if (updateFields.length > 0) {
                updateFields.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
                updateValues.push(updatedBy, applicationId);
                
                const query = `UPDATE applicant_profiles SET ${updateFields.join(', ')} WHERE application_id = ?`;
                await connection.execute(query, updateValues);
            }
            
        } finally {
            connection.release();
            await databaseService.close();
        }
    }

    async getFilteredApplications(workflowType, stage, status, page, limit) {
        const databaseService = require('../database/service');
        await databaseService.initialize();
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Build where conditions
            let whereConditions = ['workflow_type = ?'];
            let queryParams = [workflowType];
            
            if (stage && stage !== 'all') {
                whereConditions.push('current_stage = ?');
                queryParams.push(stage);
            }
            
            if (status && status !== 'all') {
                whereConditions.push('current_status = ?');
                queryParams.push(status);
            }
            
            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * limit;
            
            // Prepare queries with full WHERE clause
            const countQuery = `SELECT COUNT(*) as total FROM v_complete_applications_enhanced WHERE ${whereClause}`;
            const dataQuery = `SELECT * FROM v_complete_applications_enhanced WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
            
            // Get total count
            const [countResult] = await connection.execute(countQuery, queryParams);
            
            // Get paginated data (using direct values for LIMIT and OFFSET)
            const [applications] = await connection.execute(dataQuery, queryParams);
            
            return {
                data: applications,
                total: countResult[0].total
            };
            
        } finally {
            connection.release();
            await databaseService.close();
        }
    }
}

module.exports = new DashboardWorkflowController();
