-- Add unique constraint on attendance (employee_id, attendance_date)
-- Required for ON CONFLICT upsert in Attendance.model.js save()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_attendance_employee_date'
  ) THEN
    CREATE UNIQUE INDEX idx_attendance_employee_date
    ON attendance (employee_id, attendance_date);
  END IF;
END $$;
