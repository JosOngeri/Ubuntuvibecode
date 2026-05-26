-- Cleanup all tables seeded by temporary_seed.sql
-- Preserves init-database.sql defaults (users 1-7, settings, shift_settings, leave_policies, favicons)
TRUNCATE TABLE user_preferences, component_settings, audit_logs, salary_reminders, messages, notifications, user_permission_overrides, department_head_assignments, supervisor_allocations, job_applications, jobs, orientation_checklists, onboarding, milestones, contractor_performance, invoices, projects, contractor_quotes, contracts, employee_documents, training, pending_bonuses, employee_kpis, kpi_definitions, leave_requests, leave_balances, payslips, payments, daily_attendance, attendance, assets, profiles, daily_labourers, employees RESTART IDENTITY CASCADE;

-- Delete seeded users (keep admin=1, owner=2, manager=3, supervisor=4, employee=5, contractor=6, daily_labourer=7)
DELETE FROM users WHERE id > 7;

-- Reset users sequence so new inserts start from id=8
SELECT setval('users_id_seq', 7, true);
