const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');
const { query } = require('../config/db');
const logger = require('../utils/logger');

const SLA_TIMES = { critical: 1, high: 4, medium: 24, low: 48 };

exports.getAll = async (req, res) => {
  logger.info('complaint.getAll', 'Entry', { filter: req.query });
  try {
    const { type, status, urgency, department, assignedTo } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (department) filter.department = department;
    if (assignedTo) filter.assignedTo = assignedTo;
    const complaints = await Complaint.find(filter);
    logger.info('complaint.getAll', `Returning ${complaints.length} complaints`);
    res.json(complaints);
  } catch (err) {
    logger.error('complaint.getAll', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  logger.info('complaint.getById', 'Entry', { id: req.params.id });
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      logger.warn('complaint.getById', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (err) {
    logger.error('complaint.getById', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  logger.info('complaint.create', 'Entry', { userId: req.user?.id, urgency: req.body.urgency });
  try {
    const { type, category, description, urgency, guestName, guestContact, guestRoom, respondentId, department } = req.body;
    const slaHours = SLA_TIMES[urgency] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);
    const complaint = new Complaint({
      type,
      category,
      description,
      urgency: urgency || 'medium',
      guestName,
      guestContact,
      guestRoom,
      respondentId,
      department,
      submittedBy: req.user.id,
      slaDeadline,
      timeline: [{ action: 'Complaint filed', notes: description, performedBy: req.user.id }],
    });
    await complaint.save();
    logger.info('complaint.create', 'Created', { id: complaint.id, urgency: complaint.urgency });
    res.status(201).json(complaint);
  } catch (err) {
    logger.error('complaint.create', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  logger.info('complaint.updateStatus', 'Entry', { id: req.params.id, status: req.body.status });
  try {
    const { status, notes, assignedTo } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      logger.warn('complaint.updateStatus', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Complaint not found' });
    }
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (status) complaint.status = status;
    complaint.timeline.push({
      action: status ? `Status changed to ${status}` : 'Updated',
      notes: notes || '',
      performedBy: req.user.id,
    });
    if (status === 'resolved') complaint.resolutionDate = new Date();
    await complaint.save();
    logger.info('complaint.updateStatus', 'Updated', { id: req.params.id, status });
    res.json(complaint);
  } catch (err) {
    logger.error('complaint.updateStatus', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.resolve = async (req, res) => {
  logger.info('complaint.resolve', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const { resolution } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      logger.warn('complaint.resolve', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Complaint not found' });
    }
    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.resolutionDate = new Date();
    complaint.timeline.push({
      action: 'Complaint resolved',
      notes: resolution,
      performedBy: req.user.id,
    });
    await complaint.save();
    logger.info('complaint.resolve', 'Resolved', { id: req.params.id });
    res.json(complaint);
  } catch (err) {
    logger.error('complaint.resolve', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.close = async (req, res) => {
  logger.info('complaint.close', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      logger.warn('complaint.close', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Complaint not found' });
    }
    complaint.status = 'closed';
    complaint.complainantConfirmed = true;
    complaint.timeline.push({
      action: 'Complaint closed',
      notes: 'Complainant confirmed resolution',
      performedBy: req.user.id,
    });
    await complaint.save();
    logger.info('complaint.close', 'Closed', { id: req.params.id });
    res.json(complaint);
  } catch (err) {
    logger.error('complaint.close', 'Unhandled error', err, { id: req.params.id });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  logger.info('complaint.getStats', 'Entry');
  try {
    const [total, open, resolved, byType, byUrgency] = await Promise.all([
      query('SELECT COUNT(*) FROM complaints'),
      query("SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'acknowledged', 'investigating')"),
      query("SELECT COUNT(*) FROM complaints WHERE status = 'resolved'"),
      query("SELECT type, COUNT(*) FROM complaints GROUP BY type"),
      query("SELECT urgency, COUNT(*) FROM complaints GROUP BY urgency"),
    ]);
    res.json({ 
      total: parseInt(total.rows[0].count),
      open: parseInt(open.rows[0].count),
      resolved: parseInt(resolved.rows[0].count),
      byType: byType.rows.map(r => ({ _id: r.type, count: parseInt(r.count) })),
      byUrgency: byUrgency.rows.map(r => ({ _id: r.urgency, count: parseInt(r.count) }))
    });
  } catch (err) {
    logger.error('complaint.getStats', 'Unhandled error', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getByEmployee = async (req, res) => {
  logger.info('complaint.getByEmployee', 'Entry', { employeeId: req.params.employeeId });
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }
    
    let userId = employee.userId;
    
    if (!userId && employee.email) {
      const user = await User.findOne({ email: employee.email.toLowerCase() });
      if (user) {
        userId = user.id;
      }
    }
    
    const complaintsAsRespondent = await Complaint.find({ respondentId: employeeId });
    
    let complaintsAsComplainant = [];
    if (userId) {
      complaintsAsComplainant = await Complaint.find({ submittedBy: userId });
    }
    
    res.json({
      complaintsAsRespondent,
      complaintsAsComplainant,
      employeeId,
      userId
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
