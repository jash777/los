/**
 * Account Statement Verification Service
 * Demo service for account statement analysis
 * In production, this would integrate with Account Aggregator APIs
 */

const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class AccountStatementService {
    constructor() {
        this.serviceName = 'Account Statement Verification';
    }

    /**
     * Analyze account statement data
     * @param {Object} statementData - Account statement JSON data
     * @param {string} requestId - Request ID for tracking
     * @returns {Object} Analysis result
     */
    async analyzeAccountStatement(statementData, requestId) {
        try {
            logger.info(`[${requestId}] Starting account statement analysis`);

            // Validate input data
            if (!statementData || !statementData.transactions) {
                throw new Error('Invalid account statement data');
            }

            const analysis = {
                accountInfo: this.extractAccountInfo(statementData),
                transactionAnalysis: this.analyzeTransactions(statementData.transactions),
                incomeAnalysis: this.analyzeIncome(statementData.transactions),
                expenseAnalysis: this.analyzeExpenses(statementData.transactions),
                behaviorAnalysis: this.analyzeBehavior(statementData.transactions),
                riskIndicators: this.identifyRiskIndicators(statementData.transactions)
            };

            // Calculate overall financial health score
            const healthScore = this.calculateFinancialHealthScore(analysis);

            logger.info(`[${requestId}] Account statement analysis completed`, {
                accountNumber: analysis.accountInfo.accountNumber,
                healthScore: healthScore.score
            });

            return {
                success: true,
                analysis,
                healthScore,
                timestamp: new Date().toISOString(),
                requestId
            };

        } catch (error) {
            logger.error(`[${requestId}] Account statement analysis failed`, {
                error: error.message
            });
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                requestId
            };
        }
    }

    /**
     * Extract basic account information
     */
    extractAccountInfo(statementData) {
        return {
            accountNumber: statementData.accountNumber || 'XXXX1234',
            accountType: statementData.accountType || 'Savings',
            bankName: statementData.bankName || 'Demo Bank',
            accountHolderName: statementData.accountHolderName || 'Account Holder',
            statementPeriod: {
                fromDate: statementData.fromDate || '2024-01-01',
                toDate: statementData.toDate || '2024-12-31'
            },
            openingBalance: statementData.openingBalance || 0,
            closingBalance: statementData.closingBalance || 0
        };
    }

    /**
     * Analyze transaction patterns
     */
    analyzeTransactions(transactions) {
        const totalTransactions = transactions.length;
        const credits = transactions.filter(t => t.type === 'credit');
        const debits = transactions.filter(t => t.type === 'debit');
        
        const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
        
        return {
            totalTransactions,
            creditTransactions: credits.length,
            debitTransactions: debits.length,
            totalCredits: Math.round(totalCredits * 100) / 100,
            totalDebits: Math.round(totalDebits * 100) / 100,
            netFlow: Math.round((totalCredits - totalDebits) * 100) / 100,
            averageTransactionAmount: Math.round((totalCredits + totalDebits) / totalTransactions * 100) / 100
        };
    }

    /**
     * Analyze income patterns
     */
    analyzeIncome(transactions) {
        const incomeTransactions = transactions.filter(t => 
            t.type === 'credit' && 
            (t.description.toLowerCase().includes('salary') ||
             t.description.toLowerCase().includes('sal') ||
             t.description.toLowerCase().includes('payroll') ||
             t.amount > 25000) // Assume large credits are salary
        );

        const monthlyIncomes = this.groupTransactionsByMonth(incomeTransactions);
        const averageMonthlyIncome = incomeTransactions.length > 0 ? 
            incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / 
            Math.max(Object.keys(monthlyIncomes).length, 1) : 0;

        return {
            salaryTransactions: incomeTransactions.length,
            averageMonthlyIncome: Math.round(averageMonthlyIncome * 100) / 100,
            incomeStability: this.assessIncomeStability(monthlyIncomes),
            lastSalaryDate: incomeTransactions.length > 0 ? 
                incomeTransactions[incomeTransactions.length - 1].date : null,
            monthlyBreakdown: monthlyIncomes
        };
    }

    /**
     * Analyze expense patterns
     */
    analyzeExpenses(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === 'debit');
        const expenseCategories = this.categorizeExpenses(expenseTransactions);
        
        const monthlyExpenses = this.groupTransactionsByMonth(expenseTransactions);
        const averageMonthlyExpenses = expenseTransactions.length > 0 ?
            expenseTransactions.reduce((sum, t) => sum + t.amount, 0) /
            Math.max(Object.keys(monthlyExpenses).length, 1) : 0;

        return {
            totalExpenseTransactions: expenseTransactions.length,
            averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
            expenseCategories,
            monthlyBreakdown: monthlyExpenses,
            spendingPattern: this.assessSpendingPattern(expenseTransactions)
        };
    }

    /**
     * Analyze banking behavior
     */
    analyzeBehavior(transactions) {
        const bounceTransactions = transactions.filter(t => 
            t.description.toLowerCase().includes('bounce') ||
            t.description.toLowerCase().includes('return') ||
            t.description.toLowerCase().includes('insufficient')
        );

        const overdraftTransactions = transactions.filter(t => 
            t.description.toLowerCase().includes('overdraft') ||
            t.description.toLowerCase().includes('od')
        );

        return {
            bounceCount: bounceTransactions.length,
            overdraftUsage: overdraftTransactions.length,
            accountMaintenance: this.assessAccountMaintenance(transactions),
            transactionFrequency: this.calculateTransactionFrequency(transactions)
        };
    }

    /**
     * Identify risk indicators
     */
    identifyRiskIndicators(transactions) {
        const risks = [];
        
        // Check for frequent bounces
        const bounces = transactions.filter(t => 
            t.description.toLowerCase().includes('bounce')
        ).length;
        if (bounces > 2) {
            risks.push({
                type: 'payment_bounces',
                severity: 'high',
                description: `${bounces} payment bounces detected`,
                impact: 'Indicates insufficient funds or poor financial management'
            });
        }

        // Check for gambling transactions
        const gambling = transactions.filter(t => 
            t.description.toLowerCase().includes('bet') ||
            t.description.toLowerCase().includes('casino') ||
            t.description.toLowerCase().includes('lottery')
        ).length;
        if (gambling > 0) {
            risks.push({
                type: 'gambling_activity',
                severity: 'medium',
                description: `${gambling} gambling-related transactions`,
                impact: 'May indicate risky financial behavior'
            });
        }

        // Check for irregular income
        const incomeTransactions = transactions.filter(t => 
            t.type === 'credit' && t.amount > 25000
        );
        const incomeVariability = this.calculateIncomeVariability(incomeTransactions);
        if (incomeVariability > 0.3) {
            risks.push({
                type: 'irregular_income',
                severity: 'medium',
                description: 'High income variability detected',
                impact: 'May affect loan repayment capacity'
            });
        }

        return risks;
    }

    /**
     * Calculate financial health score
     */
    calculateFinancialHealthScore(analysis) {
        let score = 100;
        const factors = [];

        // Income stability (30% weight)
        const incomeStability = analysis.incomeAnalysis.incomeStability;
        if (incomeStability === 'stable') {
            factors.push({ factor: 'Income Stability', score: 30, weight: 30 });
        } else if (incomeStability === 'moderate') {
            score -= 10;
            factors.push({ factor: 'Income Stability', score: 20, weight: 30 });
        } else {
            score -= 20;
            factors.push({ factor: 'Income Stability', score: 10, weight: 30 });
        }

        // Account behavior (25% weight)
        const bounces = analysis.behaviorAnalysis.bounceCount;
        if (bounces === 0) {
            factors.push({ factor: 'Account Behavior', score: 25, weight: 25 });
        } else if (bounces <= 2) {
            score -= 10;
            factors.push({ factor: 'Account Behavior', score: 15, weight: 25 });
        } else {
            score -= 25;
            factors.push({ factor: 'Account Behavior', score: 0, weight: 25 });
        }

        // Cash flow (25% weight)
        const netFlow = analysis.transactionAnalysis.netFlow;
        if (netFlow > 0) {
            factors.push({ factor: 'Cash Flow', score: 25, weight: 25 });
        } else if (netFlow > -10000) {
            score -= 10;
            factors.push({ factor: 'Cash Flow', score: 15, weight: 25 });
        } else {
            score -= 25;
            factors.push({ factor: 'Cash Flow', score: 0, weight: 25 });
        }

        // Risk indicators (20% weight)
        const riskCount = analysis.riskIndicators.length;
        if (riskCount === 0) {
            factors.push({ factor: 'Risk Indicators', score: 20, weight: 20 });
        } else if (riskCount <= 2) {
            score -= 10;
            factors.push({ factor: 'Risk Indicators', score: 10, weight: 20 });
        } else {
            score -= 20;
            factors.push({ factor: 'Risk Indicators', score: 0, weight: 20 });
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
            factors
        };
    }

    // Helper methods
    groupTransactionsByMonth(transactions) {
        return transactions.reduce((groups, transaction) => {
            const month = transaction.date.substring(0, 7); // YYYY-MM
            if (!groups[month]) groups[month] = [];
            groups[month].push(transaction);
            return groups;
        }, {});
    }

    assessIncomeStability(monthlyIncomes) {
        const months = Object.keys(monthlyIncomes);
        if (months.length < 3) return 'insufficient_data';
        
        const amounts = months.map(month => 
            monthlyIncomes[month].reduce((sum, t) => sum + t.amount, 0)
        );
        
        const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const coefficient = stdDev / avg;
        
        return coefficient < 0.1 ? 'stable' : coefficient < 0.3 ? 'moderate' : 'unstable';
    }

    categorizeExpenses(expenseTransactions) {
        const categories = {
            utilities: 0,
            food: 0,
            transport: 0,
            entertainment: 0,
            shopping: 0,
            healthcare: 0,
            others: 0
        };

        expenseTransactions.forEach(transaction => {
            const desc = transaction.description.toLowerCase();
            if (desc.includes('electricity') || desc.includes('gas') || desc.includes('water')) {
                categories.utilities += transaction.amount;
            } else if (desc.includes('food') || desc.includes('restaurant') || desc.includes('grocery')) {
                categories.food += transaction.amount;
            } else if (desc.includes('fuel') || desc.includes('transport') || desc.includes('uber')) {
                categories.transport += transaction.amount;
            } else if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('game')) {
                categories.entertainment += transaction.amount;
            } else if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('flipkart')) {
                categories.shopping += transaction.amount;
            } else if (desc.includes('hospital') || desc.includes('medical') || desc.includes('pharmacy')) {
                categories.healthcare += transaction.amount;
            } else {
                categories.others += transaction.amount;
            }
        });

        return categories;
    }

    assessSpendingPattern(expenseTransactions) {
        const totalAmount = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        const avgTransaction = totalAmount / expenseTransactions.length;
        
        return {
            averageTransactionAmount: Math.round(avgTransaction * 100) / 100,
            spendingFrequency: expenseTransactions.length,
            pattern: avgTransaction > 5000 ? 'high_value' : avgTransaction > 1000 ? 'moderate' : 'small_frequent'
        };
    }

    assessAccountMaintenance(transactions) {
        const minBalance = Math.min(...transactions.map(t => t.balance || 0));
        const avgBalance = transactions.reduce((sum, t) => sum + (t.balance || 0), 0) / transactions.length;
        
        return {
            minimumBalance: minBalance,
            averageBalance: Math.round(avgBalance * 100) / 100,
            maintenanceRating: minBalance > 10000 ? 'good' : minBalance > 1000 ? 'moderate' : 'poor'
        };
    }

    calculateTransactionFrequency(transactions) {
        const days = new Set(transactions.map(t => t.date.substring(0, 10))).size;
        return {
            activeDays: days,
            transactionsPerDay: Math.round(transactions.length / days * 100) / 100,
            frequency: days > 20 ? 'high' : days > 10 ? 'moderate' : 'low'
        };
    }

    calculateIncomeVariability(incomeTransactions) {
        if (incomeTransactions.length < 2) return 0;
        
        const amounts = incomeTransactions.map(t => t.amount);
        const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev / avg; // Coefficient of variation
    }

    /**
     * Generate demo account statement data for testing
     */
    generateDemoAccountStatement() {
        const transactions = [];
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        
        // Generate salary transactions
        for (let month = 0; month < 12; month++) {
            const salaryDate = new Date(2024, month, 25);
            transactions.push({
                date: salaryDate.toISOString().split('T')[0],
                type: 'credit',
                amount: 85000 + Math.random() * 10000, // Salary with some variation
                description: 'SALARY CREDIT - COMPANY XYZ',
                balance: 0 // Will be calculated
            });
        }

        // Generate expense transactions
        const expenseTypes = [
            { desc: 'GROCERY STORE', range: [2000, 5000] },
            { desc: 'ELECTRICITY BILL', range: [1500, 3000] },
            { desc: 'FUEL PAYMENT', range: [3000, 6000] },
            { desc: 'RESTAURANT', range: [500, 2000] },
            { desc: 'AMAZON PURCHASE', range: [1000, 8000] },
            { desc: 'MEDICAL EXPENSE', range: [500, 3000] }
        ];

        // Add random expenses throughout the year
        for (let i = 0; i < 200; i++) {
            const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
            const amount = expenseType.range[0] + Math.random() * (expenseType.range[1] - expenseType.range[0]);
            
            transactions.push({
                date: randomDate.toISOString().split('T')[0],
                type: 'debit',
                amount: Math.round(amount * 100) / 100,
                description: expenseType.desc,
                balance: 0 // Will be calculated
            });
        }

        // Sort transactions by date
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 50000; // Starting balance
        transactions.forEach(transaction => {
            if (transaction.type === 'credit') {
                balance += transaction.amount;
            } else {
                balance -= transaction.amount;
            }
            transaction.balance = Math.round(balance * 100) / 100;
        });

        return {
            accountNumber: 'DEMO123456789',
            accountType: 'Savings',
            bankName: 'Demo Bank Ltd',
            accountHolderName: 'John Doe',
            fromDate: '2024-01-01',
            toDate: '2024-12-31',
            openingBalance: 50000,
            closingBalance: balance,
            transactions
        };
    }

    /**
     * Save account statement analysis to application folder
     */
    async saveAccountStatementAnalysis(applicationId, analysisResult, requestId) {
        try {
            const applicationDir = path.join(process.cwd(), 'application_data', applicationId);
            const filePath = path.join(applicationDir, 'account_statement_analysis.json');
            
            await fs.writeFile(filePath, JSON.stringify(analysisResult, null, 2));
            
            logger.info(`[${requestId}] Account statement analysis saved`, {
                applicationId,
                filePath
            });
            
            return { success: true, filePath };
        } catch (error) {
            logger.error(`[${requestId}] Failed to save account statement analysis`, {
                error: error.message,
                applicationId
            });
            return { success: false, error: error.message };
        }
    }
}

module.exports = AccountStatementService;