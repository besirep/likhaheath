const db = require('../config/db');

/**
 * GET /api/dashboard/stats?period=today|week|month
 * Returns aggregated stats for the requested time frame.
 */
exports.getStats = async (req, res) => {
  const period = req.query.period || 'today';

  // Build date filter based on period
  let dateFilter;
  switch (period) {
    case 'week':
      dateFilter = 'a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      break;
    case 'month':
      dateFilter = 'a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      break;
    case 'today':
    default:
      dateFilter = 'DATE(a.scheduled_date) = CURDATE()';
      break;
  }

  try {
    // Total registered patients (always overall — not time-filtered)
    const [[{ total_patients }]] = await db.query(
      'SELECT COUNT(*) AS total_patients FROM patients WHERE is_deleted=0'
    );

    // Appointments in the period
    const [[{ period_appointments }]] = await db.query(
      `SELECT COUNT(*) AS period_appointments FROM appointments a WHERE ${dateFilter}`
    );

    // Completed in the period
    const [[{ completed_appointments }]] = await db.query(
      `SELECT COUNT(*) AS completed_appointments FROM appointments a
       WHERE ${dateFilter} AND a.status = 'Completed'`
    );

    // Waiting in queue (today only — real-time metric)
    const [[{ waiting_queue }]] = await db.query(
      `SELECT COUNT(*) AS waiting_queue
       FROM queue q JOIN appointments a ON q.appointment_id = a.id
       WHERE q.status = 'Waiting' AND DATE(a.scheduled_date) = CURDATE()`
    );

    // In-Progress (today only — real-time metric)
    const [[{ in_progress }]] = await db.query(
      `SELECT COUNT(*) AS in_progress
       FROM queue q JOIN appointments a ON q.appointment_id = a.id
       WHERE q.status = 'In-Progress' AND DATE(a.scheduled_date) = CURDATE()`
    );

    // Done today (real-time metric)
    const [[{ done_today }]] = await db.query(
      `SELECT COUNT(*) AS done_today
       FROM queue q JOIN appointments a ON q.appointment_id = a.id
       WHERE q.status = 'Done' AND DATE(a.scheduled_date) = CURDATE()`
    );

    // Skipped in period
    const [[{ skipped }]] = await db.query(
      `SELECT COUNT(*) AS skipped
       FROM queue q JOIN appointments a ON q.appointment_id = a.id
       WHERE q.status = 'Skipped' AND ${dateFilter}`
    );

    // New patients registered in period
    const [[{ new_patients }]] = await db.query(
      `SELECT COUNT(*) AS new_patients FROM patients
       WHERE is_deleted = 0 AND ${dateFilter.replace(/a\./g, '').replace('scheduled_date', 'created_at')}`
    );

    // Medical records created in period
    const [[{ records_count }]] = await db.query(
      `SELECT COUNT(*) AS records_count FROM medical_records mr
       JOIN appointments a ON mr.appointment_id = a.id
       WHERE ${dateFilter}`
    );

    // Total doctors
    const [[{ total_doctors }]] = await db.query(
      'SELECT COUNT(*) AS total_doctors FROM staff WHERE is_active=1 AND position="Doctor"'
    );
    const [[{ total_staff }]] = await db.query(
      'SELECT COUNT(*) AS total_staff FROM staff WHERE is_active=1'
    );

    // SMS sent in period
    let smsDateFilter;
    switch (period) {
      case 'week':  smsDateFilter = 'n.sent_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'; break;
      case 'month': smsDateFilter = 'n.sent_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'; break;
      default:      smsDateFilter = 'DATE(n.sent_at) = CURDATE()'; break;
    }
    const [[{ sms_sent }]] = await db.query(
      `SELECT COUNT(*) AS sms_sent FROM sms_notifications n WHERE n.status = 'Sent' AND ${smsDateFilter}`
    );
    const [[{ sms_failed }]] = await db.query(
      `SELECT COUNT(*) AS sms_failed FROM sms_notifications n WHERE n.status = 'Failed' AND ${smsDateFilter}`
    );

    // Avg wait time in period (minutes)
    const [[{ avg_wait }]] = await db.query(
      `SELECT COALESCE(ROUND(AVG(
         TIMESTAMPDIFF(MINUTE, q.created_at, q.updated_at)
       )), 0) AS avg_wait
       FROM queue q
       JOIN appointments a ON q.appointment_id = a.id
       WHERE q.status = 'Done' AND ${dateFilter}`
    );

    // Expiring PRC licenses (within 30 days)
    const [expiring] = await db.query(
      `SELECT id, first_name, last_name, prc_expiry_date, position AS type
       FROM staff
       WHERE prc_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );

    res.json({
      period,
      total_patients,
      period_appointments,
      completed_appointments,
      waiting_queue,
      in_progress,
      done_today,
      skipped,
      new_patients,
      records_count,
      total_doctors,
      total_staff,
      sms_sent,
      sms_failed,
      avg_wait,
      expiring_licenses: expiring,
    });
  } catch (err) {
    console.error('[Dashboard] getStats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/recent
exports.getRecent = async (req, res) => {
  try {
    const [recent_patients] = await db.query(
      `SELECT p.id, p.first_name, p.last_name, s.label AS gender, ci.value AS contact_number, p.created_at
       FROM patients p
       LEFT JOIN sex_options s ON p.sex_id = s.id
       LEFT JOIN contact_info ci ON p.id = ci.patient_id AND ci.type = 'phone' AND ci.is_primary = 1
       WHERE p.is_deleted=0 ORDER BY p.created_at DESC LIMIT 5`
    );
    const [recent_records] = await db.query(
      `SELECT mr.id, mr.diagnosis, mr.record_date, CONCAT(p.first_name,' ',p.last_name) AS patient_name, CONCAT(d.first_name,' ',d.last_name) AS doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id=p.id
       LEFT JOIN staff d ON mr.doctor_id=d.id
       ORDER BY mr.created_at DESC LIMIT 5`
    );
    res.json({ recent_patients, recent_records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
