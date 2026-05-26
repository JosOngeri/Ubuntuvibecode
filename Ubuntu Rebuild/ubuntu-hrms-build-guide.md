# Ubuntu HRMS Build Guide for AI Agents

A comprehensive guide for rebuilding the Ubuntu Eco Lodge Human Resource Management System from scratch, covering the full MERN stack architecture, database schema, and critical implementation details.

## Tech Stack

### Backend
- **Node.js** + **Express.js** (v5.2.1) - REST API server
- **PostgreSQL** (via `pg` v8.16.3) - Primary database (NOT MongoDB as README states)
- **JWT** (jsonwebtoken v9.0.3) - Authentication
- **bcryptjs** (v3.0.3) - Password hashing
- **multer** (v2.1.1) - File uploads
- **nodemailer** (v8.0.7) - Email (password reset)
- **pdfkit** (v0.18.0) - PDF report generation
- **node-cron** (v4.2.1) - Scheduled jobs

### Frontend
- **React** (v18.2.0) + **Vite** (v7.3.3) - UI framework
- **React Router** (v6.20.0) - Client-side routing
- **Tailwind CSS** (v3.3.6) - Styling
- **Axios** (v1.6.2) - HTTP client
- **react-toastify** (v9.1.3) - Notifications
- **recharts** (v3.8.1) - Charts
- **lucide-react** (v1.7.0) - Icons
- **@radix-ui/react-select** (v2.2.6) - Select components

## Architecture Overview

### Database Schema (PostgreSQL)

**Critical Note:** The system uses PostgreSQL, NOT MongoDB. The README incorrectly states MERN stack.

**Core Tables:**
- `users` - Authentication (id, username, email, password, role, status, reset_token)
- `employees` - Employee records (id, user_id, status, names, phone, biometric_device_id, wage_rate, department, employment_type)
- `attendance` - Attendance records (id, employee_id, attendance_date, check_in, check_out, punch_state, status)
- `payroll` - Payroll records (id, employee_id, period, gross_pay, net_pay, status)
- `kpi` - Performance tracking (id, employee_id, definition_title, target_value, achieved_value)
- `leaves` - Leave requests (id, employee_id, type, start_date, end_date, status)
- `daily_labourers` - Daily labourer profiles (id, user_id, skill_set, daily_rate, status)
- `settings` - Flexible settings system (id, setting_key, category, setting_value, data_type, validation_rules)

**Relationships:**
- `employees.user_id` → `users.id` (one-to-one)
- `attendance.employee_id` → `employees.id` (many-to-one)
- `daily_labourers.user_id` → `users.id` (one-to-one)

### Backend Structure

```
backend/
├── config/db.js           - PostgreSQL connection pool
├── middleware/
│   ├── auth.js            - JWT verification (x-auth-token header)
│   └── role.js            - Role-based access control (import as roleMiddleware)
├── models/
│   ├── User.model.js      - User CRUD
│   ├── Employee.model.js  - Employee CRUD
│   ├── Attendance.model.js - Attendance CRUD
│   └── [other models]
├── controllers/
│   ├── auth.controller.js - Login, register, forgot/reset password
│   ├── employee.controller.js - Employee CRUD
│   ├── attendance.controller.js - Attendance, punch operations
│   └── [other controllers]
├── routes/
│   ├── auth.routes.js     - /api/auth/*
│   ├── employee.routes.js - /api/employees/*
│   └── [other routes]
├── utils/
│   ├── validation.js      - Input validation helpers
│   └── email.js           - Email sending
└── server.js              - Entry point
```

### Frontend Structure

```
frontend/src/
├── components/
│   ├── common/            - Reusable components (Button, Card, Input, Table, Modal)
│   ├── DashboardLayout.jsx - Main layout wrapper
│   └── Sidebar.jsx        - Navigation
├── contexts/
│   ├── AuthContext.jsx    - Auth state (user, token, login, logout)
│   └── SettingsContext.jsx - Settings cache
├── pages/
│   ├── auth/              - Login, Register, ForgotPassword, ResetPassword
│   ├── admin/             - Admin portal pages
│   ├── manager/           - Manager portal pages
│   ├── employee/          - Employee portal pages
│   ├── dailyLabour/       - Daily labourer pages
│   └── shared/            - Shared pages (Attendance, etc.)
├── services/api.js        - Axios instance with auth header
└── App.jsx                - Routing setup
```

## Logging Architecture

Logging must be built in from day one — not added later. Use structured console logging (no extra npm packages required).

### Backend: `backend/utils/logger.js`
Central logger with timestamped, levelled output. All controllers import this instead of calling `console` directly.

```javascript
const logger = {
  info:  (tag, msg, ctx = {}) => console.log( `[${new Date().toISOString()}] INFO  [${tag}] ${msg}`, Object.keys(ctx).length ? ctx : ''),
  warn:  (tag, msg, ctx = {}) => console.warn(`[${new Date().toISOString()}] WARN  [${tag}] ${msg}`, Object.keys(ctx).length ? ctx : ''),
  error: (tag, msg, err, ctx = {}) => console.error(`[${new Date().toISOString()}] ERROR [${tag}] ${msg}`, err?.stack || err, Object.keys(ctx).length ? ctx : ''),
};
module.exports = logger;
```

### Backend: `backend/middleware/requestLogger.js`
Mount at the **top** of `app.js` before any routes. Logs every request + response status + duration + authenticated user.

```javascript
const logger = require('../utils/logger');
module.exports = (req, res, next) => {
  const start = Date.now();
  const user = req.user ? `${req.user.role}:${req.user.id}` : 'anon';
  res.on('finish', () => {
    logger.info('REQUEST', `${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now()-start}ms) user=${user}`);
  });
  next();
};
```

### Backend: Per-Controller Pattern
Every controller function must follow this pattern:

```javascript
const logger = require('../utils/logger');

const myFunction = async (req, res) => {
  logger.info('myController.myFunction', 'Entry', { userId: req.user?.id, params: req.params, body: req.body });
  try {
    // ... logic
    const { normalized, errors } = validatePayload(req.body);
    if (errors.length) {
      logger.warn('myController.myFunction', 'Validation failed', { errors });
      return res.status(400).json({ msg: 'Validation failed', errors });
    }
    // ... DB call
    logger.info('myController.myFunction', 'Success', { resultCount: rows.length });
    res.json(rows);
  } catch (err) {
    logger.error('myController.myFunction', 'Unhandled error', err, { userId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};
```

**What to log at each level:**

| Level | When |
|---|---|
| INFO | Function entry with key params, successful DB results (row count only) |
| WARN | Validation errors, 404 not-found, unauthorised access attempts |
| ERROR | All `catch` blocks with full stack trace |

### Frontend: `frontend/src/utils/logger.js`
Browser-side structured logger with coloured groups.

```javascript
const logger = {
  info:  (tag, msg, ctx) => console.log( `%c[INFO]  [${tag}]`, 'color:#3b82f6', msg, ctx || ''),
  warn:  (tag, msg, ctx) => console.warn(`%c[WARN]  [${tag}]`, 'color:#f59e0b', msg, ctx || ''),
  error: (tag, msg, err, ctx) => console.error(`%c[ERROR] [${tag}]`, 'color:#ef4444', msg, err, ctx || ''),
};
export default logger;
```

### Frontend: Axios Interceptors in `api.js`
Add logging to the request and response interceptors:

```javascript
// Request interceptor — log outgoing
api.interceptors.request.use(config => {
  logger.info('api', `→ ${config.method?.toUpperCase()} ${config.url}`);
  config.metadata = { startTime: Date.now() };
  return config;
});

// Response interceptor — log success and errors
api.interceptors.response.use(
  response => {
    const ms = Date.now() - response.config.metadata?.startTime;
    logger.info('api', `← ${response.status} ${response.config.url} (${ms}ms)`);
    return response;
  },
  error => {
    const ms = Date.now() - error.config?.metadata?.startTime;
    logger.error('api', `← ${error.response?.status} ${error.config?.url} (${ms}ms)`,
      null,
      { data: error.response?.data, body: error.config?.data }
    );
    return Promise.reject(error);
  }
);
```

### Frontend: Global Error Handlers in `main.jsx`
```javascript
window.onerror = (msg, src, line, col, err) =>
  logger.error('window.onerror', msg, err, { src, line, col });

window.onunhandledrejection = (e) =>
  logger.error('window.onunhandledrejection', 'Unhandled promise rejection', e.reason);
```

### Frontend: ErrorBoundary Enhancement
In `componentDidCatch`, call `logger.error('ErrorBoundary', error.message, error, { componentStack: info.componentStack })`.

---

## Step-by-Step Build Instructions

### Phase 1: Database Setup

1. **Create PostgreSQL database** (local or cloud)
2. **Run `init-database.sql`** to create all tables
3. **Run `seed-data.sql`** to populate initial data (users, roles)
4. **Verify tables exist** using PostgreSQL client

**Critical:** Do NOT use MongoDB. The entire backend uses `pg` (PostgreSQL driver) with raw SQL queries, not Mongoose ODM.

### Phase 2: Backend Setup

1. **Initialize Node.js project:**
   ```bash
   cd backend
   npm init -y
   npm install express pg cors dotenv jsonwebtoken bcryptjs multer nodemailer pdfkit node-cron
   ```

2. **Create `.env` file:**
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/ubuntu-hrms
   JWT_SECRET=your-secret-key-min-32-chars
   FRONTEND_URL=http://localhost:5173
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **Build core files in order:**
   - `config/db.js` - PostgreSQL connection pool
   - `utils/logger.js` - **Build this first** — all other files depend on it
   - `middleware/auth.js` - JWT verification
   - `middleware/requestLogger.js` - Request logging middleware
   - `models/User.model.js` - User model with password hashing
   - `controllers/auth.controller.js` - Login, register, password reset
   - `routes/auth.routes.js` - Auth endpoints
   - `server.js` - Express app setup

4. **Implement each module:**
   - Employees (model, controller, routes)
   - Attendance (model, controller, routes)
   - Payroll (model, controller, routes)
   - KPI, Leaves, Contracts, etc.

5. **Register routes in `app.js`:**
   ```javascript
   // Mount requestLogger FIRST — before all routes
   app.use(require('./middleware/requestLogger'));

   app.use('/api/auth', require('./routes/auth.routes'));
   app.use('/api/employees', require('./routes/employee.routes'));
   // ... other routes
   ```

### Phase 3: Frontend Setup

1. **Initialize React project:**
   ```bash
   cd frontend
   npm create vite@latest . -- --template react
   npm install react-router-dom axios react-toastify tailwindcss postcss autoprefixer
   npm install lucide-react recharts @radix-ui/react-select clsx tailwind-merge
   ```

2. **Configure Tailwind CSS:**
   - Initialize: `npx tailwindcss init -p`
   - Configure `tailwind.config.js` with content paths
   - Add directives to `index.css`

3. **Build core files in order:**
   - `src/utils/logger.js` - **Build this first** — browser-side logger
   - `src/services/api.js` - Axios instance with x-auth-token header + logging interceptors
   - `src/contexts/AuthContext.jsx` - Auth state management + login/logout logging
   - `src/components/common/ErrorBoundary.jsx` - Error boundary with `logger.error` in `componentDidCatch`
   - `src/components/common/` - Base components (Button, Card, Input, Table, Modal)
   - `src/components/DashboardLayout.jsx` - Main layout wrapper
   - `src/components/Sidebar.jsx` - Navigation
   - `src/pages/auth/Login.jsx` - Login page
   - `src/App.jsx` - Routing setup

4. **Implement pages by role:**
   - Admin: Dashboard, Employees, Attendance, Payroll, KPI, Leaves, Reports
   - Manager: Dashboard, Team Attendance, Leave Approvals
   - Employee: Dashboard, My Attendance, My Leaves, Profile
   - Daily Labourer: Dashboard (attendance/payments summary)

5. **Implement protected routes:**
   - Create `ProtectedRoute` component
   - Check token existence and role
   - Redirect to `/login` if unauthorized

### Phase 4: Integration Testing

1. **Test authentication flow:**
   - Register a user
   - Login and verify token stored
   - Access protected route
   - Logout and verify token cleared

2. **Test CRUD operations:**
   - Create employee
   - Read employee list
   - Update employee
   - Delete employee

3. **Test attendance:**
   - Record check-in
   - Record check-out
   - Verify hours calculated

4. **Test payroll:**
   - Calculate payroll for period
   - Verify amounts match attendance

## Critical Implementation Details

### Authentication

**Backend:**
- JWT secret must be at least 32 characters
- Token expires in 1 hour
- Passwords hashed with bcryptjs (10 rounds)
- Reset tokens expire in 1 hour
- Auth middleware checks `x-auth-token` header

**Frontend:**
- Token stored in `localStorage` as `authToken`
- Axios interceptor adds `x-auth-token` to all requests
- AuthContext decodes token to get user info
- Protected routes check role before rendering

### Route Order (Express)

**CRITICAL:** Specific routes must come before parameterized routes:
```javascript
// CORRECT
router.get('/me', ctrl.getMe);
router.get('/by-user/:userId', ctrl.getByUserId);
router.get('/:id', ctrl.getById);

// WRONG - /:id will match /me first
router.get('/:id', ctrl.getById);
router.get('/me', ctrl.getMe);
```

### User-Employee Linkage

Employees are linked to users via `employees.user_id → users.id`. When fetching employee data for the logged-in user:
- Get `user.id` from JWT (`req.user.id`)
- Query `employees WHERE user_id = $1`
- For daily labourers, use `daily_labourers WHERE user_id = $1`

### Validation

Backend uses `utils/validation.js`:
- `validateEmployeePayload()` - Validates employee data
- `validateAttendancePayload()` - Validates attendance data
- Returns `{ normalized, errors }` object
- Errors array contains specific validation messages

Frontend should display `errors.join(', ')` for inline validation feedback.

### Settings System

Flexible settings stored in `settings` table:
- `setting_key` + `category` unique constraint
- `setting_value` stored as TEXT (JSON for complex data)
- `validation_rules` JSONB for client-side validation
- Settings cached in `SettingsContext` on frontend

### Attendance States

Punch states: `checkIn`, `breakOut`, `breakIn`, `checkOut`
- `checkIn` sets `attendance.check_in` and status to 'Present'
- `checkOut` sets `attendance.check_out`
- `breakOut`/`breakIn` track break times
- `totalHoursWorked` recalculated after each punch

## Known Issues & Limitations

### 1. Route Matching Conflicts
**Issue:** Express parameterized routes (`/:id`) intercept specific routes (`/me`)
**Fix:** Always place specific routes before parameterized routes in route files
**Example:** `router.get('/me', ...)` must come before `router.get('/:id', ...)`

### 2. Daily Labourer Dashboard 404 ✅ RESOLVED
**Issue:** `/api/daily-labourers/me` returns 404 due to route conflict
**Fix:** `/me` is now placed before `/:id` in `dailyLabourer.routes.js` — the `/me` route works correctly

### 3. Validation Errors Not Displayed Inline
**Issue:** Backend returns `{ msg: 'Validation failed', errors: [...] }` but frontend only shows generic message
**Fix:** Parse `error.response.data.errors` array and display joined messages inline

### 4. Frontend Caching After Backend Changes
**Issue:** Vite HMR may not reflect backend route changes
**Fix:** Restart backend server after adding new routes

### 5. Database Schema Mismatches
**Issue:** Models expect columns that don't exist in database
**Fix:** Always run `init-database.sql` (project root — NOT `Ubuntu Rebuild/init-database.sql`) before starting; check model `mapRow` functions match actual columns

### 6. Missing User-Employee Linkage
**Issue:** Employee records not linked to user accounts
**Fix:** Run `link-daily-labourer-user.js` script to link users to employee records via `user_id`

### 7. Role-Based Access Not Enforced
**Issue:** Frontend routes protected but backend routes lack role middleware
**Fix:** Add `require('../middleware/role')(['admin', 'manager'])` to sensitive routes (file is `middleware/role.js`, not `roleMiddleware.js`)

### 8. PostgreSQL vs MongoDB Confusion
**Issue:** README states MERN stack but code uses PostgreSQL
**Fix:** Use PostgreSQL with `pg` driver; do NOT use Mongoose

### 9. Email Service Not Configured
**Issue:** Password reset requires email but SMTP not set up
**Fix:** Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS in `.env`

### 10. Biometric Device Integration
**Issue:** Biometric device push endpoint needs public URL
**Fix:** Deploy backend to public URL (Render, Heroku) and register webhook with device

## Common Pitfalls to Avoid

1. **Do NOT use MongoDB** - The entire backend uses PostgreSQL with raw SQL
2. **Do NOT use Mongoose** - Models are plain JavaScript classes with SQL queries
3. **Do NOT place `/:id` before `/me`** - Route order matters in Express
4. **Do NOT forget to restart backend** - New routes won't load without restart
5. **Do NOT hardcode JWT_SECRET** - Use environment variable
6. **Do NOT store passwords in plain text** - Always hash with bcryptjs
7. **Do NOT skip database initialization** - Run `init-database.sql` first
8. **Do NOT ignore validation errors array** - Parse and display inline
9. **Do NOT use `module.exports` with individual `exports`** - Causes conflicts
10. **Do NOT forget CORS configuration** - Frontend won't reach backend without it

## Deployment Checklist

### Backend
- [ ] Set production DATABASE_URL
- [ ] Set strong JWT_SECRET
- [ ] Configure email service (SMTP)
- [ ] Set FRONTEND_URL to production URL
- [ ] Enable HTTPS
- [ ] Configure CORS for production origin
- [ ] Register biometric device webhook URL
- [ ] Set up M-Pesa Daraja production credentials

### Frontend
- [ ] Set VITE_API_URL to production backend URL
- [ ] Build with `npm run build`
- [ ] Deploy `dist/` folder to static host
- [ ] Verify API calls work in production
- [ ] Test authentication flow end-to-end

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password123 |
| Manager | manager | password123 |
| Employee | employee | password123 |
| Daily Labourer | daily_labourer | password123 |

## File Reference Summary

**Key Backend Files:**
- `server.js` - Entry point
- `app.js` - Route registration
- `config/db.js` - Database connection
- `middleware/auth.js` - JWT verification
- `middleware/requestLogger.js` - Request/response logging
- `utils/logger.js` - Central structured logger (INFO/WARN/ERROR)
- `utils/validation.js` - Input validation
- `init-database.sql` - Database schema

**Key Frontend Files:**
- `src/App.jsx` - Routing
- `src/services/api.js` - API client (with logging interceptors)
- `src/contexts/AuthContext.jsx` - Auth state
- `src/utils/logger.js` - Browser-side structured logger
- `src/components/common/ErrorBoundary.jsx` - Component crash logger
- `src/components/DashboardLayout.jsx` - Layout
- `src/pages/shared/Attendance.jsx` - Attendance UI
