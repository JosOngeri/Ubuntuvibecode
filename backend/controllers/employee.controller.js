const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const Attendance = require('../models/Attendance.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { query } = require('../config/db');
const {
  isValidObjectId,
  validateEmployeePayload,
} = require('../utils/validation');
const logger = require('../utils/logger');

const getCurrentYear = () => new Date().getFullYear();

const buildUniqueUsername = async ({ firstName, lastName }) => {
  const base = `${firstName || ''}.${lastName || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '') || 'employee';

  let suffix = 0;
  while (suffix < 5000) {
    const candidate = suffix === 0 ? base : `${base}${suffix}`;
    const existing = await User.findOne({ username: candidate });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
  }

  throw new Error('Unable to generate a unique username');
};

const generateTemporaryPassword = () => {
  const raw = crypto
    .randomBytes(12)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12);
  return `${raw}Aa1!`;
};

const handleDbError = (res, err, tag = 'employee') => {
  if (err?.code === '23505') {
    logger.warn(tag, 'Duplicate key constraint', { code: err.code, detail: err.detail });
    if ((err?.detail || '').toLowerCase().includes('(email)')) {
      return res.status(400).json({ msg: 'A user account already exists with this email' });
    }
    return res.status(400).json({ msg: 'Employee already exists with the same unique field' });
  }
  logger.error(tag, 'DB error', err);
  return res.status(500).send('Server error');
};

// Get all employees
const getEmployees = async (req, res) => {
  logger.info('employee.getAll', 'Entry', { userId: req.user?.id, role: req.user?.role });
  try {
    const employees = await Employee.find();
    logger.info('employee.getAll', `Returning ${employees.length} employees`);
    res.json(employees);
  } catch (err) {
    logger.error('employee.getAll', 'Unhandled error', err);
    res.status(500).send('Server error');
  }
};

const getMyEmployee = async (req, res) => {
  const userId = req.user?.id;
  logger.info('employee.getMe', 'Entry', { userId });
  try {
    if (!userId) {
      logger.warn('employee.getMe', 'No userId in token');
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      logger.warn('employee.getMe', 'Employee not found for user', { userId });
      return res.status(404).json({ msg: 'Employee profile not found for current user' });
    }

    logger.info('employee.getMe', 'Found', { userId, employeeId: employee.id });
    return res.json(employee.toJSON());
  } catch (err) {
    logger.error('employee.getMe', 'Unhandled error', err, { userId });
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  logger.info('employee.getById', 'Entry', { id, userId: req.user?.id });
  try {
    if (!isValidObjectId(id)) {
      logger.warn('employee.getById', 'Invalid id', { id });
      return res.status(400).json({ msg: 'Invalid employee id' });
    }

    if (req.user?.role === 'employee' && String(req.user?.id) !== String(id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      logger.warn('employee.getById', 'Not found', { id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Hide biometricDeviceId unless user is the employee or admin/manager/supervisor
    let result = employee.toJSON();
    if (
      req.user?.role === 'employee' && String(req.user?.id) !== String(employee.userId)
    ) {
      delete result.biometricDeviceId;
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

// Add employee
const addEmployee = async (req, res) => {
  logger.info('employee.add', 'Entry', { userId: req.user?.id, body: req.body });
  try {
    const { normalized, errors } = validateEmployeePayload(req.body);

    if (errors.length > 0) {
      logger.warn('employee.add', 'Validation failed', { errors });
      return res.status(400).json({ msg: 'Validation failed', errors });
    }

    if (!normalized.email) {
      return res.status(400).json({ msg: 'email is required for automatic account provisioning' });
    }

    const username = await buildUniqueUsername({
      firstName: normalized.firstName,
      lastName: normalized.lastName,
    });
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, await bcrypt.genSalt(10));

    const user = new User({
      username,
      email: normalized.email,
      password: passwordHash,
      role: 'employee',
      status: 'active',
      mustChangePassword: true,
    });
    await user.save();

    let newEmployee;
    try {
      newEmployee = new Employee({ ...normalized, userId: user.id });
      await newEmployee.save();

      // Auto-allocate annual leave balance for new employee
      try {
        const year = getCurrentYear();
        const employeeId = newEmployee.id;
        await query(
          `INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (employee_id, year) DO UPDATE SET 
             annual = EXCLUDED.annual,
             sick = EXCLUDED.sick,
             maternity_paternity = EXCLUDED.maternity_paternity,
             updated_at = NOW()
           RETURNING *`,
          [employeeId, year, 30, 15, 30]
        );
      } catch (leaveError) {
        logger.warn('employee.add', 'Failed to auto-allocate leave balance', { error: leaveError.message });
        // Don't fail employee creation if leave balance allocation fails
      }
    } catch (error) {
      await user.delete();
      throw error;
    }

    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5177'}/login`;
    const emailResult = await sendEmail({
      to: normalized.email,
      subject: 'Welcome to Ubuntu HRMS - Your Login Credentials',
      text: `Hello ${normalized.firstName},\n\nYour Ubuntu HRMS account has been created.\n\nUsername: ${username}\nTemporary Password: ${temporaryPassword}\nLogin: ${loginLink}\n\nPlease sign in and change your password immediately.`,
      html: `<p>Hello ${normalized.firstName},</p><p>Your Ubuntu HRMS account has been created.</p><p><strong>Username:</strong> ${username}<br/><strong>Temporary Password:</strong> ${temporaryPassword}<br/><strong>Login:</strong> <a href="${loginLink}">${loginLink}</a></p><p>Please sign in and change your password immediately.</p>`,
    });

    const response = {
      employee: newEmployee,
      account: {
        username,
        email: normalized.email,
      },
      emailNotification: emailResult.sent ? 'sent' : 'not-sent',
    };

    if (!emailResult.sent) {
      response.temporaryPassword = temporaryPassword;
      response.emailError = emailResult.reason;
    }

    logger.info('employee.add', 'Created', { employeeId: newEmployee.id, username });
    return res.status(201).json(response);
  } catch (err) {
    return handleDbError(res, err, 'employee.add');
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  logger.info('employee.update', 'Entry', { id: req.params.id, userId: req.user?.id });
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('employee.update', 'Invalid id', { id: req.params.id });
      return res.status(400).json({ msg: 'Invalid employee id' });
    }

    const { normalized, errors } = validateEmployeePayload(req.body, { partial: true });
    if (errors.length > 0) {
      logger.warn('employee.update', 'Validation failed', { errors });
      return res.status(400).json({ msg: 'Validation failed', errors });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      logger.warn('employee.update', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const updates = Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined)
    );

    employee.set(updates);
    await employee.save();
    logger.info('employee.update', 'Updated', { id: req.params.id });
    return res.json(employee);
  } catch (err) {
    return handleDbError(res, err, 'employee.update');
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  logger.info('employee.delete', 'Entry', { id: req.params.id, userId: req.user?.id });
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('employee.delete', 'Invalid id', { id: req.params.id });
      return res.status(400).json({ msg: 'Invalid employee id' });
    }

    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      logger.warn('employee.delete', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    await Attendance.deleteMany({ employeeId: req.params.id });
    logger.info('employee.delete', 'Deleted', { id: req.params.id });
    return res.json({ msg: 'Employee deleted' });
  } catch (err) {
    logger.error('employee.delete', 'Unhandled error', err, { id: req.params.id });
    return res.status(500).send('Server error');
  }
};

module.exports = { getEmployees, getMyEmployee, getEmployeeById, addEmployee, updateEmployee, deleteEmployee };