-- ============================================================
-- LikhaHealth — Patient Management System
-- Angono Municipal Health Center
-- Schema: schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS likhaheath CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE likhaheath;

-- ─── PATIENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  birth_date         DATE NOT NULL,
  gender             ENUM('Male','Female','Other') NOT NULL,
  address            TEXT NOT NULL,
  contact_number     VARCHAR(20),
  email              VARCHAR(150),
  emergency_contact  VARCHAR(200),
  philhealth_id      VARCHAR(50),
  blood_type         ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  is_deleted         TINYINT(1) DEFAULT 0,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── DOCTORS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  first_name           VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  gender               ENUM('Male','Female','Other'),
  date_of_birth        DATE,
  contact_number       VARCHAR(20),
  email                VARCHAR(150) UNIQUE,
  specialization       VARCHAR(150),
  prc_license_number   VARCHAR(100),
  prc_expiry_date      DATE,
  ptr_number           VARCHAR(100),
  s2_license           VARCHAR(100),
  employment_status    ENUM('Regular','Contractual','Visiting','MOA') DEFAULT 'Regular',
  date_hired           DATE,
  is_active            TINYINT(1) DEFAULT 1,
  profile_photo        VARCHAR(255),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── MEDICAL STAFF (Nurses, Midwives, BHWs) ──────────────────
CREATE TABLE IF NOT EXISTS medical_staff (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  first_name           VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  gender               ENUM('Male','Female','Other'),
  date_of_birth        DATE,
  contact_number       VARCHAR(20),
  email                VARCHAR(150) UNIQUE,
  position             ENUM('Nurse','Midwife','Medical Technologist','Dentist','Pharmacist','Admin','BHW') NOT NULL,
  prc_license_number   VARCHAR(100),
  prc_expiry_date      DATE,
  employment_status    ENUM('Regular','Contractual','Volunteer','MOA') DEFAULT 'Regular',
  date_hired           DATE,
  is_active            TINYINT(1) DEFAULT 1,
  profile_photo        VARCHAR(255),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── USERS (System Login) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  staff_id       INT,
  doctor_id      INT,
  username       VARCHAR(100) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('Admin','Doctor','Nurse','Midwife') NOT NULL,
  is_active      TINYINT(1) DEFAULT 1,
  last_login     TIMESTAMP NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id)  REFERENCES medical_staff(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- ─── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  doctor_id        INT,
  scheduled_date   DATETIME NOT NULL,
  status           ENUM('Scheduled','Completed','Cancelled','No-Show') DEFAULT 'Scheduled',
  queue_number     INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE SET NULL
);

-- ─── QUEUE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queue (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id   INT NOT NULL,
  queue_number     INT NOT NULL,
  status           ENUM('Waiting','In-Progress','Done','Skipped') DEFAULT 'Waiting',
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- ─── MEDICAL RECORDS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  appointment_id   INT,
  doctor_id        INT,
  diagnosis        TEXT NOT NULL,
  treatment        TEXT NOT NULL,
  notes            TEXT,
  record_date      DATE NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id)      REFERENCES doctors(id)      ON DELETE SET NULL
);

-- ─── APPOINTMENT SERVICES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_services (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id   INT NOT NULL,
  service_name     VARCHAR(255) NOT NULL,
  quantity         INT DEFAULT 1,
  notes            TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- ─── SMS NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_notifications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  appointment_id   INT,
  message          TEXT NOT NULL,
  sent_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('Sent','Failed','Pending') DEFAULT 'Pending',
  FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);
