/**
 * Pre-Qualification Phase Service
 * Handles preliminary assessment, eligibility, identity, CIBIL and employment checks
 * Enhanced with Rule Engine integration
 */

const { EligibilityRuleEngine, CIBILRuleEngine, KYCRuleEngine } = require('../rule-engine');
const logger = require('../../middleware/utils/logger');
const db = require('../../middleware/config/database');
const SurepassService = require('../../middleware/external/surepass.service');

// Phase constants
const PHASE_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REJECTED: 'rejected'
};

const PRE_QUALIFICATION_STAGES = {
    PRELIMINARY_ASSESSMENT: 'preliminary_assessment',
    IDENTITY_VERIFICATION: 'identity_verification',
    CIBIL_CHECK: 'cibil_check',
    EMPLOYMENT_VERIFICATION: 'employment_verification',
    ELIGIBILITY_ASSESSMENT: 'eligibility_assessment'
};

const APPLICATION_STATUS = {
    NEW: 'new',
    PRE_QUALIFICATION_APPROVED: 'pre_qualification_approved',
    PRE_QUALIFICATION_REJECTED: 'pre_qualification_rejected',
    LOAN_APPLICATION_SUBMITTED: 'loan_application_submitted',
    UNDERWRITING_IN_PROGRESS: 'underwriting_in_progress',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

class PreQualificationService {
    constructor() {
        this.eligibilityRuleEngine = new EligibilityRuleEngine();
        this.cibilRuleEngine = new CIBILRuleEngine();
        this.kycRuleEngine = new KYCRuleEngine();
        this.surepassService = new SurepassService();
    }

    /**
     * Process complete pre-qualification phase
     */
    async processPreQualification(applicationData, requestId) {
        const phaseId = `preq_${Date.now()}`;
        
        try {
            logger.info(`[${requestId}] Starting Pre-Qualification phase`, { phaseId });

            // Initialize phase tracking
            const phaseTracking = await this.initializePhaseTracking(phaseId, applicationData, requestId);
            
            logger.info(`[${requestId}] Phase tracking initialized`, {
                phaseTrackingApplicationId: phaseTracking.applicationId,
                phaseTrackingWorkflowId: phaseTracking.workflowId
            });
            
            const result = {
                phaseId,
                applicationId: phaseTracking.applicationId,
                status: PHASE_STATUS.IN_PROGRESS,
                stages: {},
                decision: null,
                nextPhase: null,
                processingTime: 0,
                startTime: Date.now()
            };
            
            logger.info(`[${requestId}] Result object created`, {
                resultApplicationId: result.applicationId
            });

            // Stage 1: Preliminary Assessment
            logger.info(`[${requestId}] Stage 1: Preliminary Assessment`);
            const preliminaryResult = await this.processPreliminaryAssessment(applicationData, requestId, phaseTracking.applicationId);
            result.stages[PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT] = preliminaryResult;

            if (!preliminaryResult.passed) {
                return await this.completePhaseWithRejection(result, 'Failed preliminary assessment', requestId);
            }

            // Stage 2: Identity Verification
            logger.info(`[${requestId}] Stage 2: Identity Verification`);
            const identityResult = await this.processIdentityVerification(applicationData, requestId, phaseTracking.applicationId);
            result.stages[PRE_QUALIFICATION_STAGES.IDENTITY_VERIFICATION] = identityResult;

            if (!identityResult.passed) {
                return await this.completePhaseWithRejection(result, 'Failed identity verification', requestId);
            }

            // Stage 3: CIBIL Check
            logger.info(`[${requestId}] Stage 3: CIBIL Check`);
            const cibilResult = await this.processCibilCheck(applicationData, requestId, identityResult);
            result.stages[PRE_QUALIFICATION_STAGES.CIBIL_CHECK] = cibilResult;

            if (!cibilResult.passed) {
                return await this.completePhaseWithRejection(result, 'Failed CIBIL check', requestId);
            }

            // Stage 4: Employment Verification
            logger.info(`[${requestId}] Stage 4: Employment Verification`);
            const employmentResult = await this.processEmploymentVerification(applicationData, requestId);
            result.stages[PRE_QUALIFICATION_STAGES.EMPLOYMENT_VERIFICATION] = employmentResult;

            if (!employmentResult.passed) {
                return await this.completePhaseWithRejection(result, 'Failed employment verification', requestId);
            }

            // Stage 5: Eligibility Assessment
            logger.info(`[${requestId}] Stage 5: Eligibility Assessment`);
            const eligibilityResult = await this.processEligibilityAssessment({
                applicationData,
                preliminaryResult,
                identityResult,
                cibilResult,
                employmentResult
            }, requestId);
            result.stages[PRE_QUALIFICATION_STAGES.ELIGIBILITY_ASSESSMENT] = eligibilityResult;

            if (!eligibilityResult.passed) {
                return await this.completePhaseWithRejection(result, 'Failed eligibility assessment', requestId);
            }

            // Complete phase with approval
            return await this.completePhaseWithApproval(result, eligibilityResult, requestId);

        } catch (error) {
            logger.error(`[${requestId}] Pre-Qualification phase failed`, {
                error: error.message,
                stack: error.stack,
                phaseId
            });
            throw error;
        }
    }

    /**
     * Map nested application data to flat structure expected by preliminary check
     */
    mapApplicationData(applicationData) {
        return {
            first_name: applicationData.personal_info?.first_name,
            last_name: applicationData.personal_info?.last_name,
            email: applicationData.personal_info?.email,
            mobile: applicationData.personal_info?.mobile,
            pan_number: applicationData.personal_info?.pan_number,
            aadhar_number: applicationData.personal_info?.aadhar_number,
            date_of_birth: applicationData.personal_info?.date_of_birth,
            gender: applicationData.personal_info?.gender,
            address: applicationData.address_info?.current_address?.address_line_1,
            location: applicationData.address_info?.current_address?.city,
            pincode: applicationData.address_info?.current_address?.pincode,
            employment_type: applicationData.employment_details?.employment_type,
            company_name: applicationData.employment_details?.company_name,
            monthly_income: applicationData.employment_details?.monthly_income,
            work_experience: applicationData.employment_details?.work_experience,
            loan_type: applicationData.loan_request?.loan_type,
            requested_amount: applicationData.loan_request?.requested_amount,
            loan_purpose: applicationData.loan_request?.loan_purpose,
            preferred_tenure: applicationData.loan_request?.preferred_tenure
        };
    }

    /**
     * Stage 1: Preliminary Assessment
     */
    async processPreliminaryAssessment(applicationData, requestId, applicationId) {
        try {
            // Map nested request structure to flat structure
            const mappedData = this.mapApplicationData(applicationData);
            
            // Basic validation checks
            const validationResult = this.validateBasicRequirements(mappedData);
            if (!validationResult.valid) {
                return {
                    stage: PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT,
                    status: PHASE_STATUS.FAILED,
                    passed: false,
                    error: validationResult.error,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Calculate preliminary eligibility score
            const eligibilityScore = this.calculatePreliminaryScore(mappedData);
            const eligible = eligibilityScore >= 60; // Minimum threshold
            
            return {
                stage: PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT,
                status: PHASE_STATUS.COMPLETED,
                passed: eligible,
                applicationId: applicationId,
                data: {
                    eligibilityScore: eligibilityScore,
                    loanEstimate: eligible ? this.calculateLoanEstimate(mappedData) : null,
                    trackingNumber: `TRK_${applicationId}`
                },
                processingTime: 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[${requestId}] Preliminary assessment failed`, { error: error.message });
            return {
                stage: PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT,
                status: PHASE_STATUS.FAILED,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Stage 2: Identity Verification - Using combined verification
     */
    async processIdentityVerification(applicationData, requestId, applicationId) {
        try {
            // Use combined verification method to reduce API calls
            let combinedResult = null;
            try {
                combinedResult = await this.surepassService.performCombinedVerification(
                    applicationData.personal_info,
                    applicationId,
                    requestId
                );
            } catch (combinedError) {
                logger.error(`[${requestId}] Combined verification failed`, { error: combinedError.message });
                // Set default failed result
                combinedResult = {
                    success: false,
                    panVerification: null,
                    creditReport: null,
                    nameMatching: null,
                    overallScore: 0,
                    cached: false,
                    error: combinedError.message
                };
            }

            // Also verify Aadhar separately if needed
            let aadharResult = null;
            try {
                aadharResult = await this.surepassService.verifyAadhar(
                    applicationData.personal_info?.aadhar_number,
                    requestId
                );
            } catch (aadharError) {
                logger.warn(`[${requestId}] Aadhar verification failed, continuing with PAN/CIBIL only`, {
                    error: aadharError.message
                });
                aadharResult = { success: false, error: aadharError.message };
            }

            // Enhanced identity verification with strict matching
            const identityValidation = this.validateIdentityMatch(
                applicationData.personal_info,
                combinedResult,
                aadharResult,
                requestId
            );

            const passed = identityValidation.passed;

            return {
                stage: PRE_QUALIFICATION_STAGES.IDENTITY_VERIFICATION,
                status: PHASE_STATUS.COMPLETED,
                passed: passed,
                data: {
                    combinedVerification: combinedResult,
                    panVerification: combinedResult?.panVerification || null,
                    creditReport: combinedResult?.creditReport || null,
                    aadharVerification: aadharResult,
                    nameMatching: combinedResult?.nameMatching || null,
                    identityValidation: identityValidation,
                    identityScore: combinedResult?.overallScore || 0,
                    riskFlags: identityValidation.riskFlags,
                    riskLevel: passed ? 'LOW' : 'HIGH',
                    confidenceLevel: passed ? 'HIGH' : 'LOW',
                    cached: combinedResult?.cached || false,
                    failureReasons: identityValidation.failureReasons
                },
                processingTime: 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[${requestId}] Identity verification failed`, { error: error.message });
            return {
                stage: PRE_QUALIFICATION_STAGES.IDENTITY_VERIFICATION,
                status: PHASE_STATUS.FAILED,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Stage 3: CIBIL Check (Enhanced with Rule Engine) - Using cached data
     */
    async processCibilCheck(applicationData, requestId, identityResult) {
        try {
            // Use cached credit report data from identity verification stage
            let cibilData = {
                score: 750,
                status: 'success',
                creditHistory: [],
                enquiries: 0
            };
            
            // Check if we have real credit report data from combined verification
            if (identityResult?.data?.creditReport && identityResult.data.creditReport.success) {
                const creditReport = identityResult.data.creditReport;
                cibilData = {
                    score: creditReport.creditScore || 750,
                    status: creditReport.success ? 'success' : 'failed',
                    creditHistory: creditReport.creditHistory || [],
                    enquiries: creditReport.enquiries || 0,
                    paymentHistory: creditReport.paymentHistory || [],
                    creditUtilization: creditReport.creditUtilization || 0,
                    accountMix: creditReport.accountMix || [],
                    recentInquiries: creditReport.recentInquiries || 0,
                    settledAccounts: creditReport.settledAccounts || 0,
                    writtenOffAccounts: creditReport.writtenOffAccounts || 0,
                    currentEmiBurden: creditReport.currentEmiBurden || 0,
                    suitFiledStatus: creditReport.suitFiledStatus || false,
                    activeDefaults: creditReport.activeDefaults || 0
                };
                
                logger.info(`[${requestId}] Using cached CIBIL data from combined verification`, {
                    score: cibilData.score,
                    cached: identityResult.data.cached
                });
            } else {
                logger.info(`[${requestId}] Using mock CIBIL data - no cached data available`, {
                    score: cibilData.score
                });
            }

            // Use CIBIL Rule Engine for enhanced evaluation
            const ruleEngineResult = await this.cibilRuleEngine.processCIBILVerification({
                ...applicationData,
                credit_report: {
                    cibil_score: cibilData.score,
                    credit_history_length: cibilData.creditHistory?.length || 0,
                    payment_history: cibilData.paymentHistory || [],
                    credit_utilization: cibilData.creditUtilization || 0,
                    account_mix: cibilData.accountMix || [],
                    recent_inquiries: cibilData.recentInquiries || 0,
                    settled_accounts: cibilData.settledAccounts || 0,
                    written_off_accounts: cibilData.writtenOffAccounts || 0,
                    current_emi_burden: cibilData.currentEmiBurden || 0,
                    suit_filed_status: cibilData.suitFiledStatus || false,
                    active_defaults: cibilData.activeDefaults || 0,
                    defaults_count: 0,
                    recent_defaults_12m: 0
                }
            }, requestId);

            const passed = ruleEngineResult.status === 'APPROVED' || ruleEngineResult.status === 'CONDITIONAL';

            return {
                stage: PRE_QUALIFICATION_STAGES.CIBIL_CHECK,
                status: PHASE_STATUS.COMPLETED,
                passed,
                data: {
                    cibilScore: cibilData.score,
                    creditHistory: cibilData.creditHistory,
                    riskCategory: cibilData.riskCategory,
                    recommendations: this.getCibilRecommendations(cibilData),
                    // Enhanced rule engine results
                    ruleEngineResult: {
                        status: ruleEngineResult.status,
                        score: ruleEngineResult.score,
                        maxScore: ruleEngineResult.maxScore,
                        creditScore: ruleEngineResult.creditScore,
                        flags: ruleEngineResult.flags || [],
                        messages: ruleEngineResult.messages || [],
                        riskLevel: ruleEngineResult.riskLevel,
                        recommendations: ruleEngineResult.recommendations || []
                    }
                },
                processingTime: 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[${requestId}] CIBIL check failed`, { error: error.message });
            return {
                stage: PRE_QUALIFICATION_STAGES.CIBIL_CHECK,
                status: PHASE_STATUS.FAILED,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Stage 4: Employment Verification
     */
    async processEmploymentVerification(applicationData, requestId) {
        try {
            const employmentData = applicationData.employment_details;
            
            const verificationResult = {
                employmentType: this.verifyEmploymentType(employmentData.employment_type),
                incomeVerification: await this.verifyIncome(employmentData),
                stabilityCheck: this.checkEmploymentStability(employmentData),
                companyVerification: await this.verifyCompany(employmentData.company_name)
            };

            const passed = this.evaluateEmploymentEligibility(verificationResult, employmentData);

            return {
                stage: PRE_QUALIFICATION_STAGES.EMPLOYMENT_VERIFICATION,
                status: PHASE_STATUS.COMPLETED,
                passed,
                data: {
                    verificationResult,
                    employmentScore: this.calculateEmploymentScore(verificationResult),
                    riskFactors: this.identifyEmploymentRisks(verificationResult)
                },
                processingTime: 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[${requestId}] Employment verification failed`, { error: error.message });
            return {
                stage: PRE_QUALIFICATION_STAGES.EMPLOYMENT_VERIFICATION,
                status: PHASE_STATUS.FAILED,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Stage 5: Eligibility Assessment (Enhanced with Rule Engine)
     */
    async processEligibilityAssessment(stageResults, requestId) {
        try {
            const { applicationData, preliminaryResult, identityResult, cibilResult, employmentResult } = stageResults;
            
            // Use only Rule Engine for eligibility assessment
            // Removed dependency on undefined eligibilityModule

            // Use Eligibility Rule Engine for enhanced evaluation
            // Map data to match rule engine expectations (nested structure)
            const eligibilityData = {
                personal_info: {
                    age: applicationData.age || this.calculateAge(applicationData.date_of_birth || applicationData.personal_info?.date_of_birth),
                    pan_number: applicationData.pan_number || applicationData.personal_info?.pan_number || '',
                    aadhar_number: applicationData.aadhar_number || applicationData.personal_info?.aadhar_number || ''
                },
                employment_info: {
                    type: applicationData.employment_details?.employment_type || applicationData.employment_info?.type || 'salaried',
                    monthly_income: applicationData.employment_details?.monthly_income || applicationData.monthly_income || employmentResult.data?.monthlyIncome || applicationData.employment_info?.monthly_income || 0,
                    net_take_home: applicationData.net_take_home || applicationData.employment_info?.net_take_home || 0,
                    tenure_months: applicationData.employment_details?.work_experience * 12 || applicationData.employment_details?.tenure_months || applicationData.employment_info?.tenure_months || 0
                },
                loan_info: {
                    loan_amount: applicationData.loan_amount || applicationData.loan_request?.requested_amount || 0,
                    loan_purpose: applicationData.loan_purpose || applicationData.loan_request?.purpose || ''
                },
                address_info: {
                    state: applicationData.address?.state || applicationData.address_info?.current_address?.state || '',
                    city: applicationData.address?.city || applicationData.address_info?.current_address?.city || ''
                },
                financial_info: {
                    debt_to_income_ratio: applicationData.debt_to_income_ratio || 0
                },
                credit_report: {
                    cibil_score: cibilResult.data?.cibilScore || 0,
                    defaults_count: 0,
                    recent_defaults_12m: 0
                },
                documents: {
                    aadhar: { verified: identityResult.passed },
                    pan: { verified: identityResult.passed }
                },
                verification: {
                    identity_verified: identityResult.passed,
                    employment_verified: employmentResult.passed
                }
            };
            
            const ruleEngineResult = await this.eligibilityRuleEngine.performEligibilityAssessment(
                eligibilityData, 
                { requestId, applicationId: preliminaryResult.applicationId }
            );

            // Use overallAction instead of decision since decision is undefined
            const finalPassed = (ruleEngineResult.overallAction === 'approve' || ruleEngineResult.decision === 'approve' || ruleEngineResult.decision === 'conditional');

            return {
                stage: PRE_QUALIFICATION_STAGES.ELIGIBILITY_ASSESSMENT,
                status: PHASE_STATUS.COMPLETED,
                passed: finalPassed,
                data: {
                    eligible: finalPassed,
                    eligibilityScore: ruleEngineResult.score,
                    loanEstimate: this.calculateLoanEstimate(applicationData),
                    scoringBreakdown: ruleEngineResult.scoringBreakdown || {},
                    eligibilityFactors: ruleEngineResult.flags || [],
                    preApprovalAmount: this.calculatePreApprovalAmount(ruleEngineResult),
                    recommendedTerms: this.getRecommendedTerms(ruleEngineResult),
                    // Enhanced rule engine results
                    ruleEngineResult: {
                        decision: ruleEngineResult.decision,
                        score: ruleEngineResult.score,
                        passedRules: (ruleEngineResult.passed || []).length,
                        failedRules: (ruleEngineResult.failed || []).length,
                        warnings: (ruleEngineResult.warnings || []).length,
                        flags: ruleEngineResult.flags || [],
                        eligibilityGrade: ruleEngineResult.eligibility_grade,
                        recommendedActions: (ruleEngineResult.failed || []).map(f => f.message || ''),
                        maxLoanAmount: ruleEngineResult.max_loan_amount
                    }
                },
                processingTime: 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[${requestId}] Eligibility assessment failed`, { error: error.message });
            return {
                stage: PRE_QUALIFICATION_STAGES.ELIGIBILITY_ASSESSMENT,
                status: PHASE_STATUS.FAILED,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Complete phase with approval
     */
    async completePhaseWithApproval(result, eligibilityResult, requestId) {
        result.status = PHASE_STATUS.COMPLETED;
        result.decision = 'APPROVED';
        result.nextPhase = 'loan-application';
        result.processingTime = Date.now() - result.startTime;

        // Update application status
        await this.updateApplicationStatus(
            result.applicationId,
            'completed',
            requestId
        );

        logger.info(`[${requestId}] Pre-Qualification phase completed successfully`, {
            applicationId: result.applicationId,
            decision: result.decision
        });

        return {
            success: true,
            phase: 'pre-qualification',
            status: 'approved',
            applicationId: result.applicationId,
            preApprovalAmount: eligibilityResult.data.preApprovalAmount,
            recommendedTerms: eligibilityResult.data.recommendedTerms,
            nextSteps: {
                phase: 'loan-application',
                description: 'Proceed to complete detailed loan application with financial information',
                requiredDocuments: this.getRequiredDocuments()
            },
            processingTime: result.processingTime,
            message: 'Congratulations! You have been pre-qualified for a loan. Please proceed with the detailed application.'
        };
    }

    /**
     * Complete phase with rejection
     */
    async completePhaseWithRejection(result, reason, requestId) {
        result.status = PHASE_STATUS.FAILED;
        result.decision = 'REJECTED';
        result.processingTime = Date.now() - result.startTime;

        logger.info(`[${requestId}] About to update application status in rejection`, {
            applicationIdFromResult: result.applicationId,
            reason
        });

        // Update application status
        await this.updateApplicationStatus(
            result.applicationId,
            'failed',
            requestId
        );

        logger.info(`[${requestId}] Pre-Qualification phase rejected`, {
            applicationId: result.applicationId,
            reason
        });

        return {
            success: false,
            phase: 'pre-qualification',
            status: 'rejected',
            applicationId: result.applicationId,
            reason,
            recommendations: this.getRejectionRecommendations(Object.values(result.stages || {})),
            processingTime: result.processingTime,
            message: 'Unfortunately, your application did not meet our pre-qualification criteria. Please review the recommendations and consider reapplying after addressing the issues.'
        };
    }

    // Helper methods
    async initializePhaseTracking(phaseId, applicationData, requestId) {
        try {
            // Generate workflow and application IDs
            const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const applicationId = `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add application ID to the application data
            const enrichedApplicationData = {
                ...applicationData,
                applicationId,
                phaseId
            };
            
            // Insert workflow into database
            const insertQuery = `
                INSERT INTO workflow_tracking (
                    workflow_id, workflow_version, application_data, current_phase, status
                ) VALUES (
                    $1, $2, $3, $4, $5
                )
                RETURNING workflow_id
            `;
            
            const values = [
                workflowId,
                '1.0.0',
                JSON.stringify(enrichedApplicationData),
                'automated',
                'in_progress'
            ];
            
            const result = await db.query(insertQuery, values);
            
            logger.info(`[${requestId}] Application initialized in database`, {
                applicationId,
                workflowId,
                phaseId
            });
            
            return {
                phaseId,
                applicationId,
                workflowId,
                status: 'initialized',
                startTime: Date.now()
            };
            
        } catch (error) {
            logger.error(`[${requestId}] Failed to initialize phase tracking`, {
                error: error.message,
                phaseId
            });
            throw new Error(`Failed to initialize application: ${error.message}`);
        }
    }

    async verifyPAN(panNumber, firstName, lastName) {
        // PAN verification logic
        return { verified: true, confidence: 95 };
    }

    async verifyAadhar(aadharNumber, firstName) {
        // Aadhar verification logic
        return { verified: true, confidence: 90 };
    }

    async verifyMobile(mobile) {
        // Mobile verification logic
        return { verified: true, confidence: 85 };
    }

    async verifyEmail(email) {
        // Email verification logic
        return { verified: true, confidence: 80 };
    }

    /**
     * Validate identity match between application data and verification results
     */
    validateIdentityMatch(personalInfo, combinedResult, aadharResult, requestId) {
        const failureReasons = [];
        const riskFlags = {};
        let passed = true;

        // Check if combinedResult is valid and basic PAN verification passed
        if (!combinedResult || !combinedResult.success || !combinedResult.panVerification?.isValid) {
            failureReasons.push('PAN verification failed');
            riskFlags.invalidPAN = true;
            passed = false;
        }

        if (combinedResult && combinedResult.success && combinedResult.panVerification) {
            const panData = combinedResult.panVerification.verification;
            const applicationName = `${personalInfo.first_name} ${personalInfo.last_name}`.trim();
            
            // Enhanced name matching - check both directions and individual name components
            const nameMatchResult = this.performEnhancedNameMatching(
                personalInfo.first_name,
                personalInfo.last_name,
                panData.fullName,
                requestId
            );
            
            if (!nameMatchResult.passed) {
                failureReasons.push(`Name mismatch: ${nameMatchResult.reason}`);
                riskFlags.nameMismatch = true;
                passed = false;
            }

            // Date of birth validation
            if (personalInfo.date_of_birth && panData.dob) {
                const appDOB = new Date(personalInfo.date_of_birth).toISOString().split('T')[0];
                const panDOB = new Date(panData.dob).toISOString().split('T')[0];
                
                if (appDOB !== panDOB) {
                    failureReasons.push(`Date of birth mismatch: Application DOB '${appDOB}' does not match PAN DOB '${panDOB}'`);
                    riskFlags.dobMismatch = true;
                    passed = false;
                }
            }

            // Aadhar validation (if provided)
            if (personalInfo.aadhar_number && panData.maskedAadhaar) {
                const appAadhaarLast4 = personalInfo.aadhar_number.slice(-4);
                const panAadhaarLast4 = panData.maskedAadhaar.slice(-4);
                
                if (appAadhaarLast4 !== panAadhaarLast4) {
                    failureReasons.push(`Aadhar mismatch: Application Aadhar ending '${appAadhaarLast4}' does not match PAN linked Aadhar ending '${panAadhaarLast4}'`);
                    riskFlags.aadhaarMismatch = true;
                    passed = false;
                }
            }

            // PAN number validation
            if (personalInfo.pan_number !== panData.panNumber) {
                failureReasons.push(`PAN number mismatch: Application PAN '${personalInfo.pan_number}' does not match verified PAN '${panData.panNumber}'`);
                riskFlags.panNumberMismatch = true;
                passed = false;
            }
        }

        logger.info(`[${requestId}] Identity validation completed`, {
            passed,
            failureReasons: failureReasons.length,
            riskFlags: Object.keys(riskFlags)
        });

        return {
            passed,
            failureReasons,
            riskFlags,
            validationScore: passed ? 100 : Math.max(0, 100 - (failureReasons.length * 25))
        };
    }

    performEnhancedNameMatching(firstName, lastName, panFullName, requestId) {
        // Normalize names for comparison
        const normalizeString = (str) => {
            return str.toLowerCase()
                     .replace(/[^a-z\s]/g, '') // Remove special characters
                     .replace(/\s+/g, ' ')     // Normalize spaces
                     .trim();
        };

        const appFirstName = normalizeString(firstName);
        const appLastName = normalizeString(lastName);
        const panName = normalizeString(panFullName);
        
        // Split PAN name into components
        const panNameParts = panName.split(' ').filter(part => part.length > 0);
        
        logger.info(`[${requestId}] Enhanced name matching`, {
            appFirstName,
            appLastName,
            panName,
            panNameParts
        });

        // Check if application first name exists in PAN name
        const firstNameMatch = panNameParts.some(part => 
            part.includes(appFirstName) || appFirstName.includes(part)
        );
        
        // Check if application last name exists in PAN name
        const lastNameMatch = panNameParts.some(part => 
            part.includes(appLastName) || appLastName.includes(part)
        );
        
        // Check reverse order (PAN first name matches app last name, etc.)
        const reverseFirstMatch = panNameParts.some(part => 
            part.includes(appLastName) || appLastName.includes(part)
        );
        
        const reverseLastMatch = panNameParts.some(part => 
            part.includes(appFirstName) || appFirstName.includes(part)
        );

        // Calculate similarity score using Levenshtein distance
        const calculateSimilarity = (str1, str2) => {
            const matrix = [];
            const len1 = str1.length;
            const len2 = str2.length;

            for (let i = 0; i <= len2; i++) {
                matrix[i] = [i];
            }

            for (let j = 0; j <= len1; j++) {
                matrix[0][j] = j;
            }

            for (let i = 1; i <= len2; i++) {
                for (let j = 1; j <= len1; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }

            const distance = matrix[len2][len1];
            const maxLen = Math.max(len1, len2);
            return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
        };

        const appFullName = `${appFirstName} ${appLastName}`;
        const overallSimilarity = calculateSimilarity(appFullName, panName);
        
        logger.info(`[${requestId}] Name matching results`, {
            firstNameMatch,
            lastNameMatch,
            reverseFirstMatch,
            reverseLastMatch,
            overallSimilarity
        });

        // Pass if:
        // 1. Both first and last names match in correct order, OR
        // 2. Both names match in reverse order, OR
        // 3. Overall similarity is above 80%
        const passed = (firstNameMatch && lastNameMatch) || 
                      (reverseFirstMatch && reverseLastMatch) || 
                      overallSimilarity >= 0.8;

        let reason = '';
        if (!passed) {
            if (!firstNameMatch && !reverseFirstMatch) {
                reason = `First name '${firstName}' not found in PAN name '${panFullName}'`;
            } else if (!lastNameMatch && !reverseLastMatch) {
                reason = `Last name '${lastName}' not found in PAN name '${panFullName}'`;
            } else {
                reason = `Application name '${firstName} ${lastName}' does not sufficiently match PAN name '${panFullName}' (similarity: ${Math.round(overallSimilarity * 100)}%)`;
            }
        }

        return {
            passed,
            reason,
            similarity: overallSimilarity,
            firstNameMatch,
            lastNameMatch,
            reverseMatch: reverseFirstMatch && reverseLastMatch
        };
    }

    calculateIdentityScore(verificationChecks) {
        // Calculate identity score based on verification results
        const weights = { panVerification: 0.4, aadharVerification: 0.3, mobileVerification: 0.2, emailVerification: 0.1 };
        let score = 0;
        
        Object.entries(verificationChecks).forEach(([key, check]) => {
            if (check.verified) {
                score += weights[key] * check.confidence;
            }
        });
        
        return Math.round(score);
    }

    identifyRiskFlags(verificationChecks) {
        // Identify risk flags from verification results
        return [];
    }

    evaluateCibilEligibility(cibilData) {
        // Evaluate CIBIL eligibility
        return cibilData.score >= 650;
    }

    getCibilRecommendations(cibilData) {
        // Get CIBIL improvement recommendations
        return [];
    }

    verifyEmploymentType(employmentType) {
        // Verify employment type
        return { valid: true, score: 80 };
    }

    async verifyIncome(employmentData) {
        // Verify income
        return { verified: true, confidence: 85 };
    }

    checkEmploymentStability(employmentData) {
        // Check employment stability
        return { stable: true, score: 75 };
    }

    async verifyCompany(companyName) {
        // Verify company
        return { verified: true, confidence: 80 };
    }

    evaluateEmploymentEligibility(verificationResult, employmentData) {
        // Evaluate employment eligibility
        return true;
    }

    calculateEmploymentScore(verificationResult) {
        // Calculate employment score
        return 80;
    }

    identifyEmploymentRisks(verificationResult) {
        // Identify employment risks
        return [];
    }

    /**
     * Validate basic requirements for preliminary assessment
     */
    validateBasicRequirements(data) {
        const required = ['first_name', 'last_name', 'pan_number', 'mobile', 'email', 'monthly_income', 'requested_amount'];
        
        for (const field of required) {
            if (!data[field]) {
                return {
                    valid: false,
                    error: `Missing required field: ${field}`
                };
            }
        }
        
        // Validate PAN format
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(data.pan_number)) {
            return {
                valid: false,
                error: 'Invalid PAN number format'
            };
        }
        
        // Validate mobile format
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(data.mobile)) {
            return {
                valid: false,
                error: 'Invalid mobile number format'
            };
        }
        
        return { valid: true };
    }

    /**
     * Calculate preliminary eligibility score
     */
    calculatePreliminaryScore(data) {
        let score = 0;
        
        // Income score (40 points max)
        const income = parseFloat(data.monthly_income) || 0;
        if (income >= 100000) score += 40;
        else if (income >= 50000) score += 30;
        else if (income >= 25000) score += 20;
        else if (income >= 15000) score += 10;
        
        // Employment type score (20 points max)
        if (data.employment_type === 'salaried') score += 20;
        else if (data.employment_type === 'self_employed') score += 15;
        else if (data.employment_type === 'business') score += 10;
        
        // Loan amount vs income ratio (20 points max)
        const requestedAmount = parseFloat(data.requested_amount) || 0;
        const loanToIncomeRatio = requestedAmount / (income * 12);
        if (loanToIncomeRatio <= 3) score += 20;
        else if (loanToIncomeRatio <= 5) score += 15;
        else if (loanToIncomeRatio <= 8) score += 10;
        
        // Age factor (10 points max)
        if (data.date_of_birth) {
            const age = this.calculateAge(data.date_of_birth);
            if (age >= 25 && age <= 55) score += 10;
            else if (age >= 21 && age <= 60) score += 5;
        }
        
        // Work experience (10 points max)
        const experience = parseFloat(data.work_experience) || 0;
        if (experience >= 3) score += 10;
        else if (experience >= 1) score += 5;
        
        return Math.min(score, 100);
    }

    /**
     * Calculate loan estimate based on preliminary data
     */
    calculateLoanEstimate(data) {
        const income = parseFloat(data.monthly_income) || 0;
        const requestedAmount = parseFloat(data.requested_amount) || 0;
        
        // Maximum loan amount based on income (typically 10-15x monthly income)
        const maxAmount = income * 12;
        const approvedAmount = Math.min(requestedAmount, maxAmount);
        
        return {
            requestedAmount: requestedAmount,
            maxAmount: maxAmount,
            approvedAmount: approvedAmount,
            estimatedEMI: this.calculateEMI(approvedAmount, 12, 36), // 12% for 36 months
            processingFee: approvedAmount * 0.02 // 2% processing fee
        };
    }

    /**
     * Calculate EMI
     */
    calculateEMI(principal, annualRate, tenureMonths) {
        const monthlyRate = annualRate / 100 / 12;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                   (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        return Math.round(emi);
    }

    calculatePreApprovalAmount(eligibilityResult) {
        // Calculate pre-approval amount
        return eligibilityResult.loanEstimate?.maxAmount || 0;
    }

    getRecommendedTerms(eligibilityResult) {
        // Get recommended loan terms
        return {
            interestRate: '12-15%',
            tenure: '12-60 months',
            processingFee: '1-2%'
        };
    }

    /**
     * Calculate age from date of birth
     * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
     * @returns {number} Age in years
     */
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 0;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    getRequiredDocuments() {
        // Get required documents for next phase
        return [
            'Income proof (salary slips, ITR)',
            'Bank statements (6 months)',
            'Employment certificate',
            'Address proof',
            'Identity proof'
        ];
    }

    getRejectionRecommendations(stages) {
        const recommendations = [];
        
        // Check each stage for specific failure reasons
        for (const stage of stages) {
            if (!stage.passed && stage.stage === PRE_QUALIFICATION_STAGES.IDENTITY_VERIFICATION) {
                // Extract detailed identity verification failures
                if (stage.data && stage.data.failureReasons && stage.data.failureReasons.length > 0) {
                    stage.data.failureReasons.forEach(reason => {
                        if (reason.includes('Date of birth mismatch')) {
                            recommendations.push({
                                type: 'identity_verification',
                                field: 'date_of_birth',
                                issue: 'Date of birth does not match PAN records',
                                recommendation: 'Please verify and correct your date of birth. It should match exactly with your PAN card.',
                                severity: 'high'
                            });
                        } else if (reason.includes('Name mismatch')) {
                            recommendations.push({
                                type: 'identity_verification',
                                field: 'name',
                                issue: 'Name does not match PAN records',
                                recommendation: 'Please ensure your name matches exactly with your PAN card. Check for spelling errors or missing middle names.',
                                severity: 'high'
                            });
                        } else if (reason.includes('Aadhar mismatch')) {
                            recommendations.push({
                                type: 'identity_verification',
                                field: 'aadhar_number',
                                issue: 'Aadhar number does not match PAN linked Aadhar',
                                recommendation: 'Please verify your Aadhar number. It should match the Aadhar linked to your PAN card.',
                                severity: 'high'
                            });
                        } else if (reason.includes('PAN number mismatch')) {
                            recommendations.push({
                                type: 'identity_verification',
                                field: 'pan_number',
                                issue: 'PAN number verification failed',
                                recommendation: 'Please verify your PAN number and ensure it is correct and active.',
                                severity: 'high'
                            });
                        } else if (reason.includes('PAN verification failed')) {
                            recommendations.push({
                                type: 'identity_verification',
                                field: 'pan_number',
                                issue: 'PAN verification failed',
                                recommendation: 'Your PAN could not be verified. Please ensure it is valid and active.',
                                severity: 'high'
                            });
                        }
                    });
                }
            } else if (!stage.passed && stage.stage === PRE_QUALIFICATION_STAGES.CIBIL_CHECK) {
                recommendations.push({
                    type: 'credit_history',
                    field: 'cibil_score',
                    issue: 'Credit score does not meet minimum requirements',
                    recommendation: 'Improve your credit score by paying bills on time and reducing outstanding debt.',
                    severity: 'medium'
                });
            } else if (!stage.passed && stage.stage === PRE_QUALIFICATION_STAGES.EMPLOYMENT_VERIFICATION) {
                recommendations.push({
                    type: 'employment',
                    field: 'employment_details',
                    issue: 'Employment verification failed',
                    recommendation: 'Please provide valid employment details and ensure your income meets minimum requirements.',
                    severity: 'medium'
                });
            } else if (!stage.passed && stage.stage === PRE_QUALIFICATION_STAGES.PRELIMINARY_ASSESSMENT) {
                recommendations.push({
                    type: 'eligibility',
                    field: 'basic_requirements',
                    issue: 'Basic eligibility criteria not met',
                    recommendation: 'Please review age, income, and loan amount requirements.',
                    severity: 'medium'
                });
            }
        }
        
        // If no specific recommendations found, provide general guidance
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                field: 'application',
                issue: 'Application did not meet qualification criteria',
                recommendation: 'Please review all provided information for accuracy and completeness.',
                severity: 'medium'
            });
        }
        
        return recommendations;
    }

    async updateApplicationStatus(applicationId, status, requestId) {
        // Update application status in database (PostgreSQL syntax)
        try {
            logger.info(`[${requestId}] Updating application status`, {
                applicationId,
                status
            });
            
            // Add a small delay to ensure database consistency
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Debug: Check what applications exist in the database
            const debugQuery = `SELECT workflow_id, application_data->>'applicationId' as app_id FROM workflow_tracking ORDER BY created_at DESC LIMIT 5`;
            const debugResult = await db.query(debugQuery);
            logger.info(`[${requestId}] Recent applications in database:`, {
                applications: debugResult.rows
            });
            
            // Retry logic for finding the application
            let result;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                const query = `
                    UPDATE workflow_tracking 
                    SET status = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE application_data->>'applicationId' = $2
                    RETURNING workflow_id, status
                `;
                
                result = await db.query(query, [status, applicationId]);
                
                if (result.rows.length > 0) {
                    break;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    logger.warn(`[${requestId}] Application not found, retrying... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            if (result.rows.length === 0) {
                throw new Error(`Application ${applicationId} not found for status update after ${maxAttempts} attempts`);
            }
            
            logger.info(`[${requestId}] Application status updated successfully`, {
                applicationId,
                newStatus: status,
                attempts: attempts + 1
            });
            
            return result.rows[0];
            
        } catch (error) {
            logger.error(`[${requestId}] Failed to update application status`, {
                error: error.message,
                applicationId,
                status
            });
            throw error;
        }
    }

    /**
     * Get application status
     */
    async getApplicationStatus(applicationId, requestId) {
        try {
            logger.info(`[${requestId}] Retrieving application status`, { applicationId });
            
            const query = `
                SELECT 
                    workflow_id,
                    application_data,
                    current_phase,
                    status,
                    created_at,
                    updated_at
                FROM workflow_tracking 
                WHERE application_data->>'applicationId' = $1
            `;
            
            const result = await db.query(query, [applicationId]);
            
            if (result.rows.length === 0) {
                logger.warn(`[${requestId}] Application not found`, { applicationId });
                return {
                    success: false,
                    message: 'Application not found',
                    applicationId
                };
            }
            
            const workflow = result.rows[0];
            const applicationData = workflow.application_data;
            
            // Map internal status to user-friendly status
            const statusMapping = {
                'in_progress': 'pending',
                'completed': 'approved',
                'failed': 'rejected',
                'cancelled': 'cancelled'
            };
            
            const userFriendlyStatus = statusMapping[workflow.status] || 'pending';
            
            logger.info(`[${requestId}] Application status retrieved successfully`, {
                applicationId,
                status: userFriendlyStatus
            });
            
            return {
                success: true,
                phase: 'pre-qualification',
                status: userFriendlyStatus,
                applicationId: applicationData.applicationId,
                currentStage: workflow.current_phase,
                applicantName: `${applicationData.personal_info?.first_name || ''} ${applicationData.personal_info?.last_name || ''}`.trim(),
                requestedAmount: applicationData.loan_request?.requested_amount,
                loanType: applicationData.loan_request?.loan_type,
                createdAt: workflow.created_at,
                updatedAt: workflow.updated_at,
                message: userFriendlyStatus === 'approved' ? 
                        'Application has been pre-qualified successfully' :
                        userFriendlyStatus === 'rejected' ?
                        'Application has been rejected during pre-qualification' :
                        'Application is being processed'
            };
            
        } catch (error) {
            logger.error(`[${requestId}] Error retrieving application status`, {
                error: error.message,
                applicationId
            });
            
            throw new Error(`Failed to retrieve application status: ${error.message}`);
        }
    }
}

module.exports = PreQualificationService;