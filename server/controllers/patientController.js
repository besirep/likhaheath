const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
// Always insert a new address row — never reuse shared rows across patients
// (Reusing caused Issue #3: updating one patient's address mutated another's)
async function insertAddress({ street, barangay, municipality, province, region, zip_code }, conn) {
  const [result] = await conn.query(
    `INSERT INTO addresses (street, barangay, municipality, province, region, zip_code) VALUES (?, ?, ?, ?, ?, ?)`,
    [street || null, barangay, municipality, province, region || null, zip_code || null]
  );
  return result.insertId;
}

async function resolveId(conn, table, column, value) {
  if (!value) return null;
  const [rows] = await conn.query(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  return rows.length ? rows[0].id : null;
}

async function getNextQueueNumber(conn) {
  // Use CURDATE() (MySQL server timezone) instead of JavaScript's toISOString() (UTC)
  // to avoid timezone mismatch — toISOString gives yesterday's date in UTC+8 before 8AM
  const [rows] = await conn.query(
    `SELECT COALESCE(MAX(q.queue_number), 0) AS max_q
     FROM queue q
     JOIN appointments a ON q.appointment_id = a.id
     WHERE DATE(a.scheduled_date) = CURDATE()
     FOR UPDATE`
  );
  return (rows[0].max_q || 0) + 1;
}

// Shared helper: create appointment + queue entry (+ optional vitals) for a patient
async function createVisitEntry(conn, { patient_id, doctor_id, visit_reason, priority, notes, staff_id, vitals }) {
  const now = new Date();
  const queue_number = await getNextQueueNumber(conn);
  const [apptResult] = await conn.query(
    `INSERT INTO appointments (patient_id, doctor_id, created_by_id, scheduled_date, queue_number, status, notes)
     VALUES (?, ?, ?, ?, ?, 'Scheduled', ?)`,
    [patient_id, doctor_id || null, staff_id || null, now, queue_number, notes || null]
  );
  const appointment_id = apptResult.insertId;
  await conn.query(
    `INSERT INTO queue (appointment_id, queue_number, status) VALUES (?, ?, 'Waiting')`,
    [appointment_id, queue_number]
  );
  // Save vitals if provided during registration
  if (vitals && (vitals.blood_pressure || vitals.temperature)) {
    await conn.query(
      `INSERT INTO vitals (appointment_id, blood_pressure, temperature, heart_rate, spo2, weight_kg, height_cm, recorded_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        vitals.blood_pressure || null,
        vitals.temperature   || null,
        vitals.heart_rate    || null,
        vitals.spo2          || null,
        vitals.weight_kg     || null,
        vitals.height_cm     || null,
        staff_id || null,
      ]
    );
  }
  return { appointment_id, queue_number };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /api/patients
exports.getAll = async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like   = `%${search}%`;
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.first_name, p.last_name, p.suffix, p.date_of_birth, p.philhealth_no,
              p.emergency_contact, p.created_at,
              sx.label AS sex,
              cs.label AS civil_status,
              bt.code  AS blood_type,
              a.barangay, a.municipality,
              ci.value AS primary_contact
       FROM patients p
       LEFT JOIN sex_options    sx ON p.sex_id          = sx.id
       LEFT JOIN civil_statuses cs ON p.civil_status_id = cs.id
       LEFT JOIN blood_types    bt ON p.blood_type_id   = bt.id
       LEFT JOIN addresses       a ON p.address_id      = a.id
       LEFT JOIN contact_info   ci ON p.id = ci.patient_id AND ci.is_primary = 1 AND ci.type = 'phone'
       WHERE p.is_deleted = 0
         AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.philhealth_no LIKE ? OR ci.value LIKE ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM patients p
       LEFT JOIN contact_info ci ON p.id = ci.patient_id AND ci.is_primary = 1 AND ci.type = 'phone'
       WHERE p.is_deleted = 0
         AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.philhealth_no LIKE ? OR ci.value LIKE ?)`,
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
    const [rows] = await db.query(
      `SELECT p.*, sx.label AS sex, cs.label AS civil_status, bt.code AS blood_type,
              a.street, a.barangay, a.municipality, a.province, a.region, a.zip_code
       FROM patients p
       LEFT JOIN sex_options    sx ON p.sex_id           = sx.id
       LEFT JOIN civil_statuses cs ON p.civil_status_id  = cs.id
       LEFT JOIN blood_types    bt ON p.blood_type_id     = bt.id
       LEFT JOIN addresses       a ON p.address_id         = a.id
       WHERE p.id = ? AND p.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Patient not found.' });

    const [contacts] = await db.query(
      'SELECT type, value, is_primary FROM contact_info WHERE patient_id = ?',
      [req.params.id]
    );
    res.json({ ...rows[0], contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/patients
// Expected body: { first_name, last_name, suffix?, date_of_birth, sex_name, civil_status_name,
//   blood_type_code?, nationality?, occupation?, philhealth_no?, emergency_contact?,
//   address: { street?, barangay, municipality, province, region?, zip_code? },
//   contact_info: [{ type, value, is_primary }],
//   visit_reason?, send_sms?, priority? }
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      first_name, last_name, suffix, date_of_birth,
      sex_name, civil_status_name, blood_type_code,
      nationality, occupation, philhealth_no, emergency_contact,
      address = {}, contact_info = [],
    } = req.body;

    if (!first_name || !last_name || !date_of_birth || !sex_name || !civil_status_name || !address.barangay)
      return res.status(400).json({ error: 'Required: first_name, last_name, date_of_birth, sex_name, civil_status_name, address.barangay.' });

    // Resolve FKs
    const sex_id          = await resolveId(conn, 'sex_options', 'label', sex_name);
    const civil_status_id = await resolveId(conn, 'civil_statuses', 'label', civil_status_name);
    const blood_type_id   = await resolveId(conn, 'blood_types', 'code', blood_type_code);
    const address_id = await insertAddress(address, conn);

    if (!sex_id)          throw new Error(`Unknown sex: ${sex_name}`);
    if (!civil_status_id) throw new Error(`Unknown civil status: ${civil_status_name}`);

    const registered_by_staff_id = req.user?.staffId || null;

    const [result] = await conn.query(
      `INSERT INTO patients
        (first_name, last_name, suffix, date_of_birth, sex_id, civil_status_id, blood_type_id,
         nationality, occupation, philhealth_no, emergency_contact,
         address_id, registered_by_staff_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, suffix || null, date_of_birth,
        sex_id, civil_status_id, blood_type_id || null,
        nationality || 'Filipino', occupation || null, philhealth_no || null,
        emergency_contact || null, address_id, registered_by_staff_id,
      ]
    );
    const patient_id = result.insertId;

    // Insert contact_info rows
    for (const c of contact_info) {
      await conn.query(
        'INSERT INTO contact_info (patient_id, type, value, is_primary) VALUES (?, ?, ?, ?)',
        [patient_id, c.type, c.value, c.is_primary ? 1 : 0]
      );
    }

    // Resolve doctor FK if a doctor name was sent
    const { visit_reason, send_sms, priority, notes, doctor_id, vitals } = req.body;
    const staff_id = req.user?.staffId || null;

    const { appointment_id, queue_number } = await createVisitEntry(conn, {
      patient_id, doctor_id: doctor_id || null,
      visit_reason, priority, notes, staff_id, vitals: vitals || null,
    });

    await conn.commit();

    res.status(201).json({ patient_id, appointment_id, queue_number, message: 'Patient registered successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('[patientController.create]', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
};

// PUT /api/patients/:id
exports.update = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      first_name, last_name, suffix, date_of_birth,
      sex_name, civil_status_name, blood_type_code,
      nationality, occupation, philhealth_no, emergency_contact,
      address = {},
    } = req.body;

    const sex_id          = await resolveId(conn, 'sex_options', 'label', sex_name);
    const civil_status_id = await resolveId(conn, 'civil_statuses', 'label', civil_status_name);
    const blood_type_id   = await resolveId(conn, 'blood_types', 'code', blood_type_code);
    const address_id = address.barangay ? await insertAddress(address, conn) : undefined;

    await conn.query(
      `UPDATE patients SET
        first_name=?, last_name=?, suffix=?, date_of_birth=?,
        sex_id=?, civil_status_id=?, blood_type_id=?,
        nationality=?, occupation=?, philhealth_no=?, emergency_contact=?
        ${address_id ? ', address_id=?' : ''}
       WHERE id=? AND is_deleted=0`,
      [
        first_name, last_name, suffix || null, date_of_birth,
        sex_id, civil_status_id, blood_type_id || null,
        nationality, occupation, philhealth_no, emergency_contact,
        ...(address_id ? [address_id] : []),
        req.params.id,
      ]
    );

    await conn.commit();
    res.json({ message: 'Patient updated.' });
  } catch (err) {
    await conn.rollback();
    console.error('[patientController.update]', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    conn.release();
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

// POST /api/patients/:id/visit — queue a returning (existing) patient
// Body: { visit_reason, doctor_id?, notes?, priority?, send_sms? }
exports.createVisit = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const patient_id = parseInt(req.params.id, 10);
    const [patients] = await conn.query(
      `SELECT id, first_name, last_name FROM patients WHERE id = ? AND is_deleted = 0`,
      [patient_id]
    );
    if (!patients.length) return res.status(404).json({ error: 'Patient not found.' });

    // Issue #8 — Prevent duplicate queue entries for the same patient on the same day
    const [existing] = await conn.query(
      `SELECT q.id FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       WHERE a.patient_id = ? AND DATE(a.scheduled_date) = CURDATE()
         AND q.status IN ('Waiting','In-Progress')
       LIMIT 1`,
      [patient_id]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'This patient already has an active queue entry today.' });
    }

    const { visit_reason, doctor_id, notes, priority, vitals } = req.body;
    const staff_id = req.user?.staffId || null;
    const { appointment_id, queue_number } = await createVisitEntry(conn, {
      patient_id, doctor_id: doctor_id || null, visit_reason, priority, notes, staff_id, vitals: vitals || null,
    });

    await conn.commit();
    const p = patients[0];
    res.status(201).json({
      patient_id, appointment_id, queue_number,
      patient_name: `${p.first_name} ${p.last_name}`,
      message: 'Patient added to queue.',
    });
  } catch (err) {
    await conn.rollback();
    console.error('[patientController.createVisit]', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
};

// GET /api/patients/:id/visits — all visit records for a patient
// Returns every appointment as one visit (with vitals + medical record if present)
exports.getVisits = async (req, res) => {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const [rows] = await db.query(
      `SELECT
         a.id               AS appointment_id,
         a.queue_number,
         a.scheduled_date,
         a.status           AS appointment_status,
         a.notes,
         CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
         -- vitals (may be null if not recorded)
         v.blood_pressure,
         v.temperature,
         v.heart_rate,
         v.spo2,
         v.weight_kg,
         v.height_cm,
         v.recorded_at      AS vitals_recorded_at,
         -- medical record (may be null if no consultation yet)
         mr.id              AS record_id,
         mr.diagnosis,
         mr.treatment,
         mr.record_date
       FROM appointments a
       LEFT JOIN staff      s  ON a.doctor_id      = s.id
       LEFT JOIN vitals     v  ON v.appointment_id = a.id
       LEFT JOIN medical_records mr ON mr.appointment_id = a.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_date DESC`,
      [patient_id]
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('[patientController.getVisits]', err);
    res.status(500).json({ error: err.message });
  }
};

