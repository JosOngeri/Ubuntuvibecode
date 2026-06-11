# Architecture & Migration Guide

## Overview

This document consolidates the architectural decisions and provides a practical guide for migrating to a feature-based organization with three-layer architecture.

---

## Part 1: Three-Layer Architecture (ADR 001)

### Status
Accepted

### Context
The original backend codebase had controllers that directly interacted with models and contained significant business logic. This made the code difficult to test, maintain, and scale. Controllers were doing too much - handling HTTP requests, business logic, and data access all in one place.

### Decision
Adopt a three-layer architecture pattern:
- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic and coordinate between repositories
- **Repositories**: Handle data access (SQL queries) only

### Consequences

#### Positive
- Separation of concerns makes code easier to understand
- Business logic is isolated and testable
- Data access is centralized and can be mocked easily
- Controllers become thin and focused on HTTP concerns
- Easier to onboard new developers

#### Negative
- More files and directories to navigate
- Initial refactoring effort required
- More boilerplate code for simple operations

### Implementation
- Created `src/features/{feature}/{controllers,services,repositories}/` structure
- Moved business logic from controllers to services
- Moved SQL queries from controllers/services to repositories
- Controllers now delegate to services, services delegate to repositories

---

## Part 2: Feature-Based Folder Organization (ADR 002)

### Status
Accepted

### Context
The original codebase organized files by technical layer (controllers/, models/, routes/). This made it difficult to find all files related to a specific feature. A developer had to jump between multiple directories to understand a single feature's implementation.

### Decision
Organize code by feature/domain instead of technical layer:
- `src/features/{feature}/{controllers,services,repositories,validators}/`
- Each feature is self-contained with its own layers
- Shared utilities go in `src/shared/`

### Consequences

#### Positive
- All code for a feature is in one place
- Easier to understand feature boundaries
- Simplifies feature extraction/removal
- Better for team collaboration (teams can own features)
- Clearer mental model of the system

#### Negative
- May duplicate some utility code across features
- Need to be careful about shared code placement
- More directory nesting

### Implementation
- Created feature folders for: auth, recruitment, attendance, payroll, employees, leave
- Each feature has subfolders: controllers, services, repositories, validators
- Shared code in: utils, middleware, errors, services

---

## Part 3: Migration Guide

### Target Structure

#### Backend
```
backend/src/
├── features/
│   ├── attendance/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── payroll/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── employees/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── leave/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── recruitment/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   └── auth/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── validators/
├── shared/
│   ├── middleware/
│   ├── utils/
│   ├── errors/
│   └── services/
└── app.js
```

#### Frontend
```
frontend/src/
├── features/
│   ├── attendance/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── payroll/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── employees/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── leave/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── recruitment/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── auth/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── services/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── contexts/
└── App.jsx
```

### Migration Steps

#### Step 1: Create Feature Directory Structure
For each feature, create the directory structure:
```bash
# Backend
mkdir -p backend/src/features/{feature}/{controllers,services,repositories,validators}

# Frontend
mkdir -p frontend/src/features/{feature}/{pages,components,hooks,services}
```

#### Step 2: Move Backend Files

**Pattern for Controllers:**
- Move from `backend/src/controllers/{feature}.controller.js` to `backend/src/features/{feature}/controllers/{feature}.controller.js`
- Ensure controller only handles HTTP request/response
- Delegate business logic to service layer

**Pattern for Services:**
- Extract business logic from controllers
- Create `backend/src/features/{feature}/services/{feature}.service.js`
- Service should coordinate between repositories

**Pattern for Repositories:**
- Extract SQL queries from controllers/services
- Create `backend/src/features/{feature}/repositories/{feature}.repository.js`
- Repository should only handle data access

**Pattern for Validators:**
- Move validation logic to `backend/src/features/{feature}/validators/{feature}.validator.js`

#### Step 3: Move Frontend Files

**Pattern for Pages:**
- Move from `frontend/src/pages/{category}/{Page}.jsx` to `frontend/src/features/{feature}/pages/{Page}.jsx`
- Update imports in App.jsx

**Pattern for Components:**
- Move feature-specific components to `frontend/src/features/{feature}/components/`
- Keep truly shared components in `frontend/src/shared/components/`

**Pattern for Hooks:**
- Move feature-specific hooks to `frontend/src/features/{feature}/hooks/`
- Keep shared hooks in `frontend/src/shared/hooks/`

**Pattern for Services:**
- Move API calls to `frontend/src/features/{feature}/services/`
- Keep shared API utilities in `frontend/src/shared/services/`

#### Step 4: Update Imports

**Backend Route Updates:**
```javascript
// Before
const attendanceController = require('../controllers/attendance.controller');

// After
const attendanceController = require('../features/attendance/controllers/attendance.controller');
```

**Frontend Import Updates:**
```javascript
// Before
import AttendancePage from './pages/admin/AttendancePage';

// After
import AttendancePage from './features/attendance/pages/AttendancePage';
```

#### Step 5: Update Route Registrations

Update `backend/src/app.js` to use new paths:
```javascript
// Before
const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes);

// After
const attendanceRoutes = require('./features/attendance/routes/attendance');
app.use('/api/attendance', attendanceRoutes);
```

### Migration Checklist

#### Backend
- [ ] Create feature directory structure
- [ ] Move controllers to feature folders
- [ ] Extract and move business logic to services
- [ ] Extract and move SQL queries to repositories
- [ ] Move validators to feature folders
- [ ] Update route imports in app.js
- [ ] Update controller imports in route files
- [ ] Test all API endpoints

#### Frontend
- [ ] Create feature directory structure
- [ ] Move pages to feature folders
- [ ] Move feature-specific components
- [ ] Move feature-specific hooks
- [ ] Move feature-specific services
- [ ] Update imports in App.jsx
- [ ] Update imports in moved files
- [ ] Test all routes and pages

### Code Formatting Rules

**Important:** Maintain the existing code formatting style:
- Keep semicolons where they exist
- Maintain existing indentation (2 spaces for frontend, 2 spaces for backend)
- Preserve existing quote style (single vs double)
- Keep existing bracket style
- Maintain existing comment style
- Preserve existing line length patterns

### Example Migration

#### Backend: Attendance Feature

**Before:**
```
backend/src/
├── controllers/
│   └── attendance.controller.js
├── routes/
│   └── attendance.js
└── models/
    └── attendance.js
```

**After:**
```
backend/src/features/attendance/
├── controllers/
│   └── attendance.controller.js
├── services/
│   └── attendance.service.js
├── repositories/
│   └── attendance.repository.js
├── validators/
│   └── attendance.validator.js
└── routes/
    └── attendance.js
```

#### Frontend: Attendance Feature

**Before:**
```
frontend/src/
├── pages/
│   └── admin/
│       └── AttendancePage.jsx
└── components/
    └── AttendanceCalendar.jsx
```

**After:**
```
frontend/src/features/attendance/
├── pages/
│   └── AttendancePage.jsx
├── components/
│   └── AttendanceCalendar.jsx
├── hooks/
│   └── useAttendance.js
└── services/
    └── attendance.api.js
```

### Testing After Migration

1. **Backend Testing:**
   - Run `npm test` for backend tests
   - Test each API endpoint with Postman/curl
   - Verify database operations work correctly

2. **Frontend Testing:**
   - Run `npm test` for frontend tests
   - Navigate to each route in the application
   - Verify all features work as expected

3. **Integration Testing:**
   - Test full user flows (e.g., clock in → view attendance → process payroll)
   - Verify data flows correctly between frontend and backend

### Rollback Plan

If issues arise during migration:
1. Keep the old structure until migration is verified
2. Use Git branches for each feature migration
3. Tag commits before major migrations
4. Document any breaking changes

### Current Migration Status

**Completed:**
- [x] ADR 001: Three-Layer Architecture
- [x] ADR 002: Feature-Based Organization
- [x] Frontend: Attendance page moved to `features/attendance/pages/AttendancePage`

**In Progress:**
- [ ] Frontend: Complete attendance feature migration
- [ ] Frontend: Migrate payroll feature
- [ ] Frontend: Migrate employees feature
- [ ] Frontend: Migrate leave feature
- [ ] Frontend: Migrate recruitment feature
- [ ] Backend: Complete three-layer refactoring

**Pending:**
- [ ] Backend: Migrate all features to feature folders
- [ ] Update all route registrations
- [ ] Comprehensive testing
- [ ] Update documentation

---

## References

- ADR 001: Three-Layer Architecture for Backend
- ADR 002: Feature-Based Folder Organization
- Project: Ubuntu HRMS
- Last Updated: 2026-06-02
