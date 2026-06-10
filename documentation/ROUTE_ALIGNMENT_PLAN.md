# Frontend-Backend Route Alignment Plan

**Project:** Ubuntu HRMS  
**Date:** 2026-06-09  
**Status:** Active  
**Author:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Gaps to Address](#gaps-to-address)
4. [Implementation Plan](#implementation-plan)
5. [Testing Strategy](#testing-strategy)
6. [Success Criteria](#success-criteria)

---

## Executive Summary

**Backend Routes:** 293 endpoints  
**Frontend Pages:** 78 routes  
**Overall Alignment:** 85%  
**Critical Gaps:** 6 (backend exists, no frontend page)  
**Naming Inconsistencies:** 3

This plan addresses the 6 missing frontend pages and 3 naming inconsistencies to achieve 100% route alignment.

---

## Current State

### ✅ Well-Aligned Modules (19)
- Authentication, Employees, Attendance, Jobs/Recruitment, Leave, Payroll, KPI, Contractor, Messages, Reports, Training, Contracts, Complaints, Assets, Daily Labour, Onboarding, Permissions, Settings, Profile, Supervisor Allocations, Department Heads, Documents

### ❌ Critical Gaps (6)

| # | Backend Routes | Missing Frontend Page | Endpoints |
|---|----------------|----------------------|-----------|
| 1 | `/api/favicons` | `/admin/favicon-settings` | 6 (getActive, getAll, upload, setDefault, activate, delete) |
| 2 | `/api/audit` | `/admin/audit-logs` | 4 (getLogs, getUserLogs, getEntityLogs, createLog) |
| 3 | `/api/system-logs` | `/admin/system-logs` | 4 (getAll, getStats, getById, cleanup) |
| 4 | `/api/orientation-checklists` | `/admin/orientation-checklists` | 6 (getAll, getByRole, getById, create, update, delete) |
| 5 | `/api/contractor-lifecycle` | `/admin/contractor-lifecycle` | 12 (quotes, milestones, KPI, payments) |
| 6 | `/api/jobs/.../verify` | Verification page | 5 (verify, getResults, verifyBatch, managerRanking, ownerApproval) |

### ⚠️ Naming Inconsistencies (3)

| # | Frontend | Backend | Issue |
|---|----------|---------|-------|
| 1 | `/daily-labour/` | `/api/daily-labourers` | Singular vs plural |
| 2 | `/admin/department-head-assignments` | `/api/department-heads` | Different naming |
| 3 | Minor | Minor | Descriptive differences |

---

## Gaps to Address

### Gap 1: Favicon Management (`/admin/favicon-settings`)

**Backend Routes (`/api/favicons`):**
- `GET /active` — Get active favicon
- `GET /` — Get all favicons
- `POST /upload` — Upload new favicon
- `POST /default` — Set default favicon
- `PUT /:id/activate` — Activate specific favicon
- `DELETE /:id` — Delete favicon

**Frontend Page Requirements:**
- List all favicons with preview
- Upload new SVG favicon
- Set active/default favicon
- Delete unused favicons
- Preview active favicon

**Implementation Steps:**
1. Create `frontend/src/pages/admin/FaviconSettings.jsx`
2. Add API service methods in `frontend/src/services/faviconAPI.js`
3. Add route to `App.jsx`
4. Add menu item to `Sidebar.jsx` under HR Ops

---

### Gap 2: Audit Logs (`/admin/audit-logs`)

**Backend Routes (`/api/audit`):**
- `GET /` — Get all logs
- `GET /user/:userId` — Get logs by user
- `GET /entity/:entityType/:entityId` — Get logs by entity
- `POST /log` — Create log entry

**Frontend Page Requirements:**
- Table view of all audit logs
- Filter by user, entity type, date range
- Pagination
- Export to CSV
- View log details (old_data, new_data)

**Implementation Steps:**
1. Create `frontend/src/pages/admin/AuditLogs.jsx`
2. Add API service methods in `frontend/src/services/auditAPI.js`
3. Add route to `App.jsx`
4. Add menu item to `Sidebar.jsx` under HR Ops

---

### Gap 3: System Logs (`/admin/system-logs`)

**Backend Routes (`/api/system-logs`):**
- `GET /` — Get all system logs
- `GET /stats` — Get log statistics
- `GET /:id` — Get log by ID
- `DELETE /cleanup` — Delete old logs

**Frontend Page Requirements:**
- Table view of system logs
- Filter by level (info, warn, error)
- Statistics dashboard (counts by level)
- Cleanup old logs button
- View log details

**Implementation Steps:**
1. Create `frontend/src/pages/admin/SystemLogs.jsx`
2. Add API service methods in `frontend/src/services/systemLogAPI.js`
3. Add route to `App.jsx`
4. Add menu item to `Sidebar.jsx` under HR Ops

---

### Gap 4: Orientation Checklists (`/admin/orientation-checklists`)

**Backend Routes (`/api/orientation-checklists`):**
- `GET /` — Get all checklists
- `GET /role/:role` — Get checklists by role
- `GET /:id` — Get checklist by ID
- `POST /` — Create checklist
- `PUT /:id` — Update checklist
- `DELETE /:id` — Delete checklist

**Frontend Page Requirements:**
- List all checklists by role
- Create/edit checklist with checklist items
- Set default checklist per role
- Delete checklist
- Preview checklist items

**Implementation Steps:**
1. Create `frontend/src/pages/admin/OrientationChecklists.jsx`
2. Add API service methods in `frontend/src/services/orientationChecklistAPI.js`
3. Add route to `App.jsx`
4. Add menu item to `Sidebar.jsx` under HR Ops

---

### Gap 5: Contractor Lifecycle (`/admin/contractor-lifecycle`)

**Backend Routes (`/api/contractor-lifecycle`):**
- `GET /quotes` — Get all quotes
- `POST /quotes` — Create quote
- `PUT /quotes/:id/approve` — Approve quote
- `PUT /quotes/:id/reject` — Reject quote
- `GET /milestones` — Get all milestones
- `POST /milestones` — Create milestone
- `PUT /milestones/:id/progress` — Update progress
- `PUT /milestones/:id/verify` — Verify milestone
- `PUT /milestones/:id/payment` — Release payment
- `POST /milestones/:id/daily-wage` — Add daily wage day
- `GET /kpi` — Get contractor KPI
- `GET /kpi/:contractorId` — Get contractor KPI by ID

**Frontend Page Requirements:**
- Quote management (list, approve, reject)
- Milestone tracking (create, update progress, verify)
- Payment release
- Daily wage mode tracking
- Contractor KPI dashboard

**Implementation Steps:**
1. Create `frontend/src/pages/admin/ContractorLifecycle.jsx`
2. Add API service methods in `frontend/src/services/contractorLifecycleAPI.js`
3. Add route to `App.jsx`
4. Add menu item to `Sidebar.jsx` under Contractors

---

### Gap 6: Application Verification

**Backend Routes (`/api/jobs`):**
- `POST /:jobId/applications/:appId/verify` — Verify application
- `GET /:jobId/applications/:appId/verification` — Get verification results
- `POST /:jobId/applications/verify-batch` — Verify all applications
- `PUT /:jobId/applications/:appId/manager-ranking` — Update manager ranking
- `PUT /:jobId/applications/:appId/owner-approval` — Update owner approval

**Frontend Page Requirements:**
- Integrate verification into existing `/recruitment/applicants/:id` page
- Add verification status badge
- Add verification action buttons
- Show verification results
- Manager ranking input
- Owner approval toggle

**Implementation Steps:**
1. Update `frontend/src/pages/recruitment/ApplicantDetailPage.jsx`
2. Add verification API methods to existing job API service
3. Add verification section to applicant detail view
4. Add manager ranking and owner approval controls

---

### Naming Inconsistency 1: Daily Labour Routes

**Current:**
- Frontend: `/daily-labour/`
- Backend: `/api/daily-labourers`

**Fix:**
- Update backend route prefix from `/api/daily-labourers` to `/api/daily-labour`
- Update all frontend API calls to use new prefix
- Or: Update frontend routes to `/daily-labourers/` (less recommended)

**Decision:** Standardize to `/api/daily-labour` (singular form matches other routes)

**Implementation Steps:**
1. Update `backend/routes/dailyLabourer.routes.js` prefix
2. Update `backend/app.js` if route is mounted separately
3. Update all frontend API service calls
4. Test all daily labour functionality

---

### Naming Inconsistency 2: Department Head Routes

**Current:**
- Frontend: `/admin/department-head-assignments`
- Backend: `/api/department-heads`

**Decision:** Keep as-is (functionally aligned, naming is descriptive enough)

**Action:** No change needed

---

## Implementation Plan

### Phase 1: Create Missing Pages (Priority Order)

**Day 1:**
1. Create `/admin/favicon-settings` page
2. Create `/admin/audit-logs` page

**Day 2:**
3. Create `/admin/system-logs` page
4. Create `/admin/orientation-checklists` page

**Day 3:**
5. Create `/admin/contractor-lifecycle` page
6. Integrate verification into applicant detail page

### Phase 2: Fix Naming Inconsistencies

**Day 4:**
7. Fix daily labour route naming
8. Update all API service calls

### Phase 3: Integrate Routes

**Day 5:**
9. Update `App.jsx` with all new routes
10. Update `Sidebar.jsx` with new menu items
11. Test all new routes

---

## Testing Strategy

### Unit Tests
- Test each new API service method
- Test page rendering without errors

### Integration Tests
- Test each new page with backend endpoints
- Verify data displays correctly
- Test CRUD operations

### Regression Tests
- Test existing pages still work
- Test navigation still works
- Test role-based access control

### Manual Verification Checklist

| Page | Test |
|------|------|
| Favicon Settings | Upload, activate, delete favicon |
| Audit Logs | View logs, filter by user, export |
| System Logs | View logs, view stats, cleanup |
| Orientation Checklists | Create, edit, delete checklist |
| Contractor Lifecycle | Approve quote, update milestone, release payment |
| Applicant Verification | Verify application, update ranking, approve |

---

## Success Criteria

| Area | Criterion | Verification |
|------|-----------|-------------|
| New Pages | All 6 pages render without errors | UI test |
| New Pages | All pages connect to backend API | Network test |
| New Pages | CRUD operations work correctly | Functional test |
| Routes | All new routes accessible | Navigation test |
| Sidebar | All new menu items visible and clickable | UI test |
| Naming | Daily labour routes work after rename | Functional test |
| Documentation | All routes documented | Documentation review |

---

## Appendix A: File Structure

**New Pages to Create:**
- `frontend/src/pages/admin/FaviconSettings.jsx`
- `frontend/src/pages/admin/AuditLogs.jsx`
- `frontend/src/pages/admin/SystemLogs.jsx`
- `frontend/src/pages/admin/OrientationChecklists.jsx`
- `frontend/src/pages/admin/ContractorLifecycle.jsx`

**API Services to Create:**
- `frontend/src/services/faviconAPI.js`
- `frontend/src/services/auditAPI.js`
- `frontend/src/services/systemLogAPI.js`
- `frontend/src/services/orientationChecklistAPI.js`
- `frontend/src/services/contractorLifecycleAPI.js`

**Files to Update:**
- `frontend/src/App.jsx` — Add new routes
- `frontend/src/components/common/Sidebar.jsx` — Add menu items
- `frontend/src/pages/recruitment/ApplicantDetailPage.jsx` — Add verification
- `backend/routes/dailyLabourer.routes.js` — Fix route prefix
- All frontend API services using daily labour routes

---

## Appendix B: Backend Route References

### Favicon Routes
```javascript
GET    /api/favicons/active
GET    /api/favicons
POST   /api/favicons/upload
POST   /api/favicons/default
PUT    /api/favicons/:id/activate
DELETE /api/favicons/:id
```

### Audit Routes
```javascript
GET  /api/audit
GET  /api/audit/user/:userId
GET  /api/audit/entity/:entityType/:entityId
POST /api/audit/log
```

### System Log Routes
```javascript
GET    /api/system-logs
GET    /api/system-logs/stats
GET    /api/system-logs/:id
DELETE /api/system-logs/cleanup
```

### Orientation Checklist Routes
```javascript
GET    /api/orientation-checklists
GET    /api/orientation-checklists/role/:role
GET    /api/orientation-checklists/:id
POST   /api/orientation-checklists
PUT    /api/orientation-checklists/:id
DELETE /api/orientation-checklists/:id
```

### Contractor Lifecycle Routes
```javascript
GET    /api/contractor-lifecycle/quotes
POST   /api/contractor-lifecycle/quotes
PUT    /api/contractor-lifecycle/quotes/:id/approve
PUT    /api/contractor-lifecycle/quotes/:id/reject
GET    /api/contractor-lifecycle/milestones
POST   /api/contractor-lifecycle/milestones
PUT    /api/contractor-lifecycle/milestones/:id/progress
PUT    /api/contractor-lifecycle/milestones/:id/verify
PUT    /api/contractor-lifecycle/milestones/:id/payment
POST   /api/contractor-lifecycle/milestones/:id/daily-wage
GET    /api/contractor-lifecycle/kpi
GET    /api/contractor-lifecycle/kpi/:contractorId
```

### Verification Routes
```javascript
POST /api/jobs/:jobId/applications/:appId/verify
GET  /api/jobs/:jobId/applications/:appId/verification
POST /api/jobs/:jobId/applications/verify-batch
PUT  /api/jobs/:jobId/applications/:appId/manager-ranking
PUT  /api/jobs/:jobId/applications/:appId/owner-approval
```

---

*Document created: 2026-06-09 | Next review: After Phase 1 completion*
