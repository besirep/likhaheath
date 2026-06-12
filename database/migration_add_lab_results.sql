-- Migration: Add lab_results JSON column to medical_records
-- Run this on the live database

ALTER TABLE medical_records
  ADD COLUMN lab_results JSON NULL COMMENT 'Structured lab orders and results as JSON array' AFTER notes;
