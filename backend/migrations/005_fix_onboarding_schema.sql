-- ============================================================
-- MIGRATION 005: Fix onboarding schema to match controller
-- ============================================================

ALTER TABLE onboarding
    ADD COLUMN IF NOT EXISTS application_id BIGINT REFERENCES job_applications(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS position VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supervisor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS probation_end_date DATE,
    ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS orientation_checklist JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS assets_assigned JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS probation_reviews JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS offer_letter_generated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS offer_letter_url TEXT,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS confirmed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
