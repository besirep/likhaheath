/**
 * LikhaHealth — Shared SMS Helper
 *
 * Centralised Semaphore PH integration.
 * Used by: patientController, appointmentController, queueController, scheduledJobs
 */

const db = require('../config/db');

const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';
const SEMAPHORE_KEY = process.env.SEMAPHORE_API_KEY;
const SENDER_NAME   = process.env.SEMAPHORE_SENDER_NAME || 'LikhaHealth';

/**
 * Normalize a Philippine phone number to 09XXXXXXXXX format.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('9')  && digits.length === 10) return '0' + digits;
  if (digits.startsWith('09') && digits.length === 11) return digits;
  return null;
}

/**
 * Look up the primary phone number for a patient.
 */
async function getPatientPhone(patientId, conn) {
  const pool = conn || db;
  const [rows] = await pool.query(
    `SELECT value FROM contact_info
     WHERE patient_id = ? AND type = 'phone' AND is_primary = 1
     LIMIT 1`,
    [patientId]
  );
  return rows.length ? normalizePhone(rows[0].value) : null;
}

/**
 * Send an SMS via Semaphore and log to sms_notifications table.
 *
 * @param {Object} opts
 * @param {string}  opts.phone         - Raw phone number (will be normalised)
 * @param {string}  opts.message       - SMS body
 * @param {number}  opts.patient_id    - Patient FK
 * @param {number}  [opts.appointment_id] - Optional appointment FK
 * @param {Object}  [opts.conn]        - Optional DB connection (for use inside transactions)
 * @returns {Promise<{success:boolean, semaphore_id:string|null, id:number}>}
 */
async function sendSMS({ phone, message, patient_id, appointment_id, conn }) {
  const pool      = conn || db;
  const recipient = normalizePhone(phone);

  if (!recipient || !SEMAPHORE_KEY) {
    console.warn('[SMS] Skipped — no valid phone or API key.');
    return { success: false, semaphore_id: null, id: null };
  }

  let semaphoreId  = null;
  let smsStatus    = 'Failed';
  let errorMessage = null;

  try {
    const res = await fetch(SEMAPHORE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey:     SEMAPHORE_KEY,
        number:     recipient,
        message,
        sendername: SENDER_NAME,
      }),
    });

    const data = await res.json();

    if (res.ok && Array.isArray(data) && data[0]?.message_id) {
      semaphoreId = String(data[0].message_id);
      smsStatus   = 'Sent';
    } else {
      errorMessage = JSON.stringify(data);
      console.error('[SMS] Semaphore error:', errorMessage);
    }
  } catch (err) {
    errorMessage = err.message;
    console.error('[SMS] Fetch error:', err.message);
  }

  // Log to DB
  const [result] = await pool.query(
    `INSERT INTO sms_notifications
       (patient_id, appointment_id, message, recipient, status, semaphore_id, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patient_id, appointment_id || null, message, recipient, smsStatus, semaphoreId, errorMessage]
  );

  return { success: smsStatus === 'Sent', semaphore_id: semaphoreId, id: result.insertId };
}

// ── Pre-built message templates ─────────────────────────────────────────────

function registrationMessage(firstName, queueNumber) {
  const q = `Q-${String(queueNumber).padStart(3, '0')}`;
  return (
    `Good day, ${firstName}! You have been registered at LikhaHealth — ` +
    `Angono Municipal Health Center. Your queue number is ${q}. ` +
    `Please wait for your number to be called. Thank you and stay healthy!`
  );
}

function appointmentMessage(firstName, scheduledDate, queueNumber) {
  const d = new Date(scheduledDate);
  const dateStr = d.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
  const q = `Q-${String(queueNumber).padStart(3, '0')}`;
  return (
    `Good day, ${firstName}! Your appointment at LikhaHealth — ` +
    `Angono Municipal Health Center has been scheduled for ${dateStr} at ${timeStr}. ` +
    `Your queue number is ${q}. ` +
    `Please arrive 10 minutes early. Thank you!`
  );
}

function queueCalledMessage(firstName, queueNumber) {
  const q = `Q-${String(queueNumber).padStart(3, '0')}`;
  return (
    `Hi ${firstName}! It's your turn now. Your queue number ${q} ` +
    `has been called at LikhaHealth — Angono Municipal Health Center. ` +
    `Please proceed to the consultation room. Thank you!`
  );
}

function followUpMessage(firstName, scheduledDate) {
  const d = new Date(scheduledDate);
  const dateStr = d.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  return (
    `Good day, ${firstName}! This is a reminder for your follow-up consultation at LikhaHealth — ` +
    `Angono Municipal Health Center on ${dateStr}. ` +
    `Please proceed to the receptionist to get your queue number upon arrival. Thank you!`
  );
}

module.exports = {
  normalizePhone,
  getPatientPhone,
  sendSMS,
  registrationMessage,
  appointmentMessage,
  queueCalledMessage,
  followUpMessage,
};
