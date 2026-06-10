# Model ↔ Database Alignment Checklist

**Project:** Ubuntu HRMS  
**Date:** 2026-06-09  
**Total Models:** 26 | **Total DB Tables:** 29  

Legend: ✅ Aligned | ⚠️ Mismatches | ❌ Table Missing in DB | 🔧 Needs Fix

---

## Master Checklist

| # | Model | DB Table | Table Exists | Columns Match | Status | Action |
|---|-------|----------|:---:|:---:|:---:|--------|
| 1 | Asset.model.js | assets | ✅ | ✅ | ✅ Done | None |
| 2 | Attendance.model.js | attendance | ✅ | ✅ | ✅ Done | None |
| 3 | AuditLog.model.js | audit_logs | ❌ | ❌ | 🔧 Fix | Create table |
| 4 | Complaint.model.js | complaints | ✅ | ✅ | ✅ Done | None |
| 5 | ContractorQuote.model.js | contractor_quotes | ❌ | ❌ | 🔧 Fix | Create table |
| 6 | DailyAttendance.model.js | daily_attendance | ✅ | ⚠️ | 🔧 Fix | Add missing `notes` column |
| 7 | DailyLabourer.model.js | daily_labourers | ✅ | ⚠️ | 🔧 Fix | Add `user_id`, `photo`, `converted_to_employee_id`, `notes` |
| 8 | DepartmentHeadAssignment.model.js | department_head_assignments | ❌ | ❌ | 🔧 Fix | Create table |
| 9 | Employee.model.js | employees | ✅ | ✅ | ✅ Done | None |
| 10 | EmployeeDocument.model.js | employee_documents | ❌ | ❌ | 🔧 Fix | Create table |
| 11 | Favicon.model.js | favicons | ❌ | ❌ | 🔧 Fix | Create table |
| 12 | Job.model.js | jobs | ✅ | ✅ | ✅ Done | None |
| 13 | JobApplication.model.js | job_applications | ✅ | ✅ | ✅ Done | None |
| 14 | KPI.model.js | kpi_definitions | ✅ | ✅ | ✅ Done | None |
| 15 | Message.model.js | messages | ✅ | ✅ | ✅ Done | None |
| 16 | Milestone.model.js | milestones | ❌ | ❌ | 🔧 Fix | Create table (full schema) |
| 17 | Notification.model.js | notifications | ✅ | ⚠️ | 🔧 Fix | Add `entity_type`, `entity_id`, `is_read`, `updated_at` |
| 18 | Onboarding.model.js | onboarding | ✅ | ✅ | ✅ Done | None |
| 19 | OrientationChecklist.model.js | orientation_checklists | ❌ | ❌ | 🔧 Fix | Create table |
| 20 | Payment.model.js | payments | ❌ | ❌ | 🔧 Fix | Create table |
| 21 | Profile.model.js | profiles | ✅ | ⚠️ | 🔧 Fix | Columns use camelCase in DB — add snake_case aliases |
| 22 | SupervisorAllocation.model.js | supervisor_allocations | ❌ | ❌ | 🔧 Fix | Create table |
| 23 | SystemLog.model.js | system_logs | ❌ | ❌ | 🔧 Fix | Create table |
| 24 | Training.model.js | training | ❌ | ❌ | 🔧 Fix | Create table |
| 25 | User.model.js | users | ✅ | ✅ | ✅ Done | None |
| 26 | UserPermissionOverride.model.js | user_permission_overrides | ❌ | ❌ | 🔧 Fix | Create table |

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Fully aligned (no action) | 9 |
| ⚠️ Table exists, columns mismatched | 4 |
| ❌ Table missing entirely | 13 |
| **Total needing fixes** | **17** |

---

## Detailed Issues

### Group A — Tables Missing Entirely (13)

#### 1. `audit_logs` — AuditLog.model.js
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(255),
    user_role VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),
    previous_data JSONB,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    department_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `contractor_quotes` — ContractorQuote.model.js
```sql
CREATE TABLE contractor_quotes (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    project_title VARCHAR(255),
    description TEXT,
    amount DECIMAL(12,2),
    timeline TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    is_daily_wage BOOLEAN DEFAULT FALSE,
    daily_rate DECIMAL(10,2),
    estimated_days INTEGER,
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `department_head_assignments` — DepartmentHeadAssignment.model.js
```sql
CREATE TABLE department_head_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]',
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `employee_documents` — EmployeeDocument.model.js
```sql
CREATE TABLE employee_documents (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    doc_type VARCHAR(100),
    doc_name VARCHAR(255),
    filename VARCHAR(255),
    url TEXT,
    expiry_date DATE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `favicons` — Favicon.model.js
```sql
CREATE TABLE favicons (
    id BIGSERIAL PRIMARY KEY,
    svg_content TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `milestones` — Milestone.model.js
```sql
CREATE TABLE milestones (
    id BIGSERIAL PRIMARY KEY,
    quote_id BIGINT REFERENCES contractor_quotes(id) ON DELETE SET NULL,
    contractor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deliverables JSONB DEFAULT '[]',
    deadline DATE,
    budget DECIMAL(12,2),
    materials_request JSONB DEFAULT '{}',
    labour_request JSONB DEFAULT '{}',
    downpayment_request DECIMAL(12,2),
    downpayment_approved BOOLEAN DEFAULT FALSE,
    downpayment_paid BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    photos JSONB DEFAULT '[]',
    receipts JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    verified_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    kpi_score DECIMAL(5,2),
    payment_released BOOLEAN DEFAULT FALSE,
    payment_amount DECIMAL(12,2),
    payment_date TIMESTAMPTZ,
    daily_wage_mode BOOLEAN DEFAULT FALSE,
    daily_wage_days INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `orientation_checklists` — OrientationChecklist.model.js
```sql
CREATE TABLE orientation_checklists (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(100),
    checklist JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. `payments` — Payment.model.js
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(12,2),
    date DATE,
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    wage_components JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. `supervisor_allocations` — SupervisorAllocation.model.js
```sql
CREATE TABLE supervisor_allocations (
    id BIGSERIAL PRIMARY KEY,
    supervisor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    supervisee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    permissions JSONB DEFAULT '[]',
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. `system_logs` — SystemLog.model.js
```sql
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(100),
    action VARCHAR(100),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11. `training` — Training.model.js
```sql
CREATE TABLE training (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    training_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    score DECIMAL(5,2),
    certificate_url TEXT,
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 12. `user_permission_overrides` — UserPermissionOverride.model.js
```sql
CREATE TABLE user_permission_overrides (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(255) NOT NULL,
    is_granted BOOLEAN DEFAULT TRUE,
    granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    duration_type VARCHAR(50),
    duration_value INTEGER,
    quantity INTEGER,
    reason TEXT,
    revoked_at TIMESTAMPTZ,
    reverted_at TIMESTAMPTZ,
    revoked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reverted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    revoke_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Group B — Table Exists, Columns Missing (4)

#### 1. `daily_attendance` — missing `notes`
Model expects: `notes TEXT`  
Fix: `ALTER TABLE daily_attendance ADD COLUMN IF NOT EXISTS notes TEXT;`

#### 2. `daily_labourers` — missing 4 columns
Model expects: `user_id`, `photo`, `converted_to_employee_id`, `notes`  
Fix:
```sql
ALTER TABLE daily_labourers ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE daily_labourers ADD COLUMN IF NOT EXISTS photo VARCHAR(500);
ALTER TABLE daily_labourers ADD COLUMN IF NOT EXISTS converted_to_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE daily_labourers ADD COLUMN IF NOT EXISTS notes TEXT;
```

#### 3. `notifications` — missing 4 columns
DB has: `id, user_id, type, title, message, action_link, status, channel, sent_at, read_at, created_at`  
Model expects additionally: `entity_type`, `entity_id`, `is_read`, `updated_at`  
Fix:
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id BIGINT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

#### 4. `profiles` — column name mismatch (camelCase vs snake_case)
DB uses camelCase (`userid`, `fullname`, `photourl`, etc.)  
Model expects snake_case (`user_id`, `full_name`, `photo_url`, etc.)  
Fix: Rename all columns to snake_case.

---

## Implementation Plan

### Phase 1 — Create missing tables (in dependency order)
Order matters due to foreign keys: `contractor_quotes` before `milestones`.

1. `audit_logs`
2. `system_logs`
3. `favicons`
4. `employee_documents`
5. `orientation_checklists`
6. `department_head_assignments`
7. `supervisor_allocations`
8. `user_permission_overrides`
9. `payments`
10. `training`
11. `contractor_quotes`
12. `milestones` ← depends on contractor_quotes

### Phase 2 — Fix existing tables (ALTER TABLE)
1. `daily_attendance` — add `notes`
2. `daily_labourers` — add 4 columns
3. `notifications` — add 4 columns
4. `profiles` — rename camelCase → snake_case columns

### Phase 3 — Update init-database.sql
Sync all changes back to init-database.sql so fresh installs are complete.

### Phase 4 — Final verification
Run column-by-column verification query for all 26 models.

---

## Verification Queries (run after all fixes)

```sql
-- Check all required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'assets','attendance','audit_logs','complaints','contractor_quotes',
  'daily_attendance','daily_labourers','department_head_assignments',
  'employees','employee_documents','favicons','jobs','job_applications',
  'kpi_definitions','messages','milestones','notifications','onboarding',
  'orientation_checklists','payments','profiles','supervisor_allocations',
  'system_logs','training','users','user_permission_overrides'
)
ORDER BY table_name;
-- Expected: 26 rows

-- Check daily_attendance has notes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'daily_attendance' AND column_name = 'notes';

-- Check daily_labourers has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'daily_labourers'
AND column_name IN ('user_id','photo','converted_to_employee_id','notes');

-- Check notifications has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'notifications'
AND column_name IN ('entity_type','entity_id','is_read','updated_at');

-- Check profiles uses snake_case
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('user_id','full_name','photo_url','date_of_birth');
```

---

*Last updated: 2026-06-09*
