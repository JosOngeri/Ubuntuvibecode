-- Ubuntu HRMS Rebuild — Seed Data
-- Database: UbuntuRebuild1

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (username, email, password, role, status) VALUES
('admin', 'admin@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'admin', 'active'),
('owner', 'owner@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'owner', 'active'),
('manager', 'manager@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'manager', 'active'),
('aleparan', 'andrew@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('chef', 'chef@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('ksteward', 'kitchen@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('waitress1', 'waitress1@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('waitress2', 'waitress2@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('masseuse', 'masseuse@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('masseuse_intern', 'masseuse_intern@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('photomusic', 'photo@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('groundsman', 'grounds@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('farmhand', 'farm@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('games', 'games@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('housekeeping', 'housekeeping@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('aleshan', 'alex@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('jleshan', 'jackson@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'employee', 'active'),
('labourer1', 'labourer1@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'daily_labourer', 'active'),
('labourer2', 'labourer2@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'daily_labourer', 'active'),
('labourer3', 'labourer3@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'daily_labourer', 'active'),
('contractor', 'contractor@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'contractor', 'active'),
('josiah', 'josiah@ubuntu.co.ke', '$2a$10$9a4f7c2d1e8b5f0a3c6d9e2f7b1a4c8d5e9f2a7c3d6b0f1e4a9c7d2f5b8e1a3', 'contractor', 'active');

-- ============================================================
-- EMPLOYEES
-- ============================================================
INSERT INTO employees (user_id, surname, first_name, phone, mpesa_phone_number, employment_type, wage_rate, department, date_joined) VALUES
((SELECT id FROM users WHERE username='aleparan' LIMIT 1), 'Leparan', 'Andrew', '0722123456', '0722123456', 'Permanent', 45000, 'Management', '2024-01-15'),
((SELECT id FROM users WHERE username='chef' LIMIT 1), 'Chef', 'Head', '0722123457', '0722123457', 'Permanent', 35000, 'Kitchen', '2024-02-01'),
((SELECT id FROM users WHERE username='ksteward' LIMIT 1), 'Steward', 'Kitchen', '0722123458', '0722123458', 'Permanent', 25000, 'Kitchen', '2024-03-10'),
((SELECT id FROM users WHERE username='waitress1' LIMIT 1), 'Waitress', 'Alice', '0722123459', '0722123459', 'Permanent', 20000, 'Service', '2024-04-05'),
((SELECT id FROM users WHERE username='waitress2' LIMIT 1), 'Waitress', 'Beth', '0722123460', '0722123460', 'Permanent', 20000, 'Service', '2024-04-15'),
((SELECT id FROM users WHERE username='masseuse' LIMIT 1), 'Masseuse', 'Sarah', '0722123461', '0722123461', 'Permanent', 30000, 'Spa', '2024-05-01'),
((SELECT id FROM users WHERE username='masseuse_intern' LIMIT 1), 'Intern', 'Masseuse', '0722123462', '0722123462', 'Permanent', 15000, 'Spa', '2024-06-01'),
((SELECT id FROM users WHERE username='photomusic' LIMIT 1), 'Music', 'Photo', '0722123463', '0722123463', 'Permanent', 28000, 'Entertainment', '2024-02-20'),
((SELECT id FROM users WHERE username='groundsman' LIMIT 1), 'Man', 'Grounds', '0722123464', '0722123464', 'Permanent', 22000, 'Grounds', '2024-03-15'),
((SELECT id FROM users WHERE username='farmhand' LIMIT 1), 'Hand', 'Farm', '0722123465', '0722123465', 'Permanent', 20000, 'Farm', '2024-04-01'),
((SELECT id FROM users WHERE username='games' LIMIT 1), 'Keeper', 'Games', '0722123466', '0722123466', 'Permanent', 18000, 'Entertainment', '2024-05-15'),
((SELECT id FROM users WHERE username='housekeeping' LIMIT 1), 'Keeper', 'House', '0722123467', '0722123467', 'Permanent', 22000, 'Housekeeping', '2024-03-20'),
((SELECT id FROM users WHERE username='aleshan' LIMIT 1), 'Leshan', 'Alex', '0722123468', '0722123468', 'Permanent', 18000, 'Security', '2024-06-01'),
((SELECT id FROM users WHERE username='jleshan' LIMIT 1), 'Leshan', 'Jackson', '0722123469', '0722123469', 'Permanent', 18000, 'Security', '2024-06-10');

-- ============================================================
-- DAILY LABOURERS
-- ============================================================
INSERT INTO daily_labourers (user_id, surname, first_name, phone, daily_rate, status) VALUES
((SELECT id FROM users WHERE username='labourer1' LIMIT 1), 'Labourer', 'Daily1', '0722123470', 600, 'active'),
((SELECT id FROM users WHERE username='labourer2' LIMIT 1), 'Labourer', 'Daily2', '0722123471', 600, 'active'),
((SELECT id FROM users WHERE username='labourer3' LIMIT 1), 'Labourer', 'Daily3', '0722123472', 600, 'active');

-- ============================================================
-- CONTRACTORS
-- ============================================================
INSERT INTO contractors (user_id, company_name, contact_person, phone, trade, status) VALUES
((SELECT id FROM users WHERE username='contractor' LIMIT 1), 'BuildRight Ltd', 'John Doe', '0722123473', 'Construction', 'active'),
((SELECT id FROM users WHERE username='josiah' LIMIT 1), 'Ongeri Services', 'Josiah Ongesi', '0722123474', 'General', 'active');

-- ============================================================
-- SETTINGS
-- ============================================================
INSERT INTO settings (setting_key, category, setting_value, description, data_type) VALUES
('departments', 'system', '["Management","Kitchen","Service","Spa","Entertainment","Grounds","Farm","Housekeeping","Security"]', 'Available departments', 'array'),
('employment_types', 'system', '["Daily","Contractor","Permanent"]', 'Employment types', 'array'),
('leave_types', 'system', '["Annual","Sick","Maternity","Paternity","Off-day","Compassionate","Study"]', 'Leave types', 'array'),
('punch_actions', 'system', '["checkIn","breakOut","breakIn","checkOut"]', 'Punch actions', 'array'),
('shift_start', 'shifts', '08:00', 'Default shift start time', 'string'),
('shift_end', 'shifts', '17:00', 'Default shift end time', 'string'),
('night_shift_start', 'shifts', '18:00', 'Night shift start time', 'string'),
('night_shift_end', 'shifts', '06:00', 'Night shift end time', 'string'),
('off_day_auto_approve', 'leave', 'true', 'Auto-approve off-day requests', 'boolean'),
('payroll_period', 'payroll', 'monthly', 'Payroll period', 'string'),
('payroll_day', 'payroll', '25', 'Payroll processing day', 'number');

-- ============================================================
-- LEAVE POLICIES
-- ============================================================
INSERT INTO leave_policies (leave_type, days_per_year, is_auto_approve, requires_balance, day_count_mode) VALUES
('Annual', 21, false, true, 'working_days'),
('Sick', 14, true, true, 'calendar_days'),
('Maternity', 90, true, false, 'calendar_days'),
('Paternity', 14, true, false, 'calendar_days'),
('Off-day', 0, true, false, 'calendar_days'),
('Compassionate', 7, true, false, 'calendar_days'),
('Study', 10, false, true, 'working_days');

-- ============================================================
-- KPI DEFINITIONS
-- ============================================================
INSERT INTO kpi_definitions (title, description, department, category, measurement_unit) VALUES
('Customer Satisfaction', 'Guest feedback score average', 'Service', 'Quality', 'percentage'),
('Attendance Rate', 'Monthly attendance percentage', 'All', 'Discipline', 'percentage'),
('Task Completion', 'Assigned tasks completed on time', 'All', 'Productivity', 'percentage'),
('Revenue Contribution', 'Direct revenue generation', 'Service', 'Performance', 'currency'),
('Safety Compliance', 'Adherence to safety protocols', 'All', 'Safety', 'percentage');

-- ============================================================
-- SAMPLE ATTENDANCE (May 2025 - May 22, 2026)
-- ============================================================
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, total_hours_worked, overtime_hours) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '2025-05-01', '2025-05-01 08:00:00', '2025-05-01 17:00:00', 'Present', 9, 1),
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '2025-05-02', '2025-05-02 08:00:00', '2025-05-02 17:00:00', 'Present', 9, 1),
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '2026-05-22', '2026-05-22 08:00:00', '2026-05-22 17:00:00', 'Present', 9, 1),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), '2026-05-22', '2026-05-22 07:00:00', '2026-05-22 16:00:00', 'Present', 9, 1),
((SELECT id FROM employees WHERE surname='Leshan' LIMIT 1), '2026-05-22', '2026-05-22 18:00:00', '2026-05-23 06:00:00', 'Present', 12, 4);

-- ============================================================
-- SAMPLE LEAVES
-- ============================================================
INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), 'Annual', '2025-08-01', '2025-08-07', 7, 'Family vacation', 'approved'),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), 'Sick', '2025-09-10', '2025-09-12', 3, 'Flu', 'approved'),
((SELECT id FROM employees WHERE surname='Leshan' LIMIT 1), 'Off-day', '2026-05-23', '2026-05-23', 1, 'Scheduled off-day', 'approved');

-- ============================================================
-- SAMPLE KPI
-- ============================================================
INSERT INTO kpi (employee_id, definition_title, period, target_value, achieved_value, score, status, due_date) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), 'Customer Satisfaction', '2025-Q3', 90, 92, 92, 'completed', '2025-09-30'),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), 'Attendance Rate', '2025-Q3', 95, 94, 94, 'completed', '2025-09-30'),
((SELECT id FROM employees WHERE surname='Leshan' LIMIT 1), 'Safety Compliance', '2025-Q3', 100, 100, 100, 'completed', '2025-09-30');

-- ============================================================
-- SAMPLE PAYROLL
-- ============================================================
INSERT INTO payroll (employee_id, period, period_start, period_end, basic_pay, overtime_pay, kpi_bonus, allowances, gross_pay, paye, nhif, nssf, total_deductions, net_pay, status) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '2025-08', '2025-08-01', '2025-08-31', 45000, 2000, 5000, 3000, 55000, 5500, 500, 1080, 7080, 47920, 'paid'),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), '2025-08', '2025-08-01', '2025-08-31', 35000, 1500, 3000, 2000, 41500, 4150, 500, 840, 5490, 36010, 'paid'),
((SELECT id FROM employees WHERE surname='Leshan' LIMIT 1), '2025-08', '2025-08-01', '2025-08-31', 18000, 3000, 1000, 1000, 23000, 2300, 500, 432, 3232, 19768, 'paid');

-- ============================================================
-- SAMPLE JOBS
-- ============================================================
INSERT INTO jobs (title, department, description, employment_type, salary_range, number_of_positions, status, posted_by) VALUES
('Spa Therapist', 'Spa', 'Experienced massage therapist with certification', 'Permanent', '25000-35000', 1, 'open', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
('Grounds Supervisor', 'Grounds', 'Supervise grounds maintenance team', 'Permanent', '20000-28000', 1, 'open', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
('Housekeeping Manager', 'Housekeeping', 'Manage housekeeping operations', 'Permanent', '25000-35000', 1, 'open', (SELECT id FROM users WHERE username='admin' LIMIT 1));

-- ============================================================
-- SAMPLE NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, is_read, channel, status) VALUES
((SELECT id FROM users WHERE username='aleparan' LIMIT 1), 'info', 'Welcome to Ubuntu HRMS', 'Your account has been created successfully.', false, 'in_app', 'sent'),
((SELECT id FROM users WHERE username='chef' LIMIT 1), 'alert', 'Leave Approved', 'Your sick leave request has been approved.', false, 'in_app', 'sent'),
((SELECT id FROM users WHERE username='manager' LIMIT 1), 'info', 'New Job Application', 'A new application has been received for Spa Therapist.', false, 'in_app', 'sent');

-- ============================================================
-- SAMPLE TRAINING
-- ============================================================
INSERT INTO training (title, description, department, start_date, end_date, status, created_by) VALUES
('Customer Service Excellence', 'Enhancing guest experience skills', 'Service', '2025-10-01', '2025-10-03', 'completed', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
('Safety Protocols', 'Workplace safety training', 'All', '2025-11-15', '2025-11-15', 'completed', (SELECT id FROM users WHERE username='admin' LIMIT 1));

-- ============================================================
-- SAMPLE COMPLAINTS
-- ============================================================
INSERT INTO complaints (type, category, description, urgency, status, submitted_by) VALUES
('guest', 'Service', 'Room service delayed by 2 hours', 'high', 'resolved', (SELECT id FROM users WHERE username='manager' LIMIT 1)),
('employee', 'Facilities', 'Air conditioning not working in staff room', 'medium', 'resolved', (SELECT id FROM users WHERE username='aleparan' LIMIT 1));

-- ============================================================
-- SAMPLE ASSETS
-- ============================================================
INSERT INTO assets (name, type, assigned_to, assigned_date, condition) VALUES
('Laptop', 'Equipment', (SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '2024-01-15', 'good'),
('Kitchen Mixer', 'Equipment', (SELECT id FROM employees WHERE surname='Chef' LIMIT 1), '2024-02-01', 'good'),
('Massage Table', 'Equipment', (SELECT id FROM employees WHERE surname='Masseuse' LIMIT 1), '2024-05-01', 'good');

-- ============================================================
-- SAMPLE CONTRACTS
-- ============================================================
INSERT INTO contracts (employee_id, contract_type, start_date, end_date, status, created_by) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), 'Permanent', '2024-01-15', '2025-01-14', 'renewed', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), 'Permanent', '2024-02-01', '2025-01-31', 'renewed', (SELECT id FROM users WHERE username='admin' LIMIT 1));

-- ============================================================
-- SAMPLE ORIENTATION CHECKLISTS
-- ============================================================
INSERT INTO orientation_checklists (employee_id, items, completed_by, completed_at) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), '[{"item":"Welcome meeting","completed":true},{"item":"IT setup","completed":true},{"item":"Safety briefing","completed":true}]', (SELECT id FROM users WHERE username='admin' LIMIT 1), '2024-01-20'),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), '[{"item":"Welcome meeting","completed":true},{"item":"Kitchen tour","completed":true},{"item":"Equipment training","completed":true}]', (SELECT id FROM users WHERE username='manager' LIMIT 1), '2024-02-05');

-- ============================================================
-- SAMPLE EMPLOYEE DOCUMENTS
-- ============================================================
INSERT INTO employee_documents (employee_id, document_type, document_number, verified, verified_by) VALUES
((SELECT id FROM employees WHERE surname='Leparan' LIMIT 1), 'national_id', '12345678', true, (SELECT id FROM users WHERE username='admin' LIMIT 1)),
((SELECT id FROM employees WHERE surname='Chef' LIMIT 1), 'national_id', '87654321', true, (SELECT id FROM users WHERE username='admin' LIMIT 1)),
((SELECT id FROM employees WHERE surname='Leshan' LIMIT 1), 'national_id', '11223344', true, (SELECT id FROM users WHERE username='admin' LIMIT 1));

-- ============================================================
-- SAMPLE CONTRACTOR QUOTES
-- ============================================================
INSERT INTO contractor_quotes (contractor_id, project_title, description, amount, status) VALUES
((SELECT id FROM contractors WHERE company_name='BuildRight Ltd' LIMIT 1), 'Main Building Renovation', 'Repair and paint main lodge building', 500000, 'approved'),
((SELECT id FROM contractors WHERE company_name='Ongeri Services' LIMIT 1), 'Landscaping Project', 'Redesign and plant garden areas', 150000, 'approved');

-- ============================================================
-- SAMPLE MILESTONES
-- ============================================================
INSERT INTO milestones (quote_id, contractor_id, title, description, deadline, budget, status) VALUES
((SELECT id FROM contractor_quotes WHERE project_title='Main Building Renovation' LIMIT 1), (SELECT id FROM contractors WHERE company_name='BuildRight Ltd' LIMIT 1), 'Phase 1: Roof Repair', 'Replace damaged roof tiles', '2025-07-30', 200000, 'completed'),
((SELECT id FROM contractor_quotes WHERE project_title='Main Building Renovation' LIMIT 1), (SELECT id FROM contractors WHERE company_name='BuildRight Ltd' LIMIT 1), 'Phase 2: Painting', 'Paint exterior walls', '2025-08-30', 300000, 'completed'),
((SELECT id FROM contractor_quotes WHERE project_title='Landscaping Project' LIMIT 1), (SELECT id FROM contractors WHERE company_name='Ongeri Services' LIMIT 1), 'Garden Design', 'Design new garden layout', '2025-06-30', 50000, 'completed'),
((SELECT id FROM contractor_quotes WHERE project_title='Landscaping Project' LIMIT 1), (SELECT id FROM contractors WHERE company_name='Ongeri Services' LIMIT 1), 'Planting', 'Plant trees and flowers', '2025-07-30', 100000, 'completed');

-- ============================================================
-- SAMPLE DAILY ATTENDANCE
-- ============================================================
INSERT INTO daily_attendance (labourer_id, attendance_date, check_in, check_out, assigned_to, wage_for_day, is_paid, status) VALUES
((SELECT id FROM daily_labourers WHERE surname='Labourer' AND first_name='Daily1' LIMIT 1), '2026-05-22', '2026-05-22 08:00:00', '2026-05-22 17:00:00', 'Farm', 600, false, 'present'),
((SELECT id FROM daily_labourers WHERE surname='Labourer' AND first_name='Daily2' LIMIT 1), '2026-05-22', '2026-05-22 08:00:00', '2026-05-22 17:00:00', 'Grounds', 600, false, 'present'),
((SELECT id FROM daily_labourers WHERE surname='Labourer' AND first_name='Daily3' LIMIT 1), '2026-05-22', '2026-05-22 08:00:00', '2026-05-22 17:00:00', 'Construction', 600, false, 'present');

-- ============================================================
-- SAMPLE PAYMENTS
-- ============================================================
INSERT INTO payments (payee_type, payee_id, amount, payment_method, status, processed_by) VALUES
('contractor', (SELECT id FROM contractors WHERE company_name='BuildRight Ltd' LIMIT 1), 500000, 'BANK', 'paid', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
('contractor', (SELECT id FROM contractors WHERE company_name='Ongeri Services' LIMIT 1), 150000, 'BANK', 'paid', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
('daily_labourer', (SELECT id FROM daily_labourers WHERE surname='Labourer' AND first_name='Daily1' LIMIT 1), 600, 'MPESA', 'paid', (SELECT id FROM users WHERE username='manager' LIMIT 1));

-- ============================================================
-- SAMPLE PROFILES
-- ============================================================
INSERT INTO profiles (user_id, bio, skills) VALUES
((SELECT id FROM users WHERE username='aleparan' LIMIT 1), 'Operations Manager with 10 years experience in hospitality', '["Leadership","Strategic Planning","Team Management"]'),
((SELECT id FROM users WHERE username='chef' LIMIT 1), 'Executive Chef specializing in Kenyan and international cuisine', '["Culinary Arts","Menu Planning","Kitchen Management"]'),
((SELECT id FROM users WHERE username='contractor' LIMIT 1), 'Construction company specializing in lodge renovations', '["Construction","Renovation","Project Management"]');
