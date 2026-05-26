-- Ubuntu HRMS Database Initialization Script
-- Run this in your Render.com PostgreSQL console

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expire TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add user columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Update role constraint to include all roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'owner', 'manager', 'supervisor', 'employee', 'contractor', 'daily_labourer'));
EXCEPTION WHEN OTHERS THEN
  -- If constraint doesn't exist or other error, continue
END $$;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'terminated', 'on_statutory_leave')),
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  other_names TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  biometric_device_id TEXT UNIQUE,
  mpesa_phone_number TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Daily', 'Contractor', 'Permanent')),
  wage_rate NUMERIC(12,2) NOT NULL CHECK (wage_rate >= 0),
  department TEXT NOT NULL,
  date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bank_account_number TEXT,
  bank_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payment_method IN ('MPESA', 'BANK')),
  can_self_record_attendance BOOLEAN NOT NULL DEFAULT true,
  date_of_birth DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(20),
  nationality VARCHAR(50),
  national_id VARCHAR(50),
  residential_address JSONB,
  emergency_contact JSONB,
  education_history JSONB,
  employment_history JSONB,
  skills JSONB,
  certifications JSONB
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL,
  category TEXT,
  setting_value TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string',
  is_active BOOLEAN NOT NULL DEFAULT true,
  validation_rules JSONB,
  updated_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setting_key, category)
);

-- Settings audit log
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL,
  category TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  impact_analysis TEXT,
  reason TEXT
);

-- Job applications
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department VARCHAR(100),
  location VARCHAR(100),
  employmenttype VARCHAR(50),
  status VARCHAR(20) DEFAULT 'open',
  postedby INTEGER,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  salaryrange VARCHAR(100),
  requirements TEXT,
  responsibilities TEXT,
  benefits TEXT,
  applicationdeadline DATE,
  qualifications JSONB,
  evaluationparams JSONB,
  advertisement_data JSONB,
  numberofpositions INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  jobid INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  applicantname VARCHAR(255) NOT NULL,
  applicantemail VARCHAR(255) NOT NULL,
  applicantphone VARCHAR(50),
  cvpath VARCHAR(255),
  coverletter TEXT,
  applicationdata JSONB,
  recruiterannouncement TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  appliedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id BIGINT,
  linked_via TEXT,
  linked_at TIMESTAMPTZ,
  personal_info JSONB,
  address_info JSONB,
  position_details JSONB,
  education JSONB,
  employment_history JSONB,
  "references" JSONB,
  skills JSONB,
  declaration JSONB,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_score DECIMAL,
  verification_results JSONB,
  verification_flags JSONB,
  auto_score DECIMAL,
  manual_score DECIMAL,
  score_breakdown JSONB,
  reviewer_notes TEXT,
  offer_token VARCHAR(255),
  offer_sent_at TIMESTAMP,
  offer_status VARCHAR(50),
  counter_offer_salary DECIMAL,
  final_salary DECIMAL,
  interview_score DECIMAL,
  interview_notes TEXT,
  interview_date TIMESTAMP,
  offered_salary DECIMAL,
  interview_status VARCHAR(50),
  employee_id INTEGER REFERENCES employees(id),
  ai_ranking DECIMAL,
  ai_ranking_breakdown JSONB,
  verified_at TIMESTAMPTZ,
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  manager_ranking DECIMAL,
  manager_notes TEXT,
  manager_reviewed_at TIMESTAMPTZ,
  manager_reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  owner_status VARCHAR(20) DEFAULT 'pending',
  owner_notes TEXT,
  owner_reviewed_at TIMESTAMPTZ,
  owner_reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  match_score NUMERIC(5,2) DEFAULT 0,
  ranking_breakdown JSONB,
  CONSTRAINT job_applications_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'flagged', 'failed')),
  CONSTRAINT job_applications_owner_status_check CHECK (owner_status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS application_user_links (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_reason TEXT,
  linked_by TEXT DEFAULT 'migration',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  userId INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  fullName VARCHAR(255),
  skills TEXT[],
  certifications TEXT[],
  workHistory JSONB,
  education JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  photourl TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  dateofbirth DATE,
  nationalid VARCHAR(100),
  emergencycontact JSONB,
  professionalheadline TEXT,
  summary TEXT,
  employeeid VARCHAR(50),
  jobtitle VARCHAR(100),
  department VARCHAR(100),
  status VARCHAR(50),
  dateofjoining DATE,
  employmenttype VARCHAR(50),
  worklocation TEXT,
  reportingmanager VARCHAR(100),
  projects JSONB,
  awards JSONB,
  languages JSONB,
  memberships JSONB,
  "references" JSONB,
  volunteer JSONB,
  publications JSONB,
  interests TEXT[],
  payroll JSONB,
  leaveinfo JSONB,
  contracts JSONB,
  performance JSONB,
  documents JSONB
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Leave')),
  shift TEXT CHECK (shift IN ('Morning', 'Afternoon', 'Night')),
  punch_state TEXT CHECK (punch_state IN ('checkIn', 'breakOut', 'breakIn', 'checkOut')),
  check_in TIMESTAMPTZ,
  break_out TIMESTAMPTZ,
  break_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  total_hours_worked NUMERIC(8,2),
  punch_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, attendance_date)
);

-- KPI definitions and employee KPIs
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_kpis (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  definition_id BIGINT NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  achieved_value NUMERIC(12,2),
  final_score NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Evaluated', 'Completed', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ
);

-- Pending bonuses
CREATE TABLE IF NOT EXISTS pending_bonuses (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_kpi_id BIGINT NOT NULL REFERENCES employee_kpis(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  bonus_type TEXT NOT NULL DEFAULT 'KPI Raise',
  bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_kpi_id, period)
);

-- Leave balances and policies
CREATE TABLE IF NOT EXISTS leave_balances (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  annual NUMERIC(8,2) NOT NULL DEFAULT 30,
  sick NUMERIC(8,2) NOT NULL DEFAULT 15,
  maternity_paternity NUMERIC(8,2) NOT NULL DEFAULT 30,
  carried_forward_annual NUMERIC(8,2) NOT NULL DEFAULT 0,
  annual_lapsed NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, year)
);

CREATE UNIQUE INDEX IF NOT EXISTS leave_balances_employee_year_unique ON leave_balances (employee_id, year);

CREATE TABLE IF NOT EXISTS leave_policies (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
  max_days INTEGER NOT NULL DEFAULT 30,
  auto_approve_initial BOOLEAN NOT NULL DEFAULT FALSE,
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default leave policies
INSERT INTO leave_policies (type, requires_attachment, max_days, auto_approve_initial, rule_config)
VALUES
  ('annual', false, 30, false, '{"day_count_mode":"working_days","sandwich_weekends":false,"yearly_allocation_days":30,"carry_forward_limit":5,"allow_negative_balance":false,"department_threshold_pct":20,"accrues_during_other_leave":true}'::jsonb),
  ('sick', false, 14, true, '{"day_count_mode":"calendar_days","requires_balance":true,"allow_negative_balance":false,"split_pay":[{"up_to":7,"pay_percent":100},{"up_to":14,"pay_percent":50},{"up_to":9999,"pay_percent":0}]}'::jsonb),
  ('maternity', true, 90, false, '{"day_count_mode":"calendar_days","requires_balance":false,"statutory":true,"annual_accrual_continues":true,"department_threshold_pct":20}'::jsonb),
  ('paternity', true, 14, false, '{"day_count_mode":"calendar_days","requires_balance":false,"statutory":true,"department_threshold_pct":20}'::jsonb),
  ('compassionate', false, 10, false, '{"day_count_mode":"calendar_days","requires_balance":false,"department_threshold_pct":20}'::jsonb),
  ('unpaid', false, 30, false, '{"day_count_mode":"calendar_days","requires_balance":false,"allow_negative_balance":false}'::jsonb),
  ('off-day', false, 1, true, '{"day_count_mode":"working_days","requires_balance":false,"allow_negative_balance":false,"department_threshold_pct":20}'::jsonb)
ON CONFLICT (type) DO UPDATE SET
  requires_attachment = EXCLUDED.requires_attachment,
  max_days = EXCLUDED.max_days,
  auto_approve_initial = EXCLUDED.auto_approve_initial,
  rule_config = EXCLUDED.rule_config,
  updated_at = NOW();

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  approver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  attachment_path TEXT,
  documentation_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
  department_conflict_count INTEGER NOT NULL DEFAULT 0,
  department_conflict_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  instructions TEXT,
  days_charged INTEGER NOT NULL DEFAULT 0,
  payroll_flags JSONB,
  policy_snapshot JSONB,
  leave_balance_effect JSONB,
  requires_manager_warning BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_at TIMESTAMPTZ,
  CONSTRAINT leave_requests_status_check CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Pending_Documentation', 'Pending_Approval', 'Awaiting_Documentation', 'On_Statutory_Leave', 'Under Review'))
);

-- Project assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pay rates
CREATE TABLE IF NOT EXISTS pay_rates (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  kpi_bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Processing', 'Paid', 'Failed')),
  payment_method TEXT NOT NULL DEFAULT 'MPESA',
  payment_reference TEXT,
  payment_error TEXT,
  mpesa_transaction_id TEXT,
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ
);

-- Daily labourers
CREATE TABLE IF NOT EXISTS daily_labourers (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  daily_rate NUMERIC(10,2) NOT NULL,
  skills TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'converted')),
  registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reasonable_payment_time_hours INTEGER DEFAULT 2,
  calculated_at TIMESTAMPTZ,
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL UNIQUE
);

-- Daily attendance
CREATE TABLE IF NOT EXISTS daily_attendance (
  id BIGSERIAL PRIMARY KEY,
  labourer_id BIGINT NOT NULL REFERENCES daily_labourers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
  assigned_to TEXT,
  assigned_contractor_id INTEGER,
  assigned_milestone_id INTEGER,
  wage_for_day NUMERIC(10,2),
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (labourer_id, date)
);

-- Contractor tables
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contractor_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(20) PRIMARY KEY,
  contractor_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractor_performance (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES users(id),
  delivery_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'read')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shift settings
CREATE TABLE IF NOT EXISTS shift_settings (
  id BIGSERIAL PRIMARY KEY,
  employment_type TEXT NOT NULL,
  department TEXT,
  shift_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Onboarding
CREATE TABLE IF NOT EXISTS onboarding (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
  application_id INTEGER,
  department TEXT,
  position TEXT,
  supervisor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  probation_end_date DATE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  assets_assigned JSONB NOT NULL DEFAULT '[]'::jsonb,
  probation_reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  offer_letter_generated BOOLEAN NOT NULL DEFAULT FALSE,
  offer_letter_url TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Salary Reminders
CREATE TABLE IF NOT EXISTS salary_reminders (
  id BIGSERIAL PRIMARY KEY,
  reminder_day INTEGER NOT NULL DEFAULT 25,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notified_roles TEXT[] DEFAULT '{owner,manager}',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training Records
CREATE TABLE IF NOT EXISTS training_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  provider TEXT,
  training_type TEXT NOT NULL DEFAULT 'internal' CHECK (training_type IN ('internal', 'external', 'online', 'conference', 'certification')),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  certificate_url TEXT,
  cost NUMERIC(12,2) CHECK (cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('national_id', 'kra_pin', 'nssf', 'nhif', 'certificate', 'contract', 'offer_letter', 'passport', 'other')),
  doc_name TEXT NOT NULL,
  filename TEXT,
  url TEXT,
  expiry_date DATE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('uniform', 'tool', 'ppe', 'equipment', 'other')),
  description TEXT,
  serial_number TEXT,
  condition TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  assigned_to BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  assigned_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  return_condition TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'returned', 'lost', 'damaged')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('guest', 'employee')),
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved', 'closed')),
  submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  submitted_on_behalf_of TEXT,
  guest_name TEXT,
  guest_contact TEXT,
  guest_room TEXT,
  respondent_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  department TEXT,
  timeline JSONB DEFAULT '[]',
  resolution TEXT,
  resolution_date TIMESTAMPTZ,
  complainant_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  sla_deadline TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contractor Quotes
CREATE TABLE IF NOT EXISTS contractor_quotes (
  id BIGSERIAL PRIMARY KEY,
  contractor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_daily_wage BOOLEAN NOT NULL DEFAULT FALSE,
  daily_rate NUMERIC,
  estimated_days INTEGER,
  attachments JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES contractor_quotes(id) ON DELETE CASCADE,
  contractor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deliverables TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  budget NUMERIC NOT NULL,
  materials_request JSONB DEFAULT '[]',
  labour_request JSONB DEFAULT '[]',
  downpayment_request NUMERIC DEFAULT 0,
  downpayment_approved BOOLEAN NOT NULL DEFAULT FALSE,
  downpayment_paid BOOLEAN NOT NULL DEFAULT FALSE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  photos JSONB DEFAULT '[]',
  receipts JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'verified', 'rejected')),
  verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  kpi_score JSONB DEFAULT '{}',
  payment_released BOOLEAN NOT NULL DEFAULT FALSE,
  payment_amount NUMERIC,
  payment_date TIMESTAMPTZ,
  daily_wage_mode BOOLEAN NOT NULL DEFAULT FALSE,
  daily_wage_days JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  wage_components JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (setting_key, category, setting_value, description, data_type)
VALUES
  ('OFFICE_LATITUDE', 'location', '-1.19293', 'Office location latitude', 'number'),
  ('OFFICE_LONGITUDE', 'location', '36.93057', 'Office location longitude', 'number'),
  ('OFFICE_RADIUS_METERS', 'location', '1000', 'Allowed work location radius in meters', 'number'),
  ('OFFICE_NAME', 'location', 'Main Office', 'Name of the office location', 'string'),
  ('DEPARTMENTS', 'general', '["HR", "IT", "Finance", "Operations", "Sales", "Marketing", "Kitchen", "Security", "Housekeeping", "Grounds", "Administration"]', 'Available departments', 'array'),
  ('EMPLOYMENT_TYPES', 'general', '["Permanent", "Contractor", "Daily"]', 'Available employment types', 'array'),
  ('LEAVE_TYPES', 'general', '["annual", "sick", "maternity", "paternity", "compassionate", "unpaid", "off-day"]', 'Available leave types', 'array'),
  ('JOB_STATUSES', 'general', '["open", "closed", "filled"]', 'Available job statuses', 'array'),
  ('PUNCH_ACTIONS', 'general', '["checkIn", "breakOut", "breakIn", "checkOut"]', 'Available punch actions', 'array'),
  ('SHIFT_TYPES', 'general', '["Morning", "Afternoon", "Night"]', 'Available shift types', 'array')
ON CONFLICT (setting_key, category) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  data_type = EXCLUDED.data_type,
  updated_at = NOW();

-- Insert default shift settings
INSERT INTO shift_settings (employment_type, department, shift_name, start_time, end_time, is_default)
VALUES ('Daily', NULL, 'Morning', '08:00:00', '13:00:00', TRUE),
       ('Daily', NULL, 'Afternoon', '14:00:00', '18:00:00', FALSE)
ON CONFLICT DO NOTHING;

-- Create default admin user (password: Admin123!)
-- You should change this password after first login
INSERT INTO users (username, email, password, role, status, must_change_password, created_at, updated_at)
VALUES ('admin', 'admin@ubuntu-hrms.com', '$2b$10$TRA3kBzzXE29o2cEH6YewO70aR6rhxC LZ6B1.bRu8MC17KqM.yBtq', 'admin', 'active', TRUE, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Create default owner user (password: Owner123!)
INSERT INTO users (username, email, password, role, status, must_change_password, created_at, updated_at)
VALUES ('owner', 'owner@ubuntu-hrms.com', '$2b$10$A..so6BvSyOqocYguUA6sutpuNZgFpf wMRDiTsICuS.ksjGq6C.s2', 'owner', 'active', TRUE, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

COMMIT;
