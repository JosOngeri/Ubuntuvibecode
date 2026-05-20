# HRMS Workflow Automation Implementation Plan

This plan implements comprehensive workflow automation for the Ubuntu HRMS system, including SMS integration, notification system with action links, leave escalation, daily labour wage urgency, KPI reminders, recruitment candidate ranking, dynamic shift settings, payroll auto-retry, contract expiry alerts, and complaint escalation.

## 1. SMS Integration (Blessed Text API)

### Backend Changes
- **Create `backend/utils/sms.js`**
  - Implement sendSMS function using Blessed Text API
  - Support single and multiple recipients
  - Handle API key from environment variables (`BLESSED_TEXT_API_KEY`, `BLESSED_TEXT_SENDER_ID`)
  - Implement error handling and retry logic
  - Add getBalance function to check SMS credits

- **Update `.env`**
  - Add `BLESSED_TEXT_API_KEY`
  - Add `BLESSED_TEXT_SENDER_ID` (default: 23107)

### API Integration Details
- Base URL: `https://sms.blessedtexts.com/api/sms/v1`
- Endpoint: `/sendsms`
- Parameters: api_key, sender_id, message, phone (comma-separated)
- Response handling for status codes (1000=Success, 1009=Low credits)

---

## 2. Notification System with Action Links

### Backend Changes
- **Create `backend/utils/notification.js`**
  - Unified notification function supporting email, SMS, and in-app
  - Template system for different notification types
  - Action link generation (e.g., `/leave/approve/{id}`, `/payroll/approve/{id}`)
  - Notification queue for batch processing
  - Priority levels: urgent (immediate), normal (batched)

- **Create `backend/models/Notification.model.js`**
  - Store notifications in database
  - Fields: user_id, type, title, message, action_link, status (sent, failed), sent_at, channel (email, sms, in_app)

- **Create `backend/controllers/notification.controller.js`**
  - Send individual notification
  - Send batch notifications
  - Mark notifications as read
  - Get user notifications

- **Create `backend/routes/notification.routes.js`**
  - POST `/api/notifications/send` - Send notification
  - POST `/api/notifications/batch` - Batch send
  - GET `/api/notifications/:userId` - Get user notifications
  - PUT `/api/notifications/:id/read` - Mark as read

### Scheduled Jobs
- **Morning Batch (8:00 AM)**: Send non-urgent admin notifications
- **Evening Batch (6:00 PM)**: Send daily digest notifications
- **Immediate**: Urgent notifications (leave requests, payment failures)

---

## 3. Leave Escalation and Reminders

### Backend Changes
- **Update `backend/controllers/leave.controller.js`**
  - Add escalation logic for pending leave requests
  - Tag leave requests as "urgent" in status
  - Trigger SMS reminders 1 day before leave start
  - Escalate to higher-level approver if not approved within timeframe

- **Create scheduled job `backend/jobs/leaveEscalation.js`**
  - Run daily at 9:00 AM
  - Find pending leave requests starting tomorrow
  - Send SMS reminders to approvers with action link
  - Find pending requests > 3 days old, escalate to admin
  - Find pending requests > 7 days old, escalate to super-admin

### Notification Templates
- **Leave Request Submitted**: SMS to approver with approve/reject links
- **Leave Reminder (1 day before)**: SMS to approver: "Urgent: {employee} leave starts tomorrow. Approve: {link}"
- **Leave Escalated**: SMS to higher-level approver with action link

---

## 4. Daily Labour Wage Urgency and Batch Approval

### Backend Changes
- **Update `backend/controllers/dailyLabourer.controller.js`**
  - Add "reasonable payment time" field (configurable per department)
  - Track when wages become "urgent" (time elapsed > reasonable time)
  - Add batch approval endpoint for multiple wage records

- **Create scheduled job `backend/jobs/wageUrgency.js`**
  - Run every 30 minutes
  - Check daily labour wages not yet paid
  - If time elapsed > reasonable payment time, mark as urgent
  - Send SMS reminders to manager and admin with action links
  - Escalate if urgent for > 2 hours

- **Create `backend/routes/dailyLabourer.routes.js`**
  - POST `/api/daily-labour/batch-approve` - Batch approve wages
  - GET `/api/daily-labour/urgent` - Get urgent wage payments

### Frontend Changes
- **Update `frontend/src/pages/dailyLabour/index.jsx`**
  - Add "Urgent" badge for overdue wages
  - Add batch approval modal
  - Show time elapsed since wage calculation
  - Add "Approve All Urgent" button

---

## 5. KPI Auto-Reminders and Escalation

### Backend Changes
- **Update `backend/controllers/kpi.controller.js`**
  - Add "due_date" field to employee_kpis (period end + reasonable timeframe)
  - Track overdue KPI evaluations

- **Create scheduled job `backend/jobs/kpiEscalation.js`**
  - Run daily at 8:00 AM
  - Find KPIs due within 3 days: send reminder to evaluator
  - Find overdue KPIs (due date passed): escalate to evaluator's manager
  - Find KPIs overdue > 7 days: escalate to admin

### Notification Templates
- **KPI Due Soon**: SMS to evaluator with action link
- **KPI Overdue**: SMS to evaluator's manager with action link

---

## 6. Recruitment Candidate Ranking with Criteria Breakdown

### Backend Changes
- **Update `backend/controllers/job.controller.js`**
  - Add ranking algorithm to `getApplications` endpoint
  - Calculate match score for each application based on job criteria
  - Return ranking breakdown (skills %, experience %, education %, location %)
  - Score = average of matched criteria (each at 100% if fully matched)

- **Update `backend/models/JobApplication.model.js`**
  - Add `match_score` field (0-100)
  - Add `ranking_breakdown` JSON field (skills, experience, education, location scores)

- **Create ranking logic**:
  - Skills: Count matching skills / required skills × 100
  - Experience: Years of experience / required years × 100 (capped at 100)
  - Education: Match education level / required level × 100
  - Location: Distance within threshold × 100, else 0
  - Final score = average of all criteria

### Frontend Changes
- **Update `frontend/src/pages/recruitment/ApplicantReview.jsx`**
  - Display match score prominently
  - Show ranking breakdown with progress bars
  - Sort applications by match score by default
  - Add "Reverse Rating" button for manager
  - Add "Reallocate Rating" modal to manually adjust scores

- **Add explainer modal** on approvers page:
  - "How Candidate Ranking Works"
  - Explain each criterion and how it contributes to score
  - Show example breakdown

---

## 7. Dynamic Shift Settings in Settings Page

### Backend Changes
- **Update `backend/controllers/settings.controller.js`**
  - Add shift configuration endpoints
  - Store shift times per employment type and department
  - Support multiple shift definitions

- **Update database schema** (in `backend/config/db.js`):
  - Add `shift_settings` table:
    - id, employment_type, department, shift_name, start_time, end_time, is_default

- **Create `backend/routes/settings.routes.js`**
  - GET `/api/settings/shifts` - Get all shift settings
  - POST `/api/settings/shifts` - Create shift setting
  - PUT `/api/settings/shifts/:id` - Update shift setting
  - DELETE `/api/settings/shifts/:id` - Delete shift setting

### Frontend Changes
- **Update `frontend/src/pages/admin/Settings.jsx`**
  - Add "Shift Settings" section
  - Table showing current shift configurations
  - Add/Edit/Delete shift settings modal
  - Fields: Employment Type, Department, Shift Name, Start Time, End Time
  - Default shifts for daily labourers: Morning (8:00-13:00), Afternoon (14:00-18:00)

### Attendance Integration
- **Update `backend/controllers/attendance.controller.js`**
  - When recording attendance, auto-detect shift based on employee's employment type, department, and current time
  - Use dynamic shift settings from database

---

## 8. Payroll Auto-Retry and Payment Urgency

### Backend Changes
- **Update `backend/controllers/payroll.controller.js`**
  - Add "urgency_level" to payslips (normal, urgent, critical)
  - Track retry count for failed payments
  - Auto-retry failed payments with exponential backoff (1 min, 5 min, 30 min, 2 hours)

- **Create scheduled job `backend/jobs/payrollRetry.js`**
  - Run every 5 minutes
  - Find payslips with status "Failed"
  - Retry M-Pesa disbursement
  - Update retry count
  - After 3 failed retries, mark as "Critical" and notify admin

- **Add urgency logic**:
  - Payslips pending > 30 minutes: mark as "urgent"
  - Payslips pending > 2 hours: mark as "critical"
  - Send SMS reminders to admin with action links

### Notification Templates
- **Payment Failed**: SMS to admin with retry link
- **Payment Urgent**: SMS to admin: "Urgent: {count} payments pending. Approve: {link}"
- **Payment Critical**: SMS to super-admin with escalate link

---

## 9. Contract Expiry Alerts

### Backend Changes
- **Create scheduled job `backend/jobs/contractExpiry.js`**
  - Run daily at 7:00 AM
  - Find contracts expiring in 30 days: send reminder to manager
  - Find contracts expiring in 7 days: send urgent reminder to manager and admin
  - Find expired contracts: send alert to admin

### Notification Templates
- **Contract Expiring Soon**: SMS to manager with employee details and renewal link
- **Contract Expiring Very Soon**: SMS to manager and admin with action link
- **Contract Expired**: SMS to admin with termination action link

---

## 10. Complaint Escalation

### Backend Changes
- **Update `backend/controllers/complaint.controller.js`**
  - Add escalation logic based on status and age
  - Track escalation level (1=manager, 2=admin, 3=super-admin)

- **Create scheduled job `backend/jobs/complaintEscalation.js`**
  - Run daily at 10:00 AM
  - Find "Open" complaints > 3 days: escalate to admin
  - Find "In Progress" complaints > 7 days: escalate to super-admin
  - Find "Resolved" complaints not closed > 14 days: send reminder to close

### Notification Templates
- **Complaint Escalated**: SMS to higher-level approver with action link
- **Complaint Closure Reminder**: SMS to resolver with close link

---

## 11. Scheduled Jobs Infrastructure

### Backend Changes
- **Create `backend/jobs/index.js`**
  - Initialize all scheduled jobs using node-cron
  - Configure job schedules
  - Handle job errors and logging

- **Update `backend/server.js`**
  - Import and start scheduled jobs on server startup

- **Add to `package.json`**:
  - Install `node-cron` for scheduling

---

## 12. Database Schema Updates

### Add to `backend/config/db.js`:
- `notifications` table: id, user_id, type, title, message, action_link, status, channel, sent_at, created_at
- `shift_settings` table: id, employment_type, department, shift_name, start_time, end_time, is_default, created_at, updated_at
- Add columns to existing tables as needed (urgency_level, retry_count, due_date, etc.)

---

## 13. Frontend Notification Center

### Create `frontend/src/components/NotificationCenter.jsx`
- Display unread notifications
- Show notification type (urgent, normal)
- Action buttons for approve/reject/escalate
- Mark as read functionality
- Filter by type

### Add to navigation
- Notification bell icon with unread count
- Dropdown showing recent notifications

---

## 14. Update User Manual

### Update `USER_GUIDE.md`:
- Add "Automation Features" section
- Document automated notifications (SMS, email, in-app)
- Document escalation timeframes
- Document recruitment ranking system with explainer
- Document dynamic shift settings
- Document batch approval features
- Document urgency levels and reminders

---

## Implementation Order

1. SMS integration (foundation for all notifications)
2. Notification system with action links
3. Leave escalation and reminders
4. Daily labour wage urgency and batch approval
5. KPI auto-reminders and escalation
6. Recruitment candidate ranking
7. Dynamic shift settings
8. Payroll auto-retry and urgency
9. Contract expiry alerts
10. Complaint escalation
11. Scheduled jobs infrastructure
12. Frontend notification center
13. Update user manual

---

## Environment Variables Required

```
BLESSED_TEXT_API_KEY=your_api_key
BLESSED_TEXT_SENDER_ID=23107
```

---

## Testing Checklist

- SMS sending and receiving
- Notification delivery (email, SMS, in-app)
- Leave escalation timing
- Daily labour urgency marking
- KPI reminder triggers
- Recruitment ranking accuracy
- Shift detection based on settings
- Payroll retry logic
- Contract expiry alerts
- Complaint escalation
- Batch approval workflows
