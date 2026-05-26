-- Add unique constraint on employees.user_id for ON CONFLICT support
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'employees'::regclass AND conname = 'employees_user_id_unique'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_user_id_unique UNIQUE (user_id);
    END IF;
END $$;
SELECT 'Added employees.user_id unique constraint' AS result;
