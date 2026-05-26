/**
 * src/utils/auditLogger.js — System Audit Logging Utility
 *
 * Implements a fail-safe audit logger that runs asynchronously.
 * Captures request context (IP, User-Agent) automatically if the `req` object is passed.
 * Captures user actions to create a verifiable security trail.
 */
const AuditLog = require('../models/AuditLog');

const logEvent = async ({ userId, action, category, req, metadata = {} }) => {
  // Fail-safe try/catch so audit logging failure never crashes main user flows
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Behind reverse proxies like Nginx/Cloudflare, x-forwarded-for holds the real client IP
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      userAgent = req.headers['user-agent'];
    }

    await AuditLog.create({
      userId,
      action,
      category,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (err) {
    // Log to standard error stream but do not bubble up
    console.error('[AUDIT_ERROR] Failed to save audit log event:', err.message);
  }
};

module.exports = { logEvent };
