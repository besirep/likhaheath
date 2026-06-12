const db = require('../config/db');
const { sendSMS, getPatientPhone, queueCalledMessage } = require('../helpers/smsHelper');

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
          CONCAT(p.last_name, ', ', p.first_name)  AS patient_name,
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
      `SELECT q.*, CONCAT(p.last_name,', ',p.first_name) AS patient_name
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
    // Sync appointment status
    const [q] = await db.query('SELECT appointment_id, queue_number FROM queue WHERE id=?', [req.params.id]);
    if (q.length) {
      if (status === 'Done') {
        await db.query('UPDATE appointments SET status="Completed" WHERE id=?', [q[0].appointment_id]);
      } else if (status === 'Skipped') {
        await db.query('UPDATE appointments SET status="No-Show" WHERE id=?', [q[0].appointment_id]);
      }

      // ── Fire "queue called" SMS when patient's turn starts ──────────────────
      if (status === 'In-Progress') {
        (async () => {
          try {
            const [[appt]] = await db.query(
              `SELECT a.patient_id, p.first_name
               FROM appointments a
               JOIN patients p ON a.patient_id = p.id
               WHERE a.id = ?`,
              [q[0].appointment_id]
            );
            if (!appt) return;
            const phone = await getPatientPhone(appt.patient_id);
            if (!phone) return;
            const smsMsg = queueCalledMessage(appt.first_name, q[0].queue_number);
            const r = await sendSMS({
              phone, message: smsMsg,
              patient_id: appt.patient_id,
              appointment_id: q[0].appointment_id,
            });
            console.log(`[SMS] Queue-called SMS to patient ${appt.patient_id}: ${r.success ? 'SENT' : 'FAILED'}`);
          } catch (err) {
            console.error('[SMS] Queue-called SMS error:', err.message);
          }
        })();
      }
    }
    res.json({ message: 'Queue status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// PATCH /api/queue/:id/vitals — nurse records vitals for a queued patient
exports.updateVitals = async (req, res) => {
  const { blood_pressure, temperature, heart_rate, spo2, weight_kg, height_cm } = req.body;
  const staffId = req.user?.staffId || null;
  try {
    // Get appointment_id from queue
    const [[qrow]] = await db.query('SELECT appointment_id FROM queue WHERE id=?', [req.params.id]);
    if (!qrow) return res.status(404).json({ error: 'Queue entry not found.' });
    const apptId = qrow.appointment_id;

    // Upsert vitals row
    await db.query(
      `INSERT INTO vitals (appointment_id, blood_pressure, temperature, heart_rate, spo2, weight_kg, height_cm, recorded_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         blood_pressure  = VALUES(blood_pressure),
         temperature     = VALUES(temperature),
         heart_rate      = VALUES(heart_rate),
         spo2            = VALUES(spo2),
         weight_kg       = VALUES(weight_kg),
         height_cm       = VALUES(height_cm),
         recorded_by_id  = VALUES(recorded_by_id),
         recorded_at     = CURRENT_TIMESTAMP`,
      [apptId, blood_pressure || null, temperature || null, heart_rate || null,
       spo2 || null, weight_kg || null, height_cm || null, staffId]
    );

    // Advance status: Waiting → In-Progress (vitals done, ready for doctor)
    // We use a separate interim flag on the frontend; backend stores 'Waiting'
    // but we can set a custom status to indicate vitals-done
    // For now: update queue status to 'Vitals-Done' (we'll add it to ENUM below)
    await db.query("UPDATE queue SET status='Vitals-Done' WHERE id=?", [req.params.id]);

    res.json({ message: 'Vitals recorded and patient marked ready for doctor.' });
  } catch (err) {
    console.error('[Queue] updateVitals error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/queue/:id/doctor
exports.updateDoctor = async (req, res) => {
  const { doctor_id } = req.body;
  try {
    const [q] = await db.query('SELECT appointment_id FROM queue WHERE id=?', [req.params.id]);
    if (!q.length) return res.status(404).json({ error: 'Queue item not found.' });
    
    await db.query('UPDATE appointments SET doctor_id=? WHERE id=?', [doctor_id || null, q[0].appointment_id]);
    res.json({ message: 'Doctor assigned successfully.' });
  } catch (err) {
    console.error('[Queue] updateDoctor error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
