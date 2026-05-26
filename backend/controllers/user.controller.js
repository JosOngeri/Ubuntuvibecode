const User = require('../models/User.model');
const Employee = require('../models/Employee.model');
const { query } = require('../config/db');
const logger = require('../utils/logger');

// List all users with status and role
const getUsers = async (req, res) => {
  logger.info('user.getAll', 'Entry', { by: req.user?.id, filter: req.query });
  try {
    const { status, role } = req.query;
    let users = await User.findAll();
    if (status) users = users.filter(u => u.status === status);
    if (role) users = users.filter(u => u.role === role);
    logger.info('user.getAll', `Returning ${users.length} users`);
    res.json(users);
  } catch (err) {
    logger.error('user.getAll', 'Unhandled error', err);
    res.status(500).send('Server error');
  }
};

// Get a single user by id
const getUserById = async (req, res) => {
  logger.info('user.getById', 'Entry', { id: req.params.id });
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      logger.warn('user.getById', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    logger.error('user.getById', 'Unhandled error', err, { id: req.params.id });
    res.status(500).send('Server error');
  }
};

// Approve a user (set status to active, fill in details if employee)
const approveUser = async (req, res) => {
  logger.info('user.approve', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      logger.warn('user.approve', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'User not found' });
    }
    user.status = 'active';
    await user.save();
    if (user.role === 'employee') {
      let employee = await Employee.findOne({ userId: user.id });
      if (employee) {
        employee.status = 'active';
        Object.assign(employee, req.body);
        await employee.save();
      }
    }
    logger.info('user.approve', 'Approved', { id: req.params.id });
    res.json({ msg: 'User approved', user });
  } catch (err) {
    logger.error('user.approve', 'Unhandled error', err, { id: req.params.id });
    res.status(500).send('Server error');
  }
};

// Update user details
const updateUser = async (req, res) => {
  logger.info('user.update', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      logger.warn('user.update', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'User not found' });
    }
    Object.assign(user, req.body);
    await user.save();
    logger.info('user.update', 'Updated', { id: req.params.id });
    res.json(user);
  } catch (err) {
    logger.error('user.update', 'Unhandled error', err, { id: req.params.id });
    res.status(500).send('Server error');
  }
};

// Delete user (deactivates login access, keeps all data)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Deactivate user instead of deleting - this prevents login but keeps all employee data
    user.status = 'inactive';
    await user.save();

    res.json({ msg: 'User deactivated. Login access removed but all data preserved.' });
  } catch (err) {
    logger.error('user.delete', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Assign role/permissions
const assignRole = async (req, res) => {
  logger.info('user.assignRole', 'Entry', { id: req.params.id, newRole: req.body.role, by: req.user?.id });
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      logger.warn('user.assignRole', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'User not found' });
    }
    user.role = req.body.role;
    await user.save();
    logger.info('user.assignRole', 'Role updated', { id: req.params.id, role: req.body.role });
    res.json({ msg: 'Role updated', user });
  } catch (err) {
    logger.error('user.assignRole', 'Unhandled error', err, { id: req.params.id });
    res.status(500).send('Server error');
  }
};

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id || req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user.preferences || { darkMode: false, notifications: true, language: 'en' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id || req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.preferences = { ...(user.preferences || {}), ...req.body };
    await user.save();
    res.json({ msg: 'Preferences updated', preferences: user.preferences });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

module.exports = {
  getUsers,
  getUserById,
  approveUser,
  updateUser,
  deleteUser,
  assignRole,
  getPreferences,
  updatePreferences,
};
