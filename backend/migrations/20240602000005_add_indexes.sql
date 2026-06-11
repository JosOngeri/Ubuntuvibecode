-- Migration: Add performance indexes for common queries
-- Description: Adds indexes to improve query performance on frequently accessed columns
-- Date: 2024-06-02
-- Purpose: Optimize database performance for common patterns

-- ============================================
-- ATTENDANCE INDEXES
-- ============================================
-- Index for employee + date lookups (very common)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
ON attendance(employee_id, attendance_date);

-- Index for date range queries (reports)
CREATE INDEX IF NOT EXISTS idx_attendance_date 
ON attendance(attendance_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_attendance_status 
ON attendance(status);

-- ============================================
-- JOB APPLICATIONS INDEXES
-- ============================================
-- Index for job lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id 
ON job_applications(job_id);

-- Index for status filtering (shortlist, interviews)
CREATE INDEX IF NOT EXISTS idx_job_applications_status 
ON job_applications(status);

-- Index for email lookups (applicant tracking)
CREATE INDEX IF NOT EXISTS idx_job_applications_email 
ON job_applications(email);

-- Index for offer token lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_offer_token 
ON job_applications(offer_token) WHERE offer_token IS NOT NULL;

-- Composite index for shortlist queries
CREATE INDEX IF NOT EXISTS idx_job_applications_status_created 
ON job_applications(status, created_at DESC);

-- ============================================
-- JOBS INDEXES
-- ============================================
-- Index for status filtering (open/closed jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_status 
ON jobs(status);

-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_jobs_department 
ON jobs(department);

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_jobs_created_at 
ON jobs(created_at DESC);

-- ============================================
-- EMPLOYEES INDEXES
-- ============================================
-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_employees_department 
ON employees(department);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_employees_status 
ON employees(status);

-- Index for biometric device lookups (attendance)
CREATE INDEX IF NOT EXISTS idx_employees_biometric_device 
ON employees(biometric_device_id) WHERE biometric_device_id IS NOT NULL;

-- ============================================
-- PAYSLIPS INDEXES
-- ============================================
-- Index for employee + period lookups
CREATE INDEX IF NOT EXISTS idx_payslips_employee_period 
ON payslips(employee_id, period);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_payslips_status 
ON payslips(status);

-- Index for period lookups (payroll reports)
CREATE INDEX IF NOT EXISTS idx_payslips_period 
ON payslips(period);

-- ============================================
-- DAILY LABOURERS INDEXES
-- ============================================
-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_daily_labourers_department 
ON daily_labourers(department);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_daily_labourers_status 
ON daily_labourers(status);

-- Index for urgency level
CREATE INDEX IF NOT EXISTS idx_daily_labourers_urgency 
ON daily_labourers(urgency_level);

-- ============================================
-- DAILY ATTENDANCE INDEXES
-- ============================================
-- Index for labourer + date lookups
CREATE INDEX IF NOT EXISTS idx_daily_attendance_labourer_date 
ON daily_attendance(labourer_id, date);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date 
ON daily_attendance(date);

-- Index for approval status
CREATE INDEX IF NOT EXISTS idx_daily_attendance_approved 
ON daily_attendance(approved);

-- ============================================
-- LEAVE REQUESTS INDEXES
-- ============================================
-- Index for employee lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee 
ON leave_requests(employee_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_leave_requests_status 
ON leave_requests(status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates 
ON leave_requests(start_date, end_date);

-- ============================================
-- USERS INDEXES
-- ============================================
-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status 
ON users(status);

-- ============================================
-- NOTIFICATIONS INDEXES
-- ============================================
-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_id);

-- Index for read status
CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(is_read);

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created 
ON notifications(created_at DESC);

-- ============================================
-- AUDIT LOGS INDEXES
-- ============================================
-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON audit_logs(user_id);

-- Index for module filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_module 
ON audit_logs(module);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
ON audit_logs(created_at DESC);

-- ============================================
-- SETTINGS INDEXES
-- ============================================
-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_settings_category 
ON settings(category);

-- Index for active status
CREATE INDEX IF NOT EXISTS idx_settings_active 
ON settings(is_active) WHERE is_active = true;
