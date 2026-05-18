const db = require('../config/db');

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
      SELECT id, health_center_id, first_name, last_name, suffix,
             position, prc_license_number, prc_expiry_date,
             employment_status, is_active, created_at
      FROM staff
      WHERE (first_name LIKE ? OR last_name LIKE ? OR prc_license_number LIKE ?)`;
    const params = [like, like, like];
    if (position) { query += ' AND position = ?'; params.push(position); }
    if (req.query.active !== undefined) { query += ' AND is_active = ?'; params.push(req.query.active ? 1 : 0); }
    query += ' ORDER BY last_name ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { internalError(res, err); }
};

// ── GET /api/staff/:id ────────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, health_center_id, first_name, last_name, suffix,
              position, prc_license_number, prc_expiry_date,
              employment_status, is_active, created_at
       FROM staff WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Staff not found.' });
    res.json(rows[0]);
  } catch (err) { internalError(res, err); }
};

// ── POST /api/staff ───────────────────────────────────────────────────────────
// Required body: { first_name, last_name, position, health_center_id }
// Optional:      { suffix, prc_license_number, prc_expiry_date, employment_status }
exports.create = async (req, res) => {
  const {
    first_name, last_name, suffix,
    position, prc_license_number, prc_expiry_date,
    employment_status, health_center_id,
  } = req.body;

  if (!first_name || !last_name || !position || !health_center_id)
    return res.status(400).json({ error: 'first_name, last_name, position, and health_center_id are required.' });

  try {
    const [result] = await db.query(
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
    res.status(201).json({ id: result.insertId, message: 'Staff registered successfully.' });
  } catch (err) { internalError(res, err); }
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
    res.json({ message: 'Staff updated.' });
  } catch (err) { internalError(res, err); }
};

// ── PATCH /api/staff/:id/status ───────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    await db.query('UPDATE staff SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Staff status updated.' });
  } catch (err) { internalError(res, err); }
};
