const db = require('../config/db');

/**
 * GET /api/reports
 * Returns aggregated weekly stats for the Reports screen.
 * Period is inferred from ?days=7 (default) or ?days=30 for monthly.
 */
exports.getWeekly = async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  try {
    // Daily queue summary for the last `days` days
    const [dailyQueue] = await db.query(
      `SELECT
         DATE(a.scheduled_date)                                AS day,
         COUNT(a.id)                                           AS total,
         SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN q.status  = 'Skipped'  THEN 1 ELSE 0 END) AS skipped
       FROM appointments a
       LEFT JOIN queue q ON q.appointment_id = a.id
       WHERE a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(a.scheduled_date)
       ORDER BY day ASC`,
      [days - 1]
    );

    // Hourly flow for today
    const [hourlyFlow] = await db.query(
      `SELECT
         HOUR(a.scheduled_date) AS hour,
         COUNT(a.id)            AS patients
       FROM appointments a
       WHERE DATE(a.scheduled_date) = CURDATE()
       GROUP BY HOUR(a.scheduled_date)
       ORDER BY hour ASC`
    );

    // Priority breakdown today
    const [priorityRows] = await db.query(
      `SELECT
         COALESCE(a.notes, 'regular') AS priority,
         COUNT(a.id)                  AS value
       FROM appointments a
       WHERE DATE(a.scheduled_date) = CURDATE()
       GROUP BY priority`
    );

    // Top visit reasons (today)
    const [reasonRows] = await db.query(
      `SELECT
         a.notes                   AS reason,
         COUNT(a.id)               AS cnt
       FROM appointments a
       WHERE DATE(a.scheduled_date) = CURDATE()
         AND a.notes IS NOT NULL AND a.notes != ''
       GROUP BY a.notes
       ORDER BY cnt DESC
       LIMIT 5`
    );

    // Doctor workload today
    const [doctorRows] = await db.query(
      `SELECT
         CONCAT(s.first_name,' ',s.last_name) AS doctor,
         COUNT(a.id)                          AS patients
       FROM appointments a
       JOIN staff s ON s.id = a.doctor_id
       WHERE DATE(a.scheduled_date) = CURDATE()
         AND a.doctor_id IS NOT NULL
       GROUP BY a.doctor_id
       ORDER BY patients DESC`
    );

    // SMS delivery weekly
    const [smsRows] = await db.query(
      `SELECT
         DATE(n.sent_at) AS day,
         SUM(CASE WHEN n.status = 'Sent'   THEN 1 ELSE 0 END) AS sent,
         SUM(CASE WHEN n.status = 'Failed' THEN 1 ELSE 0 END) AS failed
       FROM sms_notifications n
       WHERE n.sent_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(n.sent_at)
       ORDER BY day ASC`,
      [days - 1]
    );

    // Avg wait time per day (minutes from queue creation to status In-Progress)
    const [waitRows] = await db.query(
      `SELECT
         DATE(a.scheduled_date) AS day,
         ROUND(AVG(
           TIMESTAMPDIFF(MINUTE, a.scheduled_date, COALESCE(a.updated_at, NOW()))
         )) AS avg_wait
       FROM appointments a
       JOIN queue q ON q.appointment_id = a.id
       WHERE a.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND a.status = 'Completed'
       GROUP BY DATE(a.scheduled_date)
       ORDER BY day ASC`,
      [days - 1]
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
