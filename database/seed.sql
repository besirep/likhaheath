-- ============================================================
-- LikhaHealth — Phase 1 Normalized Seed Data
-- Angono Municipal Health Center
-- Run AFTER schema.sql
-- ============================================================
USE likhaheath;

-- ─── 1. LOOKUP DATA ─────────────────────────────────────────

INSERT INTO blood_types (code) VALUES
  ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

INSERT INTO civil_statuses (label) VALUES
  ('Single'), ('Married'), ('Widowed'), ('Separated'), ('Annulled');

INSERT INTO sex_options (label) VALUES
  ('Male'), ('Female'), ('Other');

-- ─── 2. HEALTH CENTERS ──────────────────────────────────────

INSERT INTO health_centers (id, name, municipality, province, contact_number) VALUES
  (1, 'Angono Municipal Health Center', 'Angono', 'Rizal', '02-8650-1234');

-- ─── 3. STAFF ────────────────────────────────────────────────
-- Unified staff table — no separate doctors/medical_staff tables
-- prc_license_number / prc_expiry_date are NULL for BHWs (non-licensed)

INSERT INTO staff (id, health_center_id, first_name, last_name, suffix, position, prc_license_number, prc_expiry_date, employment_status, is_active) VALUES
  -- Admin / MHO
  (1,  1, 'Ricardo', 'Mendoza',    NULL, 'Municipal Health Officer', 'PRC-MED-00112', '2027-06-30', 'Regular',     1),
  -- Doctors
  (2,  1, 'Ramon',   'Dela Cruz',  NULL, 'Doctor',                   'PRC-MED-00123', '2026-06-30', 'Regular',     1),
  (3,  1, 'Maria',   'Santos',     NULL, 'Doctor',                   'PRC-MED-00456', '2025-12-31', 'Regular',     1),
  (4,  1, 'Jose',    'Reyes',      NULL, 'Doctor',                   'PRC-MED-00789', '2027-03-01', 'Contractual', 1),
  -- Nurses
  (5,  1, 'Ana',     'Bautista',   NULL, 'Nurse',                    'PRC-RN-11223',  '2026-01-15', 'Regular',     1),
  (6,  1, 'Cynthia', 'Flores',     NULL, 'Nurse',                    'PRC-RN-77889',  '2027-05-01', 'Contractual', 1),
  -- Midwives
  (7,  1, 'Luisa',   'Garcia',     NULL, 'Midwife',                  'PRC-RM-44556',  '2025-11-30', 'Regular',     1),
  (8,  1, 'Maribel', 'Torres',     NULL, 'Midwife',                  'PRC-RM-00112',  '2026-08-20', 'Regular',     1),
  -- BHWs (no PRC license)
  (9,  1, 'Pedro',   'Cruz',       NULL, 'BHW',                      NULL,            NULL,         'Volunteer',   1),
  (10, 1, 'Gloria',  'Villanueva', NULL, 'BHW',                      NULL,            NULL,         'Volunteer',   1);

-- ─── 4. USERS (Login Accounts) ───────────────────────────────
-- Default password for ALL accounts: LikhaHealth2025!
-- bcrypt hash (cost 12) pre-generated for 'LikhaHealth2025!'
-- Verify: bcrypt.compare('LikhaHealth2025!', hash) → true

INSERT INTO users (id, staff_id, username, password_hash, role, is_active) VALUES
  -- Admin (MHO)
  (1,  1,  'admin',             '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Admin',   1),
  -- Doctors
  (2,  2,  'ramon.delacruz',    '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Doctor',  1),
  (3,  3,  'maria.santos',      '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Doctor',  1),
  (4,  4,  'jose.reyes',        '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Doctor',  1),
  -- Nurses
  (5,  5,  'ana.bautista',      '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Nurse',   1),
  (6,  6,  'cynthia.flores',    '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Nurse',   1),
  -- Midwives
  (7,  7,  'luisa.garcia',      '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Midwife', 1),
  (8,  8,  'maribel.torres',    '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'Midwife', 1),
  -- BHWs
  (9,  9,  'pedro.cruz',        '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'BHW',     1),
  (10, 10, 'gloria.villanueva', '$2b$12$hJNFX.6jaagU2/zQv03DVOTp7.0g.7SCifR/LoRoei761m8vmCZw6', 'BHW',     1);

-- ─── 5. ADDRESSES ────────────────────────────────────────────
-- Extracted from patients.address TEXT — normalized to structured rows

INSERT INTO addresses (id, street, barangay, municipality, province) VALUES
  (1,  'Purok 3',         'San Isidro',   'Angono', 'Rizal'),
  (2,  'Sitio Mabolo',    'San Pedro',    'Angono', 'Rizal'),
  (3,  'Blk 5 Lot 3',    'Kalayaan',     'Angono', 'Rizal'),
  (4,  'Zone 2',          'San Roque',    'Angono', 'Rizal'),
  (5,  'Purok 7',         'Poblacion',    'Angono', 'Rizal'),
  (6,  'Sitio Damayan',   'Santo Niño',   'Angono', 'Rizal'),
  (7,  'Phase 1',         'Bagong Nayon', 'Angono', 'Rizal'),
  (8,  'Purok 5',         'San Isidro',   'Angono', 'Rizal'),
  (9,  'Zone 4',          'San Pedro',    'Angono', 'Rizal'),
  (10, 'Phase 2',         'Kalayaan',     'Angono', 'Rizal'),
  (11, 'Blk 8 Lot 2',    'San Roque',    'Angono', 'Rizal'),
  (12, 'Zone 6',          'Poblacion',    'Angono', 'Rizal'),
  (13, 'Purok 1',         'Bagong Nayon', 'Angono', 'Rizal'),
  (14, 'Zone 1',          'Santo Niño',   'Angono', 'Rizal'),
  (15, 'Sitio San Pedro', 'San Isidro',   'Angono', 'Rizal');

-- ─── 6. FAMILY CLUSTERS ──────────────────────────────────────
-- head_patient_id is NULL here; set after patients are inserted (see step 8)

INSERT INTO family_clusters (id, label, head_patient_id, health_center_id, created_by_staff_id, notes) VALUES
  (1, 'Dela Cruz Family', NULL, 1, 5, 'Barangay San Isidro household'),
  (2, 'Santos Family',    NULL, 1, 7, 'Prenatal follow-up cluster'),
  (3, 'Reyes Family',     NULL, 1, 5, ''),
  (4, 'Baluyot Family',   NULL, 1, 7, 'Elderly senior cluster');

-- ─── 7. PATIENTS ─────────────────────────────────────────────
-- sex_id:          1=Male, 2=Female, 3=Other
-- civil_status_id: 1=Single, 2=Married, 3=Widowed, 4=Separated, 5=Annulled
-- blood_type_id:   1=A+, 2=A-, 3=B+, 4=B-, 5=AB+, 6=AB-, 7=O+, 8=O-

INSERT INTO patients
  (id, first_name, last_name, suffix, date_of_birth, sex_id, civil_status_id,
   blood_type_id, nationality, occupation, philhealth_no, emergency_contact,
   address_id, family_cluster_id, assigned_staff_id, registered_by_staff_id)
VALUES
  -- Dela Cruz family (cluster 1, address 1, BHW=9, reg'd by nurse 5)
  (1,  'Juan',     'Dela Cruz',  NULL,  '1990-03-15', 1, 1, 7, 'Filipino', 'Tricycle Driver',   'PH-001001001', 'Maria Dela Cruz – 09171002002',  1, 1,    9, 5),
  (2,  'Maria',    'Dela Cruz',  NULL,  '1992-07-22', 2, 2, 1, 'Filipino', 'Housewife',         'PH-001001002', 'Juan Dela Cruz – 09171001001',   1, 1,    9, 5),
  (3,  'Jose',     'Dela Cruz',  NULL,  '2015-01-10', 1, 1, 3, 'Filipino', 'Student',           NULL,           'Maria Dela Cruz – 09171001001',  1, 1,    9, 5),

  -- Santos family (cluster 2, address 2, BHW=10, reg'd by midwife 7)
  (4,  'Rosa',     'Santos',     NULL,  '1978-11-05', 2, 2, 4, 'Filipino', 'Teacher',           'PH-004004004', 'Carlo Santos – 09281002003',     2, 2,    10, 7),
  (5,  'Carlo',    'Santos',     NULL,  '1975-06-18', 1, 2, 7, 'Filipino', 'Carpenter',         'PH-004004005', 'Rosa Santos – 09281001002',      2, 2,    10, 7),
  (6,  'Nena',     'Santos',     NULL,  '2005-09-30', 2, 1, 2, 'Filipino', 'Student',           NULL,           'Rosa Santos – 09281001002',      2, 2,    10, 7),

  -- Reyes family (cluster 3, address 3, BHW=9, reg'd by nurse 5)
  (7,  'Pedro',    'Reyes',      NULL,  '1980-02-14', 1, 2, 3, 'Filipino', 'Farmer',            'PH-007007007', 'Lina Reyes – 09391002004',       3, 3,    9, 5),
  (8,  'Lina',     'Reyes',      NULL,  '1983-04-20', 2, 2, 2, 'Filipino', 'Market Vendor',     'PH-007007008', 'Pedro Reyes – 09391001003',      3, 3,    9, 5),

  -- Baluyot family — senior cluster (cluster 4, address 5, BHW=10, reg'd by midwife 7)
  (9,  'Esteban',  'Baluyot',    'Sr.', '1948-03-17', 1, 2, 1, 'Filipino', 'Retired',           'PH-009009009', 'Jun Baluyot Jr. – 09611002013',  5, 4,    10, 7),
  (10, 'Cora',     'Baluyot',    NULL,  '1950-12-25', 2, 2, 7, 'Filipino', 'Housewife',         'PH-009009010', 'Jun Baluyot Jr. – 09611002013',  5, 4,    10, 7),

  -- Unaffiliated patients (no cluster, no assigned staff)
  (11, 'Fernando', 'Padilla',    NULL,  '1960-05-05', 1, 4, 7, 'Filipino', 'Watchman',          'PH-011011011', 'Tess Padilla – 09501002012',     6, NULL, NULL, 5),
  (12, 'Patricia', 'Hernandez',  NULL,  '2003-06-03', 2, 1, 3, 'Filipino', 'Student',           NULL,           'Vic Hernandez – 09281002017',    7, NULL, NULL, 5),
  (13, 'Eduardo',  'Torres',     NULL,  '1970-06-25', 1, 2, 6, 'Filipino', 'Electrician',       'PH-013013013', 'Cora Torres – 09831002008',      8, NULL, NULL, 7),
  (14, 'Liza',     'Vargas',     NULL,  '1988-02-14', 2, 3, 7, 'Filipino', 'Saleslady',         'PH-014014014', 'Bert Vargas – 09171002009',      9, NULL, NULL, 7),
  (15, 'Rodrigo',  'Mendoza',    NULL,  '1992-12-01', 1, 1, 1, 'Filipino', 'Security Guard',    NULL,           'Ella Mendoza – 09281002010',    10, NULL, NULL, 5),
  (16, 'Carla',    'Navarro',    NULL,  '2010-08-19', 2, 1, 8, 'Filipino', 'Student',           'PH-016016016', 'Leo Navarro – 09391002011',     11, NULL, NULL, 5),
  (17, 'Marco',    'Villanueva', NULL,  '1998-10-08', 1, 1, 3, 'Filipino', 'Call Center Agent', NULL,           'Rita Villanueva – 09721002014', 12, NULL, NULL, 7),
  (18, 'Josefina', 'Castillo',   NULL,  '1982-07-14', 2, 2, 1, 'Filipino', 'Nurse (private)',   'PH-018018018', 'Dante Castillo – 09831002015',  13, NULL, NULL, 7),
  (19, 'Andres',   'Aguilar',    NULL,  '1975-01-28', 1, 2, 2, 'Filipino', 'Fisherman',         'PH-019019019', 'Nora Aguilar – 09171002016',    14, NULL, NULL, 5),
  (20, 'Maricel',  'Pascual',    NULL,  '1999-11-22', 2, 1, 7, 'Filipino', 'Food Vendor',       'PH-020020020', 'Boy Pascual – 09721002021',     15, NULL, NULL, 5);

-- ─── 8. SET FAMILY CLUSTER HEADS ─────────────────────────────

UPDATE family_clusters SET head_patient_id = 1  WHERE id = 1; -- Juan Dela Cruz
UPDATE family_clusters SET head_patient_id = 4  WHERE id = 2; -- Rosa Santos
UPDATE family_clusters SET head_patient_id = 7  WHERE id = 3; -- Pedro Reyes
UPDATE family_clusters SET head_patient_id = 9  WHERE id = 4; -- Esteban Baluyot

-- ─── 9. CONTACT INFO ─────────────────────────────────────────
-- Normalized from patients.contact_number + patients.email TEXT fields

INSERT INTO contact_info (patient_id, type, value, is_primary) VALUES
  -- Dela Cruz family
  (1,  'phone', '09171001001',             1),
  (2,  'phone', '09171001002',             1),
  (2,  'email', 'maria.delacruz@gmail.com',0),
  (3,  'phone', '09171001001',             1),   -- child uses parent's number

  -- Santos family
  (4,  'phone', '09281001004',             1),
  (4,  'email', 'rosa.santos@gmail.com',   0),
  (5,  'phone', '09281001005',             1),
  (6,  'phone', '09281001004',             1),   -- child uses parent's number

  -- Reyes family
  (7,  'phone', '09391001007',             1),
  (8,  'phone', '09391001008',             1),

  -- Baluyot family
  (9,  'phone', '09611001009',             1),
  (10, 'phone', '09611001010',             1),

  -- Unaffiliated patients
  (11, 'phone', '09501001011',             1),
  (12, 'phone', '09281001012',             1),
  (12, 'email', 'patricia.h@gmail.com',    0),
  (13, 'phone', '09831001013',             1),
  (13, 'email', 'eduardo.torres@yahoo.com',0),
  (14, 'phone', '09171001014',             1),
  (14, 'email', 'liza.vargas@gmail.com',   0),
  (15, 'phone', '09281001015',             1),
  (16, 'phone', '09391001016',             1),
  (17, 'phone', '09721001017',             1),
  (17, 'email', 'marco.v@gmail.com',       0),
  (18, 'phone', '09831001018',             1),
  (19, 'phone', '09171001019',             1),
  (20, 'phone', '09721001020',             1),
  (20, 'email', 'maricel.p@gmail.com',     0);

-- ─── 10. SAMPLE APPOINTMENTS ─────────────────────────────────
-- created_by_id = staff who booked; doctor_id = staff with role=Doctor

INSERT INTO appointments (id, patient_id, doctor_id, created_by_id, scheduled_date, queue_number, status) VALUES
  (1, 1,  2, 5, CONCAT(CURDATE(), ' 08:00:00'), 1, 'Scheduled'),
  (2, 4,  3, 7, CONCAT(CURDATE(), ' 08:30:00'), 2, 'Scheduled'),
  (3, 7,  2, 5, CONCAT(CURDATE(), ' 09:00:00'), 3, 'Scheduled'),
  (4, 9,  4, 7, CONCAT(CURDATE(), ' 09:30:00'), 4, 'Scheduled'),
  (5, 12, 3, 5, CONCAT(CURDATE(), ' 10:00:00'), 5, 'Scheduled');

-- ─── 11. QUEUE (auto-created per appointment) ────────────────

INSERT INTO queue (appointment_id, queue_number, status) VALUES
  (1, 1, 'Waiting'),
  (2, 2, 'Waiting'),
  (3, 3, 'Waiting'),
  (4, 4, 'Waiting'),
  (5, 5, 'Waiting');

-- ─── 12. SAMPLE MEDICAL RECORDS ──────────────────────────────
-- Historical records (yesterday's date); doctor_id → staff table

INSERT INTO medical_records (patient_id, appointment_id, doctor_id, diagnosis, treatment, notes, record_date) VALUES
  (1,  NULL, 2, 'Hypertension Stage 1',              'Amlodipine 5mg OD',                  'BP: 150/95 mmHg. Lifestyle counseling given.',           DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
  (4,  NULL, 3, 'Iron-Deficiency Anemia (Pregnancy)', 'Ferrous Sulfate 325mg + Folic Acid', 'G3P2. AOG: 28 weeks. Follow-up in 2 weeks.',            DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
  (9,  NULL, 4, 'Type 2 Diabetes Mellitus',           'Metformin 500mg BID, diet counseling','FBS: 210 mg/dL. HbA1c pending.',                       DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
  (13, NULL, 2, 'Upper Respiratory Tract Infection',  'Amoxicillin 500mg TID x 7 days',     'Mild fever (38.1°C), pharyngitis. No chest findings.',  DATE_SUB(CURDATE(), INTERVAL 1 DAY));
