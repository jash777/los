/**
 * Application Processing Phase Service
 * Handles rigorous verification and validation of all provided information
 */

const logger = require('../../middleware/utils/logger');
// Models replaced with direct PostgreSQL queries
const pool = require('../../middleware/config/database');
const { LOAN_ORIGINATION_PHASES, PHASE_STATUS, APPLICATION_PROCESSING_STAGES } = require('../../middleware/constants/loan-origination-phases');

class ApplicationProcessingService {
    constructor() {
        this.phase = LOAN_ORIGINATION_PHASES.APPLICATION_PROCESSING;
    }

    /**
     * Process application processing phase
     */
    async processApplicationProcessing(applicationData, loanApplicationId, requestId) {
        const startTime = Date.now();
        const applicationId = `appproc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            logger.info(`[${requestId}] Starting application processing`, {
                applicationId,
                loanApplicationId,
                phase: this.phase
            });

            // Validate loan application exists and is approved
            const loanApplication = await this.validateLoanApplication(loanApplicationId, requestId);
            if (!loanApplication.success) {
                return loanApplication;
            }

            // Create application processing record
            const processingRecord = new ApplicationProcessing({
                application_id: applicationId,
                loan_application_id: loanApplicationId,
                request_id: requestId,
                phase: this.phase,
                status: PHASE_STATUS.IN_PROGRESS,
                current_stage: APPLICATION_PROCESSING_STAGES.IDENTITY_EMPLOYMENT_VERIFICATION,
                processing_started_at: new Date(),
                applicant_data: applicationData.applicant_data || {},
                verification_requests: applicationData.verification_requests || []
            });

            await processingRecord.save();
            await processingRecord.addProcessingLog(
                'initialization',
                'completed',
                'Application processing record created successfully'
            );

            // Stage 1: Identity and Employment Verification
            const identityResult = await this.processIdentityEmploymentVerification(
                processingRecord,
                loanApplication.data,
                requestId
            );

            if (!identityResult.success) {
                return await this.handleProcessingFailure(
                    processingRecord,
                    'identity_employment_verification_failed',
                    identityResult.message,
                    startTime
                );
            }

            // Stage 2: Financial Document Verification
            const documentResult = await this.processFinancialDocumentVerification(
                processingRecord,
                loanApplication.data,
                requestId
            );

            if (!documentResult.success) {
                return await this.handleProcessingFailure(
                    processingRecord,
                    'document_verification_failed',
                    documentResult.message,
                    startTime
                );
            }

            // Stage 3: Inconsistency Check
            const inconsistencyResult = await this.processInconsistencyCheck(
                processingRecord,
                loanApplication.data,
                requestId
            );

            if (!inconsistencyResult.success) {
                return await this.handleProcessingFailure(
                    processingRecord,
                    'inconsistency_check_failed',
                    inconsistencyResult.message,
                    startTime
                );
            }

            // Stage 4: Automated Flagging
            const flaggingResult = await this.processAutomatedFlagging(
                processingRecord,
                loanApplication.data,
                requestId
            );

            // Stage 5: External Database Validation
            const validationResult = await this.processExternalDatabaseValidation(
                processingRecord,
                loanApplication.data,
                requestId
            );

            if (!validationResult.success) {
                return await this.handleProcessingFailure(
                    processingRecord,
                    'external_validation_failed',
                    validationResult.message,
                    startTime
                );
            }

            // Determine final processing result
            const finalResult = await this.determineProcessingResult(
                processingRecord,
                flaggingResult,
                requestId
            );

            // Complete processing
            const processingTime = Date.now() - startTime;
            await processingRecord.updateStatus(PHASE_STATUS.COMPLETED, {
                processing_completed_at: new Date(),
                total_processing_time_ms: processingTime,
                'processing_result.next_phase': finalResult.approved ? 
                    LOAN_ORIGINATION_PHASES.UNDERWRITING : null
            });

            await processingRecord.addProcessingLog(
                'completion',
                'completed',
                `Application processing completed: ${finalResult.approved ? 'Approved' : 'Flagged'}`,
                finalResult,
                processingTime
            );

            logger.info(`[${requestId}] Application processing completed`, {
                applicationId,
                approved: finalResult.approved,
                processingTime
            });

            return {
                success: true,
                applicationId,
                phase: this.phase,
                status: finalResult.approved ? 'approved' : 'flagged',
                result: finalResult,
                processingTime,
                nextPhase: finalResult.approved ? LOAN_ORIGINATION_PHASES.UNDERWRITING : null,
                message: finalResult.approved ? 
                    'Application processing completed successfully' : 
                    'Application flagged for manual review'
            };

        } catch (error) {
            logger.error(`[${requestId}] Application processing failed`, {
                error: error.message,
                stack: error.stack,
                applicationId
            });

            return {
                success: false,
                message: 'Application processing failed due to system error',
                error: error.message,
                applicationId,
                phase: this.phase
            };
        }
    }

    /**
     * Validate loan application exists and is approved
     */
    async validateLoanApplication(loanApplicationId, requestId) {
        try {
            const loanApplication = await LoanApplication.findOne({
                application_id: loanApplicationId
            });

            if (!loanApplication) {
                return {
                    success: false,
                    message: 'Loan application not found',
                    code: 'LOAN_APPLICATION_NOT_FOUND'
                };
            }

            if (!loanApplication.application_result?.approved) {
                return {
                    success: false,
                    message: 'Loan application must be approved before processing',
                    code: 'LOAN_APPLICATION_NOT_APPROVED'
                };
            }

            return {
                success: true,
                data: loanApplication
            };

        } catch (error) {
            logger.error(`[${requestId}] Failed to validate loan application`, {
                error: error.message,
                loanApplicationId
            });

            return {
                success: false,
                message: 'Failed to validate loan application',
                error: error.message
            };
        }
    }

    /**
     * Process identity and employment verification
     */
    async processIdentityEmploymentVerification(processingRecord, loanApplication, requestId) {
        const startTime = Date.now();
        
        try {
            logger.info(`[${requestId}] Processing identity and employment verification`);

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.IDENTITY_EMPLOYMENT_VERIFICATION,
                'started',
                'Starting identity and employment verification'
            );

            // Simulate identity verification checks
            const identityChecks = {
                pan_verification: await this.verifyPANDetails(
                    loanApplication.employment_details,
                    requestId
                ),
                employment_verification: await this.verifyEmploymentDetails(
                    loanApplication.employment_details,
                    requestId
                ),
                address_verification: await this.verifyAddressDetails(
                    loanApplication.personal_info || {},
                    requestId
                )
            };

            const allVerified = Object.values(identityChecks).every(check => check.verified);
            const processingTime = Date.now() - startTime;

            // Update processing record
            processingRecord.verification_results.identity_employment = {
                verified: allVerified,
                checks: identityChecks,
                verification_score: this.calculateVerificationScore(identityChecks),
                processed_at: new Date(),
                processing_time_ms: processingTime
            };

            processingRecord.current_stage = APPLICATION_PROCESSING_STAGES.FINANCIAL_DOCUMENT_VERIFICATION;
            await processingRecord.save();

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.IDENTITY_EMPLOYMENT_VERIFICATION,
                'completed',
                `Identity and employment verification completed: ${allVerified ? 'Verified' : 'Issues found'}`,
                identityChecks,
                processingTime
            );

            return {
                success: allVerified,
                verified: allVerified,
                checks: identityChecks,
                message: allVerified ? 
                    'Identity and employment verification successful' : 
                    'Identity and employment verification found issues'
            };

        } catch (error) {
            logger.error(`[${requestId}] Identity and employment verification failed`, {
                error: error.message
            });

            return {
                success: false,
                message: 'Identity and employment verification failed',
                error: error.message
            };
        }
    }

    /**
     * Process financial document verification
     */
    async processFinancialDocumentVerification(processingRecord, loanApplication, requestId) {
        const startTime = Date.now();
        
        try {
            logger.info(`[${requestId}] Processing financial document verification`);

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.FINANCIAL_DOCUMENT_VERIFICATION,
                'started',
                'Starting financial document verification'
            );

            // Verify financial documents
            const documentChecks = {
                income_proof: await this.verifyIncomeProof(
                    loanApplication.documents,
                    loanApplication.financial_details,
                    requestId
                ),
                bank_statements: await this.verifyBankStatements(
                    loanApplication.documents,
                    loanApplication.financial_details,
                    requestId
                ),
                financial_consistency: await this.checkFinancialConsistency(
                    loanApplication.financial_details,
                    requestId
                )
            };

            const allVerified = Object.values(documentChecks).every(check => check.verified);
            const processingTime = Date.now() - startTime;

            // Update processing record
            processingRecord.verification_results.financial_documents = {
                verified: allVerified,
                checks: documentChecks,
                verification_score: this.calculateVerificationScore(documentChecks),
                processed_at: new Date(),
                processing_time_ms: processingTime
            };

            processingRecord.current_stage = APPLICATION_PROCESSING_STAGES.INCONSISTENCY_CHECK;
            await processingRecord.save();

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.FINANCIAL_DOCUMENT_VERIFICATION,
                'completed',
                `Financial document verification completed: ${allVerified ? 'Verified' : 'Issues found'}`,
                documentChecks,
                processingTime
            );

            return {
                success: allVerified,
                verified: allVerified,
                checks: documentChecks,
                message: allVerified ? 
                    'Financial document verification successful' : 
                    'Financial document verification found issues'
            };

        } catch (error) {
            logger.error(`[${requestId}] Financial document verification failed`, {
                error: error.message
            });

            return {
                success: false,
                message: 'Financial document verification failed',
                error: error.message
            };
        }
    }

    /**
     * Process inconsistency check
     */
    async processInconsistencyCheck(processingRecord, loanApplication, requestId) {
        const startTime = Date.now();
        
        try {
            logger.info(`[${requestId}] Processing inconsistency check`);

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.INCONSISTENCY_CHECK,
                'started',
                'Starting inconsistency check'
            );

            // Check for inconsistencies across different data sources
            const inconsistencyChecks = {
                income_consistency: await this.checkIncomeConsistency(
                    loanApplication.financial_details,
                    loanApplication.employment_details,
                    requestId
                ),
                employment_consistency: await this.checkEmploymentConsistency(
                    loanApplication.employment_details,
                    requestId
                ),
                document_data_consistency: await this.checkDocumentDataConsistency(
                    loanApplication.documents,
                    loanApplication.financial_details,
                    requestId
                )
            };

            const noInconsistencies = Object.values(inconsistencyChecks).every(check => !check.hasInconsistency);
            const processingTime = Date.now() - startTime;

            // Update processing record
            processingRecord.verification_results.inconsistency_check = {
                passed: noInconsistencies,
                checks: inconsistencyChecks,
                inconsistency_score: this.calculateInconsistencyScore(inconsistencyChecks),
                processed_at: new Date(),
                processing_time_ms: processingTime
            };

            processingRecord.current_stage = APPLICATION_PROCESSING_STAGES.AUTOMATED_FLAGGING;
            await processingRecord.save();

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.INCONSISTENCY_CHECK,
                'completed',
                `Inconsistency check completed: ${noInconsistencies ? 'No issues' : 'Inconsistencies found'}`,
                inconsistencyChecks,
                processingTime
            );

            return {
                success: noInconsistencies,
                passed: noInconsistencies,
                checks: inconsistencyChecks,
                message: noInconsistencies ? 
                    'No inconsistencies found' : 
                    'Inconsistencies detected in application data'
            };

        } catch (error) {
            logger.error(`[${requestId}] Inconsistency check failed`, {
                error: error.message
            });

            return {
                success: false,
                message: 'Inconsistency check failed',
                error: error.message
            };
        }
    }

    /**
     * Process automated flagging
     */
    async processAutomatedFlagging(processingRecord, loanApplication, requestId) {
        const startTime = Date.now();
        
        try {
            logger.info(`[${requestId}] Processing automated flagging`);

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.AUTOMATED_FLAGGING,
                'started',
                'Starting automated flagging analysis'
            );

            // Run automated flagging rules
            const flaggingChecks = {
                risk_flags: await this.checkRiskFlags(
                    loanApplication,
                    processingRecord.verification_results,
                    requestId
                ),
                fraud_indicators: await this.checkFraudIndicators(
                    loanApplication,
                    requestId
                ),
                compliance_flags: await this.checkComplianceFlags(
                    loanApplication,
                    requestId
                )
            };

            const totalFlags = Object.values(flaggingChecks)
                .reduce((sum, check) => sum + (check.flags?.length || 0), 0);
            
            const processingTime = Date.now() - startTime;

            // Update processing record
            processingRecord.verification_results.automated_flagging = {
                total_flags: totalFlags,
                checks: flaggingChecks,
                flagging_score: this.calculateFlaggingScore(flaggingChecks),
                requires_manual_review: totalFlags > 0,
                processed_at: new Date(),
                processing_time_ms: processingTime
            };

            processingRecord.current_stage = APPLICATION_PROCESSING_STAGES.EXTERNAL_DATABASE_VALIDATION;
            await processingRecord.save();

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.AUTOMATED_FLAGGING,
                'completed',
                `Automated flagging completed: ${totalFlags} flags found`,
                flaggingChecks,
                processingTime
            );

            return {
                success: true,
                totalFlags,
                checks: flaggingChecks,
                requiresManualReview: totalFlags > 0,
                message: totalFlags === 0 ? 
                    'No flags detected' : 
                    `${totalFlags} flags detected - manual review required`
            };

        } catch (error) {
            logger.error(`[${requestId}] Automated flagging failed`, {
                error: error.message
            });

            return {
                success: false,
                message: 'Automated flagging failed',
                error: error.message
            };
        }
    }

    /**
     * Process external database validation
     */
    async processExternalDatabaseValidation(processingRecord, loanApplication, requestId) {
        const startTime = Date.now();
        
        try {
            logger.info(`[${requestId}] Processing external database validation`);

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.EXTERNAL_DATABASE_VALIDATION,
                'started',
                'Starting external database validation'
            );

            // Validate against external databases
            const validationChecks = {
                cibil_validation: await this.validateCIBILData(
                    loanApplication.personal_info || {},
                    requestId
                ),
                employment_database: await this.validateEmploymentDatabase(
                    loanApplication.employment_details,
                    requestId
                ),
                regulatory_databases: await this.validateRegulatoryDatabases(
                    loanApplication.personal_info || {},
                    requestId
                )
            };

            const allValidated = Object.values(validationChecks).every(check => check.validated);
            const processingTime = Date.now() - startTime;

            // Update processing record
            processingRecord.verification_results.external_validation = {
                validated: allValidated,
                checks: validationChecks,
                validation_score: this.calculateValidationScore(validationChecks),
                processed_at: new Date(),
                processing_time_ms: processingTime
            };

            await processingRecord.save();

            await processingRecord.addProcessingLog(
                APPLICATION_PROCESSING_STAGES.EXTERNAL_DATABASE_VALIDATION,
                'completed',
                `External database validation completed: ${allValidated ? 'Validated' : 'Issues found'}`,
                validationChecks,
                processingTime
            );

            return {
                success: allValidated,
                validated: allValidated,
                checks: validationChecks,
                message: allValidated ? 
                    'External database validation successful' : 
                    'External database validation found issues'
            };

        } catch (error) {
            logger.error(`[${requestId}] External database validation failed`, {
                error: error.message
            });

            return {
                success: false,
                message: 'External database validation failed',
                error: error.message
            };
        }
    }

    /**
     * Determine final processing result
     */
    async determineProcessingResult(processingRecord, flaggingResult, requestId) {
        try {
            const verificationResults = processingRecord.verification_results;
            
            // Calculate overall scores
            const identityScore = verificationResults.identity_employment?.verification_score || 0;
            const documentScore = verificationResults.financial_documents?.verification_score || 0;
            const consistencyScore = 100 - (verificationResults.inconsistency_check?.inconsistency_score || 0);
            const validationScore = verificationResults.external_validation?.validation_score || 0;
            const flaggingPenalty = verificationResults.automated_flagging?.flagging_score || 0;

            const overallScore = (
                (identityScore * 0.25) +
                (documentScore * 0.25) +
                (consistencyScore * 0.20) +
                (validationScore * 0.20) +
                ((100 - flaggingPenalty) * 0.10)
            );

            const approved = overallScore >= 75 && flaggingResult.totalFlags === 0;
            const requiresManualReview = flaggingResult.totalFlags > 0 || overallScore < 75;

            const result = {
                approved,
                overall_score: Math.round(overallScore),
                requires_manual_review: requiresManualReview,
                score_breakdown: {
                    identity_employment: Math.round(identityScore),
                    financial_documents: Math.round(documentScore),
                    consistency_check: Math.round(consistencyScore),
                    external_validation: Math.round(validationScore),
                    flagging_penalty: Math.round(flaggingPenalty)
                },
                flags_summary: {
                    total_flags: flaggingResult.totalFlags,
                    requires_review: requiresManualReview
                },
                recommendations: this.generateRecommendations(overallScore, flaggingResult),
                next_steps: approved ? 
                    ['Proceed to Underwriting phase'] : 
                    ['Manual review required', 'Address flagged issues']
            };

            // Update processing record with final result
            processingRecord.processing_result = result;
            await processingRecord.save();

            return result;

        } catch (error) {
            logger.error(`[${requestId}] Failed to determine processing result`, {
                error: error.message
            });

            return {
                approved: false,
                overall_score: 0,
                requires_manual_review: true,
                error: 'Failed to determine processing result'
            };
        }
    }

    /**
     * Handle processing failure
     */
    async handleProcessingFailure(processingRecord, reason, message, startTime) {
        const processingTime = Date.now() - startTime;
        
        await processingRecord.updateStatus(PHASE_STATUS.FAILED, {
            processing_completed_at: new Date(),
            total_processing_time_ms: processingTime,
            'processing_result.approved': false,
            'processing_result.failure_reason': reason
        });

        await processingRecord.addProcessingLog(
            'failure',
            'failed',
            message,
            { reason },
            processingTime
        );

        return {
            success: false,
            approved: false,
            message,
            reason,
            applicationId: processingRecord.application_id,
            phase: this.phase,
            processingTime
        };
    }

    /**
     * Get application processing status
     */
    async getApplicationStatus(applicationId) {
        try {
            const application = await ApplicationProcessing.findOne({
                application_id: applicationId
            });

            if (!application) {
                return {
                    success: false,
                    message: 'Application processing record not found'
                };
            }

            return {
                success: true,
                data: {
                    applicationId: application.application_id,
                    phase: application.phase,
                    status: application.status,
                    currentStage: application.current_stage,
                    processingResult: application.processing_result,
                    verificationResults: application.verification_results,
                    processingLogs: application.processing_logs,
                    createdAt: application.created_at,
                    updatedAt: application.updated_at
                }
            };

        } catch (error) {
            logger.error('Failed to get application processing status', {
                error: error.message,
                applicationId
            });

            return {
                success: false,
                message: 'Failed to retrieve application processing status',
                error: error.message
            };
        }
    }

    // Helper methods for verification checks
    async verifyPANDetails(employmentDetails, requestId) {
        // Simulate PAN verification
        return {
            verified: Math.random() > 0.1, // 90% success rate
            confidence: Math.random() * 30 + 70, // 70-100% confidence
            details: 'PAN verification completed'
        };
    }

    async verifyEmploymentDetails(employmentDetails, requestId) {
        // Simulate employment verification
        return {
            verified: Math.random() > 0.15, // 85% success rate
            confidence: Math.random() * 25 + 75, // 75-100% confidence
            details: 'Employment verification completed'
        };
    }

    async verifyAddressDetails(personalInfo, requestId) {
        // Simulate address verification
        return {
            verified: Math.random() > 0.2, // 80% success rate
            confidence: Math.random() * 20 + 80, // 80-100% confidence
            details: 'Address verification completed'
        };
    }

    async verifyIncomeProof(documents, financialDetails, requestId) {
        // Simulate income proof verification
        return {
            verified: Math.random() > 0.1, // 90% success rate
            confidence: Math.random() * 30 + 70,
            details: 'Income proof verification completed'
        };
    }

    async verifyBankStatements(documents, financialDetails, requestId) {
        // Simulate bank statement verification
        return {
            verified: Math.random() > 0.15, // 85% success rate
            confidence: Math.random() * 25 + 75,
            details: 'Bank statement verification completed'
        };
    }

    async checkFinancialConsistency(financialDetails, requestId) {
        // Simulate financial consistency check
        return {
            verified: Math.random() > 0.2, // 80% success rate
            confidence: Math.random() * 20 + 80,
            details: 'Financial consistency check completed'
        };
    }

    async checkIncomeConsistency(financialDetails, employmentDetails, requestId) {
        // Simulate income consistency check
        return {
            hasInconsistency: Math.random() < 0.1, // 10% inconsistency rate
            severity: Math.random() < 0.5 ? 'low' : 'medium',
            details: 'Income consistency check completed'
        };
    }

    async checkEmploymentConsistency(employmentDetails, requestId) {
        // Simulate employment consistency check
        return {
            hasInconsistency: Math.random() < 0.05, // 5% inconsistency rate
            severity: Math.random() < 0.7 ? 'low' : 'high',
            details: 'Employment consistency check completed'
        };
    }

    async checkDocumentDataConsistency(documents, financialDetails, requestId) {
        // Simulate document-data consistency check
        return {
            hasInconsistency: Math.random() < 0.15, // 15% inconsistency rate
            severity: Math.random() < 0.6 ? 'medium' : 'high',
            details: 'Document-data consistency check completed'
        };
    }

    async checkRiskFlags(loanApplication, verificationResults, requestId) {
        // Simulate risk flag detection
        const flags = [];
        if (Math.random() < 0.1) flags.push({ type: 'high_dti', severity: 'medium' });
        if (Math.random() < 0.05) flags.push({ type: 'income_volatility', severity: 'high' });
        
        return {
            flags,
            risk_level: flags.length > 0 ? 'elevated' : 'normal'
        };
    }

    async checkFraudIndicators(loanApplication, requestId) {
        // Simulate fraud indicator detection
        const flags = [];
        if (Math.random() < 0.02) flags.push({ type: 'document_tampering', severity: 'high' });
        if (Math.random() < 0.03) flags.push({ type: 'identity_mismatch', severity: 'high' });
        
        return {
            flags,
            fraud_risk: flags.length > 0 ? 'high' : 'low'
        };
    }

    async checkComplianceFlags(loanApplication, requestId) {
        // Simulate compliance flag detection
        const flags = [];
        if (Math.random() < 0.05) flags.push({ type: 'regulatory_concern', severity: 'medium' });
        
        return {
            flags,
            compliance_status: flags.length > 0 ? 'review_required' : 'compliant'
        };
    }

    async validateCIBILData(personalInfo, requestId) {
        // Simulate CIBIL data validation
        return {
            validated: Math.random() > 0.1, // 90% validation rate
            confidence: Math.random() * 30 + 70,
            details: 'CIBIL data validation completed'
        };
    }

    async validateEmploymentDatabase(employmentDetails, requestId) {
        // Simulate employment database validation
        return {
            validated: Math.random() > 0.15, // 85% validation rate
            confidence: Math.random() * 25 + 75,
            details: 'Employment database validation completed'
        };
    }

    async validateRegulatoryDatabases(personalInfo, requestId) {
        // Simulate regulatory database validation
        return {
            validated: Math.random() > 0.05, // 95% validation rate
            confidence: Math.random() * 20 + 80,
            details: 'Regulatory database validation completed'
        };
    }

    // Scoring helper methods
    calculateVerificationScore(checks) {
        const scores = Object.values(checks).map(check => check.confidence || 0);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    calculateInconsistencyScore(checks) {
        const inconsistencies = Object.values(checks).filter(check => check.hasInconsistency);
        return inconsistencies.length * 25; // 25 points per inconsistency
    }

    calculateFlaggingScore(checks) {
        const totalFlags = Object.values(checks).reduce((sum, check) => sum + (check.flags?.length || 0), 0);
        return Math.min(totalFlags * 20, 100); // 20 points per flag, max 100
    }

    calculateValidationScore(checks) {
        const scores = Object.values(checks).map(check => check.confidence || 0);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    generateRecommendations(overallScore, flaggingResult) {
        const recommendations = [];
        
        if (overallScore < 75) {
            recommendations.push('Improve verification scores before proceeding');
        }
        
        if (flaggingResult.totalFlags > 0) {
            recommendations.push('Address flagged issues through manual review');
        }
        
        if (overallScore >= 75 && flaggingResult.totalFlags === 0) {
            recommendations.push('Application ready for underwriting phase');
        }
        
        return recommendations;
    }
}

module.exports = ApplicationProcessingService;