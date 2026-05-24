const db = require('../config/db');

// GET /api/appointments
exports.getAll = async (req, res) => {
  const { date, status, doctor_id } = req.query;
  try {
    let query = `
      SELECT a.*,
        CONCAT(p.first_name,' ',p.last_name) AS patient_name,
        CONCAT(s.first_name,' ',s.last_name) AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN staff s ON a.doctor_id = s.id
      WHERE 1=1`;
    const params = [];
    if (date)      { query += ' AND DATE(a.scheduled_date) = ?'; params.push(date); }
    if (status)    { query += ' AND a.status = ?';               params.push(status); }
    if (doctor_id) { query += ' AND a.doctor_id = ?';            params.push(doctor_id); }
    query += ' ORDER BY a.scheduled_date ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/appointments/today
exports.getToday = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         CONCAT(s.first_name,' ',s.last_name) AS doctor_name,
         q.status AS queue_status, q.queue_number
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN staff s ON a.doctor_id = s.id
       LEFT JOIN queue q ON a.id = q.appointment_id
       WHERE DATE(a.scheduled_date) = CURDATE()
       ORDER BY q.queue_number ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/appointments/:id
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         CONCAT(s.first_name,' ',s.last_name) AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN staff s ON a.doctor_id = s.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found.' });
    const [services] = await db.query(
      'SELECT * FROM appointment_services WHERE appointment_id = ?',
      [req.params.id]
    );
    res.json({ ...rows[0], services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/appointments
exports.create = async (req, res) => {
  const { patient_id, doctor_id, scheduled_date, services } = req.body;
  if (!patient_id || !scheduled_date)
    return res.status(400).json({ error: 'patient_id and scheduled_date are required.' });

  const created_by_id = req.user.staffId; // from JWT payload

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get next queue number for the given day — use FOR UPDATE to prevent race conditions
    const [[{ max_q }]] = await conn.query(
      `SELECT COALESCE(MAX(q.queue_number), 0) AS max_q
       FROM queue q
       JOIN appointments a ON a.id = q.appointment_id
       WHERE DATE(a.scheduled_date) = DATE(?)
       FOR UPDATE`,
      [scheduled_date]
    );
    const queueNumber = (max_q || 0) + 1;

    const [result] = await conn.query(
      `INSERT INTO appointments (patient_id, doctor_id, created_by_id, scheduled_date, queue_number)
       VALUES (?, ?, ?, ?, ?)`,
      [patient_id, doctor_id || null, created_by_id, scheduled_date, queueNumber]
    );
    const appointmentId = result.insertId;

    // Create queue entry
    await conn.query(
      `INSERT INTO queue (appointment_id, queue_number) VALUES (?, ?)`,
      [appointmentId, queueNumber]
    );

    // Add services if provided
    if (services && services.length > 0) {
      const serviceValues = services.map(s => [
        appointmentId,
        s.service_name,
        s.quantity || 1,
        s.notes || null,
      ]);
      await conn.query(
        `INSERT INTO appointment_services (appointment_id, service_name, quantity, notes) VALUES ?`,
        [serviceValues]
      );
    }

    await conn.commit();
    res.status(201).json({ id: appointmentId, queue_number: queueNumber, message: 'Appointment created.' });
  } catch (err) {
    await conn.rollback();
    console.error('[Appointment] create error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// PUT /api/appointments/:id
exports.update = async (req, res) => {
  const { patient_id, doctor_id, scheduled_date, status } = req.body;
  try {
    await db.query(
      `UPDATE appointments SET patient_id=?, doctor_id=?, scheduled_date=?, status=? WHERE id=?`,
      [patient_id, doctor_id || null, scheduled_date, status, req.params.id]
    );
    res.json({ message: 'Appointment updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/appointments/:id  (soft cancel)
exports.remove = async (req, res) => {
  try {
    await db.query('UPDATE appointments SET status="Cancelled" WHERE id=?', [req.params.id]);
    res.json({ message: 'Appointment cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
