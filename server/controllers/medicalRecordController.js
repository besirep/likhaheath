const db = require('../config/db');

// GET /api/medical-records
exports.getAll = async (req, res) => {
  const { patient_id, doctor_id } = req.query;
  try {
    let query = `
      SELECT mr.*,
        CONCAT(p.first_name,' ',p.last_name) AS patient_name,
        CONCAT(s.first_name,' ',s.last_name) AS doctor_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN staff s ON mr.doctor_id = s.id
      WHERE 1=1`;
    const params = [];
    if (patient_id) { query += ' AND mr.patient_id = ?'; params.push(patient_id); }
    if (doctor_id)  { query += ' AND mr.doctor_id  = ?'; params.push(doctor_id);  }
    query += ' ORDER BY mr.record_date DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/medical-records/:id
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mr.*,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         CONCAT(s.first_name,' ',s.last_name) AS doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       LEFT JOIN staff s ON mr.doctor_id = s.id
       WHERE mr.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/medical-records
exports.create = async (req, res) => {
  const { patient_id, appointment_id, doctor_id, diagnosis, treatment, notes, record_date } = req.body;
  if (!patient_id || !diagnosis || !treatment || !record_date)
    return res.status(400).json({ error: 'patient_id, diagnosis, treatment, record_date are required.' });

  // RBAC: Doctors can only create records under their own staff_id
  if (req.user.role === 'Doctor' && req.user.staffId != doctor_id)
    return res.status(403).json({ error: 'Doctors can only create records for their own patients.' });

  try {
    const [result] = await db.query(
      `INSERT INTO medical_records (patient_id, appointment_id, doctor_id, diagnosis, treatment, notes, record_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, appointment_id || null, doctor_id || req.user.staffId || null, diagnosis, treatment, notes || null, record_date]
    );
    res.status(201).json({ id: result.insertId, message: 'Medical record created.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/medical-records/patient/:id
exports.getByPatient = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mr.*, CONCAT(s.first_name,' ',s.last_name) AS doctor_name
       FROM medical_records mr
       LEFT JOIN staff s ON mr.doctor_id = s.id
       WHERE mr.patient_id = ?
       ORDER BY mr.record_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
