const db = require('../config/db');

// POST /api/sms/send
exports.send = async (req, res) => {
  const { patient_id, appointment_id, message } = req.body;
  if (!patient_id || !message)
    return res.status(400).json({ error: 'patient_id and message are required.' });
  try {
    // Simulated SMS — stored in DB with status "Sent"
    const [result] = await db.query(
      `INSERT INTO sms_notifications (patient_id, appointment_id, message, status) VALUES (?, ?, ?, 'Sent')`,
      [patient_id, appointment_id || null, message]
    );
    res.status(201).json({ id: result.insertId, message: 'SMS logged successfully (simulated).' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sms/history
exports.getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sms.*, CONCAT(p.first_name,' ',p.last_name) AS patient_name, p.contact_number
       FROM sms_notifications sms
       JOIN patients p ON sms.patient_id = p.id
       ORDER BY sms.sent_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sms/patient/:id
exports.getByPatient = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM sms_notifications WHERE patient_id = ? ORDER BY sent_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
