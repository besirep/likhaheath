const db = require('../config/db');

// GET /api/queue  (today's queue)
exports.getToday = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.*,
         a.scheduled_date, a.status AS appointment_status,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         CONCAT(s.first_name,' ',s.last_name) AS doctor_name
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       JOIN patients     p ON a.patient_id = p.id
       LEFT JOIN staff   s ON a.doctor_id  = s.id
       WHERE DATE(a.scheduled_date) = CURDATE()
       ORDER BY q.queue_number ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/queue/next
exports.getNext = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.*, CONCAT(p.first_name,' ',p.last_name) AS patient_name
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       JOIN patients     p ON a.patient_id = p.id
       WHERE q.status = 'Waiting' AND DATE(a.scheduled_date) = CURDATE()
       ORDER BY q.queue_number ASC
       LIMIT 1`
    );
    if (!rows.length) return res.json({ message: 'No patients waiting.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/queue/:id/status
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['Waiting', 'In-Progress', 'Done', 'Skipped'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  try {
    await db.query('UPDATE queue SET status=? WHERE id=?', [status, req.params.id]);
    // Sync appointment status when done
    if (status === 'Done') {
      const [q] = await db.query('SELECT appointment_id FROM queue WHERE id=?', [req.params.id]);
      if (q.length) await db.query('UPDATE appointments SET status="Completed" WHERE id=?', [q[0].appointment_id]);
    }
    res.json({ message: 'Queue status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
