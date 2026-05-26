-- ============================================================
-- MIGRATION 004: Fix daily_labourers and daily_attendance schema
-- ============================================================

-- daily_labourers missing columns
ALTER TABLE daily_labourers
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS photo TEXT,
    ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(50) DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS converted_to_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate existing full_name into first_name / last_name
UPDATE daily_labourers
SET first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name)))
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Migrate existing daily_wage into daily_rate
UPDATE daily_labourers
SET daily_rate = daily_wage
WHERE daily_rate IS NULL AND daily_wage IS NOT NULL;

-- daily_attendance missing columns
ALTER TABLE daily_attendance
    ADD COLUMN IF NOT EXISTS wage_for_day DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS assigned_contractor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_milestone_id BIGINT REFERENCES milestones(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
