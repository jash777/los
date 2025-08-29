/**
 * Enhanced LOS Database Service
 * Clean, efficient database operations for all application lifecycle
 */

const databaseConfig = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.applicationsDir = path.join(__dirname, '../../applications');
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
     * Create new application with dual storage (DB + File)
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
            
            // Create file-based storage
            await this.createApplicationFile(applicationNumber, applicationData);
            
            logger.info(`Created application: ${applicationNumber} (DB + File)`);
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
     * Update application stage and status with dual storage
     */
    async updateApplicationStage(applicationId, newStage, newStatus, stageResult = null) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get current stage/status and application number
            const [currentApp] = await connection.execute(
                'SELECT current_stage, status, application_number FROM loan_applications WHERE id = ?',
                [applicationId]
            );
            
            if (currentApp.length === 0) {
                throw new Error('Application not found');
            }
            
            const oldStage = currentApp[0].current_stage;
            const oldStatus = currentApp[0].status;
            const applicationNumber = currentApp[0].application_number;
            
            // Update application
            await connection.execute(`
                UPDATE loan_applications 
                SET current_stage = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newStage, newStatus, applicationId]);
            
            // Map application status to stage processing status
            const stageProcessingStatus = this.mapApplicationStatusToStageStatus(newStatus);
            
            // Check if stage_processing record exists, if not create it
            const [existingStage] = await connection.execute(
                'SELECT id FROM stage_processing WHERE application_number = ? AND stage_name = ?',
                [applicationNumber, newStage]
            );
            
            if (existingStage.length > 0) {
                // Update existing stage processing record
                await connection.execute(`
                    UPDATE stage_processing 
                    SET status = ?, completed_at = CURRENT_TIMESTAMP, result_data = ?
                    WHERE application_number = ? AND stage_name = ?
                `, [stageProcessingStatus, JSON.stringify(stageResult), applicationNumber, newStage]);
            } else {
                // Create new stage processing record
                await connection.execute(`
                    INSERT INTO stage_processing 
                    (application_number, stage_name, status, started_at, completed_at, result_data)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
                `, [applicationNumber, newStage, stageProcessingStatus, JSON.stringify(stageResult)]);
            }
            
            // Create audit log
            await this.createAuditLog(connection, applicationId, 'stage_updated', newStage,
                { stage: oldStage, status: oldStatus },
                { stage: newStage, status: newStatus, result: stageResult }
            );
            
            await connection.commit();
            
            // Update file-based storage
            await this.updateApplicationFile(applicationNumber, newStage, newStatus, stageResult);
            
            logger.info(`Updated application ${applicationId} stage: ${oldStage} -> ${newStage} (DB + File)`);
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
                        verificationData[type].status || 'verified',
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
     * Get complete application data from database
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
            
            // Get stage processing data (using correct column name)
            const [stageProcessing] = await connection.execute(
                'SELECT * FROM stage_processing WHERE application_number = ? ORDER BY started_at DESC',
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
                'SELECT * FROM loan_applications WHERE application_number = ?',
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
    // FILE-BASED STORAGE
    // =====================================================

    /**
     * Create application file structure
     */
    async createApplicationFile(applicationNumber, applicationData) {
        try {
            const appDir = path.join(this.applicationsDir, applicationNumber);
            
            // Create directory structure
            await fs.mkdir(appDir, { recursive: true });
            await fs.mkdir(path.join(appDir, 'documents'), { recursive: true });
            await fs.mkdir(path.join(appDir, 'third-party-data'), { recursive: true });
            await fs.mkdir(path.join(appDir, 'communications'), { recursive: true });
            await fs.mkdir(path.join(appDir, 'processing-logs'), { recursive: true });
            
            // Create initial application data file
            const appData = {
                application_info: {
                    application_number: applicationNumber,
                    created_at: new Date().toISOString(),
                    last_updated: new Date().toISOString(),
                    current_stage: 'pre_qualification',
                    status: 'pending'
                },
                stage_1_data: {
                    personal_details: {
                        full_name: applicationData.applicant_name,
                        mobile: applicationData.phone,
                        email: applicationData.email,
                        pan_number: applicationData.pan_number,
                        date_of_birth: applicationData.dateOfBirth
                    },
                    loan_request: {
                        loan_amount: applicationData.loan_amount,
                        loan_purpose: applicationData.loan_purpose,
                        preferred_tenure_months: 36
                    }
                },
                stage_2_data: {
                    employment_details: {
                        employment_type: null,
                        company_name: null,
                        designation: null,
                        work_experience_years: null,
                        monthly_salary: null,
                        company_address: null,
                        hr_contact: null
                    },
                    income_details: {
                        monthly_salary: null,
                        other_income: null,
                        total_monthly_income: null,
                        existing_emi: null,
                        net_monthly_income: null
                    },
                    banking_details: {
                        primary_bank: null,
                        account_number: null,
                        account_type: null,
                        average_monthly_balance: null,
                        banking_relationship_years: null
                    },
                    address_details: {
                        current_address: {
                            address_line_1: null,
                            address_line_2: null,
                            city: null,
                            state: null,
                            pincode: null,
                            residence_type: null,
                            years_at_current_address: null
                        },
                        permanent_address: {
                            address_line_1: null,
                            address_line_2: null,
                            city: null,
                            state: null,
                            pincode: null,
                            same_as_current: null
                        }
                    },
                    references: {
                        personal_reference_1: {
                            name: null,
                            relationship: null,
                            mobile: null,
                            email: null
                        },
                        personal_reference_2: {
                            name: null,
                            relationship: null,
                            mobile: null,
                            email: null
                        },
                        professional_reference: {
                            name: null,
                            designation: null,
                            company: null,
                            mobile: null,
                            email: null
                        }
                    },
                    financial_details: {
                        monthly_expenses: null,
                        existing_loans: [],
                        credit_cards: [],
                        investments: [],
                        assets: []
                    }
                },
                processing_history: [],
                verification_results: {},
                decision_data: {}
            };
            
            await fs.writeFile(
                path.join(appDir, 'application-data.json'),
                JSON.stringify(appData, null, 2)
            );
            
            logger.info(`Created application file: ${applicationNumber}`);
            
        } catch (error) {
            logger.error(`Error creating application file for ${applicationNumber}:`, error);
            // Don't throw error - file storage is secondary to database
        }
    }

    /**
     * Update application file with new data
     */
    async updateApplicationFile(applicationNumber, stage, status, stageResult) {
        try {
            const appDataPath = path.join(this.applicationsDir, applicationNumber, 'application-data.json');
            
            // Read existing data
            const existingData = JSON.parse(await fs.readFile(appDataPath, 'utf8'));
            
            // Update application info
            existingData.application_info.last_updated = new Date().toISOString();
            existingData.application_info.current_stage = stage;
            existingData.application_info.status = status;
            
            // Add processing history
            existingData.processing_history.push({
                stage: stage,
                status: status,
                timestamp: new Date().toISOString(),
                result: stageResult
            });
            
            // Update stage-specific data
            if (stage === 'pre_qualification' && stageResult) {
                existingData.stage_1_data.eligibility_result = {
                    status: status,
                    score: stageResult.decision_score || 0,
                    decision: status,
                    reasons: stageResult.decision_reason ? [stageResult.decision_reason] : []
                };
            }
            
            // Write updated data
            await fs.writeFile(appDataPath, JSON.stringify(existingData, null, 2));
            
            logger.info(`Updated application file: ${applicationNumber}`);
            
        } catch (error) {
            logger.error(`Error updating application file for ${applicationNumber}:`, error);
            // Don't throw error - file storage is secondary to database
        }
    }

    /**
     * Get application data from file
     */
    async getApplicationFile(applicationNumber) {
        try {
            const appDataPath = path.join(this.applicationsDir, applicationNumber, 'application-data.json');
            const data = await fs.readFile(appDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error(`Error reading application file for ${applicationNumber}:`, error);
            return null;
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
     * Map application status to stage processing status
     */
    mapApplicationStatusToStageStatus(applicationStatus) {
        const statusMapping = {
            'pending': 'pending',
            'in_progress': 'in_progress', 
            'approved': 'completed',
            'rejected': 'failed',
            'under_review': 'in_progress'
        };
        
        return statusMapping[applicationStatus] || 'pending';
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
        
        if (app.length === 0) {
            logger.warn(`Cannot create audit log - application ${applicationId} not found`);
            return;
        }
        
        const applicationNumber = app[0].application_number;
        
        await connection.execute(`
            INSERT INTO audit_logs (
                application_number, action, stage, request_data, response_data
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            applicationNumber,
            actionType,
            stageName,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null
        ]);
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
     * Close database connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('📊 MySQL database connection pool closed');
        }
    }
}

module.exports = new DatabaseService();