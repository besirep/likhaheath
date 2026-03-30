-- ============================================================
-- LikhaHealth — Seed Data
-- Angono Municipal Health Center
-- ============================================================
USE likhaheath;

-- ─── DOCTORS ─────────────────────────────────────────────────
INSERT INTO doctors (first_name, last_name, gender, date_of_birth, contact_number, email, specialization, prc_license_number, prc_expiry_date, ptr_number, s2_license, employment_status, date_hired) VALUES
('Ramon',   'Dela Cruz',   'Male',   '1978-04-12', '09171234567', 'ramon.delacruz@likhaheath.ph',   'General Medicine',    'PRC-0012345', '2026-06-30', 'PTR-78901', 'S2-11223', 'Regular',     '2015-03-01'),
('Maria',   'Santos',      'Female', '1985-09-22', '09281234567', 'maria.santos@likhaheath.ph',      'Obstetrics-Gynecology','PRC-0056789', '2025-12-31', 'PTR-78902', NULL,        'Regular',     '2018-07-15'),
('Jose',    'Reyes',       'Male',   '1980-02-14', '09391234567', 'jose.reyes@likhaheath.ph',        'Pediatrics',          'PRC-0098765', '2027-03-01', 'PTR-78903', 'S2-44556', 'Contractual', '2022-01-10');

-- ─── MEDICAL STAFF ────────────────────────────────────────────
INSERT INTO medical_staff (first_name, last_name, gender, date_of_birth, contact_number, email, position, prc_license_number, prc_expiry_date, employment_status, date_hired) VALUES
('Ana',      'Bautista',  'Female', '1990-05-18', '09178880001', 'ana.bautista@likhaheath.ph',  'Nurse',    'RN-112233', '2026-01-15', 'Regular',     '2016-06-01'),
('Luisa',    'Garcia',    'Female', '1993-11-03', '09178880002', 'luisa.garcia@likhaheath.ph',  'Midwife',  'RM-445566', '2025-11-30', 'Regular',     '2019-03-20'),
('Cynthia',  'Flores',    'Female', '1988-07-25', '09178880003', 'cynthia.flores@likhaheath.ph','Nurse',    'RN-778899', '2027-05-01', 'Contractual', '2021-09-01'),
('Maribel',  'Torres',    'Female', '1995-01-09', '09178880004', 'maribel.torres@likhaheath.ph','Midwife',  'RM-001122', '2026-08-20', 'Regular',     '2020-11-15'),
('Pedro',    'Cruz',      'Male',   '1987-03-30', '09178880005', 'pedro.cruz@likhaheath.ph',    'BHW',      NULL,        NULL,         'Volunteer',   '2023-01-05');

-- ─── DEFAULT ADMIN USER (password: likhaheath2025) ────────────
-- bcrypt hash of 'likhaheath2025'
INSERT INTO users (username, password_hash, role, is_active) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admin', 1);

-- ─── PATIENTS ─────────────────────────────────────────────────
INSERT INTO patients (first_name, last_name, birth_date, gender, address, contact_number, email, emergency_contact, philhealth_id, blood_type) VALUES
('Juan',        'Dela Cruz',   '1990-03-15', 'Male',   'Purok 3, Angono, Rizal',            '09171001001', 'juan.delacruz@gmail.com',  'Maria Dela Cruz - 09171002002', 'PH-001001001', 'O+'),
('Maria',       'Santos',      '1985-07-22', 'Female', 'Sitio Mabolo, Angono, Rizal',        '09281001002', 'maria.santos@gmail.com',   'Jose Santos - 09281002003',     'PH-002002002', 'A+'),
('Pedro',       'Reyes',       '2000-01-10', 'Male',   'Blk 5 Lot 3, Angono, Rizal',         '09391001003', NULL,                       'Lina Reyes - 09391002004',      NULL,           'B+'),
('Rosa',        'Bautista',    '1978-11-05', 'Female', 'Zone 2, Angono, Rizal',              '09501001004', 'rosa.bautista@gmail.com',  'Carlo Bautista - 09501002005',  'PH-004004004', 'AB+'),
('Carlos',      'Flores',      '1995-04-18', 'Male',   'Barangay San Isidro, Angono, Rizal', '09611001005', NULL,                       'Nina Flores - 09611002006',     NULL,           'O-'),
('Nena',        'Garcia',      '2005-09-30', 'Female', 'Purok 7, Angono, Rizal',             '09721001006', NULL,                       'Ramon Garcia - 09721002007',    'PH-006006006', 'A-'),
('Eduardo',     'Torres',      '1970-06-25', 'Male',   'Brgy. San Roque, Angono, Rizal',     '09831001007', 'eduardo.torres@yahoo.com', 'Cora Torres - 09831002008',     'PH-007007007', 'B-'),
('Liza',        'Vargas',      '1988-02-14', 'Female', 'Phase 1, Angono, Rizal',             '09171001008', 'liza.vargas@gmail.com',    'Bert Vargas - 09171002009',     'PH-008008008', 'O+'),
('Rodrigo',     'Mendoza',     '1992-12-01', 'Male',   'Sitio Kalayaan, Angono, Rizal',      '09281001009', NULL,                       'Ella Mendoza - 09281002010',    NULL,           'A+'),
('Carla',       'Navarro',     '2010-08-19', 'Female', 'Zone 4, Angono, Rizal',              '09391001010', NULL,                       'Leo Navarro - 09391002011',     'PH-010010010', 'AB-'),
('Fernando',    'Padilla',     '1960-05-05', 'Male',   'Purok 1, Angono, Rizal',             '09501001011', NULL,                       'Tess Padilla - 09501002012',    'PH-011011011', 'O+'),
('Aling',       'Baluyot',     '1955-03-17', 'Female', 'Brgy. Poblacion, Angono, Rizal',     '09611001012', NULL,                       'Jun Baluyot - 09611002013',     'PH-012012012', 'A+'),
('Marco',       'Villanueva',  '1998-10-08', 'Male',   'Phase 3, Angono, Rizal',             '09721001013', 'marco.v@gmail.com',        'Rita Villanueva - 09721002014', NULL,           'B+'),
('Josefina',    'Castillo',    '1982-07-14', 'Female', 'Blk 8 Lot 2, Angono, Rizal',         '09831001014', NULL,                       'Dante Castillo - 09831002015',  'PH-014014014', 'O-'),
('Andres',      'Aguilar',     '1975-01-28', 'Male',   'Sitio San Pedro, Angono, Rizal',     '09171001015', NULL,                       'Nora Aguilar - 09171002016',    'PH-015015015', 'A-'),
('Patricia',    'Hernandez',   '2003-06-03', 'Female', 'Zone 6, Angono, Rizal',              '09281001016', 'patricia.h@gmail.com',     'Vic Hernandez - 09281002017',   NULL,           'B+'),
('Gilbert',     'Ramos',       '1967-09-11', 'Male',   'Purok 5, Angono, Rizal',             '09391001017', NULL,                       'Connie Ramos - 09391002018',    'PH-017017017', 'AB+'),
('Teresita',    'Aquino',      '1945-12-25', 'Female', 'Brgy. Binangonan Rd, Angono, Rizal', '09501001018', NULL,                       'Noel Aquino - 09501002019',     'PH-018018018', 'O+'),
('Renato',      'Soriano',     '2015-04-07', 'Male',   'Phase 2, Angono, Rizal',             '09611001019', NULL,                       'Grace Soriano - 09611002020',   NULL,           'A+'),
('Maricel',     'Pascual',     '1999-11-22', 'Female', 'Zone 1, Angono, Rizal',              '09721001020', 'maricel.p@gmail.com',      'Boy Pascual - 09721002021',     'PH-020020020', 'O+');

-- ─── APPOINTMENTS ─────────────────────────────────────────────
INSERT INTO appointments (patient_id, doctor_id, scheduled_date, status, queue_number) VALUES
(1,  1, '2026-03-31 08:00:00', 'Scheduled',  1),
(2,  2, '2026-03-31 08:30:00', 'Scheduled',  2),
(3,  1, '2026-03-31 09:00:00', 'Scheduled',  3),
(4,  3, '2026-03-31 09:30:00', 'Completed',  4),
(5,  2, '2026-03-30 10:00:00', 'Completed',  1),
(6,  1, '2026-03-30 10:30:00', 'No-Show',    2),
(7,  3, '2026-04-01 08:00:00', 'Scheduled',  1),
(8,  2, '2026-04-01 08:30:00', 'Scheduled',  2);

-- ─── QUEUE ────────────────────────────────────────────────────
INSERT INTO queue (appointment_id, queue_number, status) VALUES
(1, 1, 'Waiting'),
(2, 2, 'Waiting'),
(3, 3, 'Waiting'),
(4, 4, 'Done');

-- ─── MEDICAL RECORDS ──────────────────────────────────────────
INSERT INTO medical_records (patient_id, appointment_id, doctor_id, diagnosis, treatment, notes, record_date) VALUES
(4, 4, 3, 'Upper Respiratory Tract Infection', 'Amoxicillin 500mg TID x 7 days, Rest and fluids', 'Patient advised to return if no improvement after 3 days', '2026-03-31'),
(5, 5, 2, 'Prenatal Check-up — 28 weeks AOG', 'Ferrous sulfate, Folic acid, Calcium supplementation', 'FHB good, fundic height 28cm, referred to OB for follow-up', '2026-03-30');

-- ─── SMS NOTIFICATIONS ────────────────────────────────────────
INSERT INTO sms_notifications (patient_id, appointment_id, message, status) VALUES
(1, 1, 'Magandang araw po! Ito ay isang paalala mula sa Angono Municipal Health Center. Mayroon kayong appointment bukas, Marso 31, 2026 ng 8:00 AM. Mangyaring dumating nang maaga.', 'Sent'),
(2, 2, 'Magandang araw po! Ito ay isang paalala mula sa Angono Municipal Health Center. Mayroon kayong appointment bukas, Marso 31, 2026 ng 8:30 AM. Mangyaring dumating nang maaga.', 'Sent'),
(3, 3, 'Magandang araw po! Ito ay isang paalala mula sa Angono Municipal Health Center. Mayroon kayong appointment bukas, Marso 31, 2026 ng 9:00 AM. Mangyaring dumating nang maaga.', 'Sent');

-- ─── APPOINTMENT SERVICES ─────────────────────────────────────
INSERT INTO appointment_services (appointment_id, service_name, quantity, notes) VALUES
(4, 'Blood Pressure Monitoring', 1, NULL),
(4, 'CBC (Complete Blood Count)',  1, 'Referred to lab'),
(5, 'Prenatal Consultation',       1, NULL),
(5, 'Ferrous Sulfate 325mg',       30, '1 tab OD');
