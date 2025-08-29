/**
 * Co-Lending Service
 * Business logic for co-lending partnerships, ratio management, and distribution
 */

const logger = require('../utils/logger');
const databaseService = require('../database/service');

class CoLendingService {
    constructor() {
        this.defaultBankRatio = 80.00;
        this.defaultNbfcRatio = 20.00;
    }

    /**
     * Get optimal co-lending partners and ratios for a loan application
     */
    async getOptimalCoLendingArrangement(applicationData) {
        try {
            const { loan_amount, cibil_score, loan_purpose } = applicationData;
            
            logger.info(`Finding optimal co-lending arrangement for loan: ${loan_amount}, CIBIL: ${cibil_score}`);

            // Find matching co-lending rules
            const connection = await databaseService.pool.getConnection();
            
            const [ratioRules] = await connection.execute(`
                SELECT 
                    clr.*,
                    bp.partner_name as bank_name,
                    bp.partner_code as bank_code,
                    bp.api_endpoint as bank_api,
                    np.partner_name as nbfc_name,
                    np.partner_code as nbfc_code,
                    np.api_endpoint as nbfc_api
                FROM co_lending_ratios clr
                LEFT JOIN co_lending_partners bp ON clr.bank_partner_id = bp.id
                LEFT JOIN co_lending_partners np ON clr.nbfc_partner_id = np.id
                WHERE clr.status = 'active'
                AND clr.loan_amount_min <= ? 
                AND clr.loan_amount_max >= ?
                AND clr.cibil_score_min <= ? 
                AND clr.cibil_score_max >= ?
                AND bp.status = 'active'
                AND np.status = 'active'
                ORDER BY clr.priority_order ASC, clr.is_default DESC
                LIMIT 1
            `, [loan_amount, loan_amount, cibil_score, cibil_score]);

            connection.release();

            let arrangement;
            
            if (ratioRules.length > 0) {
                const rule = ratioRules[0];
                arrangement = {
                    rule_id: rule.id,
                    rule_name: rule.rule_name,
                    bank_partner: {
                        id: rule.bank_partner_id,
                        name: rule.bank_name,
                        code: rule.bank_code,
                        api_endpoint: rule.bank_api
                    },
                    nbfc_partner: {
                        id: rule.nbfc_partner_id,
                        name: rule.nbfc_name,
                        code: rule.nbfc_code,
                        api_endpoint: rule.nbfc_api
                    },
                    bank_ratio: rule.bank_ratio,
                    nbfc_ratio: rule.nbfc_ratio,
                    bank_amount: (loan_amount * rule.bank_ratio / 100).toFixed(2),
                    nbfc_amount: (loan_amount * rule.nbfc_ratio / 100).toFixed(2)
                };
            } else {
                // Use default arrangement
                const defaultPartners = await this.getDefaultPartners();
                arrangement = {
                    rule_id: null,
                    rule_name: 'Default Fallback',
                    bank_partner: defaultPartners.bank,
                    nbfc_partner: defaultPartners.nbfc,
                    bank_ratio: this.defaultBankRatio,
                    nbfc_ratio: this.defaultNbfcRatio,
                    bank_amount: (loan_amount * this.defaultBankRatio / 100).toFixed(2),
                    nbfc_amount: (loan_amount * this.defaultNbfcRatio / 100).toFixed(2)
                };
            }

            logger.info(`Optimal arrangement: ${arrangement.bank_partner.name} (${arrangement.bank_ratio}%) + ${arrangement.nbfc_partner.name} (${arrangement.nbfc_ratio}%)`);
            
            return {
                success: true,
                arrangement
            };

        } catch (error) {
            logger.error('Error finding optimal co-lending arrangement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create co-lending transaction
     */
    async createCoLendingTransaction(applicationNumber, loanAmount, arrangement) {
        const connection = await databaseService.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const transactionId = `CLT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Insert co-lending transaction
            await connection.execute(`
                INSERT INTO co_lending_transactions (
                    transaction_id, application_number, loan_amount,
                    bank_partner_id, nbfc_partner_id,
                    bank_amount, nbfc_amount, bank_ratio, nbfc_ratio,
                    transaction_status, transaction_details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'initiated', ?)
            `, [
                transactionId,
                applicationNumber,
                loanAmount,
                arrangement.bank_partner.id,
                arrangement.nbfc_partner.id,
                arrangement.bank_amount,
                arrangement.nbfc_amount,
                arrangement.bank_ratio,
                arrangement.nbfc_ratio,
                JSON.stringify({
                    rule_name: arrangement.rule_name,
                    created_by: 'system',
                    created_at: new Date().toISOString()
                })
            ]);

            await connection.commit();
            
            logger.info(`Co-lending transaction created: ${transactionId}`);
            
            return {
                success: true,
                transaction_id: transactionId,
                arrangement
            };

        } catch (error) {
            await connection.rollback();
            logger.error('Error creating co-lending transaction:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Initiate bank API integration for loan distribution
     */
    async initiateDistributedLoanProcessing(transactionId) {
        try {
            logger.info(`Initiating distributed loan processing for transaction: ${transactionId}`);

            // Get transaction details
            const transaction = await this.getTransactionDetails(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Parallel API calls to both bank and NBFC
            const [bankResult, nbfcResult] = await Promise.allSettled([
                this.callBankAPI(transaction),
                this.callNBFCAPI(transaction)
            ]);

            // Update transaction status based on API responses
            await this.updateTransactionStatus(transactionId, bankResult, nbfcResult);

            return {
                success: true,
                transaction_id: transactionId,
                bank_status: bankResult.status,
                nbfc_status: nbfcResult.status,
                bank_response: bankResult.status === 'fulfilled' ? bankResult.value : bankResult.reason,
                nbfc_response: nbfcResult.status === 'fulfilled' ? nbfcResult.value : nbfcResult.reason
            };

        } catch (error) {
            logger.error('Error initiating distributed loan processing:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get transaction details
     */
    async getTransactionDetails(transactionId) {
        const connection = await databaseService.pool.getConnection();
        
        try {
            const [transactions] = await connection.execute(`
                SELECT 
                    clt.*,
                    bp.partner_name as bank_name, bp.partner_code as bank_code, bp.api_endpoint as bank_api,
                    np.partner_name as nbfc_name, np.partner_code as nbfc_code, np.api_endpoint as nbfc_api
                FROM co_lending_transactions clt
                JOIN co_lending_partners bp ON clt.bank_partner_id = bp.id
                JOIN co_lending_partners np ON clt.nbfc_partner_id = np.id
                WHERE clt.transaction_id = ?
            `, [transactionId]);

            return transactions.length > 0 ? transactions[0] : null;

        } finally {
            connection.release();
        }
    }

    /**
     * Call Bank API for loan processing
     */
    async callBankAPI(transaction) {
        try {
            logger.info(`Calling bank API for transaction: ${transaction.transaction_id}`);

            // Simulate bank API call
            const bankPayload = {
                transaction_id: transaction.transaction_id,
                application_number: transaction.application_number,
                loan_amount: transaction.bank_amount,
                partner_share: transaction.bank_ratio,
                processing_type: 'co_lending',
                nbfc_partner: transaction.nbfc_code
            };

            // Log API request
            await this.logAPIRequest(transaction.bank_partner_id, 'bank_loan_processing', 'POST', bankPayload);

            // Simulate API response (in real implementation, use actual HTTP client)
            const response = await this.simulateBankAPIResponse(bankPayload);
            
            // Log API response
            await this.logAPIResponse(transaction.bank_partner_id, response);

            return response;

        } catch (error) {
            logger.error('Bank API call failed:', error);
            throw error;
        }
    }

    /**
     * Call NBFC API for loan processing
     */
    async callNBFCAPI(transaction) {
        try {
            logger.info(`Calling NBFC API for transaction: ${transaction.transaction_id}`);

            // Simulate NBFC API call
            const nbfcPayload = {
                transaction_id: transaction.transaction_id,
                application_number: transaction.application_number,
                loan_amount: transaction.nbfc_amount,
                partner_share: transaction.nbfc_ratio,
                processing_type: 'co_lending',
                bank_partner: transaction.bank_code
            };

            // Log API request
            await this.logAPIRequest(transaction.nbfc_partner_id, 'nbfc_loan_processing', 'POST', nbfcPayload);

            // Simulate API response
            const response = await this.simulateNBFCAPIResponse(nbfcPayload);
            
            // Log API response
            await this.logAPIResponse(transaction.nbfc_partner_id, response);

            return response;

        } catch (error) {
            logger.error('NBFC API call failed:', error);
            throw error;
        }
    }

    /**
     * Simulate Bank API Response (replace with actual API integration)
     */
    async simulateBankAPIResponse(payload) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            return {
                status: 'approved',
                reference_id: `BNK_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                approved_amount: payload.loan_amount,
                processing_fee: (payload.loan_amount * 0.01).toFixed(2),
                disbursement_timeline: '2-3 business days',
                message: 'Bank approval successful'
            };
        } else {
            throw new Error('Bank approval failed - insufficient funds or policy violation');
        }
    }

    /**
     * Simulate NBFC API Response (replace with actual API integration)
     */
    async simulateNBFCAPIResponse(payload) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));

        // Simulate 85% success rate
        const isSuccess = Math.random() > 0.15;

        if (isSuccess) {
            return {
                status: 'approved',
                reference_id: `NBFC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                approved_amount: payload.loan_amount,
                processing_fee: (payload.loan_amount * 0.015).toFixed(2),
                disbursement_timeline: '1-2 business days',
                message: 'NBFC approval successful'
            };
        } else {
            throw new Error('NBFC approval failed - risk assessment or capacity constraints');
        }
    }

    /**
     * Update transaction status based on API responses
     */
    async updateTransactionStatus(transactionId, bankResult, nbfcResult) {
        const connection = await databaseService.pool.getConnection();
        
        try {
            let bankStatus = 'pending';
            let nbfcStatus = 'pending';
            let transactionStatus = 'initiated';
            let bankRef = null;
            let nbfcRef = null;

            // Process bank result
            if (bankResult.status === 'fulfilled') {
                bankStatus = 'approved';
                bankRef = bankResult.value.reference_id;
            } else {
                bankStatus = 'rejected';
            }

            // Process NBFC result
            if (nbfcResult.status === 'fulfilled') {
                nbfcStatus = 'approved';
                nbfcRef = nbfcResult.value.reference_id;
            } else {
                nbfcStatus = 'rejected';
            }

            // Determine overall transaction status
            if (bankStatus === 'approved' && nbfcStatus === 'approved') {
                transactionStatus = 'both_approved';
            } else if (bankStatus === 'approved') {
                transactionStatus = 'bank_approved';
            } else if (nbfcStatus === 'approved') {
                transactionStatus = 'nbfc_approved';
            } else {
                transactionStatus = 'failed';
            }

            // Update transaction
            await connection.execute(`
                UPDATE co_lending_transactions
                SET 
                    transaction_status = ?,
                    bank_approval_status = ?,
                    nbfc_approval_status = ?,
                    bank_transaction_ref = ?,
                    nbfc_transaction_ref = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE transaction_id = ?
            `, [transactionStatus, bankStatus, nbfcStatus, bankRef, nbfcRef, transactionId]);

            logger.info(`Transaction ${transactionId} updated: ${transactionStatus}`);

        } finally {
            connection.release();
        }
    }

    /**
     * Get default partners for fallback
     */
    async getDefaultPartners() {
        const connection = await databaseService.pool.getConnection();
        
        try {
            const [banks] = await connection.execute(`
                SELECT * FROM co_lending_partners 
                WHERE partner_type = 'bank' AND status = 'active' 
                ORDER BY risk_rating ASC, id ASC 
                LIMIT 1
            `);

            const [nbfcs] = await connection.execute(`
                SELECT * FROM co_lending_partners 
                WHERE partner_type = 'nbfc' AND status = 'active' 
                ORDER BY risk_rating ASC, id ASC 
                LIMIT 1
            `);

            return {
                bank: banks.length > 0 ? banks[0] : null,
                nbfc: nbfcs.length > 0 ? nbfcs[0] : null
            };

        } finally {
            connection.release();
        }
    }

    /**
     * Log API requests
     */
    async logAPIRequest(partnerId, endpoint, method, payload) {
        const connection = await databaseService.pool.getConnection();
        
        try {
            await connection.execute(`
                INSERT INTO co_lending_api_logs (
                    partner_id, api_endpoint, request_method, request_payload, request_timestamp
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [partnerId, endpoint, method, JSON.stringify(payload)]);

        } catch (error) {
            logger.error('Error logging API request:', error);
        } finally {
            connection.release();
        }
    }

    /**
     * Log API responses
     */
    async logAPIResponse(partnerId, response) {
        // This would typically update the corresponding request log
        // For simplicity, we'll create a new log entry
        const connection = await databaseService.pool.getConnection();
        
        try {
            await connection.execute(`
                INSERT INTO co_lending_api_logs (
                    partner_id, api_endpoint, request_method, response_status, 
                    response_payload, response_timestamp
                ) VALUES (?, 'response_log', 'RESPONSE', 200, ?, CURRENT_TIMESTAMP)
            `, [partnerId, JSON.stringify(response)]);

        } catch (error) {
            logger.error('Error logging API response:', error);
        } finally {
            connection.release();
        }
    }

    /**
     * Get co-lending analytics
     */
    async getCoLendingAnalytics(dateRange = 30) {
        const connection = await databaseService.pool.getConnection();
        
        try {
            // Overall statistics
            const [overallStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(loan_amount) as total_loan_amount,
                    AVG(loan_amount) as average_loan_amount,
                    SUM(bank_amount) as total_bank_amount,
                    SUM(nbfc_amount) as total_nbfc_amount,
                    COUNT(CASE WHEN transaction_status = 'both_approved' THEN 1 END) as both_approved_count,
                    COUNT(CASE WHEN transaction_status = 'disbursed' THEN 1 END) as disbursed_count,
                    AVG(bank_ratio) as average_bank_ratio,
                    AVG(nbfc_ratio) as average_nbfc_ratio
                FROM co_lending_transactions
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [dateRange]);

            // Partner-wise distribution
            const [partnerStats] = await connection.execute(`
                SELECT * FROM co_lending_partnership_summary
            `);

            // Monthly trends
            const [monthlyTrends] = await connection.execute(`
                SELECT * FROM co_lending_monthly_analytics
                ORDER BY month_year DESC
                LIMIT 12
            `);

            return {
                success: true,
                analytics: {
                    overall: overallStats[0],
                    partners: partnerStats,
                    monthly_trends: monthlyTrends,
                    date_range_days: dateRange
                }
            };

        } catch (error) {
            logger.error('Error getting co-lending analytics:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            connection.release();
        }
    }
}

module.exports = new CoLendingService();
