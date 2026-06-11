-- Migration: Add missing foreign key constraints
-- Description: Adds proper foreign key constraints to ensure data integrity
-- Date: 2024-06-02
-- Purpose: Prevents orphaned records and ensures referential integrity

-- Note: Some FKs may already exist. Using IF NOT EXISTS pattern where possible,
-- or checking first to avoid errors.

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
-- Ensure attendance.employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_attendance_employee_id'
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE attendance 
    ADD CONSTRAINT fk_attendance_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- PAYSLIPS TABLE
-- ============================================
-- Ensure payslips.employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_payslips_employee_id'
    AND table_name = 'payslips'
  ) THEN
    ALTER TABLE payslips 
    ADD CONSTRAINT fk_payslips_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- ASSETS TABLE
-- ============================================
-- Ensure assets.employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_assets_employee_id'
    AND table_name = 'assets'
  ) THEN
    ALTER TABLE assets 
    ADD CONSTRAINT fk_assets_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- DAILY LABOURERS TABLE
-- ============================================
-- Ensure daily_labourers.user_id references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_labourers_user_id'
    AND table_name = 'daily_labourers'
  ) THEN
    ALTER TABLE daily_labourers 
    ADD CONSTRAINT fk_daily_labourers_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure daily_labourers.converted_to_employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_labourers_converted_to_employee_id'
    AND table_name = 'daily_labourers'
  ) THEN
    ALTER TABLE daily_labourers 
    ADD CONSTRAINT fk_daily_labourers_converted_to_employee_id 
    FOREIGN KEY (converted_to_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure daily_labourers.registered_by references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_labourers_registered_by'
    AND table_name = 'daily_labourers'
  ) THEN
    ALTER TABLE daily_labourers 
    ADD CONSTRAINT fk_daily_labourers_registered_by 
    FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- DAILY ATTENDANCE TABLE
-- ============================================
-- Ensure daily_attendance.labourer_id references daily_labourers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_attendance_labourer_id'
    AND table_name = 'daily_attendance'
  ) THEN
    ALTER TABLE daily_attendance 
    ADD CONSTRAINT fk_daily_attendance_labourer_id 
    FOREIGN KEY (labourer_id) REFERENCES daily_labourers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure daily_attendance.assigned_contractor_id references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_attendance_assigned_contractor_id'
    AND table_name = 'daily_attendance'
  ) THEN
    ALTER TABLE daily_attendance 
    ADD CONSTRAINT fk_daily_attendance_assigned_contractor_id 
    FOREIGN KEY (assigned_contractor_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure daily_attendance.assigned_milestone_id references milestones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_attendance_assigned_milestone_id'
    AND table_name = 'daily_attendance'
  ) THEN
    ALTER TABLE daily_attendance 
    ADD CONSTRAINT fk_daily_attendance_assigned_milestone_id 
    FOREIGN KEY (assigned_milestone_id) REFERENCES milestones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure daily_attendance.approved_by references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_attendance_approved_by'
    AND table_name = 'daily_attendance'
  ) THEN
    ALTER TABLE daily_attendance 
    ADD CONSTRAINT fk_daily_attendance_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure daily_attendance.recorded_by references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_daily_attendance_recorded_by'
    AND table_name = 'daily_attendance'
  ) THEN
    ALTER TABLE daily_attendance 
    ADD CONSTRAINT fk_daily_attendance_recorded_by 
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- JOB APPLICATIONS TABLE
-- ============================================
-- Ensure job_applications.job_id references jobs (already in schema, but verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_job_applications_job_id'
    AND table_name = 'job_applications'
  ) THEN
    ALTER TABLE job_applications 
    ADD CONSTRAINT fk_job_applications_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure job_applications.employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_job_applications_employee_id'
    AND table_name = 'job_applications'
  ) THEN
    ALTER TABLE job_applications 
    ADD CONSTRAINT fk_job_applications_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Ensure profiles.user_id references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profiles_user_id'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- EMPLOYEE DOCUMENTS TABLE
-- ============================================
-- Ensure employee_documents.employee_id references employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_employee_documents_employee_id'
    AND table_name = 'employee_documents'
  ) THEN
    ALTER TABLE employee_documents 
    ADD CONSTRAINT fk_employee_documents_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- SYSTEM LOG TABLE
-- ============================================
-- Ensure system_log.user_id references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_system_log_user_id'
    AND table_name = 'system_log'
  ) THEN
    ALTER TABLE system_log 
    ADD CONSTRAINT fk_system_log_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- ORIENTATION CHECKLIST TABLE
-- ============================================
-- Ensure orientation_checklists.created_by references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_orientation_checklists_created_by'
    AND table_name = 'orientation_checklists'
  ) THEN
    ALTER TABLE orientation_checklists 
    ADD CONSTRAINT fk_orientation_checklists_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- FAVICON TABLE
-- ============================================
-- Ensure favicons.uploaded_by references users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_favicons_uploaded_by'
    AND table_name = 'favicons'
  ) THEN
    ALTER TABLE favicons 
    ADD CONSTRAINT fk_favicons_uploaded_by 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
