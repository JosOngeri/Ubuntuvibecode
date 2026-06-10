# Ubuntu HRMS - Developer Onboarding Guide

## Welcome to Ubuntu HRMS

This guide will help you get started with the Ubuntu HRMS codebase. The system is a modular HR management system built with Node.js/Express (backend) and React (frontend), using PostgreSQL as the database.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git
- VS Code or similar IDE

## Project Structure

```
Ubuntu Software/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── features/          # Feature-based modules
│   │   │   ├── auth/         # Authentication (login, register, password reset)
│   │   │   ├── recruitment/   # Job postings and applications
│   │   │   ├── attendance/   # Attendance tracking
│   │   │   ├── payroll/      # Payroll processing
│   │   │   ├── employees/    # Employee management
│   │   │   └── leave/        # Leave management
│   │   └── shared/           # Shared utilities
│   │       ├── middleware/    # Express middleware
│   │       ├── utils/         # Helper functions
│   │       ├── errors/        # Error classes
│   │       └── services/      # Cross-cutting services
│   ├── models/                # Data models (legacy, being migrated)
│   ├── controllers/           # Legacy controllers (being migrated)
│   ├── routes/               # API route definitions
│   ├── migrations/            # Database migration files
│   ├── tests/                 # Test files
│   └── config/               # Configuration files
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── features/          # Feature-based modules
│   │   │   ├── recruitment/   # Recruitment pages & hooks
│   │   │   ├── attendance/   # Attendance pages & hooks
│   │   │   ├── payroll/      # Payroll pages & hooks
│   │   │   ├── employees/    # Employee pages & hooks
│   │   │   └── leave/        # Leave pages & hooks
│   │   ├── shared/           # Shared components & utilities
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── utils/        # Helper functions
│   │   │   └── contexts/     # React contexts
│   │   ├── pages/            # Legacy page structure (being migrated)
│   │   └── services/         # API clients
│   └── public/               # Static assets
└── docs/                      # Documentation
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Ubuntu Software
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Ubuntu_hr
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=5000
```

#### Initialize Database

```bash
npm run db:init
```

This runs the `init-database.sql` script to create all tables and seed initial data.

#### Run Migrations

If there are pending migrations:

```bash
# Run all migrations
psql -U postgres -d Ubuntu_hr -f migrations/20240602000001_add_job_columns.sql
psql -U postgres -d Ubuntu_hr -f migrations/20240602000002_add_job_application_columns.sql
psql -U postgres -d Ubuntu_hr -f migrations/20240602000003_add_onboarding_columns.sql
psql -U postgres -d Ubuntu_hr -f migrations/20240602000004_add_foreign_keys.sql
psql -U postgres -d Ubuntu_hr -f migrations/20240602000005_add_indexes.sql
```

#### Start Backend Server

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
```

#### Start Frontend Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Architecture Overview

### Backend Architecture (3-Layer Pattern)

The backend follows a clean 3-layer architecture:

1. **Controllers** (`src/features/*/controllers/`)
   - Handle HTTP requests/responses
   - Validate input
   - Call services
   - Return standardized responses

2. **Services** (`src/features/*/services/`)
   - Contain business logic
   - Coordinate between repositories
   - Handle validation rules
   - Perform calculations

3. **Repositories** (`src/features/*/repositories/`)
   - Pure data access
   - SQL queries only
   - No business logic
   - Return raw data

**Example Flow:**
```
HTTP Request → Controller → Service → Repository → Database
                    ↓
                Response
```

### Frontend Architecture (Feature-Based)

The frontend is organized by features:

1. **Pages** (`src/features/*/pages/`)
   - UI components for the feature
   - Route-level components

2. **Services** (`src/features/*/services/`)
   - API client functions
   - Centralized API calls

3. **Hooks** (`src/features/*/hooks/`)
   - Custom React hooks
   - State management
   - API integration

4. **Components** (`src/features/*/components/`)
   - Reusable UI components
   - Feature-specific widgets

## Key Patterns

### Backend: Standardized API Responses

Always use the response utility from `src/shared/utils/response.js`:

```javascript
const { success, created, badRequest, notFound, serverError } = require('../../shared/utils/response');

// Success response
success(res, data, 'Operation successful');

// Created response
created(res, data, 'Resource created');

// Error responses
badRequest(res, 'Invalid input');
notFound(res, 'Resource not found');
serverError(res, 'Operation failed');
```

### Backend: Service Layer Pattern

Services contain business logic, controllers handle HTTP:

```javascript
// Service (business logic)
const calculatePayroll = async (employeeId, period) => {
  // Validation
  // Calculations
  // Repository calls
  return result;
};

// Controller (HTTP handling)
const calculatePayroll = async (req, res) => {
  try {
    const result = await payrollService.calculatePayroll(req.params.id, req.query.period);
    success(res, result, 'Payroll calculated');
  } catch (err) {
    if (err.message === 'Employee not found') {
      return notFound(res, err.message);
    }
    serverError(res, 'Calculation failed');
  }
};
```

### Frontend: Custom Hooks Pattern

Use custom hooks for state management:

```javascript
const { jobs, loading, error, createJob, updateJob } = useJobs({ open: true });

if (loading) return <Spinner />;
if (error) return <Error message={error} />;

return (
  <div>
    {jobs.map(job => <JobCard key={job.id} job={job} />)}
    <button onClick={() => createJob(jobData)}>Create Job</button>
  </div>
);
```

### Frontend: API Service Pattern

Centralize API calls in service files:

```javascript
// src/features/recruitment/services/jobApi.js
import api from '../../services/api';

const jobApi = {
  async getJobs(filters = {}) {
    const response = await api.get('/jobs', { params: filters });
    return response.data;
  },
  async createJob(jobData) {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },
};
```

## Database Schema

### Key Tables

- **users** - System users and authentication
- **employees** - Employee records
- **jobs** - Job postings
- **job_applications** - Job applications
- **attendance** - Attendance records
- **payslips** - Payroll records
- **pay_rates** - Employee pay rates
- **settings** - System configuration

### Foreign Key Relationships

- `job_applications.job_id` → `jobs.id`
- `job_applications.employee_id` → `employees.id`
- `attendance.employee_id` → `employees.id`
- `payslips.employee_id` → `employees.id`
- `pay_rates.employee_id` → `employees.id`

## Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create feature folder: `src/features/your-feature/`
   - Create subfolders: `controllers/`, `services/`, `repositories/`, `validators/`
   - Implement repository (data access)
   - Implement service (business logic)
   - Implement controller (HTTP handling)
   - Add routes in `routes/`
   - Write tests in `tests/`
   - Add feature README

2. **Frontend:**
   - Create feature folder: `src/features/your-feature/`
   - Create subfolders: `pages/`, `services/`, `hooks/`, `components/`
   - Implement API service
   - Implement custom hook
   - Implement pages/components
   - Add routes in `App.jsx`
   - Write tests

### Database Changes

**NEVER** use `ensureColumns()` or dynamic schema changes. Instead:

1. Create a migration file in `backend/migrations/`
2. Name it: `YYYYMMDDHHMMSS_description.sql`
3. Use `ALTER TABLE ADD COLUMN IF NOT EXISTS` for safety
4. Test migration on development database first
5. Document the migration in the file header

### Testing

#### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

#### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
npm run test:watch     # Watch mode
```

## Important Rules

### DO's

- **DO** use the 3-layer architecture (Controller → Service → Repository)
- **DO** use standardized response utility
- **DO** write feature READMEs
- **DO** add proper error handling
- **DO** log important actions with logger
- **DO** validate input at API boundary
- **DO** use custom hooks for state management
- **DO** centralize API calls in service files
- **DO** use migrations for schema changes
- **DO** write tests for new features

### DON'Ts

- **DON'T** put business logic in controllers
- **DON'T** put SQL queries in controllers or services
- **DON'T** use `ensureColumns()` or dynamic schema changes
- **DON'T** mix MongoDB patterns (this is PostgreSQL)
- **DON'T** skip error handling in async functions
- **DON'T** hardcode API URLs ( use environment variables)
- **DON'T** create generic "utils" dumping grounds
- **DON'T** share database connections across features
- **DON'T** forget foreign key constraints
- **DON'T** modify existing migrations (create new ones)

## Common Tasks

### Run Database Backup

```bash
pg_dump -U postgres Ubuntu_hr > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U postgres Ubuntu_hr < backup_20240602.sql
```

### Check Database Schema

```bash
psql -U postgres -d Ubuntu_hr -c "\d table_name"
```

### View Running Migrations

```bash
ls -la backend/migrations/
```

## Troubleshooting

### Backend Won't Start

1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check if port 5000 is in use
4. Review logs for specific errors

### Frontend API Errors

1. Verify backend is running
2. Check VITE_API_URL in `.env`
3. Check browser console for CORS errors
4. Verify API endpoint exists

### Database Connection Issues

1. Verify PostgreSQL service is running
2. Check database credentials
3. Test connection: `psql -U postgres -d Ubuntu_hr`
4. Check firewall settings

## Resources

### Feature Documentation

- [Recruitment Feature](backend/src/features/recruitment/README.md)
- [Attendance Feature](backend/src/features/attendance/README.md)
- [Payroll Feature](backend/src/features/payroll/README.md)

### External Documentation

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Jest](https://jestjs.io/)

## Getting Help

1. Check feature READMEs first
2. Review existing similar features
3. Ask senior developers for architectural decisions
4. Document your learnings for future reference

## Next Steps

1. Complete the setup steps above
2. Read the feature READMEs for areas you'll work on
3. Review the existing code structure
4. Start with small, well-defined tasks
5. Write tests as you develop
6. Ask questions when unsure

Happy coding! 🚀
