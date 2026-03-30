const db = require('../config/db');

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const [[{ total_patients }]]    = await db.query('SELECT COUNT(*) AS total_patients FROM patients WHERE is_deleted=0');
    const [[{ today_appointments }]] = await db.query(`SELECT COUNT(*) AS today_appointments FROM appointments WHERE DATE(scheduled_date)=CURDATE()`);
    const [[{ waiting_queue }]]     = await db.query(`SELECT COUNT(*) AS waiting_queue FROM queue q JOIN appointments a ON q.appointment_id=a.id WHERE q.status='Waiting' AND DATE(a.scheduled_date)=CURDATE()`);
    const [[{ total_doctors }]]     = await db.query('SELECT COUNT(*) AS total_doctors FROM doctors WHERE is_active=1');
    const [[{ total_staff }]]       = await db.query('SELECT COUNT(*) AS total_staff FROM medical_staff WHERE is_active=1');
    const [[{ records_today }]]     = await db.query(`SELECT COUNT(*) AS records_today FROM medical_records WHERE DATE(record_date)=CURDATE()`);
    const [expiring]                = await db.query(`SELECT id, first_name, last_name, prc_expiry_date, 'doctor' AS type FROM doctors WHERE prc_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY) UNION SELECT id, first_name, last_name, prc_expiry_date, 'staff' AS type FROM medical_staff WHERE prc_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)`);

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
      `SELECT id, first_name, last_name, gender, contact_number, created_at FROM patients WHERE is_deleted=0 ORDER BY created_at DESC LIMIT 5`
    );
    const [recent_records] = await db.query(
      `SELECT mr.id, mr.diagnosis, mr.record_date, CONCAT(p.first_name,' ',p.last_name) AS patient_name, CONCAT(d.first_name,' ',d.last_name) AS doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id=p.id
       LEFT JOIN doctors d ON mr.doctor_id=d.id
       ORDER BY mr.created_at DESC LIMIT 5`
    );
    res.json({ recent_patients, recent_records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
