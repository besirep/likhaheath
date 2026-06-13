const db = require('../config/db');
const { sendSMS, normalizePhone, getPatientPhone } = require('../helpers/smsHelper');

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
    // Resolve phone number
    let recipient = normalizePhone(phone);
    if (!recipient) {
      recipient = await getPatientPhone(patient_id);
    }

    if (!recipient) {
      return res.status(422).json({
        error: 'No valid Philippine phone number found for this patient.',
      });
    }

    const result = await sendSMS({
      phone: recipient,
      message,
      patient_id,
      appointment_id,
    });

    if (!result.success) {
      return res.status(502).json({
        id:    result.id,
        error: 'SMS delivery failed. Check server logs.',
      });
    }

    res.status(201).json({
      id:           result.id,
      semaphore_id: result.semaphore_id,
      recipient,
      status:       'Sent',
      message:      'SMS sent successfully via Semaphore.',
    });
  } catch (err) {
    console.error('[SMS] Unexpected error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/sms/:id/resend
exports.resend = async (req, res) => {
  const smsId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM sms_notifications WHERE id = ?', [smsId]);
    if (!rows.length) return res.status(404).json({ error: 'SMS log not found' });
    const log = rows[0];

    // Try to resend using the existing parameters, passing sms_id to update the row
    const result = await sendSMS({
      phone: log.recipient,
      message: log.message,
      patient_id: log.patient_id,
      appointment_id: log.appointment_id,
      sms_id: smsId,
    });

    if (!result.success) {
      return res.status(502).json({
        id:    result.id,
        error: 'SMS delivery failed. Check server logs.',
      });
    }

    res.status(200).json({
      id:           result.id,
      semaphore_id: result.semaphore_id,
      recipient:    log.recipient,
      status:       'Sent',
      message:      'SMS resent successfully.',
    });
  } catch (err) {
    console.error('[SMS] Resend error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sms/history
exports.getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sn.id, sn.patient_id, sn.message, sn.recipient, sn.status,
         sn.semaphore_id, sn.error_message, sn.sent_at,
         CONCAT(p.last_name,', ',p.first_name) AS patient_name,
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
