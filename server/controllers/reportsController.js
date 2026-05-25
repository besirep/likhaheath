const db = require('../config/db');

/**
 * GET /api/reports?days=1|7|30
 * Returns aggregated stats for the Reports screen.
 * days=1 → today, days=7 → week, days=30 → month
 */
exports.getWeekly = async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;

  // Build appropriate date filter
  const dateFilter = days <= 1
    ? 'DATE(a.scheduled_date) = CURDATE()'
    : `a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

  const smsDateFilter = days <= 1
    ? 'DATE(n.sent_at) = CURDATE()'
    : `n.sent_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

  try {
    // Daily queue summary for the period
    const [dailyQueue] = await db.query(
      `SELECT
         DATE(a.scheduled_date)                                AS day,
         COUNT(a.id)                                           AS total,
         SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN q.status  = 'Skipped'  THEN 1 ELSE 0 END) AS skipped
       FROM appointments a
       LEFT JOIN queue q ON q.appointment_id = a.id
       WHERE ${dateFilter}
       GROUP BY DATE(a.scheduled_date)
       ORDER BY day ASC`
    );

    // Hourly flow for the period
    const [hourlyFlow] = await db.query(
      `SELECT
         HOUR(a.scheduled_date) AS hour,
         COUNT(a.id)            AS patients
       FROM appointments a
       WHERE ${dateFilter}
       GROUP BY HOUR(a.scheduled_date)
       ORDER BY hour ASC`
    );

    // Priority breakdown for the period
    const [priorityRows] = await db.query(
      `SELECT
         COALESCE(svc.service_name, 'regular') AS priority,
         COUNT(DISTINCT a.id) AS value
       FROM appointments a
       LEFT JOIN appointment_services svc
         ON a.id = svc.appointment_id
         AND svc.service_name IN ('elderly','pregnant','pwd','pediatric','solo_parent')
       WHERE ${dateFilter}
       GROUP BY priority`
    );

    // Top visit reasons for the period
    const [reasonRows] = await db.query(
      `SELECT
         a.notes                   AS reason,
         COUNT(a.id)               AS cnt
       FROM appointments a
       WHERE ${dateFilter}
         AND a.notes IS NOT NULL AND a.notes != ''
       GROUP BY a.notes
       ORDER BY cnt DESC
       LIMIT 5`
    );

    // Doctor workload for the period
    const [doctorRows] = await db.query(
      `SELECT
         CONCAT(s.first_name,' ',s.last_name) AS doctor,
         COUNT(a.id)                          AS patients
       FROM appointments a
       JOIN staff s ON s.id = a.doctor_id
       WHERE ${dateFilter}
         AND a.doctor_id IS NOT NULL
       GROUP BY a.doctor_id
       ORDER BY patients DESC`
    );

    // SMS delivery for the period
    const [smsRows] = await db.query(
      `SELECT
         DATE(n.sent_at) AS day,
         SUM(CASE WHEN n.status = 'Sent'   THEN 1 ELSE 0 END) AS sent,
         SUM(CASE WHEN n.status = 'Failed' THEN 1 ELSE 0 END) AS failed
       FROM sms_notifications n
       WHERE ${smsDateFilter}
       GROUP BY DATE(n.sent_at)
       ORDER BY day ASC`
    );

    // Avg wait time per day
    const [waitRows] = await db.query(
      `SELECT
         DATE(a.scheduled_date) AS day,
         ROUND(AVG(
           TIMESTAMPDIFF(MINUTE, q.created_at, q.updated_at)
         )) AS avg_wait
       FROM appointments a
       JOIN queue q ON q.appointment_id = a.id
       WHERE ${dateFilter}
         AND q.status = 'Done'
       GROUP BY DATE(a.scheduled_date)
       ORDER BY day ASC`
    );

    res.json({
      dailyQueue,
      hourlyFlow,
      priorityBreakdown: priorityRows,
      topReasons: reasonRows,
      doctorLoad: doctorRows,
      smsWeekly: smsRows,
      waitTimeWeek: waitRows,
    });
  } catch (err) {
    console.error('[reportsController.getWeekly]', err);
    res.status(500).json({ error: err.message });
  }
};
