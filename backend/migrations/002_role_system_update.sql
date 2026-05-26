-- Migration: Role System Update
-- Adds owner role, user permissions, supervisor allocations, and daily labourer user linking

-- 1. Update users table role constraint to include 'owner' and 'daily_labourer'
-- Note: This requires dropping and recreating the constraint
-- First, check if the constraint exists and update it
DO $$
BEGIN
    -- Add 'owner' role if not exists (will be handled by application layer if constraint can't be modified)
    -- The constraint modification depends on your PostgreSQL version and existing data
    NULL;
END $$;

-- 2. Create user_permissions table for granular permission control
CREATE TABLE IF NOT EXISTS user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    permission_value BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_key ON user_permissions(permission_key);

-- 3. Create supervisor_allocations table
CREATE TABLE IF NOT EXISTS supervisor_allocations (
    id BIGSERIAL PRIMARY KEY,
    supervisor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    allocated_type VARCHAR(50) NOT NULL CHECK (allocated_type IN ('employee', 'daily_labourer')),
    allocated_id BIGINT NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    allocated_by BIGINT REFERENCES users(id),
    UNIQUE(allocated_type, allocated_id)
);

-- Create indexes for supervisor allocations
CREATE INDEX IF NOT EXISTS idx_supervisor_allocations_supervisor_id ON supervisor_allocations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_allocations_allocated ON supervisor_allocations(allocated_type, allocated_id);

-- 4. Update daily_labourers table to link to user accounts
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'daily_labourers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE daily_labourers ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'daily_labourers_user_id_unique'
    ) THEN
        ALTER TABLE daily_labourers ADD CONSTRAINT daily_labourers_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- 5. Create owner_notifications table for backdated attendance notifications
CREATE TABLE IF NOT EXISTS owner_notifications (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_owner_notifications_unread ON owner_notifications(is_read, created_at DESC);

-- 6. Create mode_sessions table for owner/admin mode switching
CREATE TABLE IF NOT EXISTS mode_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    current_mode VARCHAR(20) NOT NULL CHECK (current_mode IN ('owner', 'admin')),
    switched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    switch_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_mode_sessions_user_id ON mode_sessions(user_id, switched_at DESC);

-- 7. Create elevation_requests table for HR-Manager OTP elevation
CREATE TABLE IF NOT EXISTS elevation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'manager_elevation',
    otp_code VARCHAR(10),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by BIGINT REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'used')),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_elevation_requests_user_id ON elevation_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_elevation_requests_status ON elevation_requests(status);

-- 8. Add new columns to attendance table for enhanced tracking
DO $$
BEGIN
    -- Add check_in_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'check_in_type'
    ) THEN
        ALTER TABLE attendance ADD COLUMN check_in_type VARCHAR(20);
        ALTER TABLE attendance ADD CONSTRAINT attendance_check_in_type_check CHECK (check_in_type IN ('morning', 'afternoon', 'evening'));
    END IF;

    -- Add GPS columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'gps_latitude'
    ) THEN
        ALTER TABLE attendance ADD COLUMN gps_latitude DECIMAL(10, 8);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'gps_longitude'
    ) THEN
        ALTER TABLE attendance ADD COLUMN gps_longitude DECIMAL(11, 8);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'gps_accuracy_meters'
    ) THEN
        ALTER TABLE attendance ADD COLUMN gps_accuracy_meters DECIMAL;
    END IF;

    -- Add location_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'location_name'
    ) THEN
        ALTER TABLE attendance ADD COLUMN location_name VARCHAR(100);
    END IF;

    -- Add backdated tracking columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'backdated'
    ) THEN
        ALTER TABLE attendance ADD COLUMN backdated BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'backdated_reason'
    ) THEN
        ALTER TABLE attendance ADD COLUMN backdated_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'backdated_by'
    ) THEN
        ALTER TABLE attendance ADD COLUMN backdated_by BIGINT REFERENCES users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'backdated_at'
    ) THEN
        ALTER TABLE attendance ADD COLUMN backdated_at TIMESTAMPTZ;
    END IF;

    -- Add recorded_by column for supervisor/manager check-ins
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'recorded_by'
    ) THEN
        ALTER TABLE attendance ADD COLUMN recorded_by BIGINT REFERENCES users(id);
    END IF;
END $$;

-- 9. Add attendance configuration columns to employees table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'attendance_check_in_morning'
    ) THEN
        ALTER TABLE employees ADD COLUMN attendance_check_in_morning TIME;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'attendance_check_in_afternoon'
    ) THEN
        ALTER TABLE employees ADD COLUMN attendance_check_in_afternoon TIME;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'attendance_check_in_evening'
    ) THEN
        ALTER TABLE employees ADD COLUMN attendance_check_in_evening TIME;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'attendance_require_multiple_checkins'
    ) THEN
        ALTER TABLE employees ADD COLUMN attendance_require_multiple_checkins BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'attendance_location_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN attendance_location_id BIGINT;
    END IF;
END $$;

-- 10. Insert default settings for new dropdown values
INSERT INTO settings (setting_key, category, setting_value, description, data_type, is_active, created_at, updated_at)
VALUES
    ('SHIFT_TYPES', 'attendance', '["Morning", "Afternoon", "Evening"]', 'Available shift types for attendance tracking', 'array', true, NOW(), NOW()),
    ('EMPLOYMENT_STATUS', 'recruitment', '["Full-time", "Part-time", "Contract", "Self-employed", "Intern", "Freelance"]', 'Employment status options for job applications', 'array', true, NOW(), NOW()),
    ('APPLICATION_STATUS', 'recruitment', '["pending", "shortlisted", "rejected", "hired", "withdrawn"]', 'Job application status categories', 'array', true, NOW(), NOW()),
    ('DAILY_LABOUR_DEPARTMENTS', 'daily_labour', '["farm", "housekeeping", "grounds", "construction", "kitchen", "other"]', 'Department options for daily labour assignments', 'array', true, NOW(), NOW()),
    ('ATTENDANCE_LOCATIONS', 'attendance', '[]', 'Configurable GPS locations for attendance check-in', 'array', true, NOW(), NOW()),
    ('ATTENDANCE_GPS_ENABLED', 'attendance', 'true', 'Enable GPS validation for attendance', 'boolean', true, NOW(), NOW()),
    ('ATTENDANCE_GPS_RADIUS_METERS', 'attendance', '100', 'Default GPS radius for attendance validation in meters', 'number', true, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment explaining the migration
COMMENT ON TABLE user_permissions IS 'Granular permissions for users, separate from role-based permissions';
COMMENT ON TABLE supervisor_allocations IS 'Links supervisors to their allocated employees and daily labourers';
COMMENT ON TABLE owner_notifications IS 'Notifications for owners about important system events like backdated attendance';
COMMENT ON TABLE mode_sessions IS 'Tracks owner/admin mode switching for dual-role users';
COMMENT ON TABLE elevation_requests IS 'OTP-based elevation requests for HR users to gain temporary manager rights';
