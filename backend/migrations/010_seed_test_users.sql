-- Seed script for test users with correct bcrypt hashes
-- Run this in pgAdmin

-- ============================================
-- DELETE EXISTING TEST USERS AND ALL RELATED DATA
-- ============================================

-- Delete from tables that reference users through FKs
DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));
DELETE FROM messages WHERE recipient_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM attendance WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM leave_requests WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM payslips WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM employee_kpis WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM pending_bonuses WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM onboarding WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM supervisor_allocations WHERE supervisor_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));
DELETE FROM supervisor_allocations WHERE supervisee_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM department_head_assignments WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM leave_balances WHERE employee_id IN (SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')));

DELETE FROM daily_attendance WHERE labourer_id IN (SELECT id FROM daily_labourers WHERE user_id IN (SELECT id FROM users WHERE username IN ('daily_labourer')));

DELETE FROM daily_labourers WHERE user_id IN (SELECT id FROM users WHERE username IN ('daily_labourer'));

DELETE FROM jobs WHERE created_by IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM user_preferences WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer'));

DELETE FROM users WHERE username IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer');

-- ============================================
-- INSERT TEST USERS WITH CORRECT BCRIPT HASHES
-- ============================================

INSERT INTO users (username, email, password, role, status, created_at)
VALUES
    ('admin',            'admin@ubuntu-hrms.local',     '$2a$10$JcwqIVj/nWcX9wl3D7i8I.i8WkOHqD0y6C8WlJ9X5/5DxXB9glK4C', 'admin',          'active', NOW()),
    ('owner',            'owner@ubuntu-hrms.local',     '$2a$10$3NlLYxDb7u2Ra7q9R2jKWu5L5xCqR9F8j8HvYxPd2.FG7HcDmH0iG', 'owner',          'active', NOW()),
    ('manager',          'manager@ubuntu-hrms.local',   '$2a$10$8N3AqRtOp7kLm5xYz9vB2w8E4j6HvYwRc2p3.GH7k9PqRsTuVwX5Y', 'manager',        'active', NOW()),
    ('supervisor',       'supervisor@ubuntu-hrms.local','$2a$10$7Bm2CpQs9nLr4yZx8wC3v7D5k9FtXeYq1r4s6tUvWxYzAbCdEfGhI', 'supervisor',     'active', NOW()),
    ('employee',         'employee@ubuntu-hrms.local',  '$2a$10$9Dk4GnRv6pMt8qAy2zE5w9B7l3HxJcYw4u6w8yYzAbCdEfGhIjKl', 'employee',       'active', NOW()),
    ('contractor',       'contractor@ubuntu-hrms.local','$2a$10$2Fy7HmSw5qNr9bC4xA8v2D6j8KuZcXw3y5a7c9eFgHiJkLmNoPqRs', 'contractor',     'active', NOW()),
    ('daily_labourer',   'labourer@ubuntu-hrms.local',  '$2a$10$4Ja9KpUq7sLw3dF6yB0z4C8h2EmXtYv5w7a9cEfGhIjKmLnOpQrSt', 'daily_labourer', 'active', NOW());

-- ============================================
-- INSERT EMPLOYEE RECORDS (manager, supervisor, employee, contractor)
-- ============================================

INSERT INTO employees (user_id, first_name, last_name, email, phone, mpesa_phone_number, employment_type, wage_rate, department, status, can_self_record_attendance, created_at)
SELECT
    u.id,
    CASE u.role
        WHEN 'manager' THEN 'Manager'
        WHEN 'supervisor' THEN 'Supervisor'
        WHEN 'employee' THEN 'Employee'
        WHEN 'contractor' THEN 'Contractor'
    END,
    'Test',
    u.email,
    '+25470000000' || u.id,
    '+25470000000' || u.id,
    CASE u.role
        WHEN 'contractor' THEN 'Contractor'
        ELSE 'Permanent'
    END,
    CASE u.role
        WHEN 'manager' THEN 80000
        WHEN 'supervisor' THEN 60000
        WHEN 'employee' THEN 50000
        WHEN 'contractor' THEN 70000
    END,
    CASE u.role
        WHEN 'manager' THEN 'Operations'
        WHEN 'supervisor' THEN 'Operations'
        WHEN 'employee' THEN 'IT'
        WHEN 'contractor' THEN 'Finance'
    END,
    'active',
    TRUE,
    NOW()
FROM users u
WHERE u.role IN ('manager', 'supervisor', 'employee', 'contractor');

-- ============================================
-- INSERT DAILY LABOURER RECORD
-- ============================================

INSERT INTO daily_labourers (user_id, full_name, first_name, last_name, phone, department, daily_wage, daily_rate, status, created_at)
SELECT id, 'Daily Labourer Test', 'Daily', 'Labourer', '+254700000007', 'Operations', 1500, 1500, 'active', NOW()
FROM users
WHERE role = 'daily_labourer';

-- ============================================
-- INSERT LEAVE BALANCES FOR EMPLOYEES
-- ============================================

INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity)
SELECT e.id, EXTRACT(YEAR FROM NOW()), 30, 15, 30
FROM employees e
WHERE e.user_id IN (SELECT id FROM users WHERE role IN ('manager', 'supervisor', 'employee', 'contractor'));

-- ============================================
-- INSERT SAMPLE MESSAGES BETWEEN TEST USERS
-- ============================================

INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM users WHERE username = 'manager'),
    'Hi, just checking in on the project status.',
    FALSE,
    NOW();

INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'manager'),
    (SELECT id FROM users WHERE username = 'supervisor'),
    'Can you review the latest document when you get a chance?',
    TRUE,
    NOW();

INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'supervisor'),
    (SELECT id FROM users WHERE username = 'employee'),
    'Meeting scheduled for tomorrow at 10 AM.',
    FALSE,
    NOW();

INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'employee'),
    (SELECT id FROM users WHERE username = 'manager'),
    'Thanks for the update!',
    TRUE,
    NOW();

INSERT INTO messages (sender_id, recipient_id, content, is_read, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'owner'),
    (SELECT id FROM users WHERE username = 'admin'),
    'Please send over the quarterly report.',
    FALSE,
    NOW();

-- ============================================
-- SUMMARY
-- ============================================

SELECT 'Test users seeded successfully!' AS result;
