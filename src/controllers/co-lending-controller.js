/**
 * Co-Lending Controller
 * API endpoints for co-lending partnerships, ratios, and distribution management
 */

const logger = require('../utils/logger');
const coLendingService = require('../services/co-lending-service');
const databaseService = require('../database/service');

class CoLendingController {
    constructor() {
        // Bind methods to preserve 'this' context
        this.getPartners = this.getPartners.bind(this);
        this.createPartner = this.createPartner.bind(this);
        this.updatePartner = this.updatePartner.bind(this);
        this.getRatios = this.getRatios.bind(this);
        this.createRatio = this.createRatio.bind(this);
        this.updateRatio = this.updateRatio.bind(this);
        this.getOptimalArrangement = this.getOptimalArrangement.bind(this);
        this.createTransaction = this.createTransaction.bind(this);
        this.getTransactions = this.getTransactions.bind(this);
        this.processDistributedLoan = this.processDistributedLoan.bind(this);
        this.getAnalytics = this.getAnalytics.bind(this);
        this.getPortfolioAnalytics = this.getPortfolioAnalytics.bind(this);
        this.getSettlements = this.getSettlements.bind(this);
        this.getAPILogs = this.getAPILogs.bind(this);
    }

    /**
     * Get all co-lending partners
     * GET /api/co-lending/partners
     */
    async getPartners(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `partners_${Date.now()}`;
            const { type, status } = req.query;
            
            logger.info(`[${requestId}] Getting co-lending partners`);

            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT 
                    id, partner_code, partner_name, partner_type, license_number,
                    regulatory_authority, contact_details, status, risk_rating,
                    minimum_ticket_size, maximum_ticket_size, preferred_sectors,
                    created_at, updated_at
                FROM co_lending_partners
                WHERE 1=1
            `;
            const params = [];

            if (type) {
                query += ` AND partner_type = ?`;
                params.push(type);
            }

            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }

            query += ` ORDER BY partner_type, risk_rating, partner_name`;

            const [partners] = await connection.execute(query, params);
            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    partners: partners.map(partner => ({
                        ...partner,
                        contact_details: typeof partner.contact_details === 'string' 
                            ? JSON.parse(partner.contact_details) 
                            : partner.contact_details,
                        preferred_sectors: typeof partner.preferred_sectors === 'string' 
                            ? JSON.parse(partner.preferred_sectors) 
                            : partner.preferred_sectors
                    })),
                    total_count: partners.length,
                    banks_count: partners.filter(p => p.partner_type === 'bank').length,
                    nbfcs_count: partners.filter(p => p.partner_type === 'nbfc').length,
                    active_count: partners.filter(p => p.status === 'active').length
                },
                message: 'Co-lending partners retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting co-lending partners:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get co-lending partners',
                message: error.message
            });
        }
    }

    /**
     * Create new co-lending partner
     * POST /api/co-lending/partners
     */
    async createPartner(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `create_partner_${Date.now()}`;
            const partnerData = req.body;
            
            logger.info(`[${requestId}] Creating co-lending partner: ${partnerData.partner_name}`);

            // Validate required fields
            const requiredFields = ['partner_code', 'partner_name', 'partner_type'];
            for (const field of requiredFields) {
                if (!partnerData[field]) {
                    return res.status(400).json({
                        success: false,
                        error: 'Validation error',
                        message: `${field} is required`
                    });
                }
            }

            const connection = await databaseService.pool.getConnection();
            
            try {
                await connection.beginTransaction();

                await connection.execute(`
                    INSERT INTO co_lending_partners (
                        partner_code, partner_name, partner_type, license_number,
                        regulatory_authority, contact_details, api_endpoint, api_credentials,
                        status, risk_rating, minimum_ticket_size, maximum_ticket_size,
                        preferred_sectors, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    partnerData.partner_code,
                    partnerData.partner_name,
                    partnerData.partner_type,
                    partnerData.license_number || null,
                    partnerData.regulatory_authority || null,
                    JSON.stringify(partnerData.contact_details || {}),
                    partnerData.api_endpoint || null,
                    JSON.stringify(partnerData.api_credentials || {}),
                    partnerData.status || 'active',
                    partnerData.risk_rating || 'A',
                    partnerData.minimum_ticket_size || 0,
                    partnerData.maximum_ticket_size || 10000000,
                    JSON.stringify(partnerData.preferred_sectors || []),
                    'system'
                ]);

                await connection.commit();
                
                res.status(201).json({
                    success: true,
                    data: {
                        partner_code: partnerData.partner_code,
                        partner_name: partnerData.partner_name,
                        partner_type: partnerData.partner_type,
                        status: partnerData.status || 'active'
                    },
                    message: 'Co-lending partner created successfully',
                    requestId
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('Error creating co-lending partner:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({
                    success: false,
                    error: 'Partner already exists',
                    message: 'Partner code already exists'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create co-lending partner',
                    message: error.message
                });
            }
        }
    }

    /**
     * Update co-lending partner
     * PUT /api/co-lending/partners/:partnerId
     */
    async updatePartner(req, res) {
        try {
            const { partnerId } = req.params;
            const updateData = req.body;
            const requestId = req.headers['x-request-id'] || `update_partner_${Date.now()}`;
            
            logger.info(`[${requestId}] Updating co-lending partner: ${partnerId}`);

            const connection = await databaseService.pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Check if partner exists
                const [existing] = await connection.execute(
                    'SELECT id FROM co_lending_partners WHERE id = ?',
                    [partnerId]
                );

                if (existing.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Partner not found',
                        message: `No partner found with ID: ${partnerId}`
                    });
                }

                // Build update query dynamically
                const updateFields = [];
                const updateValues = [];

                const allowedFields = [
                    'partner_name', 'license_number', 'regulatory_authority',
                    'contact_details', 'api_endpoint', 'api_credentials',
                    'status', 'risk_rating', 'minimum_ticket_size',
                    'maximum_ticket_size', 'preferred_sectors'
                ];

                for (const field of allowedFields) {
                    if (updateData[field] !== undefined) {
                        updateFields.push(`${field} = ?`);
                        
                        if (field === 'contact_details' || field === 'api_credentials' || field === 'preferred_sectors') {
                            updateValues.push(JSON.stringify(updateData[field]));
                        } else {
                            updateValues.push(updateData[field]);
                        }
                    }
                }

                if (updateFields.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'No valid fields to update',
                        message: 'Please provide at least one field to update'
                    });
                }

                updateFields.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
                updateValues.push('system', partnerId);

                const query = `UPDATE co_lending_partners SET ${updateFields.join(', ')} WHERE id = ?`;
                await connection.execute(query, updateValues);

                await connection.commit();

                res.status(200).json({
                    success: true,
                    data: {
                        partner_id: partnerId,
                        updated_fields: Object.keys(updateData)
                    },
                    message: 'Co-lending partner updated successfully',
                    requestId
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('Error updating co-lending partner:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update co-lending partner',
                message: error.message
            });
        }
    }

    /**
     * Get co-lending ratios and rules
     * GET /api/co-lending/ratios
     */
    async getRatios(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `ratios_${Date.now()}`;
            
            logger.info(`[${requestId}] Getting co-lending ratios`);

            const connection = await databaseService.pool.getConnection();
            
            const [ratios] = await connection.execute(`
                SELECT 
                    clr.*,
                    bp.partner_name as bank_name,
                    bp.partner_code as bank_code,
                    np.partner_name as nbfc_name,
                    np.partner_code as nbfc_code
                FROM co_lending_ratios clr
                LEFT JOIN co_lending_partners bp ON clr.bank_partner_id = bp.id
                LEFT JOIN co_lending_partners np ON clr.nbfc_partner_id = np.id
                ORDER BY clr.priority_order ASC, clr.is_default DESC
            `);

            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    ratios: ratios,
                    total_count: ratios.length,
                    active_count: ratios.filter(r => r.status === 'active').length,
                    default_rule: ratios.find(r => r.is_default === 1)
                },
                message: 'Co-lending ratios retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting co-lending ratios:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get co-lending ratios',
                message: error.message
            });
        }
    }

    /**
     * Create new co-lending ratio rule
     * POST /api/co-lending/ratios
     */
    async createRatio(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `create_ratio_${Date.now()}`;
            const ratioData = req.body;
            
            logger.info(`[${requestId}] Creating co-lending ratio rule: ${ratioData.rule_name}`);

            // Validate ratios sum to 100
            const totalRatio = parseFloat(ratioData.bank_ratio || 0) + parseFloat(ratioData.nbfc_ratio || 0);
            if (Math.abs(totalRatio - 100) > 0.01) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid ratios',
                    message: 'Bank ratio and NBFC ratio must sum to 100%'
                });
            }

            const connection = await databaseService.pool.getConnection();
            
            try {
                await connection.beginTransaction();

                await connection.execute(`
                    INSERT INTO co_lending_ratios (
                        rule_name, loan_amount_min, loan_amount_max,
                        cibil_score_min, cibil_score_max, loan_purpose,
                        bank_partner_id, nbfc_partner_id, bank_ratio, nbfc_ratio,
                        is_default, priority_order, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    ratioData.rule_name,
                    ratioData.loan_amount_min || 0,
                    ratioData.loan_amount_max || 99999999,
                    ratioData.cibil_score_min || 0,
                    ratioData.cibil_score_max || 900,
                    ratioData.loan_purpose || null,
                    ratioData.bank_partner_id,
                    ratioData.nbfc_partner_id,
                    ratioData.bank_ratio,
                    ratioData.nbfc_ratio,
                    ratioData.is_default || false,
                    ratioData.priority_order || 1,
                    ratioData.status || 'active'
                ]);

                await connection.commit();
                
                res.status(201).json({
                    success: true,
                    data: {
                        rule_name: ratioData.rule_name,
                        bank_ratio: ratioData.bank_ratio,
                        nbfc_ratio: ratioData.nbfc_ratio,
                        status: ratioData.status || 'active'
                    },
                    message: 'Co-lending ratio rule created successfully',
                    requestId
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('Error creating co-lending ratio:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create co-lending ratio',
                message: error.message
            });
        }
    }

    /**
     * Update co-lending ratio rule
     * PUT /api/co-lending/ratios/:ratioId
     */
    async updateRatio(req, res) {
        try {
            const { ratioId } = req.params;
            const updateData = req.body;
            const requestId = req.headers['x-request-id'] || `update_ratio_${Date.now()}`;
            
            logger.info(`[${requestId}] Updating co-lending ratio: ${ratioId}`);

            // Validate ratios if provided
            if (updateData.bank_ratio && updateData.nbfc_ratio) {
                const totalRatio = parseFloat(updateData.bank_ratio) + parseFloat(updateData.nbfc_ratio);
                if (Math.abs(totalRatio - 100) > 0.01) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid ratios',
                        message: 'Bank ratio and NBFC ratio must sum to 100%'
                    });
                }
            }

            const connection = await databaseService.pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Check if ratio exists
                const [existing] = await connection.execute(
                    'SELECT id FROM co_lending_ratios WHERE id = ?',
                    [ratioId]
                );

                if (existing.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Ratio rule not found',
                        message: `No ratio rule found with ID: ${ratioId}`
                    });
                }

                // Build update query dynamically
                const updateFields = [];
                const updateValues = [];

                const allowedFields = [
                    'rule_name', 'loan_amount_min', 'loan_amount_max',
                    'cibil_score_min', 'cibil_score_max', 'loan_purpose',
                    'bank_partner_id', 'nbfc_partner_id', 'bank_ratio', 'nbfc_ratio',
                    'is_default', 'priority_order', 'status'
                ];

                for (const field of allowedFields) {
                    if (updateData[field] !== undefined) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(updateData[field]);
                    }
                }

                if (updateFields.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'No valid fields to update',
                        message: 'Please provide at least one field to update'
                    });
                }

                updateFields.push('updated_at = CURRENT_TIMESTAMP');
                updateValues.push(ratioId);

                const query = `UPDATE co_lending_ratios SET ${updateFields.join(', ')} WHERE id = ?`;
                await connection.execute(query, updateValues);

                await connection.commit();

                res.status(200).json({
                    success: true,
                    data: {
                        ratio_id: ratioId,
                        updated_fields: Object.keys(updateData)
                    },
                    message: 'Co-lending ratio updated successfully',
                    requestId
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.error('Error updating co-lending ratio:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update co-lending ratio',
                message: error.message
            });
        }
    }

    /**
     * Get optimal co-lending arrangement for a loan application
     * POST /api/co-lending/optimal-arrangement
     */
    async getOptimalArrangement(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `optimal_${Date.now()}`;
            const { loan_amount, cibil_score, loan_purpose } = req.body;
            
            logger.info(`[${requestId}] Getting optimal arrangement for loan: ${loan_amount}`);

            if (!loan_amount || !cibil_score) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'loan_amount and cibil_score are required'
                });
            }

            const result = await coLendingService.getOptimalCoLendingArrangement({
                loan_amount,
                cibil_score,
                loan_purpose
            });

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.arrangement,
                    message: 'Optimal co-lending arrangement found',
                    requestId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to find optimal arrangement',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error getting optimal co-lending arrangement:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get optimal arrangement',
                message: error.message
            });
        }
    }

    /**
     * Create co-lending transaction
     * POST /api/co-lending/transactions
     */
    async createTransaction(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `create_txn_${Date.now()}`;
            const { application_number, loan_amount, arrangement } = req.body;
            
            logger.info(`[${requestId}] Creating co-lending transaction for: ${application_number}`);

            if (!application_number || !loan_amount || !arrangement) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'application_number, loan_amount, and arrangement are required'
                });
            }

            const result = await coLendingService.createCoLendingTransaction(
                application_number,
                loan_amount,
                arrangement
            );

            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: {
                        transaction_id: result.transaction_id,
                        arrangement: result.arrangement
                    },
                    message: 'Co-lending transaction created successfully',
                    requestId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create transaction',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error creating co-lending transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create co-lending transaction',
                message: error.message
            });
        }
    }

    /**
     * Get co-lending transactions
     * GET /api/co-lending/transactions
     */
    async getTransactions(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `transactions_${Date.now()}`;
            const { status, application_number, limit = 50, offset = 0 } = req.query;
            
            logger.info(`[${requestId}] Getting co-lending transactions`);

            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT 
                    clt.*,
                    bp.partner_name as bank_name, bp.partner_code as bank_code,
                    np.partner_name as nbfc_name, np.partner_code as nbfc_code
                FROM co_lending_transactions clt
                JOIN co_lending_partners bp ON clt.bank_partner_id = bp.id
                JOIN co_lending_partners np ON clt.nbfc_partner_id = np.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ` AND clt.transaction_status = ?`;
                params.push(status);
            }

            if (application_number) {
                query += ` AND clt.application_number = ?`;
                params.push(application_number);
            }

            query += ` ORDER BY clt.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            const [transactions] = await connection.execute(query, params);
            
            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total
                FROM co_lending_transactions clt
                WHERE 1=1
            `;
            const countParams = [];

            if (status) {
                countQuery += ` AND clt.transaction_status = ?`;
                countParams.push(status);
            }

            if (application_number) {
                countQuery += ` AND clt.application_number = ?`;
                countParams.push(application_number);
            }

            const [countResult] = await connection.execute(countQuery, countParams);
            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    transactions: transactions.map(txn => ({
                        ...txn,
                        transaction_details: typeof txn.transaction_details === 'string' 
                            ? JSON.parse(txn.transaction_details) 
                            : txn.transaction_details
                    })),
                    pagination: {
                        total: countResult[0].total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        has_more: (parseInt(offset) + parseInt(limit)) < countResult[0].total
                    }
                },
                message: 'Co-lending transactions retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting co-lending transactions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get co-lending transactions',
                message: error.message
            });
        }
    }

    /**
     * Process distributed loan via bank APIs
     * POST /api/co-lending/process/:transactionId
     */
    async processDistributedLoan(req, res) {
        try {
            const { transactionId } = req.params;
            const requestId = req.headers['x-request-id'] || `process_${Date.now()}`;
            
            logger.info(`[${requestId}] Processing distributed loan: ${transactionId}`);

            const result = await coLendingService.initiateDistributedLoanProcessing(transactionId);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        transaction_id: result.transaction_id,
                        bank_status: result.bank_status,
                        nbfc_status: result.nbfc_status,
                        processing_summary: {
                            bank_success: result.bank_status === 'fulfilled',
                            nbfc_success: result.nbfc_status === 'fulfilled',
                            overall_status: result.bank_status === 'fulfilled' && result.nbfc_status === 'fulfilled' 
                                ? 'success' : 'partial_success'
                        }
                    },
                    message: 'Distributed loan processing completed',
                    requestId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Processing failed',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error processing distributed loan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process distributed loan',
                message: error.message
            });
        }
    }

    /**
     * Get co-lending analytics
     * GET /api/co-lending/analytics
     */
    async getAnalytics(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `analytics_${Date.now()}`;
            const { date_range = 30 } = req.query;
            
            logger.info(`[${requestId}] Getting co-lending analytics`);

            const result = await coLendingService.getCoLendingAnalytics(parseInt(date_range));

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.analytics,
                    message: 'Co-lending analytics retrieved successfully',
                    requestId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to get analytics',
                    message: result.error,
                    requestId
                });
            }

        } catch (error) {
            logger.error('Error getting co-lending analytics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get co-lending analytics',
                message: error.message
            });
        }
    }

    /**
     * Get portfolio analytics for partners
     * GET /api/co-lending/portfolio
     */
    async getPortfolioAnalytics(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `portfolio_${Date.now()}`;
            const { partner_id, partner_type } = req.query;
            
            logger.info(`[${requestId}] Getting portfolio analytics`);

            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT 
                    cp.partner_name, cp.partner_code, cp.partner_type,
                    clp.*
                FROM co_lending_portfolio clp
                JOIN co_lending_partners cp ON clp.partner_id = cp.id
                WHERE 1=1
            `;
            const params = [];

            if (partner_id) {
                query += ` AND clp.partner_id = ?`;
                params.push(partner_id);
            }

            if (partner_type) {
                query += ` AND cp.partner_type = ?`;
                params.push(partner_type);
            }

            query += ` ORDER BY clp.portfolio_date DESC, cp.partner_name`;

            const [portfolio] = await connection.execute(query, params);
            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    portfolio_data: portfolio,
                    summary: {
                        total_partners: [...new Set(portfolio.map(p => p.partner_id))].length,
                        latest_date: portfolio.length > 0 ? portfolio[0].portfolio_date : null,
                        total_active_loans: portfolio.reduce((sum, p) => sum + p.active_loans_count, 0),
                        total_outstanding: portfolio.reduce((sum, p) => sum + parseFloat(p.outstanding_amount), 0)
                    }
                },
                message: 'Portfolio analytics retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting portfolio analytics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get portfolio analytics',
                message: error.message
            });
        }
    }

    /**
     * Get settlement tracking
     * GET /api/co-lending/settlements
     */
    async getSettlements(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `settlements_${Date.now()}`;
            const { transaction_id, settlement_type, status, limit = 50, offset = 0 } = req.query;
            
            logger.info(`[${requestId}] Getting settlement data`);

            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT 
                    cls.*,
                    clt.application_number,
                    bp.partner_name as bank_name,
                    np.partner_name as nbfc_name
                FROM co_lending_settlements cls
                JOIN co_lending_transactions clt ON cls.transaction_id = clt.transaction_id
                JOIN co_lending_partners bp ON clt.bank_partner_id = bp.id
                JOIN co_lending_partners np ON clt.nbfc_partner_id = np.id
                WHERE 1=1
            `;
            const params = [];

            if (transaction_id) {
                query += ` AND cls.transaction_id = ?`;
                params.push(transaction_id);
            }

            if (settlement_type) {
                query += ` AND cls.settlement_type = ?`;
                params.push(settlement_type);
            }

            if (status) {
                query += ` AND cls.settlement_status = ?`;
                params.push(status);
            }

            query += ` ORDER BY cls.settlement_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            const [settlements] = await connection.execute(query, params);
            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    settlements: settlements.map(settlement => ({
                        ...settlement,
                        settlement_details: typeof settlement.settlement_details === 'string' 
                            ? JSON.parse(settlement.settlement_details) 
                            : settlement.settlement_details
                    })),
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                },
                message: 'Settlement data retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting settlement data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get settlement data',
                message: error.message
            });
        }
    }

    /**
     * Get API integration logs
     * GET /api/co-lending/api-logs
     */
    async getAPILogs(req, res) {
        try {
            const requestId = req.headers['x-request-id'] || `api_logs_${Date.now()}`;
            const { partner_id, transaction_id, limit = 100, offset = 0 } = req.query;
            
            logger.info(`[${requestId}] Getting API logs`);

            const connection = await databaseService.pool.getConnection();
            
            let query = `
                SELECT 
                    clal.*,
                    cp.partner_name, cp.partner_code
                FROM co_lending_api_logs clal
                JOIN co_lending_partners cp ON clal.partner_id = cp.id
                WHERE 1=1
            `;
            const params = [];

            if (partner_id) {
                query += ` AND clal.partner_id = ?`;
                params.push(partner_id);
            }

            if (transaction_id) {
                query += ` AND clal.transaction_id = ?`;
                params.push(transaction_id);
            }

            query += ` ORDER BY clal.request_timestamp DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            const [logs] = await connection.execute(query, params);
            connection.release();

            res.status(200).json({
                success: true,
                data: {
                    api_logs: logs.map(log => ({
                        ...log,
                        request_payload: typeof log.request_payload === 'string' 
                            ? JSON.parse(log.request_payload) 
                            : log.request_payload,
                        response_payload: typeof log.response_payload === 'string' 
                            ? JSON.parse(log.response_payload) 
                            : log.response_payload
                    })),
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                },
                message: 'API logs retrieved successfully',
                requestId
            });

        } catch (error) {
            logger.error('Error getting API logs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get API logs',
                message: error.message
            });
        }
    }
}

module.exports = new CoLendingController();
