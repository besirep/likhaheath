const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function resolveOrInsertAddress({ street, barangay, municipality, province, region, zip_code }, conn) {
  const [existing] = await conn.query(
    `SELECT id FROM addresses WHERE barangay = ? AND municipality = ? AND province = ? LIMIT 1`,
    [barangay, municipality, province]
  );
  if (existing.length) return existing[0].id;
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
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM patients WHERE DATE(created_at) = ?`,
    [today]
  );
  return (rows[0].cnt || 0) + 1;
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
       LEFT JOIN sex_options   sx ON p.sex_id           = sx.id
       LEFT JOIN civil_statuses cs ON p.civil_status_id  = cs.id
       LEFT JOIN blood_types   bt ON p.blood_type_id     = bt.id
       LEFT JOIN addresses      a ON p.address_id         = a.id
       LEFT JOIN contact_info  ci ON p.id = ci.patient_id AND ci.is_primary = 1 AND ci.type = 'phone'
       WHERE p.is_deleted = 0
         AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.philhealth_no LIKE ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM patients WHERE is_deleted = 0
         AND (first_name LIKE ? OR last_name LIKE ? OR philhealth_no LIKE ?)`,
      [like, like, like]
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
    const address_id      = await resolveOrInsertAddress(address, conn);

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

    const queue_number = await getNextQueueNumber(conn);
    await conn.commit();

    res.status(201).json({ patient_id, queue_number, message: 'Patient registered successfully.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
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
    const address_id      = address.barangay ? await resolveOrInsertAddress(address, conn) : undefined;

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
    res.status(500).json({ error: err.message });
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
