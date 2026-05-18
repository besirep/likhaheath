const db = require('../config/db');

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const [[{ total_patients }]]    = await db.query('SELECT COUNT(*) AS total_patients FROM patients WHERE is_deleted=0');
    const [[{ today_appointments }]] = await db.query(`SELECT COUNT(*) AS today_appointments FROM appointments WHERE DATE(scheduled_date)=CURDATE()`);
    const [[{ waiting_queue }]]     = await db.query(`SELECT COUNT(*) AS waiting_queue FROM queue q JOIN appointments a ON q.appointment_id=a.id WHERE q.status='Waiting' AND DATE(a.scheduled_date)=CURDATE()`);
    const [[{ total_doctors }]]     = await db.query('SELECT COUNT(*) AS total_doctors FROM staff WHERE is_active=1 AND position="Doctor"');
    const [[{ total_staff }]]       = await db.query('SELECT COUNT(*) AS total_staff FROM staff WHERE is_active=1');
    const [[{ records_today }]]     = await db.query(`SELECT COUNT(*) AS records_today FROM medical_records WHERE DATE(record_date)=CURDATE()`);
    const [expiring]                = await db.query(`SELECT id, first_name, last_name, prc_expiry_date, position AS type FROM staff WHERE prc_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)`);

    res.json({
      total_patients,
      today_appointments,
      waiting_queue,
      total_doctors,
      total_staff,
      records_today,
      expiring_licenses: expiring,
    });
  } catch (err) {
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
