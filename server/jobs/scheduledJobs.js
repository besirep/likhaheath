/**
 * LikhaHealth — Scheduled Background Jobs
 *
 * 1. Data Retention (5-year policy)
 *    - Runs daily at 2:00 AM
 *    - Soft-deletes patient records older than 5 years (marks is_deleted = 1)
 *    - Archives related appointments & medical records
 *
 * 2. SMS Follow-Up Reminders
 *    - Runs daily at 8:00 AM
 *    - Sends SMS reminders for upcoming follow-up appointments:
 *      → 7 days before
 *      → 3 days before
 *      → 1 day before
 */

const cron = require('node-cron');
const db   = require('../config/db');

// ── SMS Helper (reuses Semaphore integration from smsController) ─────────────
const SEMAPHORE_URL  = 'https://api.semaphore.co/api/v4/messages';
const SEMAPHORE_KEY  = process.env.SEMAPHORE_API_KEY;
const SENDER_NAME    = process.env.SEMAPHORE_SENDER_NAME || 'LikhaHealth';

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return '0' + digits.slice(2);
  if (digits.startsWith('9')  && digits.length === 10) return '0' + digits;
  if (digits.startsWith('09') && digits.length === 11) return digits;
  return null;
}

async function sendSMS(phone, message, patientId, appointmentId) {
  const recipient = normalizePhone(phone);
  if (!recipient || !SEMAPHORE_KEY) return null;

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
    const success = res.ok && Array.isArray(data) && data[0]?.message_id;

    // Log to DB
    await db.query(
      `INSERT INTO sms_notifications
         (patient_id, appointment_id, message, recipient, status, semaphore_id, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        appointmentId || null,
        message,
        recipient,
        success ? 'Sent' : 'Failed',
        success ? String(data[0].message_id) : null,
        success ? null : JSON.stringify(data),
      ]
    );

    return success;
  } catch (err) {
    console.error('[SMS Job] Send error:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOB 1: DATA RETENTION — 5-Year Policy
// ═══════════════════════════════════════════════════════════════════════════════

async function runDataRetention() {
  const retentionYears = parseInt(process.env.DATA_RETENTION_YEARS) || 5;
  console.log(`[DataRetention] Starting ${retentionYears}-year retention check...`);

  try {
    // Soft-delete patients whose last activity is older than retention period
    const [result] = await db.query(`
      UPDATE patients p
      SET p.is_deleted = 1, p.updated_at = NOW()
      WHERE p.is_deleted = 0
        AND p.id NOT IN (
          SELECT DISTINCT a.patient_id
          FROM appointments a
          WHERE a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? YEAR)
        )
        AND p.created_at < DATE_SUB(CURDATE(), INTERVAL ? YEAR)
    `, [retentionYears, retentionYears]);

    if (result.affectedRows > 0) {
      console.log(`[DataRetention] Archived ${result.affectedRows} patient(s) older than 5 years.`);
    } else {
      console.log('[DataRetention] No records to archive.');
    }

    // Also mark old appointments as archived
    const [apptResult] = await db.query(`
      UPDATE appointments
      SET status = 'Cancelled'
      WHERE status = 'Scheduled'
        AND scheduled_date < DATE_SUB(CURDATE(), INTERVAL ? YEAR)
    `, [retentionYears]);

    if (apptResult.affectedRows > 0) {
      console.log(`[DataRetention] Cancelled ${apptResult.affectedRows} stale appointment(s).`);
    }

  } catch (err) {
    console.error('[DataRetention] Error:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOB 2: SMS FOLLOW-UP REMINDERS
// ═══════════════════════════════════════════════════════════════════════════════

async function runFollowUpReminders() {
  if (process.env.SMS_REMINDERS_ENABLED !== 'true') {
    console.log('[FollowUpReminder] SMS reminders disabled. Skipping.');
    return;
  }
  console.log('[FollowUpReminder] Checking for upcoming follow-up appointments...');

  try {
    // Find follow-up appointments at 7 days, 3 days, and 1 day from now
    // Only send to appointments that are still 'Scheduled' and have not been notified yet
    const intervals = [
      { days: 7, label: '1 week' },
      { days: 3, label: '3 days' },
      { days: 1, label: 'tomorrow' },
    ];

    for (const interval of intervals) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + interval.days);
      const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

      // Find scheduled appointments on the target date that haven't received this reminder
      const [appointments] = await db.query(`
        SELECT
          a.id AS appointment_id,
          a.patient_id,
          a.scheduled_date,
          a.queue_number,
          CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
          ci.value AS phone
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN contact_info ci
          ON ci.patient_id = p.id AND ci.type = 'phone' AND ci.is_primary = 1
        WHERE DATE(a.scheduled_date) = ?
          AND a.status = 'Scheduled'
          AND p.is_deleted = 0
          AND a.id NOT IN (
            SELECT sn.appointment_id
            FROM sms_notifications sn
            WHERE sn.appointment_id IS NOT NULL
              AND sn.status = 'Sent'
              AND sn.message LIKE ?
          )
      `, [dateStr, `%${interval.label}%`]);

      if (appointments.length === 0) {
        console.log(`[FollowUpReminder] No ${interval.label} reminders to send.`);
        continue;
      }

      console.log(`[FollowUpReminder] Sending ${appointments.length} reminder(s) for ${interval.label} (${dateStr})...`);

      for (const appt of appointments) {
        if (!appt.phone) {
          console.log(`[FollowUpReminder] Skipping ${appt.patient_name} — no phone number.`);
          continue;
        }

        const apptDate = new Date(appt.scheduled_date);
        const dateFormatted = apptDate.toLocaleDateString('en-PH', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });

        const message =
          `Good day, ${appt.patient_name}! This is a reminder from LikhaHealth — ` +
          `your follow-up appointment is ${interval.label} away (${dateFormatted}). ` +
          `Please visit the Angono Municipal Health Center. ` +
          `Your queue number is Q-${String(appt.queue_number).padStart(3, '0')}. ` +
          `Thank you and stay healthy!`;

        const sent = await sendSMS(appt.phone, message, appt.patient_id, appt.appointment_id);
        console.log(`[FollowUpReminder] ${appt.patient_name}: ${sent ? 'SENT' : 'FAILED'}`);
      }
    }
  } catch (err) {
    console.error('[FollowUpReminder] Error:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE CRON JOBS
// ═══════════════════════════════════════════════════════════════════════════════

function startScheduledJobs() {
  // ── Data Retention: every day at 2:00 AM ──────────────────────────────────
  cron.schedule('0 2 * * *', () => {
    runDataRetention();
  }, { timezone: 'Asia/Manila' });

  console.log('[Scheduler] ✓ Data retention job scheduled — daily at 2:00 AM (5-year policy)');

  // ── Follow-Up Reminders: every day at 8:00 AM ─────────────────────────────
  cron.schedule('0 8 * * *', () => {
    runFollowUpReminders();
  }, { timezone: 'Asia/Manila' });

  console.log('[Scheduler] ✓ Follow-up SMS reminder job scheduled — daily at 8:00 AM');
  console.log('[Scheduler]   → Reminders sent at: 7 days, 3 days, 1 day before appointment');
}

module.exports = { startScheduledJobs, runDataRetention, runFollowUpReminders };
