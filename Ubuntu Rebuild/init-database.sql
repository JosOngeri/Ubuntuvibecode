-- Ubuntu HRMS Rebuild — Database Initialization
-- Database: UbuntuRebuild1

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','owner','manager','supervisor','employee','contractor','daily_labourer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','inactive')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expire TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending','terminated','on_statutory_leave')),
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  other_names TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  biometric_device_id TEXT UNIQUE,
  mpesa_phone_number TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Daily','Contractor','Permanent')),
  wage_rate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (wage_rate >= 0),
  department TEXT NOT NULL,
  date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,
  nationality TEXT,
  national_id TEXT,
  residential_address JSONB,
  emergency_contact JSONB,
  education_history JSONB,
  employment_history JSONB,
  skills JSONB,
  certifications JSONB,
  bank_account_number TEXT,
  bank_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payment_method IN ('MPESA','BANK')),
  can_self_record_attendance BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  setting_value TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string','number','boolean','array','json')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  validation_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setting_key, category)
);

CREATE TABLE IF NOT EXISTS settings_audit_log (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL,
  category TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  impact_analysis TEXT,
  reason TEXT
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  break_out TIMESTAMPTZ,
  break_in TIMESTAMPTZ,
  punch_state TEXT DEFAULT 'checkIn',
  status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present','Absent','Late','Half-Day','Holiday','Off-Day')),
  total_hours_worked NUMERIC(5,2),
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  recorded_by BIGINT REFERENCES users(id),
  is_backdated BOOLEAN DEFAULT FALSE,
  backdated_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- ============================================================
-- LEAVE POLICIES
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_policies (
  id BIGSERIAL PRIMARY KEY,
  leave_type TEXT NOT NULL UNIQUE,
  days_per_year INT NOT NULL DEFAULT 0,
  is_auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
  requires_balance BOOLEAN NOT NULL DEFAULT TRUE,
  day_count_mode TEXT NOT NULL DEFAULT 'calendar_days' CHECK (day_count_mode IN ('calendar_days','working_days')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEAVES
-- ============================================================
CREATE TABLE IF NOT EXISTS leaves (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approver_id BIGINT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  escalated BOOLEAN DEFAULT FALSE,
  escalation_level INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  basic_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12,2) DEFAULT 0,
  kpi_bonus NUMERIC(12,2) DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  paye NUMERIC(12,2) DEFAULT 0,
  nhif NUMERIC(12,2) DEFAULT 0,
  nssf NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','failed')),
  payment_method TEXT DEFAULT 'MPESA',
  mpesa_transaction_id TEXT,
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('normal','urgent','critical')),
  retry_count INT DEFAULT 0,
  notes TEXT,
  processed_by BIGINT REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KPI DEFINITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  category TEXT,
  measurement_unit TEXT DEFAULT 'percentage',
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KPI ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS kpi (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  definition_id BIGINT REFERENCES kpi_definitions(id),
  definition_title TEXT NOT NULL,
  period TEXT NOT NULL,
  target_value NUMERIC(10,2) NOT NULL DEFAULT 100,
  achieved_value NUMERIC(10,2),
  score NUMERIC(5,2),
  kpi_bonus NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue')),
  evaluator_id BIGINT REFERENCES users(id),
  evaluated_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DAILY LABOURERS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_labourers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT,
  photo_url TEXT,
  skill_set JSONB DEFAULT '[]',
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 600,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','converted')),
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_attendance (
  id BIGSERIAL PRIMARY KEY,
  labourer_id BIGINT NOT NULL REFERENCES daily_labourers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  assigned_to TEXT,
  assigned_type TEXT CHECK (assigned_type IN ('department','contractor','milestone')),
  wage_for_day NUMERIC(10,2),
  is_paid BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent')),
  recorded_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(labourer_id, attendance_date)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app','email','sms','all')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','pending')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ONBOARDING
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  application_id BIGINT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  current_step TEXT NOT NULL DEFAULT 'offer_letter',
  completed_steps JSONB DEFAULT '[]',
  personal_info JSONB,
  documents_checklist JSONB DEFAULT '{}',
  supervisor_id BIGINT REFERENCES users(id),
  assets_assigned JSONB DEFAULT '[]',
  probation_end DATE,
  review_1_date DATE,
  review_2_date DATE,
  review_3_date DATE,
  final_review_date DATE,
  initiated_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('guest','employee')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','investigating','resolved','closed')),
  submitted_by BIGINT REFERENCES users(id),
  assigned_to BIGINT REFERENCES users(id),
  escalation_level INT DEFAULT 0,
  sla_deadline TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  compensation TEXT,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACTS (employee)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','terminated','renewed')),
  file_url TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS contractors (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  kra_pin TEXT,
  trade TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractor_quotes (
  id BIGSERIAL PRIMARY KEY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2),
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  number_of_positions INT DEFAULT 1,
  approved_by BIGINT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES contractor_quotes(id) ON DELETE CASCADE,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id),
  title TEXT NOT NULL,
  description TEXT,
  deliverables TEXT,
  deadline DATE,
  budget NUMERIC(14,2),
  materials_request JSONB DEFAULT '[]',
  labour_request JSONB DEFAULT '{}',
  downpayment_request NUMERIC(14,2) DEFAULT 0,
  progress_percent INT DEFAULT 0,
  photos JSONB DEFAULT '[]',
  receipts JSONB DEFAULT '[]',
  timeliness_score NUMERIC(5,2),
  budget_score NUMERIC(5,2),
  quality_score NUMERIC(5,2),
  kpi_score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','submitted','approved','rejected','completed')),
  verified_by BIGINT REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  assigned_to BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  assigned_date DATE,
  return_date DATE,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('good','fair','damaged','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOBS & APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements TEXT,
  qualifications JSONB DEFAULT '[]',
  evaluation_params JSONB DEFAULT '{}',
  employment_type TEXT,
  salary_range TEXT,
  number_of_positions INT DEFAULT 1,
  location TEXT DEFAULT 'Ubuntu Eco Lodge',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','draft')),
  application_closing_date DATE,
  posted_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  personal_info JSONB,
  address_info JSONB,
  position_details JSONB,
  education JSONB,
  employment_history JSONB,
  applicant_references JSONB,
  skills JSONB,
  declaration JSONB,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','interviewed','offer_sent','offer_accepted','offer_negotiated','hired','rejected','withdrawn')),
  auto_score NUMERIC(5,2),
  manual_score NUMERIC(5,2),
  score_breakdown JSONB,
  reviewer_notes TEXT,
  interview_score NUMERIC(5,2),
  interview_notes TEXT,
  interview_date DATE,
  interview_status TEXT,
  offered_salary NUMERIC(12,2),
  offer_token TEXT,
  offer_sent_at TIMESTAMPTZ,
  offer_status TEXT,
  counter_offer_salary NUMERIC(12,2),
  final_salary NUMERIC(12,2),
  reviewed_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRAINING
-- ============================================================
CREATE TABLE IF NOT EXISTS training (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  trainer TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  participants JSONB DEFAULT '[]',
  notes TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE DOCUMENTS (Compliance Vault)
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id','kra_pin','nssf','nhif','certificate','contract','other')),
  file_url TEXT,
  document_number TEXT,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by BIGINT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORIENTATION CHECKLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS orientation_checklists (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  completed_by BIGINT REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  skills JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS (Contractor & Daily Labour)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('contractor','daily_labourer')),
  payee_id BIGINT NOT NULL,
  milestone_id BIGINT REFERENCES milestones(id),
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT DEFAULT 'MPESA',
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  notes TEXT,
  processed_by BIGINT REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHIFT SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS shift_settings (
  id BIGSERIAL PRIMARY KEY,
  employment_type TEXT,
  department TEXT,
  shift_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON user_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_employee ON kpi(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
