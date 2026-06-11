-- Ubuntu HRMS Seed Data Script
-- Run this after init-database.sql to populate with test data

-- Insert additional users
INSERT INTO users (username, email, password, role, status, must_change_password, created_at, updated_at)
VALUES
  ('manager1', 'manager1@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'manager', 'active', FALSE, NOW(), NOW()),
  ('manager2', 'manager2@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'manager', 'active', FALSE, NOW(), NOW()),
  ('supervisor1', 'supervisor1@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'supervisor', 'active', FALSE, NOW(), NOW()),
  ('supervisor2', 'supervisor2@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'supervisor', 'active', FALSE, NOW(), NOW()),
  ('supervisor3', 'supervisor3@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'supervisor', 'active', FALSE, NOW(), NOW()),
  ('employee1', 'employee1@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'employee', 'active', FALSE, NOW(), NOW()),
  ('employee2', 'employee2@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'employee', 'active', FALSE, NOW(), NOW()),
  ('employee3', 'employee3@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'employee', 'active', FALSE, NOW(), NOW()),
  ('employee4', 'employee4@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'employee', 'active', FALSE, NOW(), NOW()),
  ('employee5', 'employee5@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'employee', 'active', FALSE, NOW(), NOW()),
  ('contractor1', 'contractor1@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'contractor', 'active', FALSE, NOW(), NOW()),
  ('contractor2', 'contractor2@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'contractor', 'active', FALSE, NOW(), NOW()),
  ('daily1', 'daily1@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'daily_labourer', 'active', FALSE, NOW(), NOW()),
  ('daily2', 'daily2@ubuntu-hrms.com', '$2b$10$X7o6BvSyOqocYguUA6sutpuNZgFpfwMRDiTsICuS.ksjGq6C.s2', 'daily_labourer', 'active', FALSE, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Get user IDs for linking
DO $$
DECLARE
  manager_id BIGINT;
  manager2_id BIGINT;
  supervisor_id BIGINT;
  supervisor2_id BIGINT;
  supervisor3_id BIGINT;
  employee1_id BIGINT;
  employee2_id BIGINT;
  employee3_id BIGINT;
  employee4_id BIGINT;
  employee5_id BIGINT;
  contractor1_id BIGINT;
  contractor2_id BIGINT;
  daily1_id BIGINT;
  daily2_id BIGINT;
BEGIN
  SELECT id INTO manager_id FROM users WHERE username = 'manager1';
  SELECT id INTO manager2_id FROM users WHERE username = 'manager2';
  SELECT id INTO supervisor_id FROM users WHERE username = 'supervisor1';
  SELECT id INTO supervisor2_id FROM users WHERE username = 'supervisor2';
  SELECT id INTO supervisor3_id FROM users WHERE username = 'supervisor3';
  SELECT id INTO employee1_id FROM users WHERE username = 'employee1';
  SELECT id INTO employee2_id FROM users WHERE username = 'employee2';
  SELECT id INTO employee3_id FROM users WHERE username = 'employee3';
  SELECT id INTO employee4_id FROM users WHERE username = 'employee4';
  SELECT id INTO employee5_id FROM users WHERE username = 'employee5';
  SELECT id INTO contractor1_id FROM users WHERE username = 'contractor1';
  SELECT id INTO contractor2_id FROM users WHERE username = 'contractor2';
  SELECT id INTO daily1_id FROM users WHERE username = 'daily1';
  SELECT id INTO daily2_id FROM users WHERE username = 'daily2';

  -- Insert employees
  INSERT INTO employees (user_id, status, first_name, surname, email, phone, mpesa_phone_number, employment_type, wage_rate, department, date_joined, can_self_record_attendance)
  VALUES
    (employee1_id, 'active', 'John', 'Doe', 'john.doe@example.com', '+254712345678', '+254712345678', 'Permanent', 50000.00, 'IT', NOW() - INTERVAL '6 months', TRUE),
    (employee2_id, 'active', 'Jane', 'Smith', 'jane.smith@example.com', '+254712345679', '+254712345679', 'Permanent', 45000.00, 'HR', NOW() - INTERVAL '3 months', TRUE),
    (employee3_id, 'active', 'Robert', 'Taylor', 'robert.taylor@example.com', '+254712345686', '+254712345686', 'Permanent', 55000.00, 'Finance', NOW() - INTERVAL '1 year', TRUE),
    (employee4_id, 'active', 'Maria', 'Garcia', 'maria.garcia@example.com', '+254712345687', '+254712345687', 'Permanent', 47000.00, 'Marketing', NOW() - INTERVAL '5 months', TRUE),
    (employee5_id, 'active', 'Chris', 'Lee', 'chris.lee@example.com', '+254712345688', '+254712345688', 'Permanent', 52000.00, 'Operations', NOW() - INTERVAL '8 months', TRUE),
    (NULL, 'active', 'Mike', 'Johnson', 'mike.johnson@example.com', '+254712345680', '+254712345680', 'Contractor', 30000.00, 'Operations', NOW() - INTERVAL '1 year', TRUE),
    (NULL, 'active', 'Sarah', 'Williams', 'sarah.williams@example.com', '+254712345681', '+254712345681', 'Permanent', 55000.00, 'Finance', NOW() - INTERVAL '2 years', TRUE),
    (NULL, 'active', 'David', 'Brown', 'david.brown@example.com', '+254712345682', '+254712345682', 'Permanent', 48000.00, 'Sales', NOW() - INTERVAL '8 months', TRUE),
    (NULL, 'active', 'Emily', 'Davis', 'emily.davis@example.com', '+254712345683', '+254712345683', 'Permanent', 42000.00, 'Marketing', NOW() - INTERVAL '4 months', TRUE),
    (NULL, 'active', 'James', 'Miller', 'james.miller@example.com', '+254712345684', '+254712345684', 'Permanent', 52000.00, 'Kitchen', NOW() - INTERVAL '5 months', TRUE),
    (NULL, 'active', 'Lisa', 'Wilson', 'lisa.wilson@example.com', '+254712345685', '+254712345685', 'Permanent', 38000.00, 'Housekeeping', NOW() - INTERVAL '7 months', TRUE),
    (NULL, 'active', 'Kevin', 'Anderson', 'kevin.anderson@example.com', '+254712345689', '+254712345689', 'Permanent', 49000.00, 'IT', NOW() - INTERVAL '10 months', TRUE),
    (NULL, 'active', 'Amanda', 'Thomas', 'amanda.thomas@example.com', '+254712345690', '+254712345690', 'Permanent', 44000.00, 'HR', NOW() - INTERVAL '6 months', TRUE)
  ON CONFLICT DO NOTHING;
END $$;

-- Insert jobs
INSERT INTO jobs (title, description, department, employment_type, location, status, salary_range, requirements, responsibilities, benefits, application_deadline)
VALUES
  ('Software Developer', 'Develop and maintain web applications', 'IT', 'Permanent', 'Nairobi', 'open', '60000-80000', 'JavaScript, React, Node.js', 'Full-stack development', 'Health insurance, 20 days leave', NOW() + INTERVAL '30 days'),
  ('HR Manager', 'Manage human resources operations', 'HR', 'Permanent', 'Nairobi', 'open', '55000-70000', '5 years HR experience', 'Recruitment, payroll, employee relations', 'Health insurance, 20 days leave', NOW() + INTERVAL '30 days'),
  ('Sales Executive', 'Drive sales and revenue', 'Sales', 'Permanent', 'Nairobi', 'open', '45000-60000', 'Sales experience', 'Client acquisition, sales targets', 'Commission, health insurance', NOW() + INTERVAL '30 days'),
  ('Chef', 'Prepare meals for guests', 'Kitchen', 'Permanent', 'Nairobi', 'open', '40000-55000', 'Culinary certification', 'Meal preparation, kitchen management', 'Meals provided, accommodation', NOW() + INTERVAL '30 days'),
  ('Housekeeping Supervisor', 'Supervise housekeeping staff', 'Housekeeping', 'Permanent', 'Nairobi', 'open', '42000-58000', '3 years experience', 'Staff supervision, quality control', 'Health insurance, accommodation', NOW() + INTERVAL '30 days'),
  ('Accountant', 'Manage financial records and reports', 'Finance', 'Permanent', 'Nairobi', 'open', '50000-65000', 'CPA certification, 3 years experience', 'Financial reporting, budget management', 'Health insurance, pension plan', NOW() + INTERVAL '45 days'),
  ('Marketing Specialist', 'Develop marketing campaigns', 'Marketing', 'Permanent', 'Nairobi', 'open', '45000-60000', 'Digital marketing skills', 'Social media, content creation', 'Health insurance, flexible hours', NOW() + INTERVAL '60 days'),
  ('Security Guard', 'Ensure premises security', 'Security', 'Permanent', 'Nairobi', 'open', '35000-45000', 'Security certification', 'Patrol, access control', 'Uniform provided, overtime pay', NOW() + INTERVAL '20 days')
ON CONFLICT DO NOTHING;

-- Insert job applications
INSERT INTO job_applications (job_id, applicant_name, applicant_email, applicant_phone, cv_path, cover_letter, application_data, recruiter_announcement, status, applied_at)
VALUES
  (1, 'Peter Parker', 'peter.parker@example.com', '+254711122233', 'https://example.com/resume/peter.pdf', 'I am a passionate developer', '{"experience":"5 years","skills":["React","Node.js"]}'::jsonb, NULL, 'pending', NOW()),
  (1, 'Tony Stark', 'tony.stark@example.com', '+254711122234', 'https://example.com/resume/tony.pdf', 'I have extensive experience', '{"experience":"10 years","skills":["React","Node.js","Python"]}'::jsonb, NULL, 'pending', NOW()),
  (2, 'Natasha Romanoff', 'natasha@example.com', '+254711122235', 'https://example.com/resume/natasha.pdf', 'HR professional with 5 years experience', '{"experience":"5 years","skills":["Recruitment","Payroll"]}'::jsonb, NULL, 'pending', NOW()),
  (3, 'Steve Rogers', 'steve@example.com', '+254711122236', 'https://example.com/resume/steve.pdf', 'Experienced sales executive', '{"experience":"7 years","skills":["Sales","Marketing"]}'::jsonb, NULL, 'pending', NOW()),
  (4, 'Gordon Ramsay', 'gordon@example.com', '+254711122237', 'https://example.com/resume/gordon.pdf', 'Michelin-star chef with 20 years experience', '{"experience":"20 years","skills":["French Cuisine","Menu Planning"]}'::jsonb, NULL, 'pending', NOW()),
  (5, 'Monica Geller', 'monica@example.com', '+254711122238', 'https://example.com/resume/monica.pdf', 'Experienced in hospitality management', '{"experience":"8 years","skills":["Management","Customer Service"]}'::jsonb, NULL, 'pending', NOW()),
  (6, 'Bruce Wayne', 'bruce@example.com', '+254711122239', 'https://example.com/resume/bruce.pdf', 'CPA with financial management expertise', '{"experience":"12 years","skills":["Accounting","Financial Analysis"]}'::jsonb, NULL, 'pending', NOW()),
  (7, 'Clark Kent', 'clark@example.com', '+254711122240', 'https://example.com/resume/clark.pdf', 'Digital marketing specialist', '{"experience":"6 years","skills":["SEO","Social Media","Content"]}'::jsonb, NULL, 'pending', NOW()),
  (8, 'Diana Prince', 'diana@example.com', '+254711122241', 'https://example.com/resume/diana.pdf', 'Trained security professional', '{"experience":"5 years","skills":["Security","First Aid"]}'::jsonb, NULL, 'pending', NOW())
ON CONFLICT DO NOTHING;

-- Insert daily labourers
INSERT INTO daily_labourers (first_name, surname, phone, national_id, daily_rate, skills, status, registered_by, created_at, updated_at)
VALUES
  ('Tom', 'Mboya', '+254720000001', '12345678', 1500.00, ARRAY['Farming', 'Grounds'], 'active', 2, NOW(), NOW()),
  ('Mary', 'Wanjiku', '+254720000002', '12345679', 1500.00, ARRAY['Housekeeping', 'Cleaning'], 'active', 2, NOW(), NOW()),
  ('James', 'Ochieng', '+254720000003', '12345680', 1800.00, ARRAY['Construction', 'Maintenance'], 'active', 2, NOW(), NOW()),
  ('Grace', 'Achieng', '+254720000004', '12345681', 1500.00, ARRAY['Kitchen', 'Cooking'], 'active', 2, NOW(), NOW()),
  ('Peter', 'Kipkoech', '+254720000005', '12345682', 1600.00, ARRAY['Security', 'Guard'], 'active', 2, NOW(), NOW()),
  ('Hannah', 'Njeri', '+254720000006', '12345683', 1400.00, ARRAY['Gardening', 'Landscaping'], 'active', 2, NOW(), NOW()),
  ('Samuel', 'Korir', '+254720000007', '12345684', 1700.00, ARRAY['Plumbing', 'Electrical'], 'active', 2, NOW(), NOW()),
  ('Ruth', 'Wanjiku', '+254720000008', '12345685', 1500.00, ARRAY['Laundry', 'Ironing'], 'active', 2, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert attendance records for employees
DO $$
DECLARE
  emp_id BIGINT;
  date_val DATE;
  emp_rec RECORD;
BEGIN
  -- Insert attendance for all employees for last 30 days
  FOR emp_rec IN SELECT id, first_name FROM employees LIMIT 8
  LOOP
    FOR date_val IN SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day')::date
    LOOP
      INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, shift, created_at, updated_at)
      VALUES
        (emp_rec.id, date_val,
         CASE
           WHEN EXTRACT(DOW FROM date_val) IN (0, 6) THEN NULL
           WHEN emp_rec.first_name = 'Jane' AND date_val = CURRENT_DATE - INTERVAL '5 days' THEN (date_val || ' 09:30:00')::TIMESTAMPTZ
           WHEN emp_rec.first_name = 'Robert' AND date_val = CURRENT_DATE - INTERVAL '10 days' THEN (date_val || ' 09:15:00')::TIMESTAMPTZ
           ELSE (date_val || ' 08:00:00')::TIMESTAMPTZ
         END,
         CASE WHEN EXTRACT(DOW FROM date_val) IN (0, 6) THEN NULL ELSE (date_val || ' 17:00:00')::TIMESTAMPTZ END,
         CASE
           WHEN EXTRACT(DOW FROM date_val) IN (0, 6) THEN 'Leave'
           WHEN emp_rec.first_name = 'Jane' AND date_val = CURRENT_DATE - INTERVAL '5 days' THEN 'Late'
           WHEN emp_rec.first_name = 'Robert' AND date_val = CURRENT_DATE - INTERVAL '10 days' THEN 'Late'
           ELSE 'Present'
         END,
         'Morning', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert leave requests
DO $$
DECLARE
  emp_id BIGINT;
  emp_rec RECORD;
BEGIN
  -- Insert leave requests for multiple employees
  FOR emp_rec IN SELECT id, first_name FROM employees LIMIT 6
  LOOP
    IF emp_rec.first_name = 'John' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'annual', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '14 days', 'Family vacation', 'Pending', NOW(), NOW()),
        (emp_rec.id, 'sick', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '8 days', 'Medical appointment', 'Approved', NOW(), NOW());
    ELSIF emp_rec.first_name = 'Jane' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'maternity', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '70 days', 'Maternity leave', 'Approved', NOW(), NOW());
    ELSIF emp_rec.first_name = 'Robert' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'annual', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '21 days', 'Personal time', 'Approved', NOW(), NOW());
    ELSIF emp_rec.first_name = 'Maria' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'sick', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 'Flu', 'Approved', NOW(), NOW());
    ELSIF emp_rec.first_name = 'Chris' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'paternity', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '35 days', 'Paternity leave', 'Pending', NOW(), NOW());
    ELSIF emp_rec.first_name = 'Mike' THEN
      INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status, created_at, updated_at)
      VALUES
        (emp_rec.id, 'annual', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '25 days', 'Family event', 'Pending', NOW(), NOW());
    END IF;
  END LOOP;
END $$;

-- Insert leave balances for employees
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN SELECT id FROM employees
  LOOP
    INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity, created_at, updated_at)
    VALUES
      (emp.id, EXTRACT(YEAR FROM CURRENT_DATE), 21, 10, 90, NOW(), NOW())
    ON CONFLICT (employee_id, year) DO NOTHING;
  END LOOP;
END $$;

-- Insert daily attendance for daily labourers
DO $$
DECLARE
  labourer_id BIGINT;
  date_val DATE;
BEGIN
  FOR labourer_id IN SELECT id FROM daily_labourers LIMIT 3
  LOOP
    FOR date_val IN SELECT generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day')::date
    LOOP
      IF EXTRACT(DOW FROM date_val) NOT IN (0, 6) THEN
        INSERT INTO daily_attendance (labourer_id, date, check_in, check_out, status, assigned_to, wage_for_day, approved, created_at, updated_at)
        VALUES
          (labourer_id, date_val, (date_val || ' 08:00:00')::TIMESTAMPTZ, (date_val || ' 17:00:00')::TIMESTAMPTZ, 'present', 'Farm', 1500.00, TRUE, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Insert projects
INSERT INTO projects (name, contractor_id, status, due_date, created_at, updated_at)
VALUES
  ('Website Redesign', NULL, 'active', NOW() + INTERVAL '1 month', NOW(), NOW()),
  ('Mobile App Development', NULL, 'active', NOW() + INTERVAL '3 months', NOW(), NOW()),
  ('Office Renovation', NULL, 'completed', NOW() - INTERVAL '1 month', NOW(), NOW()),
  ('Security System Upgrade', NULL, 'active', NOW() + INTERVAL '2 months', NOW(), NOW()),
  ('Kitchen Equipment Upgrade', NULL, 'pending', NOW() + INTERVAL '4 months', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert KPI definitions
INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
VALUES
  ('Attendance Rate', 'Percentage of days attended', 100.0, NOW(), NOW()),
  ('Task Completion', 'Percentage of tasks completed on time', 100.0, NOW(), NOW()),
  ('Customer Satisfaction', 'Average customer satisfaction score', 5.0, NOW(), NOW()),
  ('Sales Target', 'Monthly sales revenue target', 100.0, NOW(), NOW()),
  ('Quality Score', 'Quality of work output rating', 10.0, NOW(), NOW()),
  ('Team Collaboration', 'Teamwork and collaboration rating', 10.0, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert employee KPIs
DO $$
DECLARE
  emp_id BIGINT;
  kpi_id BIGINT;
  evaluator_id BIGINT;
  emp_rec RECORD;
  kpi_rec RECORD;
BEGIN
  SELECT id INTO evaluator_id FROM users WHERE username = 'admin' LIMIT 1;

  -- Insert KPIs for multiple employees
  FOR emp_rec IN SELECT id, first_name FROM employees LIMIT 5
  LOOP
    FOR kpi_rec IN SELECT id, title FROM kpi_definitions LIMIT 4
    LOOP
      INSERT INTO employee_kpis (employee_id, evaluator_id, definition_id, target_value, achieved_value, period, created_at, updated_at)
      VALUES
        (emp_rec.id, evaluator_id, kpi_rec.id,
         CASE kpi_rec.title
           WHEN 'Attendance Rate' THEN 95.0
           WHEN 'Task Completion' THEN 90.0
           WHEN 'Customer Satisfaction' THEN 4.5
           WHEN 'Sales Target' THEN 100.0
           ELSE 80.0
         END,
         CASE kpi_rec.title
           WHEN 'Attendance Rate' THEN 92.5
           WHEN 'Task Completion' THEN 88.0
           WHEN 'Customer Satisfaction' THEN 4.2
           WHEN 'Sales Target' THEN 95.0
           ELSE 75.0
         END,
         '2025-05', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert shift settings
INSERT INTO shift_settings (employment_type, department, shift_name, start_time, end_time, is_default, created_at, updated_at)
VALUES
  ('Permanent', NULL, 'Morning', '08:00:00', '17:00:00', TRUE, NOW(), NOW()),
  ('Permanent', NULL, 'Afternoon', '12:00:00', '21:00:00', FALSE, NOW(), NOW()),
  ('Permanent', NULL, 'Night', '20:00:00', '05:00:00', FALSE, NOW(), NOW()),
  ('Contractor', NULL, 'Flexible', '09:00:00', '18:00:00', TRUE, NOW(), NOW()),
  ('Permanent', 'Kitchen', 'Breakfast Shift', '06:00:00', '14:00:00', FALSE, NOW(), NOW()),
  ('Permanent', 'Kitchen', 'Dinner Shift', '14:00:00', '23:00:00', FALSE, NOW(), NOW()),
  ('Permanent', 'Security', 'Day Watch', '07:00:00', '19:00:00', TRUE, NOW(), NOW()),
  ('Permanent', 'Security', 'Night Watch', '19:00:00', '07:00:00', FALSE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, status, channel, created_at)
VALUES
  (2, 'leave_request', 'New Leave Request', 'John Doe has requested annual leave from 2025-05-27 to 2025-06-03', 'pending', 'in_app', NOW()),
  (2, 'attendance', 'Late Arrival Alert', 'Jane Smith arrived late on 2025-05-15', 'pending', 'in_app', NOW()),
  (3, 'system', 'Welcome', 'Welcome to Ubuntu HRMS!', 'read', 'in_app', NOW()),
  (2, 'leave_request', 'Leave Approved', 'Mike Johnson annual leave approved', 'sent', 'in_app', NOW()),
  (2, 'attendance', 'Absent Alert', 'David Brown was absent without notice', 'pending', 'in_app', NOW()),
  (3, 'system', 'Profile Update', 'Your profile has been updated', 'read', 'in_app', NOW()),
  (4, 'leave_request', 'Maternity Leave', 'Jane Smith maternity leave approved', 'sent', 'in_app', NOW()),
  (5, 'kpi', 'KPI Review Due', 'Your KPI review is due this month', 'pending', 'in_app', NOW()),
  (6, 'system', 'Password Change', 'Password successfully changed', 'read', 'in_app', NOW())
ON CONFLICT DO NOTHING;

-- Insert profiles
DO $$
DECLARE
  user_id BIGINT;
BEGIN
  SELECT id INTO user_id FROM users WHERE username = 'employee1' LIMIT 1;

  INSERT INTO profiles (user_id, full_name, skills, certifications, created_at, updated_at)
  VALUES
    (user_id, 'John Doe', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'], ARRAY['AWS Certified Developer', 'Google Cloud Professional'], NOW(), NOW());

  SELECT id INTO user_id FROM users WHERE username = 'employee2' LIMIT 1;

  INSERT INTO profiles (user_id, full_name, skills, certifications, created_at, updated_at)
  VALUES
    (user_id, 'Jane Smith', ARRAY['Recruitment', 'Payroll', 'Employee Relations'], ARRAY['SHRM Certified', 'HR Management'], NOW(), NOW());
END $$;

-- Insert leave policies
INSERT INTO leave_policies (type, max_days, requires_attachment, auto_approve_initial, created_at, updated_at)
VALUES
  ('annual', 21, FALSE, FALSE, NOW(), NOW()),
  ('sick', 10, TRUE, TRUE, NOW(), NOW()),
  ('maternity', 90, TRUE, FALSE, NOW(), NOW()),
  ('paternity', 14, FALSE, FALSE, NOW(), NOW()),
  ('compassionate', 5, TRUE, TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert project assignments
DO $$
DECLARE
  emp_id BIGINT;
BEGIN
  SELECT id INTO emp_id FROM employees WHERE first_name = 'John' LIMIT 1;

  INSERT INTO project_assignments (employee_id, project_name, start_date, end_date, created_at)
  VALUES
    (emp_id, 'Website Redesign', NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 months', NOW());

  SELECT id INTO emp_id FROM employees WHERE first_name = 'Maria' LIMIT 1;
  INSERT INTO project_assignments (employee_id, project_name, start_date, end_date, created_at)
  VALUES
    (emp_id, 'Website Redesign', NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 months', NOW());

  SELECT id INTO emp_id FROM employees WHERE first_name = 'Kevin' LIMIT 1;
  INSERT INTO project_assignments (employee_id, project_name, start_date, end_date, created_at)
  VALUES
    (emp_id, 'Mobile App Development', NOW() - INTERVAL '1 week', NOW() + INTERVAL '3 months', NOW());
END $$;

-- Insert pay rates
INSERT INTO pay_rates (employee_id, base_rate, overtime_rate, created_at, updated_at)
VALUES
  (1, 50000.00, 625.00, NOW(), NOW()),
  (2, 45000.00, 562.50, NOW(), NOW()),
  (3, 55000.00, 687.50, NOW(), NOW()),
  (4, 47000.00, 587.50, NOW(), NOW()),
  (5, 52000.00, 650.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert payslips
DO $$
DECLARE
  emp_id BIGINT;
BEGIN
  FOR emp_id IN SELECT id FROM employees LIMIT 5
  LOOP
    INSERT INTO payslips (employee_id, period, gross_pay, overtime_pay, kpi_bonus, deductions, net_pay, status, payment_method, created_at, updated_at)
    VALUES
      (emp_id, '2025-04', 50000.00, 5000.00, 2000.00, 8000.00, 49000.00, 'Paid', 'MPESA', NOW() - INTERVAL '1 month', NOW());
  END LOOP;
END $$;

-- Insert invoices
INSERT INTO invoices (id, contractor_id, amount, status, due_date, created_at, updated_at)
VALUES
  ('INV001', NULL, 150000.00, 'paid', NOW() - INTERVAL '2 months', NOW() - INTERVAL '3 months', NOW()),
  ('INV002', NULL, 200000.00, 'pending', NOW() + INTERVAL '1 month', NOW() - INTERVAL '1 month', NOW()),
  ('INV003', NULL, 75000.00, 'draft', NOW() + INTERVAL '2 months', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert contractor performance
DO $$
DECLARE
  contractor_id BIGINT;
BEGIN
  SELECT id INTO contractor_id FROM users WHERE username = 'contractor1' LIMIT 1;
  INSERT INTO contractor_performance (contractor_id, delivery_rate, created_at)
  VALUES
    (contractor_id, 95.5, NOW())
  ON CONFLICT DO NOTHING;

  SELECT id INTO contractor_id FROM users WHERE username = 'contractor2' LIMIT 1;
  INSERT INTO contractor_performance (contractor_id, delivery_rate, created_at)
  VALUES
    (contractor_id, 92.0, NOW())
  ON CONFLICT DO NOTHING;
END $$;

-- Insert onboarding records
DO $$
DECLARE
  emp_id BIGINT;
  supervisor_id BIGINT;
BEGIN
  SELECT id INTO supervisor_id FROM users WHERE username = 'manager1' LIMIT 1;

  SELECT id INTO emp_id FROM employees WHERE first_name = 'John' LIMIT 1;
  INSERT INTO onboarding (employee_id, department, position, supervisor_id, probation_end_date, status, steps, documents, assets_assigned, probation_reviews, offer_letter_generated, confirmed_at)
  VALUES
    (emp_id, 'IT', 'Software Developer', supervisor_id, NOW() + INTERVAL '5 months', 'completed', '[{"task":"Orientation","completed":true},{"task":"IT Setup","completed":true},{"task":"Training","completed":true}]'::jsonb, '[{"type":"Contract","completed":true},{"type":"NDA","completed":true}]'::jsonb, '[{"item":"Laptop","assigned":true},{"item":"Monitor","assigned":true}]'::jsonb, '[{"month":1,"rating":"Excellent"},{"month":3,"rating":"Good"}]'::jsonb, TRUE, NOW() - INTERVAL '5 months 28 days');

  SELECT id INTO emp_id FROM employees WHERE first_name = 'Jane' LIMIT 1;
  INSERT INTO onboarding (employee_id, department, position, supervisor_id, probation_end_date, status, steps, documents, assets_assigned, probation_reviews, offer_letter_generated, confirmed_at)
  VALUES
    (emp_id, 'HR', 'HR Manager', supervisor_id, NOW() + INTERVAL '8 months', 'completed', '[{"task":"Orientation","completed":true},{"task":"HR System Access","completed":true}]'::jsonb, '[{"type":"Contract","completed":true}]'::jsonb, '[{"item":"Computer","assigned":true}]'::jsonb, '[{"month":1,"rating":"Good"}]'::jsonb, TRUE, NOW() - INTERVAL '2 months 25 days');

  SELECT id INTO emp_id FROM employees WHERE first_name = 'Robert' LIMIT 1;
  INSERT INTO onboarding (employee_id, department, position, supervisor_id, probation_end_date, status, steps, documents, assets_assigned, probation_reviews, offer_letter_generated, confirmed_at)
  VALUES
    (emp_id, 'Finance', 'Accountant', supervisor_id, NOW() + INTERVAL '11 months', 'completed', '[{"task":"Orientation","completed":true},{"task":"Finance System","completed":true}]'::jsonb, '[{"type":"Contract","completed":true}]'::jsonb, '[{"item":"Computer","assigned":true}]'::jsonb, '[{"month":1,"rating":"Excellent"}]'::jsonb, TRUE, NOW() - INTERVAL '11 months');
END $$;

COMMIT;
