const mysql = require('mysql2/promise');

async function seedHistory() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'likhaheath',
  });

  try {
    const [patients] = await connection.query('SELECT id, sex_id FROM patients');
    console.log(`Found ${patients.length} patients.`);

    for (const patient of patients) {
      // Generate some random history
      const has_hypertension = Math.random() > 0.7 ? 1 : 0;
      const has_diabetes = Math.random() > 0.8 ? 1 : 0;
      const has_asthma = Math.random() > 0.8 ? 1 : 0;
      const has_allergies = Math.random() > 0.6 ? 1 : 0;
      
      const has_none = (!has_hypertension && !has_diabetes && !has_asthma && !has_allergies) ? 1 : 0;
      
      const other_conditions = Math.random() > 0.9 ? 'Occasional migraines' : null;
      
      const social_smoking = Math.random() > 0.7 ? 1 : 0;
      const social_alcohol = Math.random() > 0.6 ? 1 : 0;
      const general_survey = 'awake_alert';

      // Insert or Update patient_medical_history
      await connection.query(`
        INSERT INTO patient_medical_history 
          (patient_id, has_hypertension, has_diabetes, has_asthma, has_allergies, has_none, other_conditions, social_smoking, social_alcohol, general_survey)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          has_hypertension=VALUES(has_hypertension),
          has_diabetes=VALUES(has_diabetes),
          has_asthma=VALUES(has_asthma),
          has_allergies=VALUES(has_allergies),
          has_none=VALUES(has_none),
          other_conditions=VALUES(other_conditions),
          social_smoking=VALUES(social_smoking),
          social_alcohol=VALUES(social_alcohol),
          general_survey=VALUES(general_survey)
      `, [patient.id, has_hypertension, has_diabetes, has_asthma, has_allergies, has_none, other_conditions, social_smoking, social_alcohol, general_survey]);

      // If female, maybe add some female health records
      if (patient.sex_id === 2) {
        const no_of_children = Math.floor(Math.random() * 4); // 0 to 3
        const lmp = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const fp_method = Math.random() > 0.5 ? 'Pills' : 'None';

        await connection.query(`
          INSERT INTO patient_female_health 
            (patient_id, no_of_children, lmp, fp_method)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            no_of_children=VALUES(no_of_children),
            lmp=VALUES(lmp),
            fp_method=VALUES(fp_method)
        `, [patient.id, no_of_children, lmp, fp_method]);
      }
    }
    
    console.log('Successfully seeded medical history for all patients.');
  } catch (error) {
    console.error('Error seeding history:', error);
  } finally {
    await connection.end();
  }
}

seedHistory();
