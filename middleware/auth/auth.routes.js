/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *           example: admin
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: password123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           description: JWT authentication token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *               example: 1
 *             username:
 *               type: string
 *               description: Username
 *               example: admin
 *             employeeName:
 *               type: string
 *               description: Employee full name
 *               example: John Doe
 *             userType:
 *               type: string
 *               enum: [admin, employee]
 *               description: Type of user account
 *               example: admin
 *             role:
 *               type: string
 *               description: User role
 *               example: super_admin
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *               description: List of user permissions
 *               example: ["user_management", "application_management"]
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *           example: oldpassword123
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 *           example: newpassword123
 *     ChangePasswordResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Password changed successfully
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Logged out successfully
 *     VerifyTokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             username:
 *               type: string
 *               example: admin
 *             employeeName:
 *               type: string
 *               example: John Doe
 *             userType:
 *               type: string
 *               enum: [admin, employee]
 *               example: admin
 *             role:
 *               type: string
 *               example: super_admin
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["user_management", "application_management"]
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// LMS Internal Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Check both admin_users and employees tables
    let user = null;
    let userType = null;
    let roleInfo = null;

    // First check admin_users table
    const adminQuery = `
      SELECT au.id, au.username, au.password_hash, au.employee_name, au.status,
             au.login_attempts, au.locked_until, r.role_name, r.id as role_id
      FROM admin_users au
      LEFT JOIN roles r ON au.role_id = r.id
      WHERE au.username = $1 AND au.status = 'active'
    `;
    
    const adminResult = await pool.query(adminQuery, [username]);
    
    if (adminResult.rows.length > 0) {
      user = adminResult.rows[0];
      userType = 'admin';
    } else {
      // Check employees table
      const employeeQuery = `
        SELECT e.id, e.username, e.password_hash, e.employee_name, e.status,
               e.login_attempts, e.locked_until, r.role_name, r.id as role_id,
               e.department, e.designation
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE e.username = $1 AND e.status = 'active'
      `;
      
      const employeeResult = await pool.query(employeeQuery, [username]);
      
      if (employeeResult.rows.length > 0) {
        user = employeeResult.rows[0];
        userType = 'employee';
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials or account inactive' 
      });
    }

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({ 
        success: false, 
        message: 'Account is temporarily locked. Please try again later.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes after 5 attempts
      
      const table = userType === 'admin' ? 'admin_users' : 'employees';
      await pool.query(`
        UPDATE ${table} 
        SET login_attempts = $1, locked_until = $2 
        WHERE id = $3
      `, [attempts, lockUntil, user.id]);
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Reset login attempts on successful login
    const table = userType === 'admin' ? 'admin_users' : 'employees';
    await pool.query(`
      UPDATE ${table} 
      SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [user.id]);

    // Get user permissions
    const permissionsQuery = `
      SELECT p.permission_name, p.module
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    
    const permissionsResult = await pool.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.permission_name);

    // Generate JWT token with enhanced payload
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      employeeName: user.employee_name,
      userType: userType,
      role: user.role_name,
      roleId: user.role_id,
      permissions: permissions
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // 8 hours for internal system
    );

    // Create session record with session ID instead of full token
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    await pool.query(`
      INSERT INTO user_sessions (user_id, user_type, session_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      user.id,
      userType,
      sessionId, // Store session ID instead of full JWT
      req.ip,
      req.get('User-Agent'),
      new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    ]);

    // Log successful login
    await pool.query(`
      INSERT INTO audit_trail (user_id, user_type, action, module, ip_address, user_agent)
      VALUES ($1, $2, 'login', 'authentication', $3, $4)
    `, [user.id, userType, req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        employeeName: user.employee_name,
        userType: userType,
        role: user.role_name,
        permissions: permissions,
        department: user.department || null,
        designation: user.designation || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Logout endpoint
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Logged out successfully'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     description: Invalidate the user's session and JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Invalidate session
      await pool.query(`
        UPDATE user_sessions 
        SET is_active = false, logged_out_at = CURRENT_TIMESTAMP 
        WHERE session_token = $1
      `, [token]);
      
      // Log logout action
      const decoded = jwt.decode(token);
      if (decoded) {
        await pool.query(`
          INSERT INTO audit_trail (user_id, user_type, action, module, ip_address, user_agent)
          VALUES ($1, $2, 'logout', 'authentication', $3, $4)
        `, [decoded.userId, decoded.userType, req.ip, req.get('User-Agent')]);
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify token endpoint
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token validity
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    // Verify JWT token - JWT tokens are self-contained
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data to ensure user is still active
    const table = decoded.userType === 'admin' ? 'admin_users' : 'employees';
    const userQuery = `
      SELECT u.id, u.username, u.employee_name, u.status, r.role_name
      FROM ${table} u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.status = 'active'
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
        employeeName: decoded.employeeName,
        userType: decoded.userType,
        role: decoded.role,
        permissions: decoded.permissions
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the authenticated user's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChangePasswordResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid token or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
// Change password endpoint
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { currentPassword, newPassword } = req.body;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from appropriate table
    const table = decoded.userType === 'admin' ? 'admin_users' : 'employees';
    const userQuery = `SELECT id, password_hash FROM ${table} WHERE id = $1`;
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await pool.query(`
      UPDATE ${table} 
      SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [hashedNewPassword, decoded.userId]);
    
    // Log password change
    await pool.query(`
      INSERT INTO audit_trail (user_id, user_type, action, module, ip_address, user_agent)
      VALUES ($1, $2, 'password_change', 'authentication', $3, $4)
    `, [decoded.userId, decoded.userType, req.ip, req.get('User-Agent')]);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;