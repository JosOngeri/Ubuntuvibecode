-- Ubuntu HRMS Complete Database Setup
-- Drops all tables and recreates with correct schema + seeds users

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_permission_overrides CASCADE;
DROP TABLE IF EXISTS department_head_assignments CASCADE;
DROP TABLE IF EXISTS supervisor_allocations CASCADE;
DROP TABLE IF EXISTS favicons CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS salary_reminders CASCADE;
DROP TABLE IF EXISTS onboarding CASCADE;
DROP TABLE IF EXISTS orientation_checklists CASCADE;
DROP TABLE IF EXISTS training CASCADE;
DROP TABLE IF EXISTS employee_documents CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS daily_attendance CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS contractor_quotes CASCADE;
DROP TABLE IF EXISTS daily_labourers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_policies CASCADE;
DROP TABLE IF EXISTS kpi_definitions CASCADE;
DROP TABLE IF EXISTS employee_kpis CASCADE;
DROP TABLE IF EXISTS pending_bonuses CASCADE;
DROP TABLE IF EXISTS settings_audit_log CASCADE;
DROP TABLE IF EXISTS mode_sessions CASCADE;
DROP TABLE IF EXISTS elevation_requests CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS contractor_performance CASCADE;
DROP TABLE IF EXISTS shift_settings CASCADE;
DROP TABLE IF EXISTS component_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS mpesa_callbacks CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'owner', 'manager', 'supervisor', 'employee', 'contractor', 'daily_labourer')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    must_change_password BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expire TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    biometric_device_id VARCHAR(100),
    mpesa_phone_number VARCHAR(50),
    employment_type VARCHAR(50),
    wage_rate DECIMAL(10, 2),
    department VARCHAR(100),
    date_joined DATE,
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    nationality VARCHAR(100),
    national_id VARCHAR(100),
    residential_address TEXT,
    emergency_contact JSONB,
    education_history JSONB,
    employment_history JSONB,
    skills JSONB,
    certifications JSONB,
    experience_years INTEGER,
    availability_weeks INTEGER,
    right_to_work VARCHAR(50),
    salary_expectation DECIMAL(10, 2),
    attendance_check_in_morning TIME,
    attendance_check_in_afternoon TIME,
    attendance_check_in_evening TIME,
    attendance_require_multiple_checkins BOOLEAN DEFAULT FALSE,
    attendance_location_id BIGINT,
    can_self_record_attendance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY LABOURERS TABLE
-- ============================================
CREATE TABLE daily_labourers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    first_name VARCHAR(200),
    last_name VARCHAR(200),
    phone VARCHAR(50),
    id_number VARCHAR(100),
    department VARCHAR(100),
    daily_wage DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    photo TEXT,
    skills JSONB DEFAULT '[]',
    urgency_level VARCHAR(50) DEFAULT 'normal',
    calculated_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    converted_to_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    registered_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    serial_number VARCHAR(255),
    condition VARCHAR(100) DEFAULT 'new',
    assigned_to BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    assigned_date DATE,
    return_date DATE,
    return_condition VARCHAR(100),
    status VARCHAR(50) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Present',
    shift VARCHAR(100),
    punch_state VARCHAR(50),
    check_in TIMESTAMPTZ,
    break_out TIMESTAMPTZ,
    break_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    total_hours_worked DECIMAL(5,2),
    punch_history JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYSLIPS TABLE
-- ============================================
CREATE TABLE payslips (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,
    gross_pay DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    kpi_bonus DECIMAL(12,2) DEFAULT 0,
    deductions JSONB DEFAULT '{}',
    net_pay DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft',
    payment_method VARCHAR(50) DEFAULT 'MPESA',
    payment_reference VARCHAR(255),
    mpesa_transaction_id VARCHAR(255),
    payment_error TEXT,
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    photo_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    national_id VARCHAR(100),
    emergency_contact JSONB,
    professional_headline TEXT,
    summary TEXT,
    employee_id VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(50),
    date_of_joining DATE,
    employment_type VARCHAR(50),
    work_location TEXT,
    reporting_manager VARCHAR(100),
    certifications JSONB,
    work_history JSONB,
    education JSONB,
    skills JSONB,
    projects JSONB,
    awards JSONB,
    languages JSONB,
    memberships JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY ATTENDANCE TABLE
-- ============================================
CREATE TABLE daily_attendance (
    id BIGSERIAL PRIMARY KEY,
    labourer_id BIGINT REFERENCES daily_labourers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(50),
    assigned_to VARCHAR(100) DEFAULT 'other',
    assigned_contractor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_milestone_id BIGINT REFERENCES milestones(id) ON DELETE SET NULL,
    wage_for_day DECIMAL(10, 2),
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    labourer_id BIGINT REFERENCES daily_labourers(id) ON DELETE SET NULL,
    period_start DATE,
    period_end DATE,
    amount DECIMAL(12, 2),
    payment_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    payment_date DATE,
    mpesa_receipt VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE (Recruitment)
-- ============================================
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    description TEXT,
    requirements TEXT,
    employment_type VARCHAR(50),
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    salary_range VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closing_date DATE,
    responsibilities TEXT,
    benefits TEXT,
    qualifications JSONB DEFAULT '[]',
    evaluation_params JSONB DEFAULT '{}',
    advertisement_data JSONB DEFAULT '{}',
    advertisement_image_path VARCHAR(255),
    number_of_positions INTEGER DEFAULT 1,
    career_level VARCHAR(100),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    work_schedule VARCHAR(255),
    required_languages VARCHAR(255),
    experience_level VARCHAR(100),
    education_requirements TEXT
);

-- ============================================
-- JOB APPLICATIONS TABLE
-- ============================================
CREATE TABLE job_applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    nationality VARCHAR(100),
    national_id VARCHAR(100),
    residential_address TEXT,
    emergency_contact JSONB,
    education_history JSONB,
    employment_history JSONB,
    skills JSONB,
    certifications JSONB,
    experience_years INTEGER,
    availability_weeks INTEGER,
    right_to_work VARCHAR(50),
    salary_expectation DECIMAL(10, 2),
    cover_letter TEXT,
    resume_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    verification_status VARCHAR(50),
    verification_score INTEGER,
    verification_results JSONB,
    verification_flags JSONB,
    ai_ranking INTEGER,
    ai_ranking_breakdown JSONB,
    verified_at TIMESTAMPTZ,
    verified_by BIGINT REFERENCES users(id),
    manager_ranking INTEGER,
    manager_notes TEXT,
    manager_reviewed_at TIMESTAMPTZ,
    manager_reviewed_by BIGINT REFERENCES users(id),
    owner_status VARCHAR(50),
    owner_notes TEXT,
    owner_reviewed_at TIMESTAMPTZ,
    owner_reviewed_by BIGINT REFERENCES users(id),
    interview_score INTEGER,
    interview_notes TEXT,
    interview_status VARCHAR(50),
    interview_date TIMESTAMPTZ,
    interview_invitations JSONB DEFAULT '[]',
    interview_feedbacks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MILESTONES TABLE
-- ============================================
CREATE TABLE milestones (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- TRAINING TABLE
-- ============================================
CREATE TABLE training (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    certificate_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEE DOCUMENTS TABLE
-- ============================================
CREATE TABLE employee_documents (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    file_url VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTOR QUOTES TABLE
-- ============================================
CREATE TABLE contractor_quotes (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    job_description TEXT,
    quote_amount DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    setting_value TEXT,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    updated_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAVICONS TABLE
-- ============================================
CREATE TABLE favicons (
    id BIGSERIAL PRIMARY KEY,
    svg_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    uploaded_by BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ONBOARDING TABLE
-- ============================================
CREATE TABLE onboarding (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES job_applications(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    position VARCHAR(100),
    supervisor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    probation_end_date DATE,
    status VARCHAR(50) DEFAULT 'in_progress',
    steps JSONB DEFAULT '[]',
    orientation_checklist JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    assets_assigned JSONB DEFAULT '[]',
    probation_reviews JSONB DEFAULT '[]',
    offer_letter_generated BOOLEAN DEFAULT FALSE,
    offer_letter_url TEXT,
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    confirmed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORIENTATION CHECKLISTS TABLE
-- ============================================
CREATE TABLE orientation_checklists (
    id BIGSERIAL PRIMARY KEY,
    onboarding_id BIGINT REFERENCES onboarding(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALARY REMINDERS TABLE
-- ============================================
CREATE TABLE salary_reminders (
    id BIGSERIAL PRIMARY KEY,
    reminder_date DATE NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERMISSION SYSTEM TABLES
-- ============================================

-- User Permission Overrides (time-based permissions)
CREATE TABLE user_permission_overrides (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT TRUE,
    granted_by BIGINT REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    duration_type VARCHAR(20) CHECK (duration_type IN ('permanent', 'days', 'hours', 'minutes')),
    duration_value INTEGER,
    reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by BIGINT REFERENCES users(id),
    revoke_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supervisor Allocations
CREATE TABLE supervisor_allocations (
    id BIGSERIAL PRIMARY KEY,
    supervisor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    supervisee_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('permanent', 'temporary', 'ad_hoc', 'undefined')),
    start_date DATE,
    end_date DATE,
    permissions JSONB DEFAULT '[]',
    assigned_by BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supervisor_id, supervisee_id)
);

-- Department Head Assignments
CREATE TABLE department_head_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]',
    assigned_by BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    entity_name VARCHAR(255),
    previous_data JSONB,
    department_id BIGINT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLAINTS TABLE
-- ============================================
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100),
    category VARCHAR(100),
    sub_category VARCHAR(100),
    description TEXT,
    urgency VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    submitted_on_behalf_of BIGINT REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    guest_contact VARCHAR(255),
    guest_room VARCHAR(100),
    respondent_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    timeline JSONB DEFAULT '[]',
    resolution TEXT,
    resolution_date DATE,
    complainant_confirmed BOOLEAN DEFAULT FALSE,
    sla_deadline DATE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Chat/Complaints)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(255),
    recipient_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    tags TEXT,
    conversation_id BIGINT,
    attachments JSONB,
    parent_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by BIGINT REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAVE POLICIES TABLE
-- ============================================
CREATE TABLE leave_policies (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    max_days INTEGER NOT NULL,
    requires_attachment BOOLEAN DEFAULT FALSE,
    auto_approve_initial BOOLEAN DEFAULT FALSE,
    rule_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================
CREATE TABLE leave_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    attachment_path VARCHAR(500),
    documentation_submitted BOOLEAN DEFAULT FALSE,
    requires_attachment BOOLEAN DEFAULT FALSE,
    department_conflict_count INTEGER DEFAULT 0,
    department_conflict_pct DECIMAL(5,2) DEFAULT 0,
    instructions TEXT,
    days_charged INTEGER,
    payroll_flags JSONB,
    policy_snapshot JSONB,
    leave_balance_effect JSONB,
    requires_manager_warning BOOLEAN DEFAULT FALSE,
    approver_id BIGINT REFERENCES users(id),
    decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAVE BALANCES TABLE
-- ============================================
CREATE TABLE leave_balances (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    annual DECIMAL(10,2) DEFAULT 0,
    sick DECIMAL(10,2) DEFAULT 0,
    maternity_paternity DECIMAL(10,2) DEFAULT 0,
    carried_forward_annual DECIMAL(10,2) DEFAULT 0,
    annual_lapsed DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, year)
);

-- ============================================
-- KPI DEFINITIONS TABLE
-- ============================================
CREATE TABLE kpi_definitions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEE KPIS TABLE
-- ============================================
CREATE TABLE employee_kpis (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id BIGINT REFERENCES users(id),
    definition_id BIGINT REFERENCES kpi_definitions(id),
    period VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2),
    achieved_value DECIMAL(10,2),
    final_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PENDING BONUSES TABLE
-- ============================================
CREATE TABLE pending_bonuses (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    employee_kpi_id BIGINT REFERENCES employee_kpis(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL,
    bonus_type VARCHAR(50) DEFAULT 'KPI Raise',
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_kpi_id, period)
);

-- ============================================
-- SETTINGS AUDIT LOG TABLE
-- ============================================
CREATE TABLE settings_audit_log (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_by BIGINT REFERENCES users(id),
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM LOGS TABLE
-- ============================================
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(100),
    action VARCHAR(100),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODE SESSIONS TABLE
-- ============================================
CREATE TABLE mode_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    current_mode VARCHAR(50) NOT NULL,
    switch_reason TEXT,
    switched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ============================================
-- ELEVATION REQUESTS TABLE
-- ============================================
CREATE TABLE elevation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(10),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by BIGINT REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE contracts (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    terms TEXT,
    status VARCHAR(50) DEFAULT 'active',
    document_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    due_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTOR PERFORMANCE TABLE
-- ============================================
CREATE TABLE contractor_performance (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    delivery_rate INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHIFT SETTINGS TABLE
-- ============================================
CREATE TABLE shift_settings (
    id BIGSERIAL PRIMARY KEY,
    employment_type VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPONENT SETTINGS TABLE
-- ============================================
CREATE TABLE component_settings (
    id BIGSERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    is_global BOOLEAN DEFAULT TRUE,
    user_id BIGINT REFERENCES users(id),
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MPESA CALLBACKS TABLE
-- ============================================
CREATE TABLE mpesa_callbacks (
    id BIGSERIAL PRIMARY KEY,
    callback_type VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    status_code VARCHAR(50),
    status_desc TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Employees indexes
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE UNIQUE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);

-- Supervisor allocations indexes
CREATE INDEX idx_supervisor_allocations_supervisor_id ON supervisor_allocations(supervisor_id);
CREATE INDEX idx_supervisor_allocations_supervisee_id ON supervisor_allocations(supervisee_id);
CREATE INDEX idx_supervisor_allocations_is_active ON supervisor_allocations(is_active);

-- Department head indexes
CREATE INDEX idx_dept_head_user_id ON department_head_assignments(user_id);
CREATE INDEX idx_dept_head_department ON department_head_assignments(department);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Message indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_parent_id ON messages(parent_id);

-- Leave indexes
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_employee_id ON leave_balances(employee_id);

-- KPI indexes
CREATE INDEX idx_employee_kpis_employee_id ON employee_kpis(employee_id);
CREATE INDEX idx_employee_kpis_definition_id ON employee_kpis(definition_id);
CREATE INDEX idx_pending_bonuses_employee_id ON pending_bonuses(employee_id);

-- Contracts indexes
CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);

-- Contractor indexes
CREATE INDEX idx_projects_contractor_id ON projects(contractor_id);
CREATE INDEX idx_invoices_contractor_id ON invoices(contractor_id);

-- Shift settings indexes
CREATE INDEX idx_shift_settings_employment_type ON shift_settings(employment_type);

-- Mpesa callbacks index
CREATE INDEX idx_mpesa_callbacks_reference ON mpesa_callbacks(reference);

-- ============================================
-- SEED USERS (Password: role + "123", e.g., admin123, manager123)
-- ============================================

INSERT INTO users (username, email, password, role, status, must_change_password, created_at, updated_at)
VALUES
  ('admin', 'admin@ubuntu-hrms.com', '$2b$10$/5DvGqvnM7EoIhn33ZLW4.0sqSr..MfIQXEnvjLdXwls4MJ41bTkS', 'admin', 'active', FALSE, NOW(), NOW()),
  ('owner', 'owner@ubuntu-hrms.com', '$2b$10$X7oMyy5wLgD4Fz1HJ7FJTOY0QzC7j1P.L8q8W5iXqgUqNQqJ1Xq9u', 'owner', 'active', FALSE, NOW(), NOW()),
  ('manager', 'manager@ubuntu-hrms.com', '$2b$10$Ql/8HBbuZZkjCPCuxlAfJeKp2m7gz9Y.cxnniMjWgLyHz/u9JlTea', 'manager', 'active', FALSE, NOW(), NOW()),
  ('supervisor', 'supervisor@ubuntu-hrms.com', '$2b$10$bAnSwUkoxBoufEjr6KFbIOmNGw3iP4nECZlgXBvH/n1kL.WITVNmm', 'supervisor', 'active', FALSE, NOW(), NOW()),
  ('employee', 'employee@ubuntu-hrms.com', '$2b$10$zK3K2Yq/Ld2K2AyW/erLIO.z1qWIa5DSBrhDC65.br98SYZQXq.tG', 'employee', 'active', FALSE, NOW(), NOW()),
  ('contractor', 'contractor@ubuntu-hrms.com', '$2b$10$ayd07k5ScEBoQPwUJjvmuOeljRdlW9cropIZehmzzA6.mLnqpnIDG', 'contractor', 'active', FALSE, NOW(), NOW()),
  ('daily_labourer', 'daily_labourer@ubuntu-hrms.com', '$2b$10$nnxolRc6C5Aela6XJpBF4OVIWKsajLUSQurLfBjL1Z5ESsZ0bMVLG', 'daily_labourer', 'active', FALSE, NOW(), NOW());

-- ============================================
-- DEFAULT SETTINGS
-- ============================================

INSERT INTO settings (setting_key, category, setting_value, description, data_type, is_active, created_at, updated_at)
VALUES
    ('SHIFT_TYPES', 'attendance', '["Morning", "Afternoon", "Evening"]', 'Available shift types for attendance tracking', 'array', true, NOW(), NOW()),
    ('EMPLOYMENT_STATUS', 'recruitment', '["Full-time", "Part-time", "Contract", "Self-employed", "Intern", "Freelance"]', 'Employment status options for job applications', 'array', true, NOW(), NOW()),
    ('APPLICATION_STATUS', 'recruitment', '["pending", "shortlisted", "rejected", "hired", "withdrawn"]', 'Job application status categories', 'array', true, NOW(), NOW()),
    ('DAILY_LABOUR_DEPARTMENTS', 'daily_labour', '["farm", "housekeeping", "grounds", "construction", "kitchen", "other"]', 'Department options for daily labour assignments', 'array', true, NOW(), NOW()),
    ('ATTENDANCE_LOCATIONS', 'attendance', '[]', 'Configurable GPS locations for attendance check-in', 'array', true, NOW(), NOW()),
    ('ATTENDANCE_GPS_ENABLED', 'attendance', 'true', 'Enable GPS validation for attendance', 'boolean', true, NOW(), NOW()),
    ('ATTENDANCE_GPS_RADIUS_METERS', 'attendance', '100', 'Default GPS radius for attendance validation in meters', 'number', true, NOW(), NOW()),
    ('DEPARTMENTS', 'organization', '["Front Office", "Housekeeping", "Kitchen", "Farm", "Grounds", "Admin", "Engineering", "HR", "Finance"]', 'Organization departments available across the system for jobs, employees, reports, and filters', 'array', true, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- LEAVE POLICIES
-- ============================================

INSERT INTO leave_policies (type, max_days, requires_attachment, auto_approve_initial, rule_config, created_at, updated_at)
VALUES
    ('annual', 30, FALSE, FALSE, '{"day_count_mode": "working_days", "sandwich_weekends": false, "yearly_allocation_days": 30, "carry_forward_limit": 5, "allow_negative_balance": false, "department_threshold_pct": 20, "accrues_during_other_leave": true}', NOW(), NOW()),
    ('sick', 15, FALSE, TRUE, '{"day_count_mode": "calendar_days", "requires_balance": true, "allow_negative_balance": false, "split_pay": [{"up_to": 7, "pay_percent": 100}, {"up_to": 14, "pay_percent": 50}, {"up_to": 9999, "pay_percent": 0}]}', NOW(), NOW()),
    ('maternity', 90, TRUE, FALSE, '{"day_count_mode": "calendar_days", "requires_balance": false, "statutory": true, "annual_accrual_continues": true, "department_threshold_pct": 20}', NOW(), NOW()),
    ('paternity', 14, TRUE, FALSE, '{"day_count_mode": "calendar_days", "requires_balance": false, "statutory": true, "department_threshold_pct": 20}', NOW(), NOW()),
    ('compassionate', 5, FALSE, FALSE, '{"day_count_mode": "calendar_days", "requires_balance": false, "department_threshold_pct": 20}', NOW(), NOW()),
    ('unpaid', 365, FALSE, FALSE, '{"day_count_mode": "calendar_days", "requires_balance": false, "allow_negative_balance": false}', NOW(), NOW())
ON CONFLICT (type) DO NOTHING;

-- ============================================
-- SHIFT SETTINGS
-- ============================================

INSERT INTO shift_settings (employment_type, department, shift_name, start_time, end_time, is_default, created_at, updated_at)
VALUES
    ('Full-time', NULL, 'Morning', '06:00', '14:00', TRUE, NOW(), NOW()),
    ('Full-time', NULL, 'Afternoon', '14:00', '22:00', FALSE, NOW(), NOW()),
    ('Full-time', NULL, 'Evening', '22:00', '06:00', FALSE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- OFFICE LOCATION SETTINGS
-- ============================================

INSERT INTO settings (setting_key, category, setting_value, description, data_type, is_active, created_at, updated_at)
VALUES
    ('OFFICE_LATITUDE', 'attendance', '-1.286389', 'Office GPS latitude coordinate', 'number', true, NOW(), NOW()),
    ('OFFICE_LONGITUDE', 'attendance', '36.817223', 'Office GPS longitude coordinate', 'number', true, NOW(), NOW()),
    ('OFFICE_RADIUS_METERS', 'attendance', '100', 'GPS radius for office attendance validation in meters', 'number', true, NOW(), NOW()),
    ('OFFICE_NAME', 'attendance', 'Main Office', 'Name of the main office location', 'string', true, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- DEFAULT FAVICON
-- ============================================

INSERT INTO favicons (svg_content, is_active, uploaded_at)
VALUES (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#4F46E5" width="100" height="100" rx="20"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="white">U</text></svg>',
    TRUE,
    NOW()
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_permission_overrides IS 'Granular time-based permissions for users, separate from role-based permissions';
COMMENT ON TABLE supervisor_allocations IS 'Links supervisors to their allocated employees with time-based assignments';
COMMENT ON TABLE department_head_assignments IS 'Department head assignments with configurable permissions';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system actions';
COMMENT ON TABLE notifications IS 'User notifications with read tracking';
COMMENT ON TABLE messages IS 'Internal messaging system including complaints and recommendations';
