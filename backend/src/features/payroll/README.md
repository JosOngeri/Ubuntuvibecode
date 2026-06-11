# Payroll Feature

## Overview
The Payroll feature manages employee payroll processing, including pay rate configuration, attendance-based calculations, payslip generation, and payment tracking. It integrates with attendance data to calculate hours worked and compute gross/net pay.

## Architecture

### Backend Structure
```
src/features/payroll/
├── controllers/
│   └── payroll.controller.js      # HTTP request handlers
├── services/
│   └── payroll.service.js         # Business logic and calculations
├── repositories/
│   └── payroll.repository.js      # Data access
└── validators/
    └── (validation schemas)
```

### Frontend Structure
```
src/features/payroll/
├── pages/                         # UI components
├── services/
│   └── payrollApi.js             # API client
├── hooks/
│   └── usePayroll.js              # React hook for state
└── components/                    # Reusable UI components
```

## Key Workflows

### Payroll Calculation Workflow
1. **Get Pay Rate**: Retrieve employee's hourly rate from pay_rates table
2. **Calculate Hours**: Sum total hours worked from attendance records
3. **Compute Gross Pay**: hours_worked × hourly_rate
4. **Calculate Deductions**: Apply tax/deduction rules (currently 10%)
5. **Compute Net Pay**: gross_pay - deductions
6. **Generate Payslip**: Create payslip record with all calculations

### Payslip Management Workflow
1. **Generate Payslip**: `POST /api/payroll/payslip` - Create new payslip
2. **Approve Payslip**: `POST /api/payroll/payslip/:id/approve` - Mark as approved
3. **Update Payslip**: `PUT /api/payroll/payslip/:id` - Modify details
4. **Delete Payslip**: `DELETE /api/payroll/payslip/:id` - Remove payslip
5. **Query Payslips**: `GET /api/payroll/payslips/:employeeId` - List payslips

## Database Tables

### pay_rates
- `id` (PK)
- `employee_id` (FK → employees.id)
- `hourly_rate` (DECIMAL)
- `effective_date` (DATE)
- `created_at`, `updated_at`

### payslips
- `id` (PK)
- `employee_id` (FK → employees.id)
- `period` (YYYY-MM format)
- `gross_pay` (DECIMAL)
- `deductions` (DECIMAL)
- `net_pay` (DECIMAL)
- `hours_worked` (DECIMAL)
- `hourly_rate` (DECIMAL)
- `status` (pending/approved/paid)
- `created_at`, `updated_at`

## API Endpoints

### Payroll
- `GET /api/payroll/calculate/:employeeId` - Calculate payroll for period
- `POST /api/payroll/payslip` - Generate payslip
- `GET /api/payroll/payslips/:employeeId` - Get employee payslips
- `GET /api/payroll/payslip/:id` - Get payslip details
- `PUT /api/payroll/payslip/:id` - Update payslip
- `POST /api/payroll/payslip/:id/approve` - Approve payslip
- `DELETE /api/payroll/payslip/:id` - Delete payslip

## Frontend Hooks

### usePayroll
```javascript
const { 
  payslips, 
  loading, 
  error, 
  calculatePayroll,
  generatePayslip,
  getPayslips,
  getPayslip,
  updatePayslip,
  approvePayslip,
  deletePayslip 
} = usePayroll();
```

## Business Rules

1. **Period Format**: Period must be in YYYY-MM format (e.g., 2024-06)
2. **Pay Rate Required**: Employee must have a pay rate before payroll calculation
3. **Attendance Integration**: Hours worked are fetched from attendance table
4. **Deduction Calculation**: Currently simplified to 10% tax (can be extended)
5. **Status Flow**: pending → approved → paid
6. **Date Range**: Period automatically calculates start/end dates (1st to last day of month)

## Calculation Formula

```
gross_pay = hours_worked × hourly_rate
deductions = gross_pay × 0.10 (10% tax)
net_pay = gross_pay - deductions
```

## Testing

### Unit Tests
- Test period parsing logic
- Test payroll calculation formulas
- Test deduction calculations

### Integration Tests
- Test payslip generation
- Test approval workflow
- Test period-based queries

## Dependencies

### Backend
- `config/db` - Database connection
- `Employee.model.js` - Employee data model
- `utils/logger.js` - Logging utility

### Frontend
- `services/api.js` - Shared API client
- `contexts/AuthContext` - User authentication

## Notes for Junior Developers

- **Period parsing**: Always validate YYYY-MM format before processing
- **Pay rate lookup**: Handle missing pay rates gracefully
- **Attendance dependency**: Payroll requires attendance data to exist
- **Decimal precision**: Use DECIMAL type for monetary values
- **Status management**: Only approved payslips should be processed for payment
- **Backdating**: Period calculations use UTC dates to avoid timezone issues
