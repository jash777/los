/**
 * Dual-Phase Workflow Database Service
 * Handles all database operations for the dual-phase workflow system
 */

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class DualPhaseWorkflowDatabaseService {
    constructor() {
        this.db = db;
        logger.info('Dual-Phase Workflow Database Service initialized with PostgreSQL');
    }

    /**
     * Create a new workflow tracking record
     */
    async createWorkflowTracking(workflowData) {
        try {
            const workflowId = uuidv4();
            const query = `
                INSERT INTO workflow_tracking 
                (workflow_id, workflow_version, application_data, current_phase, status)
                VALUES ($1, $2, $3, $4, $5)
            `;
            
            await this.db.query(query, [
                workflowId,
                workflowData.version || '1.0.0',
                JSON.stringify(workflowData.applicationData),
                'automated',
                'in_progress'
            ]);
            
            logger.info(`Created workflow tracking for ${workflowId}`);
            return workflowId;
        } catch (error) {
            logger.error('Error creating workflow tracking:', error);
            throw error;
        }
    }

    /**
     * Update workflow status and phase
     */
    async updateWorkflowStatus(workflowId, updates) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            
            if (updates.status) {
                setParts.push(`status = $${paramIndex++}`);
                values.push(updates.status);
            }
            
            if (updates.currentPhase) {
                setParts.push(`current_phase = $${paramIndex++}`);
                values.push(updates.currentPhase);
            }
            
            if (updates.resultData) {
                setParts.push(`result_data = $${paramIndex++}`);
                values.push(JSON.stringify(updates.resultData));
            }
            
            if (updates.assignedEmployeeId) {
                setParts.push(`assigned_employee_id = $${paramIndex++}`);
                setParts.push(`assigned_employee_name = $${paramIndex++}`);
                values.push(updates.assignedEmployeeId, updates.assignedEmployeeName);
            }
            
            if (updates.manualPhaseStarted) {
                setParts.push('manual_phase_started_at = CURRENT_TIMESTAMP');
            }
            
            setParts.push('updated_at = CURRENT_TIMESTAMP');
            values.push(workflowId);
            
            const query = `UPDATE workflow_tracking SET ${setParts.join(', ')} WHERE workflow_id = $${paramIndex}`;
            
            const result = await this.db.query(query, values);
            
            if (result.rowCount === 0) {
                throw new Error(`Workflow ${workflowId} not found`);
            }
            
            logger.info(`Updated workflow ${workflowId} status`);
            return result;
        } catch (error) {
            logger.error('Error updating workflow status:', error);
            throw error;
        }
    }

    /**
     * Create or update stage tracking for automated phases
     */
    async updateStageTracking(workflowId, stageName, stageData) {
        try {
            const query = `
                INSERT INTO workflow_stage_tracking 
                (workflow_id, stage_name, status, result_data, processing_time_ms, retry_count, error_message)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (workflow_id, stage_name) DO UPDATE SET
                    status = EXCLUDED.status,
                    result_data = EXCLUDED.result_data,
                    processing_time_ms = EXCLUDED.processing_time_ms,
                    retry_count = EXCLUDED.retry_count,
                    error_message = EXCLUDED.error_message,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await this.db.query(query, [
                workflowId,
                stageName,
                stageData.status,
                stageData.resultData ? JSON.stringify(stageData.resultData) : null,
                stageData.processingTimeMs || null,
                stageData.retryCount || 0,
                stageData.errorMessage || null
            ]);
            
            logger.info(`Updated stage tracking for ${workflowId}:${stageName}`);
        } catch (error) {
            logger.error('Error updating stage tracking:', error);
            throw error;
        }
    }

    /**
     * Get workflow details by ID
     */
    async getWorkflowById(workflowId) {
        try {
            const query = `
                SELECT 
                    wt.*,
                    ea.employee_id,
                    ea.employee_name,
                    ea.employee_role,
                    ea.assignment_criteria,
                    ea.assigned_at as employee_assigned_at,
                    ea.status as assignment_status
                FROM workflow_tracking wt
                LEFT JOIN employee_assignments ea ON wt.workflow_id = ea.workflow_id 
                    AND ea.status IN ('assigned', 'in_progress')
                WHERE wt.workflow_id = $1
            `;
            
            const result = await this.db.query(query, [workflowId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const workflow = result.rows[0];
            
            // Parse JSON fields
            if (workflow.application_data) {
                workflow.application_data = JSON.parse(workflow.application_data);
            }
            if (workflow.result_data) {
                workflow.result_data = JSON.parse(workflow.result_data);
            }
            if (workflow.assignment_criteria) {
                workflow.assignment_criteria = JSON.parse(workflow.assignment_criteria);
            }
            
            return workflow;
        } catch (error) {
            logger.error('Error getting workflow by ID:', error);
            throw error;
        }
    }

    /**
     * Get workflow stage tracking
     */
    async getWorkflowStages(workflowId) {
        try {
            const query = `
                SELECT * FROM workflow_stage_tracking 
                WHERE workflow_id = $1 
                ORDER BY created_at ASC
            `;
            
            const result = await this.db.query(query, [workflowId]);
            
            return result.rows.map(row => ({
                ...row,
                result_data: row.result_data ? JSON.parse(row.result_data) : null
            }));
        } catch (error) {
            logger.error('Error getting workflow stages:', error);
            throw error;
        }
    }

    /**
     * Assign workflow to employee using PostgreSQL function
     */
    async assignWorkflowToEmployee(workflowId, loanAmount, riskLevel, complexity, specialRequirements = {}) {
        try {
            const query = 'SELECT * FROM assign_workflow_to_employee($1, $2, $3, $4, $5)';
            
            const result = await this.db.query(query, [
                workflowId,
                loanAmount,
                riskLevel,
                complexity,
                JSON.stringify(specialRequirements)
            ]);
            
            if (result.rows.length > 0) {
                const assignmentResult = result.rows[0];
                
                if (assignmentResult.result === 'success') {
                    logger.info(`Assigned workflow ${workflowId} to employee ${assignmentResult.employee_id}`);
                    return {
                        success: true,
                        employeeId: assignmentResult.employee_id,
                        employeeName: assignmentResult.employee_name
                    };
                } else {
                    logger.warn(`Failed to assign workflow ${workflowId}: ${assignmentResult.result}`);
                    return {
                        success: false,
                        reason: assignmentResult.result
                    };
                }
            } else {
                return {
                    success: false,
                    reason: 'No assignment result returned'
                };
            }
        } catch (error) {
            logger.error('Error assigning workflow to employee:', error);
            throw error;
        }
    }

    /**
     * Get employee dashboard data using PostgreSQL function
     */
    async getEmployeeDashboardData(employeeId) {
        try {
            const query = 'SELECT * FROM get_employee_dashboard_data($1)';
            
            const result = await this.db.query(query, [employeeId]);
            
            if (result.rows.length > 0) {
                const dashboardData = result.rows[0];
                return {
                    assignedApplications: dashboardData.assigned_applications || [],
                    employeeStats: dashboardData.employee_stats || {},
                    recentNotifications: dashboardData.recent_notifications || []
                };
            } else {
                return {
                    assignedApplications: [],
                    employeeStats: {},
                    recentNotifications: []
                };
            }
        } catch (error) {
            logger.error('Error getting employee dashboard data:', error);
            throw error;
        }
    }

    /**
     * Create or update manual stage tracking
     */
    async updateManualStageTracking(workflowId, stageName, employeeId, stageData) {
        try {
            const query = `
                INSERT INTO manual_stage_tracking 
                (workflow_id, stage_name, employee_id, status, result_data, processing_time_ms, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (workflow_id, stage_name, employee_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    result_data = EXCLUDED.result_data,
                    processing_time_ms = EXCLUDED.processing_time_ms,
                    notes = EXCLUDED.notes,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await this.db.query(query, [
                workflowId,
                stageName,
                employeeId,
                stageData.status,
                stageData.resultData ? JSON.stringify(stageData.resultData) : null,
                stageData.processingTimeMs || null,
                stageData.notes || null
            ]);
            
            logger.info(`Updated manual stage tracking for ${workflowId}:${stageName} by ${employeeId}`);
        } catch (error) {
            logger.error('Error updating manual stage tracking:', error);
            throw error;
        }
    }

    /**
     * Add application note
     */
    async addApplicationNote(workflowId, employeeId, employeeName, noteData) {
        try {
            const query = `
                INSERT INTO application_notes 
                (workflow_id, employee_id, employee_name, note_type, note_content, is_internal, visibility)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const result = await this.db.query(query, [
                workflowId,
                employeeId,
                employeeName,
                noteData.noteType || 'general',
                noteData.noteContent,
                noteData.isInternal !== false,
                noteData.visibility || 'team'
            ]);
            
            logger.info(`Added note to workflow ${workflowId} by ${employeeId}`);
            return result.rows[0].id;
        } catch (error) {
            logger.error('Error adding application note:', error);
            throw error;
        }
    }

    /**
     * Get application notes
     */
    async getApplicationNotes(workflowId, employeeId = null) {
        try {
            let query = `
                SELECT * FROM application_notes 
                WHERE workflow_id = $1
            `;
            const params = [workflowId];
            
            if (employeeId) {
                query += ` AND (visibility IN ('team', 'department', 'all') OR employee_id = $2)`;
                params.push(employeeId);
            }
            
            query += ` ORDER BY created_at DESC`;
            
            const result = await this.db.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Error getting application notes:', error);
            throw error;
        }
    }

    /**
     * Create escalation request
     */
    async createEscalationRequest(escalationData) {
        try {
            const escalationId = uuidv4();
            const query = `
                INSERT INTO escalation_requests 
                (escalation_id, workflow_id, requesting_employee_id, escalation_type, reason, priority)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await this.db.query(query, [
                escalationId,
                escalationData.workflowId,
                escalationData.requestingEmployeeId,
                escalationData.escalationType,
                escalationData.reason,
                escalationData.priority || 'medium'
            ]);
            
            logger.info(`Created escalation request ${escalationId} for workflow ${escalationData.workflowId}`);
            return escalationId;
        } catch (error) {
            logger.error('Error creating escalation request:', error);
            throw error;
        }
    }

    /**
     * Get employee notifications
     */
    async getEmployeeNotifications(employeeId, limit = 20, unreadOnly = false) {
        try {
            let query = `
                SELECT * FROM employee_notifications 
                WHERE employee_id = $1
            `;
            const params = [employeeId];
            
            if (unreadOnly) {
                query += ` AND is_read = FALSE`;
            }
            
            query += ` ORDER BY 
                CASE priority 
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    ELSE 3
                END,
                created_at DESC
                LIMIT $2
            `;
            params.push(limit);
            
            const result = await this.db.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Error getting employee notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId, employeeId) {
        try {
            const query = `
                UPDATE employee_notifications 
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
                WHERE id = $1 AND employee_id = $2
            `;
            
            const result = await this.db.query(query, [notificationId, employeeId]);
            
            if (result.rowCount > 0) {
                logger.info(`Marked notification ${notificationId} as read for employee ${employeeId}`);
            }
            
            return result.rowCount > 0;
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Log employee action for audit trail
     */
    async logEmployeeAction(actionData) {
        try {
            const query = `
                INSERT INTO employee_action_log 
                (workflow_id, employee_id, stage_name, action_type, action_result, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            await this.db.query(query, [
                actionData.workflowId,
                actionData.employeeId,
                actionData.stageName || null,
                actionData.actionType,
                actionData.actionResult ? JSON.stringify(actionData.actionResult) : null,
                actionData.ipAddress || null,
                actionData.userAgent || null
            ]);
            
            logger.debug(`Logged action ${actionData.actionType} for employee ${actionData.employeeId}`);
        } catch (error) {
            logger.error('Error logging employee action:', error);
            // Don't throw error for audit logging failures
        }
    }

    /**
     * Get workflow performance metrics
     */
    async getWorkflowPerformanceMetrics(dateRange = 30) {
        try {
            const query = `
                SELECT * FROM workflow_performance_summary
                WHERE workflow_date >= CURRENT_TIMESTAMP - INTERVAL '$1 days'
                ORDER BY workflow_date DESC
            `;
            
            const result = await this.db.query(query, [dateRange]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting workflow performance metrics:', error);
            throw error;
        }
    }

    /**
     * Get employee workload summary
     */
    async getEmployeeWorkloadSummary() {
        try {
            const query = 'SELECT * FROM employee_workload_summary ORDER BY utilization_percentage DESC';
            const result = await this.db.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Error getting employee workload summary:', error);
            throw error;
        }
    }

    /**
     * Get active workflows summary
     */
    async getActiveWorkflowsSummary() {
        try {
            const query = `
                SELECT * FROM active_workflows_summary 
                ORDER BY 
                    CASE 
                        WHEN hours_in_manual_phase > 8 THEN 1
                        WHEN hours_since_start > 24 THEN 2
                        ELSE 3
                    END,
                    created_at ASC
            `;
            
            const result = await this.db.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Error getting active workflows summary:', error);
            throw error;
        }
    }

    /**
     * Update employee assignment status
     */
    async updateEmployeeAssignmentStatus(workflowId, employeeId, status, completedAt = null) {
        try {
            let query = `
                UPDATE employee_assignments 
                SET status = $1, updated_at = CURRENT_TIMESTAMP
            `;
            const params = [status];
            let paramIndex = 2;
            
            if (status === 'in_progress' && !completedAt) {
                query += `, started_at = CURRENT_TIMESTAMP`;
            } else if (status === 'completed' && completedAt) {
                query += `, completed_at = $${paramIndex}`;
                params.push(completedAt);
                paramIndex++;
            }
            
            query += ` WHERE workflow_id = $${paramIndex} AND employee_id = $${paramIndex + 1}`;
            params.push(workflowId, employeeId);
            
            const result = await this.db.query(query, params);
            
            if (result.rowCount > 0) {
                logger.info(`Updated assignment status for ${workflowId}:${employeeId} to ${status}`);
            }
            
            return result.rowCount > 0;
        } catch (error) {
            logger.error('Error updating employee assignment status:', error);
            throw error;
        }
    }

    /**
     * Get system configuration
     */
    async getSystemConfig(configKey) {
        try {
            const query = `
                SELECT config_value FROM workflow_system_config 
                WHERE config_key = $1 AND is_active = TRUE
            `;
            
            const result = await this.db.query(query, [configKey]);
            
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].config_value);
            }
            
            return null;
        } catch (error) {
            logger.error('Error getting system config:', error);
            throw error;
        }
    }

    /**
     * Close database connection pool
     */
    async close() {
        // Connection is managed by the main database service
        logger.info('Dual-phase workflow database service closed');
    }

    /**
     * Health check for database connection
     */
    async healthCheck() {
        try {
            await this.db.query('SELECT 1');
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            logger.error('Database health check failed:', error);
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

module.exports = new DualPhaseWorkflowDatabaseService();