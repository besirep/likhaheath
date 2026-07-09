-- ============================================================
-- Migration 004: Add middle_name + medical intake history tables
-- LikhaHealth · 2026-06-09
-- ============================================================

-- 1. Add middle_name to patients (nullable, optional)
ALTER TABLE patients
  ADD COLUMN middle_name VARCHAR(100) NULL AFTER first_name;

-- 2. patient_medical_history
--    One row per patient (upsert on update). Stores past medical
--    history checkboxes, social history, general survey.
CREATE TABLE IF NOT EXISTS patient_medical_history (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id          INT UNSIGNED NOT NULL,

  -- Past Medical History (Y/N checkboxes from intake form)
  has_hypertension    TINYINT(1) NOT NULL DEFAULT 0,
  has_heart_disease   TINYINT(1) NOT NULL DEFAULT 0,
  has_diabetes        TINYINT(1) NOT NULL DEFAULT 0,
  has_stroke          TINYINT(1) NOT NULL DEFAULT 0,
  has_asthma          TINYINT(1) NOT NULL DEFAULT 0,
  has_tuberculosis    TINYINT(1) NOT NULL DEFAULT 0,
  has_copd            TINYINT(1) NOT NULL DEFAULT 0,
  has_allergies       TINYINT(1) NOT NULL DEFAULT 0,
  has_smoking_hx      TINYINT(1) NOT NULL DEFAULT 0,
  has_none            TINYINT(1) NOT NULL DEFAULT 0,
  other_conditions    TEXT NULL,

  -- Social / Personal History
  social_smoking      TINYINT(1) NOT NULL DEFAULT 0,
  social_alcohol      TINYINT(1) NOT NULL DEFAULT 0,

  -- General Survey
  general_survey      ENUM('awake_alert','altered_sensorium') NULL,

  -- Meta
  recorded_by_staff_id INT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_patient_medical (patient_id),
  CONSTRAINT fk_pmh_patient  FOREIGN KEY (patient_id)           REFERENCES patients(id),
  CONSTRAINT fk_pmh_staff    FOREIGN KEY (recorded_by_staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. patient_female_health
--    Female-specific fields (LMP, FP method, etc.).
--    Only created when sex = Female.
CREATE TABLE IF NOT EXISTS patient_female_health (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id          INT UNSIGNED NOT NULL,

  no_of_children      TINYINT UNSIGNED NULL,
  lmp                 DATE NULL,                -- Last Menstrual Period
  period_duration_days TINYINT UNSIGNED NULL,
  cycle_length_days   TINYINT UNSIGNED NULL,
  fp_method           VARCHAR(120) NULL,        -- Family Planning method
  menopausal_age      TINYINT UNSIGNED NULL,

  recorded_by_staff_id INT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_patient_female (patient_id),
  CONSTRAINT fk_pfh_patient  FOREIGN KEY (patient_id)           REFERENCES patients(id),
  CONSTRAINT fk_pfh_staff    FOREIGN KEY (recorded_by_staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add pediatric measurement columns to vitals
--    Shown only for patients aged 0-24 months.
ALTER TABLE vitals
  ADD COLUMN IF NOT EXISTS length_cm            DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS head_circumference_cm DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS skinfold_thickness_cm DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS body_circumference_cm DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS waist_cm             DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS hip_cm               DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS limbs_cm             DECIMAL(5,1) NULL,
  ADD COLUMN IF NOT EXISTS muac_cm              DECIMAL(5,1) NULL;
