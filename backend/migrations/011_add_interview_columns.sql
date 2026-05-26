-- Add interview-related columns to job_applications table
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS interview_score INTEGER,
ADD COLUMN IF NOT EXISTS interview_notes TEXT,
ADD COLUMN IF NOT EXISTS interview_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interview_invitations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interview_feedbacks JSONB DEFAULT '[]'::jsonb;
