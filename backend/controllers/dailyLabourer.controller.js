const DailyLabourer = require('../models/DailyLabourer.model');
const DailyAttendance = require('../models/DailyAttendance.model');
const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');
const { query } = require('../config/db');
const logger = require('../utils/logger');

// Get current daily labourer
exports.getMe = async (req, res) => {
  logger.info('dailyLabourer.getMe', 'Entry', { userId: req.user?.id });
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('dailyLabourer.getMe', 'No userId — unauthorized');
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const labourer = await DailyLabourer.findOne({ userId });
    if (!labourer) {
      logger.warn('dailyLabourer.getMe', 'Labourer not found', { userId });
      return res.status(404).json({ msg: 'Daily labourer profile not found for current user' });
    }

    return res.json(labourer.toJSON());
  } catch (err) {
    logger.error('dailyLabourer.getMe', 'Error', err, { userId: req.user?.id });
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get daily labourer by user ID
exports.getByUserId = async (req, res) => {
  logger.info('dailyLabourer.getByUserId', 'Entry', { userId: req.params.userId });
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      logger.warn('dailyLabourer.getByUserId', 'Invalid user id', { userId: req.params.userId });
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const { rows } = await query(
      'SELECT * FROM daily_labourers WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      logger.warn('dailyLabourer.getByUserId', 'Not found', { userId });
      return res.status(404).json({ msg: 'Daily labourer profile not found for this user' });
    }

    return res.json(rows[0]);
  } catch (err) {
    logger.error('dailyLabourer.getByUserId', 'Error', err, { userId: req.params.userId });
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Daily Labourer CRUD
exports.getAll = async (req, res) => {
  try {
    const { status, skill } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (skill) filter.skills = skill;
    const labourers = await DailyLabourer.find(filter);
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
    const labourer = new DailyLabourer({ ...req.body, registeredBy: req.user.id });
    await labourer.save();
    res.status(201).json(labourer);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const labourer = await DailyLabourer.findByIdAndUpdate(req.params.id, req.body);
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
    const employee = new Employee({
      firstName: labourer.firstName,
      lastName: labourer.lastName,
      phone: labourer.phone,
      idNumber: labourer.idNumber,
      employmentType: 'Permanent',
      status: 'Active',
      department: req.body.department || 'General',
      position: req.body.position || 'Staff',
    });
    await employee.save();
    labourer.status = 'converted';
    labourer.convertedToEmployeeId = employee.id;
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
    let sql = `SELECT da.*, dl.first_name, dl.last_name, dl.daily_rate 
               FROM daily_attendance da 
               LEFT JOIN daily_labourers dl ON dl.id = da.labourer_id`;
    const params = [];
    const conditions = [];

    if (labourerId) {
      conditions.push('da.labourer_id = $' + (params.length + 1));
      params.push(labourerId);
    }
    if (date) {
      conditions.push('da.date::date = $' + (params.length + 1));
      params.push(date);
    } else if (startDate && endDate) {
      conditions.push('da.date >= $' + (params.length + 1) + ' AND da.date <= $' + (params.length + 2));
      params.push(startDate, endDate);
    } else {
      conditions.push('da.date::date = CURRENT_DATE');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY da.date DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get attendance for a specific labourer
exports.getLabourerAttendance = async (req, res) => {
  try {
    const labourerId = req.params.id;
    const { rows } = await query(
      `SELECT da.*, dl.first_name, dl.last_name, dl.daily_rate
       FROM daily_attendance da
       LEFT JOIN daily_labourers dl ON dl.id = da.labourer_id
       WHERE da.labourer_id = $1
       ORDER BY da.date DESC`,
      [labourerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get payments for a specific labourer
exports.getLabourerPayments = async (req, res) => {
  try {
    const labourerId = req.params.id;
    const { rows } = await query(
      `SELECT da.id, da.date, da.wage_for_day as amount, 
              CASE WHEN da.approved = true THEN 'paid' ELSE 'pending' END as status
       FROM daily_attendance da
       WHERE da.labourer_id = $1 AND da.status != 'absent'
       ORDER BY da.date DESC`,
      [labourerId]
    );
    res.json(rows);
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
    
    const { rows } = await query(
      'SELECT * FROM daily_attendance WHERE labourer_id = $1 AND date::date = $2',
      [labourerId, today.toISOString().split('T')[0]]
    );
    
    let record;
    if (rows.length > 0) {
      record = new DailyAttendance(rows[0]);
      if (req.body.checkOut) record.checkOut = new Date();
      record.status = status || record.status;
      record.assignedTo = assignedTo || record.assignedTo;
      record.wageForDay = labourer.dailyRate;
      await record.save();
    } else {
      record = new DailyAttendance({
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
      await record.save();
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getWageSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const { rows } = await query(
      `SELECT da.*, dl.first_name, dl.last_name, dl.daily_rate
       FROM daily_attendance da
       LEFT JOIN daily_labourers dl ON dl.id = da.labourer_id
       WHERE da.date >= $1 AND da.date <= $2 AND da.status != 'absent'
       ORDER BY da.date DESC`,
      [start, end]
    );
    
    const summary = {};
    rows.forEach(r => {
      const id = String(r.labourer_id);
      if (!summary[id]) summary[id] = { name: r.first_name + ' ' + r.last_name, days: 0, totalWage: 0 };
      summary[id].days++;
      summary[id].totalWage += Number(r.wage_for_day) || Number(r.daily_rate) || 0;
    });
    res.json({ summary: Object.values(summary), totalRecords: rows.length });
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
        const { rows } = await query(
          'UPDATE daily_attendance SET approved = true, approved_at = NOW(), approved_by = $1 WHERE id = $2 RETURNING *',
          [req.user.id, wageId]
        );
        if (rows.length > 0) {
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
