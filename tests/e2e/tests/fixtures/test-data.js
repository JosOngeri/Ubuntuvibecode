// tests/fixtures/test-data.js
// Static mock data fixtures used across the E2E test suite.
// These mirror the shape of real API responses so tests can verify
// correct rendering without being tightly coupled to DB state.

// ─────────────────────────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_EMPLOYEES = [
  {
    id: 1,
    firstName: 'James',
    lastName: 'Mwangi',
    email: 'james.mwangi@ubuntu.co.ke',
    phone: '+254 712 345 678',
    department: 'Engineering',
    employmentType: 'Full-Time',
    wageRate: 85000,
    status: 'Active',
    nationalId: '12345678',
    kraPin: 'A123456789Z',
    position: 'Senior Software Engineer',
    hireDate: '2023-01-15',
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Wanjiku',
    email: 'sarah.wanjiku@ubuntu.co.ke',
    phone: '+254 722 456 789',
    department: 'Human Resources',
    employmentType: 'Full-Time',
    wageRate: 72000,
    status: 'Active',
    nationalId: '23456789',
    kraPin: 'B234567890Z',
    position: 'HR Manager',
    hireDate: '2022-06-01',
  },
  {
    id: 3,
    firstName: 'Peter',
    lastName: 'Kamau',
    email: 'peter.kamau@ubuntu.co.ke',
    phone: '+254 733 567 890',
    department: 'Finance',
    employmentType: 'Contract',
    wageRate: 65000,
    status: 'Active',
    nationalId: '34567890',
    kraPin: 'C345678901Z',
    position: 'Accountant',
    hireDate: '2023-03-20',
  },
  {
    id: 4,
    firstName: 'Grace',
    lastName: 'Achieng',
    email: 'grace.achieng@ubuntu.co.ke',
    phone: '+254 744 678 901',
    department: 'Operations',
    employmentType: 'Full-Time',
    wageRate: 55000,
    status: 'Inactive',
    nationalId: '45678901',
    kraPin: 'D456789012Z',
    position: 'Operations Coordinator',
    hireDate: '2021-09-10',
  },
  {
    id: 5,
    firstName: 'David',
    lastName: 'Odhiambo',
    email: 'david.odhiambo@ubuntu.co.ke',
    phone: '+254 755 789 012',
    department: 'Marketing',
    employmentType: 'Part-Time',
    wageRate: 40000,
    status: 'Active',
    nationalId: '56789012',
    kraPin: 'E567890123Z',
    position: 'Marketing Executive',
    hireDate: '2024-01-08',
  },
];

// New employee fixture for form submission tests
const NEW_EMPLOYEE = {
  firstName: 'Test',
  lastName: 'Playwright',
  email: `playwright.test.${Date.now()}@ubuntu.co.ke`,
  phone: '+254 700 000 001',
  department: 'Engineering',
  employmentType: 'Full-Time',
  wageRate: 50000,
  nationalId: '99999999',
};

// ─────────────────────────────────────────────────────────────────────────────
// Payroll
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PAYSLIPS = [
  {
    id: 101,
    employeeId: 1,
    employeeName: 'James Mwangi',
    period: 'May 2026',
    grossPay: 85000,
    nhif: 1700,
    nssf: 2160,
    paye: 18825,
    otherDeductions: 0,
    netPay: 62315,
    status: 'Approved',
    paymentDate: '2026-05-31',
  },
  {
    id: 102,
    employeeId: 2,
    employeeName: 'Sarah Wanjiku',
    period: 'May 2026',
    grossPay: 72000,
    nhif: 1700,
    nssf: 2160,
    paye: 14325,
    otherDeductions: 0,
    netPay: 53815,
    status: 'Pending',
    paymentDate: null,
  },
  {
    id: 103,
    employeeId: 3,
    employeeName: 'Peter Kamau',
    period: 'May 2026',
    grossPay: 65000,
    nhif: 1700,
    nssf: 2160,
    paye: 11825,
    otherDeductions: 0,
    netPay: 49315,
    status: 'Pending',
    paymentDate: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Leave
// ─────────────────────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Compassionate Leave',
  'Study Leave',
  'Unpaid Leave',
];

const MOCK_LEAVE_REQUESTS = [
  {
    id: 201,
    employeeId: 1,
    employeeName: 'James Mwangi',
    leaveType: 'Annual Leave',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    days: 5,
    reason: 'Family vacation',
    status: 'Pending',
    appliedOn: '2026-06-10',
  },
  {
    id: 202,
    employeeId: 2,
    employeeName: 'Sarah Wanjiku',
    leaveType: 'Sick Leave',
    startDate: '2026-06-15',
    endDate: '2026-06-17',
    days: 3,
    reason: 'Medical appointment',
    status: 'Approved',
    appliedOn: '2026-06-12',
  },
  {
    id: 203,
    employeeId: 5,
    employeeName: 'David Odhiambo',
    leaveType: 'Annual Leave',
    startDate: '2026-06-20',
    endDate: '2026-06-25',
    days: 6,
    reason: 'Personal',
    status: 'Rejected',
    appliedOn: '2026-06-08',
  },
];

const LEAVE_BALANCES = {
  annual: { entitled: 21, used: 5, remaining: 16 },
  sick:   { entitled: 14, used: 3, remaining: 11 },
  other:  { entitled: 5,  used: 0, remaining: 5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_ATTENDANCE = [
  {
    id: 301,
    employeeId: 1,
    employeeName: 'James Mwangi',
    date: '2026-06-09',
    status: 'Present',
    checkIn: '08:02',
    checkOut: '17:15',
    hoursWorked: 9.22,
    shift: 'Day',
  },
  {
    id: 302,
    employeeId: 2,
    employeeName: 'Sarah Wanjiku',
    date: '2026-06-09',
    status: 'Present',
    checkIn: '07:58',
    checkOut: '17:05',
    hoursWorked: 9.12,
    shift: 'Day',
  },
  {
    id: 303,
    employeeId: 3,
    employeeName: 'Peter Kamau',
    date: '2026-06-09',
    status: 'Absent',
    checkIn: null,
    checkOut: null,
    hoursWorked: 0,
    shift: 'Day',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Recruitment
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_JOBS = [
  {
    id: 401,
    title: 'Senior Software Engineer',
    department: 'Engineering',
    type: 'Full-Time',
    location: 'Nairobi, Kenya',
    status: 'Active',
    postedDate: '2026-05-15',
    closingDate: '2026-07-15',
    applicants: 12,
    description: 'We are looking for a senior software engineer to join our team.',
  },
  {
    id: 402,
    title: 'HR Assistant',
    department: 'Human Resources',
    type: 'Full-Time',
    location: 'Nairobi, Kenya',
    status: 'Active',
    postedDate: '2026-05-20',
    closingDate: '2026-06-30',
    applicants: 8,
    description: 'Supporting HR operations across the organization.',
  },
  {
    id: 403,
    title: 'Finance Analyst',
    department: 'Finance',
    type: 'Contract',
    location: 'Remote',
    status: 'Active',
    postedDate: '2026-06-01',
    closingDate: '2026-07-01',
    applicants: 5,
    description: 'Financial analysis and reporting role.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KPI / Performance
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_KPIS = [
  {
    id: 501,
    employeeId: 1,
    employeeName: 'James Mwangi',
    title: 'Code Review Completion Rate',
    target: 95,
    score: 88,
    status: 'In Progress',
    period: 'Q2 2026',
  },
  {
    id: 502,
    employeeId: 2,
    employeeName: 'Sarah Wanjiku',
    title: 'Employee Onboarding Satisfaction',
    target: 90,
    score: 92,
    status: 'Achieved',
    period: 'Q2 2026',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Departments (used in dropdowns)
// ─────────────────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Marketing',
  'Sales',
  'IT',
  'Administration',
  'Legal',
  'Customer Service',
];

// ─────────────────────────────────────────────────────────────────────────────
// Admin navigation routes (all pages that should render without errors)
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_ROUTES = [
  { path: '/admin/dashboard',                  title: 'Dashboard' },
  { path: '/admin/people',                     title: 'People' },
  { path: '/admin/employees',                  title: 'Employees' },
  { path: '/admin/users',                      title: 'Users' },
  { path: '/admin/permissions',                title: 'Permissions' },
  { path: '/admin/attendance',                 title: 'Attendance' },
  { path: '/admin/payroll',                    title: 'Payroll' },
  { path: '/admin/kpi',                        title: 'KPI' },
  { path: '/admin/leave',                      title: 'Leave' },
  { path: '/admin/contracts',                  title: 'Contracts' },
  { path: '/admin/training',                   title: 'Training' },
  { path: '/admin/document-vault',             title: 'Document Vault' },
  { path: '/admin/org-chart',                  title: 'Org Chart' },
  { path: '/admin/performance',                title: 'Performance' },
  { path: '/admin/hr-ops',                     title: 'HR Operations' },
  { path: '/admin/resources',                  title: 'Resources' },
  { path: '/admin/daily-labour',               title: 'Daily Labour' },
  { path: '/admin/onboarding',                 title: 'Onboarding' },
  { path: '/admin/contractors',                title: 'Contractors' },
  { path: '/admin/assets',                     title: 'Assets' },
  { path: '/admin/recruitment',                title: 'Recruitment' },
  { path: '/admin/reports',                    title: 'Reports' },
  { path: '/admin/messages',                   title: 'Messages' },
  { path: '/admin/settings',                   title: 'Settings' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared routes accessible by admin
// ─────────────────────────────────────────────────────────────────────────────
const SHARED_ROUTES = [
  { path: '/attendance/punch',   title: 'Punch' },
  { path: '/attendance',         title: 'Attendance' },
  { path: '/leave/request',      title: 'Leave Request' },
  { path: '/leave/approvals',    title: 'Leave Approvals' },
  { path: '/payroll/payslips',   title: 'Payslips' },
  { path: '/kpi/manage',         title: 'KPI' },
  { path: '/complaints',         title: 'Complaints' },
  { path: '/reports',            title: 'Reports' },
  { path: '/messages',           title: 'Messages' },
];

module.exports = {
  MOCK_EMPLOYEES,
  NEW_EMPLOYEE,
  MOCK_PAYSLIPS,
  LEAVE_TYPES,
  MOCK_LEAVE_REQUESTS,
  LEAVE_BALANCES,
  MOCK_ATTENDANCE,
  MOCK_JOBS,
  MOCK_KPIS,
  DEPARTMENTS,
  ADMIN_ROUTES,
  SHARED_ROUTES,
};
