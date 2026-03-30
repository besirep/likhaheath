const db = require('../config/db');

// GET /api/doctors
exports.getAll = async (req, res) => {
  const { search = '' } = req.query;
  const like = `%${search}%`;
  try {
    const [rows] = await db.query(
      `SELECT * FROM doctors
       WHERE first_name LIKE ? OR last_name LIKE ? OR specialization LIKE ? OR prc_license_number LIKE ?
       ORDER BY last_name ASC`,
      [like, like, like, like]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/doctors/:id
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/doctors
exports.create = async (req, res) => {
  const { first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired } = req.body;
  if (!first_name || !last_name)
    return res.status(400).json({ error: 'First name and last name are required.' });
  try {
    const [result] = await db.query(
      `INSERT INTO doctors (first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired]
    );
    res.status(201).json({ id: result.insertId, message: 'Doctor registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/doctors/:id
exports.update = async (req, res) => {
  const { first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired } = req.body;
  try {
    await db.query(
      `UPDATE doctors SET first_name=?, last_name=?, gender=?, date_of_birth=?, contact_number=?, email=?, specialization=?, prc_license_number=?, prc_expiry_date=?, ptr_number=?, s2_license=?, employment_status=?, date_hired=?
       WHERE id=?`,
      [first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired, req.params.id]
    );
    res.json({ message: 'Doctor updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/doctors/:id/status
exports.toggleStatus = async (req, res) => {
  try {
    await db.query('UPDATE doctors SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/doctors/expiring-licenses
exports.expiringLicenses = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM doctors
       WHERE prc_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY prc_expiry_date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
