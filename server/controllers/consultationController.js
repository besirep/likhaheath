const db = require('../config/db');

/**
 * GET /api/consultations/queue
 * Returns today's queue entries for the logged-in doctor.
 * Joins: appointments → patients → vitals → queue
 */
const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = req.user.staffId;
    const [rows] = await db.query(
      `SELECT
         q.id              AS queue_id,
         q.queue_number,
         q.status          AS queue_status,
         a.id              AS appointment_id,
         a.notes           AS visit_reason,
         a.scheduled_date,
         p.id              AS patient_id,
         p.first_name,
         p.last_name,
         TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
         so.label          AS sex,
         v.blood_pressure,
         v.temperature,
         v.heart_rate,
         v.spo2,
         v.weight_kg,
         v.height_cm,
         v.recorded_at     AS vitals_recorded_at,
         st.first_name     AS nurse_first_name,
         st.last_name      AS nurse_last_name
       FROM queue q
       JOIN appointments a  ON a.id = q.appointment_id
       JOIN patients p      ON p.id = a.patient_id
       JOIN sex_options so   ON so.id = p.sex_id
       LEFT JOIN vitals v    ON v.appointment_id = a.id
       LEFT JOIN staff st    ON st.id = v.recorded_by_id
       WHERE DATE(a.scheduled_date) = CURDATE()
         AND a.doctor_id = ?
         AND q.status != 'Done'
       ORDER BY
         CASE q.status
           WHEN 'In-Progress' THEN 1
           WHEN 'Waiting'     THEN 2
           WHEN 'Skipped'     THEN 3
           ELSE 4
         END,
         q.queue_number ASC`,
      [doctorId]
    );

    const formatted = rows.map(r => ({
      queueId:         r.queue_id,
      queueNumber:     r.queue_number,
      status:          r.queue_status,
      appointmentId:   r.appointment_id,
      visitReason:     r.visit_reason,
      patientId:       r.patient_id,
      name:            `${r.first_name} ${r.last_name}`,
      age:             r.age,
      sex:             r.sex,
      vitals: r.vitals_recorded_at ? {
        bp:        r.blood_pressure,
        temp:      r.temperature,
        hr:        r.heart_rate,
        spo2:      r.spo2,
        weight:    r.weight_kg,
        height:    r.height_cm,
        nurse:     r.nurse_first_name ? `${r.nurse_first_name} ${r.nurse_last_name}` : null,
        recordedAt: r.vitals_recorded_at,
      } : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getDoctorQueue error:', err);
    res.status(500).json({ message: 'Failed to fetch queue.' });
  }
};

/**
 * PATCH /api/consultations/queue/:queueId/status
 * Updates the status of a queue entry.
 * Body: { status: 'In-Progress' | 'Done' | 'Skipped' | 'Waiting' }
 */
const updateQueueStatus = async (req, res) => {
  const { queueId } = req.params;
  const { status }  = req.body;

  const allowed = ['Waiting', 'In-Progress', 'Done', 'Skipped'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
  }

  try {
    await db.query(
      'UPDATE queue SET status = ? WHERE id = ?',
      [status, queueId]
    );

    // Sync appointment status based on queue status
    const [qRows] = await db.query('SELECT appointment_id FROM queue WHERE id = ?', [queueId]);
    if (qRows.length) {
      const appointmentId = qRows[0].appointment_id;
      if (status === 'Done') {
        await db.query('UPDATE appointments SET status = "Completed" WHERE id = ?', [appointmentId]);
      } else if (status === 'Skipped') {
        await db.query('UPDATE appointments SET status = "No-Show" WHERE id = ?', [appointmentId]);
      }
    }

    res.json({ message: `Queue status updated to ${status}.` });
  } catch (err) {
    console.error('updateQueueStatus error:', err);
    res.status(500).json({ message: 'Failed to update queue status.' });
  }
};

/**
 * POST /api/consultations
 * Saves the doctor's consultation findings (medical record).
 * Body: { appointmentId, patientId, diagnosis, treatment, notes, labOrders, followUpDate }
 * Also marks the appointment as 'Completed' and queue as 'Done'.
 */
const saveConsultation = async (req, res) => {
  const { appointmentId, patientId, diagnosis, treatment, notes, followUpDate } = req.body;
  const doctorId = req.user.staffId;

  if (!appointmentId || !patientId || !diagnosis || !treatment) {
    return res.status(400).json({ message: 'appointmentId, patientId, diagnosis, and treatment are required.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Issue #7 — Verify the doctor owns this appointment before saving
    const [appts] = await conn.query(
      `SELECT doctor_id FROM appointments WHERE id = ? LIMIT 1`,
      [appointmentId]
    );
    if (!appts.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appts[0].doctor_id !== doctorId) {
      await conn.rollback();
      return res.status(403).json({ message: 'You are not authorized to save this consultation.' });
    }

    // 1. Save medical record
    await conn.query(
      `INSERT INTO medical_records (patient_id, appointment_id, doctor_id, diagnosis, treatment, notes, record_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [patientId, appointmentId, doctorId, diagnosis, treatment, notes || null]
    );

    // 2. Mark appointment as Completed
    await conn.query(
      `UPDATE appointments SET status = 'Completed' WHERE id = ?`,
      [appointmentId]
    );

    // 3. Mark queue entry as Done
    await conn.query(
      `UPDATE queue SET status = 'Done' WHERE appointment_id = ?`,
      [appointmentId]
    );

    // 4. If a follow-up date is provided, create a new appointment + queue entry
    if (followUpDate) {
      // Issue #5 — Use MAX from queue table (joined with appointments) to avoid duplicate queue numbers
      const [queueMax] = await conn.query(
        `SELECT COALESCE(MAX(q.queue_number), 0) AS max_q
         FROM queue q
         JOIN appointments a ON a.id = q.appointment_id
         WHERE DATE(a.scheduled_date) = ?`,
        [followUpDate]
      );
      const nextQueue = (queueMax[0].max_q || 0) + 1;

      const [apptResult] = await conn.query(
        `INSERT INTO appointments (patient_id, doctor_id, created_by_id, scheduled_date, queue_number, status, notes)
         VALUES (?, ?, ?, ?, ?, 'Scheduled', 'Follow-up')`,
        [patientId, doctorId, doctorId, followUpDate, nextQueue]
      );

      await conn.query(
        `INSERT INTO queue (appointment_id, queue_number, status)
         VALUES (?, ?, 'Waiting')`,
        [apptResult.insertId, nextQueue]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Consultation saved successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('saveConsultation error:', err);
    res.status(500).json({ message: 'Failed to save consultation.' });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/consultations/history
 * Returns the logged-in doctor's past completed consultations.
 */
const getConsultationHistory = async (req, res) => {
  const doctorId = req.user.staffId;
  try {
    const [rows] = await db.query(
      `SELECT
         mr.id,
         mr.diagnosis,
         mr.treatment,
         mr.notes,
         mr.record_date,
         p.id          AS patient_id,
         p.first_name,
         p.last_name,
         TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
         so.label      AS sex,
         a.notes       AS visit_reason,
         q.queue_number,
         v.blood_pressure,
         v.temperature,
         v.heart_rate,
         v.spo2,
         v.weight_kg,
         v.height_cm
       FROM medical_records mr
       JOIN patients p       ON p.id  = mr.patient_id
       JOIN sex_options so    ON so.id = p.sex_id
       LEFT JOIN appointments a ON a.id = mr.appointment_id
       LEFT JOIN queue q        ON q.appointment_id = a.id
       LEFT JOIN vitals v       ON v.appointment_id = a.id
       WHERE mr.doctor_id = ?
       ORDER BY mr.record_date DESC, mr.id DESC
       LIMIT 50`,
      [doctorId]
    );

    const formatted = rows.map(r => ({
      id:          r.id,
      diagnosis:   r.diagnosis,
      treatment:   r.treatment,
      notes:       r.notes,
      date:        r.record_date,
      visitReason: r.visit_reason,
      queueNumber: r.queue_number,
      patient: {
        id:   r.patient_id,
        name: `${r.first_name} ${r.last_name}`,
        age:  r.age,
        sex:  r.sex,
      },
      vitals: r.blood_pressure ? {
        bp:     r.blood_pressure,
        temp:   r.temperature,
        hr:     r.heart_rate,
        spo2:   r.spo2,
        weight: r.weight_kg,
        height: r.height_cm,
      } : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getConsultationHistory error:', err);
    res.status(500).json({ message: 'Failed to fetch consultation history.' });
  }
};

module.exports = { getDoctorQueue, updateQueueStatus, saveConsultation, getConsultationHistory };
