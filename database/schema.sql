1-- ============================================================
-- LikhaHealth — Patient Management System
-- Angono Municipal Health Center
-- Full Consolidated Schema (schema + all migrations)
-- Last updated: June 2026
--
-- HOW TO USE:
--   1. Run this file first (schema.sql)
--   2. Then run seed.sql for initial data
--   No separate migration files needed.
-- ============================================================

CREATE DATABASE IF NOT EXISTS likhaheath CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE likhaheath;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── DROP ALL TABLES (clean slate) ──────────────────────────
DROP TABLE IF EXISTS
  audit_logs,
  password_reset_tokens,
  sms_notifications,
  medical_records,
  vitals,
  appointment_services,
  queue,
  appointments,
  patient_female_health,
  patient_medical_history,
  contact_info,
  patients,
  addresses,
  users,
  staff,
  health_centers,
  blood_types,
  civil_statuses,
  sex_options;

-- ─── 1. LOOKUP TABLES ───────────────────────────────────────

CREATE TABLE blood_types (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE civil_statuses (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE sex_options (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50) NOT NULL UNIQUE
);

-- ─── 2. CORE INFRASTRUCTURE ─────────────────────────────────

CREATE TABLE health_centers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  municipality   VARCHAR(100) NOT NULL,
  province       VARCHAR(100) NOT NULL,
  contact_number VARCHAR(50)
);

CREATE TABLE staff (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  health_center_id    INT NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  suffix              VARCHAR(20),
  position            VARCHAR(100) NOT NULL,
  contact_number      VARCHAR(20) DEFAULT NULL,          -- migration 005
  prc_license_number  VARCHAR(100),
  prc_expiry_date     DATE,
  employment_status   ENUM('Regular','Contractual','Volunteer','MOA') DEFAULT 'Regular',
  is_active           TINYINT(1) DEFAULT 1,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (health_center_id) REFERENCES health_centers(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  staff_id      INT NOT NULL,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Admin','Doctor','Nurse','Midwife','BHW') NOT NULL,
  is_active     TINYINT(1) DEFAULT 1,
  last_login    TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Password reset / OTP tokens (migration 005)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT NOT NULL AUTO_INCREMENT,
  user_id    INT NOT NULL,
  otp        VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs (migration 005)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  staff_id   INT NOT NULL,
  action     VARCHAR(100) NOT NULL,
  details    TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- ─── 3. PATIENT DOMAIN ──────────────────────────────────────

CREATE TABLE addresses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  street       VARCHAR(255),
  barangay     VARCHAR(100) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  province     VARCHAR(100) NOT NULL,
  region       VARCHAR(100),
  zip_code     VARCHAR(20)
);

CREATE TABLE patients (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  first_name              VARCHAR(100) NOT NULL,
  middle_name             VARCHAR(100) NULL,                  -- migration 004
  last_name               VARCHAR(100) NOT NULL,
  suffix                  VARCHAR(20),
  date_of_birth           DATE NOT NULL,
  sex_id                  INT  NOT NULL,
  civil_status_id         INT  NOT NULL,
  blood_type_id           INT,
  nationality             VARCHAR(100) DEFAULT 'Filipino',
  occupation              VARCHAR(100),
  philhealth_no           VARCHAR(50),
  emergency_contact       VARCHAR(255),
  address_id              INT  NOT NULL,
  assigned_staff_id       INT,
  registered_by_staff_id  INT NOT NULL,
  is_deleted              TINYINT(1) DEFAULT 0,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sex_id)                  REFERENCES sex_options(id),
  FOREIGN KEY (civil_status_id)         REFERENCES civil_statuses(id),
  FOREIGN KEY (blood_type_id)           REFERENCES blood_types(id)      ON DELETE SET NULL,
  FOREIGN KEY (address_id)              REFERENCES addresses(id),
  FOREIGN KEY (assigned_staff_id)       REFERENCES staff(id)            ON DELETE SET NULL,
  FOREIGN KEY (registered_by_staff_id)  REFERENCES staff(id)
);

-- Medical history per patient (migration 004)
CREATE TABLE IF NOT EXISTS patient_medical_history (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id           INT UNSIGNED NOT NULL,
  has_hypertension     TINYINT(1) NOT NULL DEFAULT 0,
  has_heart_disease    TINYINT(1) NOT NULL DEFAULT 0,
  has_diabetes         TINYINT(1) NOT NULL DEFAULT 0,
  has_stroke           TINYINT(1) NOT NULL DEFAULT 0,
  has_asthma           TINYINT(1) NOT NULL DEFAULT 0,
  has_tuberculosis     TINYINT(1) NOT NULL DEFAULT 0,
  has_copd             TINYINT(1) NOT NULL DEFAULT 0,
  has_allergies        TINYINT(1) NOT NULL DEFAULT 0,
  has_smoking_hx       TINYINT(1) NOT NULL DEFAULT 0,
  has_none             TINYINT(1) NOT NULL DEFAULT 0,
  other_conditions     TEXT NULL,
  social_smoking       TINYINT(1) NOT NULL DEFAULT 0,
  social_alcohol       TINYINT(1) NOT NULL DEFAULT 0,
  general_survey       ENUM('awake_alert','altered_sensorium') NULL,
  recorded_by_staff_id INT UNSIGNED NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patient_medical (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Female health per patient (migration 004)
CREATE TABLE IF NOT EXISTS patient_female_health (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id           INT UNSIGNED NOT NULL,
  no_of_children       TINYINT UNSIGNED NULL,
  lmp                  DATE NULL,
  period_duration_days TINYINT UNSIGNED NULL,
  cycle_length_days    TINYINT UNSIGNED NULL,
  fp_method            VARCHAR(120) NULL,
  menopausal_age       TINYINT UNSIGNED NULL,
  recorded_by_staff_id INT UNSIGNED NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patient_female (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contact_info (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT  NOT NULL,
  type       ENUM('phone','email','other') NOT NULL,
  value      VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ─── 4. OPERATIONAL TABLES ──────────────────────────────────

CREATE TABLE appointments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  doctor_id      INT,
  created_by_id  INT NOT NULL,
  scheduled_date DATETIME NOT NULL,
  queue_number   INT NOT NULL,
  status         ENUM('Scheduled','Completed','Cancelled','No-Show') DEFAULT 'Scheduled',
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)    REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)     REFERENCES staff(id)    ON DELETE SET NULL,
  FOREIGN KEY (created_by_id) REFERENCES staff(id)    ON DELETE CASCADE
);

CREATE TABLE appointment_services (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  service_name   VARCHAR(255) NOT NULL,
  quantity       INT DEFAULT 1,
  notes          TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE queue (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  queue_number   INT NOT NULL,
  status         ENUM('Waiting','In-Progress','Done','Skipped') DEFAULT 'Waiting',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE vitals (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id         INT NOT NULL UNIQUE,
  blood_pressure         VARCHAR(20),
  temperature            DECIMAL(4,1),
  heart_rate             INT,
  spo2                   INT,
  weight_kg              DECIMAL(5,2),
  height_cm              DECIMAL(5,2),
  -- Pediatric measurements (migration 004)
  length_cm              DECIMAL(5,1) NULL,
  head_circumference_cm  DECIMAL(5,1) NULL,
  skinfold_thickness_cm  DECIMAL(5,1) NULL,
  body_circumference_cm  DECIMAL(5,1) NULL,
  waist_cm               DECIMAL(5,1) NULL,
  hip_cm                 DECIMAL(5,1) NULL,
  limbs_cm               DECIMAL(5,1) NULL,
  muac_cm                DECIMAL(5,1) NULL,
  recorded_by_id         INT,
  recorded_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by_id) REFERENCES staff(id)        ON DELETE SET NULL
);

CREATE TABLE medical_records (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  appointment_id INT,
  doctor_id      INT,
  diagnosis      TEXT NOT NULL,
  treatment      TEXT NOT NULL,
  notes          TEXT,
  record_date    DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id)      REFERENCES staff(id)        ON DELETE SET NULL
);

-- SMS notifications (migration_sms_notifications)
CREATE TABLE IF NOT EXISTS sms_notifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  appointment_id INT,
  message        TEXT NOT NULL,
  recipient      VARCHAR(20),
  status         ENUM('Sent','Failed','Pending') DEFAULT 'Pending',
  semaphore_id   VARCHAR(100),
  error_message  TEXT,
  sent_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- ─── 5. INDEXES ─────────────────────────────────────────────

CREATE INDEX idx_patients_last_name      ON patients(last_name);
CREATE INDEX idx_addresses_barangay      ON addresses(barangay);
CREATE INDEX idx_appts_scheduled_date    ON appointments(scheduled_date);
CREATE INDEX idx_appts_patient_id        ON appointments(patient_id);
CREATE INDEX idx_queue_status            ON queue(status);
CREATE INDEX idx_mr_patient_id           ON medical_records(patient_id);
CREATE INDEX idx_sms_patient_id          ON sms_notifications(patient_id);
CREATE INDEX idx_sms_sent_at             ON sms_notifications(sent_at);

SET FOREIGN_KEY_CHECKS = 1;
