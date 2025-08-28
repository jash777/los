/**
 * Manual Workflow Service
 * Handles manual approval workflow for loan applications
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');

class ManualWorkflowService {
    constructor() {
        this.workflowRules = new Map();
        this.loadWorkflowRules();
    }

    /**
     * Load workflow rules from database
     */
    async loadWorkflowRules() {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            const [rules] = await connection.execute(`
                SELECT * FROM workflow_rules WHERE is_active = TRUE ORDER BY stage_name, priority
            `);
            
            rules.forEach(rule => {
                const key = `${rule.stage_name}_${rule.condition_type}`;
                if (!this.workflowRules.has(key)) {
                    this.workflowRules.set(key, []);
                }
                this.workflowRules.get(key).push(rule);
            });
            
            connection.release();
            logger.info(`Loaded ${rules.length} workflow rules`);
            
        } catch (error) {
            logger.error('Error loading workflow rules:', error);
        }
    }

    /**
     * Check if application requires manual review
     */
    async requiresManualReview(applicationNumber, stageName, applicationData) {
        try {
            const rules = this.workflowRules.get(`${stageName}_score_based`) || [];
            const amountRules = this.workflowRules.get(`${stageName}_amount_based`) || [];
            const riskRules = this.workflowRules.get(`${stageName}_risk_based`) || [];
            
            // Check score-based rules
            if (applicationData.overall_score) {
                for (const rule of rules) {
                    const criteria = rule.condition_criteria;
                    if (criteria.min_score && applicationData.overall_score >= criteria.min_score &&
                        criteria.max_score && applicationData.overall_score <= criteria.max_score) {
                        return {
                            requiresReview: rule.action === 'manual_review',
                            action: rule.action,
                            priority: rule.priority,
                            reviewerRole: rule.reviewer_role,
                            rule: rule.rule_name
                        };
                    }
                }
            }

            // Check amount-based rules
            if (applicationData.loan_amount) {
                for (const rule of amountRules) {
                    const criteria = rule.condition_criteria;
                    if (criteria.loan_amount_threshold && applicationData.loan_amount >= criteria.loan_amount_threshold) {
                        return {
                            requiresReview: rule.action === 'manual_review',
                            action: rule.action,
                            priority: rule.priority,
                            reviewerRole: rule.reviewer_role,
                            rule: rule.rule_name
                        };
                    }
                }
            }

            // Check risk-based rules
            if (applicationData.risk_category) {
                for (const rule of riskRules) {
                    const criteria = rule.condition_criteria;
                    if (criteria.risk_categories && criteria.risk_categories.includes(applicationData.risk_category)) {
                        return {
                            requiresReview: rule.action === 'manual_review',
                            action: rule.action,
                            priority: rule.priority,
                            reviewerRole: rule.reviewer_role,
                            rule: rule.rule_name
                        };
                    }
                }
            }

            return { requiresReview: false, action: 'auto_approve' };
            
        } catch (error) {
            logger.error('Error checking manual review requirement:', error);
            return { requiresReview: true, action: 'manual_review', priority: 'high' }; // Default to manual review on error
        }
    }

    /**
     * Add application to manual review queue
     */
    async addToManualReviewQueue(applicationNumber, stageName, reviewType, priority = 'normal', assignedTo = null) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            // Calculate due date based on priority
            const dueDate = this.calculateDueDate(priority);
            
            await connection.execute(`
                INSERT INTO manual_review_queue 
                (application_number, stage_name, priority, assigned_to, review_type, due_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                priority = VALUES(priority),
                assigned_to = VALUES(assigned_to),
                due_date = VALUES(due_date),
                status = 'pending'
            `, [applicationNumber, stageName, priority, assignedTo, reviewType, dueDate, assignedTo ? 'assigned' : 'pending']);
            
            // Update reviewer workload if assigned
            if (assignedTo) {
                await connection.execute(`
                    UPDATE reviewers 
                    SET current_workload = current_workload + 1 
                    WHERE employee_id = ?
                `, [assignedTo]);
            }
            
            connection.release();
            
            logger.info(`Added ${applicationNumber} to manual review queue for ${stageName} (${reviewType})`);
            
            return { success: true, dueDate };
            
        } catch (error) {
            logger.error('Error adding to manual review queue:', error);
            throw error;
        }
    }

    /**
     * Assign application to reviewer
     */
    async assignToReviewer(applicationNumber, stageName, reviewerId, assignedBy = 'system') {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            await connection.beginTransaction();
            
            // Update manual review queue
            await connection.execute(`
                UPDATE manual_review_queue 
                SET assigned_to = ?, assigned_at = CURRENT_TIMESTAMP, status = 'assigned'
                WHERE application_number = ? AND stage_name = ?
            `, [reviewerId, applicationNumber, stageName]);
            
            // Create workflow assignment
            await connection.execute(`
                INSERT INTO workflow_assignments 
                (application_number, stage_name, assigned_to, assigned_by, assignment_reason)
                VALUES (?, ?, ?, ?, ?)
            `, [applicationNumber, stageName, reviewerId, assignedBy, 'Manual review assignment']);
            
            // Update reviewer workload
            await connection.execute(`
                UPDATE reviewers 
                SET current_workload = current_workload + 1 
                WHERE employee_id = ?
            `, [reviewerId]);
            
            await connection.commit();
            connection.release();
            
            logger.info(`Assigned ${applicationNumber} to reviewer ${reviewerId} for ${stageName}`);
            
            return { success: true };
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            logger.error('Error assigning to reviewer:', error);
            throw error;
        }
    }

    /**
     * Get available reviewers for a stage
     */
    async getAvailableReviewers(stageName, loanAmount = 0) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            // Get reviewers who can handle this loan amount and aren't overloaded
            const [reviewers] = await connection.execute(`
                SELECT 
                    r.*,
                    (r.max_workload - r.current_workload) as available_capacity,
                    COUNT(mrq.id) as current_queue_items
                FROM reviewers r
                LEFT JOIN manual_review_queue mrq ON r.employee_id = mrq.assigned_to 
                    AND mrq.status IN ('assigned', 'in_review')
                WHERE r.is_active = TRUE 
                    AND r.max_loan_amount_authority >= ?
                    AND r.current_workload < r.max_workload
                GROUP BY r.id
                ORDER BY available_capacity DESC, current_queue_items ASC
                LIMIT 10
            `, [loanAmount]);
            
            connection.release();
            
            return reviewers;
            
        } catch (error) {
            logger.error('Error getting available reviewers:', error);
            throw error;
        }
    }

    /**
     * Auto-assign application to best available reviewer
     */
    async autoAssignReviewer(applicationNumber, stageName, reviewType, loanAmount = 0) {
        try {
            const availableReviewers = await this.getAvailableReviewers(stageName, loanAmount);
            
            if (availableReviewers.length === 0) {
                logger.warn(`No available reviewers for ${applicationNumber} at ${stageName}`);
                return { success: false, reason: 'No available reviewers' };
            }
            
            // Select best reviewer (first in the sorted list)
            const bestReviewer = availableReviewers[0];
            
            await this.assignToReviewer(applicationNumber, stageName, bestReviewer.employee_id, 'auto_assignment');
            
            return { 
                success: true, 
                assignedTo: bestReviewer.employee_id,
                reviewerName: bestReviewer.employee_name
            };
            
        } catch (error) {
            logger.error('Error auto-assigning reviewer:', error);
            throw error;
        }
    }

    /**
     * Process manual decision
     */
    async processManualDecision(applicationNumber, stageName, reviewerId, decision, decisionData) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            await connection.beginTransaction();
            
            // Get reviewer info
            const [reviewer] = await connection.execute(
                'SELECT employee_name FROM reviewers WHERE employee_id = ?',
                [reviewerId]
            );
            
            const reviewerName = reviewer[0]?.employee_name || 'Unknown';
            
            // Save manual decision
            await connection.execute(`
                INSERT INTO manual_decisions 
                (application_number, stage_name, reviewer_id, reviewer_name, decision, 
                 decision_reason, conditions, risk_assessment, recommended_terms, 
                 internal_notes, time_spent_minutes, decision_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                applicationNumber, stageName, reviewerId, reviewerName, decision,
                decisionData.decision_reason || '',
                decisionData.conditions || null,
                JSON.stringify(decisionData.risk_assessment || {}),
                JSON.stringify(decisionData.recommended_terms || {}),
                decisionData.internal_notes || null,
                decisionData.time_spent_minutes || 0,
                decisionData.decision_score || 0
            ]);
            
            // Update manual review queue
            await connection.execute(`
                UPDATE manual_review_queue 
                SET status = 'completed'
                WHERE application_number = ? AND stage_name = ?
            `, [applicationNumber, stageName]);
            
            // Update workflow assignment
            await connection.execute(`
                UPDATE workflow_assignments 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE application_number = ? AND stage_name = ? AND assigned_to = ?
            `, [applicationNumber, stageName, reviewerId]);
            
            // Update reviewer workload
            await connection.execute(`
                UPDATE reviewers 
                SET current_workload = GREATEST(current_workload - 1, 0)
                WHERE employee_id = ?
            `, [reviewerId]);
            
            // Update main application status based on decision
            const applicationStatus = this.mapDecisionToApplicationStatus(decision);
            
            // Get application ID
            const [app] = await connection.execute(
                'SELECT id FROM loan_applications WHERE application_number = ?',
                [applicationNumber]
            );
            
            if (app.length > 0) {
                await connection.execute(`
                    UPDATE loan_applications 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [applicationStatus, app[0].id]);
                
                // Save decision to credit_decisions table
                if (decision === 'approved' || decision === 'conditional_approval') {
                    const terms = decisionData.recommended_terms || {};
                    await connection.execute(`
                        INSERT INTO credit_decisions 
                        (application_number, decision, approved_amount, interest_rate, 
                         loan_tenure_months, conditions, risk_score, decision_factors, decided_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        applicationNumber, decision,
                        terms.loan_amount || null,
                        terms.interest_rate || null,
                        terms.tenure_months || null,
                        decisionData.conditions || null,
                        decisionData.decision_score || 0,
                        JSON.stringify(decisionData.decision_factors || {}),
                        reviewerId
                    ]);
                }
            }
            
            await connection.commit();
            connection.release();
            
            logger.info(`Manual decision processed: ${applicationNumber} ${decision} by ${reviewerId}`);
            
            return { success: true, decision, applicationStatus };
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            logger.error('Error processing manual decision:', error);
            throw error;
        }
    }

    /**
     * Get pending reviews for a reviewer
     */
    async getPendingReviews(reviewerId = null, limit = 20) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT * FROM v_pending_manual_reviews
                WHERE queue_status IN ('pending', 'assigned', 'in_review')
            `;
            let params = [];
            
            if (reviewerId) {
                query += ' AND assigned_to = ?';
                params.push(reviewerId);
            }
            
            query += ' ORDER BY urgency_level, priority, created_at LIMIT ?';
            params.push(limit);
            
            const [reviews] = await connection.execute(query, params);
            
            connection.release();
            
            return reviews;
            
        } catch (error) {
            logger.error('Error getting pending reviews:', error);
            throw error;
        }
    }

    /**
     * Get reviewer workload
     */
    async getReviewerWorkload(reviewerId = null) {
        try {
            await databaseService.initialize();
            const connection = await databaseService.pool.getConnection();
            
            let query = 'SELECT * FROM v_reviewer_workload';
            let params = [];
            
            if (reviewerId) {
                query += ' WHERE employee_id = ?';
                params.push(reviewerId);
            }
            
            query += ' ORDER BY availability_status, role, employee_name';
            
            const [workload] = await connection.execute(query, params);
            
            connection.release();
            
            return workload;
            
        } catch (error) {
            logger.error('Error getting reviewer workload:', error);
            throw error;
        }
    }

    // Helper methods
    calculateDueDate(priority) {
        const now = new Date();
        const hoursToAdd = {
            'urgent': 4,
            'high': 12,
            'normal': 24,
            'low': 48
        };
        
        now.setHours(now.getHours() + (hoursToAdd[priority] || 24));
        return now;
    }

    mapDecisionToApplicationStatus(decision) {
        const mapping = {
            'approved': 'approved',
            'rejected': 'rejected',
            'conditional_approval': 'approved',
            'refer_back': 'under_review',
            'escalate': 'under_review'
        };
        
        return mapping[decision] || 'under_review';
    }
}

module.exports = new ManualWorkflowService();
