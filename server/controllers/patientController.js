const db = require('../config/db');

// GET /api/patients
exports.getAll = async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like   = `%${search}%`;
  try {
    const [rows] = await db.query(
      `SELECT * FROM patients
       WHERE is_deleted = 0
         AND (first_name LIKE ? OR last_name LIKE ? OR philhealth_id LIKE ? OR contact_number LIKE ?)
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM patients
       WHERE is_deleted = 0
         AND (first_name LIKE ? OR last_name LIKE ? OR philhealth_id LIKE ? OR contact_number LIKE ?)`,
      [like, like, like, like]
    );
    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/patients/:id
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Patient not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/patients
exports.create = async (req, res) => {
  const { first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type } = req.body;
  if (!first_name || !last_name || !birth_date || !gender || !address)
    return res.status(400).json({ error: 'Required fields: first_name, last_name, birth_date, gender, address.' });
  try {
    const [result] = await db.query(
      `INSERT INTO patients (first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type]
    );
    res.status(201).json({ id: result.insertId, message: 'Patient registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/patients/:id
exports.update = async (req, res) => {
  const { first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type } = req.body;
  try {
    await db.query(
      `UPDATE patients SET first_name=?, last_name=?, birth_date=?, gender=?, address=?, contact_number=?, email=?, emergency_contact=?, philhealth_id=?, blood_type=?
       WHERE id=? AND is_deleted=0`,
      [first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type, req.params.id]
    );
    res.json({ message: 'Patient updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/patients/:id  (soft delete)
exports.remove = async (req, res) => {
  try {
    await db.query('UPDATE patients SET is_deleted=1 WHERE id=?', [req.params.id]);
    res.json({ message: 'Patient removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
