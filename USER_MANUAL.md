# Ubuntu HRMS User Manual

This manual provides comprehensive documentation for all pages and functionality in the Ubuntu HRMS web application, designed for hotel workforce management.

## Table of Contents
1. [User Roles](#user-roles)
2. [Authentication](#authentication)
3. [Recruitment Portal](#recruitment-portal)
4. [Admin Dashboard & Management](#admin-dashboard--management)
5. [Manager Dashboard & Operations](#manager-dashboard--operations)
6. [Employee Portal](#employee-portal)
7. [Contractor Portal](#contractor-portal)
8. [Leave Management](#leave-management)
9. [Payroll Management](#payroll-management)
10. [KPI Management](#kpi-management)
11. [Attendance Management](#attendance-management)
12. [Profile & Settings](#profile--settings)

---

## User Roles

### Admin
- Full system access
- Manage all users, employees, contractors
- Configure system settings
- View all reports and data
- Approve/reject requests at all levels

### Manager / Supervisor
- Manage team attendance and performance
- Approve leave requests
- Conduct KPI assessments
- Handle complaints
- View team reports

### HR
- Manage recruitment process
- Onboarding management
- Employee records management
- View reports

### Employee
- View personal dashboard
- Request leave
- Punch attendance
- View payslips
- Set KPI goals
- Submit complaints

### Contractor
- View assigned projects
- Manage invoices
- Track project progress
- View payments

---

## Authentication

### Login (`/login`)
**Access:** Public  
**Purpose:** Authenticate users into the system

**Functionality:**
- Enter email/username and password
- Forgot password link available
- Redirects to appropriate dashboard based on role after login

### Register (`/register`)
**Access:** Public  
**Purpose:** New user registration

**Functionality:**
- Create new account
- Select role (if applicable)
- Enter personal information
- Requires admin approval for certain roles

### Forgot Password (`/forgot-password`)
**Access:** Public  
**Purpose:** Password recovery

**Functionality:**
- Enter registered email
- Receive password reset link via email

### Reset Password (`/reset-password`)
**Access:** Public (via email link)  
**Purpose:** Set new password

**Functionality:**
- Enter new password
- Confirm new password
- Password strength validation

---

## Recruitment Portal

### Landing Page (`/`)
**Access:** Public  
**Purpose:** Public-facing landing page

**Functionality:**
- View company information
- Browse job opportunities
- Apply for jobs
- Login/Register buttons

### Public Job Board (`/recruitment/jobs-board`)
**Access:** Public  
**Purpose:** Browse available job postings

**Functionality:**
- View all active job postings
- Filter by job type, department, location
- View job details
- Apply directly from job listing

### Job Application Form (`/recruitment/apply/:jobId`)
**Access:** Public  
**Purpose:** Apply for a specific job

**Functionality:**
- Upload CV/resume
- Enter personal information
- Provide cover letter
- Submit application
- Track application status

### Job Posting Management (`/recruitment/jobs`)
**Access:** Admin, Manager, HR  
**Purpose:** Manage job advertisements

**Functionality:**
- Create new job postings
- Edit existing postings
- Close/activate job postings
- Set job requirements
- Define salary range
- Set application deadline

### Job Detail (`/recruitment/jobs/:jobId`)
**Access:** Admin, Manager, HR  
**Purpose:** View detailed job information

**Functionality:**
- View complete job description
- See application statistics
- View applicant list
- Edit job details

### Create Job Advertisement (`/recruitment/create-advertisement`)
**Access:** Admin, Manager, HR  
**Purpose:** Create new job posting

**Functionality:**
- Enter job title and description
- Set requirements and qualifications
- Define compensation
- Set application instructions
- Preview before publishing

### Applicant Review Dashboard (`/recruitment/jobs/:jobId/applicants`)
**Access:** Admin, Manager, HR  
**Purpose:** Review job applicants

**Functionality:**
- View all applicants for a job
- Filter by status (pending, reviewed, hired, rejected)
- View applicant profiles
- Schedule interviews
- Update applicant status

### Applicant Detail (`/recruitment/jobs/:jobId/applicants/:applicantId`)
**Access:** Admin, Manager, HR  
**Purpose:** View detailed applicant information

**Functionality:**
- View complete application
- Download CV/resume
- View cover letter
- Add notes/feedback
- Update application status
- Send interview invitation

### My Applications (`/recruitment/my-applications`)
**Access:** Admin, Manager, HR, Employee, Supervisor  
**Purpose:** Track personal job applications

**Functionality:**
- View all submitted applications
- Check application status
- View feedback
- Withdraw applications
- Update application details

---

## Admin Dashboard & Management

### Admin Dashboard (`/admin/dashboard`)
**Access:** Admin only  
**Purpose:** Overview of entire system

**Functionality:**
- View key metrics (employee count, active jobs, pending leaves)
- Recent activity feed
- Quick actions
- System health indicators
- Alerts and notifications

### Manage Employees (`/admin/employees`)
**Access:** Admin only  
**Purpose:** Employee directory and management

**Functionality:**
- View all employees
- Add new employee
- Edit employee details
- Deactivate/terminate employees
- Filter by department, role, status
- Export employee list

### Employee Profile (`/admin/employees/:employeeId`)
**Access:** Admin only  
**Purpose:** Detailed employee information

**Functionality:**
- View complete employee profile
- Employment history
- Attendance records
- Leave history
- Performance reviews
- Edit employee information
- Change employee status

### Manage Users (`/admin/users`)
**Access:** Admin only  
**Purpose:** System user management

**Functionality:**
- View all system users
- Add new users
- Assign roles
- Reset passwords
- Deactivate users
- View user activity

### User Detail (`/admin/users/:userId`)
**Access:** Admin only  
**Purpose:** Detailed user information

**Functionality:**
- View user profile
- Change user role
- Reset password
- View login history
- Update user information

### Permissions (`/admin/permissions`)
**Access:** Admin only  
**Purpose:** Configure role-based permissions

**Functionality:**
- Define role permissions
- Configure access levels
- Set page visibility by role
- Configure action permissions
- Export permission matrix

### Admin Settings (`/admin/settings`)
**Access:** Admin only  
**Purpose:** System-wide configuration

**Functionality:**
- Configure company information
- Set working hours
- Define leave policies
- Configure notification settings
- Set up email/SMS integration
- Manage system preferences

### Admin KPI (`/admin/kpis`)
**Access:** Admin only  
**Purpose:** Organization-wide KPI overview

**Functionality:**
- View all KPIs across departments
- Configure KPI templates
- Set organizational goals
- View KPI completion rates
- Export KPI reports

### Admin Leave (`/admin/leaves`)
**Access:** Admin only  
**Purpose:** Organization-wide leave management

**Functionality:**
- View all leave requests
- Configure leave types
- Set leave balances
- View leave statistics
- Export leave reports
- Configure leave policies

### Admin Payroll (`/admin/payroll`)
**Access:** Admin only  
**Purpose:** Payroll processing and management

**Functionality:**
- Process payroll
- View payroll history
- Configure salary structures
- Manage deductions
- Generate payslips
- Export payroll reports

### Admin Contract (`/admin/contracts`)
**Access:** Admin only  
**Purpose:** Contract management

**Functionality:**
- View all contracts
- Create new contracts
- Track contract expiry
- Renew contracts
- Terminate contracts
- Contract compliance tracking

### Onboarding (`/admin/onboarding`)
**Access:** Admin, Manager, HR  
**Purpose:** Employee onboarding process

**Functionality:**
- View onboarding checklist
- Track onboarding progress
- Assign onboarding tasks
- Generate offer letters
- Collect required documents
- Set up employee accounts

### Daily Labour (`/admin/daily-labour`)
**Access:** Admin, Manager  
**Purpose:** Manage daily casual labour

**Functionality:**
- Add daily labourers
- Track daily attendance
- Calculate daily wages
- Manage wage urgency
- Export daily labour reports

### Complaints (`/admin/complaints`)
**Access:** Admin, Manager  
**Purpose:** Manage employee complaints

**Functionality:**
- View all complaints
- Filter by status, department
- Respond to complaints
- Escalate complaints
- Track resolution
- Export complaint reports

### Assets (`/admin/assets`)
**Access:** Admin, Manager  
**Purpose:** Asset management

**Functionality:**
- View all assets
- Add new assets
- Assign assets to employees
- Track asset condition
- Schedule maintenance
- Asset depreciation tracking

### Contractors (`/admin/contractors`)
**Access:** Admin, Manager  
**Purpose:** Contractor management

**Functionality:**
- View all contractors
- Add new contractors
- Track contractor projects
- Manage contractor invoices
- View contractor performance
- Terminate contractor relationships

### Reports (`/admin/reports`)
**Access:** Admin, Manager  
**Purpose:** Generate and view reports

**Functionality:**
- Attendance reports
- Leave reports
- Payroll reports
- KPI reports
- Recruitment reports
- Custom reports
- Export to PDF/Excel

---

## Manager Dashboard & Operations

### Manager Dashboard (`/manager/dashboard`)
**Access:** Manager, Supervisor  
**Purpose:** Team overview and management

**Functionality:**
- View team attendance
- Pending leave approvals
- Team KPI progress
- Recent activities
- Quick actions
- Team alerts

### Manager Leaves (`/manager/leaves`)
**Access:** Manager, Supervisor  
**Purpose:** Manage team leave requests

**Functionality:**
- View team leave requests
- Approve/reject leaves
- View leave calendar
- Check leave balances
- Leave planning

---

## Employee Portal

### Employee Dashboard (`/employee/dashboard`)
**Access:** Employee only  
**Purpose:** Personal workspace overview

**Functionality:**
- View personal attendance
- Leave balance
- Upcoming shifts
- KPI progress
- Recent notifications
- Quick actions

### Employee Leaves (`/employee/leaves`)
**Access:** Employee only  
**Purpose:** Manage personal leave

**Functionality:**
- View leave balance
- Request leave
- View leave history
- Check leave status
- Cancel pending requests

### Punch (`/employee/punch`)
**Access:** Employee only  
**Purpose:** Clock in/out

**Functionality:**
- Clock in
- Clock out
- View today's punches
- View punch history
- Geolocation verification

---

## Contractor Portal

### Contractor Dashboard (`/contractor/dashboard`)
**Access:** Contractor only  
**Purpose:** Contractor workspace

**Functionality:**
- View assigned projects
- Project status overview
- Invoice status
- Payment status
- Recent activities

### Contractor Projects (`/contractor/projects`)
**Access:** Contractor only  
**Purpose:** Manage assigned projects

**Functionality:**
- View all projects
- Track project milestones
- Update project status
- Upload deliverables
- View project requirements

### Contractor Invoices (`/contractor/invoices`)
**Access:** Contractor only  
**Purpose:** Manage invoices

**Functionality:**
- Create new invoices
- View invoice history
- Check payment status
- Download invoices
- Track outstanding payments

### Contractor Portal (`/contractor/portal`)
**Access:** Contractor only  
**Purpose:** Main contractor interface

**Functionality:**
- Overview of all contractor activities
- Quick access to projects and invoices
- Notifications
- Document management

---

## Leave Management

### Leave Request (`/leave/request`)
**Access:** Employee only  
**Purpose:** Request leave

**Functionality:**
- Select leave type
- Choose date range
- Add reason
- Check leave balance
- Submit request
- View request status

### Leave Approvals (`/leave/approvals`)
**Access:** Admin, Manager, Supervisor  
**Purpose:** Approve/reject leave requests

**Functionality:**
- View pending requests
- Approve/reject with comments
- View leave calendar
- Check team availability
- Bulk approvals

### Leave Statutory (`/leave/statutory`)
**Access:** Admin, Manager  
**Purpose:** Manage statutory leave

**Functionality:**
- Configure statutory leave types
- Set leave accrual rates
- View statutory leave compliance
- Generate compliance reports

---

## Payroll Management

### Payroll Disburse (`/payroll/disburse`)
**Access:** Admin, Manager  
**Purpose:** Process payroll

**Functionality:**
- Select pay period
- Review payroll calculations
- Adjust deductions
- Process payments
- Generate payslips
- Export payroll data

### Employee Payslips (`/payroll/payslips`)
**Access:** Employee only  
**Purpose:** View personal payslips

**Functionality:**
- View payslip history
- Download payslips (PDF)
- View earnings breakdown
- View deductions
- Tax information

---

## KPI Management

### KPI Manage (`/kpi/manage`)
**Access:** Admin, Manager, Supervisor  
**Purpose:** Manage KPIs for team

**Functionality:**
- Create KPIs
- Assign KPIs to employees
- Set targets and deadlines
- Track KPI progress
- Configure KPI categories

### KPI Assessment (`/kpi/assessment`)
**Access:** Admin, Manager, Supervisor  
**Purpose:** Conduct KPI assessments

**Functionality:**
- View assigned assessments
- Rate employee performance
- Add comments and feedback
- Set improvement goals
- Submit assessments

### My Goals (`/kpi/my-goals`)
**Access:** Employee only  
**Purpose:** View personal KPIs

**Functionality:**
- View assigned KPIs
- Track progress
- View feedback
- Update goal status
- View completion history

---

## Attendance Management

### Attendance (`/admin/attendance`, `/manager/attendance`, `/employee/attendance`)
**Access:** Admin, Manager, Employee  
**Purpose:** View and manage attendance

**Functionality:**
- View attendance records
- Filter by date, employee
- Mark attendance (admin/manager)
- View attendance patterns
- Export attendance reports
- Identify attendance issues

### Attendance Detail (`/admin/attendance/:attendanceId`, `/manager/attendance/:attendanceId`, `/employee/attendance/:attendanceId`)
**Access:** Admin, Manager, Employee  
**Purpose:** Detailed attendance record

**Functionality:**
- View detailed attendance
- Edit attendance (admin/manager)
- Add notes
- View punch times
- Geolocation data
- Attendance validation

---

## Profile & Settings

### Profile View (`/profile/view`)
**Access:** All authenticated users  
**Purpose:** View personal profile

**Functionality:**
- View personal information
- Employment details
- Contact information
- Emergency contacts
- Documents

### Profile Update (`/profile/update`)
**Access:** All authenticated users  
**Purpose:** Update personal profile

**Functionality:**
- Update personal information
- Change password
- Upload profile photo
- Update contact details
- Add emergency contacts

### Profile (`/profile`)
**Access:** All authenticated users  
**Purpose:** Main profile interface

**Functionality:**
- Profile overview
- Quick actions
- Recent activity
- Notifications

### Settings (`/settings`)
**Access:** All authenticated users  
**Purpose:** Personal settings

**Functionality:**
- Notification preferences
- Theme settings
- Language settings
- Privacy settings
- Security settings (2FA)

---

## Contract Review

### Contract Review (`/contracts/review`)
**Access:** Admin, Manager  
**Purpose:** Review and manage contracts

**Functionality:**
- View pending contract reviews
- Review contract terms
- Approve/reject contracts
- Request changes
- Track contract lifecycle
- Contract compliance checks

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/role` - Assign role

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:id` - Get attendance details

### Leave
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Request leave
- `PUT /api/leave/:id` - Update leave request
- `DELETE /api/leave/:id` - Cancel leave

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll/payslips` - Get payslips

### KPI
- `GET /api/kpi` - Get KPIs
- `POST /api/kpi` - Create KPI
- `PUT /api/kpi/:id` - Update KPI
- `POST /api/kpi/:id/assessment` - Submit assessment

### Recruitment
- `GET /api/jobs` - Get job postings
- `POST /api/jobs` - Create job posting
- `GET /api/jobs/:id/applicants` - Get job applicants
- `POST /api/jobs/:id/apply` - Apply for job

---

## Common Actions Across Roles

### All Users Can:
- View their profile
- Update their profile
- Change password
- View notifications
- Access settings
- Log out

### Admin Can:
- All user actions plus:
- Manage all users and employees
- Configure system settings
- View all reports
- Approve/reject all requests
- Full data access

### Manager/Supervisor Can:
- All user actions plus:
- Manage team attendance
- Approve team leave requests
- Conduct KPI assessments
- View team reports
- Handle team complaints

### HR Can:
- All user actions plus:
- Manage recruitment
- Onboarding management
- Employee records
- View reports

### Employee Can:
- All user actions plus:
- Request leave
- Punch attendance
- View payslips
- Set KPI goals
- Submit complaints

### Contractor Can:
- All user actions plus:
- View assigned projects
- Manage invoices
- Track project progress
- View payments

---

## Navigation Structure

```
/
├── /login
├── /register
├── /forgot-password
├── /reset-password
├── /unauthorized
├── /dashboard (redirects based on role)
│   ├── /admin/dashboard
│   ├── /manager/dashboard
│   ├── /employee/dashboard
│   └── /contractor/dashboard
├── /admin/*
│   ├── /admin/employees
│   ├── /admin/users
│   ├── /admin/permissions
│   ├── /admin/settings
│   ├── /admin/attendance
│   ├── /admin/kpis
│   ├── /admin/leaves
│   ├── /admin/payroll
│   ├── /admin/contracts
│   ├── /admin/onboarding
│   ├── /admin/daily-labour
│   ├── /admin/complaints
│   ├── /admin/assets
│   ├── /admin/contractors
│   └── /admin/reports
├── /manager/*
│   ├── /manager/attendance
│   └── /manager/leaves
├── /employee/*
│   ├── /employee/leaves
│   ├── /employee/attendance
│   └── /employee/punch
├── /contractor/*
│   ├── /contractor/projects
│   ├── /contractor/invoices
│   └── /contractor/portal
├── /recruitment/*
│   ├── /recruitment/jobs-board (public)
│   ├── /recruitment/apply/:jobId (public)
│   ├── /recruitment/jobs
│   ├── /recruitment/jobs/:jobId
│   ├── /recruitment/create-advertisement
│   ├── /recruitment/jobs/:jobId/applicants
│   ├── /recruitment/jobs/:jobId/applicants/:applicantId
│   └── /recruitment/my-applications
├── /leave/*
│   ├── /leave/request
│   ├── /leave/approvals
│   └── /leave/statutory
├── /payroll/*
│   ├── /payroll/disburse
│   └── /payroll/payslips
├── /kpi/*
│   ├── /kpi/manage
│   ├── /kpi/assessment
│   └── /kpi/my-goals
├── /contracts/review
├── /profile/*
│   ├── /profile/view
│   ├── /profile/update
│   └── /profile
└── /settings
```

---

## Support & Help

For technical support or questions about the system:
- Contact system administrator
- Check the FAQ section
- Review the troubleshooting guide
- Submit a support ticket through the system
