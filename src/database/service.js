/**
 * Enhanced LOS Database Service
 * Clean, efficient database operations for all application lifecycle
 */

const databaseConfig = require('../config/database');
const logger = require('../utils/logger');

class DatabaseService {
    constructor() {
        this.pool = null;
    }

    /**
     * Initialize database service
     */
    async initialize() {
        await databaseConfig.initialize();
        this.pool = databaseConfig.getPool();
        logger.info('Database service initialized');
    }

    // =====================================================
    // APPLICATION MANAGEMENT
    // =====================================================

    /**
     * Create new application
     */
    async createApplication(applicationData) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Generate application number
            const applicationNumber = this.generateApplicationNumber();
            
            // Insert main application
            const [appResult] = await connection.execute(`
                INSERT INTO loan_applications (
                    application_number, applicant_name, email, phone, pan_number, 
                    loan_amount, loan_purpose, employment_type, monthly_income, 
                    current_stage, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                applicationNumber,
                applicationData.applicant_name || 'Unknown',
                applicationData.email || 'unknown@example.com',
                applicationData.phone || '0000000000',
                applicationData.pan_number || 'UNKNOWN000',
                applicationData.loan_amount || 100000,
                applicationData.loan_purpose || 'Personal',
                applicationData.employment_type || 'salaried',
                applicationData.monthly_income || 50000,
                'pre_qualification',
                'pending'
            ]);
            
            const applicationId = appResult.insertId;
            
            // Create initial stage processing record
            await connection.execute(`
                INSERT INTO stage_processing (application_number, stage_name, status)
                VALUES (?, ?, ?)
            `, [applicationNumber, 'pre_qualification', 'pending']);
            
            // Create audit log
            await this.createAuditLog(connection, applicationId, 'application_created', 'pre_qualification', null, applicationData);
            
            await connection.commit();
            
            logger.info(`Created application: ${applicationNumber}`);
            return {
                success: true,
                applicationId,
                applicationNumber,
                createdAt: new Date()
            };
            
        } catch (error) {
            await connection.rollback();
            logger.error('Error creating application:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update application stage and status
     */
    async updateApplicationStage(applicationId, newStage, newStatus, stageResult = null) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get current stage/status
            const [currentApp] = await connection.execute(
                'SELECT current_stage, status FROM loan_applications WHERE id = ?',
                [applicationId]
            );
            
            if (currentApp.length === 0) {
                throw new Error('Application not found');
            }
            
            const oldStage = currentApp[0].current_stage;
            const oldStatus = currentApp[0].status;
            
            // Update application
            await connection.execute(`
                UPDATE loan_applications 
                SET current_stage = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newStage, newStatus, applicationId]);
            
            // Create audit log
            await this.createAuditLog(connection, applicationId, 'stage_updated', newStage,
                { stage: oldStage, status: oldStatus },
                { stage: newStage, status: newStatus, result: stageResult }
            );
            
            await connection.commit();
            
            logger.info(`Updated application ${applicationId} stage: ${oldStage} -> ${newStage}`);
            return { success: true };
            
        } catch (error) {
            await connection.rollback();
            logger.error('Error updating application stage:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Save verification results
     */
    async saveVerificationResults(applicationId, verificationData) {
        const connection = await this.pool.getConnection();
        
        try {
            // Get application number from ID
            const [app] = await connection.execute(
                'SELECT application_number FROM loan_applications WHERE id = ?',
                [applicationId]
            );
            
            if (!app.length) {
                throw new Error(`Application not found with ID: ${applicationId}`);
            }
            
            const applicationNumber = app[0].application_number;
            
            // Save verification results in external_verifications table
            const verificationTypes = ['pan', 'cibil', 'bank_statement', 'employment'];
            
            for (const type of verificationTypes) {
                if (verificationData[type]) {
                    await connection.execute(`
                        INSERT INTO external_verifications 
                        (application_number, verification_type, status, response_data, verification_score)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        response_data = VALUES(response_data),
                        verification_score = VALUES(verification_score),
                        updated_at = CURRENT_TIMESTAMP
                    `, [
                        applicationNumber,
                        type,
                        verificationData[type].status || 'completed',
                        JSON.stringify(verificationData[type]),
                        verificationData[type].score || 0
                    ]);
                }
            }
            
            // Create audit log
            await this.createAuditLog(connection, applicationId, 'verification_saved', 'pre_qualification', null, verificationData);
            
            logger.info(`Saved verification results for application ${applicationId}`);
            return { success: true };
            
        } catch (error) {
            logger.error('Error saving verification results:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Save eligibility decision
     */
    async saveEligibilityDecision(applicationId, stageName, decisionData) {
        const connection = await this.pool.getConnection();
        
        try {
            // Get application number from ID
            const [app] = await connection.execute(
                'SELECT application_number FROM loan_applications WHERE id = ?',
                [applicationId]
            );
            
            if (!app.length) {
                throw new Error(`Application not found with ID: ${applicationId}`);
            }
            
            const applicationNumber = app[0].application_number;
            
            // Extract loan terms properly
            let approvedAmount = null;
            let interestRate = null;
            let loanTenureMonths = null;
            
            if (decisionData.recommended_terms) {
                const terms = decisionData.recommended_terms;
                
                // Handle different loan_terms structures
                if (terms.loan_amount) {
                    if (typeof terms.loan_amount === 'object' && terms.loan_amount.maximum) {
                        approvedAmount = terms.loan_amount.maximum;
                    } else if (typeof terms.loan_amount === 'number') {
                        approvedAmount = terms.loan_amount;
                    }
                }
                
                if (terms.interest_rate) {
                    if (typeof terms.interest_rate === 'object' && terms.interest_rate.rate) {
                        interestRate = terms.interest_rate.rate;
                    } else if (typeof terms.interest_rate === 'number') {
                        interestRate = terms.interest_rate;
                    }
                }
                
                if (terms.tenure) {
                    if (typeof terms.tenure === 'object' && terms.tenure.preferred_months) {
                        loanTenureMonths = terms.tenure.preferred_months;
                    } else if (typeof terms.tenure === 'number') {
                        loanTenureMonths = terms.tenure;
                    }
                }
                
                // Fallback to direct properties if nested structure not found
                if (!approvedAmount && terms.approved_amount) {
                    approvedAmount = terms.approved_amount;
                }
                if (!interestRate && terms.interest_rate) {
                    interestRate = terms.interest_rate;
                }
                if (!loanTenureMonths && terms.tenure_months) {
                    loanTenureMonths = terms.tenure_months;
                }
            }
            
            // Insert decision record in credit_decisions table
            await connection.execute(`
                INSERT INTO credit_decisions (
                    application_number, decision, approved_amount, interest_rate, 
                    loan_tenure_months, conditions, risk_score, decision_factors, decided_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                applicationNumber,
                decisionData.decision,
                approvedAmount,
                interestRate,
                loanTenureMonths,
                decisionData.decision_reason || null,
                decisionData.decision_score || 0,
                JSON.stringify(decisionData.decision_factors || {}),
                decisionData.processed_by || 'system'
            ]);
            
            // Create audit log
            await this.createAuditLog(connection, applicationId, 'decision_saved', stageName, null, decisionData);
            
            logger.info(`Saved eligibility decision for application ${applicationId}: ${decisionData.decision}`);
            return { success: true };
            
        } catch (error) {
            logger.error('Error saving eligibility decision:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get complete application data
     */
    async getCompleteApplication(applicationNumber) {
        const connection = await this.pool.getConnection();
        
        try {
            // Get main application data
            const [applications] = await connection.execute(
                'SELECT * FROM loan_applications WHERE application_number = ?',
                [applicationNumber]
            );
            
            if (applications.length === 0) {
                return null;
            }
            
            const application = applications[0];
            
            // Get stage processing data
            const [stageProcessing] = await connection.execute(
                'SELECT * FROM stage_processing WHERE application_number = ? ORDER BY created_at DESC',
                [applicationNumber]
            );
            
            // Get verification data
            const [verifications] = await connection.execute(
                'SELECT * FROM external_verifications WHERE application_number = ? ORDER BY created_at DESC',
                [applicationNumber]
            );
            
            // Get credit decisions
            const [decisions] = await connection.execute(
                'SELECT * FROM credit_decisions WHERE application_number = ? ORDER BY decided_at DESC',
                [applicationNumber]
            );
            
            // Get audit logs
            const [auditLogs] = await connection.execute(
                'SELECT * FROM audit_logs WHERE application_number = ? ORDER BY created_at DESC LIMIT 10',
                [applicationNumber]
            );
            
            return {
                ...application,
                current_status: application.status, // Map status to current_status for service compatibility
                stage_processing: stageProcessing,
                verifications: verifications,
                decisions: decisions,
                recent_audit_logs: auditLogs
            };
            
        } catch (error) {
            logger.error('Error getting complete application:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get application status
     */
    async getApplicationStatus(applicationNumber) {
        const connection = await this.pool.getConnection();
        
        try {
            const [applications] = await connection.execute(
                'SELECT * FROM v_application_summary WHERE application_number = ?',
                [applicationNumber]
            );
            
            if (applications.length === 0) {
                return null;
            }
            
            return applications[0];
            
        } catch (error) {
            logger.error('Error getting application status:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Generate unique application number
     */
    generateApplicationNumber() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `EL_${timestamp}_${random}`;
    }

    /**
     * Create audit log entry
     */
    async createAuditLog(connection, applicationId, actionType, stageName, oldValues = null, newValues = null) {
        // Get application number from ID
        const [app] = await connection.execute(
            'SELECT application_number FROM loan_applications WHERE id = ?',
            [applicationId]
        );
        
        if (app.length > 0) {
            await connection.execute(`
                INSERT INTO audit_logs (
                    application_number, action, stage, 
                    user_id, request_data, response_data
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                app[0].application_number,
                actionType.substring(0, 100), // Truncate action to fit VARCHAR(100)
                stageName.substring(0, 50), // Truncate stage to fit VARCHAR(50)
                'system',
                JSON.stringify(oldValues || {}),
                JSON.stringify(newValues || {})
            ]);
        }
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        const connection = await this.pool.getConnection();
        
        try {
            const [tables] = await connection.execute(`
                SELECT table_name, table_rows, data_length, index_length
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY table_name
            `);
            
            const [appCount] = await connection.execute('SELECT COUNT(*) as count FROM loan_applications');
            const [recentApps] = await connection.execute(`
                SELECT COUNT(*) as count FROM loan_applications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            return {
                tables: tables,
                totalApplications: appCount[0].count,
                recentApplications: recentApps[0].count,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('Error getting database stats:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Close database connections
     */
    async close() {
        await databaseConfig.close();
        logger.info('Database service closed');
    }
}

// Export singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;