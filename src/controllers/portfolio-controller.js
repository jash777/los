/**
 * Portfolio Controller
 * Handles portfolio management and co-lending functionality
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class PortfolioController {
    constructor() {
        this.portfolioDataPath = path.join(__dirname, '../../data/portfolio-data.json');
        this.coLendingDataPath = path.join(__dirname, '../../data/co-lending-data.json');
        this.bankAccountsPath = path.join(__dirname, '../../data/bank-accounts.json');
        this.ensureDataFiles();
    }

    /**
     * Ensure data files exist
     */
    async ensureDataFiles() {
        try {
            const dataDir = path.dirname(this.portfolioDataPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Initialize portfolio data if not exists
            try {
                await fs.access(this.portfolioDataPath);
            } catch {
                const initialPortfolio = {
                    total_portfolio_limit: 20000000, // 2 Cr
                    utilized_amount: 0,
                    available_amount: 20000000,
                    currency: "INR",
                    last_updated: new Date().toISOString(),
                    portfolio_history: []
                };
                await fs.writeFile(this.portfolioDataPath, JSON.stringify(initialPortfolio, null, 2));
            }

            // Initialize co-lending data if not exists
            try {
                await fs.access(this.coLendingDataPath);
            } catch {
                const initialCoLending = {
                    nbfc_ratio: 20,
                    bank_ratio: 80,
                    total_ratio: 100,
                    nbfc_partner: "NBFC Partner",
                    bank_partner: "Bank Partner",
                    co_lending_agreement_date: new Date().toISOString(),
                    last_updated: new Date().toISOString(),
                    agreement_status: "active"
                };
                await fs.writeFile(this.coLendingDataPath, JSON.stringify(initialCoLending, null, 2));
            }

            // Initialize bank accounts if not exists
            try {
                await fs.access(this.bankAccountsPath);
            } catch {
                const initialBankAccounts = {
                    accounts: [
                        {
                            account_id: "ACC001",
                            account_name: "Primary Operating Account",
                            bank_name: "HDFC Bank",
                            account_number: "XXXX1234",
                            account_type: "Current",
                            balance: 5000000,
                            currency: "INR",
                            status: "active",
                            created_date: new Date().toISOString()
                        },
                        {
                            account_id: "ACC002",
                            account_name: "Co-lending Escrow Account",
                            bank_name: "ICICI Bank",
                            account_number: "XXXX5678",
                            account_type: "Escrow",
                            balance: 15000000,
                            currency: "INR",
                            status: "active",
                            created_date: new Date().toISOString()
                        }
                    ],
                    total_balance: 20000000,
                    last_updated: new Date().toISOString()
                };
                await fs.writeFile(this.bankAccountsPath, JSON.stringify(initialBankAccounts, null, 2));
            }
        } catch (error) {
            logger.error('Error ensuring data files:', error);
        }
    }

    /**
     * Get Portfolio Overview
     */
    getPortfolioOverview = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            logger.info(`[${requestId}] Fetching portfolio overview`);

            const portfolioData = JSON.parse(await fs.readFile(this.portfolioDataPath, 'utf8'));
            const coLendingData = JSON.parse(await fs.readFile(this.coLendingDataPath, 'utf8'));
            const bankAccountsData = JSON.parse(await fs.readFile(this.bankAccountsPath, 'utf8'));

            // Calculate utilization percentage
            const utilizationPercentage = (portfolioData.utilized_amount / portfolioData.total_portfolio_limit) * 100;

            const overview = {
                portfolio: {
                    total_limit: portfolioData.total_portfolio_limit,
                    utilized_amount: portfolioData.utilized_amount,
                    available_amount: portfolioData.available_amount,
                    utilization_percentage: utilizationPercentage.toFixed(2),
                    currency: portfolioData.currency,
                    last_updated: portfolioData.last_updated
                },
                co_lending: {
                    nbfc_ratio: coLendingData.nbfc_ratio,
                    bank_ratio: coLendingData.bank_ratio,
                    nbfc_partner: coLendingData.nbfc_partner,
                    bank_partner: coLendingData.bank_partner,
                    agreement_status: coLendingData.agreement_status,
                    agreement_date: coLendingData.co_lending_agreement_date
                },
                bank_accounts: {
                    total_accounts: bankAccountsData.accounts.length,
                    total_balance: bankAccountsData.total_balance,
                    active_accounts: bankAccountsData.accounts.filter(acc => acc.status === 'active').length
                }
            };

            logger.info(`[${requestId}] Portfolio overview generated successfully`);

            res.json({
                success: true,
                data: overview,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Portfolio Overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch portfolio overview',
                details: error.message
            });
        }
    }

    /**
     * Update Portfolio Limit
     */
    updatePortfolioLimit = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { new_limit, reason } = req.body;

            logger.info(`[${requestId}] Updating portfolio limit to: ${new_limit}`);

            if (!new_limit || new_limit <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid portfolio limit'
                });
            }

            const portfolioData = JSON.parse(await fs.readFile(this.portfolioDataPath, 'utf8'));
            
            // Store history
            const historyEntry = {
                date: new Date().toISOString(),
                old_limit: portfolioData.total_portfolio_limit,
                new_limit: new_limit,
                reason: reason || 'Portfolio limit update',
                updated_by: req.headers['x-user-id'] || 'system'
            };

            portfolioData.portfolio_history.push(historyEntry);
            portfolioData.total_portfolio_limit = new_limit;
            portfolioData.available_amount = new_limit - portfolioData.utilized_amount;
            portfolioData.last_updated = new Date().toISOString();

            await fs.writeFile(this.portfolioDataPath, JSON.stringify(portfolioData, null, 2));

            logger.info(`[${requestId}] Portfolio limit updated successfully`);

            res.json({
                success: true,
                data: {
                    message: 'Portfolio limit updated successfully',
                    new_limit: new_limit,
                    available_amount: portfolioData.available_amount,
                    history_entry: historyEntry
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Update Portfolio Limit error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update portfolio limit',
                details: error.message
            });
        }
    }

    /**
     * Get Portfolio History
     */
    getPortfolioHistory = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { limit = 50, offset = 0 } = req.query;

            logger.info(`[${requestId}] Fetching portfolio history`);

            const portfolioData = JSON.parse(await fs.readFile(this.portfolioDataPath, 'utf8'));
            
            const history = portfolioData.portfolio_history
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            logger.info(`[${requestId}] Portfolio history fetched successfully`);

            res.json({
                success: true,
                data: {
                    history: history,
                    pagination: {
                        total: portfolioData.portfolio_history.length,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        has_more: parseInt(offset) + parseInt(limit) < portfolioData.portfolio_history.length
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Portfolio History error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch portfolio history',
                details: error.message
            });
        }
    }

    /**
     * Get Co-lending Configuration
     */
    getCoLendingConfig = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            logger.info(`[${requestId}] Fetching co-lending configuration`);

            const coLendingData = JSON.parse(await fs.readFile(this.coLendingDataPath, 'utf8'));

            logger.info(`[${requestId}] Co-lending configuration fetched successfully`);

            res.json({
                success: true,
                data: coLendingData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Co-lending Config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch co-lending configuration',
                details: error.message
            });
        }
    }

    /**
     * Update Co-lending Configuration
     */
    updateCoLendingConfig = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { nbfc_ratio, bank_ratio, nbfc_partner, bank_partner, agreement_status } = req.body;

            logger.info(`[${requestId}] Updating co-lending configuration`);

            if (nbfc_ratio + bank_ratio !== 100) {
                return res.status(400).json({
                    success: false,
                    error: 'NBFC and Bank ratios must sum to 100%'
                });
            }

            const coLendingData = JSON.parse(await fs.readFile(this.coLendingDataPath, 'utf8'));
            
            coLendingData.nbfc_ratio = nbfc_ratio;
            coLendingData.bank_ratio = bank_ratio;
            coLendingData.nbfc_partner = nbfc_partner || coLendingData.nbfc_partner;
            coLendingData.bank_partner = bank_partner || coLendingData.bank_partner;
            coLendingData.agreement_status = agreement_status || coLendingData.agreement_status;
            coLendingData.last_updated = new Date().toISOString();

            await fs.writeFile(this.coLendingDataPath, JSON.stringify(coLendingData, null, 2));

            logger.info(`[${requestId}] Co-lending configuration updated successfully`);

            res.json({
                success: true,
                data: {
                    message: 'Co-lending configuration updated successfully',
                    updated_config: coLendingData
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Update Co-lending Config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update co-lending configuration',
                details: error.message
            });
        }
    }

    /**
     * Get Bank Accounts
     */
    getBankAccounts = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { status } = req.query;

            logger.info(`[${requestId}] Fetching bank accounts`);

            const bankAccountsData = JSON.parse(await fs.readFile(this.bankAccountsPath, 'utf8'));
            
            let accounts = bankAccountsData.accounts;
            if (status) {
                accounts = accounts.filter(acc => acc.status === status);
            }

            logger.info(`[${requestId}] Bank accounts fetched successfully`);

            res.json({
                success: true,
                data: {
                    accounts: accounts,
                    summary: {
                        total_accounts: bankAccountsData.accounts.length,
                        total_balance: bankAccountsData.total_balance,
                        active_accounts: bankAccountsData.accounts.filter(acc => acc.status === 'active').length
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Bank Accounts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bank accounts',
                details: error.message
            });
        }
    }

    /**
     * Add Bank Account
     */
    addBankAccount = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { account_name, bank_name, account_number, account_type, balance, currency = "INR" } = req.body;

            logger.info(`[${requestId}] Adding new bank account`);

            if (!account_name || !bank_name || !account_number || !account_type || !balance) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            const bankAccountsData = JSON.parse(await fs.readFile(this.bankAccountsPath, 'utf8'));
            
            const newAccount = {
                account_id: `ACC${String(bankAccountsData.accounts.length + 1).padStart(3, '0')}`,
                account_name,
                bank_name,
                account_number,
                account_type,
                balance: parseFloat(balance),
                currency,
                status: "active",
                created_date: new Date().toISOString()
            };

            bankAccountsData.accounts.push(newAccount);
            bankAccountsData.total_balance += parseFloat(balance);
            bankAccountsData.last_updated = new Date().toISOString();

            await fs.writeFile(this.bankAccountsPath, JSON.stringify(bankAccountsData, null, 2));

            logger.info(`[${requestId}] Bank account added successfully`);

            res.json({
                success: true,
                data: {
                    message: 'Bank account added successfully',
                    account: newAccount,
                    updated_total_balance: bankAccountsData.total_balance
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Add Bank Account error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add bank account',
                details: error.message
            });
        }
    }

    /**
     * Update Bank Account Balance
     */
    updateBankAccountBalance = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { account_id } = req.params;
            const { new_balance, reason } = req.body;

            logger.info(`[${requestId}] Updating balance for account: ${account_id}`);

            if (!new_balance || new_balance < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid balance amount'
                });
            }

            const bankAccountsData = JSON.parse(await fs.readFile(this.bankAccountsPath, 'utf8'));
            
            const accountIndex = bankAccountsData.accounts.findIndex(acc => acc.account_id === account_id);
            if (accountIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Bank account not found'
                });
            }

            const oldBalance = bankAccountsData.accounts[accountIndex].balance;
            bankAccountsData.accounts[accountIndex].balance = parseFloat(new_balance);
            bankAccountsData.total_balance = bankAccountsData.total_balance - oldBalance + parseFloat(new_balance);
            bankAccountsData.last_updated = new Date().toISOString();

            await fs.writeFile(this.bankAccountsPath, JSON.stringify(bankAccountsData, null, 2));

            logger.info(`[${requestId}] Bank account balance updated successfully`);

            res.json({
                success: true,
                data: {
                    message: 'Bank account balance updated successfully',
                    account_id: account_id,
                    old_balance: oldBalance,
                    new_balance: new_balance,
                    reason: reason || 'Balance update',
                    updated_total_balance: bankAccountsData.total_balance
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Update Bank Account Balance error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update bank account balance',
                details: error.message
            });
        }
    }

    /**
     * Get Portfolio Analytics
     */
    getPortfolioAnalytics = async (req, res) => {
        try {
            const requestId = req.headers['x-request-id'] || 'portfolio-' + Date.now();
            const { period = '30d' } = req.query;

            logger.info(`[${requestId}] Fetching portfolio analytics for period: ${period}`);

            const portfolioData = JSON.parse(await fs.readFile(this.portfolioDataPath, 'utf8'));
            const coLendingData = JSON.parse(await fs.readFile(this.coLendingDataPath, 'utf8'));
            const bankAccountsData = JSON.parse(await fs.readFile(this.bankAccountsPath, 'utf8'));

            // Calculate analytics
            const utilizationPercentage = (portfolioData.utilized_amount / portfolioData.total_portfolio_limit) * 100;
            const nbfcExposure = (portfolioData.utilized_amount * coLendingData.nbfc_ratio) / 100;
            const bankExposure = (portfolioData.utilized_amount * coLendingData.bank_ratio) / 100;

            const analytics = {
                portfolio_metrics: {
                    total_limit: portfolioData.total_portfolio_limit,
                    utilized_amount: portfolioData.utilized_amount,
                    available_amount: portfolioData.available_amount,
                    utilization_percentage: utilizationPercentage.toFixed(2),
                    average_utilization: this.calculateAverageUtilization(portfolioData.portfolio_history, period)
                },
                co_lending_exposure: {
                    nbfc_exposure: nbfcExposure,
                    bank_exposure: bankExposure,
                    nbfc_percentage: coLendingData.nbfc_ratio,
                    bank_percentage: coLendingData.bank_ratio
                },
                bank_accounts_summary: {
                    total_accounts: bankAccountsData.accounts.length,
                    total_balance: bankAccountsData.total_balance,
                    average_balance: bankAccountsData.total_balance / bankAccountsData.accounts.length,
                    active_accounts: bankAccountsData.accounts.filter(acc => acc.status === 'active').length
                },
                risk_metrics: {
                    concentration_risk: this.calculateConcentrationRisk(bankAccountsData.accounts),
                    liquidity_ratio: (bankAccountsData.total_balance / portfolioData.total_portfolio_limit) * 100
                }
            };

            logger.info(`[${requestId}] Portfolio analytics generated successfully`);

            res.json({
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Portfolio Analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate portfolio analytics',
                details: error.message
            });
        }
    }

    /**
     * Calculate average utilization for a period
     */
    calculateAverageUtilization(history, period) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentHistory = history.filter(entry => new Date(entry.date) >= cutoffDate);
        if (recentHistory.length === 0) return 0;

        const totalUtilization = recentHistory.reduce((sum, entry) => {
            return sum + ((entry.new_limit - entry.old_limit) / entry.old_limit) * 100;
        }, 0);

        return (totalUtilization / recentHistory.length).toFixed(2);
    }

    /**
     * Calculate concentration risk
     */
    calculateConcentrationRisk(accounts) {
        if (accounts.length === 0) return 0;

        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const maxAccountBalance = Math.max(...accounts.map(acc => acc.balance));
        
        return ((maxAccountBalance / totalBalance) * 100).toFixed(2);
    }
}

const portfolioController = new PortfolioController();
module.exports = portfolioController;
