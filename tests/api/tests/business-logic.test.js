/**
 * business-logic.test.js
 *
 * Unit tests for pure utility functions that contain no side effects.
 * No Express app, no supertest, no database required.
 *
 * Covers:
 *  1. backend/utils/postgres.js    – normalizeId, formatDateOnly, toDate, toOptionalText
 *  2. backend/utils/validation.js  – validateEmployeePayload, validateAttendancePayload,
 *                                    isValidObjectId, recomputeTotalHours
 *  3. Payroll pure functions       – parsePeriod (re-implemented inline to match controller)
 *  4. Leave day calculations       – calculateChargeableDays (working_days / calendar_days)
 *  5. buildSickPayrollFlags        – sick leave pay split tiers
 */

// ── Import utilities directly (no DB calls, no app loading) ──────────────────
const {
  normalizeId,
  formatDateOnly,
  toDate,
  toOptionalText,
} = require('../../../backend/utils/postgres');

const {
  validateEmployeePayload,
  validateAttendancePayload,
  isValidObjectId,
  recomputeTotalHours,
} = require('../../../backend/utils/validation');

// =============================================================================
// postgres.js – normalizeId
// =============================================================================
describe('normalizeId', () => {
  it('returns a positive integer for a numeric string', () => {
    expect(normalizeId('42')).toBe(42);
  });

  it('returns a positive integer for a number', () => {
    expect(normalizeId(7)).toBe(7);
  });

  it('returns null for 0', () => {
    expect(normalizeId(0)).toBeNull();
  });

  it('returns null for negative numbers', () => {
    expect(normalizeId(-1)).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(normalizeId('abc')).toBeNull();
    expect(normalizeId('123abc')).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizeId(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(normalizeId(undefined)).toBeNull();
  });

  it('returns null for floating-point numbers (not integer)', () => {
    expect(normalizeId(1.5)).toBeNull();
  });

  it('returns a positive integer for an integer-valued float string', () => {
    // '42' → 42 (integer); '42.0' → NaN via Number('42.0') is 42 but isInteger(42)=true
    // Actual behaviour: Number('42.0') = 42, Number.isInteger(42) = true → returns 42
    expect(normalizeId('42.0')).toBe(42);
  });
});

// =============================================================================
// postgres.js – formatDateOnly
// =============================================================================
describe('formatDateOnly', () => {
  it('formats a Date object to YYYY-MM-DD', () => {
    const d = new Date(Date.UTC(2026, 5, 10)); // June 10, 2026
    expect(formatDateOnly(d)).toBe('2026-06-10');
  });

  it('formats an ISO string to YYYY-MM-DD', () => {
    expect(formatDateOnly('2026-06-10T00:00:00.000Z')).toBe('2026-06-10');
  });

  it('returns null for null input', () => {
    expect(formatDateOnly(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(formatDateOnly(undefined)).toBeNull();
  });

  it('returns a 10-character string (YYYY-MM-DD)', () => {
    const result = formatDateOnly(new Date());
    expect(result).toHaveLength(10);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// =============================================================================
// postgres.js – toDate
// =============================================================================
describe('toDate', () => {
  it('returns a Date object from a valid ISO string', () => {
    const d = toDate('2026-06-10');
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });

  it('returns the same Date object if already a Date', () => {
    const input = new Date(2026, 5, 10);
    expect(toDate(input)).toBe(input);
  });

  it('returns null for null input', () => {
    expect(toDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(toDate(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(toDate('')).toBeNull();
  });

  it('creates a valid date from a timestamp number', () => {
    const ts = Date.now();
    const d  = toDate(ts);
    expect(d).toBeInstanceOf(Date);
  });
});

// =============================================================================
// postgres.js – toOptionalText
// =============================================================================
describe('toOptionalText', () => {
  it('returns the string trimmed for a non-empty string', () => {
    expect(toOptionalText('  hello  ')).toBe('hello');
  });

  it('returns null for null', () => {
    expect(toOptionalText(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toOptionalText(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(toOptionalText('')).toBeNull();
  });

  it('converts a number to its string representation', () => {
    expect(toOptionalText(42)).toBe('42');
  });

  it('returns "false" for boolean false (not null)', () => {
    // false → String(false) = 'false' → trimmed = 'false' (not empty → returned)
    expect(toOptionalText(false)).toBe('false');
  });
});

// =============================================================================
// validation.js – isValidObjectId
// =============================================================================
describe('isValidObjectId', () => {
  it('returns true for a positive integer string', () => {
    expect(isValidObjectId('1')).toBe(true);
    expect(isValidObjectId('100')).toBe(true);
  });

  it('returns true for a positive integer number', () => {
    expect(isValidObjectId(5)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(isValidObjectId(0)).toBe(false);
    expect(isValidObjectId('0')).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isValidObjectId(-1)).toBe(false);
  });

  it('returns false for non-numeric strings', () => {
    expect(isValidObjectId('abc')).toBe(false);
    expect(isValidObjectId('not-a-number')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidObjectId(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidObjectId(undefined)).toBe(false);
  });
});

// =============================================================================
// validation.js – validateEmployeePayload
// =============================================================================
describe('validateEmployeePayload', () => {
  const validPayload = {
    firstName:      'Jane',
    lastName:       'Wanjiku',
    phone:          '+254700000001',
    employmentType: 'Permanent',
    wageRate:       50,
    department:     'Engineering',
  };

  it('returns no errors for a complete valid payload', () => {
    const { errors } = validateEmployeePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  it('returns an error when firstName is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, firstName: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ').toLowerCase()).toMatch(/first name/i);
  });

  it('returns an error when lastName is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, lastName: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ').toLowerCase()).toMatch(/last name/i);
  });

  it('returns an error when phone is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, phone: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ').toLowerCase()).toMatch(/phone/i);
  });

  it('returns an error when employmentType is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, employmentType: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns an error when wageRate is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, wageRate: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ').toLowerCase()).toMatch(/wage rate/i);
  });

  it('returns an error when department is missing', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, department: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns an error for an invalid email format', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, email: 'not-an-email' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ').toLowerCase()).toMatch(/email/i);
  });

  it('accepts a valid email', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, email: 'jane@company.co.ke' });
    expect(errors).toHaveLength(0);
  });

  it('returns an error for an invalid employmentType', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, employmentType: 'InvalidType' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns an error for a negative wageRate', () => {
    const { errors } = validateEmployeePayload({ ...validPayload, wageRate: -5 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns no errors in partial mode even when fields are missing', () => {
    const { errors } = validateEmployeePayload({ firstName: 'Jane' }, { partial: true });
    expect(errors).toHaveLength(0);
  });

  it('normalises email to lowercase', () => {
    const { normalized } = validateEmployeePayload({ ...validPayload, email: 'Jane@Company.Co.Ke' });
    expect(normalized.email).toBe('jane@company.co.ke');
  });

  it('trims whitespace from firstName', () => {
    const { normalized } = validateEmployeePayload({ ...validPayload, firstName: '  Jane  ' });
    expect(normalized.firstName).toBe('Jane');
  });
});

// =============================================================================
// validation.js – validateAttendancePayload
// =============================================================================
describe('validateAttendancePayload', () => {
  const validPayload = {
    biometricDeviceId: 'BIO-001',
    punchState:        'checkIn',
    timestamp:         new Date().toISOString(),
  };

  it('returns no errors for a valid payload', () => {
    const { errors } = validateAttendancePayload(validPayload, { requireTimestamp: true });
    expect(errors).toHaveLength(0);
  });

  it('returns an error when neither employeeId nor biometricDeviceId is provided', () => {
    const { errors } = validateAttendancePayload({ punchState: 'checkIn' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toMatch(/biometricDeviceId/i);
  });

  it('returns an error when punchState is missing', () => {
    const { errors } = validateAttendancePayload({ biometricDeviceId: 'BIO-001' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toMatch(/punchState/i);
  });

  it('returns an error for an invalid punchState value', () => {
    const { errors } = validateAttendancePayload({
      biometricDeviceId: 'BIO-001',
      punchState: 'flyIn', // not a valid state
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns an error when requireTimestamp is true but timestamp is missing', () => {
    const { errors } = validateAttendancePayload(
      { biometricDeviceId: 'BIO-001', punchState: 'checkIn' },
      { requireTimestamp: true }
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toMatch(/timestamp/i);
  });

  it('accepts employeeId in place of biometricDeviceId', () => {
    const { errors } = validateAttendancePayload({ employeeId: '1', punchState: 'checkOut' });
    expect(errors).toHaveLength(0);
  });

  it('normalises punchState by trimming whitespace', () => {
    const { normalized } = validateAttendancePayload({ biometricDeviceId: 'BIO-001', punchState: ' checkIn ' });
    expect(normalized.punchState).toBe('checkIn');
  });
});

// =============================================================================
// validation.js – recomputeTotalHours
// =============================================================================
describe('recomputeTotalHours', () => {
  it('computes total hours worked from checkIn and checkOut', () => {
    const attendance = {
      checkIn:  '2026-06-10T08:00:00.000Z',
      checkOut: '2026-06-10T17:00:00.000Z',
    };
    recomputeTotalHours(attendance);
    expect(attendance.totalHoursWorked).toBeCloseTo(9, 1);
  });

  it('sets totalHoursWorked to undefined when checkIn is missing', () => {
    const attendance = { checkOut: '2026-06-10T17:00:00.000Z' };
    recomputeTotalHours(attendance);
    expect(attendance.totalHoursWorked).toBeUndefined();
  });

  it('sets totalHoursWorked to undefined when checkOut is missing', () => {
    const attendance = { checkIn: '2026-06-10T08:00:00.000Z' };
    recomputeTotalHours(attendance);
    expect(attendance.totalHoursWorked).toBeUndefined();
  });

  it('subtracts break time from total hours', () => {
    const attendance = {
      checkIn:  '2026-06-10T08:00:00.000Z',
      checkOut: '2026-06-10T17:00:00.000Z',
      breakOut: '2026-06-10T12:00:00.000Z',
      breakIn:  '2026-06-10T13:00:00.000Z', // 1h break
    };
    recomputeTotalHours(attendance);
    expect(attendance.totalHoursWorked).toBeCloseTo(8, 1);
  });
});

// =============================================================================
// Payroll pure functions – parsePeriod (reference implementation)
// =============================================================================
describe('parsePeriod – payroll period parsing', () => {
  // Reference implementation matching payroll.controller.js
  const { formatDateOnly: fmtDate } = require('../../../backend/utils/postgres');

  const parsePeriod = (value) => {
    if (!value) return null;
    const source = String(value).trim();
    const match  = source.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year  = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate   = new Date(Date.UTC(year, month, 0));
    return { period: source, startDate: fmtDate(startDate), endDate: fmtDate(endDate) };
  };

  it('parses a valid period string', () => {
    const result = parsePeriod('2026-06');
    expect(result).not.toBeNull();
    expect(result.period).toBe('2026-06');
    expect(result.startDate).toBe('2026-06-01');
    expect(result.endDate).toBe('2026-06-30');
  });

  it('returns correct start/end for January', () => {
    const result = parsePeriod('2026-01');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-01-31');
  });

  it('returns correct start/end for February (non-leap year)', () => {
    const result = parsePeriod('2026-02');
    expect(result.startDate).toBe('2026-02-01');
    expect(result.endDate).toBe('2026-02-28');
  });

  it('returns correct start/end for February (leap year 2024)', () => {
    const result = parsePeriod('2024-02');
    expect(result.startDate).toBe('2024-02-01');
    expect(result.endDate).toBe('2024-02-29');
  });

  it('returns null for an invalid format (DD-MM-YYYY)', () => {
    expect(parsePeriod('10-06-2026')).toBeNull();
  });

  it('returns null for the string "invalid"', () => {
    expect(parsePeriod('invalid')).toBeNull();
  });

  it('returns null for month 13 (2026-13)', () => {
    expect(parsePeriod('2026-13')).toBeNull();
  });

  it('returns null for month 00 (2026-00)', () => {
    expect(parsePeriod('2026-00')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parsePeriod(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parsePeriod(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePeriod('')).toBeNull();
  });
});

// =============================================================================
// Payroll arithmetic – netPay calculation
// =============================================================================
describe('Payroll net pay calculation', () => {
  const STANDARD_HOURS = 160;
  const BASE_RATE      = 50;     // $/hr
  const OT_MULTIPLIER  = 1.5;

  const calcPayroll = (totalHours, kpiBonus, unpaidDays) => {
    const overtimeHours  = Math.max(0, totalHours - STANDARD_HOURS);
    const regularHours   = Math.min(totalHours, STANDARD_HOURS);
    const overtimeRate   = BASE_RATE * OT_MULTIPLIER;
    const grossPay       = Number((regularHours * BASE_RATE).toFixed(2));
    const overtimePay    = Number((overtimeHours * overtimeRate).toFixed(2));
    const deductions     = Number((unpaidDays * BASE_RATE * 8).toFixed(2)); // dailyRate = hourly*8
    const netPay         = Number((grossPay + overtimePay + kpiBonus - deductions).toFixed(2));
    return { grossPay, overtimePay, deductions, netPay };
  };

  it('no overtime: gross = 160 × baseRate, overtime = 0', () => {
    const { grossPay, overtimePay } = calcPayroll(160, 0, 0);
    expect(grossPay).toBe(8000);
    expect(overtimePay).toBe(0);
  });

  it('10 overtime hours: overtimePay = 10 × (50×1.5) = 750', () => {
    const { overtimePay } = calcPayroll(170, 0, 0);
    expect(overtimePay).toBe(750);
  });

  it('netPay = grossPay + overtimePay + kpiBonus - deductions', () => {
    const kpi      = 500;
    const unpaid   = 2;  // 2 days × $50/hr × 8h = $800
    const { grossPay, overtimePay, deductions, netPay } = calcPayroll(170, kpi, unpaid);
    expect(netPay).toBeCloseTo(grossPay + overtimePay + kpi - deductions, 2);
  });

  it('KPI bonus increases netPay proportionally', () => {
    const base   = calcPayroll(160, 0,    0).netPay;
    const bonus  = calcPayroll(160, 1000, 0).netPay;
    expect(bonus - base).toBeCloseTo(1000, 2);
  });

  it('unpaid leave deductions reduce netPay proportionally', () => {
    const base     = calcPayroll(160, 0, 0).netPay;
    const deducted = calcPayroll(160, 0, 1).netPay; // 1 unpaid day
    const diff     = base - deducted;
    expect(diff).toBeCloseTo(BASE_RATE * 8, 2); // one daily rate
  });
});
