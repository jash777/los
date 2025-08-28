/**
 * Loan Funding Service (Stage 7)
 * Final loan disbursement and account activation
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');

class LoanFundingService {
    constructor() {
        this.disbursementMethods = {
            NEFT: 'neft',
            RTGS: 'rtgs',
            IMPS: 'imps',
            UPI: 'upi'
        };
    }

    /**
     * Process loan funding (Stage 7)
     */
    async processLoanFunding(applicationNumber, requestId) {
        const startTime = Date.now();
        
        logger.info(`[${requestId}] Starting loan funding process for ${applicationNumber}`);

        try {
            // Get existing application
            const existingApp = await databaseService.getCompleteApplication(applicationNumber);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            if (existingApp.current_stage !== 'quality_check' || existingApp.current_status !== 'approved') {
                throw new Error('Application must complete quality check to proceed to funding');
            }

            const applicationId = existingApp.id;

            // Update stage to loan-funding
            await databaseService.updateApplicationStage(applicationId, 'loan_funding', 'under_review');

            // Step 1: Loan agreement finalization
            const loanAgreementResult = await this.finalizeLoanAgreement(existingApp, requestId);

            // Step 2: Account setup and validation
            const accountSetupResult = await this.setupLoanAccount(existingApp, requestId);

            // Step 3: Disbursement preparation
            const disbursementPrepResult = await this.prepareDisbursement(existingApp, loanAgreementResult, requestId);

            // Step 4: Final compliance check
            const finalComplianceResult = await this.performFinalComplianceCheck(existingApp, requestId);

            // Step 5: Execute disbursement
            const disbursementResult = await this.executeDisbursement(disbursementPrepResult, requestId);

            // Step 6: Post-disbursement setup
            const postDisbursementResult = await this.performPostDisbursementSetup(existingApp, disbursementResult, requestId);

            // Step 7: Save funding results
            await this.saveFundingResults(applicationId, {
                loan_agreement: loanAgreementResult,
                account_setup: accountSetupResult,
                disbursement_preparation: disbursementPrepResult,
                final_compliance: finalComplianceResult,
                disbursement_execution: disbursementResult,
                post_disbursement: postDisbursementResult
            });

            // Step 8: Update final status
            await databaseService.updateApplicationStage(applicationId, 'loan_funding', 'completed', {
                funding_result: disbursementResult,
                processing_time_ms: Date.now() - startTime
            });

            // Step 9: Return response
            return this.createSuccessResponse(applicationNumber, disbursementResult, postDisbursementResult, startTime);

        } catch (error) {
            logger.error(`[${requestId}] Loan funding process failed:`, error);
            return this.createSystemErrorResponse(startTime, error.message);
        }
    }

    /**
     * Finalize loan agreement
     */
    async finalizeLoanAgreement(existingApp, requestId) {
        logger.info(`[${requestId}] Finalizing loan agreement`);

        // Get approved loan terms from credit decision
        const creditDecision = existingApp.decisions?.find(d => d.stage_name === 'credit_decision') || {};
        const loanTerms = creditDecision.recommended_terms || {};

        const loanAgreement = {
            agreement_number: this.generateAgreementNumber(),
            loan_terms: {
                principal_amount: loanTerms.loan_amount || 500000,
                interest_rate: loanTerms.interest_rate || 12.5,
                tenure_months: loanTerms.tenure_months || 36,
                emi_amount: loanTerms.emi_amount || 16500,
                processing_fee: loanTerms.processing_fee || 5000,
                insurance_premium: loanTerms.insurance_required ? 2500 : 0,
                total_interest: this.calculateTotalInterest(loanTerms),
                total_repayment: this.calculateTotalRepayment(loanTerms)
            },
            repayment_schedule: this.generateRepaymentSchedule(loanTerms),
            terms_and_conditions: {
                prepayment_charges: loanTerms.prepayment_charges || 2,
                late_payment_charges: loanTerms.late_payment_charges || 500,
                bounce_charges: 750,
                foreclosure_charges: loanTerms.foreclosure_charges || 4,
                documentation_charges: 1000
            },
            legal_clauses: {
                jurisdiction: 'Mumbai, Maharashtra',
                governing_law: 'Indian Contract Act, 1872',
                dispute_resolution: 'Arbitration',
                force_majeure: true,
                assignment_rights: 'Lender retains right to assign'
            },
            customer_acceptance: {
                digital_signature_required: true,
                witness_required: false,
                notarization_required: false,
                acceptance_timestamp: null,
                ip_address: null
            }
        };

        // Generate agreement document
        const agreementDocument = await this.generateAgreementDocument(loanAgreement);

        return {
            agreement_details: loanAgreement,
            agreement_document: agreementDocument,
            status: 'generated',
            requires_customer_acceptance: true,
            validity_days: 30
        };
    }

    /**
     * Setup loan account
     */
    async setupLoanAccount(existingApp, requestId) {
        logger.info(`[${requestId}] Setting up loan account`);

        const loanAccountNumber = this.generateLoanAccountNumber();
        const customerAccountNumber = this.generateCustomerAccountNumber();

        const accountSetup = {
            loan_account: {
                account_number: loanAccountNumber,
                account_type: 'LOAN_ACCOUNT',
                product_code: 'PL001',
                branch_code: 'HO001',
                ifsc_code: 'LEND0000001',
                account_status: 'ACTIVE',
                opening_date: new Date().toISOString().split('T')[0],
                maturity_date: this.calculateMaturityDate(36)
            },
            customer_account: {
                account_number: customerAccountNumber,
                account_type: 'SAVINGS',
                bank_name: existingApp.banking_details?.bank_name || 'HDFC Bank',
                account_holder_name: existingApp.personal_details?.full_name,
                ifsc_code: existingApp.banking_details?.ifsc_code || 'HDFC0000123',
                account_status: 'VERIFIED'
            },
            account_linking: {
                primary_repayment_account: customerAccountNumber,
                auto_debit_setup: true,
                mandate_amount: 20000,
                mandate_validity: this.calculateMaturityDate(36)
            }
        };

        // Validate account details
        const validationResult = await this.validateAccountSetup(accountSetup);

        return {
            account_setup: accountSetup,
            validation_result: validationResult,
            setup_status: validationResult.valid ? 'completed' : 'pending_correction'
        };
    }

    /**
     * Execute disbursement
     */
    async executeDisbursement(disbursementPrepResult, requestId) {
        logger.info(`[${requestId}] Executing disbursement`);

        const disbursementDetails = disbursementPrepResult.disbursement_preparation.disbursement_details;

        // Simulate disbursement execution
        const disbursementExecution = {
            transaction_id: this.generateTransactionId(),
            utr_number: this.generateUTRNumber(),
            disbursement_status: 'SUCCESS',
            disbursement_timestamp: new Date().toISOString(),
            amount_disbursed: disbursementDetails.net_disbursement_amount,
            disbursement_method: disbursementDetails.disbursement_method,
            beneficiary_confirmation: {
                account_credited: true,
                credit_timestamp: new Date().toISOString(),
                bank_reference: this.generateBankReference()
            }
        };

        return disbursementExecution;
    }

    // Helper methods
    generateAgreementNumber() {
        return `LA${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }

    generateTransactionId() {
        return `${Date.now()}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    }

    generateUTRNumber() {
        return `UTR${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }

    calculateTotalInterest(loanTerms) {
        const principal = loanTerms.loan_amount || 500000;
        const emi = loanTerms.emi_amount || 16500;
        const tenure = loanTerms.tenure_months || 36;
        
        return Math.round((emi * tenure) - principal);
    }

    calculateTotalRepayment(loanTerms) {
        const emi = loanTerms.emi_amount || 16500;
        const tenure = loanTerms.tenure_months || 36;
        return emi * tenure;
    }

    generateRepaymentSchedule(loanTerms) {
        const schedule = [];
        const emi = loanTerms.emi_amount || 16500;
        const rate = (loanTerms.interest_rate || 12.5) / 100 / 12;
        let balance = loanTerms.loan_amount || 500000;
        
        for (let i = 1; i <= (loanTerms.tenure_months || 36); i++) {
            const interest = Math.round(balance * rate);
            const principal = emi - interest;
            balance = Math.max(0, balance - principal);
            
            schedule.push({
                installment_number: i,
                emi_amount: emi,
                principal_component: principal,
                interest_component: interest,
                outstanding_balance: balance
            });
        }
        
        return schedule;
    }

    createSuccessResponse(applicationNumber, disbursementResult, postDisbursementResult, startTime) {
        return {
            success: true,
            phase: 'loan_funding',
            status: 'completed',
            applicationNumber,
            disbursement_details: {
                transaction_id: disbursementResult.transaction_id,
                utr_number: disbursementResult.utr_number,
                amount_disbursed: disbursementResult.amount_disbursed,
                disbursement_method: disbursementResult.disbursement_method
            },
            processing_time_ms: Date.now() - startTime,
            message: 'Loan funding completed successfully!'
        };
    }

    createSystemErrorResponse(startTime, errorMessage) {
        return {
            success: false,
            phase: 'loan_funding',
            status: 'error',
            error: 'System error during loan funding',
            message: errorMessage,
            processing_time_ms: Date.now() - startTime
        };
    }
    /**
     * Get loan funding status
     */
    async getLoanFundingStatus(applicationNumber) {
        try {
            const application = await databaseService.getCompleteApplication(applicationNumber);
            if (!application) {
                throw new Error('Application not found');
            }

            return {
                applicationNumber,
                current_stage: application.current_stage,
                current_status: application.current_status,
                funding_completed: application.current_stage === 'loan_funding' && 
                                 application.current_status === 'completed'
            };
        } catch (error) {
            throw new Error(`Failed to get loan funding status: ${error.message}`);
        }
    }
}

module.exports = LoanFundingService;