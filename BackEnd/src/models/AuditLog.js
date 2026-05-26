/**
 * src/models/AuditLog.js — Audit Log Database Schema
 *
 * Persists security and system audit events (auth, sub creation, etc.)
 * in a structured, immutable format for compliance and developer analytics.
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Speeds up user-specific log lookups
  },
  action: {
    type: String,
    required: true, // e.g., 'USER_LOGIN', 'SUB_CREATED', 'BUDGET_EXCEEDED'
  },
  category: {
    type: String,
    required: true, // e.g., 'AUTH', 'SUBSCRIPTION', 'SYSTEM'
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d', // Automatically deletes logs older than 90 days to conserve database space
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
