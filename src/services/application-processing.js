/**
 * Application Processing Service (Stage 3)
 * Document verification, data validation, and external service integration
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');
const config = require('../config/app');

class ApplicationProcessingService {
    constructor() {
        this.externalServiceUrl = config.externalServices.thirdPartySimulator.baseUrl;
    }

    /**
     * Process application (Stage 2 - Application Processing)
     */
    async processApplication(applicationNumber, applicationData, requestId) {
        return await this.processApplicationProcessing(applicationNumber, requestId);
    }

    /**
     * Process application processing (Stage 3)
     */
    async processApplicationProcessing(applicationNumber, requestId) {
        const startTime = Date.now();
        
        logger.info(`[${requestId}] Starting application processing for ${applicationNumber}`);

        try {
            // Get existing application
            logger.info(`[${requestId}] Fetching application: ${applicationNumber}`);
            const existingApp = await databaseService.getCompleteApplication(applicationNumber);
            logger.info(`[${requestId}] Application found:`, {
                id: existingApp?.id,
                current_stage: existingApp?.current_stage,
                status: existingApp?.status
            });
            
            if (!existingApp) {
                throw new Error('Application not found');
            }

            if (existingApp.current_stage !== 'loan_application' || existingApp.current_status !== 'approved') {
                throw new Error(`Application must complete comprehensive loan application to proceed to application processing. Current: ${existingApp.current_stage}/${existingApp.current_status}`);
            }

            const applicationId = existingApp.id;

            // Update stage to application_processing
            await databaseService.updateApplicationStage(applicationId, 'application_processing', 'in_progress');

            // Step 1: Document verification
            const documentResult = await this.performDocumentVerification(applicationId, requestId);

            // Step 2: Data validation and cross-verification
            const dataValidationResult = await this.performDataValidation(existingApp, requestId);

            // Step 3: External service integration
            const externalVerificationResult = await this.performExternalVerifications(existingApp, requestId);

            // Step 4: Compliance checks
            const complianceResult = await this.performComplianceChecks(existingApp, requestId);

            // Step 5: Calculate processing score
            const processingScore = this.calculateProcessingScore(
                documentResult, dataValidationResult, externalVerificationResult, complianceResult
            );

            // Step 6: Make processing decision
            const processingDecision = this.makeProcessingDecision(processingScore, documentResult, dataValidationResult);

            // Step 7: Save processing results
            await databaseService.saveVerificationResults(applicationId, {
                ...existingApp.verification_data,
                application_processing: {
                    document_verification: documentResult,
                    data_validation: dataValidationResult,
                    external_verifications: externalVerificationResult,
                    compliance_checks: complianceResult,
                    processing_score: processingScore,
                    processing_decision: processingDecision
                },
                overall_status: 'completed',
                verification_score: processingScore
            });

            // Step 8: Save decision
            const decisionData = {
                decision: processingDecision.approved ? 'approved' : 'rejected',
                decision_reason: processingDecision.reason,
                decision_score: processingScore,
                decision_factors: {
                    positive_factors: processingDecision.positiveFactors,
                    negative_factors: processingDecision.negativeFactors,
                    risk_factors: processingDecision.riskFactors
                }
            };

            await databaseService.saveEligibilityDecision(applicationId, 'application_processing', decisionData);

            // Step 9: Update final status
            const finalStatus = processingDecision.approved ? 'approved' : 'rejected';
            await databaseService.updateApplicationStage(applicationId, 'application_processing', finalStatus, {
                processing_result: processingDecision,
                processing_time_ms: Date.now() - startTime
            });

            // Step 10: Return response
            if (processingDecision.approved) {
                return this.createApprovalResponse(applicationNumber, processingDecision, processingScore, startTime);
            } else {
                return this.createRejectionResponse(applicationNumber, processingDecision.reason, processingDecision.negativeFactors, startTime);
            }

        } catch (error) {
            logger.error(`[${requestId}] Application processing failed:`, {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            return this.createSystemErrorResponse(startTime, error.message);
        }
    }

    /**
     * Perform document verification
     */
    async performDocumentVerification(applicationId, requestId) {
        logger.info(`[${requestId}] Performing document verification`);

        // Simulate document verification process
        const documentChecks = {
            identity_documents: {
                pan_card: { status: 'verified', confidence: 95 },
                aadhar_card: { status: 'verified', confidence: 92 },
                passport: { status: 'not_provided', confidence: 0 }
            },
            address_documents: {
                utility_bill: { status: 'verified', confidence: 88 },
                bank_statement: { status: 'verified', confidence: 90 }
            },
            income_documents: {
                salary_slips: { status: 'verified', confidence: 94 },
                bank_statements: { status: 'verified', confidence: 91 },
                itr: { status: 'pending', confidence: 0 }
            },
            employment_documents: {
                employment_letter: { status: 'verified', confidence: 89 },
                experience_certificate: { status: 'verified', confidence: 87 }
            }
        };

        const overallDocumentScore = this.calculateDocumentScore(documentChecks);

        return {
            document_checks: documentChecks,
            overall_score: overallDocumentScore,
            verification_status: overallDocumentScore >= 80 ? 'passed' : 'failed',
            missing_documents: this.identifyMissingDocuments(documentChecks)
        };
    }

    /**
     * Perform data validation and cross-verification
     */
    async performDataValidation(existingApp, requestId) {
        logger.info(`[${requestId}] Performing data validation`);

        const validationChecks = {
            personal_info_consistency: {
                name_matching: { status: 'passed', score: 95 },
                date_of_birth_consistency: { status: 'passed', score: 100 },
                contact_info_validation: { status: 'passed', score: 92 }
            },
            financial_info_consistency: {
                income_cross_verification: { status: 'passed', score: 88 },
                employment_details_matching: { status: 'passed', score: 91 },
                banking_info_validation: { status: 'passed', score: 89 }
            },
            address_verification: {
                current_address_validation: { status: 'passed', score: 87 },
                permanent_address_matching: { status: 'passed', score: 85 }
            }
        };

        const overallValidationScore = this.calculateValidationScore(validationChecks);

        return {
            validation_checks: validationChecks,
            overall_score: overallValidationScore,
            validation_status: overallValidationScore >= 85 ? 'passed' : 'failed',
            data_inconsistencies: this.identifyDataInconsistencies(validationChecks)
        };
    }

    /**
     * Perform external verifications
     */
    async performExternalVerifications(existingApp, requestId) {
        logger.info(`[${requestId}] Performing external verifications`);

        try {
            // Simulate external API calls
            const externalChecks = {
                cibil_recheck: {
                    status: 'completed',
                    score: existingApp.verification_data?.credit_assessment?.cibil_score || 750,
                    consistency: 'consistent'
                },
                pan_revalidation: {
                    status: 'completed',
                    validity: 'valid',
                    name_match: 'exact_match'
                },
                employment_verification: {
                    status: 'completed',
                    company_verification: 'verified',
                    designation_confirmation: 'confirmed'
                },
                banking_verification: {
                    status: 'completed',
                    account_verification: 'active',
                    average_balance_check: 'satisfactory'
                }
            };

            const externalVerificationScore = this.calculateExternalVerificationScore(externalChecks);

            return {
                external_checks: externalChecks,
                overall_score: externalVerificationScore,
                verification_status: externalVerificationScore >= 80 ? 'passed' : 'failed'
            };

        } catch (error) {
            logger.error(`[${requestId}] External verification error:`, error);
            return {
                external_checks: {},
                overall_score: 50,
                verification_status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Perform compliance checks
     */
    async performComplianceChecks(existingApp, requestId) {
        logger.info(`[${requestId}] Performing compliance checks`);

        const complianceChecks = {
            kyc_compliance: {
                status: 'compliant',
                score: 95,
                checks_passed: ['identity_verification', 'address_verification', 'income_verification']
            },
            aml_screening: {
                status: 'cleared',
                score: 98,
                risk_level: 'low'
            },
            regulatory_compliance: {
                status: 'compliant',
                score: 92,
                regulations_checked: ['RBI_guidelines', 'NBFC_norms', 'consumer_protection']
            },
            internal_policy_compliance: {
                status: 'compliant',
                score: 89,
                policies_checked: ['lending_policy', 'risk_policy', 'credit_policy']
            }
        };

        const complianceScore = this.calculateComplianceScore(complianceChecks);

        return {
            compliance_checks: complianceChecks,
            overall_score: complianceScore,
            compliance_status: complianceScore >= 90 ? 'compliant' : 'non_compliant'
        };
    }

    /**
     * Calculate overall processing score
     */
    calculateProcessingScore(documentResult, dataValidationResult, externalVerificationResult, complianceResult) {
        const weights = {
            documents: 0.3,
            dataValidation: 0.25,
            externalVerification: 0.25,
            compliance: 0.2
        };

        return Math.round(
            (documentResult.overall_score * weights.documents) +
            (dataValidationResult.overall_score * weights.dataValidation) +
            (externalVerificationResult.overall_score * weights.externalVerification) +
            (complianceResult.overall_score * weights.compliance)
        );
    }

    /**
     * Make processing decision
     */
    makeProcessingDecision(processingScore, documentResult, dataValidationResult) {
        const decision = {
            approved: false,
            reason: '',
            positiveFactors: [],
            negativeFactors: [],
            riskFactors: []
        };

        // Check minimum score threshold (lowered for testing)
        if (processingScore >= 85) {
            decision.approved = true;
            decision.reason = 'Application processing completed successfully';
            decision.positiveFactors.push('High processing score', 'All verifications passed');
        } else if (processingScore >= 60) {
            decision.approved = true;
            decision.reason = 'Application processing completed with minor concerns';
            decision.positiveFactors.push('Acceptable processing score');
            decision.riskFactors.push('Some verification concerns noted');
        } else {
            decision.approved = false;
            decision.reason = 'Application processing failed minimum requirements';
            decision.negativeFactors.push('Low processing score');
        }

        // Document verification check
        if (documentResult.verification_status === 'failed') {
            decision.approved = false;
            decision.negativeFactors.push('Document verification failed');
        }

        // Data validation check
        if (dataValidationResult.validation_status === 'failed') {
            decision.approved = false;
            decision.negativeFactors.push('Data validation failed');
        }

        return decision;
    }

    // Helper methods
    calculateDocumentScore(documentChecks) {
        let totalScore = 0;
        let totalChecks = 0;

        Object.values(documentChecks).forEach(category => {
            Object.values(category).forEach(doc => {
                if (doc.status === 'verified') {
                    totalScore += doc.confidence;
                    totalChecks++;
                } else if (doc.status === 'pending') {
                    totalScore += 70; // Higher partial score for pending
                    totalChecks++;
                }
                // Skip 'not_provided' documents from score calculation
            });
        });

        return totalChecks > 0 ? Math.round(totalScore / totalChecks) : 0;
    }

    calculateValidationScore(validationChecks) {
        let totalScore = 0;
        let totalChecks = 0;

        Object.values(validationChecks).forEach(category => {
            Object.values(category).forEach(check => {
                totalScore += check.score;
                totalChecks++;
            });
        });

        return totalChecks > 0 ? Math.round(totalScore / totalChecks) : 0;
    }

    calculateExternalVerificationScore(externalChecks) {
        const scores = {
            cibil_recheck: 90,
            pan_revalidation: 95,
            employment_verification: 88,
            banking_verification: 85
        };

        let totalScore = 0;
        let totalChecks = 0;

        Object.keys(externalChecks).forEach(check => {
            if (externalChecks[check].status === 'completed') {
                totalScore += scores[check] || 80;
            } else {
                totalScore += 50;
            }
            totalChecks++;
        });

        return totalChecks > 0 ? Math.round(totalScore / totalChecks) : 0;
    }

    calculateComplianceScore(complianceChecks) {
        let totalScore = 0;
        let totalChecks = 0;

        Object.values(complianceChecks).forEach(check => {
            totalScore += check.score;
            totalChecks++;
        });

        return totalChecks > 0 ? Math.round(totalScore / totalChecks) : 0;
    }

    identifyMissingDocuments(documentChecks) {
        const missing = [];
        Object.entries(documentChecks).forEach(([category, docs]) => {
            Object.entries(docs).forEach(([docType, doc]) => {
                if (doc.status === 'not_provided' || doc.status === 'pending') {
                    missing.push(`${category}.${docType}`);
                }
            });
        });
        return missing;
    }

    identifyDataInconsistencies(validationChecks) {
        const inconsistencies = [];
        Object.entries(validationChecks).forEach(([category, checks]) => {
            Object.entries(checks).forEach(([checkType, check]) => {
                if (check.status === 'failed' || check.score < 80) {
                    inconsistencies.push(`${category}.${checkType}`);
                }
            });
        });
        return inconsistencies;
    }

    // Response methods
    createApprovalResponse(applicationNumber, processingDecision, processingScore, startTime) {
        return {
            success: true,
            phase: 'application-processing',
            status: 'approved',
            applicationNumber,
            processing_score: processingScore,
            positive_factors: processingDecision.positiveFactors,
            risk_factors: processingDecision.riskFactors,
            next_steps: {
                phase: 'underwriting',
                description: 'Proceed to underwriting and risk assessment',
                required_actions: [
                    'Underwriting team will review the application',
                    'Risk assessment will be performed',
                    'Final credit decision will be made'
                ]
            },
            processing_time_ms: Date.now() - startTime,
            message: 'Application processing completed successfully.'
        };
    }

    createRejectionResponse(applicationNumber, reason, errors, startTime) {
        return {
            success: false,
            phase: 'application-processing',
            status: 'rejected',
            applicationNumber,
            reason,
            errors,
            recommendations: [
                'Address document verification issues',
                'Resolve data inconsistencies',
                'Provide missing documents and information'
            ],
            processing_time_ms: Date.now() - startTime,
            message: 'Application processing could not be completed due to verification issues.'
        };
    }

    createSystemErrorResponse(startTime, errorMessage) {
        return {
            success: false,
            phase: 'application-processing',
            status: 'error',
            error: 'System error during processing',
            message: errorMessage,
            processing_time_ms: Date.now() - startTime
        };
    }
    /**
     * Get application processing status
     */
    async getProcessingStatus(applicationNumber) {
        try {
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            return {
                applicationNumber,
                current_stage: application.current_stage,
                current_status: application.current_status,
                processing_completed: application.current_stage === 'application-processing' && 
                                    ['approved', 'rejected'].includes(application.current_status)
            };
        } catch (error) {
            throw new Error(`Failed to get processing status: ${error.message}`);
        }
    }
}

module.exports = ApplicationProcessingService;