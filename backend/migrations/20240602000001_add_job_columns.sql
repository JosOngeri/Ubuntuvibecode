-- Migration: Add job table columns
-- Description: Adds columns that were previously auto-added by ensureColumns()
-- Date: 2024-06-02
-- Replaces: Job.model.js ensureColumns()

-- These columns are already in init-database.sql, but this migration
-- ensures they exist for existing databases that may not have them

-- Note: Most of these columns are already defined in init-database.sql
-- This migration is for backward compatibility with existing installations

-- Add columns if they don't exist (safe to run multiple times)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS evaluation_params JSONB DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS advertisement_data JSONB DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS advertisement_image_path VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS number_of_positions INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS career_level VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_languages VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_requirements TEXT;

-- Add comment for documentation
COMMENT ON COLUMN jobs.salary_range IS 'Combined salary range string (e.g., "50000 - 70000")';
COMMENT ON COLUMN jobs.qualifications IS 'Array of required qualifications';
COMMENT ON COLUMN jobs.evaluation_params IS 'Evaluation criteria for applicants';
COMMENT ON COLUMN jobs.advertisement_data IS 'Advertisement content and metadata';
COMMENT ON COLUMN jobs.number_of_positions IS 'Number of open positions for this job';
