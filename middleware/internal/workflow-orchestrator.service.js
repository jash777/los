/**
 * Dual-Phase Workflow Orchestrator
 * Manages automated and manual phases of loan processing
 */

const logger = require('../utils/logger');
const db = require('../config/database');
const workflowConfig = require('../config/workflow-config.json');
const { v4: uuidv4 } = require('uuid');

// Import phase services
const PreQualificationService = require('../../components/pre-qualification/service');
const LoanApplicationService = require('../../components/loan-application/service');
const ApplicationProcessingService = require('../../components/application-processing/service');
const underwritingService = require('../../components/underwriting/service');
const creditDecisionService = require('../../components/credit-decision/service');
const qualityCheckService = require('../../components/quality-check/service');
const loanFundingService = require('../../components/loan-funding/service');

class DualPhaseWorkflowOrchestrator {
    constructor() {
        this.workflowConfig = workflowConfig;
        this.automatedServices = {
            'pre-qualification': new PreQualificationService(),
            'loan-application': new LoanApplicationService(),
            'application-processing': new ApplicationProcessingService(),
            'underwriting': underwritingService,
            'credit-decision': creditDecisionService,
            'quality-check': qualityCheckService
        };
        
        this.manualServices = {
            'loan-funding': loanFundingService
        };
        
        // Note: Employee assignment and phase tracking services will be implemented as needed
    }

    /**
     * Start complete dual-phase workflow
     */
    async startWorkflow(applicationData, options = {}) {
        const workflowId = uuidv4();
        const startTime = Date.now();
        
        try {
            logger.info(`[${workflowId}] Starting dual-phase workflow`, {
                applicantName: `${applicationData.personal_info?.first_name} ${applicationData.personal_info?.last_name}`,
                loanAmount: applicationData.loan_request?.requested_amount,
                workflowVersion: this.workflowConfig.workflow_version
            });

            // Initialize workflow tracking
            const workflowTracking = await this.initializeWorkflowTracking(workflowId, applicationData);
            
            // Phase 1: Automated Processing
            const automatedResult = await this.processAutomatedPhase(workflowId, applicationData, options);
            
            if (!automatedResult.success) {
                return await this.finalizeWorkflow(workflowId, {
                    success: false,
                    phase: 'automated',
                    result: automatedResult,
                    processingTime: Date.now() - startTime
                });
            }

            // Check if application qualifies for manual phase
            if (!this.qualifiesForManualPhase(automatedResult)) {
                return await this.finalizeWorkflow(workflowId, {
                    success: false,
                    phase: 'automated',
                    result: automatedResult,
                    reason: 'Does not qualify for manual phase',
                    processingTime: Date.now() - startTime
                });
            }

            // Phase 2: Manual Processing (Employee Assignment)
            const manualResult = await this.initiateManualPhase(workflowId, automatedResult, options);
            
            return await this.finalizeWorkflow(workflowId, {
                success: true,
                automatedPhase: automatedResult,
                manualPhase: manualResult,
                processingTime: Date.now() - startTime
            });

        } catch (error) {
            logger.error(`[${workflowId}] Workflow orchestration failed:`, error);
            return await this.handleWorkflowError(workflowId, error);
        }
    }

    /**
     * Process automated phase (pre-qualification through quality-check)
     */
    async processAutomatedPhase(workflowId, applicationData, options = {}) {
        const automatedPhaseConfig = this.workflowConfig.workflow_phases.automated_phase;
        const stages = automatedPhaseConfig.stages;
        const startTime = Date.now();
        
        const phaseResult = {
            workflowId,
            phase: 'automated',
            applicationId: null,
            stages: {},
            success: false,
            processingTime: 0,
            errors: [],
            warnings: []
        };

        try {
            logger.info(`[${workflowId}] Starting automated phase with ${stages.length} stages`);
            
            let currentData = applicationData;
            let shouldContinue = true;

            for (const stageName of stages) {
                if (!shouldContinue) break;

                logger.info(`[${workflowId}] Processing stage: ${stageName}`);
                const stageStartTime = Date.now();
                
                try {
                    const stageService = this.automatedServices[stageName];
                    if (!stageService) {
                        throw new Error(`Service not found for stage: ${stageName}`);
                    }

                    const stageResult = await this.processAutomatedStage(
                        stageName, 
                        stageService, 
                        currentData, 
                        workflowId
                    );
                    
                    const stageProcessingTime = Date.now() - stageStartTime;
                    
                    phaseResult.stages[stageName] = {
                        ...stageResult,
                        processingTime: stageProcessingTime,
                        timestamp: new Date().toISOString()
                    };

                    // Update application ID from first successful stage
                    if (!phaseResult.applicationId && stageResult.applicationId) {
                        phaseResult.applicationId = stageResult.applicationId;
                    }

                    // Check stage success
                    if (!stageResult.success) {
                        logger.warn(`[${workflowId}] Stage ${stageName} failed:`, stageResult.error);
                        shouldContinue = false;
                        phaseResult.errors.push({
                            stage: stageName,
                            error: stageResult.error,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        // Update current data for next stage
                        currentData = {
                            ...currentData,
                            applicationId: phaseResult.applicationId,
                            previousStageResults: phaseResult.stages
                        };
                    }

                    // Update phase tracking
                    await this.phaseTrackingService.updateStageStatus(
                        workflowId, 
                        stageName, 
                        stageResult.success ? 'completed' : 'failed',
                        stageResult
                    );

                } catch (stageError) {
                    logger.error(`[${workflowId}] Stage ${stageName} error:`, stageError);
                    shouldContinue = false;
                    phaseResult.errors.push({
                        stage: stageName,
                        error: stageError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Determine automated phase success
            phaseResult.success = shouldContinue && phaseResult.errors.length === 0;
            phaseResult.processingTime = Date.now() - startTime;

            // Validate completion criteria
            if (phaseResult.success) {
                phaseResult.success = this.validateAutomatedPhaseCompletion(phaseResult);
            }

            logger.info(`[${workflowId}] Automated phase completed:`, {
                success: phaseResult.success,
                processingTime: phaseResult.processingTime,
                stagesCompleted: Object.keys(phaseResult.stages).length,
                errors: phaseResult.errors.length
            });

            return phaseResult;

        } catch (error) {
            logger.error(`[${workflowId}] Automated phase failed:`, error);
            phaseResult.errors.push({
                phase: 'automated',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            phaseResult.processingTime = Date.now() - startTime;
            return phaseResult;
        }
    }

    /**
     * Process individual automated stage
     */
    async processAutomatedStage(stageName, stageService, data, workflowId) {
        const stageConfig = this.workflowConfig.stage_configurations[stageName];
        const timeout = stageConfig.processing_timeout || 300000;
        const retries = stageConfig.retry_attempts || 1;

        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger.debug(`[${workflowId}] Stage ${stageName} attempt ${attempt}/${retries}`);
                
                const stagePromise = stageService.process(data, { workflowId });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Stage processing timeout')), timeout)
                );

                const result = await Promise.race([stagePromise, timeoutPromise]);
                
                if (result && result.success !== false) {
                    return {
                        success: true,
                        data: result,
                        applicationId: result.applicationId || data.applicationId,
                        attempt: attempt
                    };
                }
                
                lastError = result.error || 'Stage processing failed';
                
            } catch (error) {
                lastError = error.message;
                logger.warn(`[${workflowId}] Stage ${stageName} attempt ${attempt} failed:`, error.message);
                
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                }
            }
        }

        return {
            success: false,
            error: lastError,
            attempts: retries
        };
    }

    /**
     * Initiate manual phase with employee assignment
     */
    async initiateManualPhase(workflowId, automatedResult, options = {}) {
        const manualPhaseConfig = this.workflowConfig.workflow_phases.manual_phase;
        const startTime = Date.now();
        
        try {
            logger.info(`[${workflowId}] Initiating manual phase`);

            // Determine employee assignment criteria
            const assignmentCriteria = this.determineAssignmentCriteria(automatedResult);
            
            // Assign employee
            const assignmentResult = await this.employeeAssignmentService.assignEmployee(
                workflowId,
                automatedResult.applicationId,
                assignmentCriteria
            );

            if (!assignmentResult.success) {
                throw new Error(`Employee assignment failed: ${assignmentResult.error}`);
            }

            // Create manual phase tracking
            const manualPhaseResult = {
                workflowId,
                phase: 'manual',
                applicationId: automatedResult.applicationId,
                assignedEmployee: assignmentResult.employee,
                assignmentTime: new Date().toISOString(),
                status: 'assigned',
                stages: {},
                processingTime: Date.now() - startTime
            };

            // Update phase tracking
            await this.phaseTrackingService.initiateManualPhase(
                workflowId,
                automatedResult.applicationId,
                assignmentResult.employee
            );

            // Send notification to assigned employee
            await this.notifyEmployeeAssignment(assignmentResult.employee, manualPhaseResult);

            logger.info(`[${workflowId}] Manual phase initiated:`, {
                assignedTo: assignmentResult.employee.name,
                employeeId: assignmentResult.employee.id,
                applicationId: automatedResult.applicationId
            });

            return manualPhaseResult;

        } catch (error) {
            logger.error(`[${workflowId}] Manual phase initiation failed:`, error);
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * Process manual phase stage (called by employee through dashboard)
     */
    async processManualStage(workflowId, stageName, employeeId, stageData) {
        try {
            logger.info(`[${workflowId}] Processing manual stage ${stageName} by employee ${employeeId}`);

            // Validate employee authorization
            const authResult = await this.validateEmployeeAuthorization(workflowId, employeeId, stageName);
            if (!authResult.authorized) {
                throw new Error(`Employee not authorized for this stage: ${authResult.reason}`);
            }

            const stageService = this.manualServices[stageName];
            if (!stageService) {
                throw new Error(`Manual service not found for stage: ${stageName}`);
            }

            const stageResult = await stageService.processManual(stageData, {
                workflowId,
                employeeId,
                employee: authResult.employee
            });

            // Update phase tracking
            await this.phaseTrackingService.updateManualStageStatus(
                workflowId,
                stageName,
                employeeId,
                stageResult.success ? 'completed' : 'failed',
                stageResult
            );

            return stageResult;

        } catch (error) {
            logger.error(`[${workflowId}] Manual stage processing failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate automated phase completion
     */
    validateAutomatedPhaseCompletion(phaseResult) {
        const completionCriteria = this.workflowConfig.workflow_phases.automated_phase.completion_criteria;
        
        // Check if all stages passed
        if (completionCriteria.all_stages_passed) {
            const allStagesPassed = Object.values(phaseResult.stages).every(stage => stage.success);
            if (!allStagesPassed) return false;
        }

        // Check quality check approval
        if (completionCriteria.quality_check_approved) {
            const qualityCheckResult = phaseResult.stages['quality-check'];
            if (!qualityCheckResult || !qualityCheckResult.data?.approved) return false;
        }

        // Check for manual review flags
        if (completionCriteria.no_manual_review_flags) {
            const hasManualReviewFlags = Object.values(phaseResult.stages).some(
                stage => stage.data?.requiresManualReview
            );
            if (hasManualReviewFlags) return false;
        }

        return true;
    }

    /**
     * Check if application qualifies for manual phase
     */
    qualifiesForManualPhase(automatedResult) {
        const transitionConditions = this.workflowConfig.workflow_phases.automated_phase.transition_conditions.to_manual_phase;
        
        // Check quality check status
        const qualityCheckResult = automatedResult.stages['quality-check'];
        if (transitionConditions.quality_check_status === 'passed') {
            if (!qualityCheckResult || !qualityCheckResult.data?.approved) return false;
        }

        // Check credit decision
        const creditDecisionResult = automatedResult.stages['credit-decision'];
        if (transitionConditions.credit_decision === 'approved') {
            if (!creditDecisionResult || creditDecisionResult.data?.decision !== 'approved') return false;
        }

        // Check compliance verification
        if (transitionConditions.compliance_verified) {
            const complianceVerified = Object.values(automatedResult.stages).every(
                stage => !stage.data?.complianceViolations
            );
            if (!complianceVerified) return false;
        }

        return true;
    }

    /**
     * Determine employee assignment criteria
     */
    determineAssignmentCriteria(automatedResult) {
        const loanAmount = automatedResult.stages['loan-application']?.data?.requestedAmount || 0;
        const riskLevel = automatedResult.stages['underwriting']?.data?.riskLevel || 'medium';
        const complexity = this.calculateApplicationComplexity(automatedResult);

        return {
            loanAmount,
            riskLevel,
            complexity,
            priority: this.calculatePriority(automatedResult),
            specialRequirements: this.identifySpecialRequirements(automatedResult)
        };
    }

    /**
     * Calculate application complexity
     */
    calculateApplicationComplexity(automatedResult) {
        let complexityScore = 0;
        
        // Check for flags and warnings across stages
        Object.values(automatedResult.stages).forEach(stage => {
            if (stage.data?.flags) complexityScore += stage.data.flags.length;
            if (stage.data?.warnings) complexityScore += stage.data.warnings.length * 0.5;
        });

        if (complexityScore >= 5) return 'high';
        if (complexityScore >= 2) return 'medium';
        return 'low';
    }

    /**
     * Calculate application priority
     */
    calculatePriority(automatedResult) {
        const loanAmount = automatedResult.stages['loan-application']?.data?.requestedAmount || 0;
        const customerTier = automatedResult.stages['pre-qualification']?.data?.customerTier || 'standard';
        
        if (customerTier === 'premium' || loanAmount > 1000000) return 'high';
        if (customerTier === 'gold' || loanAmount > 500000) return 'medium';
        return 'standard';
    }

    /**
     * Identify special requirements
     */
    identifySpecialRequirements(automatedResult) {
        const requirements = [];
        
        // Check for high-value loan
        const loanAmount = automatedResult.stages['loan-application']?.data?.requestedAmount || 0;
        if (loanAmount > 1000000) requirements.push('senior_approval');
        
        // Check for complex risk factors
        const riskLevel = automatedResult.stages['underwriting']?.data?.riskLevel;
        if (riskLevel === 'high') requirements.push('risk_specialist');
        
        // Check for compliance concerns
        const hasComplianceConcerns = Object.values(automatedResult.stages).some(
            stage => stage.data?.complianceConcerns
        );
        if (hasComplianceConcerns) requirements.push('compliance_review');
        
        return requirements;
    }

    /**
     * Validate employee authorization
     */
    async validateEmployeeAuthorization(workflowId, employeeId, stageName) {
        try {
            // Get employee details
            const employee = await this.getEmployeeDetails(employeeId);
            if (!employee) {
                return { authorized: false, reason: 'Employee not found' };
            }

            // Check if employee is assigned to this workflow
            const assignment = await this.phaseTrackingService.getEmployeeAssignment(workflowId);
            if (!assignment || assignment.employeeId !== employeeId) {
                return { authorized: false, reason: 'Employee not assigned to this workflow' };
            }

            // Check stage permissions
            const roleConfig = this.workflowConfig.employee_roles[employee.role];
            if (!roleConfig) {
                return { authorized: false, reason: 'Invalid employee role' };
            }

            // Additional authorization checks can be added here
            
            return {
                authorized: true,
                employee,
                roleConfig
            };

        } catch (error) {
            logger.error(`Authorization validation failed:`, error);
            return { authorized: false, reason: 'Authorization check failed' };
        }
    }

    /**
     * Initialize workflow tracking
     */
    async initializeWorkflowTracking(workflowId, applicationData) {
        try {
            const trackingData = {
                workflow_id: workflowId,
                workflow_version: this.workflowConfig.workflow_version,
                application_data: JSON.stringify(applicationData),
                current_phase: 'automated',
                status: 'in_progress',
                created_at: new Date(),
                updated_at: new Date()
            };

            const query = `
                INSERT INTO workflow_tracking 
                (workflow_id, workflow_version, application_data, current_phase, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            const params = Object.values(trackingData);
            logger.debug(`[${workflowId}] SQL Query:`, query);
            logger.debug(`[${workflowId}] Parameters:`, params);
            
            await db.query(query, params);
            
            logger.info(`[${workflowId}] Workflow tracking initialized`);
            return trackingData;

        } catch (error) {
            logger.error(`[${workflowId}] Failed to initialize workflow tracking:`, error);
            throw error;
        }
    }

    /**
     * Finalize workflow
     */
    async finalizeWorkflow(workflowId, result) {
        try {
            const finalResult = {
                workflowId,
                success: result.success,
                completedAt: new Date().toISOString(),
                totalProcessingTime: result.processingTime,
                ...result
            };

            // Update workflow tracking
            await this.updateWorkflowStatus(workflowId, result.success ? 'completed' : 'failed', finalResult);
            
            logger.info(`[${workflowId}] Workflow finalized:`, {
                success: result.success,
                processingTime: result.processingTime
            });

            return finalResult;

        } catch (error) {
            logger.error(`[${workflowId}] Failed to finalize workflow:`, error);
            return {
                workflowId,
                success: false,
                error: error.message,
                ...result
            };
        }
    }

    /**
     * Handle workflow error
     */
    async handleWorkflowError(workflowId, error) {
        try {
            await this.updateWorkflowStatus(workflowId, 'error', { error: error.message });
            
            return {
                workflowId,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };

        } catch (updateError) {
            logger.error(`[${workflowId}] Failed to handle workflow error:`, updateError);
            return {
                workflowId,
                success: false,
                error: error.message,
                updateError: updateError.message
            };
        }
    }

    /**
     * Update workflow status
     */
    async updateWorkflowStatus(workflowId, status, data = {}) {
        try {
            const query = `
                UPDATE workflow_tracking 
                SET status = $1, result_data = $2, updated_at = $3
                WHERE workflow_id = $4
            `;

            await db.query(query, [
                status,
                JSON.stringify(data),
                new Date(),
                workflowId
            ]);

        } catch (error) {
            logger.error(`Failed to update workflow status:`, error);
            throw error;
        }
    }

    /**
     * Get employee details
     */
    async getEmployeeDetails(employeeId) {
        try {
            const query = `
                SELECT id, name, email, role, department, specializations, max_concurrent_applications
                FROM employees 
                WHERE id = $1 AND status = 'active'
            `;

            const result = await db.query(query, [employeeId]);
        const rows = result.rows;
            return rows[0] || null;

        } catch (error) {
            logger.error(`Failed to get employee details:`, error);
            return null;
        }
    }

    /**
     * Notify employee assignment
     */
    async notifyEmployeeAssignment(employee, manualPhaseResult) {
        try {
            // Implementation for employee notification
            // This could be email, SMS, in-app notification, etc.
            logger.info(`Notifying employee ${employee.name} of new assignment:`, {
                workflowId: manualPhaseResult.workflowId,
                applicationId: manualPhaseResult.applicationId
            });

            // Add actual notification logic here
            
        } catch (error) {
            logger.error(`Failed to notify employee assignment:`, error);
        }
    }

    /**
     * Get automated processing results from phases
     */
    async getAutomatedResults(options = {}) {
        const { limit = 10, offset = 0 } = options;
        
        try {
            const query = `
                SELECT 
                    wt.id,
                    wt.application_id,
                    wt.stage_name,
                    wt.stage_status,
                    wt.started_at,
                    wt.completed_at,
                    wt.stage_data,
                    wt.created_at,
                    wt.updated_at
                FROM workflow_tracking wt
                WHERE wt.stage_status IN ('completed', 'in_progress')
                ORDER BY wt.updated_at DESC
                LIMIT $1 OFFSET $2
            `;
            
            const result = await db.query(query, [limit, offset]);
            
            return result.rows.map(row => {
                const stageData = row.stage_data || {};
                
                return {
                    id: row.id,
                    applicationId: row.application_id,
                    stageName: row.stage_name,
                    status: row.stage_status,
                    startedAt: row.started_at,
                    completedAt: row.completed_at,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    stageData: stageData
                };
            });
            
        } catch (error) {
            logger.error('Error getting automated results:', error);
            throw error;
        }
    }
}

/**
 * Employee Assignment Service
 */
class EmployeeAssignmentService {
    constructor() {
        this.workflowConfig = workflowConfig;
    }

    async assignEmployee(workflowId, applicationId, criteria) {
        try {
            logger.info(`[${workflowId}] Assigning employee with criteria:`, criteria);

            // Get available employees
            const availableEmployees = await this.getAvailableEmployees(criteria);
            if (availableEmployees.length === 0) {
                throw new Error('No available employees for assignment');
            }

            // Apply assignment algorithm
            const selectedEmployee = await this.selectBestEmployee(availableEmployees, criteria);
            
            // Create assignment record
            await this.createAssignmentRecord(workflowId, applicationId, selectedEmployee, criteria);
            
            // Update employee workload
            await this.updateEmployeeWorkload(selectedEmployee.id, 1);

            logger.info(`[${workflowId}] Employee assigned:`, {
                employeeId: selectedEmployee.id,
                employeeName: selectedEmployee.name,
                role: selectedEmployee.role
            });

            return {
                success: true,
                employee: selectedEmployee,
                assignmentTime: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`[${workflowId}] Employee assignment failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAvailableEmployees(criteria) {
        try {
            let query = `
                SELECT e.*, 
                       COALESCE(w.current_workload, 0) as current_workload,
                       e.max_concurrent_applications
                FROM employees e
                LEFT JOIN (
                    SELECT employee_id, COUNT(*) as current_workload
                    FROM employee_assignments 
                    WHERE status IN ('assigned', 'in_progress')
                    GROUP BY employee_id
                ) w ON e.id = w.employee_id
                WHERE e.status = 'active'
                  AND COALESCE(w.current_workload, 0) < e.max_concurrent_applications
            `;

            const params = [];

            // Filter by loan amount authorization
            if (criteria.loanAmount) {
                const roleConfig = this.workflowConfig.employee_roles;
                const authorizedRoles = Object.keys(roleConfig).filter(role => {
                    const config = roleConfig[role];
                    return config.permissions.some(perm => 
                        perm.includes('approve_loans') && 
                        this.extractMaxAmount(perm) >= criteria.loanAmount
                    );
                });
                
                if (authorizedRoles.length > 0) {
                    query += ` AND e.role IN (${authorizedRoles.map(() => '?').join(',')})`;
                    params.push(...authorizedRoles);
                }
            }

            // Filter by specializations
            if (criteria.specialRequirements && criteria.specialRequirements.length > 0) {
                query += ` AND (`;
                const specializationConditions = criteria.specialRequirements.map((req, index) => {
                    params.push(req);
                    return `e.specializations::jsonb ? $${params.length}`;
                }).join(' OR ');
                query += specializationConditions + `)`;
            }

            query += ` ORDER BY current_workload ASC, e.role DESC`;

            const result = await db.query(query, params);
        const rows = result.rows;
            return rows;

        } catch (error) {
            logger.error(`Failed to get available employees:`, error);
            return [];
        }
    }

    async selectBestEmployee(employees, criteria) {
        // Implement weighted scoring algorithm
        const scoredEmployees = employees.map(employee => {
            let score = 0;
            
            // Workload factor (lower workload = higher score)
            const workloadFactor = (employee.max_concurrent_applications - employee.current_workload) / employee.max_concurrent_applications;
            score += workloadFactor * 40;
            
            // Role suitability factor
            const roleSuitability = this.calculateRoleSuitability(employee.role, criteria);
            score += roleSuitability * 30;
            
            // Specialization match factor
            const specializationMatch = this.calculateSpecializationMatch(employee.specializations, criteria);
            score += specializationMatch * 20;
            
            // Experience factor (can be added based on employee data)
            score += 10; // Base experience score
            
            return {
                ...employee,
                assignmentScore: score
            };
        });

        // Sort by score and return best match
        scoredEmployees.sort((a, b) => b.assignmentScore - a.assignmentScore);
        return scoredEmployees[0];
    }

    calculateRoleSuitability(role, criteria) {
        const roleHierarchy = {
            'loan_officer': 1,
            'senior_loan_officer': 2,
            'branch_manager': 3
        };

        const requiredLevel = this.determineRequiredRoleLevel(criteria);
        const employeeLevel = roleHierarchy[role] || 1;
        
        if (employeeLevel >= requiredLevel) {
            return employeeLevel === requiredLevel ? 100 : 80; // Prefer exact match
        }
        return 0; // Not suitable
    }

    determineRequiredRoleLevel(criteria) {
        if (criteria.loanAmount > 1000000 || criteria.complexity === 'high') return 3;
        if (criteria.loanAmount > 500000 || criteria.complexity === 'medium') return 2;
        return 1;
    }

    calculateSpecializationMatch(employeeSpecializations, criteria) {
        if (!criteria.specialRequirements || criteria.specialRequirements.length === 0) return 50;
        
        const specializations = JSON.parse(employeeSpecializations || '[]');
        const matchCount = criteria.specialRequirements.filter(req => 
            specializations.includes(req)
        ).length;
        
        return (matchCount / criteria.specialRequirements.length) * 100;
    }

    extractMaxAmount(permission) {
        const match = permission.match(/approve_loans_up_to_(\d+)k?/);
        if (match) {
            const amount = parseInt(match[1]);
            return permission.includes('k') ? amount * 1000 : amount;
        }
        return 0;
    }

    async createAssignmentRecord(workflowId, applicationId, employee, criteria) {
        try {
            const query = `
                INSERT INTO employee_assignments 
                (workflow_id, application_id, employee_id, employee_name, employee_role, 
                 assignment_criteria, status, assigned_at, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'assigned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;

            await db.query(query, [
                workflowId,
                applicationId,
                employee.id,
                employee.name,
                employee.role,
                JSON.stringify(criteria)
            ]);

        } catch (error) {
            logger.error(`Failed to create assignment record:`, error);
            throw error;
        }
    }

    async updateEmployeeWorkload(employeeId, increment) {
        try {
            // This could be implemented as a separate workload tracking table
            // For now, we'll rely on the assignment count query
            logger.debug(`Updated workload for employee ${employeeId} by ${increment}`);
        } catch (error) {
            logger.error(`Failed to update employee workload:`, error);
        }
    }
}

/**
 * Phase Tracking Service
 */
class PhaseTrackingService {
    async updateStageStatus(workflowId, stageName, status, result) {
        try {
            const query = `
                INSERT INTO workflow_stage_tracking 
                (workflow_id, stage_name, status, result_data, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (workflow_id, stage_name) DO UPDATE SET
                status = EXCLUDED.status, 
                result_data = EXCLUDED.result_data, 
                updated_at = EXCLUDED.updated_at
            `;

            await db.query(query, [
                workflowId,
                stageName,
                status,
                JSON.stringify(result)
            ]);

        } catch (error) {
            logger.error(`Failed to update stage status:`, error);
        }
    }

    async initiateManualPhase(workflowId, applicationId, employee) {
        try {
            const query = `
                UPDATE workflow_tracking 
                SET current_phase = 'manual', 
                    assigned_employee_id = $1,
                    assigned_employee_name = $2,
                    manual_phase_started_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE workflow_id = $3
            `;

            await db.query(query, [
                employee.id,
                employee.name,
                workflowId
            ]);

        } catch (error) {
            logger.error(`Failed to initiate manual phase:`, error);
            throw error;
        }
    }

    async updateManualStageStatus(workflowId, stageName, employeeId, status, result) {
        try {
            const query = `
                INSERT INTO manual_stage_tracking 
                (workflow_id, stage_name, employee_id, status, result_data, updated_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                ON CONFLICT (workflow_id, stage_name, employee_id) DO UPDATE SET
                status = EXCLUDED.status, 
                result_data = EXCLUDED.result_data, 
                updated_at = EXCLUDED.updated_at
            `;

            await db.query(query, [
                workflowId,
                stageName,
                employeeId,
                status,
                JSON.stringify(result)
            ]);

        } catch (error) {
            logger.error(`Failed to update manual stage status:`, error);
        }
    }

    async getEmployeeAssignment(workflowId) {
        try {
            const query = `
                SELECT employee_id as employeeId, employee_name, employee_role, assigned_at
                FROM employee_assignments 
                WHERE workflow_id = $1 AND status IN ('assigned', 'in_progress')
                ORDER BY assigned_at DESC
                LIMIT 1
            `;

            const result = await db.query(query, [workflowId]);
        const rows = result.rows;
            return rows[0] || null;

        } catch (error) {
            logger.error(`Failed to get employee assignment:`, error);
            return null;
        }
    }
}

module.exports = {
    DualPhaseWorkflowOrchestrator,
    startWorkflow: (applicationData, options) => {
        const orchestrator = new DualPhaseWorkflowOrchestrator();
        return orchestrator.startWorkflow(applicationData, options);
    },
    getWorkflowStatus: async (workflowId) => {
        const orchestrator = new DualPhaseWorkflowOrchestrator();
        return await orchestrator.getWorkflowStatus(workflowId);
    },
    processAutomatedPhase: async (workflowId, applicationData, options) => {
        const orchestrator = new DualPhaseWorkflowOrchestrator();
        return await orchestrator.processAutomatedPhase(workflowId, applicationData, options);
    },
    initiateManualPhase: async (workflowId, automatedResult, options) => {
        const orchestrator = new DualPhaseWorkflowOrchestrator();
        return await orchestrator.initiateManualPhase(workflowId, automatedResult, options);
    }
};