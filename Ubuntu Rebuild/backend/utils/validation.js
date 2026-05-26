const validateEmployeePayload = (data) => {
  const errors = [];
  const normalized = { ...data };

  if (!normalized.surname?.trim()) errors.push('Surname is required');
  if (!normalized.first_name?.trim()) errors.push('First name is required');
  if (!normalized.phone?.trim()) errors.push('Phone is required');
  if (!normalized.department?.trim()) errors.push('Department is required');
  if (!normalized.employment_type) errors.push('Employment type is required');
  if (normalized.wage_rate === undefined || normalized.wage_rate === null) errors.push('Wage rate is required');
  if (isNaN(Number(normalized.wage_rate)) || Number(normalized.wage_rate) < 0) errors.push('Wage rate must be a non-negative number');
  if (!normalized.mpesa_phone_number?.trim()) errors.push('M-Pesa phone number is required');

  normalized.surname = normalized.surname?.trim();
  normalized.first_name = normalized.first_name?.trim();
  normalized.phone = normalized.phone?.trim();
  normalized.department = normalized.department?.trim();
  normalized.wage_rate = Number(normalized.wage_rate);

  return { normalized, errors };
};

const validateAttendancePayload = (data) => {
  const errors = [];
  const normalized = { ...data };

  if (!normalized.employee_id) errors.push('Employee ID is required');
  if (!normalized.punch_state) errors.push('Punch state is required');
  const validStates = ['checkIn', 'breakOut', 'breakIn', 'checkOut'];
  if (normalized.punch_state && !validStates.includes(normalized.punch_state)) {
    errors.push(`Punch state must be one of: ${validStates.join(', ')}`);
  }

  return { normalized, errors };
};

const validateLeavePayload = (data) => {
  const errors = [];
  const normalized = { ...data };

  if (!normalized.leave_type?.trim()) errors.push('Leave type is required');
  if (!normalized.start_date) errors.push('Start date is required');
  if (!normalized.end_date) errors.push('End date is required');
  if (normalized.start_date && normalized.end_date && new Date(normalized.start_date) > new Date(normalized.end_date)) {
    errors.push('Start date cannot be after end date');
  }

  return { normalized, errors };
};

module.exports = { validateEmployeePayload, validateAttendancePayload, validateLeavePayload };
