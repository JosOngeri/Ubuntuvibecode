const DailyLabourer = require('../models/DailyLabourer.model');
const DailyAttendance = require('../models/DailyAttendance.model');
const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');
const { query } = require('../config/db');

// Daily Labourer CRUD
exports.getAll = async (req, res) => {
  try {
    const { status, skill } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (skill) filter.skills = skill;
    const labourers = await DailyLabourer.find(filter).sort({ createdAt: -1 });
    res.json(labourers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findById(req.params.id);
    if (!labourer) return res.status(404).json({ msg: 'Labourer not found' });
    res.json(labourer);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const labourer = await DailyLabourer.create({ ...req.body, registeredBy: req.user.id });
    res.status(201).json(labourer);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!labourer) return res.status(404).json({ msg: 'Labourer not found' });
    res.json(labourer);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await DailyLabourer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Labourer removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.convertToEmployee = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findById(req.params.id);
    if (!labourer) return res.status(404).json({ msg: 'Labourer not found' });
    const Employee = require('../models/Employee.model');
    const employee = await Employee.create({
      firstName: labourer.firstName,
      lastName: labourer.lastName,
      phone: labourer.phone,
      idNumber: labourer.idNumber,
      employmentType: 'Permanent',
      status: 'Active',
      department: req.body.department || 'General',
      position: req.body.position || 'Staff',
    });
    labourer.status = 'converted';
    labourer.convertedToEmployeeId = employee._id;
    await labourer.save();
    res.json({ labourer, employee });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Daily Attendance
exports.getAttendance = async (req, res) => {
  try {
    const { date, labourerId, startDate, endDate } = req.query;
    const filter = {};
    if (labourerId) filter.labourerId = labourerId;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lt: new Date(endDate) };
    } else {
      const today = new Date();
      filter.date = { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) };
    }
    const records = await DailyAttendance.find(filter).populate('labourerId', 'firstName lastName dailyRate').sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.recordAttendance = async (req, res) => {
  try {
    const { labourerId, status, assignedTo, assignedContractorId, assignedMilestoneId } = req.body;
    const labourer = await DailyLabourer.findById(labourerId);
    if (!labourer) return res.status(404).json({ msg: 'Labourer not found' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let record = await DailyAttendance.findOne({ labourerId, date: today });
    if (record) {
      if (req.body.checkOut) record.checkOut = new Date();
      record.status = status || record.status;
      record.assignedTo = assignedTo || record.assignedTo;
      record.wageForDay = labourer.dailyRate;
      await record.save();
    } else {
      record = await DailyAttendance.create({
        labourerId,
        date: today,
        checkIn: new Date(),
        status: status || 'present',
        assignedTo: assignedTo || 'other',
        assignedContractorId,
        assignedMilestoneId,
        wageForDay: labourer.dailyRate,
        recordedBy: req.user.id,
      });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getWageSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    const records = await DailyAttendance.find({
      date: { $gte: start, $lt: end },
      status: { $ne: 'absent' },
    }).populate('labourerId', 'firstName lastName dailyRate');
    const summary = {};
    records.forEach(r => {
      const id = String(r.labourerId?._id || r.labourerId);
      if (!summary[id]) summary[id] = { name: r.labourerId?.firstName + ' ' + r.labourerId?.lastName, days: 0, totalWage: 0 };
      summary[id].days++;
      summary[id].totalWage += r.wageForDay || r.labourerId?.dailyRate || 0;
    });
    res.json({ summary: Object.values(summary), totalRecords: records.length });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Batch approve wages
exports.batchApproveWages = async (req, res) => {
  try {
    const { wageIds } = req.body;
    if (!wageIds || !Array.isArray(wageIds) || wageIds.length === 0) {
      return res.status(400).json({ msg: 'wageIds array is required' });
    }

    const results = [];
    for (const wageId of wageIds) {
      try {
        const record = await DailyAttendance.findByIdAndUpdate(
          wageId,
          { approved: true, approvedAt: new Date(), approvedBy: req.user.id },
          { new: true }
        );
        if (record) {
          results.push({ id: wageId, status: 'approved' });
        } else {
          results.push({ id: wageId, status: 'not_found' });
        }
      } catch (err) {
        results.push({ id: wageId, status: 'error', error: err.message });
      }
    }

    res.json({ approved: results.filter(r => r.status === 'approved').length, results });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get urgent wages
exports.getUrgentWages = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT da.*, dl.first_name, dl.last_name, dl.daily_rate
       FROM daily_attendance da
       JOIN daily_labourers dl ON dl.id = da.labourer_id
       WHERE dl.urgency_level = 'urgent'
         AND dl.calculated_at IS NOT NULL
       ORDER BY dl.calculated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update wage urgency
exports.updateWageUrgency = async (req, res) => {
  try {
    const { labourerId, urgencyLevel } = req.body;
    
    await query(
      `UPDATE daily_labourers 
       SET urgency_level = $1, calculated_at = NOW() 
       WHERE id = $2`,
      [urgencyLevel, labourerId]
    );

    // If urgent, send notifications to managers and admin
    if (urgencyLevel === 'urgent') {
      const { rows: managers } = await query(
        `SELECT u.id FROM users u WHERE u.role IN ('manager', 'admin') AND u.status = 'active'`
      );
      
      for (const manager of managers) {
        await sendUrgentNotification({
          userId: manager.id,
          type: NOTIFICATION_TYPES.WAGE_URGENT,
          title: 'Urgent: Daily Labour Wages Pending',
          message: 'Daily labour wages need approval and payment.',
          actionLink: '/admin/daily-labour',
          channels: ['sms', 'in_app'],
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
