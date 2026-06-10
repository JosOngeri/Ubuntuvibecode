# Attendance Feature

## Overview
The Attendance feature manages employee attendance tracking, including check-in/check-out, biometric integration, and attendance reporting. It supports multiple shifts and provides comprehensive attendance summaries.

## Architecture

### Backend Structure
```
src/features/attendance/
├── controllers/
│   └── attendance.controller.js   # HTTP request handlers
├── services/
│   └── attendance.service.js      # Business logic
├── repositories/
│   └── attendance.repository.js   # Data access
└── validators/
    └── (validation schemas)
```

### Frontend Structure
```
src/features/attendance/
├── pages/                         # UI components
├── services/
│   └── attendanceApi.js           # API client
├── hooks/
│   └── useAttendance.js           # React hook for state
└── components/                    # Reusable UI components
```

## Key Workflows

### Attendance Recording Workflow
1. **Biometric Punch**: `POST /api/attendance/biometric` - Process biometric device punch
2. **Manual Entry**: (Optional) Manual attendance entry for exceptions
3. **Shift Assignment**: Assign shift to attendance record
4. **Punch States**: check_in, check_out, break_out, break_in

### Attendance Reporting Workflow
1. **Get Employee Attendance**: `GET /api/attendance/employee/:id` - Get attendance by employee
2. **Date Range Query**: `GET /api/attendance/range` - Get attendance for date range
3. **Attendance Summary**: `GET /api/attendance/employee/:id/summary` - Get summary stats
4. **Update Record**: `PUT /api/attendance/:id` - Correct attendance data

## Database Tables

### attendance
- `id` (PK)
- `employee_id` (FK → employees.id)
- `attendance_date` (DATE)
- `shift` (Morning/Afternoon/Night)
- `status` (Present/Absent/Leave/Holiday)
- `check_in`, `check_out` (TIMESTAMP)
- `break_out`, `break_in` (TIMESTAMP)
- `total_hours_worked` (DECIMAL)
- `punch_state` (check_in/check_out/break_out/break_in)

## API Endpoints

### Attendance
- `POST /api/attendance/biometric` - Process biometric punch
- `GET /api/attendance/employee/:id` - Get employee attendance
- `GET /api/attendance/range` - Get attendance by date range
- `GET /api/attendance/employee/:id/summary` - Get attendance summary
- `PUT /api/attendance/:id` - Update attendance record
- `DELETE /api/attendance/:id` - Delete attendance record

## Frontend Hooks

### useAttendance
```javascript
const { 
  attendance, 
  loading, 
  error, 
  processBiometricPunch,
  getAttendanceByEmployee,
  getAttendanceByDateRange,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance 
} = useAttendance();
```

## Business Rules

1. **Biometric Device ID**: Each employee has unique biometric device ID
2. **Punch State Validation**: Valid states: check_in, check_out, break_out, break_in
3. **Shift Assignment**: Default shift is 'Morning' if not specified
4. **Auto-Creation**: Attendance record created on first punch if not exists
5. **Total Hours Calculation**: Automatically calculated from check-in/out times

## Testing

### Unit Tests
- Test biometric punch processing
- Test attendance calculation logic
- Test shift assignment rules

### Integration Tests
- Test biometric API endpoint
- Test attendance queries
- Test summary calculations

## Dependencies

### Backend
- `Attendance.model.js` - Attendance data model
- `Employee.model.js` - Employee data model
- `utils/validation.js` - Validation utilities
- `utils/logger.js` - Logging utility

### Frontend
- `services/api.js` - Shared API client
- `contexts/AuthContext` - User authentication

## Notes for Junior Developers

- **Biometric integration**: Punch data comes from physical devices
- **Shift handling**: Shifts can be assigned during or after punch
- **Auto-calculation**: Total hours are computed, not manually entered
- **Date handling**: Attendance dates are stored as DATE, not TIMESTAMP
- **State machine**: Punch states follow a logical sequence
