const db = require('../config/db');

// GET /api/queue  (today's queue — enriched with patient & vitals data)
exports.getToday = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          q.id,
          q.queue_number,
          q.status,
          q.appointment_id,
          q.created_at,
          q.updated_at,

          -- Appointment
          a.scheduled_date,
          a.notes           AS chief_complaint,
          a.patient_id,
          a.doctor_id,

          -- Patient
          CONCAT(p.first_name, ' ', p.last_name)  AS patient_name,
          p.date_of_birth,
          p.philhealth_no,

          -- Patient sex (via lookup)
          sx.label AS sex,

          -- Doctor
          CONCAT(s.first_name, ' ', s.last_name)  AS doctor_name,

          -- Primary contact phone
          ci.value AS contact_number,

          -- Priority tag from appointment_services label (if any)
          -- We store priority as a service name convention
          svc.service_name AS priority_tag,

          -- Vitals (LEFT JOIN — NULL if not yet recorded)
          CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END AS has_vitals,
          v.blood_pressure,
          v.temperature,
          v.heart_rate,
          v.spo2,
          v.weight_kg,
          v.height_cm

       FROM queue q
       JOIN appointments a  ON q.appointment_id = a.id
       JOIN patients     p  ON a.patient_id      = p.id
       JOIN sex_options  sx ON p.sex_id          = sx.id
       LEFT JOIN staff   s  ON a.doctor_id       = s.id
       LEFT JOIN contact_info ci
              ON p.id = ci.patient_id AND ci.type = 'phone' AND ci.is_primary = 1
       LEFT JOIN appointment_services svc
              ON a.id = svc.appointment_id
             AND svc.service_name IN ('elderly','pregnant','pwd','pediatric','solo_parent')
       LEFT JOIN vitals v ON a.id = v.appointment_id
       WHERE DATE(a.scheduled_date) = CURDATE()
       ORDER BY q.queue_number ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Queue] getToday error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/queue/next — first Waiting patient today
exports.getNext = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.*, CONCAT(p.first_name,' ',p.last_name) AS patient_name
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       JOIN patients     p ON a.patient_id      = p.id
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
    // Sync appointment status when Done
    if (status === 'Done') {
      const [q] = await db.query('SELECT appointment_id FROM queue WHERE id=?', [req.params.id]);
      if (q.length) await db.query('UPDATE appointments SET status="Completed" WHERE id=?', [q[0].appointment_id]);
    }
    res.json({ message: 'Queue status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
