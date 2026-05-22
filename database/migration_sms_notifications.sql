-- ============================================================
-- LikhaHealth — Migration: SMS Notifications Table
-- Run this AFTER schema.sql if the table does not yet exist.
-- ============================================================
USE likhaheath;

CREATE TABLE IF NOT EXISTS sms_notifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  appointment_id INT,
  message        TEXT NOT NULL,
  recipient      VARCHAR(20),             -- phone number the SMS was sent to
  status         ENUM('Sent','Failed','Pending') DEFAULT 'Pending',
  semaphore_id   VARCHAR(100),            -- message ID returned by Semaphore API
  error_message  TEXT,                   -- stored if status = 'Failed'
  sent_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX idx_sms_patient_id     ON sms_notifications(patient_id);
CREATE INDEX idx_sms_sent_at        ON sms_notifications(sent_at);
