const db = require('../config/db');

const SEMAPHORE_URL  = 'https://api.semaphore.co/api/v4/messages';
const SEMAPHORE_KEY  = process.env.SEMAPHORE_API_KEY;
const SENDER_NAME    = process.env.SEMAPHORE_SENDER_NAME || 'LikhaHealth';

/**
 * Normalize a Philippine phone number to the 09XXXXXXXXX format
 * that Semaphore expects (it auto-converts to +63).
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('9')  && digits.length === 10) return '0' + digits;
  if (digits.startsWith('09') && digits.length === 11) return digits;
  return null; // unrecognizable format
}

/**
 * Send a real SMS via Semaphore and log the result to the DB.
 * POST /api/sms/send
 * Body: { patient_id, appointment_id?, message, phone? }
 *   - phone: optional override; if omitted we look up the patient's primary phone
 */
exports.send = async (req, res) => {
  const { patient_id, appointment_id, message, phone } = req.body;
  if (!patient_id || !message)
    return res.status(400).json({ error: 'patient_id and message are required.' });

  try {
    // ── 1. Resolve phone number ────────────────────────────────────────────────
    let recipient = normalizePhone(phone);
    if (!recipient) {
      const [rows] = await db.query(
        `SELECT value FROM contact_info
         WHERE patient_id = ? AND type = 'phone' AND is_primary = 1
         LIMIT 1`,
        [patient_id]
      );
      if (rows.length) recipient = normalizePhone(rows[0].value);
    }

    if (!recipient) {
      return res.status(422).json({
        error: 'No valid Philippine phone number found for this patient.',
      });
    }

    // ── 2. Call Semaphore API ──────────────────────────────────────────────────
    let semaphoreId   = null;
    let smsStatus     = 'Failed';
    let errorMessage  = null;

    const semRes = await fetch(SEMAPHORE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey:      SEMAPHORE_KEY,
        number:      recipient,
        message,
        sendername:  SENDER_NAME,
      }),
    });

    const semData = await semRes.json();

    if (semRes.ok && Array.isArray(semData) && semData[0]?.message_id) {
      semaphoreId = String(semData[0].message_id);
      smsStatus   = 'Sent';
    } else {
      // Semaphore returns error details in the response body
      errorMessage = JSON.stringify(semData);
      console.error('[SMS] Semaphore error:', errorMessage);
    }

    // ── 3. Log to DB ───────────────────────────────────────────────────────────
    const [result] = await db.query(
      `INSERT INTO sms_notifications
         (patient_id, appointment_id, message, recipient, status, semaphore_id, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, appointment_id || null, message, recipient, smsStatus, semaphoreId, errorMessage]
    );

    if (smsStatus === 'Failed') {
      return res.status(502).json({
        id:    result.insertId,
        error: 'SMS delivery failed. Check server logs.',
        details: errorMessage,
      });
    }

    res.status(201).json({
      id:           result.insertId,
      semaphore_id: semaphoreId,
      recipient,
      status:       smsStatus,
      message:      'SMS sent successfully via Semaphore.',
    });
  } catch (err) {
    console.error('[SMS] Unexpected error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sms/history
exports.getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sn.id, sn.message, sn.recipient, sn.status,
         sn.semaphore_id, sn.error_message, sn.sent_at,
         CONCAT(p.first_name,' ',p.last_name) AS patient_name,
         ci.value AS contact_number
       FROM sms_notifications sn
       JOIN patients     p  ON sn.patient_id = p.id
       LEFT JOIN contact_info ci
              ON p.id = ci.patient_id AND ci.type='phone' AND ci.is_primary=1
       ORDER BY sn.sent_at DESC
       LIMIT 200`
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
      `SELECT * FROM sms_notifications
       WHERE patient_id = ?
       ORDER BY sent_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
