const Attendance = require('../models/Attendance.model');
const Employee = require('../models/Employee.model');
const { validateAttendancePayload } = require('../utils/validation');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('attendance.getAll', 'Entry', { query: req.query });
  try {
    const { from, to, department, employeeId, page, limit } = req.query;
    const records = await Attendance.findAll({ from, to, department, employeeId, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('attendance.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getByEmployee = async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const records = await Attendance.findByEmployee(req.params.employeeId, { from, to, limit: parseInt(limit)||31 });
    res.json(records);
  } catch (err) {
    logger.error('attendance.getByEmployee', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getToday = async (req, res) => {
  try {
    const emp = await Employee.findByUserId(req.user.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    const record = await Attendance.findTodayByEmployee(emp.id);
    res.json(record || null);
  } catch (err) {
    logger.error('attendance.getToday', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const punch = async (req, res) => {
  logger.info('attendance.punch', 'Entry', { userId: req.user.id, body: req.body });
  const { punchState, notes, customTime } = req.body;
  if (!punchState) return res.status(400).json({ msg: 'punchState is required' });
  try {
    const emp = await Employee.findByUserId(req.user.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    if (!emp.canSelfRecordAttendance) return res.status(403).json({ msg: 'Self-attendance recording disabled' });
    const record = await Attendance.punch(emp.id, punchState, { notes, recordedBy: req.user.id, customTime });
    res.json(record);
  } catch (err) {
    logger.error('attendance.punch', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const managerPunchForEmployee = async (req, res) => {
  logger.info('attendance.managerPunchForEmployee', 'Entry', { employeeId: req.params.employeeId, body: req.body });
  const { punchState, notes, customTime, isBackdated, backdatedReason } = req.body;
  if (!punchState) return res.status(400).json({ msg: 'punchState is required' });
  if (isBackdated && !backdatedReason) return res.status(400).json({ msg: 'Backdated attendance requires a reason' });
  try {
    const emp = await Employee.findById(req.params.employeeId);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    const record = await Attendance.punch(emp.id, punchState, { notes, recordedBy: req.user.id, customTime, isBackdated, backdatedReason });
    res.json(record);
  } catch (err) {
    logger.error('attendance.managerPunchForEmployee', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const upsert = async (req, res) => {
  logger.info('attendance.upsert', 'Entry', { employeeId: req.params.employeeId, date: req.params.date });
  try {
    await Attendance.upsert(req.params.employeeId, req.params.date, req.body);
    res.json({ msg: 'Attendance record saved' });
  } catch (err) {
    logger.error('attendance.upsert', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getByEmployee, getToday, punch, managerPunchForEmployee, upsert };
