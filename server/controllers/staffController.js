const db = require('../config/db');

// GET /api/staff
exports.getAll = async (req, res) => {
  const { search = '', position = '' } = req.query;
  const like = `%${search}%`;
  try {
    let query = `SELECT * FROM medical_staff WHERE (first_name LIKE ? OR last_name LIKE ? OR prc_license_number LIKE ?)`;
    const params = [like, like, like];
    if (position) { query += ' AND position = ?'; params.push(position); }
    query += ' ORDER BY last_name ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/staff/:id
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medical_staff WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Staff not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/staff
exports.create = async (req, res) => {
  const { first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired } = req.body;
  if (!first_name || !last_name || !position)
    return res.status(400).json({ error: 'first_name, last_name, and position are required.' });
  try {
    const [result] = await db.query(
      `INSERT INTO medical_staff (first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired]
    );
    res.status(201).json({ id: result.insertId, message: 'Staff registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/staff/:id
exports.update = async (req, res) => {
  const { first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired } = req.body;
  try {
    await db.query(
      `UPDATE medical_staff SET first_name=?, last_name=?, gender=?, date_of_birth=?, contact_number=?, email=?, position=?, prc_license_number=?, prc_expiry_date=?, employment_status=?, date_hired=?
       WHERE id=?`,
      [first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired, req.params.id]
    );
    res.json({ message: 'Staff updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/staff/:id/status
exports.toggleStatus = async (req, res) => {
  try {
    await db.query('UPDATE medical_staff SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Staff status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
