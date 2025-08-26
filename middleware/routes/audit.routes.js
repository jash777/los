/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique audit log ID
 *         applicationId:
 *           type: integer
 *           nullable: true
 *           description: Associated application ID
 *         userId:
 *           type: string
 *           description: User who performed the action
 *         action:
 *           type: string
 *           description: Action performed
 *         details:
 *           type: object
 *           description: Additional action details
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the action occurred
 *         ipAddress:
 *           type: string
 *           description: IP address of the user
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         module:
 *           type: string
 *           description: System module where action occurred
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Action severity level
 *     AuditLogsList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             logs:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 *             pagination:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 totalRecords:
 *                   type: integer
 *                   description: Total number of audit logs
 *                 pageSize:
 *                   type: integer
 *                   description: Number of records per page
 *     AuditSummary:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             totalLogs:
 *               type: integer
 *               description: Total number of audit logs
 *             recentActivity:
 *               type: integer
 *               description: Recent activity count (last 24h)
 *             topActions:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                   count:
 *                     type: integer
 *             topUsers:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   count:
 *                     type: integer
 *             severityDistribution:
 *               type: object
 *               properties:
 *                 low:
 *                   type: integer
 *                 medium:
 *                   type: integer
 *                 high:
 *                   type: integer
 *                 critical:
 *                   type: integer
 */

const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole, requirePermission, auditLog } = require('../auth');

const router = express.Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audit logs
 *     description: Retrieve all audit logs with optional filtering and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of records per page
 *       - in: query
 *         name: application_id
 *         schema:
 *           type: integer
 *         description: Filter by application ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (partial match)
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogsList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions to view audit logs
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
// Get audit logs
router.get('/', authenticateToken, requirePermission('audit_view'), auditLog('view_audit_logs', 'system'), async (req, res) => {
  try {
    const { application_id, user_id, action, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.username, u.full_name, la.application_number
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN loan_applications la ON al.application_id = la.id
      WHERE 1=1
    `;
    const params = [];

    if (application_id) {
      params.push(application_id);
      query += ` AND al.application_id = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $${params.length}`;
    }

    if (action) {
      params.push(`%${action}%`);
      query += ` AND al.action ILIKE $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/audit/application/{applicationId}:
 *   get:
 *     summary: Get audit logs by application ID
 *     description: Retrieve all audit logs for a specific loan application
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the loan application
 *     responses:
 *       200:
 *         description: Application audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application not found or no audit logs
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
// Get audit logs for specific application
router.get('/application/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(`
      SELECT al.*, u.username, u.full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.application_id = $1
      ORDER BY al.created_at DESC
    `, [applicationId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     description: Retrieve audit log statistics for the last 30 days
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditSummary'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Requires admin or super_admin role
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
// Get audit statistics
router.get('/stats', authenticateToken, requireRole('super_admin', 'admin'), auditLog('view_audit_stats', 'system'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        action,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action, DATE(created_at)
      ORDER BY date DESC, count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;