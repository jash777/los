/**
 * Dual Workflow Manager Service
 * Manages both LOS automated workflow and dashboard-driven employee workflow
 * Ensures consistency and data integrity across both workflows
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');
const manualWorkflowService = require('./manual-workflow');

class DualWorkflowManager {
    constructor() {
        this.workflowTypes = {
            LOS_AUTOMATED: 'los_automated',
            DASHBOARD_DRIVEN: 'dashboard_driven',
            HYBRID: 'hybrid'
        };
        
        this.stageMapping = {
            // LOS Automated Stages
            'pre_qualification': 'pre_qualification',
            'application_processing': 'document_collection',
            'underwriting': 'underwriting',
            'credit_decision': 'credit_decision',
            'quality_check': 'quality_check',
            'loan_funding': 'loan_funding',
            'completed': 'completed',
            
            // Dashboard-driven Stages
            'application_submitted': 'application_submitted',
            'initial_review': 'initial_review',
            'kyc_verification': 'kyc_verification',
            'employment_verification': 'employment_verification',
            'financial_assessment': 'financial_assessment',
            'credit_evaluation': 'credit_evaluation',
            'approval_processing': 'approval_processing'
        };
    }

    /**
     * Create application with enhanced data structure
     */
    async createEnhancedApplication(applicationData, workflowType = 'los_automated') {
        let connection;
        try {
            await databaseService.initialize();
            connection = await databaseService.pool.getConnection();
            
            await connection.beginTransaction();
            
            // Generate application number
            const applicationNumber = this.generateApplicationNumber();
            
            // Determine initial stage based on workflow type
            const initialStage = workflowType === 'dashboard_driven' ? 'application_submitted' : 'pre_qualification';
            
            // Generate UUID for the application
            const applicationId = this.generateUUID();
            
            // Create enhanced application record
            const [appResult] = await connection.execute(`
                INSERT INTO loan_applications_enhanced (
                    id, application_number, workflow_type, current_stage, current_status,
                    loan_amount, loan_purpose, requested_tenure_months, priority_level,
                    source_channel, source_ip, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                applicationId,
                applicationNumber,
                workflowType,
                initialStage,
                'pending',
                applicationData.loan_amount,
                applicationData.loan_purpose,
                applicationData.requested_tenure_months || 36,
                applicationData.priority_level || 'normal',
                applicationData.source_channel || 'web',
                applicationData.source_ip || null,
                applicationData.created_by || 'system'
            ]);
            
            // Create applicant profile
            const profileData = await this.createApplicantProfile(
                connection, applicationId, applicationData
            );
            
            // Create initial workflow state
            await this.createWorkflowState(
                connection, applicationId, workflowType, initialStage, 1
            );
            
            // Create workflow transition record
            await this.recordWorkflowTransition(
                connection, applicationId, null, initialStage, null, 'pending',
                workflowType, 'automatic', applicationData.created_by || 'system',
                'Application created'
            );
            
            await connection.commit();
            connection.release();
            
            logger.info(`Enhanced application created: ${applicationNumber} (${workflowType})`);
            
            return {
                success: true,
                applicationId,
                applicationNumber,
                workflowType,
                profileId: profileData.profileId,
                initialStage,
                createdAt: new Date()
            };
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            logger.error('Error creating enhanced application:', error);
            throw error;
        } finally {
            await databaseService.close();
        }
    }

    /**
     * Create comprehensive applicant profile
     */
    async createApplicantProfile(connection, applicationId, applicationData) {
        // Extract name components
        const nameParts = (applicationData.applicant_name || applicationData.full_name || '').split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Calculate age from date of birth
        const age = applicationData.date_of_birth ? 
            this.calculateAge(applicationData.date_of_birth) : 0;
        
        // Create current address JSON
        const currentAddress = applicationData.current_address || {
            address: applicationData.address || 'Not provided',
            city: applicationData.city || 'Unknown',
            state: applicationData.state || 'Unknown',
            pincode: applicationData.pincode || '000000',
            residence_type: applicationData.residence_type || 'unknown'
        };
        
        const profileId = this.generateUUID();
        
        const [profileResult] = await connection.execute(`
            INSERT INTO applicant_profiles (
                id, application_id, first_name, last_name, full_name, date_of_birth, age,
                primary_email, primary_mobile, pan_number, aadhar_number,
                employment_type, company_name, designation, monthly_income, annual_income,
                current_address, permanent_address, primary_bank_name, cibil_score,
                kyc_status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            profileId,
            applicationId,
            firstName,
            lastName,
            fullName,
            applicationData.date_of_birth || '1990-01-01',
            age,
            applicationData.email || applicationData.primary_email,
            applicationData.phone || applicationData.primary_mobile,
            applicationData.pan_number,
            applicationData.aadhar_number || null,
            applicationData.employment_type || 'salaried',
            applicationData.company_name || null,
            applicationData.designation || null,
            applicationData.monthly_income || 0,
            (applicationData.monthly_income || 0) * 12,
            JSON.stringify(currentAddress),
            JSON.stringify({ same_as_current: true }),
            applicationData.primary_bank_name || null,
            applicationData.cibil_score || null,
            'pending',
            applicationData.created_by || 'system'
        ]);
        
        return {
            profileId,
            fullName,
            age
        };
    }

    /**
     * Create workflow state record
     */
    async createWorkflowState(connection, applicationId, workflowType, stageName, stageOrder) {
        await connection.execute(`
            INSERT INTO workflow_states (
                application_id, workflow_type, stage_name, stage_order,
                status, processing_method
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            applicationId,
            workflowType,
            stageName,
            stageOrder,
            'pending',
            workflowType === 'los_automated' ? 'automated' : 'manual'
        ]);
    }

    /**
     * Record workflow transition
     */
    async recordWorkflowTransition(connection, applicationId, fromStage, toStage, 
                                   fromStatus, toStatus, workflowType, triggerType, 
                                   triggeredBy, reason) {
        await connection.execute(`
            INSERT INTO workflow_transitions (
                application_id, from_stage, to_stage, from_status, to_status,
                workflow_type, trigger_type, triggered_by, trigger_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            applicationId,
            fromStage,
            toStage,
            fromStatus,
            toStatus,
            workflowType,
            triggerType,
            triggeredBy,
            reason
        ]);
    }

    /**
     * Transition application to next stage
     */
    async transitionToNextStage(applicationNumber, newStage, newStatus, 
                                decisionData = null, triggeredBy = 'system') {
        let connection;
        try {
            await databaseService.initialize();
            connection = await databaseService.pool.getConnection();
            
            await connection.beginTransaction();
            
            // Get current application state
            const [currentApp] = await connection.execute(`
                SELECT id, current_stage, current_status, workflow_type 
                FROM loan_applications_enhanced 
                WHERE application_number = ?
            `, [applicationNumber]);
            
            if (currentApp.length === 0) {
                throw new Error('Application not found');
            }
            
            const app = currentApp[0];
            const oldStage = app.current_stage;
            const oldStatus = app.current_status;
            
            // Update application
            await connection.execute(`
                UPDATE loan_applications_enhanced 
                SET current_stage = ?, current_status = ?, updated_at = CURRENT_TIMESTAMP,
                    updated_by = ?, last_activity_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newStage, newStatus, triggeredBy, app.id]);
            
            // Update current workflow state to completed
            await connection.execute(`
                UPDATE workflow_states 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
                    decision = ?, decision_reason = ?, stage_result = ?
                WHERE application_id = ? AND stage_name = ?
            `, [
                decisionData?.decision || 'approved',
                decisionData?.decision_reason || 'Stage completed',
                JSON.stringify(decisionData || {}),
                app.id,
                oldStage
            ]);
            
            // Create new workflow state if not final stage
            if (!this.isFinalStage(newStage)) {
                const stageOrder = await this.getNextStageOrder(connection, app.id);
                await this.createWorkflowState(
                    connection, app.id, app.workflow_type, newStage, stageOrder
                );
            }
            
            // Record transition
            await this.recordWorkflowTransition(
                connection, app.id, oldStage, newStage, oldStatus, newStatus,
                app.workflow_type, 'automatic', triggeredBy, 
                decisionData?.decision_reason || 'Stage transition'
            );
            
            // Check if manual review is required for dashboard-driven workflow
            if (app.workflow_type === 'dashboard_driven' && this.requiresManualReview(newStage)) {
                await manualWorkflowService.addToManualReviewQueue(
                    applicationNumber, newStage, this.getReviewType(newStage), 'normal'
                );
            }
            
            await connection.commit();
            connection.release();
            
            logger.info(`Application ${applicationNumber} transitioned: ${oldStage} -> ${newStage}`);
            
            return {
                success: true,
                fromStage: oldStage,
                toStage: newStage,
                fromStatus: oldStatus,
                toStatus: newStatus
            };
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            logger.error('Error transitioning application stage:', error);
            throw error;
        } finally {
            await databaseService.close();
        }
    }

    /**
     * Get complete enhanced application data
     */
    async getEnhancedApplication(applicationNumber) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            const [applications] = await connection.execute(`
                SELECT * FROM v_complete_applications_enhanced 
                WHERE application_number = ?
            `, [applicationNumber]);
            
            if (applications.length === 0) {
                return null;
            }
            
            const application = applications[0];
            
            // Get workflow states
            const [workflowStates] = await connection.execute(`
                SELECT * FROM workflow_states 
                WHERE application_id = ? 
                ORDER BY stage_order ASC
            `, [application.id]);
            
            // Get workflow transitions
            const [transitions] = await connection.execute(`
                SELECT * FROM workflow_transitions 
                WHERE application_id = ? 
                ORDER BY transitioned_at DESC
            `, [application.id]);
            
            // Get KYC verifications
            const [kycVerifications] = await connection.execute(`
                SELECT * FROM kyc_verifications 
                WHERE application_id = ? 
                ORDER BY initiated_at DESC
            `, [application.id]);
            
            // Get document attachments
            const [documents] = await connection.execute(`
                SELECT * FROM document_attachments 
                WHERE application_id = ? 
                ORDER BY created_at DESC
            `, [application.id]);
            
            connection.release();
            
            return {
                ...application,
                workflow_states: workflowStates,
                workflow_transitions: transitions,
                kyc_verifications: kycVerifications,
                document_attachments: documents
            };
            
        } catch (error) {
            logger.error('Error getting enhanced application:', error);
            throw error;
        } finally {
            await databaseService.close();
        }
    }

    /**
     * Switch application workflow type
     */
    async switchWorkflowType(applicationNumber, newWorkflowType, reason, triggeredBy = 'system') {
        let connection;
        try {
            await databaseService.initialize();
            connection = await databaseService.pool.getConnection();
            
            await connection.beginTransaction();
            
            const [app] = await connection.execute(`
                SELECT id, workflow_type, current_stage, current_status 
                FROM loan_applications_enhanced 
                WHERE application_number = ?
            `, [applicationNumber]);
            
            if (app.length === 0) {
                throw new Error('Application not found');
            }
            
            const oldWorkflowType = app[0].workflow_type;
            
            // Update workflow type
            await connection.execute(`
                UPDATE loan_applications_enhanced 
                SET workflow_type = ?, updated_by = ? 
                WHERE id = ?
            `, [newWorkflowType, triggeredBy, app[0].id]);
            
            // Record transition
            await this.recordWorkflowTransition(
                connection, app[0].id, app[0].current_stage, app[0].current_stage,
                app[0].current_status, app[0].current_status, newWorkflowType,
                'manual', triggeredBy, `Workflow switched: ${oldWorkflowType} -> ${newWorkflowType}. Reason: ${reason}`
            );
            
            await connection.commit();
            connection.release();
            
            logger.info(`Application ${applicationNumber} workflow switched: ${oldWorkflowType} -> ${newWorkflowType}`);
            
            return { success: true, oldWorkflowType, newWorkflowType };
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            logger.error('Error switching workflow type:', error);
            throw error;
        } finally {
            await databaseService.close();
        }
    }

    /**
     * Get dashboard statistics for both workflows
     */
    async getDualWorkflowDashboard() {
        let connection;
        try {
            await databaseService.initialize();
            connection = await databaseService.pool.getConnection();
            
            // Get workflow statistics
            const [workflowStats] = await connection.execute(`
                SELECT * FROM v_dual_workflow_dashboard
            `);
            
            // Get stage distribution
            const [stageDistribution] = await connection.execute(`
                SELECT 
                    workflow_type,
                    current_stage,
                    COUNT(*) as count,
                    AVG(processing_hours) as avg_hours
                FROM v_complete_applications_enhanced
                GROUP BY workflow_type, current_stage
                ORDER BY workflow_type, current_stage
            `);
            
            // Get recent activity
            const [recentActivity] = await connection.execute(`
                SELECT 
                    wt.application_id,
                    lae.application_number,
                    ap.full_name,
                    wt.from_stage,
                    wt.to_stage,
                    wt.workflow_type,
                    wt.triggered_by,
                    wt.transitioned_at
                FROM workflow_transitions wt
                JOIN loan_applications_enhanced lae ON wt.application_id = lae.id
                LEFT JOIN applicant_profiles ap ON lae.id = ap.application_id
                ORDER BY wt.transitioned_at DESC
                LIMIT 20
            `);
            
            // Get performance metrics
            const [performanceMetrics] = await connection.execute(`
                SELECT 
                    workflow_type,
                    COUNT(*) as total_applications,
                    AVG(processing_hours) as avg_processing_hours,
                    COUNT(CASE WHEN current_status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN current_status = 'approved' THEN 1 END) as approved_count,
                    COUNT(CASE WHEN current_status = 'rejected' THEN 1 END) as rejected_count
                FROM v_complete_applications_enhanced
                GROUP BY workflow_type
            `);
            
            if (connection) {
                connection.release();
            }
            
            return {
                workflow_statistics: workflowStats,
                stage_distribution: stageDistribution,
                recent_activity: recentActivity,
                performance_metrics: performanceMetrics,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            if (connection) {
                connection.release();
            }
            logger.error('Error getting dual workflow dashboard:', error);
            throw error;
        } finally {
            await databaseService.close();
        }
    }

    // Helper methods
    generateApplicationNumber() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `ENH_${timestamp}_${random}`;
    }

    generateUUID() {
        // Simple UUID v4 generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    async getNextStageOrder(connection, applicationId) {
        const [maxOrder] = await connection.execute(`
            SELECT COALESCE(MAX(stage_order), 0) + 1 as next_order
            FROM workflow_states 
            WHERE application_id = ?
        `, [applicationId]);
        
        return maxOrder[0].next_order;
    }

    isFinalStage(stageName) {
        return ['completed', 'rejected', 'cancelled'].includes(stageName);
    }

    requiresManualReview(stageName) {
        return [
            'initial_review', 'kyc_verification', 'employment_verification',
            'financial_assessment', 'credit_evaluation', 'underwriting',
            'approval_processing'
        ].includes(stageName);
    }

    getReviewType(stageName) {
        const reviewTypeMap = {
            'initial_review': 'verification',
            'kyc_verification': 'verification',
            'employment_verification': 'verification',
            'financial_assessment': 'underwriting',
            'credit_evaluation': 'underwriting',
            'underwriting': 'underwriting',
            'approval_processing': 'final_approval'
        };
        
        return reviewTypeMap[stageName] || 'verification';
    }
}

module.exports = new DualWorkflowManager();
