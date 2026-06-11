# Comprehensive Ubuntu HRMS Database Seeding

This plan creates a comprehensive seed script to populate all database tables with realistic data for 16 Ubuntu employees from October 2025, including attendance records from onboarding, leave requests, KPIs, payslips, and all other related data.

## Data Mapping

### Role to Department Mapping
- Waitress, Kitchen Steward, Chef → Kitchen
- House Keeping, Masseuse, Masseuse Intern, Daily Labor → Operations
- Photography & Music → Marketing
- Groundsman & Dog, Farmhand, Games & Grounds → Grounds
- Manager → Administration
- Watchman → Security

### Employment Types
- Manager, Chef, Waitress, Kitchen Steward, House Keeping, Masseuse, Masseuse Intern, Photography & Music, Groundsman & Dog, Farmhand, Games & Grounds, Watchman → Permanent
- Daily Labor → Daily (wage_rate = 600)
- Contractor → Contractor (wage_rate = 1500)

### Wage Rates (Monthly)
- Manager: 80,000
- Chef: 35,000
- Kitchen Steward: 25,000
- Waitress: 20,000
- Masseuse: 30,000
- Masseuse Intern: 18,000
- Photography & Music: 35,000
- Groundsman & Dog: 22,000
- Farmhand: 20,000
- Games & Grounds: 22,000
- Watchman: 18,000
- House Keeping: 18,000
- Daily Labor: 600 (daily rate)
- Contractor: 1500 (contract rate)

### User Account Details
- Email format: hbjoscards+<firstname>@gmail.com
- Username format: Firstname.lastname
- Password: firstname@123
- Role: employee (except Manager = manager, Watchmen =security)

### Date Joined
- Random dates between May-July 2025 (3-5 months prior to October 2025)

## Implementation Steps

1. **Add 'off-day' leave type to system**
   - Add 'off-day' to LEAVE_TYPES setting in database
   - Add leave policy for 'off-day' type in leave_policies table
   - Configure rule: auto-approve, no balance required, day_count_mode='working_days'

2. **Update frontend UI for 'Leave and Off-days'**
   - Rename leave-related buttons and cards to "Leave and Off-days"
   - Update navigation menu items
   - Update dashboard cards showing leave/off-day balances
   - Update leave request form to include off-day option
   - Update leave approvals page header

3. **Create comprehensive seed script** (`scripts/seed-ubuntu-employees.js`)
   - Add new departments (Grounds, Administration) to settings if not present
   - Create user accounts for all 16 employees with hashed passwords
   - Create employee records with proper department, employment type, wage rate
   - Set date_joined to random dates in May-July 2025
   - Generate leave balances for current year

4. **Seed Attendance Records**
   - Generate daily attendance from each employee's date_joined to yesterday
   - Standard work hours: 8:00 AM to 8:00 PM (12-hour shifts)
   - Most employees: 90% present, 10% absent/off-day (random Tuesday/Wednesday/Thursday)
   - Waiters and Housekeeping: Occasionally work after-hours (8:00 PM - 10:00 PM) when requested by clients
   - Alex Leshan & Jackson Leshan (Watchmen): 100% night shift (8:00 PM - 8:00 AM), sometimes extra day shifts (10%)
   - Andrew Leparan (Manager): Day shift only (8:00 AM - 8:00 PM), no off-days
   - Include realistic punch-in/out times and total hours worked (8-12 hours standard, up to 14 hours with overtime)

5. **Seed Leave Requests**
   - Generate 3-5 leave requests per employee
   - Mix of statuses: Approved, Pending, Rejected
   - Various leave types: annual, sick, compassionate, unpaid, off-day
   - Realistic dates within employment period
   - Some with approver_id set (Manager Andrew Leparan)

6. **Seed KPI Data**
   - Create role-specific KPI definitions relevant to hospitality industry:
     - Kitchen: Food quality, kitchen cleanliness, order accuracy, food cost control
     - Service: Customer satisfaction, table turnover rate, upselling success
     - Housekeeping: Room cleanliness scores, guest satisfaction, task completion time
     - Grounds: Grounds maintenance quality, landscaping standards, safety compliance
     - Security: Incident response time, patrol completion rate, safety incident reduction
     - Management: Team productivity, cost control, guest satisfaction overall
     - Photography/Music: Event coverage quality, client satisfaction, equipment maintenance
   - Assign relevant KPIs to employees based on their role
   - Set realistic target/achieved values (70-95% achievement rates typical)
   - Generate pending bonuses based on KPI performance
   - Periods: Q3-2025, Q4-2025, Q1-2026

7. **Seed Payroll Data**
   - Create pay_rates for all employees
   - Generate monthly payslips from date_joined to current month
   - Include overtime, deductions, KPI bonuses
   - Mix of statuses: Draft, Approved, Paid
   - Payment method: MPESA for most

8. **Seed Recruitment Data**
   - Create 5-10 job postings relevant to hospitality
   - Generate 15-20 job applications
   - Link some applications to users

9. **Seed Project Assignments**
   - Assign employees to relevant projects (e.g., "Kitchen Renovation", "Grounds Maintenance", "Security Upgrade")
   - Realistic project timelines

10. **Seed Employee Profiles**
    - Create professional profiles for employees
    - Include skills, certifications, work history
    - Match to their roles

11. **Seed Contractor Data**
    - For Josiah Ongesi (Contractor): create projects, invoices, performance records

12. **Test the seed script**
    - Run the script to verify all data insertion
    - Check for any conflicts or errors
    - Verify data relationships and constraints

## Files to Create/Modify

- Create: `ubuntu-hrms-backend/scripts/seed-ubuntu-employees.js`
- Modify: `ubuntu-hrms-backend/config/db.js` (add off-day to LEAVE_TYPES and leave_policies)
- Modify: Frontend files to rename "Leave" to "Leave and Off-days":
  - Navigation menu components
  - Dashboard cards (leave balance display)
  - Leave request page (pages/leave/Request.jsx)
  - Leave approvals page (pages/leave/Approvals.jsx)
  - Any other leave-related UI components

## KPI Definitions by Role

### Kitchen Department (Chef, Kitchen Steward, Waitress)
- Food Quality Score (target: 90%)
- Kitchen Cleanliness Standards (target: 95%)
- Order Accuracy Rate (target: 98%)
- Food Cost Control (target: 85%)
- Meal Preparation Time (target: 90%)

### Service Department (Waitress)
- Customer Satisfaction Rating (target: 90%)
- Table Turnover Rate (target: 85%)
- Upselling Success Rate (target: 70%)
- Order Accuracy (target: 98%)

### Housekeeping (House Keeping)
- Room Cleanliness Score (target: 95%)
- Guest Satisfaction (target: 90%)
- Task Completion Time (target: 90%)
- Supply Management (target: 85%)

### Grounds Department (Groundsman, Farmhand, Games & Grounds)
- Grounds Maintenance Quality (target: 90%)
- Landscaping Standards (target: 85%)
- Safety Compliance (target: 100%)
- Equipment Maintenance (target: 90%)

### Security (Watchman)
- Incident Response Time (target: 95%)
- Patrol Completion Rate (target: 100%)
- Safety Incident Reduction (target: 90%)
- Report Accuracy (target: 95%)

### Management (Manager)
- Team Productivity (target: 85%)
- Cost Control (target: 90%)
- Overall Guest Satisfaction (target: 90%)
- Staff Attendance Rate (target: 95%)

### Marketing/Operations (Photography & Music, Masseuse)
- Event Coverage Quality (target: 90%)
- Client Satisfaction (target: 90%)
- Equipment Maintenance (target: 95%)
- Booking Completion Rate (target: 85%)

## Special Considerations

- **Work Hours**: Standard work day is 8:00 AM to 8:00 PM (12-hour shifts)
  - Waiters and Housekeeping staff occasionally work after-hours when requested by clients

- **Leshan Brothers**: Alex Leshan, Jackson Leshan, Andrew Leparan (Manager)
  - Alex Leshan & Jackson Leshan (Watchmen): 100% night shift attendance, sometimes work extra day shifts (10% of time)
  - Andrew Leparan (Manager): Day shift only, acts as approver for leave requests
  - Watchmen have no off-days

- **Off-day Pattern**: Most employees take one off-day per week (Tuesday/Wednesday/Thursday), but not all on the same day

- **Attendance Timeline**: From individual date_joined (May-July 2025) to yesterday (May 15, 2026)

- **Data Volume**:
  - 16 employees
  - ~300+ attendance records
  - ~50-80 leave requests
  - ~50-80 payslips
  - ~30-40 KPI records
