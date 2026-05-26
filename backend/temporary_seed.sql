-- ============================================================
-- UBUNTU HRMS COMPREHENSIVE TEST SEED — PART 1 OF 3
-- Run AFTER init-database.sql
-- Passwords: role+"123" (e.g. employee123)
-- ============================================================

-- SECTION 1: ADDITIONAL USERS
INSERT INTO users (username, email, password, role, status, must_change_password, created_at, updated_at) VALUES
  ('emp_james',     'james.mwangi@ubuntu-hrms.com',  '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '12 months', NOW()),
  ('emp_amina',     'amina.hassan@ubuntu-hrms.com',  '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '10 months', NOW()),
  ('emp_brian',     'brian.otieno@ubuntu-hrms.com',  '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '8 months',  NOW()),
  ('emp_grace',     'grace.njeri@ubuntu-hrms.com',   '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '6 months',  NOW()),
  ('emp_david',     'david.kamau@ubuntu-hrms.com',   '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '4 months',  NOW()),
  ('emp_fatuma',    'fatuma.ali@ubuntu-hrms.com',    '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '3 months',  NOW()),
  ('emp_peter',     'peter.ouma@ubuntu-hrms.com',    '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '2 months',  NOW()),
  ('emp_mary',      'mary.wambua@ubuntu-hrms.com',   '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee',       'active', FALSE, NOW()-INTERVAL '1 month',   NOW()),
  ('sup_kevin',     'kevin.njoroge@ubuntu-hrms.com', '$2b$10$bAnSwUkoxBoufEjr6KFbIOmNGw3iP4nECZlgXBvH/n1kL.WITVNmm', 'supervisor',     'active', FALSE, NOW()-INTERVAL '14 months', NOW()),
  ('mgr_sarah',     'sarah.wanjiku@ubuntu-hrms.com', '$2b$10$Ql/8HBbuZZkjCPCuxlAfJeKp2m7gz9Y.cxnniMjWgLyHz/u9JlTea', 'manager',        'active', FALSE, NOW()-INTERVAL '18 months', NOW()),
  ('ctr_buildco',   'buildco@ubuntu-hrms.com',       '$2b$10$ayd07k5ScEBoQPwUJjvmuOeljRdlW9cropIZehmzzA6.mLnqpnIDG', 'contractor',     'active', FALSE, NOW()-INTERVAL '9 months',  NOW()),
  ('ctr_techworks', 'techworks@ubuntu-hrms.com',     '$2b$10$ayd07k5ScEBoQPwUJjvmuOeljRdlW9cropIZehmzzA6.mLnqpnIDG', 'contractor',     'active', FALSE, NOW()-INTERVAL '7 months',  NOW()),
  ('dl_john',       'john.odhiambo@ubuntu-hrms.com', '$2b$10$nnxolRc6C5Aela6XJpBF4OVIWKsajLUSQurLfBjL1Z5ESsZ0bMVLG', 'daily_labourer', 'active', FALSE, NOW()-INTERVAL '11 months', NOW()),
  ('dl_esther',     'esther.akinyi@ubuntu-hrms.com', '$2b$10$nnxolRc6C5Aela6XJpBF4OVIWKsajLUSQurLfBjL1Z5ESsZ0bMVLG', 'daily_labourer', 'active', FALSE, NOW()-INTERVAL '8 months',  NOW()),
  ('dl_samuel',     'samuel.barasa@ubuntu-hrms.com', '$2b$10$nnxolRc6C5Aela6XJpBF4OVIWKsajLUSQurLfBjL1Z5ESsZ0bMVLG', 'daily_labourer', 'active', FALSE, NOW()-INTERVAL '6 months',  NOW()),
  ('dl_mercy',      'mercy.chebet@ubuntu-hrms.com',  '$2b$10$nnxolRc6C5Aela6XJpBF4OVIWKsajLUSQurLfBjL1Z5ESsZ0bMVLG', 'daily_labourer', 'active', FALSE, NOW()-INTERVAL '3 months',  NOW());
-- user IDs after init: admin=1,owner=2,manager=3,supervisor=4,employee=5,contractor=6,daily_labourer=7
-- new users:  emp_james=8, emp_amina=9, emp_brian=10, emp_grace=11, emp_david=12, emp_fatuma=13
--             emp_peter=14, emp_mary=15, sup_kevin=16, mgr_sarah=17
--             ctr_buildco=18, ctr_techworks=19, dl_john=20, dl_esther=21, dl_samuel=22, dl_mercy=23

-- SECTION 2: EMPLOYEES
INSERT INTO employees (user_id,status,first_name,last_name,email,phone,employment_type,wage_rate,department,date_joined,date_of_birth,gender,marital_status,nationality,national_id,residential_address,emergency_contact,skills,experience_years,mpesa_phone_number,created_at,updated_at)
VALUES
(8, 'active','James','Mwangi','james.mwangi@ubuntu-hrms.com','0722100001','Full-time',85000,'Engineering',CURRENT_DATE-365,'1990-04-15','Male','Married','Kenyan','28901234','Westlands, Nairobi','{"name":"Jane Mwangi","phone":"0722200001","relationship":"Spouse"}','["Civil Engineering","AutoCAD","Project Management"]',8,'0722100001',NOW()-INTERVAL '12 months',NOW()),
(9, 'active','Amina','Hassan','amina.hassan@ubuntu-hrms.com','0733100002','Full-time',72000,'Finance',CURRENT_DATE-305,'1993-07-22','Female','Single','Kenyan','32456789','Kilimani, Nairobi','{"name":"Ibrahim Hassan","phone":"0733200002","relationship":"Father"}','["Accounting","QuickBooks","Financial Reporting"]',5,'0733100002',NOW()-INTERVAL '10 months',NOW()),
(10,'active','Brian','Otieno','brian.otieno@ubuntu-hrms.com','0700100003','Full-time',65000,'IT',CURRENT_DATE-244,'1995-02-10','Male','Single','Kenyan','35678901','Lavington, Nairobi','{"name":"Mary Otieno","phone":"0700200003","relationship":"Mother"}','["JavaScript","React","Node.js","PostgreSQL"]',4,'0700100003',NOW()-INTERVAL '8 months',NOW()),
(11,'active','Grace','Njeri','grace.njeri@ubuntu-hrms.com','0722100004','Full-time',58000,'Human Resources',CURRENT_DATE-183,'1992-11-30','Female','Married','Kenyan','29012345','Karen, Nairobi','{"name":"Tom Njeri","phone":"0722200004","relationship":"Husband"}','["HR Management","Recruitment","Employee Relations"]',6,'0722100004',NOW()-INTERVAL '6 months',NOW()),
(12,'active','David','Kamau','david.kamau@ubuntu-hrms.com','0733100005','Full-time',55000,'Operations',CURRENT_DATE-122,'1988-09-05','Male','Married','Kenyan','24567890','South B, Nairobi','{"name":"Ruth Kamau","phone":"0733200005","relationship":"Wife"}','["Operations Management","Logistics","Supply Chain"]',10,'0733100005',NOW()-INTERVAL '4 months',NOW()),
(13,'active','Fatuma','Ali','fatuma.ali@ubuntu-hrms.com','0700100006','Contract',45000,'Procurement',CURRENT_DATE-92,'1996-06-18','Female','Single','Kenyan','37890123','Parklands, Nairobi','{"name":"Ahmed Ali","phone":"0700200006","relationship":"Brother"}','["Procurement","Tender Management"]',3,'0700100006',NOW()-INTERVAL '3 months',NOW()),
(14,'active','Peter','Ouma','peter.ouma@ubuntu-hrms.com','0722100007','Full-time',52000,'Engineering',CURRENT_DATE-61,'1994-03-25','Male','Single','Kenyan','34321098','Ruaka, Nairobi','{"name":"Alice Ouma","phone":"0722200007","relationship":"Sister"}','["Site Supervision","AutoCAD","Construction Safety"]',5,'0722100007',NOW()-INTERVAL '2 months',NOW()),
(15,'active','Mary','Wambua','mary.wambua@ubuntu-hrms.com','0733100008','Part-time',32000,'Administration',CURRENT_DATE-30,'1998-12-01','Female','Single','Kenyan','40123456','Ngong Road, Nairobi','{"name":"Joseph Wambua","phone":"0733200008","relationship":"Father"}','["Administration","Scheduling","Customer Service"]',2,'0733100008',NOW()-INTERVAL '1 month',NOW()),
(16,'active','Kevin','Njoroge','kevin.njoroge@ubuntu-hrms.com','0700100009','Full-time',78000,'Engineering',CURRENT_DATE-426,'1987-08-12','Male','Married','Kenyan','22345678','Runda, Nairobi','{"name":"Esther Njoroge","phone":"0700200009","relationship":"Wife"}','["Team Leadership","Site Management","Safety Compliance"]',12,'0700100009',NOW()-INTERVAL '14 months',NOW()),
(17,'active','Sarah','Wanjiku','sarah.wanjiku@ubuntu-hrms.com','0722100010','Full-time',120000,'Management',CURRENT_DATE-548,'1985-01-20','Female','Married','Kenyan','19876543','Muthaiga, Nairobi','{"name":"John Wanjiku","phone":"0722200010","relationship":"Husband"}','["Strategic Management","Financial Planning","Business Development"]',15,'0722100010',NOW()-INTERVAL '18 months',NOW());

-- Seed profile for init employee (user_id=5)
INSERT INTO employees (user_id,status,first_name,last_name,email,phone,employment_type,wage_rate,department,date_joined,date_of_birth,gender,nationality,national_id,residential_address,emergency_contact,skills,experience_years,mpesa_phone_number,created_at,updated_at)
VALUES(5,'active','Default','Employee','employee@ubuntu-hrms.com','0700000001','Full-time',50000,'IT',CURRENT_DATE-730,'1991-05-15','Male','Kenyan','27000000','CBD, Nairobi','{"name":"Next Of Kin","phone":"0700000099","relationship":"Spouse"}','["IT Support","Networking"]',7,'0700000001',NOW()-INTERVAL '24 months',NOW());

-- SECTION 3: DAILY LABOURERS
INSERT INTO daily_labourers (user_id,full_name,phone,id_number,department,daily_wage,status,created_at,updated_at) VALUES
(20,'John Odhiambo', '0712300001','DL001234','construction',800,'active',NOW()-INTERVAL '11 months',NOW()),
(21,'Esther Akinyi', '0712300002','DL002345','housekeeping',700,'active',NOW()-INTERVAL '8 months', NOW()),
(22,'Samuel Barasa', '0712300003','DL003456','grounds',      750,'active',NOW()-INTERVAL '6 months', NOW()),
(23,'Mercy Chebet',  '0712300004','DL004567','kitchen',      700,'active',NOW()-INTERVAL '3 months', NOW());

-- SECTION 4: PROFILES
INSERT INTO profiles (user_id,full_name,photo_url,email,phone,address,date_of_birth,national_id,professional_headline,job_title,department,status,date_of_joining,employment_type,skills,created_at,updated_at)
VALUES
(8, 'James Mwangi', 'https://i.pravatar.cc/150?u=james', 'james.mwangi@ubuntu-hrms.com','0722100001','Westlands, Nairobi','1990-04-15','28901234','Senior Civil Engineer','Senior Engineer','Engineering','active',CURRENT_DATE-365,'Full-time','["AutoCAD","Project Management"]',NOW()-INTERVAL '12 months',NOW()),
(9, 'Amina Hassan',  'https://i.pravatar.cc/150?u=amina', 'amina.hassan@ubuntu-hrms.com','0733100002','Kilimani, Nairobi', '1993-07-22','32456789','Finance Officer',       'Finance Officer','Finance',     'active',CURRENT_DATE-305,'Full-time','["Accounting","QuickBooks"]',NOW()-INTERVAL '10 months',NOW()),
(10,'Brian Otieno',  'https://i.pravatar.cc/150?u=brian', 'brian.otieno@ubuntu-hrms.com','0700100003','Lavington, Nairobi','1995-02-10','35678901','Full Stack Developer',  'Software Dev',  'IT',          'active',CURRENT_DATE-244,'Full-time','["React","Node.js","PostgreSQL"]',NOW()-INTERVAL '8 months',NOW()),
(11,'Grace Njeri',   'https://i.pravatar.cc/150?u=grace', 'grace.njeri@ubuntu-hrms.com', '0722100004','Karen, Nairobi',    '1992-11-30','29012345','HR Business Partner',   'HR Officer',    'HR',          'active',CURRENT_DATE-183,'Full-time','["Recruitment","HRIS"]',NOW()-INTERVAL '6 months',NOW()),
(12,'David Kamau',   'https://i.pravatar.cc/150?u=david', 'david.kamau@ubuntu-hrms.com', '0733100005','South B, Nairobi',  '1988-09-05','24567890','Operations Manager',    'Ops Manager',   'Operations',  'active',CURRENT_DATE-122,'Full-time','["Logistics","ERP","Supply Chain"]',NOW()-INTERVAL '4 months',NOW()),
(16,'Kevin Njoroge', 'https://i.pravatar.cc/150?u=kevin', 'kevin.njoroge@ubuntu-hrms.com','0700100009','Runda, Nairobi',   '1987-08-12','22345678','Field Supervisor',       'Field Supervisor','Engineering','active',CURRENT_DATE-426,'Full-time','["Team Leadership","Safety"]',NOW()-INTERVAL '14 months',NOW()),
(17,'Sarah Wanjiku', 'https://i.pravatar.cc/150?u=sarah', 'sarah.wanjiku@ubuntu-hrms.com','0722100010','Muthaiga, Nairobi','1985-01-20','19876543','Senior Manager',         'Senior Manager','Management',  'active',CURRENT_DATE-548,'Full-time','["Strategic Planning","Finance"]',NOW()-INTERVAL '18 months',NOW());

-- SECTION 5: ASSETS
INSERT INTO assets (employee_id,name,category,serial_number,assigned_date,condition,status,created_at,updated_at)
VALUES
(1,'Dell Latitude 5520 Laptop',    'Electronics','DL552001',  CURRENT_DATE-365,'Good',    'active',NOW(),NOW()),
(1,'Safety Helmet (Blue)',          'PPE',        'SH-B-001',  CURRENT_DATE-365,'Good',    'active',NOW(),NOW()),
(2,'HP Laptop + Docking Station',  'Electronics','HP-DOCK-02',CURRENT_DATE-305,'Good',    'active',NOW(),NOW()),
(3,'MacBook Pro 14"',              'Electronics','MBP14-003', CURRENT_DATE-244,'Excellent','active',NOW(),NOW()),
(4,'Ergonomic Office Chair',       'Furniture',  'EOC-004',   CURRENT_DATE-183,'Good',    'active',NOW(),NOW()),
(5,'Site Survey Kit',              'Equipment',  'SSK-005',   CURRENT_DATE-122,'Good',    'active',NOW(),NOW()),
(6,'Company iPhone 13',           'Electronics','IP13-006',  CURRENT_DATE-92, 'Good',    'active',NOW(),NOW()),
(7,'AutoCAD Workstation',         'Electronics','CAD-007',   CURRENT_DATE-61, 'Good',    'active',NOW(),NOW()),
(8,'Standing Desk',               'Furniture',  'SD-008',    CURRENT_DATE-30, 'Excellent','active',NOW(),NOW()),
(9,'Field Tablet (Rugged)',        'Electronics','FT-009',    CURRENT_DATE-426,'Fair',    'active',NOW(),NOW()),
(10,'Company Toyota Hilux',       'Vehicle',    'KCA-100G',  CURRENT_DATE-548,'Good',    'active',NOW(),NOW()),
(1,'High-Vis Safety Vest',        'PPE',        'HV-001',    CURRENT_DATE-365,'Good',    'active',NOW(),NOW());

-- ============================================================
-- PART 2: ATTENDANCE, DAILY ATTENDANCE, PAYSLIPS, LEAVE
-- ============================================================

-- SECTION 6: EMPLOYEE ATTENDANCE (1 year for employees 1,9,10; from join date for rest)
-- Employee 1 (James, joined 365 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 1, d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)=0 THEN 'Absent' WHEN (EXTRACT(DOY FROM d)::int%15)=0 THEN 'Late' WHEN (EXTRACT(DOY FROM d)::int%25)=0 THEN 'Half-day' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '6 hours'+(CASE WHEN (EXTRACT(DOY FROM d)::int%15)=0 THEN INTERVAL '45 minutes' ELSE INTERVAL '5 minutes' END) END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 AND (EXTRACT(DOY FROM d)::int%25)!=0 THEN d+INTERVAL '14 hours 10 minutes' WHEN (EXTRACT(DOY FROM d)::int%25)=0 AND (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '10 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)=0 THEN NULL WHEN (EXTRACT(DOY FROM d)::int%25)=0 THEN 4.0 ELSE 8.1 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-365,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 2 (Amina, joined 305 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 2,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%18)=0 THEN 'Absent' WHEN (EXTRACT(DOY FROM d)::int%13)=0 THEN 'Late' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%18)!=0 THEN d+INTERVAL '6 hours 3 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%18)!=0 THEN d+INTERVAL '14 hours 5 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%18)!=0 THEN 8.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-305,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 3 (Brian, joined 244 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 3,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%22)=0 THEN 'Absent' WHEN (EXTRACT(DOY FROM d)::int%17)=0 THEN 'Late' ELSE 'Present' END,
  'Afternoon',
  CASE WHEN (EXTRACT(DOY FROM d)::int%22)!=0 THEN d+INTERVAL '14 hours 2 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%22)!=0 THEN d+INTERVAL '22 hours 8 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%22)!=0 THEN 8.1 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-244,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 4 (Grace, joined 183 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 4,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)=0 THEN 'Absent' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN d+INTERVAL '6 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN d+INTERVAL '14 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN 8.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-183,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 5 (David, joined 122 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 5,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)=0 THEN 'Absent' WHEN (EXTRACT(DOY FROM d)::int%10)=0 THEN 'Late' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '6 hours'+(CASE WHEN (EXTRACT(DOY FROM d)::int%10)=0 THEN INTERVAL '30 minutes' ELSE INTERVAL '0' END) END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '14 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN 8.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-122,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 6 (Fatuma, joined 92 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 6,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%25)=0 THEN 'Absent' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%25)!=0 THEN d+INTERVAL '6 hours 5 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%25)!=0 THEN d+INTERVAL '14 hours 5 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%25)!=0 THEN 8.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-92,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 7 (Peter, joined 61 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 7,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)=0 THEN 'Absent' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN d+INTERVAL '6 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN d+INTERVAL '14 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%30)!=0 THEN 8.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-61,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 8 (Mary, part-time, joined 30 days ago)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 8,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)=0 THEN 'Absent' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '6 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN d+INTERVAL '10 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%20)!=0 THEN 4.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-30,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 9 (Kevin/Supervisor, joined 426 days ago, full year window)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 9,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%28)=0 THEN 'Absent' WHEN (EXTRACT(DOY FROM d)::int%14)=0 THEN 'Late' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%28)!=0 THEN d+INTERVAL '6 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%28)!=0 THEN d+INTERVAL '14 hours 30 minutes' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%28)!=0 THEN 8.5 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-365,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- Employee 10 (Sarah/Manager, joined 548 days ago, full year window)
INSERT INTO attendance (employee_id,attendance_date,status,shift,check_in,check_out,total_hours_worked,created_at,updated_at)
SELECT 10,d::DATE,
  CASE WHEN (EXTRACT(DOY FROM d)::int%35)=0 THEN 'Absent' ELSE 'Present' END,
  'Morning',
  CASE WHEN (EXTRACT(DOY FROM d)::int%35)!=0 THEN d+INTERVAL '7 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%35)!=0 THEN d+INTERVAL '17 hours' END,
  CASE WHEN (EXTRACT(DOY FROM d)::int%35)!=0 THEN 10.0 END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-365,CURRENT_DATE-1,'1 day') d WHERE EXTRACT(DOW FROM d) NOT IN (0,6);

-- SECTION 7: DAILY ATTENDANCE (Daily Labourers with no-work weeks)
-- Labourer 1 (John, 3 no-work weeks: ~300 days ago, ~200 days ago, ~100 days ago)
INSERT INTO daily_attendance (labourer_id,date,check_in,check_out,status,notes,created_at,updated_at)
SELECT 1,d::DATE,
  CASE WHEN d BETWEEN CURRENT_DATE-306 AND CURRENT_DATE-300 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-206 AND CURRENT_DATE-200 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-106 AND CURRENT_DATE-100 THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '7 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-306 AND CURRENT_DATE-300 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-206 AND CURRENT_DATE-200 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-106 AND CURRENT_DATE-100 THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '16 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-306 AND CURRENT_DATE-300 THEN 'No Work'
       WHEN d BETWEEN CURRENT_DATE-206 AND CURRENT_DATE-200 THEN 'No Work'
       WHEN d BETWEEN CURRENT_DATE-106 AND CURRENT_DATE-100 THEN 'No Work'
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN 'Weekend'
       ELSE 'Present' END,
  CASE WHEN d BETWEEN CURRENT_DATE-306 AND CURRENT_DATE-300 THEN 'Site shutdown — no work available'
       WHEN d BETWEEN CURRENT_DATE-206 AND CURRENT_DATE-200 THEN 'Rain delay — construction halted'
       WHEN d BETWEEN CURRENT_DATE-106 AND CURRENT_DATE-100 THEN 'Material shortage — work paused'
       ELSE NULL END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-335,CURRENT_DATE-1,'1 day') d;

-- Labourer 2 (Esther, 2 no-work weeks)
INSERT INTO daily_attendance (labourer_id,date,check_in,check_out,status,notes,created_at,updated_at)
SELECT 2,d::DATE,
  CASE WHEN d BETWEEN CURRENT_DATE-220 AND CURRENT_DATE-214 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-80  AND CURRENT_DATE-74  THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '7 hours 30 minutes' END,
  CASE WHEN d BETWEEN CURRENT_DATE-220 AND CURRENT_DATE-214 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-80  AND CURRENT_DATE-74  THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '15 hours 30 minutes' END,
  CASE WHEN d BETWEEN CURRENT_DATE-220 AND CURRENT_DATE-214 THEN 'No Work'
       WHEN d BETWEEN CURRENT_DATE-80  AND CURRENT_DATE-74  THEN 'No Work'
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN 'Weekend'
       ELSE 'Present' END,
  CASE WHEN d BETWEEN CURRENT_DATE-220 AND CURRENT_DATE-214 THEN 'Facility deep cleaning — housekeeping suspended'
       WHEN d BETWEEN CURRENT_DATE-80  AND CURRENT_DATE-74  THEN 'Public holiday extension — no work assigned'
       ELSE NULL END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-244,CURRENT_DATE-1,'1 day') d;

-- Labourer 3 (Samuel, 2 no-work weeks)
INSERT INTO daily_attendance (labourer_id,date,check_in,check_out,status,notes,created_at,updated_at)
SELECT 3,d::DATE,
  CASE WHEN d BETWEEN CURRENT_DATE-160 AND CURRENT_DATE-154 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-50  AND CURRENT_DATE-44  THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '7 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-160 AND CURRENT_DATE-154 THEN NULL
       WHEN d BETWEEN CURRENT_DATE-50  AND CURRENT_DATE-44  THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '15 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-160 AND CURRENT_DATE-154 THEN 'No Work'
       WHEN d BETWEEN CURRENT_DATE-50  AND CURRENT_DATE-44  THEN 'No Work'
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN 'Weekend'
       ELSE 'Present' END,
  CASE WHEN d BETWEEN CURRENT_DATE-160 AND CURRENT_DATE-154 THEN 'Grounds equipment maintenance — no work'
       WHEN d BETWEEN CURRENT_DATE-50  AND CURRENT_DATE-44  THEN 'Annual leave period — no casual labor needed'
       ELSE NULL END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-183,CURRENT_DATE-1,'1 day') d;

-- Labourer 4 (Mercy, 1 no-work week)
INSERT INTO daily_attendance (labourer_id,date,check_in,check_out,status,notes,created_at,updated_at)
SELECT 4,d::DATE,
  CASE WHEN d BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-54 THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '8 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-54 THEN NULL
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN NULL
       ELSE d+INTERVAL '16 hours' END,
  CASE WHEN d BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-54 THEN 'No Work'
       WHEN EXTRACT(DOW FROM d) IN (0,6) THEN 'Weekend'
       ELSE 'Present' END,
  CASE WHEN d BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-54 THEN 'Kitchen renovation — kitchen staff not required' ELSE NULL END,
  NOW(),NOW()
FROM generate_series(CURRENT_DATE-92,CURRENT_DATE-1,'1 day') d;

-- SECTION 8: LABOURER PAYMENTS
INSERT INTO payments (labourer_id,period_start,period_end,amount,payment_type,status,payment_date,mpesa_receipt,notes,created_at,updated_at) VALUES
(1,CURRENT_DATE-42,CURRENT_DATE-36,3200,'mpesa','paid',CURRENT_DATE-35,'QHYL100001','Weekly wages',NOW(),NOW()),
(1,CURRENT_DATE-35,CURRENT_DATE-29,3200,'mpesa','paid',CURRENT_DATE-28,'QHYL100002','Weekly wages',NOW(),NOW()),
(1,CURRENT_DATE-28,CURRENT_DATE-22,0,   'mpesa','paid',CURRENT_DATE-21,NULL,         'No work week — site shutdown',NOW(),NOW()),
(1,CURRENT_DATE-21,CURRENT_DATE-15,3200,'mpesa','paid',CURRENT_DATE-14,'QHYL100004','Weekly wages',NOW(),NOW()),
(1,CURRENT_DATE-14,CURRENT_DATE-8, 3200,'mpesa','paid',CURRENT_DATE-7, 'QHYL100005','Weekly wages',NOW(),NOW()),
(1,CURRENT_DATE-7, CURRENT_DATE-1, 3200,'mpesa','pending',NULL,NULL,              'Pending disbursement',NOW(),NOW()),
(2,CURRENT_DATE-35,CURRENT_DATE-29,2800,'mpesa','paid',CURRENT_DATE-28,'QHYL200001','Weekly wages',NOW(),NOW()),
(2,CURRENT_DATE-28,CURRENT_DATE-22,0,   'mpesa','paid',CURRENT_DATE-21,NULL,         'No work week — housekeeping suspended',NOW(),NOW()),
(2,CURRENT_DATE-21,CURRENT_DATE-15,2800,'mpesa','paid',CURRENT_DATE-14,'QHYL200003','Weekly wages',NOW(),NOW()),
(2,CURRENT_DATE-14,CURRENT_DATE-8, 2800,'mpesa','paid',CURRENT_DATE-7, 'QHYL200004','Weekly wages',NOW(),NOW()),
(2,CURRENT_DATE-7, CURRENT_DATE-1, 2800,'mpesa','pending',NULL,NULL,              'Pending',NOW(),NOW()),
(3,CURRENT_DATE-28,CURRENT_DATE-22,3000,'mpesa','paid',CURRENT_DATE-21,'QHYL300001','Weekly wages',NOW(),NOW()),
(3,CURRENT_DATE-21,CURRENT_DATE-15,3000,'mpesa','paid',CURRENT_DATE-14,'QHYL300002','Weekly wages',NOW(),NOW()),
(3,CURRENT_DATE-14,CURRENT_DATE-8, 3000,'mpesa','paid',CURRENT_DATE-7, 'QHYL300003','Weekly wages',NOW(),NOW()),
(3,CURRENT_DATE-7, CURRENT_DATE-1, 3000,'mpesa','pending',NULL,NULL,              'Pending',NOW(),NOW()),
(4,CURRENT_DATE-14,CURRENT_DATE-8, 2800,'mpesa','paid',CURRENT_DATE-7, 'QHYL400001','Weekly wages',NOW(),NOW()),
(4,CURRENT_DATE-7, CURRENT_DATE-1, 2800,'mpesa','pending',NULL,NULL,              'Pending',NOW(),NOW());

-- SECTION 9: EMPLOYEE PAYSLIPS
INSERT INTO payslips (employee_id,period,gross_pay,overtime_pay,kpi_bonus,deductions,net_pay,status,payment_method,payment_reference,disbursed_at,created_at,updated_at) VALUES
(1,'2025-06',85000,3200,5000,'{"NHIF":1700,"NSSF":1080,"PAYE":18500,"loan":5000}',67920,'Disbursed','MPESA','PAY-2506-001',NOW()-INTERVAL '11 months',NOW()-INTERVAL '11 months',NOW()),
(1,'2025-07',85000,1500,0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            64220,'Disbursed','MPESA','PAY-2507-001',NOW()-INTERVAL '10 months',NOW()-INTERVAL '10 months',NOW()),
(1,'2025-08',85000,4800,5000,'{"NHIF":1700,"NSSF":1080,"PAYE":18500,"loan":5000}',68720,'Disbursed','MPESA','PAY-2508-001',NOW()-INTERVAL '9 months', NOW()-INTERVAL '9 months', NOW()),
(1,'2025-09',85000,0,   0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            63720,'Disbursed','MPESA','PAY-2509-001',NOW()-INTERVAL '8 months', NOW()-INTERVAL '8 months', NOW()),
(1,'2025-10',85000,2200,0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            65920,'Disbursed','MPESA','PAY-2510-001',NOW()-INTERVAL '7 months', NOW()-INTERVAL '7 months', NOW()),
(1,'2025-11',85000,3600,7500,'{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            74820,'Disbursed','MPESA','PAY-2511-001',NOW()-INTERVAL '6 months', NOW()-INTERVAL '6 months', NOW()),
(1,'2025-12',85000,5000,0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            68720,'Disbursed','MPESA','PAY-2512-001',NOW()-INTERVAL '5 months', NOW()-INTERVAL '5 months', NOW()),
(1,'2026-01',85000,0,   5000,'{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            68720,'Disbursed','MPESA','PAY-2601-001',NOW()-INTERVAL '4 months', NOW()-INTERVAL '4 months', NOW()),
(1,'2026-02',85000,1200,0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            64920,'Disbursed','MPESA','PAY-2602-001',NOW()-INTERVAL '3 months', NOW()-INTERVAL '3 months', NOW()),
(1,'2026-03',85000,2800,5000,'{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            69620,'Disbursed','MPESA','PAY-2603-001',NOW()-INTERVAL '2 months', NOW()-INTERVAL '2 months', NOW()),
(1,'2026-04',85000,0,   0,   '{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            63720,'Disbursed','MPESA','PAY-2604-001',NOW()-INTERVAL '1 month',  NOW()-INTERVAL '1 month',  NOW()),
(1,'2026-05',85000,1500,5000,'{"NHIF":1700,"NSSF":1080,"PAYE":18500}',            69220,'Draft',    'MPESA',NULL,NULL,NOW(),NOW()),
(2,'2025-09',72000,1800,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            55020,'Disbursed','MPESA','PAY-2509-002',NOW()-INTERVAL '8 months', NOW()-INTERVAL '8 months', NOW()),
(2,'2025-10',72000,0,   3500,'{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            59820,'Disbursed','MPESA','PAY-2510-002',NOW()-INTERVAL '7 months', NOW()-INTERVAL '7 months', NOW()),
(2,'2025-11',72000,2200,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            57520,'Disbursed','MPESA','PAY-2511-002',NOW()-INTERVAL '6 months', NOW()-INTERVAL '6 months', NOW()),
(2,'2025-12',72000,0,   0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            55220,'Disbursed','MPESA','PAY-2512-002',NOW()-INTERVAL '5 months', NOW()-INTERVAL '5 months', NOW()),
(2,'2026-01',72000,0,   3500,'{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            58720,'Disbursed','MPESA','PAY-2601-002',NOW()-INTERVAL '4 months', NOW()-INTERVAL '4 months', NOW()),
(2,'2026-02',72000,900, 0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            56120,'Disbursed','MPESA','PAY-2602-002',NOW()-INTERVAL '3 months', NOW()-INTERVAL '3 months', NOW()),
(2,'2026-03',72000,0,   0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            55220,'Disbursed','MPESA','PAY-2603-002',NOW()-INTERVAL '2 months', NOW()-INTERVAL '2 months', NOW()),
(2,'2026-04',72000,1500,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            56720,'Disbursed','MPESA','PAY-2604-002',NOW()-INTERVAL '1 month',  NOW()-INTERVAL '1 month',  NOW()),
(2,'2026-05',72000,0,   0,   '{"NHIF":1500,"NSSF":1080,"PAYE":14200}',            55220,'Draft',    'MPESA',NULL,NULL,NOW(),NOW()),
(3,'2025-11',65000,2000,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            50620,'Disbursed','MPESA','PAY-2511-003',NOW()-INTERVAL '6 months', NOW()-INTERVAL '6 months', NOW()),
(3,'2025-12',65000,3200,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            50820,'Disbursed','MPESA','PAY-2512-003',NOW()-INTERVAL '5 months', NOW()-INTERVAL '5 months', NOW()),
(3,'2026-01',65000,0,   4000,'{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            54620,'Disbursed','MPESA','PAY-2601-003',NOW()-INTERVAL '4 months', NOW()-INTERVAL '4 months', NOW()),
(3,'2026-02',65000,0,   0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            50620,'Disbursed','MPESA','PAY-2602-003',NOW()-INTERVAL '3 months', NOW()-INTERVAL '3 months', NOW()),
(3,'2026-03',65000,1500,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            52120,'Disbursed','MPESA','PAY-2603-003',NOW()-INTERVAL '2 months', NOW()-INTERVAL '2 months', NOW()),
(3,'2026-04',65000,0,   0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            50620,'Disbursed','MPESA','PAY-2604-003',NOW()-INTERVAL '1 month',  NOW()-INTERVAL '1 month',  NOW()),
(3,'2026-05',65000,2200,0,   '{"NHIF":1500,"NSSF":1080,"PAYE":11800}',            52820,'Draft',    'MPESA',NULL,NULL,NOW(),NOW()),
(9,'2026-04',78000,4200,7800,'{"NHIF":1700,"NSSF":1080,"PAYE":16400}',            70820,'Disbursed','MPESA','PAY-2604-009',NOW()-INTERVAL '1 month',  NOW()-INTERVAL '1 month',  NOW()),
(9,'2026-05',78000,2100,0,   '{"NHIF":1700,"NSSF":1080,"PAYE":16400}',            60820,'Draft',    'MPESA',NULL,NULL,NOW(),NOW()),
(10,'2026-04',120000,0,18000,'{"NHIF":1700,"NSSF":1080,"PAYE":35000}',            102220,'Disbursed','MPESA','PAY-2604-010',NOW()-INTERVAL '1 month',NOW()-INTERVAL '1 month',NOW()),
(10,'2026-05',120000,0,0,    '{"NHIF":1700,"NSSF":1080,"PAYE":35000}',             82220,'Draft',    'MPESA',NULL,NULL,NOW(),NOW());

-- SECTION 10: LEAVE BALANCES
INSERT INTO leave_balances (employee_id,year,annual,sick,maternity_paternity,carried_forward_annual,annual_lapsed,created_at,updated_at) VALUES
(1,2025,22,10,0,3,0,NOW(),NOW()),(1,2026,18,15,0,5,2,NOW(),NOW()),
(2,2025,25,12,0,0,0,NOW(),NOW()),(2,2026,20,15,0,5,0,NOW(),NOW()),
(3,2025,28,15,0,0,0,NOW(),NOW()),(3,2026,22,15,0,2,0,NOW(),NOW()),
(4,2026,15,15,0,0,0,NOW(),NOW()),
(5,2026,10,15,0,0,0,NOW(),NOW()),
(6,2026,8,15,0,0,0,NOW(),NOW()),
(7,2026,5,15,0,0,0,NOW(),NOW()),
(8,2026,3,15,0,0,0,NOW(),NOW()),
(9,2025,20,12,0,5,0,NOW(),NOW()),(9,2026,18,15,0,3,0,NOW(),NOW()),
(10,2025,30,15,0,5,0,NOW(),NOW()),(10,2026,25,15,0,5,0,NOW(),NOW())
ON CONFLICT (employee_id,year) DO NOTHING;

-- SECTION 11: LEAVE REQUESTS
INSERT INTO leave_requests (employee_id,type,start_date,end_date,reason,status,documentation_submitted,days_charged,created_at,updated_at) VALUES
(1,'annual',   CURRENT_DATE-200,CURRENT_DATE-195,'Family vacation to Mombasa',                  'Approved',TRUE,5, NOW()-INTERVAL '210 days',NOW()),
(1,'sick',     CURRENT_DATE-150,CURRENT_DATE-148,'Flu and high fever',                           'Approved',FALSE,3,NOW()-INTERVAL '152 days',NOW()),
(1,'annual',   CURRENT_DATE-80, CURRENT_DATE-76, 'Personal errands',                            'Approved',TRUE,4, NOW()-INTERVAL '85 days', NOW()),
(2,'annual',   CURRENT_DATE-170,CURRENT_DATE-165,'Wedding attendance in Kisumu',                 'Approved',TRUE,5, NOW()-INTERVAL '175 days',NOW()),
(2,'maternity',CURRENT_DATE-60, CURRENT_DATE+30, 'Maternity leave',                             'Approved',TRUE,90,NOW()-INTERVAL '70 days', NOW()),
(3,'annual',   CURRENT_DATE-120,CURRENT_DATE-116,'Rest and recreation',                         'Approved',FALSE,4,NOW()-INTERVAL '125 days',NOW()),
(3,'sick',     CURRENT_DATE-30, CURRENT_DATE-28, 'Malaria treatment',                           'Approved',FALSE,3,NOW()-INTERVAL '32 days', NOW()),
(4,'annual',   CURRENT_DATE-20, CURRENT_DATE-16, 'Short break after joining',                   'Approved',TRUE,4, NOW()-INTERVAL '25 days', NOW()),
(5,'sick',     CURRENT_DATE-10, CURRENT_DATE-9,  'Back pain — doctor visit',                    'Approved',FALSE,2,NOW()-INTERVAL '12 days', NOW()),
(6,'annual',   CURRENT_DATE+7,  CURRENT_DATE+11, 'Travel home — first break',                   'Pending', FALSE,5,NOW(),NOW()),
(7,'compassionate',CURRENT_DATE-15,CURRENT_DATE-13,'Funeral attendance',                        'Approved',TRUE,3, NOW()-INTERVAL '17 days', NOW()),
(9,'annual',   CURRENT_DATE-50, CURRENT_DATE-46, 'Supervisor annual leave',                     'Approved',TRUE,4, NOW()-INTERVAL '55 days', NOW()),
(10,'annual',  CURRENT_DATE-90, CURRENT_DATE-81, 'Management retreat and personal leave',       'Approved',TRUE,8, NOW()-INTERVAL '95 days', NOW()),
(1,'annual',   CURRENT_DATE+14, CURRENT_DATE+18, 'Planned leave — pending approval',            'Pending', FALSE,4,NOW(),NOW()),
(3,'unpaid',   CURRENT_DATE+30, CURRENT_DATE+37, 'Extended personal project — approved informally','Pending',FALSE,7,NOW(),NOW());

-- ============================================================
-- PART 3: KPIs, TRAINING, DOCUMENTS, CONTRACTS, PROJECTS,
--         ONBOARDING, RECRUITMENT, PEOPLE MGMT, COMMS
-- ============================================================

-- SECTION 12: KPI DEFINITIONS
INSERT INTO kpi_definitions (title,description,max_score,created_at,updated_at) VALUES
('Project Delivery Rate',  'Percentage of projects delivered on time and within budget', 100, NOW(),NOW()),
('Attendance Punctuality', 'Percentage of days arriving on time vs scheduled shift start',100, NOW(),NOW()),
('Quality of Output',      'Quality score based on peer review and supervisor assessment', 100, NOW(),NOW()),
('Client Satisfaction',    'Average client satisfaction rating from feedback forms',       100, NOW(),NOW()),
('Safety Compliance',      'Adherence to safety protocols and zero-incident rate',         100, NOW(),NOW()),
('Team Collaboration',     'Peer evaluation on teamwork and communication',                100, NOW(),NOW()),
('Training Completion',    'Completion rate of assigned training modules',                 100, NOW(),NOW()),
('Budget Management',      'Adherence to assigned budget — cost variance percentage',      100, NOW(),NOW());

-- SECTION 13: EMPLOYEE KPIs
INSERT INTO employee_kpis (employee_id,evaluator_id,definition_id,period,target_value,achieved_value,final_score,status,notes,created_at,updated_at) VALUES
(1, 17,1,'Q1-2026',90,88,97.8,'Approved','Slightly below target — one delayed site delivery',NOW(),NOW()),
(1, 17,2,'Q1-2026',95,92,96.8,'Approved','One late arrival recorded in February',NOW(),NOW()),
(1, 17,3,'Q1-2026',85,87,100, 'Approved','Above target — excellent structural work quality',NOW(),NOW()),
(1, 17,5,'Q1-2026',100,98,98.0,'Approved','Zero incidents, minor PPE non-compliance noted',NOW(),NOW()),
(2, 17,2,'Q1-2026',95,95,100, 'Approved','Perfect attendance record this quarter',NOW(),NOW()),
(2, 17,3,'Q1-2026',80,83,100, 'Approved','Financial reports submitted ahead of schedule',NOW(),NOW()),
(2, 17,8,'Q1-2026',90,88,97.8,'Approved','Minor budget overrun in March due to audit costs',NOW(),NOW()),
(3, 9, 1,'Q1-2026',85,80,94.1,'Approved','Two feature deployments delayed by scope changes',NOW(),NOW()),
(3, 9, 3,'Q1-2026',90,92,100, 'Approved','Code quality high — no production bugs',NOW(),NOW()),
(4, 17,6,'Q1-2026',80,75,93.75,'Pending','Still under review — Q1 sign-off pending',NOW(),NOW()),
(5, 17,1,'Q1-2026',80,78,97.5,'Approved','Operations well managed for a new joiner',NOW(),NOW()),
(9, 17,1,'Q1-2026',95,94,98.9,'Approved','Excellent site management — all milestones met',NOW(),NOW()),
(9, 17,5,'Q1-2026',100,99,99.0,'Approved','Highest safety compliance on site',NOW(),NOW()),
(1, 17,1,'Q4-2025',90,86,95.6,'Approved','Q4 performance solid',NOW(),NOW()),
(2, 17,2,'Q4-2025',95,93,97.9,'Approved','Q4 good attendance',NOW(),NOW()),
(10,17,8,'Q4-2025',100,98,98.0,'Approved','Budget management excellent for large project',NOW(),NOW());

-- SECTION 14: PENDING BONUSES
INSERT INTO pending_bonuses (employee_id,employee_kpi_id,period,bonus_type,bonus_amount,status,created_at,updated_at) VALUES
(1, 1, 'Q1-2026','KPI Raise',8500, 'approved', NOW(),NOW()),
(2, 5, 'Q1-2026','KPI Raise',7200, 'approved', NOW(),NOW()),
(3, 8, 'Q1-2026','KPI Raise',6500, 'pending',  NOW(),NOW()),
(9, 12,'Q1-2026','KPI Raise',7800, 'approved', NOW(),NOW()),
(1, 14,'Q4-2025','KPI Raise',8500, 'disbursed',NOW(),NOW()),
(2, 15,'Q4-2025','KPI Raise',7200, 'disbursed',NOW(),NOW()),
(10,16,'Q4-2025','KPI Raise',12000,'disbursed',NOW(),NOW());

-- SECTION 15: TRAINING
INSERT INTO training (employee_id,course_name,provider,start_date,end_date,status,certificate_url,notes,created_at,updated_at) VALUES
(1,'Advanced Structural Design',        'Kenya Engineers Board',               CURRENT_DATE-200,CURRENT_DATE-195,'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Passed with distinction',NOW(),NOW()),
(1,'Construction Project Management',   'Kenya Institute of Management',       CURRENT_DATE-120,CURRENT_DATE-108,'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Certificate issued',NOW(),NOW()),
(1,'AutoCAD 3D Modelling',              'Autodesk Authorized Training Center', CURRENT_DATE+14, CURRENT_DATE+25, 'scheduled',  NULL,'Upcoming course — booked',NOW(),NOW()),
(2,'IFRS for SMEs',                     'ICPAK',                               CURRENT_DATE-90, CURRENT_DATE-83, 'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Relevant to audit prep',NOW(),NOW()),
(2,'Advanced Excel for Finance',        'Coursera Online',                     CURRENT_DATE-45, CURRENT_DATE-38, 'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Passed final exam with 92%',NOW(),NOW()),
(3,'Docker & Kubernetes Fundamentals',  'Linux Foundation',                    CURRENT_DATE-60, CURRENT_DATE-53, 'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Deployed to staging cluster',NOW(),NOW()),
(3,'AWS Solutions Architect',           'Amazon Web Services',                 CURRENT_DATE+30, CURRENT_DATE+60, 'scheduled',  NULL,'Scheduled for Q3 2026',NOW(),NOW()),
(4,'HR Analytics & People Data',        'SHRM Online',                         CURRENT_DATE-30, CURRENT_DATE-23, 'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Good fit for HRIS project',NOW(),NOW()),
(9,'Site Safety Officer Certification', 'DOSH Kenya',                          CURRENT_DATE-180,CURRENT_DATE-174,'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Mandatory annual cert',NOW(),NOW()),
(10,'Strategic Leadership Programme',   'Strathmore Business School',          CURRENT_DATE-300,CURRENT_DATE-286,'completed',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','Company sponsored',NOW(),NOW()),
(5,'Supply Chain Management Basics',    'CIPS Kenya',                          CURRENT_DATE-15, CURRENT_DATE+5,  'in_progress',NULL,'Currently ongoing',NOW(),NOW()),
(6,'Public Procurement & Compliance',   'PPRA Kenya',                          CURRENT_DATE+7,  CURRENT_DATE+14, 'scheduled',  NULL,'Mandatory for procurement officers',NOW(),NOW());

-- SECTION 16: EMPLOYEE DOCUMENTS (Document Vault — PDF & image URLs)
INSERT INTO employee_documents (employee_id,document_type,document_name,file_url,file_size,mime_type,expiry_date,status,uploaded_by,created_at,updated_at) VALUES
(1,'national_id',  'National ID — James Mwangi',      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(1,'kra_pin',      'KRA PIN Certificate',             'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',102400,'application/pdf',NULL,'active',1,NOW(),NOW()),
(1,'nssf',         'NSSF Card — James',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+365,'active',1,NOW(),NOW()),
(1,'nhif',         'NHIF Card — James',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+180,'active',1,NOW(),NOW()),
(1,'certificate',  'B.Sc Civil Engineering Degree',   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',512000,'application/pdf',NULL,'active',1,NOW(),NOW()),
(1,'certificate',  'EBK Engineering License',         'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',307200,'application/pdf',CURRENT_DATE+200,'active',1,NOW(),NOW()),
(2,'national_id',  'National ID — Amina Hassan',      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(2,'kra_pin',      'KRA PIN Certificate — Amina',     'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',102400,'application/pdf',NULL,'active',1,NOW(),NOW()),
(2,'nssf',         'NSSF Card — Amina',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+300,'active',1,NOW(),NOW()),
(2,'nhif',         'NHIF Card — Amina',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+90, 'active',1,NOW(),NOW()),
(2,'certificate',  'CPA (K) Certificate',             'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',409600,'application/pdf',NULL,'active',1,NOW(),NOW()),
(3,'national_id',  'National ID — Brian Otieno',      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(3,'kra_pin',      'KRA PIN Certificate — Brian',     'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',102400,'application/pdf',NULL,'active',1,NOW(),NOW()),
(3,'certificate',  'BSc Computer Science Degree',     'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',512000,'application/pdf',NULL,'active',1,NOW(),NOW()),
(3,'nssf',         'NSSF Card — Brian',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+270,'active',1,NOW(),NOW()),
(4,'national_id',  'National ID — Grace Njeri',       'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(4,'nhif',         'NHIF Card — Grace',               'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',153600,'image/jpeg',CURRENT_DATE+150,'active',1,NOW(),NOW()),
(9,'national_id',  'National ID — Kevin Njoroge',     'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(9,'certificate',  'Site Safety Officer Certificate', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',307200,'application/pdf',CURRENT_DATE+60,'active',1,NOW(),NOW()),
(10,'national_id', 'National ID — Sarah Wanjiku',     'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',204800,'image/jpeg',NULL,             'active',1,NOW(),NOW()),
(10,'certificate', 'Strategic Leadership Diploma',    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png',409600,'application/pdf',NULL,'active',1,NOW(),NOW());

-- SECTION 17: CONTRACTS (with building photos as document_path)
INSERT INTO contracts (employee_id,title,start_date,end_date,terms,status,document_path,created_at,updated_at) VALUES
(1,
 'Westlands Commercial Tower — Structural Engineering Contract',
 CURRENT_DATE-365, CURRENT_DATE+365,
 'James Mwangi engaged as Lead Structural Engineer for 12-storey Westlands Commercial Tower. Responsibilities: structural design review, site supervision twice weekly, certification of all concrete pours. Remuneration: KES 85,000/month + KES 8,000 site allowance. Subject to 30-day notice. All IP remains property of Ubuntu Construction Ltd.',
 'active',
 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
 NOW()-INTERVAL '12 months',NOW()),
(7,
 'Ruaka Residential Complex — Site Supervision Agreement',
 CURRENT_DATE-61, CURRENT_DATE+304,
 'Peter Ouma appointed Site Supervisor for Phase 1 of Ruaka Residential Complex (24 units). Daily site inspection, labour coordination, safety compliance monitoring, weekly reporting. Site allowance KES 1,500/day. Breach of safety protocols may lead to immediate termination.',
 'active',
 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
 NOW()-INTERVAL '2 months',NOW()),
(9,
 'Runda Estate Infrastructure — Supervisor Field Contract',
 CURRENT_DATE-426, CURRENT_DATE+61,
 'Kevin Njoroge assigned as Senior Site Supervisor for Runda Estate infrastructure (roads, drainage, boundary walls). Manage field team of up to 20 workers. Monthly reports to Engineering Director by 5th of each month. Renewable on 6-month basis.',
 'active',
 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80',
 NOW()-INTERVAL '14 months',NOW()),
(10,
 'Nairobi Valley Commercial Park — Senior Management Contract',
 CURRENT_DATE-548, CURRENT_DATE+183,
 'Sarah Wanjiku engaged as Senior Project Manager for Nairobi Valley Commercial Park (mixed-use: retail, office, hotel). Responsibilities: project coordination, client liaison, budget management (KES 450M), subcontractor oversight, monthly board reporting. Remuneration: KES 120,000/month + up to 15% quarterly performance bonus.',
 'active',
 'https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=1200&q=80',
 NOW()-INTERVAL '18 months',NOW()),
(5,
 'Karen Business Park — Operations Coordination Agreement',
 CURRENT_DATE-122, CURRENT_DATE+243,
 'David Kamau responsible for on-site operational logistics at Karen Business Park. Scope: procurement coordination, sub-supplier management, equipment scheduling, daily operational reporting. Purchase order authority up to KES 500,000. Monthly expenditure reconciliation required.',
 'active',
 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80',
 NOW()-INTERVAL '4 months',NOW()),
(2,
 'Finance & Payroll Compliance — Annual Contract',
 CURRENT_DATE-305, CURRENT_DATE+61,
 'Amina Hassan engaged for annual financial compliance, payroll processing, and statutory deduction management. Responsibilities: monthly payroll computation, KRA compliance, NSSF/NHIF remittance, quarterly financial statements. CPA-K certification required. Discrepancies above KES 50,000 must be reported to CFO within 24 hours.',
 'active',
 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
 NOW()-INTERVAL '10 months',NOW()),
(3,
 'Digital Infrastructure & HRMS Platform — IT Contract',
 CURRENT_DATE-244, CURRENT_DATE+122,
 'Brian Otieno contracted for development and maintenance of internal HRMS platform. Deliverables: Phase 1 — core modules by month 3; Phase 2 — reporting and analytics by month 6; Phase 3 — mobile app by month 12. Payment milestone-based. All source code property of Ubuntu Construction Ltd. NDA applies.',
 'active',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
 NOW()-INTERVAL '8 months',NOW());

-- SECTION 18: CONTRACTOR QUOTES
INSERT INTO contractor_quotes (contractor_id,job_description,quote_amount,start_date,end_date,status,notes,created_at,updated_at) VALUES
(18,'Supply and install steel reinforcement bars for Westlands Tower floors 1-6. Scope includes cutting, bending, and tying. Material supply included.',    4850000,CURRENT_DATE-180,CURRENT_DATE-60, 'approved','Accepted after 5% price negotiation',     NOW()-INTERVAL '7 months',NOW()),
(18,'Concrete works — foundation and ground floor slab for Ruaka Residential Complex Phase 1. Includes formwork and finish.',                              3200000,CURRENT_DATE-61, CURRENT_DATE+61, 'approved','In progress',                              NOW()-INTERVAL '2 months',NOW()),
(18,'Roofing works — supply and install IBR sheets for 24 residential units at Ruaka.',                                                                    1650000,CURRENT_DATE+61, CURRENT_DATE+121,'pending', 'Awaiting board approval',                  NOW(),NOW()),
(19,'MEP systems (Mechanical, Electrical, Plumbing) for Westlands Tower floors 7-12.',                                                                     8400000,CURRENT_DATE-90, CURRENT_DATE+90, 'approved','Phased payment schedule agreed',           NOW()-INTERVAL '4 months',NOW()),
(19,'CCTV, access control, and fire suppression systems for Karen Business Park.',                                                                         2100000,CURRENT_DATE-30, CURRENT_DATE+60, 'pending', 'Quote under review by management',          NOW()-INTERVAL '1 month', NOW());

-- SECTION 19: PROJECTS (Contractor projects)
INSERT INTO projects (contractor_id,name,status,due_date,created_at,updated_at) VALUES
(18,'Westlands Tower — Steel & Concrete Package',   'active',   CURRENT_DATE+60,NOW()-INTERVAL '7 months',NOW()),
(18,'Ruaka Residential — Foundation Package',        'active',   CURRENT_DATE+90,NOW()-INTERVAL '2 months',NOW()),
(18,'Runda Estate — Boundary Wall Construction',     'completed',CURRENT_DATE-30,NOW()-INTERVAL '9 months',NOW()),
(19,'Westlands Tower — MEP Systems',                 'active',   CURRENT_DATE+90,NOW()-INTERVAL '4 months',NOW()),
(19,'Karen Business Park — Security Systems',        'active',   CURRENT_DATE+60,NOW()-INTERVAL '1 month', NOW()),
(19,'Nairobi Valley Park — Electrical Infrastructure','completed',CURRENT_DATE-60,NOW()-INTERVAL '8 months',NOW());

-- SECTION 20: INVOICES (Contractor invoices)
INSERT INTO invoices (contractor_id,amount,status,due_date,description,created_at,updated_at) VALUES
(18,1616667,'Paid',   CURRENT_DATE-120,'Westlands Tower Steel Works — Milestone 1 of 3',NOW()-INTERVAL '5 months',NOW()),
(18,1616667,'Paid',   CURRENT_DATE-60, 'Westlands Tower Steel Works — Milestone 2 of 3',NOW()-INTERVAL '3 months',NOW()),
(18,1616666,'Pending',CURRENT_DATE+30, 'Westlands Tower Steel Works — Milestone 3 (final)',NOW(),NOW()),
(18,1600000,'Paid',   CURRENT_DATE-30, 'Ruaka Foundation Works — Progress Payment 1',    NOW()-INTERVAL '1 month', NOW()),
(18,1600000,'Draft',  CURRENT_DATE+30, 'Ruaka Foundation Works — Progress Payment 2',    NOW(),NOW()),
(19,2800000,'Paid',   CURRENT_DATE-60, 'Westlands MEP Systems — Phase 1',               NOW()-INTERVAL '3 months',NOW()),
(19,2800000,'Paid',   CURRENT_DATE-30, 'Westlands MEP Systems — Phase 2',               NOW()-INTERVAL '1 month', NOW()),
(19,2800000,'Pending',CURRENT_DATE+30, 'Westlands MEP Systems — Phase 3 (final)',        NOW(),NOW()),
(19,2100000,'Draft',  CURRENT_DATE+60, 'Karen Business Park Security Systems — Full',    NOW(),NOW());

-- SECTION 21: CONTRACTOR PERFORMANCE
INSERT INTO contractor_performance (contractor_id,delivery_rate,created_at,updated_at) VALUES
(18,88,NOW(),NOW()),
(19,92,NOW(),NOW())
ON CONFLICT (contractor_id) DO UPDATE SET delivery_rate=EXCLUDED.delivery_rate, updated_at=NOW();

-- SECTION 22: MILESTONES
INSERT INTO milestones (employee_id,title,description,due_date,completed_date,status,priority,created_by,created_at,updated_at) VALUES
(1,'Structural Design Approval',    'Submit and receive county approval for structural drawings',    CURRENT_DATE-300,CURRENT_DATE-295,'completed','high',   1,NOW()-INTERVAL '11 months',NOW()),
(1,'Foundation Design Sign-off',    'Final review and certification of foundation design',           CURRENT_DATE-250,CURRENT_DATE-248,'completed','high',   1,NOW()-INTERVAL '9 months', NOW()),
(1,'Ground Floor Slab Inspection',  'Inspect and certify ground floor concrete slab',               CURRENT_DATE-150,CURRENT_DATE-148,'completed','medium', 1,NOW()-INTERVAL '5 months', NOW()),
(1,'Mid-rise Frame Certification',  'Structural certification for floors 4-8',                      CURRENT_DATE-30, CURRENT_DATE-28, 'completed','high',   1,NOW()-INTERVAL '1 month',  NOW()),
(1,'Final Structural Inspection',   'Full building structural clearance before handover',           CURRENT_DATE+60, NULL,            'pending',  'high',   1,NOW(),NOW()),
(7,'Site Mobilization Complete',    'Equipment, materials and workers mobilized on site',            CURRENT_DATE-55, CURRENT_DATE-53, 'completed','high',   9,NOW()-INTERVAL '2 months', NOW()),
(7,'Foundation Setting Approved',   'Foundation pegs set and approved by engineer',                 CURRENT_DATE-40, CURRENT_DATE-38, 'completed','high',   9,NOW()-INTERVAL '6 weeks',  NOW()),
(7,'Phase 1 Units Roofed',          'Roofing completed for units 1-12 of 24',                       CURRENT_DATE+30, NULL,            'in_progress','high', 9,NOW(),NOW()),
(9,'Site Boundary Walls Complete',  'All boundary wall sections for Runda Estate completed',        CURRENT_DATE-35, CURRENT_DATE-33, 'completed','medium', 1,NOW()-INTERVAL '2 months', NOW()),
(9,'Drainage Works Certified',      'Storm drainage system inspected and certified',                CURRENT_DATE-20, CURRENT_DATE-18, 'completed','medium', 1,NOW()-INTERVAL '1 month',  NOW()),
(10,'Phase 1 Design Brief Approved','Client signs off on Phase 1 architectural and structural brief',CURRENT_DATE-400,CURRENT_DATE-398,'completed','high',  1,NOW()-INTERVAL '14 months',NOW()),
(10,'Phase 2 Construction Start',   'Site cleared and construction mobilized for Phase 2',          CURRENT_DATE-200,CURRENT_DATE-198,'completed','high',   1,NOW()-INTERVAL '7 months', NOW()),
(10,'MEP Systems Fully Installed',  'All mechanical, electrical and plumbing works complete',       CURRENT_DATE+30, NULL,            'in_progress','high', 1,NOW(),NOW());

-- SECTION 23: ONBOARDING
INSERT INTO onboarding (employee_id,user_id,start_date,end_date,status,notes,created_at,updated_at) VALUES
(6, 13,CURRENT_DATE-88, CURRENT_DATE-74,'completed',  'Standard onboarding completed — Procurement',  NOW()-INTERVAL '3 months',NOW()),
(7, 14,CURRENT_DATE-57, CURRENT_DATE-43,'completed',  'Standard onboarding completed — Engineering',  NOW()-INTERVAL '2 months',NOW()),
(8, 15,CURRENT_DATE-27, CURRENT_DATE-13,'completed',  'Standard onboarding completed — Administration',NOW()-INTERVAL '1 month', NOW()),
(4, 11,CURRENT_DATE-178,CURRENT_DATE-164,'completed', 'Onboarding completed — HR department',         NOW()-INTERVAL '6 months',NOW()),
(5, 12,CURRENT_DATE-118,CURRENT_DATE-104,'completed', 'Onboarding completed — Operations',            NOW()-INTERVAL '4 months',NOW());

-- SECTION 24: ORIENTATION CHECKLISTS
INSERT INTO orientation_checklists (onboarding_id,item_name,is_completed,completed_at,completed_by,created_at) VALUES
(1,'Sign employment contract',       TRUE, NOW()-INTERVAL '88 days',1,NOW()),
(1,'Receive ID card',                TRUE, NOW()-INTERVAL '88 days',1,NOW()),
(1,'IT system access setup',         TRUE, NOW()-INTERVAL '87 days',3,NOW()),
(1,'Safety induction training',      TRUE, NOW()-INTERVAL '86 days',9,NOW()),
(1,'Meet department head',           TRUE, NOW()-INTERVAL '85 days',1,NOW()),
(1,'Complete HR paperwork (NSSF/NHIF/KRA)', TRUE, NOW()-INTERVAL '84 days',4,NOW()),
(2,'Sign employment contract',       TRUE, NOW()-INTERVAL '57 days',1,NOW()),
(2,'Receive ID card',                TRUE, NOW()-INTERVAL '57 days',1,NOW()),
(2,'IT system access setup',         TRUE, NOW()-INTERVAL '56 days',3,NOW()),
(2,'Safety induction training',      TRUE, NOW()-INTERVAL '55 days',9,NOW()),
(2,'Site orientation — Ruaka',       TRUE, NOW()-INTERVAL '54 days',9,NOW()),
(2,'Complete HR paperwork',          TRUE, NOW()-INTERVAL '53 days',4,NOW()),
(3,'Sign employment contract',       TRUE, NOW()-INTERVAL '27 days',1,NOW()),
(3,'Receive ID card',                TRUE, NOW()-INTERVAL '27 days',1,NOW()),
(3,'IT system access setup',         TRUE, NOW()-INTERVAL '26 days',3,NOW()),
(3,'Meet department head',           TRUE, NOW()-INTERVAL '25 days',1,NOW()),
(3,'Complete HR paperwork',          FALSE,NULL,NULL,NOW()),
(3,'Safety induction training',      FALSE,NULL,NULL,NOW());

-- SECTION 25: RECRUITMENT — JOB POSTINGS
INSERT INTO jobs (title,department,description,requirements,employment_type,salary_min,salary_max,location,status,created_by,closing_date,created_at,updated_at) VALUES
('Senior Civil Engineer',         'Engineering',     'Seeking an experienced civil engineer to lead structural design for large-scale commercial and residential projects across Nairobi.',       'B.Sc Civil Engineering, EBK registered, 7+ years experience, AutoCAD proficient', 'Full-time', 90000,120000,'Nairobi, Kenya', 'active', 1, CURRENT_DATE+30,NOW()-INTERVAL '14 days',NOW()),
('IT Systems Administrator',      'IT',              'Looking for a skilled sysadmin to manage server infrastructure, network security and IT support for our growing HRMS platform.',          'Diploma/Degree in IT, 3+ years sysadmin experience, Linux proficiency',           'Full-time', 55000,75000, 'Nairobi, Kenya', 'active', 1, CURRENT_DATE+21,NOW()-INTERVAL '7 days', NOW()),
('Finance Assistant',             'Finance',         'Junior finance role to support payroll processing, statutory compliance and monthly financial reporting.',                                 'CPA Part 2 or higher, 1-2 years experience, Excel proficient',                   'Full-time', 35000,50000, 'Nairobi, Kenya', 'active', 1, CURRENT_DATE+14,NOW()-INTERVAL '5 days', NOW()),
('Site Supervisor — Mombasa',     'Engineering',     'Site supervisor needed for a new coastal residential project in Mombasa. Must be available to relocate or travel to site regularly.',     'Diploma/Degree in Civil Engineering or Construction Management, 3+ years on site', 'Full-time',55000,70000,'Mombasa, Kenya','active',1,  CURRENT_DATE+45,NOW()-INTERVAL '3 days', NOW()),
('Human Resources Officer',       'Human Resources', 'HR officer to manage recruitment, onboarding, leave administration and employee relations for a 150-person construction firm.',           'Degree in HR or Business, IHRM member preferred, 3+ years HR experience',         'Full-time', 45000,65000, 'Nairobi, Kenya', 'closed',1, CURRENT_DATE-10,NOW()-INTERVAL '60 days',NOW());

-- SECTION 26: JOB APPLICATIONS
INSERT INTO job_applications (job_id,first_name,last_name,email,phone,date_of_birth,gender,nationality,national_id,residential_address,cover_letter,resume_url,status,experience_years,education_history,skills,created_at,updated_at) VALUES
(1,'Daniel','Kariuki','daniel.kariuki@email.com','0711000101','1991-03-10','Male','Kenyan','31001234','Thika Road, Nairobi','I am a highly motivated structural engineer with 9 years of experience in high-rise construction. I am excited to bring my expertise to Ubuntu Construction Ltd.',  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','shortlisted',9,'[{"degree":"B.Sc Civil Engineering","institution":"University of Nairobi","year":2013}]','["Structural Analysis","AutoCAD","ETABS","Project Management"]',NOW()-INTERVAL '12 days',NOW()),
(1,'Lydia','Cherop','lydia.cherop@email.com','0722000102','1993-09-15','Female','Kenyan','33002345','Kasarani, Nairobi','As a registered engineer with 8 years in structural and foundation design, I am confident I will add immense value to your team and ongoing projects.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','pending',8,'[{"degree":"B.Sc Civil Engineering","institution":"JKUAT","year":2015}]','["Foundation Design","AutoCAD","Revit","Site Management"]',NOW()-INTERVAL '10 days',NOW()),
(1,'Moses','Mutua','moses.mutua@email.com','0733000103','1989-06-20','Male','Kenyan','26003456','Embakasi, Nairobi','10 years of structural engineering experience across commercial, residential and infrastructure sectors. EBK registered.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','rejected',10,'[{"degree":"B.Sc Civil Engineering","institution":"Moi University","year":2011}]','["Structural Design","Site Supervision","AutoCAD"]',NOW()-INTERVAL '13 days',NOW()),
(2,'Lucy','Wangari','lucy.wangari@email.com','0700000201','1996-12-05','Female','Kenyan','38004567','Westlands, Nairobi','Enthusiastic IT professional with 4 years system administration experience across both Linux and Windows environments. Eager to contribute to your digital transformation.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','pending',4,'[{"degree":"B.Sc IT","institution":"Strathmore University","year":2019}]','["Linux","Windows Server","Networking","VMware"]',NOW()-INTERVAL '6 days',NOW()),
(3,'Kevin','Oloo','kevin.oloo@email.com','0711000301','1998-02-14','Male','Kenyan','41005678','Ngong, Nairobi','Recent CPA graduate with 1.5 years finance experience. Keen to grow in a dynamic company with structured finance operations.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','pending',2,'[{"degree":"B.Com Finance","institution":"KCA University","year":2020}]','["Accounting","Excel","QuickBooks","PAYE Compliance"]',NOW()-INTERVAL '4 days',NOW()),
(5,'Nancy','Achieng','nancy.achieng@email.com','0722000501','1994-08-22','Female','Kenyan','31006789','Langata, Nairobi','HR professional with 4 years experience in manufacturing and construction. IHRM member. Passionate about building strong people functions.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Adobe_PDF_icon_%28version_1%29.svg/640px-Adobe_PDF_icon_%28version_1%29.svg.png','hired',4,'[{"degree":"B.A Human Resource Management","institution":"USIU Africa","year":2017}]','["Recruitment","Onboarding","HRIS","Employee Relations"]',NOW()-INTERVAL '55 days',NOW());

-- SECTION 27: SUPERVISOR ALLOCATIONS
INSERT INTO supervisor_allocations (supervisor_id,supervisee_id,type,start_date,end_date,permissions,assigned_by,is_active,notes,created_at,updated_at) VALUES
(16, 8, 'permanent', CURRENT_DATE-365,  NULL,         '["view_attendance","approve_leave","view_payroll"]',1,TRUE,'Kevin supervises James — Engineering team',   NOW()-INTERVAL '12 months',NOW()),
(16, 14,'permanent', CURRENT_DATE-61,   NULL,         '["view_attendance","approve_leave"]',              1,TRUE,'Kevin supervises Peter — Engineering team',   NOW()-INTERVAL '2 months', NOW()),
(17, 9, 'permanent', CURRENT_DATE-305,  NULL,         '["view_attendance","approve_leave","view_payroll"]',1,TRUE,'Sarah supervises Amina — Finance',            NOW()-INTERVAL '10 months',NOW()),
(17, 10,'permanent', CURRENT_DATE-244,  NULL,         '["view_attendance","approve_leave"]',              1,TRUE,'Sarah supervises Brian — IT',                 NOW()-INTERVAL '8 months', NOW()),
(17, 11,'permanent', CURRENT_DATE-183,  NULL,         '["view_attendance","approve_leave"]',              1,TRUE,'Sarah supervises Grace — HR',                 NOW()-INTERVAL '6 months', NOW()),
(4,  12,'temporary', CURRENT_DATE-122,  CURRENT_DATE+243,'["view_attendance"]',                          1,TRUE,'Supervisor covers David — Operations',        NOW()-INTERVAL '4 months', NOW()),
(4,  13,'temporary', CURRENT_DATE-92,   CURRENT_DATE+273,'["view_attendance"]',                          1,TRUE,'Supervisor covers Fatuma — Procurement',      NOW()-INTERVAL '3 months', NOW())
ON CONFLICT (supervisor_id,supervisee_id) DO NOTHING;

-- SECTION 28: DEPARTMENT HEAD ASSIGNMENTS
INSERT INTO department_head_assignments (user_id,department,permissions,assigned_by,is_active,notes,created_at,updated_at) VALUES
(17,'Management',     '["view_all","approve_payroll","approve_leave","manage_kpi","manage_recruitment"]',1,TRUE,'Sarah Wanjiku — overall senior management',  NOW()-INTERVAL '18 months',NOW()),
(16,'Engineering',    '["view_attendance","approve_leave","manage_kpi","view_payroll"]',                 1,TRUE,'Kevin Njoroge — Engineering department head', NOW()-INTERVAL '14 months',NOW()),
(9, 'Finance',        '["view_attendance","approve_leave","view_payroll"]',                              1,TRUE,'Amina Hassan — Finance department head',      NOW()-INTERVAL '10 months',NOW()),
(11,'Human Resources','["view_all_employees","manage_onboarding","manage_recruitment","view_payroll"]',  1,TRUE,'Grace Njeri — HR department head',            NOW()-INTERVAL '6 months', NOW()),
(12,'Operations',     '["view_attendance","view_payroll","manage_assets"]',                              1,TRUE,'David Kamau — Operations department head',    NOW()-INTERVAL '4 months', NOW());

-- SECTION 29: USER PERMISSION OVERRIDES
INSERT INTO user_permission_overrides (user_id,permission_key,is_granted,granted_by,granted_at,expires_at,duration_type,duration_value,reason,is_active,created_at,updated_at) VALUES
(10,'payroll.disburse',         TRUE,1,NOW()-INTERVAL '6 months',NULL,            'permanent',NULL,'Senior manager requires payroll disbursement access',          TRUE,NOW()-INTERVAL '6 months',NOW()),
(9, 'attendance.bulk_edit',     TRUE,1,NOW()-INTERVAL '3 months',NOW()+INTERVAL '6 months','days',180,'Temporary bulk attendance correction access',            TRUE,NOW()-INTERVAL '3 months',NOW()),
(16,'kpi.create_definition',    TRUE,1,NOW()-INTERVAL '12 months',NULL,           'permanent',NULL,'Engineering head can create KPI definitions for team',          TRUE,NOW()-INTERVAL '12 months',NOW()),
(3, 'reports.export_all',       TRUE,1,NOW()-INTERVAL '30 days', NOW()+INTERVAL '30 days','days',60,'Temporary export access for quarterly audit',                 TRUE,NOW()-INTERVAL '30 days', NOW());

-- SECTION 30: NOTIFICATIONS
INSERT INTO notifications (user_id,type,title,message,entity_type,entity_id,is_read,created_at) VALUES
(8, 'leave_approved',   'Leave Approved',           'Your annual leave request for 5 days has been approved by Sarah Wanjiku.','leave_request',1, TRUE, NOW()-INTERVAL '200 days'),
(8, 'payslip_ready',    'Payslip Ready',             'Your payslip for April 2026 is now available for download.',             'payslip',      11,FALSE,NOW()-INTERVAL '1 month'),
(8, 'kpi_reviewed',     'KPI Assessment Complete',   'Your Q1-2026 KPI review has been completed. Score: 97.8/100.',           'employee_kpi', 1, FALSE,NOW()-INTERVAL '5 days'),
(9, 'leave_approved',   'Leave Approved',            'Your annual leave for 5 days (Kisumu) has been approved.',               'leave_request',4, TRUE, NOW()-INTERVAL '170 days'),
(9, 'payslip_ready',    'Payslip Ready',             'Your April 2026 payslip is available.',                                  'payslip',      19,FALSE,NOW()-INTERVAL '1 month'),
(10,'kpi_reviewed',     'KPI Assessment Complete',   'Q1-2026 KPI review complete. Score: 94.1/100.',                          'employee_kpi', 8, FALSE,NOW()-INTERVAL '5 days'),
(11,'leave_approved',   'Leave Approved',            'Your short break leave (4 days) has been approved.',                     'leave_request',8, TRUE, NOW()-INTERVAL '20 days'),
(16,'payslip_ready',    'Payslip Ready',             'Your April 2026 payslip is available.',                                  'payslip',      29,FALSE,NOW()-INTERVAL '1 month'),
(17,'payslip_ready',    'Payslip Ready',             'Your April 2026 payslip is available.',                                  'payslip',      31,FALSE,NOW()-INTERVAL '1 month'),
(1, 'leave_pending',    'Leave Request Pending',     'Fatuma Ali has submitted an annual leave request for 5 days.',           'leave_request',10,FALSE,NOW()),
(1, 'leave_pending',    'Leave Request Pending',     'James Mwangi has submitted an annual leave request for 4 days.',         'leave_request',14,FALSE,NOW()),
(1, 'new_application',  'New Job Application',       'A new application has been received for Senior Civil Engineer.',         'job',          1, FALSE,NOW()-INTERVAL '12 days'),
(1, 'contract_expiring','Contract Expiring Soon',    'Kevin Njoroge''s Runda Estate contract expires in 61 days.',             'contract',     3, FALSE,NOW());

-- SECTION 31: MESSAGES (Complaints and Announcements)
INSERT INTO messages (sender_id,recipient_id,subject,content,message_type,is_read,is_resolved,resolved_at,resolved_by,resolution_notes,created_at,updated_at) VALUES
(8, 1,'Complaint: Delay in Payslip Issuance','I would like to raise a concern regarding my payslip for March 2026 which was not issued until the 10th of the following month. This causes difficulty in planning. Kindly ensure timely issuance going forward.','complaint',TRUE,TRUE,NOW()-INTERVAL '40 days',1,'Acknowledged — payroll process will be tightened to ensure payslips are issued by the 5th of the following month.',NOW()-INTERVAL '50 days',NOW()),
(10,1,'Leave Overlap During April Reporting Period','I wish to flag a scheduling concern: two key finance staff (Amina and Grace) have leave requests overlapping during the April reporting period. This may impact financial closure.','general',TRUE,TRUE,NOW()-INTERVAL '25 days',1,'Leaves staggered — Amina approved for April 1-5, Grace approved for April 7-10.',NOW()-INTERVAL '30 days',NOW()),
(14,1,'Recommendation: Safety Boot Allowance for Site Staff','Site supervisors and engineers are incurring personal costs for safety boots. I recommend the company introduce a KES 5,000 annual safety boot allowance for all site staff.','recommendation',TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '15 days',NOW()),
(1, 8,'RE: Payslip Issuance Complaint','Thank you for raising this. We have reviewed our payroll cycle and will ensure all payslips are ready by the 5th of each following month. We apologize for the inconvenience.','general',TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '40 days',NOW()),
(1, 1,'Company Announcement: Q1 Performance Review Complete','Dear Team, we are pleased to announce that Q1 2026 KPI assessments are now complete. Approved bonuses will be reflected in the May 2026 payroll. Congratulations to all who met and exceeded their targets.','announcement',FALSE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '5 days',NOW());

-- SECTION 32: SALARY REMINDERS
INSERT INTO salary_reminders (reminder_date,message,is_sent,sent_at,created_at) VALUES
(CURRENT_DATE-30,'Monthly payroll processing reminder — May 2026 payroll due for review',TRUE, NOW()-INTERVAL '30 days',NOW()-INTERVAL '35 days'),
(CURRENT_DATE,   'Monthly payroll processing reminder — June 2026 payroll preparation starting',FALSE,NULL,NOW()-INTERVAL '5 days'),
(CURRENT_DATE+30,'Monthly payroll processing reminder — July 2026 payroll preparation',FALSE,NULL,NOW());

-- SECTION 33: AUDIT LOGS (sample trail)
INSERT INTO audit_logs (user_id,username,user_role,action,entity_type,entity_id,entity_name,ip_address,created_at) VALUES
(1,'admin','admin','CREATE','employee',1,'James Mwangi','192.168.1.1',NOW()-INTERVAL '12 months'),
(1,'admin','admin','APPROVE','leave_request',1,'James Mwangi — Annual Leave','192.168.1.1',NOW()-INTERVAL '200 days'),
(1,'admin','admin','DISBURSE','payslip',1,'James Mwangi — 2026-04','192.168.1.1',NOW()-INTERVAL '1 month'),
(17,'mgr_sarah','manager','APPROVE','leave_request',4,'Amina Hassan — Annual Leave','192.168.1.100',NOW()-INTERVAL '170 days'),
(17,'mgr_sarah','manager','REVIEW','employee_kpi',5,'Amina Hassan Q1-2026 KPI','192.168.1.100',NOW()-INTERVAL '5 days'),
(16,'sup_kevin','supervisor','UPDATE','attendance',100,'Brian Otieno — Attendance Correction','192.168.1.101',NOW()-INTERVAL '10 days'),
(1,'admin','admin','CREATE','job',1,'Senior Civil Engineer — Job Posting','192.168.1.1',NOW()-INTERVAL '14 days'),
(1,'admin','admin','UPDATE','settings',NULL,'OFFICE_NAME Updated','192.168.1.1',NOW()-INTERVAL '60 days');

-- SECTION 34: COMPONENT SETTINGS (UI preferences)
INSERT INTO component_settings (component_name,setting_key,setting_value,is_global,category,description,created_at,updated_at) VALUES
('TabNavigation','animationSpeed',  '200',  TRUE,'ui',    'Tab switch animation speed in ms',          NOW(),NOW()),
('TabNavigation','persistActiveTab','true', TRUE,'ui',    'Persist active tab in localStorage',         NOW(),NOW()),
('Dashboard',    'refreshInterval', '30000',TRUE,'data',  'Dashboard data refresh interval in ms',      NOW(),NOW()),
('Payroll',      'defaultCurrency', '"KES"',TRUE,'finance','Default currency for payroll display',      NOW(),NOW()),
('Attendance',   'defaultShift',    '"Morning"',TRUE,'hr','Default shift for new attendance records',   NOW(),NOW()),
('Reports',      'defaultDateRange','"30d"',TRUE,'reports','Default date range for report views',       NOW(),NOW())
ON CONFLICT DO NOTHING;

-- SECTION 35: USER PREFERENCES
INSERT INTO user_preferences (user_id,preferences,created_at,updated_at) VALUES
(1, '{"theme":"dark","language":"en","timezone":"Africa/Nairobi","notificationsEnabled":true,"dashboardLayout":"compact"}',NOW(),NOW()),
(8, '{"theme":"light","language":"en","timezone":"Africa/Nairobi","notificationsEnabled":true,"dashboardLayout":"default"}',NOW(),NOW()),
(17,'{"theme":"light","language":"en","timezone":"Africa/Nairobi","notificationsEnabled":true,"dashboardLayout":"expanded"}',NOW(),NOW()),
(16,'{"theme":"dark","language":"en","timezone":"Africa/Nairobi","notificationsEnabled":true,"dashboardLayout":"default"}',NOW(),NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- END OF SEED
-- Summary of what was seeded:
--   Users:               16 new (employees, supervisors, managers, contractors, labourers)
--   Employees:           10 (spans 1-18 months employment, different depts)
--   Daily Labourers:     4 (11, 8, 6, 3 month history with no-work weeks)
--   Profiles:            7 rich profiles with photos
--   Assets:              12 (electronics, furniture, PPE, vehicles)
--   Attendance:          ~1900 records (1 year for senior staff, from join for rest)
--   Daily Attendance:    ~700 records with documented no-work weeks
--   Payments:            17 labourer weekly payments including zero-pay weeks
--   Payslips:            32 monthly payslips with PAYE/NHIF/NSSF deductions
--   Leave Balances:      15 entries (2 years for senior staff)
--   Leave Requests:      15 (approved, pending, various types)
--   KPI Definitions:     8
--   Employee KPIs:       16 assessments across Q4-2025 and Q1-2026
--   Pending Bonuses:     7
--   Training Records:    12 (completed, in_progress, scheduled + PDF certificate URLs)
--   Employee Documents:  21 (national IDs, KRA, NSSF, NHIF, degree certificates)
--   Contracts:           7 with building/project Unsplash photos as document_path
--   Contractor Quotes:   5
--   Projects:            6
--   Invoices:            9
--   Contractor Perf:     2
--   Milestones:          13
--   Onboarding:          5 records
--   Orientation Items:   18 checklist items
--   Jobs:                5 (4 active, 1 closed)
--   Job Applications:    6
--   Supervisor Allocs:   7
--   Dept Head Assigns:   5
--   Permission Overrides:4
--   Notifications:       13
--   Messages:            5 (complaints, recommendations, announcements)
--   Salary Reminders:    3
--   Audit Logs:          8
--   Component Settings:  6
--   User Preferences:    4
-- ============================================================

