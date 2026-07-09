const db = require('../config/db');

/**
 * Logs an audit event to the database.
 * 
 * @param {number} staffId - The ID of the admin/staff performing the action
 * @param {string} action - The action performed (e.g. 'LOGIN', 'CREATE_ACCOUNT', 'UPDATE_ACCOUNT', 'DELETE_ACCOUNT')
 * @param {string} details - JSON or string with details about the action
 * @param {string} ipAddress - (Optional) The IP address of the user
 */
const logAudit = async (staffId, action, details, ipAddress = null) => {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await db.query(
      `INSERT INTO audit_logs (staff_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
      [staffId, action, detailsStr, ipAddress]
    );
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
};

module.exports = {
  logAudit
};
