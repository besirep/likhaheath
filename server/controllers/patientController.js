const db = require('../config/db');
const { sendSMS, getPatientPhone, registrationMessage } = require('../helpers/smsHelper');


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
  // Save vitals (standard + pediatric) if provided during registration
  if (vitals && (vitals.blood_pressure || vitals.temperature || vitals.length_cm)) {
    await conn.query(
      `INSERT INTO vitals
         (appointment_id, blood_pressure, temperature, heart_rate, spo2, weight_kg, height_cm,
          length_cm, head_circumference_cm, skinfold_thickness_cm,
          body_circumference_cm, waist_cm, hip_cm, limbs_cm, muac_cm,
          recorded_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        vitals.blood_pressure          || null,
        vitals.temperature             || null,
        vitals.heart_rate              || null,
        vitals.spo2                    || null,
        vitals.weight_kg               || null,
        vitals.height_cm               || null,
        vitals.length_cm               || null,
        vitals.head_circumference_cm   || null,
        vitals.skinfold_thickness_cm   || null,
        vitals.body_circumference_cm   || null,
        vitals.waist_cm                || null,
        vitals.hip_cm                  || null,
        vitals.limbs_cm                || null,
        vitals.muac_cm                 || null,
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

    // Medical history (one row per patient, may not exist yet)
    const [mhRows] = await db.query(
      'SELECT * FROM patient_medical_history WHERE patient_id = ? LIMIT 1',
      [req.params.id]
    );

    // Female health (only for female patients)
    const [fhRows] = await db.query(
      'SELECT * FROM patient_female_health WHERE patient_id = ? LIMIT 1',
      [req.params.id]
    );

    res.json({
      ...rows[0],
      contacts,
      medical_history: mhRows[0] || null,
      female_health:   fhRows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/patients
// Expected body: { first_name, middle_name?, last_name, suffix?, date_of_birth, sex_name, civil_status_name,
//   blood_type_code?, nationality?, occupation?, philhealth_no?, emergency_contact?,
//   address: { street?, barangay, municipality, province, region?, zip_code? },
//   contact_info: [{ type, value, is_primary }],
//   medical_history?: { has_hypertension, has_diabetes, ... social_smoking, social_alcohol, general_survey },
//   female_health?: { no_of_children, lmp, period_duration_days, cycle_length_days, fp_method, menopausal_age },
//   visit_reason?, send_sms?, priority?, vitals? }
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      first_name, middle_name, last_name, suffix, date_of_birth,
      sex_name, civil_status_name, blood_type_code,
      nationality, occupation, philhealth_no, emergency_contact,
      address = {}, contact_info = [],
      medical_history, female_health,
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
        (first_name, middle_name, last_name, suffix, date_of_birth, sex_id, civil_status_id, blood_type_id,
         nationality, occupation, philhealth_no, emergency_contact,
         address_id, registered_by_staff_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, middle_name || null, last_name, suffix || null, date_of_birth,
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

    // Save medical history (upsert — one row per patient)
    if (medical_history) {
      await conn.query(
        `INSERT INTO patient_medical_history
           (patient_id, has_hypertension, has_heart_disease, has_diabetes, has_stroke,
            has_asthma, has_tuberculosis, has_copd, has_allergies, has_smoking_hx,
            has_none, other_conditions, social_smoking, social_alcohol, general_survey,
            recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           has_hypertension=VALUES(has_hypertension),
           has_heart_disease=VALUES(has_heart_disease),
           has_diabetes=VALUES(has_diabetes),
           has_stroke=VALUES(has_stroke),
           has_asthma=VALUES(has_asthma),
           has_tuberculosis=VALUES(has_tuberculosis),
           has_copd=VALUES(has_copd),
           has_allergies=VALUES(has_allergies),
           has_smoking_hx=VALUES(has_smoking_hx),
           has_none=VALUES(has_none),
           other_conditions=VALUES(other_conditions),
           social_smoking=VALUES(social_smoking),
           social_alcohol=VALUES(social_alcohol),
           general_survey=VALUES(general_survey),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          patient_id,
          medical_history.has_hypertension  ? 1 : 0,
          medical_history.has_heart_disease  ? 1 : 0,
          medical_history.has_diabetes       ? 1 : 0,
          medical_history.has_stroke         ? 1 : 0,
          medical_history.has_asthma         ? 1 : 0,
          medical_history.has_tuberculosis   ? 1 : 0,
          medical_history.has_copd           ? 1 : 0,
          medical_history.has_allergies      ? 1 : 0,
          medical_history.has_smoking_hx     ? 1 : 0,
          medical_history.has_none           ? 1 : 0,
          medical_history.other_conditions   || null,
          medical_history.social_smoking     ? 1 : 0,
          medical_history.social_alcohol     ? 1 : 0,
          medical_history.general_survey     || null,
          staff_id,
        ]
      );
    }

    // Save female health data (only for female patients)
    if (female_health && sex_name === 'Female') {
      await conn.query(
        `INSERT INTO patient_female_health
           (patient_id, no_of_children, lmp, period_duration_days, cycle_length_days,
            fp_method, menopausal_age, recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           no_of_children=VALUES(no_of_children),
           lmp=VALUES(lmp),
           period_duration_days=VALUES(period_duration_days),
           cycle_length_days=VALUES(cycle_length_days),
           fp_method=VALUES(fp_method),
           menopausal_age=VALUES(menopausal_age),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          patient_id,
          female_health.no_of_children        || null,
          female_health.lmp                   || null,
          female_health.period_duration_days  || null,
          female_health.cycle_length_days     || null,
          female_health.fp_method             || null,
          female_health.menopausal_age        || null,
          staff_id,
        ]
      );
    }

    const { appointment_id, queue_number } = await createVisitEntry(conn, {
      patient_id, doctor_id: doctor_id || null,
      visit_reason, priority, notes, staff_id, vitals: vitals || null,
    });

    await conn.commit();

    // ── Fire registration SMS (async, non-blocking) ──────────────────────────
    if (send_sms) {
      const phone = contact_info.find(c => c.type === 'phone')?.value;
      if (phone) {
        const smsMsg = registrationMessage(first_name, queue_number);
        sendSMS({ phone, message: smsMsg, patient_id, appointment_id })
          .then(r => console.log(`[SMS] Registration SMS to patient ${patient_id}: ${r.success ? 'SENT' : 'FAILED'}`))
          .catch(err => console.error('[SMS] Registration SMS error:', err.message));
      }
    }

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
      first_name, middle_name, last_name, suffix, date_of_birth,
      sex_name, civil_status_name, blood_type_code,
      nationality, occupation, philhealth_no, emergency_contact,
      address = {},
      medical_history, female_health,
    } = req.body;

    const sex_id          = await resolveId(conn, 'sex_options', 'label', sex_name);
    const civil_status_id = await resolveId(conn, 'civil_statuses', 'label', civil_status_name);
    const blood_type_id   = await resolveId(conn, 'blood_types', 'code', blood_type_code);
    const address_id = address.barangay ? await insertAddress(address, conn) : undefined;
    const staff_id = req.user?.staffId || null;

    await conn.query(
      `UPDATE patients SET
        first_name=?, middle_name=?, last_name=?, suffix=?, date_of_birth=?,
        sex_id=?, civil_status_id=?, blood_type_id=?,
        nationality=?, occupation=?, philhealth_no=?, emergency_contact=?
        ${address_id ? ', address_id=?' : ''}
       WHERE id=? AND is_deleted=0`,
      [
        first_name, middle_name || null, last_name, suffix || null, date_of_birth,
        sex_id, civil_status_id, blood_type_id || null,
        nationality, occupation, philhealth_no, emergency_contact,
        ...(address_id ? [address_id] : []),
        req.params.id,
      ]
    );

    // Update medical history (upsert)
    if (medical_history) {
      await conn.query(
        `INSERT INTO patient_medical_history
           (patient_id, has_hypertension, has_heart_disease, has_diabetes, has_stroke,
            has_asthma, has_tuberculosis, has_copd, has_allergies, has_smoking_hx,
            has_none, other_conditions, social_smoking, social_alcohol, general_survey,
            recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           has_hypertension=VALUES(has_hypertension), has_heart_disease=VALUES(has_heart_disease),
           has_diabetes=VALUES(has_diabetes), has_stroke=VALUES(has_stroke),
           has_asthma=VALUES(has_asthma), has_tuberculosis=VALUES(has_tuberculosis),
           has_copd=VALUES(has_copd), has_allergies=VALUES(has_allergies),
           has_smoking_hx=VALUES(has_smoking_hx), has_none=VALUES(has_none),
           other_conditions=VALUES(other_conditions), social_smoking=VALUES(social_smoking),
           social_alcohol=VALUES(social_alcohol), general_survey=VALUES(general_survey),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          req.params.id,
          medical_history.has_hypertension  ? 1 : 0, medical_history.has_heart_disease ? 1 : 0,
          medical_history.has_diabetes      ? 1 : 0, medical_history.has_stroke        ? 1 : 0,
          medical_history.has_asthma        ? 1 : 0, medical_history.has_tuberculosis  ? 1 : 0,
          medical_history.has_copd          ? 1 : 0, medical_history.has_allergies     ? 1 : 0,
          medical_history.has_smoking_hx    ? 1 : 0, medical_history.has_none          ? 1 : 0,
          medical_history.other_conditions  || null,
          medical_history.social_smoking    ? 1 : 0, medical_history.social_alcohol    ? 1 : 0,
          medical_history.general_survey    || null,
          staff_id,
        ]
      );
    }

    // Update female health (upsert)
    if (female_health && sex_name === 'Female') {
      await conn.query(
        `INSERT INTO patient_female_health
           (patient_id, no_of_children, lmp, period_duration_days, cycle_length_days,
            fp_method, menopausal_age, recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           no_of_children=VALUES(no_of_children), lmp=VALUES(lmp),
           period_duration_days=VALUES(period_duration_days), cycle_length_days=VALUES(cycle_length_days),
           fp_method=VALUES(fp_method), menopausal_age=VALUES(menopausal_age),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          req.params.id,
          female_health.no_of_children || null, female_health.lmp || null,
          female_health.period_duration_days || null, female_health.cycle_length_days || null,
          female_health.fp_method || null, female_health.menopausal_age || null,
          staff_id,
        ]
      );
    }

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

    const { visit_reason, doctor_id, notes, priority, vitals, send_sms, medical_history, female_health, sex_name } = req.body;
    const staff_id = req.user?.staffId || null;
    const { appointment_id, queue_number } = await createVisitEntry(conn, {
      patient_id, doctor_id: doctor_id || null, visit_reason, priority, notes, staff_id, vitals: vitals || null,
    });

    // Update medical history (upsert)
    if (medical_history) {
      await conn.query(
        `INSERT INTO patient_medical_history
           (patient_id, has_hypertension, has_heart_disease, has_diabetes, has_stroke,
            has_asthma, has_tuberculosis, has_copd, has_allergies, has_smoking_hx,
            has_none, other_conditions, social_smoking, social_alcohol, general_survey,
            recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           has_hypertension=VALUES(has_hypertension), has_heart_disease=VALUES(has_heart_disease),
           has_diabetes=VALUES(has_diabetes), has_stroke=VALUES(has_stroke),
           has_asthma=VALUES(has_asthma), has_tuberculosis=VALUES(has_tuberculosis),
           has_copd=VALUES(has_copd), has_allergies=VALUES(has_allergies),
           has_smoking_hx=VALUES(has_smoking_hx), has_none=VALUES(has_none),
           other_conditions=VALUES(other_conditions), social_smoking=VALUES(social_smoking),
           social_alcohol=VALUES(social_alcohol), general_survey=VALUES(general_survey),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          patient_id,
          medical_history.has_hypertension  ? 1 : 0, medical_history.has_heart_disease ? 1 : 0,
          medical_history.has_diabetes      ? 1 : 0, medical_history.has_stroke        ? 1 : 0,
          medical_history.has_asthma        ? 1 : 0, medical_history.has_tuberculosis  ? 1 : 0,
          medical_history.has_copd          ? 1 : 0, medical_history.has_allergies     ? 1 : 0,
          medical_history.has_smoking_hx    ? 1 : 0, medical_history.has_none          ? 1 : 0,
          medical_history.other_conditions  || null,
          medical_history.social_smoking    ? 1 : 0, medical_history.social_alcohol    ? 1 : 0,
          medical_history.general_survey    || null,
          staff_id,
        ]
      );
    }

    // Update female health (upsert)
    if (female_health && sex_name === 'Female') {
      await conn.query(
        `INSERT INTO patient_female_health
           (patient_id, no_of_children, lmp, period_duration_days, cycle_length_days,
            fp_method, menopausal_age, recorded_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           no_of_children=VALUES(no_of_children), lmp=VALUES(lmp),
           period_duration_days=VALUES(period_duration_days), cycle_length_days=VALUES(cycle_length_days),
           fp_method=VALUES(fp_method), menopausal_age=VALUES(menopausal_age),
           recorded_by_staff_id=VALUES(recorded_by_staff_id)`,
        [
          patient_id,
          female_health.no_of_children || null, female_health.lmp || null,
          female_health.period_duration_days || null, female_health.cycle_length_days || null,
          female_health.fp_method || null, female_health.menopausal_age || null,
          staff_id,
        ]
      );
    }

    await conn.commit();
    const p = patients[0];

    // ── Fire registration SMS for returning patient (async, non-blocking) ────
    if (send_sms) {
      getPatientPhone(patient_id)
        .then(phone => {
          if (!phone) return;
          const smsMsg = registrationMessage(p.first_name, queue_number);
          return sendSMS({ phone, message: smsMsg, patient_id, appointment_id });
        })
        .then(r => { if (r) console.log(`[SMS] Queue SMS to patient ${patient_id}: ${r.success ? 'SENT' : 'FAILED'}`); })
        .catch(err => console.error('[SMS] Queue SMS error:', err.message));
    }

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
         v.length_cm,
         v.head_circumference_cm,
         v.skinfold_thickness_cm,
         v.body_circumference_cm,
         v.waist_cm,
         v.hip_cm,
         v.limbs_cm,
         v.muac_cm,
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

