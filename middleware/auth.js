const jwt = require('jsonwebtoken');
const pool = require('./config/database');
const config = require('./config/app.config');

// Enhanced authentication middleware for LMS
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);

    // JWT tokens are self-contained, no need to check session table for validation
    // Session table is used for tracking and audit purposes only

    // Get fresh user data and permissions
    const table = decoded.userType === 'admin' ? 'admin_users' : 'employees';
    const userQuery = `
      SELECT u.id, u.username, u.employee_name, u.status, r.role_name, r.id as role_id
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

    const user = userResult.rows[0];

    // Get current permissions
    const permissionsQuery = `
      SELECT p.permission_name, p.module
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    
    const permissionsResult = await pool.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.permission_name);

    // Attach user info to request
    req.user = {
      id: user.id,
      username: user.username,
      employeeName: user.employee_name,
      userType: decoded.userType,
      role: user.role_name,
      roleId: user.role_id,
      permissions: permissions
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Role-based authorization middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  next();
};

// Audit logging middleware
const auditLog = (action, module) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await pool.query(`
          INSERT INTO audit_trail (user_id, user_type, action, module, resource_type, resource_id, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          req.user.id,
          req.user.userType,
          action,
          module,
          req.route?.path || req.path,
          req.params?.id || null,
          req.ip,
          req.get('User-Agent')
        ]);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request if audit logging fails
    }
    
    next();
  };
};

// Session cleanup middleware (run periodically)
const cleanupExpiredSessions = async () => {
  try {
    await pool.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true
    `);
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

// Rate limiting for login attempts
const loginRateLimit = async (req, res, next) => {
  try {
    const ip = req.ip;
    const username = req.body.username;
    
    // Check IP-based rate limiting (10 attempts per 15 minutes)
    const ipAttempts = await pool.query(`
      SELECT COUNT(*) as count 
      FROM audit_trail 
      WHERE ip_address = $1 
        AND action = 'login_failed' 
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
    `, [ip]);
    
    if (parseInt(ipAttempts.rows[0].count) >= 10) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many login attempts. Please try again later.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Continue on error
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireAdmin,
  auditLog,
  cleanupExpiredSessions,
  loginRateLimit
};