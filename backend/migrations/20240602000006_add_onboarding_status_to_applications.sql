-- Migration: Add onboarding status tracking to job_applications
-- Description: Adds columns to track onboarding progress for hired applicants
-- Date: 2024-06-02

-- Add onboarding tracking columns to job_applications
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_started_by BIGINT REFERENCES users(id);

-- Add constraint for valid onboarding statuses
ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS check_onboarding_status;

ALTER TABLE job_applications 
ADD CONSTRAINT check_onboarding_status 
CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed', 'cancelled'));

-- Add comments for documentation
COMMENT ON COLUMN job_applications.onboarding_status IS 'Status of onboarding process: not_started, in_progress, completed, cancelled';
COMMENT ON COLUMN job_applications.onboarding_step IS 'Current step in onboarding process (0-5)';
COMMENT ON COLUMN job_applications.onboarding_data IS 'JSON data storing onboarding form data for each step';
COMMENT ON COLUMN job_applications.onboarding_started_at IS 'Timestamp when onboarding process started';
COMMENT ON COLUMN job_applications.onboarding_completed_at IS 'Timestamp when onboarding process completed';
COMMENT ON COLUMN job_applications.onboarding_started_by IS 'User ID who initiated the onboarding process';
