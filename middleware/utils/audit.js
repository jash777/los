/**
 * Audit Utility
 * Provides audit logging functionality
 */

const logger = require('./logger');

const audit = {
  logAudit: (action, userId, details = {}) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details
    };
    
    logger.info('AUDIT', auditEntry);
    
    // In a real implementation, this would save to database
    // For now, just log to console
  }
};

module.exports = audit;