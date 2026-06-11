-- Migration: Add job_applications table columns
-- Description: Adds columns that were previously auto-added by ensureColumns()
-- Date: 2024-06-02
-- Replaces: JobApplication.model.js ensureColumns()

-- Rename jobid to job_id if old schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'jobid') THEN
    ALTER TABLE job_applications RENAME COLUMN jobid TO job_id;
  END IF;
END $$;

-- Add job_id column with foreign key if it doesn't exist
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE;

-- Add legacy column names for backward compatibility (these are aliases)
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS coverletter TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS coverletterpath VARCHAR(255);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicationdata JSONB;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS recruiterannouncement TEXT;

-- Add scoring and evaluation columns
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS auto_score DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS manual_score DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add JSONB columns for structured data
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS address_info JSONB DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS position_details JSONB DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employment_history JSONB DEFAULT '[]';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS declaration JSONB DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS disclosures JSONB DEFAULT '[]';

-- Add offer-related columns
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_token VARCHAR(255);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_status VARCHAR(50);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS counter_offer_salary DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS final_salary DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_token_expires_at TIMESTAMP;

-- Add interview-related columns
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_score DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_notes TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offered_salary DECIMAL;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_status VARCHAR(50);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_invitations JSONB DEFAULT '[]';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_feedbacks JSONB DEFAULT '[]';

-- Add employee linking column
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- Add availability column
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS availability_date DATE;

-- Add tracking columns
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS linked_via VARCHAR(50);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN job_applications.auto_score IS 'AI-generated score for applicant ranking';
COMMENT ON COLUMN job_applications.manual_score IS 'Manually assigned score by recruiters';
COMMENT ON COLUMN job_applications.offer_token IS 'Unique token for offer acceptance URL';
COMMENT ON COLUMN job_applications.offer_status IS 'Status of offer (pending, accepted, rejected, expired)';
COMMENT ON COLUMN job_applications.interview_status IS 'Status of interview (scheduled, completed, cancelled)';
COMMENT ON COLUMN job_applications.employee_id IS 'Links application to employee record after hiring';
