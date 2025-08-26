/**
 * @swagger
 * components:
 *   schemas:
 *     MetricValue:
 *       type: object
 *       properties:
 *         value:
 *           type: number
 *           format: float
 *           description: The metric value
 *         label:
 *           type: string
 *           description: Human-readable label for the metric
 *         period:
 *           type: string
 *           description: Time period for the metric
 *       example:
 *         value: 1250
 *         label: "Total Applications"
 *         period: "All Time"
 *     MetricOverview:
 *       type: object
 *       properties:
 *         totalApplications:
 *           type: integer
 *           description: Total number of loan applications
 *         approvalRate:
 *           type: number
 *           format: float
 *           description: Approval rate as a percentage
 *         averageCibil:
 *           type: number
 *           format: float
 *           description: Average CIBIL score
 *         currentApplicants:
 *           type: integer
 *           description: Number of current applicants
 *         loansDisbursed:
 *           type: integer
 *           description: Total number of loans disbursed
 *         overdueRate:
 *           type: number
 *           format: float
 *           description: Overdue rate as a percentage
 *         colendingShare:
 *           type: number
 *           format: float
 *           description: Co-lending share as a percentage
 *         bankPartnerships:
 *           type: integer
 *           description: Number of active bank partnerships
 *       example:
 *         totalApplications: 1250
 *         approvalRate: 72.5
 *         averageCibil: 685.3
 *         currentApplicants: 45
 *         loansDisbursed: 890
 *         overdueRate: 3.2
 *         colendingShare: 35.8
 *         bankPartnerships: 12
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../auth');

// Apply authentication to all metrics endpoints
router.use(authenticateToken);
router.use(requireRole('admin', 'analyst', 'manager'));

/**
 * @swagger
 * /api/metrics/total-applications:
 *   get:
 *     summary: Get total applications count
 *     description: Retrieve the total number of loan applications in the system
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total applications count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_applications:
 *                       type: integer
 *                       example: 1250
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 1. Total Applications Count
router.get('/total-applications', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as total_applications FROM loan_applications'
    );
    
    res.json({
      success: true,
      data: {
        total_applications: parseInt(result.rows[0].total_applications),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching total applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total applications count',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/approval-rate:
 *   get:
 *     summary: Get loan approval rate
 *     description: Retrieve the percentage of loan applications that have been approved
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approval rate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     approval_rate:
 *                       type: number
 *                       format: float
 *                       example: 72.5
 *                     approved_applications:
 *                       type: integer
 *                       example: 890
 *                     total_processed:
 *                       type: integer
 *                       example: 1200
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 2. Approval Rate
router.get('/approval-rate', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status IN ('approved', 'disbursed') THEN 1 END) as approved_applications
      FROM loan_applications
      WHERE status != 'pending'
    `);
    
    const total = parseInt(result.rows[0].total_applications);
    const approved = parseInt(result.rows[0].approved_applications);
    const approval_rate = total > 0 ? ((approved / total) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        approval_rate: parseFloat(approval_rate),
        approved_applications: approved,
        total_processed: total,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating approval rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate approval rate',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/average-cibil:
 *   get:
 *     summary: Get average CIBIL score
 *     description: Retrieve the average CIBIL score of all loan applicants
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Average CIBIL score retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     average_cibil:
 *                       type: integer
 *                       example: 685
 *                     total_reports:
 *                       type: integer
 *                       example: 1150
 *                     min_cibil:
 *                       type: integer
 *                       example: 300
 *                     max_cibil:
 *                       type: integer
 *                       example: 850
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 3. Average CIBIL Score
router.get('/average-cibil', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        AVG(br.cibil_score) as average_cibil,
        COUNT(br.cibil_score) as total_reports,
        MIN(br.cibil_score) as min_cibil,
        MAX(br.cibil_score) as max_cibil
      FROM bureau_reports br
      WHERE br.cibil_score IS NOT NULL
    `);
    
    const avgCibil = result.rows[0].average_cibil;
    
    res.json({
      success: true,
      data: {
        average_cibil: avgCibil ? Math.round(parseFloat(avgCibil)) : null,
        total_reports: parseInt(result.rows[0].total_reports),
        min_cibil: result.rows[0].min_cibil,
        max_cibil: result.rows[0].max_cibil,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating average CIBIL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate average CIBIL score',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/current-applicants:
 *   get:
 *     summary: Get current applicants count
 *     description: Retrieve the number of applicants currently in the system (pending/in-progress)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current applicants count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_applicants:
 *                       type: integer
 *                       example: 45
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         pending_applications:
 *                           type: integer
 *                           example: 20
 *                         kyc_pending:
 *                           type: integer
 *                           example: 15
 *                         under_review:
 *                           type: integer
 *                           example: 10
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 4. Current Applicants (Active Applications)
router.get('/current-applicants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as current_applicants,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'kyc_pending' THEN 1 END) as kyc_pending,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review
      FROM loan_applications
      WHERE status IN ('pending', 'kyc_pending', 'under_review')
    `);
    
    res.json({
      success: true,
      data: {
        current_applicants: parseInt(result.rows[0].current_applicants),
        breakdown: {
          pending_applications: parseInt(result.rows[0].pending_applications),
          kyc_pending: parseInt(result.rows[0].kyc_pending),
          under_review: parseInt(result.rows[0].under_review)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching current applicants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current applicants count',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/loans-disbursed:
 *   get:
 *     summary: Get loans disbursed count
 *     description: Retrieve the total number of loans that have been disbursed
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loans disbursed count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     loans_disbursed:
 *                       type: integer
 *                       example: 890
 *                     total_disbursed_amount:
 *                       type: number
 *                       format: float
 *                       example: 45000000.50
 *                     average_loan_amount:
 *                       type: number
 *                       format: float
 *                       example: 50561.80
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 5. Loans Disbursed
router.get('/loans-disbursed', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as loans_disbursed,
        SUM(la.sanction_limit) as total_disbursed_amount,
        AVG(la.sanction_limit) as average_loan_amount
      FROM loan_applications la
      WHERE la.status = 'disbursed'
    `);
    
    res.json({
      success: true,
      data: {
        loans_disbursed: parseInt(result.rows[0].loans_disbursed),
        total_disbursed_amount: parseFloat(result.rows[0].total_disbursed_amount || 0),
        average_loan_amount: parseFloat(result.rows[0].average_loan_amount || 0),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching loans disbursed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans disbursed count',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/overdue-rate:
 *   get:
 *     summary: Get overdue rate
 *     description: Retrieve the percentage of loans that are currently overdue
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue rate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overdue_rate:
 *                       type: number
 *                       format: float
 *                       example: 3.2
 *                     overdue_loans:
 *                       type: integer
 *                       example: 28
 *                     total_active_loans:
 *                       type: integer
 *                       example: 875
 *                     overdue_installments:
 *                       type: integer
 *                       example: 45
 *                     total_installments:
 *                       type: integer
 *                       example: 2650
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 6. Overdue Rate
router.get('/overdue-rate', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT rs.loan_offer_id) as total_active_loans,
        COUNT(DISTINCT CASE WHEN rs.payment_status = 'overdue' THEN rs.loan_offer_id END) as overdue_loans,
        COUNT(CASE WHEN rs.payment_status = 'overdue' THEN 1 END) as overdue_installments,
        COUNT(*) as total_installments
      FROM repayment_schedules rs
      JOIN loan_offers lo ON rs.loan_offer_id = lo.id
      JOIN loan_applications la ON lo.application_id = la.id
      WHERE la.status = 'disbursed' AND rs.due_date <= CURRENT_DATE
    `);
    
    const totalLoans = parseInt(result.rows[0].total_active_loans);
    const overdueLoans = parseInt(result.rows[0].overdue_loans);
    const overdue_rate = totalLoans > 0 ? ((overdueLoans / totalLoans) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        overdue_rate: parseFloat(overdue_rate),
        overdue_loans: overdueLoans,
        total_active_loans: totalLoans,
        overdue_installments: parseInt(result.rows[0].overdue_installments),
        total_installments: parseInt(result.rows[0].total_installments),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating overdue rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate overdue rate',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/colending-share:
 *   get:
 *     summary: Get co-lending share distribution
 *     description: Retrieve the distribution of loans across different lenders and co-lenders
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Co-lending share data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     colending_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           primary_lender:
 *                             type: string
 *                           co_lender:
 *                             type: string
 *                           loan_count:
 *                             type: integer
 *                           total_amount:
 *                             type: number
 *                             format: float
 *                           participation_ratio:
 *                             type: string
 *                           share_percentage:
 *                             type: string
 *                     total_disbursed_loans:
 *                       type: integer
 *                       example: 890
 *                     total_disbursed_amount:
 *                       type: number
 *                       format: float
 *                       example: 45000000.50
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 7. Co-lending Share
router.get('/colending-share', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        primary_lender,
        co_lender,
        COUNT(*) as loan_count,
        SUM(sanction_limit) as total_amount,
        participation_ratio
      FROM loan_applications
      WHERE status = 'disbursed' 
        AND primary_lender IS NOT NULL
      GROUP BY primary_lender, co_lender, participation_ratio
      ORDER BY total_amount DESC
    `);
    
    const totalDisbursed = await pool.query(`
      SELECT 
        COUNT(*) as total_loans,
        SUM(sanction_limit) as total_amount
      FROM loan_applications
      WHERE status = 'disbursed'
    `);
    
    const distribution = result.rows.map(row => ({
      primary_lender: row.primary_lender,
      co_lender: row.co_lender,
      loan_count: parseInt(row.loan_count),
      total_amount: parseFloat(row.total_amount),
      participation_ratio: row.participation_ratio,
      share_percentage: ((parseFloat(row.total_amount) / parseFloat(totalDisbursed.rows[0].total_amount)) * 100).toFixed(2)
    }));
    
    res.json({
      success: true,
      data: {
        colending_distribution: distribution,
        total_disbursed_loans: parseInt(totalDisbursed.rows[0].total_loans),
        total_disbursed_amount: parseFloat(totalDisbursed.rows[0].total_amount || 0),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching co-lending share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch co-lending share data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/bank-partnerships:
 *   get:
 *     summary: Get bank partnerships data
 *     description: Retrieve information about active bank partnerships and lending relationships
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank partnerships data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_bank_partnerships:
 *                       type: integer
 *                       example: 12
 *                     primary_lenders:
 *                       type: integer
 *                       example: 8
 *                     co_lenders:
 *                       type: integer
 *                       example: 6
 *                     partner_details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           partner_name:
 *                             type: string
 *                           partner_type:
 *                             type: string
 *                           loan_count:
 *                             type: integer
 *                           total_amount:
 *                             type: number
 *                             format: float
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// 8. Bank Partnerships
router.get('/bank-partnerships', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT primary_lender) as primary_lenders,
        COUNT(DISTINCT co_lender) as co_lenders,
        COUNT(DISTINCT COALESCE(primary_lender, co_lender)) as total_partners
      FROM loan_applications
      WHERE status = 'disbursed'
        AND (primary_lender IS NOT NULL OR co_lender IS NOT NULL)
    `);
    
    const partnerDetails = await pool.query(`
      SELECT 
        partner_name,
        partner_type,
        loan_count,
        total_amount
      FROM (
        SELECT 
          primary_lender as partner_name,
          'Primary Lender' as partner_type,
          COUNT(*) as loan_count,
          SUM(sanction_limit) as total_amount
        FROM loan_applications
        WHERE status = 'disbursed' AND primary_lender IS NOT NULL
        GROUP BY primary_lender
        
        UNION ALL
        
        SELECT 
          co_lender as partner_name,
          'Co-Lender' as partner_type,
          COUNT(*) as loan_count,
          SUM(sanction_limit) as total_amount
        FROM loan_applications
        WHERE status = 'disbursed' AND co_lender IS NOT NULL
        GROUP BY co_lender
      ) partners
      ORDER BY total_amount DESC
    `);
    
    res.json({
      success: true,
      data: {
        total_bank_partnerships: parseInt(result.rows[0].total_partners),
        primary_lenders: parseInt(result.rows[0].primary_lenders),
        co_lenders: parseInt(result.rows[0].co_lenders),
        partner_details: partnerDetails.rows.map(row => ({
          partner_name: row.partner_name,
          partner_type: row.partner_type,
          loan_count: parseInt(row.loan_count),
          total_amount: parseFloat(row.total_amount)
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching bank partnerships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank partnerships data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/metrics/overview:
 *   get:
 *     summary: Get metrics overview
 *     description: Retrieve a comprehensive overview of all key metrics for dashboard display
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MetricOverview'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Combined metrics endpoint for dashboard overview
router.get('/overview', async (req, res) => {
  try {
    // Execute all metrics queries in parallel for better performance
    const [totalApps, approvalRate, avgCibil, currentApps, disbursed, overdue] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM loan_applications'),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('approved', 'disbursed') THEN 1 END) as approved
        FROM loan_applications WHERE status != 'pending'
      `),
      pool.query('SELECT AVG(cibil_score) as avg_cibil FROM bureau_reports WHERE cibil_score IS NOT NULL'),
      pool.query(`
        SELECT COUNT(*) as current 
        FROM loan_applications 
        WHERE status IN ('pending', 'kyc_pending', 'under_review')
      `),
      pool.query('SELECT COUNT(*) as disbursed FROM loan_applications WHERE status = \'disbursed\''),
      pool.query(`
        SELECT 
          COUNT(DISTINCT rs.loan_offer_id) as total_loans,
          COUNT(DISTINCT CASE WHEN rs.payment_status = 'overdue' THEN rs.loan_offer_id END) as overdue_loans
        FROM repayment_schedules rs
        JOIN loan_offers lo ON rs.loan_offer_id = lo.id
        JOIN loan_applications la ON lo.application_id = la.id
        WHERE la.status = 'disbursed' AND rs.due_date <= CURRENT_DATE
      `)
    ]);
    
    const total = parseInt(totalApps.rows[0].total);
    const approved = parseInt(approvalRate.rows[0].approved);
    const totalProcessed = parseInt(approvalRate.rows[0].total);
    const totalLoans = parseInt(overdue.rows[0].total_loans);
    const overdueLoans = parseInt(overdue.rows[0].overdue_loans);
    
    res.json({
      success: true,
      data: {
        total_applications: total,
        approval_rate: totalProcessed > 0 ? ((approved / totalProcessed) * 100).toFixed(2) : 0,
        average_cibil: avgCibil.rows[0].avg_cibil ? Math.round(parseFloat(avgCibil.rows[0].avg_cibil)) : null,
        current_applicants: parseInt(currentApps.rows[0].current),
        loans_disbursed: parseInt(disbursed.rows[0].disbursed),
        overdue_rate: totalLoans > 0 ? ((overdueLoans / totalLoans) * 100).toFixed(2) : 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching metrics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics overview',
      error: error.message
    });
  }
});

module.exports = router;