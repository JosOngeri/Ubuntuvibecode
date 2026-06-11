-- Migration: Create employee_schedules table
-- Description: Creates table for employee work schedules
-- Date: 2024-06-02

CREATE TABLE IF NOT EXISTS employee_schedules (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
  work_days JSONB DEFAULT '[1,2,3,4,5]', -- Mon-Fri as array (1=Monday, 7=Sunday)
  start_time TIME DEFAULT '09:00:00',
  end_time TIME DEFAULT '17:00:00',
  break_duration_minutes INTEGER DEFAULT 60,
  can_self_checkin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- Add comments for documentation
COMMENT ON TABLE employee_schedules IS 'Employee work schedules and time tracking settings';
COMMENT ON COLUMN employee_schedules.work_days IS 'JSON array of work days (1=Monday, 7=Sunday)';
COMMENT ON COLUMN employee_schedules.start_time IS 'Default work start time';
COMMENT ON COLUMN employee_schedules.end_time IS 'Default work end time';
COMMENT ON COLUMN employee_schedules.break_duration_minutes IS 'Break duration in minutes';
COMMENT ON COLUMN employee_schedules.can_self_checkin IS 'Whether employee can self-record attendance';
