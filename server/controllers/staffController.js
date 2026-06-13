const db = require('../config/db');
const { logAudit } = require('../helpers/auditLogger');

// ── Helpers ───────────────────────────────────────────────────────────────────
// Sanitize internal error — never expose DB details to client
const internalError = (res, err) => {
  console.error('[staffController]', err);
  return res.status(500).json({ error: 'An internal server error occurred.' });
};

// ── GET /api/staff ─────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  const { search = '', position = '' } = req.query;
  const like = `%${search}%`;
  try {
    // Only select columns that actually exist in the schema
    let query = `
      SELECT s.id, s.health_center_id, s.first_name, s.last_name, s.suffix,
             s.position, s.prc_license_number, s.prc_expiry_date,
             s.employment_status, s.is_active, s.created_at,
             u.role
      FROM staff s
      LEFT JOIN users u ON u.staff_id = s.id
      WHERE (s.first_name LIKE ? OR s.last_name LIKE ? OR s.prc_license_number LIKE ?)`;
    const params = [like, like, like];
    if (position) { query += ' AND s.position = ?'; params.push(position); }
    if (req.query.active !== undefined) { query += ' AND s.is_active = ?'; params.push(req.query.active ? 1 : 0); }
    query += ' ORDER BY s.last_name ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { internalError(res, err); }
};

// ── GET /api/staff/:id ────────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.health_center_id, s.first_name, s.last_name, s.suffix,
              s.position, s.prc_license_number, s.prc_expiry_date,
              s.employment_status, s.is_active, s.created_at,
              u.role
       FROM staff s 
       LEFT JOIN users u ON u.staff_id = s.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Staff not found.' });
    res.json(rows[0]);
  } catch (err) { internalError(res, err); }
};

const bcrypt = require('bcryptjs');

// ── POST /api/staff ───────────────────────────────────────────────────────────
// Required body: { first_name, last_name, position, health_center_id, role }
// Optional:      { suffix, prc_license_number, prc_expiry_date, employment_status }
exports.create = async (req, res) => {
  const {
    first_name, last_name, suffix,
    position, prc_license_number, prc_expiry_date,
    employment_status, health_center_id, role
  } = req.body;

  if (!first_name || !last_name || !position || !health_center_id || !role)
    return res.status(400).json({ error: 'first_name, last_name, position, health_center_id, and role are required.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [staffResult] = await conn.query(
      `INSERT INTO staff
         (health_center_id, first_name, last_name, suffix, position,
          prc_license_number, prc_expiry_date, employment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        health_center_id,
        first_name, last_name, suffix || null,
        position,
        prc_license_number || null,
        prc_expiry_date    || null,
        employment_status  || 'Regular',
      ]
    );

    const staffId = staffResult.insertId;

    // Generate username (e.g. juan.delacruz)
    const baseUsername = `${first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${last_name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists
    while (true) {
      const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length === 0) break;
      username = `${baseUsername}${counter++}`;
    }

    const defaultPass = 'LikhaHealth2025!';
    const password_hash = await bcrypt.hash(defaultPass, 10);

    await conn.query(
      `INSERT INTO users (username, password_hash, role, staff_id)
       VALUES (?, ?, ?, ?)`,
      [username, password_hash, role, staffId]
    );

    await conn.commit();
    
    // Log Audit
    if (req.user && req.user.staffId) {
      await logAudit(req.user.staffId, 'CREATE_ACCOUNT', { createdStaffId: staffId, username, role });
    }

    res.status(201).json({ id: staffId, username, message: 'Staff and user account registered successfully.' });
  } catch (err) {
    await conn.rollback();
    internalError(res, err);
  } finally {
    conn.release();
  }
};

// ── PUT /api/staff/:id ────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const {
    first_name, last_name, suffix,
    position, prc_license_number, prc_expiry_date, employment_status,
  } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE staff
       SET first_name=?, last_name=?, suffix=?, position=?,
           prc_license_number=?, prc_expiry_date=?, employment_status=?
       WHERE id=?`,
      [
        first_name, last_name, suffix || null, position,
        prc_license_number || null,
        prc_expiry_date    || null,
        employment_status  || 'Regular',
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff not found.' });

    // Log Audit
    if (req.user && req.user.staffId) {
      await logAudit(req.user.staffId, 'UPDATE_ACCOUNT', { targetStaffId: req.params.id, action: 'Updated staff details' });
    }

    res.json({ message: 'Staff updated.' });
  } catch (err) { internalError(res, err); }
};

// ── PATCH /api/staff/:id/status ───────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT is_active FROM staff WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Staff not found.' });
    
    const newStatus = rows[0].is_active ? 0 : 1;
    await conn.query('UPDATE staff SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    await conn.query('UPDATE users SET is_active = ? WHERE staff_id = ?', [newStatus, req.params.id]);
    
    // Log Audit
    if (req.user && req.user.staffId) {
      await logAudit(req.user.staffId, 'UPDATE_ACCOUNT', { targetStaffId: req.params.id, action: newStatus ? 'Activated account' : 'Deactivated account' });
    }

    res.json({ message: 'Status updated.', is_active: newStatus });
  } catch (err) { internalError(res, err); }
  finally { conn.release(); }
};

// ── POST /api/staff/:id/reset-password ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [userRows] = await conn.query('SELECT id, username FROM users WHERE staff_id = ?', [req.params.id]);
    if (!userRows.length) return res.status(404).json({ error: 'User account not found for this staff member.' });

    const defaultPass = 'LikhaHealth2025!';
    const password_hash = await bcrypt.hash(defaultPass, 10);

    await conn.query('UPDATE users SET password_hash = ? WHERE staff_id = ?', [password_hash, req.params.id]);

    // Log Audit
    if (req.user && req.user.staffId) {
      await logAudit(req.user.staffId, 'UPDATE_ACCOUNT', { targetStaffId: req.params.id, action: 'Reset password' });
    }

    res.json({ username: userRows[0].username, password: defaultPass, message: 'Password reset successfully.' });
  } catch (err) {
    internalError(res, err);
  } finally {
    conn.release();
  }
};
