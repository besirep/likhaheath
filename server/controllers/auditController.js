const db = require('../config/db');

exports.getLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.staff_id, s.first_name, s.last_name, s.position, 
              a.action, a.details, a.ip_address, a.created_at
       FROM audit_logs a
       LEFT JOIN staff s ON a.staff_id = s.id
       ORDER BY a.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('[auditController]', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
};
