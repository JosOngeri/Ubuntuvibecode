# Database Schema Alignment Resolution Plan

**Project:** Ubuntu HRMS  
**Document Version:** 1.0  
**Date:** 2026-06-09  
**Status:** Active  
**Author:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Findings Overview](#findings-overview)
3. [Priority 1 — Critical Issues](#priority-1--critical-issues)
   - [Issue 1: KPI Model Column Name Mismatch](#issue-1-kpi-model-column-name-mismatch)
   - [Issue 2: Incomplete Onboarding Model](#issue-2-incomplete-onboarding-model)
4. [Priority 2 — High Priority (Migrations Required)](#priority-2--high-priority-migrations-required)
   - [Issue 3: Jobs Table Missing Columns](#issue-3-jobs-table-missing-columns)
   - [Issue 4: Job Applications Missing Interview Columns](#issue-4-job-applications-missing-interview-columns)
5. [Priority 3 — Medium Priority (Code Quality)](#priority-3--medium-priority-code-quality)
   - [Issue 5: Duplicate Controller Structure](#issue-5-duplicate-controller-structure)
6. [Priority 4 — Low Priority (Documentation)](#priority-4--low-priority-documentation)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing Strategy](#testing-strategy)
9. [Risk Mitigation](#risk-mitigation)
10. [Success Criteria](#success-criteria)

---

## Executive Summary

A comprehensive audit of the Ubuntu HRMS codebase identified misalignments between the PostgreSQL database schema and the backend models/controllers. These misalignments range from critical column name mismatches that break core functionality, to incomplete model implementations, to missing columns pending migrations.

**Total Issues Found:** 5  
**Critical:** 2  
**High:** 2  
**Medium:** 1  

All issues must be resolved to ensure system stability, data integrity, and full feature availability.

---

## Findings Overview

| # | Issue | Severity | Files Affected | Status |
|---|-------|----------|---------------|--------|
| 1 | KPI model uses wrong column names (`name`/`target` vs `title`/`max_score`) | ❌ Critical | `KPI.model.js`, `kpi.controller.js` | Unresolved |
| 2 | Onboarding model is an empty stub — no CRUD implementation | ❌ Critical | `Onboarding.model.js`, `onboarding.controller.js` | Unresolved |
| 3 | Jobs table missing extended columns (added only via migration) | ⚠️ High | `Job.model.js`, migration `20240602000001` | Pending migration |
| 4 | Job Applications missing interview columns (added only via migration) | ⚠️ High | `JobApplication.model.js`, migration `011` | Pending migration |
| 5 | Duplicate controllers in two directories — `controllers/` and `src/features/` | 📋 Medium | Multiple controller files | Unresolved |

---

## Priority 1 — Critical Issues

These must be resolved immediately as they break core system functionality.

---

### Issue 1: KPI Model Column Name Mismatch

**Severity:** ❌ Critical — System Breaking  
**Impact:** KPI functionality completely non-functional  
**Root Cause:** The `KPI.model.js` was written using incorrect column names that do not match the database schema.

#### Schema vs Model Comparison

| Database Column (`kpi_definitions`) | Model Property | Match? |
|--------------------------------------|---------------|--------|
| `title` | `name` | ❌ Mismatch |
| `description` | `description` | ✅ OK |
| `max_score` | `target` | ❌ Mismatch |
| `created_at` | `createdAt` | ✅ OK |
| `updated_at` | — | ❌ Not mapped |

#### Files to Modify

| File | Change Required |
|------|----------------|
| `backend/models/KPI.model.js` | Rename `name` → `title`, `target` → `max_score`. Add `updated_at` mapping. Fix all SQL queries. |
| `backend/controllers/kpi.controller.js` | Review all queries referencing `name` or `target`. Update response mappings. |
| `frontend/src/pages/admin/KPI.jsx` | Update field references to match new names |
| `frontend/src/pages/kpi/Manage.jsx` | Update field references to match new names |

#### Step-by-Step Fix

**Step 1 — Update `KPI.model.js` mapRow function**
```js
// BEFORE
const mapRow = (row) => new KPI({
  id: row.id,
  name: row.name,           // ❌ wrong column
  target: row.target,       // ❌ wrong column
  ...
});

// AFTER
const mapRow = (row) => new KPI({
  id: row.id,
  title: row.title,         // ✅ correct column
  maxScore: row.max_score,  // ✅ correct column
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
```

**Step 2 — Update constructor**
```js
// BEFORE
this.name = data.name ?? null;
this.target = data.target ?? null;

// AFTER
this.title = data.title ?? null;
this.maxScore = data.maxScore ?? null;
this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
```

**Step 3 — Update SQL in `save()` method**
```sql
-- BEFORE
INSERT INTO kpi_definitions (name, description, target, created_at)

-- AFTER
INSERT INTO kpi_definitions (title, description, max_score, created_at, updated_at)
```

**Step 4 — Update kpi.controller.js queries**
```sql
-- Review all occurrences of:
SELECT ... name, target ...
-- Replace with:
SELECT ... title, max_score ...
```

#### Acceptance Criteria
- [ ] All KPI CRUD operations work without errors
- [ ] KPI dashboard shows correct field values
- [ ] KPI assignment and evaluation functions correctly
- [ ] No runtime errors in KPI-related API calls

---

### Issue 2: Incomplete Onboarding Model

**Severity:** ❌ Critical — Feature Non-Functional  
**Impact:** Onboarding system non-functional; employees cannot be onboarded  
**Root Cause:** `Onboarding.model.js` contains only a stub `init()` method with no CRUD implementation.

#### Database Schema (`onboarding` table)

```sql
CREATE TABLE onboarding (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Current Model State
```js
// backend/models/Onboarding.model.js — CURRENT (broken)
const Onboarding = {
  async init() {
    // ensureColumns() removed - columns managed via migrations
  },
};
module.exports = Onboarding;
```

#### Required Implementation

The model needs to be fully rewritten with the following methods:

| Method | Description |
|--------|-------------|
| `mapRow(row)` | Maps DB row to JS object |
| `find(filter)` | Returns array of records with optional filtering |
| `findById(id)` | Returns a single onboarding record by ID |
| `findOne(criteria)` | Returns first match for given criteria |
| `findByEmployeeId(employeeId)` | Returns all onboarding records for an employee |
| `save()` | Inserts new or updates existing record |
| `findByIdAndUpdate(id, update)` | Loads + updates + saves a record |
| `findByIdAndDelete(id)` | Deletes a record by ID |
| `toJSON()` | Returns serializable object |

#### Files to Modify

| File | Change Required |
|------|----------------|
| `backend/models/Onboarding.model.js` | Full rewrite with complete CRUD implementation |
| `backend/controllers/onboarding.controller.js` | Update to use proper model methods |
| `backend/migrations/20240602000003_add_onboarding_columns.sql` | Verify and run if not already applied |

#### Onboarding Controller Endpoints to Verify

| Method | Route | Expected Behaviour |
|--------|-------|--------------------|
| `GET` | `/api/onboarding` | List all onboarding records |
| `GET` | `/api/onboarding/:id` | Get single record |
| `GET` | `/api/onboarding/employee/:employeeId` | Get by employee |
| `POST` | `/api/onboarding` | Create new onboarding |
| `PUT` | `/api/onboarding/:id` | Update record |
| `DELETE` | `/api/onboarding/:id` | Delete record |

#### Acceptance Criteria
- [ ] All onboarding CRUD operations work without errors
- [ ] Onboarding records can be created for employees
- [ ] Status transitions work correctly (`in_progress` → `completed`)
- [ ] Orientation checklists link correctly to onboarding records
- [ ] Admin UI can view and manage onboarding records

---

## Priority 2 — High Priority (Migrations Required)

These issues degrade existing features and must be resolved by running the appropriate migrations.

---

### Issue 3: Jobs Table Missing Columns

**Severity:** ⚠️ High — Feature Degraded  
**Impact:** Advanced job posting features (qualifications, evaluation params, advertisement data) unavailable  
**Root Cause:** Extended columns defined in `Job.model.js` were removed from `init-database.sql` and are only added via migration.

#### Missing Columns (require migration)

| Column | Type | Default | Migration |
|--------|------|---------|-----------|
| `responsibilities` | TEXT | — | `20240602000001` |
| `benefits` | TEXT | — | `20240602000001` |
| `salary_range` | VARCHAR(100) | — | `20240602000001` |
| `qualifications` | JSONB | `[]` | `20240602000001` |
| `evaluation_params` | JSONB | `{}` | `20240602000001` |
| `advertisement_data` | JSONB | `{}` | `20240602000001` |
| `advertisement_image_path` | VARCHAR(255) | — | `20240602000001` |
| `number_of_positions` | INTEGER | 1 | `20240602000001` |
| `career_level` | VARCHAR(100) | — | `20240602000001` |
| `contact_person` | VARCHAR(255) | — | `20240602000001` |
| `contact_phone` | VARCHAR(50) | — | `20240602000001` |
| `contact_email` | VARCHAR(255) | — | `20240602000001` |
| `work_schedule` | VARCHAR(255) | — | `20240602000001` |
| `required_languages` | VARCHAR(255) | — | `20240602000001` |
| `experience_level` | VARCHAR(100) | — | `20240602000001` |
| `education_requirements` | TEXT | — | `20240602000001` |

#### Resolution Steps

1. Connect to the PostgreSQL database
2. Run the migration:
   ```sql
   \i backend/migrations/20240602000001_add_job_columns.sql
   ```
3. Verify columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'jobs'
   ORDER BY ordinal_position;
   ```
4. Test job creation with extended fields via API

#### Long-term Fix (Recommended)

Update `backend/init-database.sql` to include all extended columns in the `jobs` table definition so fresh installations do not require this migration to be run separately.

#### Acceptance Criteria
- [ ] All extended job columns exist in database
- [ ] Job creation with qualifications and evaluation params works
- [ ] Advertisement data saves and retrieves correctly
- [ ] No runtime errors when creating/updating jobs

---

### Issue 4: Job Applications Missing Interview Columns

**Severity:** ⚠️ High — Feature Degraded  
**Impact:** Interview scheduling, scoring, and feedback features unavailable  
**Root Cause:** Interview columns only added via migration, not in base schema.

#### Missing Columns (require migration)

| Column | Type | Default | Migration |
|--------|------|---------|-----------|
| `interview_score` | INTEGER / DECIMAL | — | `011_add_interview_columns` |
| `interview_notes` | TEXT | — | `011_add_interview_columns` |
| `interview_status` | VARCHAR(50) | — | `011_add_interview_columns` |
| `interview_date` | TIMESTAMP WITH TIME ZONE | — | `011_add_interview_columns` |
| `interview_invitations` | JSONB | `[]` | `011_add_interview_columns` |
| `interview_feedbacks` | JSONB | `[]` | `011_add_interview_columns` |

#### Resolution Steps

1. Connect to the PostgreSQL database
2. Run the migration:
   ```sql
   \i backend/migrations/011_add_interview_columns.sql
   ```
3. Verify columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'job_applications'
   AND column_name LIKE 'interview%'
   ORDER BY ordinal_position;
   ```
4. Test interview invite creation via API

#### Long-term Fix (Recommended)

Update `backend/init-database.sql` to include all interview columns in the `job_applications` table definition.

#### Acceptance Criteria
- [ ] Interview columns exist in the database
- [ ] Interview invites can be created
- [ ] Interview scores can be recorded
- [ ] Interview feedbacks save correctly
- [ ] Recruitment dashboard shows interview data

---

## Priority 3 — Medium Priority (Code Quality)

### Issue 5: Duplicate Controller Structure

**Severity:** 📋 Medium — Maintenance Issue  
**Impact:** Code duplication, confusion about which controller is active, risk of divergent logic  
**Root Cause:** The codebase evolved two parallel controller structures:
- `backend/controllers/` — legacy controllers
- `backend/src/features/*/controllers/` — newer feature-based structure

#### Affected Duplicate Controllers

| Feature | Legacy Path | Feature Path |
|---------|-------------|--------------|
| Attendance | `controllers/attendance.controller.js` | `src/features/attendance/controllers/` |
| Auth | `controllers/auth.controller.js` | `src/features/auth/controllers/` |
| Employee | `controllers/employee.controller.js` | `src/features/employees/controllers/` |
| Leave | `controllers/leave.controller.js` | `src/features/leave/controllers/` |
| Onboarding | `controllers/onboarding.controller.js` | `src/features/onboarding/controllers/` |
| Payroll | `controllers/payroll.controller.js` | `src/features/payroll/controllers/` |
| Recruitment (Jobs) | `controllers/job.controller.js` | `src/features/recruitment/controllers/` |

#### Resolution Steps

1. **Audit Step**: For each duplicate pair, compare functionality and identify which one is being actively used via route imports
2. **Decision Step**: Choose `src/features/` as the canonical location (matches modern architecture)
3. **Migration Step**: For each legacy controller that has unique logic not in the feature version, migrate that logic into the feature version
4. **Cleanup Step**: Remove legacy controllers once all routes point to feature versions
5. **Verification Step**: Run all endpoint tests to confirm no regression

#### Acceptance Criteria
- [ ] Single controller per feature area
- [ ] All routes point to feature controllers
- [ ] No functional regression
- [ ] Cleaner import paths across the codebase

---

## Priority 4 — Low Priority (Documentation)

### Ongoing Schema Documentation

After all fixes are applied, create and maintain the following:

| Document | Location | Purpose |
|----------|----------|---------|
| `DB_SCHEMA_REFERENCE.md` | `documentation/architecture/` | Full schema reference per table |
| `MIGRATION_HISTORY.md` | `documentation/architecture/` | Log of all applied migrations |
| `MODEL_FIELD_MAP.md` | `documentation/architecture/` | Maps DB columns to model properties per table |
| `API_FIELD_REFERENCE.md` | `documentation/guides/` | Maps API request/response fields to DB columns |

---

## Implementation Timeline

```
Week 1 — Critical Fixes
  Day 1-2:   Fix KPI.model.js column names + update kpi.controller.js
  Day 3:     Test all KPI endpoints
  Day 4-5:   Implement complete Onboarding model + controller

Week 2 — Migrations + Testing
  Day 1:     Verify migration status for jobs and job_applications
  Day 2:     Run pending migrations (20240602000001, 011)
  Day 3-4:   Integration testing of jobs and recruitment features
  Day 5:     Regression testing of all affected modules

Week 3 — Code Quality
  Day 1-2:   Audit duplicate controllers, map routes to active controllers
  Day 3-4:   Migrate unique logic, update all route imports
  Day 5:     Full endpoint testing after consolidation

Week 4 — Documentation
  Day 1-2:   Write schema reference document
  Day 3:     Write migration history document
  Day 4:     Write model field map document
  Day 5:     Review, commit, and push all documentation
```

---

## Testing Strategy

### Unit Tests
Each model fix must be verified with unit tests covering:
- Create (INSERT)
- Read by ID
- Read with filters
- Update
- Delete
- Edge cases (null values, missing fields)

### Integration Tests
Each controller fix must be tested end-to-end:
- Correct HTTP status codes returned
- Correct JSON response shape
- Error handling for invalid input
- Authentication/authorisation checks

### Regression Testing
After each phase, run the full test suite to ensure no existing functionality was broken.

### Manual Verification Checklist

| Module | Test |
|--------|------|
| KPI | Create a KPI definition, assign it to an employee, evaluate it |
| Onboarding | Create an onboarding record, update status to completed |
| Jobs | Create a job with qualifications and evaluation params |
| Recruitment | Submit an application, schedule an interview, record a score |

---

## Risk Mitigation

### Before Any Changes
- [ ] Take a full PostgreSQL database backup
- [ ] Export current schema: `pg_dump --schema-only dbname > schema_backup.sql`
- [ ] Document current API responses for comparison after changes

### Deployment Strategy
1. Apply and test all changes in local development environment
2. Deploy to staging environment and run full integration tests
3. Run migrations on staging database and verify
4. Deploy to production during a maintenance window
5. Monitor error logs for 24 hours post-deployment

### Rollback Plan
- Keep rollback SQL scripts for each migration
- Keep previous controller versions in git history
- Restore from database backup if critical failure occurs

---

## Success Criteria

| Area | Criterion | Verification |
|------|-----------|-------------|
| KPI | All KPI endpoints return correct data with `title` and `max_score` fields | API test |
| KPI | KPI dashboard in admin panel shows employee names and correct scores | UI test |
| Onboarding | New onboarding records can be created and retrieved | API test |
| Onboarding | Status transitions work correctly | UI test |
| Jobs | Jobs can be created with all extended fields | API test |
| Recruitment | Interview data saves and retrieves correctly | API test |
| Code Quality | Single controller per feature, no duplicate files | Code review |
| Documentation | All schema changes documented | Documentation review |

---

## Appendix A — Key Files Reference

| File | Role |
|------|------|
| `backend/init-database.sql` | Base database schema — source of truth for fresh installs |
| `backend/migrations/` | Incremental schema changes for existing installations |
| `backend/models/KPI.model.js` | KPI definitions model (needs fix) |
| `backend/models/Onboarding.model.js` | Onboarding model (needs full implementation) |
| `backend/models/Job.model.js` | Jobs model (needs migration) |
| `backend/models/JobApplication.model.js` | Job applications model (needs migration) |
| `backend/controllers/kpi.controller.js` | KPI business logic (needs column name fixes) |
| `backend/controllers/onboarding.controller.js` | Onboarding business logic (needs review after model fix) |

---

## Appendix B — Useful SQL Verification Queries

Run these queries against the live database to verify schema state before and after applying fixes:

```sql
-- Check KPI definitions columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'kpi_definitions'
ORDER BY ordinal_position;

-- Check onboarding columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'onboarding'
ORDER BY ordinal_position;

-- Check jobs extended columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name IN ('qualifications', 'evaluation_params', 'salary_range', 'number_of_positions')
ORDER BY column_name;

-- Check interview columns exist on job_applications
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'job_applications'
AND column_name LIKE 'interview%'
ORDER BY column_name;
```

---

*Document created: 2026-06-09 | Next review: After Phase 1 completion*
