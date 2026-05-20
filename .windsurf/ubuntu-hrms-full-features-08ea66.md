# Ubuntu HRMS — Full Feature Upgrade Plan for Hotel Operations

A comprehensive upgrade to bring the Ubuntu HRMS from a basic HR system to a full hotel workforce management platform covering recruitment, onboarding, contractor lifecycle, daily casual labour, complaints, KPI, and payments — with role-based navigation and admin-level data filtering.

---

## 1. Navigation & Role Mapping

### Roles
| Role | Who | Description |
|------|-----|-------------|
| **Owner / Super Admin** | Hotel owner | Full system access, all data, all reports, all filters |
| **Admin** | HR/Operations manager | Manage employees, payroll, complaints, contractors, daily labour, reports |
| **Manager / Supervisor** | Dept heads (F&B, grounds, housekeeping, farm) | Team attendance, leave approvals, KPI assessments, complaints handling |
| **Employee** | Waiters, chefs, gatemen, groundsmen, farm help | Punch, leave, payslips, KPI goals, submit complaints |
| **Daily Labourer** | Casual farm hands, housekeeping extras | Quick punch, view daily wages, limited profile |
| **Contractor** | External builders, mechanics | Quotes, milestones, progress reports, receipts, invoices |
| **Public** | Unauthenticated visitors | View & apply for jobs on landing page |

### Navigation Map

```
UBUNTU LANDING PAGE (public)
├── Home
├── Job Board → View Jobs → Apply (no login required)
├── About
└── Login → redirects to role-based dashboard

OWNER / SUPER ADMIN SIDEBAR
├── Overview
│   └── Executive Dashboard (all-hotel KPIs, revenue, headcount, complaints)
├── Workforce
│   ├── All Employees (CRUD + filter by dept/status/type)
│   ├── Daily Labourers (register, assign, attendance, wage calc)
│   ├── Contractors (lifecycle, milestones, KPI)
│   └── Onboarding Queue (pending onboardings)
├── Time & Attendance
│   ├── Attendance Overview (all staff + daily labourers)
│   ├── Leave Management (all requests)
│   └── Statutory Leave Review
├── Performance
│   ├── KPI Definitions Library
│   ├── Employee KPI Assignments & Scores
│   ├── Contractor KPI (milestone-based auto-scoring)
│   └── Probation Reviews
├── Finance
│   ├── Payroll Disbursement (permanent + daily wages)
│   ├── Contractor Payments (milestone-linked)
│   └── Payment History & Reports
├── Complaints & Conflicts
│   ├── Guest Complaints (service, food, rooms)
│   ├── Employee Grievances
│   └── Incident Reports
├── Recruitment
│   ├── Job Postings (CRUD)
│   ├── Applications Review
│   ├── Interview Scheduling
│   └── Hire → Trigger Onboarding
├── Reports & Analytics (dynamic filters)
│   ├── Attendance Report
│   ├── Leave Report
│   ├── Payroll Report
│   ├── KPI Report
│   ├── Employee Demographics
│   ├── Contractor Performance
│   ├── Complaint Trends
│   └── Daily Labour Utilization
├── Settings
│   ├── Departments & Positions
│   ├── Wage Rates & Allowances
│   ├── Complaint Categories
│   └── System Config
└── Account → Profile

ADMIN SIDEBAR (same as owner minus system config)

MANAGER / SUPERVISOR SIDEBAR
├── Overview → Team Dashboard
├── My Team
│   ├── Team Attendance
│   ├── Leave Approvals
│   └── Daily Labourers (assigned to my dept)
├── Performance
│   ├── Manage KPIs (assign to team)
│   ├── KPI Assessment (score team members)
│   └── Probation Reviews
├── Complaints → Handle assigned complaints
├── Recruitment → Review applications for my dept
├── Reports → Filtered to my department
└── Account → Profile

EMPLOYEE SIDEBAR
├── Overview → My Dashboard
├── Time & Leave
│   ├── Manual Punch
│   ├── My Attendance
│   ├── My Leaves
│   └── Request Leave
├── Performance → My Goals & Scores
├── Finance → My Payslips
├── Complaints → Submit Complaint / Grievance
├── Careers → Job Board (internal) / My Applications
└── Account → Profile

DAILY LABOURER SIDEBAR (minimal)
├── Quick Punch
├── My Attendance & Wages (this week/month)
├── My Assignments (which dept/contractor)
└── Account → Basic Profile

CONTRACTOR SIDEBAR
├── Overview → My Dashboard (active contracts, milestones, earnings)
├── Contracts
│   ├── My Contracts
│   ├── Submit Quote
│   └── Request Materials / Labour Downpayment
├── Milestones
│   ├── Create Milestones
│   ├── Submit Progress (photos, receipts)
│   └── Milestone Status
├── Finance
│   ├── My Invoices
│   ├── Payment History
│   └── Daily Wage Tracking (if daily-rate contractor)
├── Performance → My KPI Scores (auto-calculated)
└── Account → Profile
```

---

## 2. Feature Modules to Build

### A. Public Job Board (Landing Page)
- **Path**: `/jobs` — accessible without login
- Beautiful modern UI showing open positions
- Filter by department, type
- "Apply Now" button → application form with CV upload
- Better design than current Ubuntuecolodge.com
- Embedded in or linked from the main hotel landing page

### B. Full Onboarding Workflow
- **Trigger**: Admin clicks "Hire" on a job application
- **Steps**:
  1. Generate Offer Letter (PDF, auto-filled from application)
  2. Candidate accepts → Convert to Employee profile
  3. Document Collection checklist (ID, certificates, medical, KRA PIN, NSSF, NHIF)
  4. Department & Supervisor assignment
  5. Asset Allocation (uniform, tools, PPE — tracked in inventory)
  6. Orientation / Training schedule
  7. Probation Period (3 months default, configurable)
  8. Probation Review #1 (mid-point) and #2 (end-of-probation)
  9. Confirmation → status changes to "Permanent"
- **Dashboard widget**: "Pending Onboardings" count

### C. Full Contractor Lifecycle
- **Registration**: Admin registers contractor (company name, KRA PIN, contact, skills/trade)
- **Quote Submission**: Contractor submits quote for a project (description, amount, timeline)
- **Approval Workflow**: Admin reviews & approves/rejects quote
- **Milestone Creation** (by contractor after approval):
  - Title, description, deliverables, deadline, budget allocation
  - Material requirements (items, quantities, estimated cost)
  - Labour requirements (number of workers, days, daily rate)
  - Downpayment request (% of milestone budget)
- **Progress Tracking**:
  - Photo uploads (before/during/after)
  - Receipt uploads for materials
  - Daily labourer assignment (link daily labourers to contractor milestone)
  - Progress % update
- **Milestone Verification**: Admin reviews submitted evidence, approves/rejects
- **Auto KPI Scoring**:
  - Timeliness score (on-time = 100%, each day late = -2%)
  - Budget adherence (on-budget = 100%, over by % = proportional deduction)
  - Quality score (admin rating 1-5, converted to %)
  - Overall milestone KPI = weighted average
- **Payment Processing**: Milestone completion → payment released (full or partial per contract terms)
- **Daily-Wage Contractors**: Special mode where contractor is paid daily rate × days worked, milestones are daily deliverables
- **Final Sign-Off**: All milestones complete → project closed → final contractor KPI calculated

### D. Full Daily Casual Labour Management
- **Quick Registration**: Name, phone, ID number, skill tags (farming, housekeeping, construction, grounds), photo
- **Daily Attendance**: Simple check-in/check-out, possibly via supervisor
- **Assignment**: Assign to department (farm, housekeeping, grounds) OR to a contractor's milestone
- **Wage Calculation**: Daily rate × days worked this week/month, auto-calculated
- **Payment**: Included in payroll disbursement as "Casual Wages" batch
- **Conversion Path**: "Convert to Employee" button triggers mini-onboarding
- **Dashboard**: Active daily labourers today, total casual wage bill this month

### E. Guest + Employee Complaints System
- **Complaint Types**:
  - Guest: Service quality, food quality, room condition, billing, noise, theft/loss
  - Employee: Grievance against colleague, grievance against supervisor, harassment, discrimination, working conditions, pay dispute
- **Submission**:
  - Guest complaints: Submitted by front-desk staff or manager on behalf of guest
  - Employee complaints: Self-submitted via portal
- **Workflow**:
  1. Complaint filed (category, description, urgency: low/medium/high/critical)
  2. Auto-assigned to relevant manager based on category
  3. Acknowledgment (within SLA: critical=1hr, high=4hrs, medium=24hrs, low=48hrs)
  4. Investigation notes (private to handler)
  5. Resolution (action taken, compensation if any)
  6. Closure (complainant confirmation)
- **Dashboard**: Open complaints by urgency, aging, resolution rate

### F. Enhanced Reports & Data Filtering
- Already built the backend report controller — extend with:
  - **Contractor Performance Report**: Milestone completion rate, avg KPI, budget variance
  - **Daily Labour Utilization**: Days worked, cost per department, cost per contractor
  - **Complaint Trends**: By type, by month, resolution time, repeat offenders
  - **Onboarding Pipeline**: In-progress onboardings, avg time-to-productivity
- **Global Filters** (available on all report pages):
  - Date range (preset + custom)
  - Department multi-select
  - Employee type (permanent, contract, daily casual)
  - Status
  - Export (PDF, CSV, Excel)

### G. Asset & Inventory Tracking (for onboarding)
- Simple asset register: uniforms, tools, PPE
- Assign to employee during onboarding
- Track returns on exit
- Low stock alerts

---

## 3. Implementation Phases

### Phase 1 — Foundation (this session)
1. Public Job Board page (landing page integration)
2. Full Onboarding Workflow (backend + frontend)
3. Daily Labourer Management (registration, attendance, wage calc)
4. Complaints System (guest + employee, full workflow)

### Phase 2 — Contractor Lifecycle
5. Contractor Registration & Quote Submission
6. Milestone Creation & Progress Tracking
7. Auto KPI Scoring Engine
8. Contractor Payment Integration

### Phase 3 — Polish
9. Asset/Inventory Tracking
10. Enhanced Reports with global filters
11. Landing Page redesign (public-facing)
12. Notification System (email/SMS for complaints, milestones, leave)

---

## 4. Backend Models Needed

| Model | Key Fields |
|-------|-----------|
| `DailyLabourer` | name, phone, idNumber, skills[], dailyRate, status, convertibleToEmployee |
| `DailyAttendance` | labourerId, date, checkIn, checkOut, assignedTo (dept/contractor), wageForDay |
| `Onboarding` | employeeId, step, completedSteps[], documents[], assetsAssigned[], probationEnd, reviews[] |
| `Complaint` | type (guest/employee), category, description, urgency, status, assignedTo, resolution, timeline[] |
| `ContractorQuote` | contractorId, projectTitle, description, amount, status, approvedBy |
| `Milestone` | quoteId, contractorId, title, deliverables, deadline, budget, materialsRequest[], labourRequest[], downpaymentRequest, progress%, photos[], receipts[], kpiScore |
| `Asset` | name, type, assignedTo, assignedDate, returnDate, condition |

---

## 5. Key Design Decisions

- **Contractor KPI is auto-calculated** from milestone timeliness + budget + admin quality rating
- **Daily labourers can be assigned to contractors** — the contractor's milestone tracks which labourers worked on it
- **Complaints have SLA tracking** — the system flags overdue responses
- **Onboarding is a state machine** — each step must be completed before the next unlocks
- **Public job board is SEO-friendly** — server-rendered or pre-rendered for search engines
- **All admin/manager views have filter bars** — department, date range, status, type — so the owner can slice data however they want
