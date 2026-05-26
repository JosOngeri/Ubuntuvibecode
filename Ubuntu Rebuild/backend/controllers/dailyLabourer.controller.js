const DailyLabourer = require('../models/DailyLabourer.model');
const logger = require('../utils/logger');

const getAll = async (req, res) => {
  logger.info('dailyLabourer.getAll', 'Entry', { query: req.query });
  try {
    const { status, department, page, limit } = req.query;
    const labourers = await DailyLabourer.findAll({ status, department, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(labourers);
  } catch (err) {
    logger.error('dailyLabourer.getAll', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findById(req.params.id);
    if (!labourer) return res.status(404).json({ msg: 'Daily labourer not found' });
    res.json(labourer);
  } catch (err) {
    logger.error('dailyLabourer.getById', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findByUserId(req.user.id);
    if (!labourer) return res.status(404).json({ msg: 'Daily labourer profile not found' });
    res.json(labourer);
  } catch (err) {
    logger.error('dailyLabourer.getMe', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const create = async (req, res) => {
  logger.info('dailyLabourer.create', 'Entry', { body: req.body });
  try {
    const labourer = await DailyLabourer.create(req.body);
    logger.info('dailyLabourer.create', 'Created', { id: labourer.id });
    res.status(201).json(labourer);
  } catch (err) {
    logger.error('dailyLabourer.create', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const update = async (req, res) => {
  logger.info('dailyLabourer.update', 'Entry', { id: req.params.id });
  try {
    const labourer = await DailyLabourer.findById(req.params.id);
    if (!labourer) return res.status(404).json({ msg: 'Daily labourer not found' });
    const updated = await DailyLabourer.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('dailyLabourer.update', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { labourerId, isPaid, isUrgent, from, to, page, limit } = req.query;
    const records = await DailyLabourer.findAllAttendance({ labourerId, isPaid, isUrgent, from, to, page: parseInt(page)||1, limit: parseInt(limit)||50 });
    res.json(records);
  } catch (err) {
    logger.error('dailyLabourer.getAllAttendance', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createAttendance = async (req, res) => {
  logger.info('dailyLabourer.createAttendance', 'Entry', { body: req.body });
  try {
    const record = await DailyLabourer.createAttendance({ ...req.body, recordedBy: req.user.id });
    logger.info('dailyLabourer.createAttendance', 'Created', { id: record.id });
    res.status(201).json(record);
  } catch (err) {
    logger.error('dailyLabourer.createAttendance', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateAttendance = async (req, res) => {
  logger.info('dailyLabourer.updateAttendance', 'Entry', { id: req.params.id });
  try {
    const record = await DailyLabourer.updateAttendance(req.params.id, req.body);
    if (!record) return res.status(404).json({ msg: 'Attendance record not found' });
    res.json(record);
  } catch (err) {
    logger.error('dailyLabourer.updateAttendance', 'Error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getAll, getById, getMe, create, update, getAllAttendance, createAttendance, updateAttendance };
