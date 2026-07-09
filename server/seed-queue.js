const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'likhahealth'
  });

  try {
    let doctorId = 1;
    let staffId = 1;
    
    const dummyPatients = [
      { fname: 'Juan', lname: 'Dela Cruz', dob: '1980-05-15', sex: 1, civ: 1, reason: 'Fever and Cough for 3 days', status: 'Waiting' },
      { fname: 'Maria', lname: 'Santos', dob: '1992-10-20', sex: 2, civ: 1, reason: 'Routine Pregnancy Checkup', status: 'Waiting' },
      { fname: 'Pedro', lname: 'Penduko', dob: '1955-03-08', sex: 1, civ: 2, reason: 'High Blood Pressure maintenance', status: 'Waiting' },
      { fname: 'Elena', lname: 'Reyes', dob: '2015-07-12', sex: 2, civ: 1, reason: 'Stomach Pain and Nausea', status: 'Waiting' },
      { fname: 'Carlos', lname: 'Garcia', dob: '1988-12-01', sex: 1, civ: 1, reason: 'Follow-up Consultation (X-ray results)', status: 'Waiting' },
      { fname: 'Luisa', lname: 'Alvarez', dob: '2001-02-14', sex: 2, civ: 1, reason: 'Skin Rash on arms', status: 'Waiting' },
    ];

    console.log("Seeding patients...");

    for (const p of dummyPatients) {
      // Create Address
      const [addrRes] = await conn.query("INSERT INTO addresses (street, barangay, municipality, province, region) VALUES ('123 Rizal St', 'San Isidro', 'Angono', 'Rizal', 'Region IV-A')");
      const addrId = addrRes.insertId;

      // Create Patient
      const [patRes] = await conn.query(
        "INSERT INTO patients (first_name, last_name, date_of_birth, sex_id, civil_status_id, address_id, registered_by_staff_id, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
        [p.fname, p.lname, p.dob, p.sex, p.civ, addrId, staffId]
      );
      const patId = patRes.insertId;

      // Create Appointment
      // Get max queue number for today
      const [qMax] = await conn.query("SELECT COALESCE(MAX(queue_number), 0) AS max_q FROM appointments WHERE DATE(scheduled_date) = CURDATE()");
      const nextQ = (qMax[0].max_q || 0) + 1;

      const [apptRes] = await conn.query(
        "INSERT INTO appointments (patient_id, doctor_id, created_by_id, scheduled_date, queue_number, status, notes) VALUES (?, ?, ?, NOW(), ?, 'Scheduled', ?)",
        [patId, doctorId, staffId, nextQ, p.reason]
      );
      const apptId = apptRes.insertId;

      // Insert into Queue
      await conn.query(
        "INSERT INTO queue (appointment_id, queue_number, status) VALUES (?, ?, ?)",
        [apptId, nextQ, p.status]
      );

      console.log(`Added ${p.fname} ${p.lname} to queue #${nextQ} (${p.status})`);
    }

    console.log("Done seeding dummy patients!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await conn.end();
  }
}

seed();
