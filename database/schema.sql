-- ============================================================
-- LikhaHealth — Patient Management System
-- Angono Municipal Health Center
-- Phase 1 Normalized Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS likhaheath CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE likhaheath;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── DROP ALL TABLES (clean slate) ──────────────────────────
DROP TABLE IF EXISTS
  medical_records,
  appointment_services,
  queue,
  appointments,
  contact_info,
  patients,
  family_clusters,
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

-- ─── 3. PATIENT DOMAIN ──────────────────────────────────────

-- Normalized address entity (extracted from patients.address TEXT)
CREATE TABLE addresses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  street       VARCHAR(255),
  barangay     VARCHAR(100) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  province     VARCHAR(100) NOT NULL,
  region       VARCHAR(100),
  zip_code     VARCHAR(20)
);

CREATE TABLE family_clusters (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  label               VARCHAR(255) NOT NULL,
  head_patient_id     INT,          -- Circular FK added via ALTER TABLE after patients
  health_center_id    INT NOT NULL,
  created_by_staff_id INT NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (health_center_id)    REFERENCES health_centers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)          ON DELETE CASCADE
);

CREATE TABLE patients (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  suffix                  VARCHAR(20),
  date_of_birth           DATE NOT NULL,
  sex_id                  INT  NOT NULL,
  civil_status_id         INT  NOT NULL,
  blood_type_id           INT,
  nationality             VARCHAR(100) DEFAULT 'Filipino',
  occupation              VARCHAR(100),
  philhealth_no           VARCHAR(50),
  emergency_contact       VARCHAR(255),     -- "Name – 09XXXXXXXXX"
  address_id              INT  NOT NULL,
  family_cluster_id       INT,
  assigned_staff_id       INT,              -- BHW or midwife
  registered_by_staff_id  INT NOT NULL,
  is_deleted              TINYINT(1) DEFAULT 0,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sex_id)                  REFERENCES sex_options(id),
  FOREIGN KEY (civil_status_id)         REFERENCES civil_statuses(id),
  FOREIGN KEY (blood_type_id)           REFERENCES blood_types(id)    ON DELETE SET NULL,
  FOREIGN KEY (address_id)              REFERENCES addresses(id),
  FOREIGN KEY (family_cluster_id)       REFERENCES family_clusters(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_staff_id)       REFERENCES staff(id)           ON DELETE SET NULL,
  FOREIGN KEY (registered_by_staff_id)  REFERENCES staff(id)
);

-- Resolve circular FK now that patients exists
ALTER TABLE family_clusters
  ADD CONSTRAINT fk_cluster_head_patient
  FOREIGN KEY (head_patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- Normalized contact info (extracted from patients.contact_number + patients.email)
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
  doctor_id      INT,                        -- FK → staff (role=Doctor), nullable
  created_by_id  INT NOT NULL,               -- FK → staff (who booked)
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
  appointment_id INT NOT NULL UNIQUE,        -- one queue slot per appointment
  queue_number   INT NOT NULL,
  status         ENUM('Waiting','In-Progress','Done','Skipped') DEFAULT 'Waiting',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE medical_records (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  appointment_id INT,                        -- nullable — record may exist without appointment
  doctor_id      INT,                        -- FK → staff (role=Doctor)
  diagnosis      TEXT NOT NULL,
  treatment      TEXT NOT NULL,
  notes          TEXT,
  record_date    DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)      ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)  ON DELETE SET NULL,
  FOREIGN KEY (doctor_id)      REFERENCES staff(id)         ON DELETE SET NULL
);

-- ─── 5. INDEXES ─────────────────────────────────────────────

-- Patient lookups
CREATE INDEX idx_patients_last_name      ON patients(last_name);
CREATE INDEX idx_patients_family_cluster ON patients(family_cluster_id);

-- Address reports
CREATE INDEX idx_addresses_barangay      ON addresses(barangay);

-- Appointment & queue
CREATE INDEX idx_appts_scheduled_date    ON appointments(scheduled_date);
CREATE INDEX idx_appts_patient_id        ON appointments(patient_id);
CREATE INDEX idx_queue_status            ON queue(status);

-- Medical records
CREATE INDEX idx_mr_patient_id           ON medical_records(patient_id);

SET FOREIGN_KEY_CHECKS = 1;
