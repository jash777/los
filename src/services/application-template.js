const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ApplicationTemplateService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../../application-templates');
        this.applicationsDir = path.join(__dirname, '../../applications');
        this.directoriesReady = this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.templatesDir, { recursive: true });
            await fs.mkdir(this.applicationsDir, { recursive: true });
            logger.info('Application template directories created successfully');
        } catch (error) {
            logger.error('Error creating directories:', error);
            throw error;
        }
    }

    async waitForDirectories() {
        await this.directoriesReady;
    }

    // Create base application template
    createBaseTemplate() {
        return {
            application_info: {
                application_number: null,
                created_at: null,
                last_updated: null,
                current_stage: null,
                status: null
            },
            stage_1_data: {
                personal_details: {
                    full_name: null,
                    mobile: null,
                    email: null,
                    pan_number: null,
                    date_of_birth: null
                },
                loan_request: {
                    loan_amount: null,
                    loan_purpose: null,
                    preferred_tenure_months: null
                },
                eligibility_result: {
                    status: null,
                    score: null,
                    decision: null,
                    reasons: []
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
                },
                required_documents: {
                    identity_proof: null,
                    address_proof: null,
                    income_proof: null,
                    bank_statements: null,
                    employment_proof: null
                },
                additional_information: {
                    loan_purpose_details: null,
                    repayment_source: null,
                    preferred_tenure_months: null,
                    existing_relationship_with_bank: null,
                    co_applicant_required: null,
                    property_owned: null
                }
            },
            third_party_data: {
                cibil_data: {
                    score: null,
                    report_date: null,
                    credit_history: null,
                    existing_loans: [],
                    credit_utilization: null,
                    payment_history: null,
                    enquiries: []
                },
                pan_verification: {
                    verified: null,
                    name_match: null,
                    dob_match: null,
                    verification_date: null
                },
                employment_verification: {
                    verified: null,
                    company_verified: null,
                    salary_verified: null,
                    verification_date: null,
                    hr_response: null
                },
                bank_statement_analysis: {
                    average_balance: null,
                    salary_credits: [],
                    bounce_count: null,
                    irregular_transactions: [],
                    analysis_period: null,
                    financial_behavior_score: null
                }
            },
            processing_stages: {
                stage_3_application_processing: {
                    status: null,
                    processed_at: null,
                    result: null,
                    notes: null
                },
                stage_4_underwriting: {
                    status: null,
                    processed_at: null,
                    risk_assessment: null,
                    underwriter_notes: null,
                    recommended_amount: null,
                    recommended_terms: null
                },
                stage_5_credit_decision: {
                    status: null,
                    processed_at: null,
                    final_decision: null,
                    approved_amount: null,
                    approved_terms: null,
                    conditions: []
                },
                stage_6_quality_check: {
                    status: null,
                    processed_at: null,
                    document_completeness: null,
                    data_accuracy: null,
                    compliance_check: null,
                    quality_score: null
                },
                stage_7_loan_funding: {
                    status: null,
                    processed_at: null,
                    disbursement_details: null,
                    loan_agreement: null,
                    funding_date: null
                }
            },
            documents: {
                uploaded_documents: [],
                generated_documents: [],
                verification_documents: []
            },
            audit_trail: {
                created_by: null,
                created_at: null,
                stage_transitions: [],
                modifications: [],
                approvals: []
            }
        };
    }

    // Create application folder and initialize template
    async createApplicationFolder(applicationNumber) {
        try {
            // Ensure directories are ready
            await this.waitForDirectories();
            
            const appDir = path.join(this.applicationsDir, applicationNumber);
            
            // Create main application directory
            await fs.mkdir(appDir, { recursive: true });
            
            // Create subdirectories
            const subdirs = [
                'documents/uploaded',
                'documents/generated',
                'documents/verification',
                'third-party-data',
                'processing-logs',
                'communications'
            ];
            
            for (const subdir of subdirs) {
                await fs.mkdir(path.join(appDir, subdir), { recursive: true });
            }
            
            // Initialize application template
            const template = this.createBaseTemplate();
            template.application_info.application_number = applicationNumber;
            template.application_info.created_at = new Date().toISOString();
            template.application_info.current_stage = 'pre_qualification';
            template.application_info.status = 'initiated';
            
            // Save template to application folder
            await this.saveApplicationData(applicationNumber, template);
            
            logger.info(`Created application folder and template for ${applicationNumber}`);
            return { success: true, applicationDir: appDir };
            
        } catch (error) {
            logger.error(`Error creating application folder for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Update template with Stage 1 data
    async updateWithStage1Data(applicationNumber, stage1Data) {
        try {
            const template = await this.getApplicationData(applicationNumber);
            
            // Properly merge stage 1 data with existing data
            if (stage1Data.personal_details) {
                template.stage_1_data.personal_details = {
                    ...template.stage_1_data.personal_details,
                    ...stage1Data.personal_details
                };
            }
            
            if (stage1Data.loan_request) {
                template.stage_1_data.loan_request = {
                    ...template.stage_1_data.loan_request,
                    ...stage1Data.loan_request
                };
            }
            
            if (stage1Data.eligibility_result) {
                template.stage_1_data.eligibility_result = {
                    ...template.stage_1_data.eligibility_result,
                    ...stage1Data.eligibility_result
                };
            }
            
            // Update third-party data with CIBIL and PAN verification results
            if (stage1Data.cibil_result) {
                logger.info(`[${applicationNumber}] Updating CIBIL data:`, stage1Data.cibil_result);
                template.third_party_data.cibil_data = {
                    ...template.third_party_data.cibil_data,
                    score: stage1Data.cibil_result.score,
                    report_date: new Date().toISOString(),
                    credit_history: stage1Data.cibil_result.data?.payment_history || 'good',
                    existing_loans: stage1Data.cibil_result.data?.existing_loans || 0,
                    credit_utilization: stage1Data.cibil_result.data?.credit_utilization || 'low',
                    payment_history: stage1Data.cibil_result.data?.payment_history || 'good',
                    enquiries: stage1Data.cibil_result.data?.enquiries || []
                };
            }
            
            if (stage1Data.pan_verification_result) {
                logger.info(`[${applicationNumber}] Updating PAN verification data:`, stage1Data.pan_verification_result);
                template.third_party_data.pan_verification = {
                    ...template.third_party_data.pan_verification,
                    verified: stage1Data.pan_verification_result.success,
                    name_match: stage1Data.pan_verification_result.nameMatch?.isMatch || true,
                    dob_match: stage1Data.pan_verification_result.dobMatch?.isMatch || true,
                    verification_date: new Date().toISOString()
                };
            }
            
            template.application_info.last_updated = new Date().toISOString();
            template.application_info.current_stage = 'pre_qualification';
            template.application_info.status = stage1Data.eligibility_result?.decision || 'pending';
            
            // Add to audit trail
            template.audit_trail.stage_transitions.push({
                from_stage: 'initiated',
                to_stage: 'pre_qualification',
                timestamp: new Date().toISOString(),
                data_updated: 'stage_1_data'
            });
            
            await this.saveApplicationData(applicationNumber, template);
            logger.info(`Updated application ${applicationNumber} with Stage 1 data`);
            
            return template;
        } catch (error) {
            logger.error(`Error updating Stage 1 data for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Update template with Stage 2 data
    async updateWithStage2Data(applicationNumber, stage2Data) {
        try {
            const template = await this.getApplicationData(applicationNumber);
            
            logger.info(`[${applicationNumber}] Updating with Stage 2 data:`, JSON.stringify(stage2Data, null, 2));
            
            // Properly merge stage 2 data with existing data
            if (stage2Data.personal_details) {
                template.stage_2_data.personal_details = {
                    ...template.stage_2_data.personal_details,
                    ...stage2Data.personal_details
                };
            }
            
            if (stage2Data.employment_details) {
                template.stage_2_data.employment_details = {
                    ...template.stage_2_data.employment_details,
                    ...stage2Data.employment_details
                };
            }
            
            if (stage2Data.income_details) {
                logger.info(`[${applicationNumber}] Updating income details:`, stage2Data.income_details);
                template.stage_2_data.income_details = {
                    ...template.stage_2_data.income_details,
                    ...stage2Data.income_details
                };
            }
            
            if (stage2Data.banking_details) {
                template.stage_2_data.banking_details = {
                    ...template.stage_2_data.banking_details,
                    ...stage2Data.banking_details
                };
            }
            
            if (stage2Data.address_details) {
                template.stage_2_data.address_details = {
                    ...template.stage_2_data.address_details,
                    ...stage2Data.address_details
                };
            }
            
            if (stage2Data.references) {
                // Handle references properly - could be array or object
                if (Array.isArray(stage2Data.references)) {
                    // Convert array to object format for storage
                    const referencesObj = {};
                    stage2Data.references.forEach((ref, index) => {
                        referencesObj[index] = ref;
                    });
                    template.stage_2_data.references = {
                        ...template.stage_2_data.references,
                        ...referencesObj
                    };
                } else {
                    template.stage_2_data.references = {
                        ...template.stage_2_data.references,
                        ...stage2Data.references
                    };
                }
            }
            
            if (stage2Data.financial_details) {
                logger.info(`[${applicationNumber}] Updating financial details:`, stage2Data.financial_details);
                template.stage_2_data.financial_details = {
                    ...template.stage_2_data.financial_details,
                    ...stage2Data.financial_details
                };
            }
            
            if (stage2Data.required_documents) {
                logger.info(`[${applicationNumber}] Updating required documents:`, stage2Data.required_documents);
                template.stage_2_data.required_documents = {
                    ...template.stage_2_data.required_documents,
                    ...stage2Data.required_documents
                };
            }
            
            if (stage2Data.additional_information) {
                logger.info(`[${applicationNumber}] Updating additional information:`, stage2Data.additional_information);
                template.stage_2_data.additional_information = {
                    ...template.stage_2_data.additional_information,
                    ...stage2Data.additional_information
                };
            }
            
            if (stage2Data.application_result) {
                template.stage_2_data.application_result = {
                    ...template.stage_2_data.application_result,
                    ...stage2Data.application_result
                };
            }
            
            template.application_info.last_updated = new Date().toISOString();
            template.application_info.current_stage = 'loan_application';
            template.application_info.status = stage2Data.application_result?.decision || 'pending';
            
            // Add to audit trail
            template.audit_trail.stage_transitions.push({
                from_stage: 'pre_qualification',
                to_stage: 'loan_application',
                timestamp: new Date().toISOString(),
                data_updated: 'stage_2_data'
            });
            
            await this.saveApplicationData(applicationNumber, template);
            logger.info(`Updated application ${applicationNumber} with Stage 2 data`);
            
            return template;
        } catch (error) {
            logger.error(`Error updating Stage 2 data for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Update template with third-party data
    async updateWithThirdPartyData(applicationNumber, thirdPartyData) {
        try {
            const template = await this.getApplicationData(applicationNumber);
            
            // Update third-party data
            template.third_party_data = { ...template.third_party_data, ...thirdPartyData };
            template.application_info.last_updated = new Date().toISOString();
            
            // Save third-party data to separate files
            const appDir = path.join(this.applicationsDir, applicationNumber);
            const thirdPartyDir = path.join(appDir, 'third-party-data');
            
            // Ensure third-party data directory exists
            await fs.mkdir(thirdPartyDir, { recursive: true });
            
            if (thirdPartyData.cibil_data) {
                await fs.writeFile(
                    path.join(thirdPartyDir, 'cibil-report.json'),
                    JSON.stringify(thirdPartyData.cibil_data, null, 2)
                );
                logger.info(`Saved CIBIL report for ${applicationNumber}`);
            }
            
            if (thirdPartyData.bank_statement_analysis) {
                await fs.writeFile(
                    path.join(thirdPartyDir, 'bank-analysis.json'),
                    JSON.stringify(thirdPartyData.bank_statement_analysis, null, 2)
                );
                logger.info(`Saved bank analysis for ${applicationNumber}`);
            }
            
            if (thirdPartyData.pan_verification) {
                await fs.writeFile(
                    path.join(thirdPartyDir, 'pan-verification.json'),
                    JSON.stringify(thirdPartyData.pan_verification, null, 2)
                );
                logger.info(`Saved PAN verification for ${applicationNumber}`);
            }
            
            if (thirdPartyData.employment_verification) {
                await fs.writeFile(
                    path.join(thirdPartyDir, 'employment-verification.json'),
                    JSON.stringify(thirdPartyData.employment_verification, null, 2)
                );
                logger.info(`Saved employment verification for ${applicationNumber}`);
            }
            
            // Add to audit trail
            template.audit_trail.modifications.push({
                type: 'third_party_data_update',
                timestamp: new Date().toISOString(),
                data_sources: Object.keys(thirdPartyData)
            });
            
            await this.saveApplicationData(applicationNumber, template);
            logger.info(`Updated application ${applicationNumber} with third-party data`);
            
            return template;
        } catch (error) {
            logger.error(`Error updating third-party data for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Update processing stage data
    async updateProcessingStage(applicationNumber, stageName, stageData) {
        try {
            const template = await this.getApplicationData(applicationNumber);
            
            // Update processing stage
            if (template.processing_stages[stageName]) {
                template.processing_stages[stageName] = {
                    ...template.processing_stages[stageName],
                    ...stageData,
                    processed_at: new Date().toISOString()
                };
            }
            
            template.application_info.last_updated = new Date().toISOString();
            template.application_info.current_stage = stageName.replace('stage_', '').replace('_', '_');
            
            // Add to audit trail
            template.audit_trail.stage_transitions.push({
                stage: stageName,
                timestamp: new Date().toISOString(),
                status: stageData.status,
                result: stageData.result || stageData.final_decision
            });
            
            await this.saveApplicationData(applicationNumber, template);
            logger.info(`Updated processing stage ${stageName} for application ${applicationNumber}`);
            
            return template;
        } catch (error) {
            logger.error(`Error updating processing stage for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Save application data to file
    async saveApplicationData(applicationNumber, data) {
        try {
            const appDir = path.join(this.applicationsDir, applicationNumber);
            const filePath = path.join(appDir, 'application-data.json');
            
            // Ensure directory exists
            await fs.mkdir(appDir, { recursive: true });
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            
            // Remove old timestamped files to keep only the main file
            try {
                const files = await fs.readdir(appDir);
                for (const file of files) {
                    if (file.startsWith('application-data-') && file.endsWith('.json') && file !== 'application-data.json') {
                        await fs.unlink(path.join(appDir, file));
                        logger.info(`Removed old backup file: ${file}`);
                    }
                }
            } catch (cleanupError) {
                logger.warn(`Could not cleanup old backup files: ${cleanupError.message}`);
            }
            
        } catch (error) {
            logger.error(`Error saving application data for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Get application data
    async getApplicationData(applicationNumber) {
        try {
            const appDir = path.join(this.applicationsDir, applicationNumber);
            const filePath = path.join(appDir, 'application-data.json');
            
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
            
        } catch (error) {
            logger.error(`Error reading application data for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Save document to application folder
    async saveDocument(applicationNumber, documentType, documentData, filename) {
        try {
            const appDir = path.join(this.applicationsDir, applicationNumber);
            const docDir = path.join(appDir, 'documents', documentType);
            const filePath = path.join(docDir, filename);
            
            await fs.writeFile(filePath, documentData);
            
            // Update template with document reference
            const template = await this.getApplicationData(applicationNumber);
            template.documents[`${documentType}_documents`].push({
                filename,
                saved_at: new Date().toISOString(),
                file_path: filePath
            });
            
            await this.saveApplicationData(applicationNumber, template);
            
            logger.info(`Saved document ${filename} for application ${applicationNumber}`);
            return filePath;
            
        } catch (error) {
            logger.error(`Error saving document for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Generate application summary
    async generateApplicationSummary(applicationNumber) {
        try {
            const template = await this.getApplicationData(applicationNumber);
            
            const summary = {
                application_number: applicationNumber,
                applicant_name: template.stage_1_data.personal_details.full_name,
                loan_amount: template.stage_1_data.loan_request.loan_amount,
                current_stage: template.application_info.current_stage,
                status: template.application_info.status,
                created_at: template.application_info.created_at,
                last_updated: template.application_info.last_updated,
                completion_percentage: this.calculateCompletionPercentage(template),
                stage_status: {
                    stage_1: template.stage_1_data.eligibility_result.status || 'pending',
                    stage_2: template.stage_2_data.employment_details.company_name ? 'completed' : 'pending',
                    stage_3: template.processing_stages.stage_3_application_processing.status || 'pending',
                    stage_4: template.processing_stages.stage_4_underwriting.status || 'pending',
                    stage_5: template.processing_stages.stage_5_credit_decision.status || 'pending',
                    stage_6: template.processing_stages.stage_6_quality_check.status || 'pending',
                    stage_7: template.processing_stages.stage_7_loan_funding.status || 'pending'
                }
            };
            
            return summary;
            
        } catch (error) {
            logger.error(`Error generating summary for ${applicationNumber}:`, error);
            throw error;
        }
    }

    // Calculate completion percentage
    calculateCompletionPercentage(template) {
        let completedStages = 0;
        const totalStages = 7;
        
        // Check each stage completion
        if (template.stage_1_data.eligibility_result.status) completedStages++;
        if (template.stage_2_data.employment_details.company_name) completedStages++;
        if (template.processing_stages.stage_3_application_processing.status === 'approved') completedStages++;
        if (template.processing_stages.stage_4_underwriting.status === 'approved') completedStages++;
        if (template.processing_stages.stage_5_credit_decision.status === 'approved') completedStages++;
        if (template.processing_stages.stage_6_quality_check.status === 'approved') completedStages++;
        if (template.processing_stages.stage_7_loan_funding.status === 'completed') completedStages++;
        
        return Math.round((completedStages / totalStages) * 100);
    }

    // List all applications
    async listApplications() {
        try {
            const applications = await fs.readdir(this.applicationsDir);
            const summaries = [];
            
            for (const appNumber of applications) {
                try {
                    const summary = await this.generateApplicationSummary(appNumber);
                    summaries.push(summary);
                } catch (error) {
                    logger.warn(`Could not generate summary for ${appNumber}:`, error.message);
                }
            }
            
            return summaries;
            
        } catch (error) {
            logger.error('Error listing applications:', error);
            throw error;
        }
    }
}

module.exports = ApplicationTemplateService;