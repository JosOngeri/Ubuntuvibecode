const Attendance = require('../models/Attendance.model');
const Employee = require('../models/Employee.model');
const { pool, query } = require('../config/db');
const {
  applyPunchState,
  isValidObjectId,
  recomputeTotalHours,
  toAttendanceDate,
  toDateValue,
  validateAttendancePayload,
} = require('../utils/validation');
const { validateNoBackdatedAttendance } = require('../utils/settingsValidation');
const { notifyBackdatedAttendance } = require('./notification.controller');
const logger = require('../utils/logger');

const findOrCreateAttendance = async (employeeId, punchTime, shift) => {
  const attendanceDate = toAttendanceDate(punchTime);
  let attendance = await Attendance.findOne({ employeeId, attendanceDate });

  if (!attendance) {
    attendance = new Attendance({
      employeeId,
      attendanceDate,
      shift: shift || 'Morning',
      status: 'Present',
    });
  } else if (!attendance.shift && shift) {
    attendance.shift = shift;
  }

  return attendance;
};

const pushBiometric = async (req, res) => {
  logger.info('attendance.pushBiometric', 'Entry', { biometricDeviceId: req.body.biometricDeviceId });
  const { normalized, errors } = validateAttendancePayload(req.body, { requireTimestamp: true });

  if (errors.length > 0) {
    logger.warn('attendance.pushBiometric', 'Validation failed', { errors });
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { biometricDeviceId, timestamp, punchState, shift } = normalized;

  try {
    const employee = await Employee.findOne({ biometricDeviceId });
    if (!employee) {
      logger.warn('attendance.pushBiometric', 'Employee not found', { biometricDeviceId });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const attendance = await findOrCreateAttendance(employee.id, timestamp, shift);
    applyPunchState(attendance, punchState, timestamp, 'biometric');

    recomputeTotalHours(attendance);

    await attendance.save();
    logger.info('attendance.pushBiometric', 'Recorded', { employeeId: employee.id, punchState });
    return res.status(200).json({ msg: 'Biometric attendance recorded', attendance });
  } catch (err) {
    logger.error('attendance.pushBiometric', 'Unhandled error', err);
    return res.status(500).send('Server error');
  }
};


// Fetch office locations from settings
const getOfficeLocations = async () => {
  try {
    const result = await query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'ATTENDANCE_LOCATION_%'`
    );

    const locations = [];
    let index = 1;

    while (true) {
      const latKey = `ATTENDANCE_LOCATION_${index}_LATITUDE`;
      const lngKey = `ATTENDANCE_LOCATION_${index}_LONGITUDE`;
      const nameKey = `ATTENDANCE_LOCATION_${index}_NAME`;
      const radiusKey = `ATTENDANCE_LOCATION_${index}_RADIUS_METERS`;

      const latRow = result.rows.find(r => r.setting_key === latKey);
      const lngRow = result.rows.find(r => r.setting_key === lngKey);
      const nameRow = result.rows.find(r => r.setting_key === nameKey);
      const radiusRow = result.rows.find(r => r.setting_key === radiusKey);

      if (!latRow || !lngRow) break;

      locations.push({
        name: nameRow ? nameRow.setting_value : `Location ${index}`,
        lat: parseFloat(latRow.setting_value),
        lng: parseFloat(lngRow.setting_value),
        radius: radiusRow ? parseInt(radiusRow.setting_value) : 1000,
      });

      index++;
    }

    // If no locations configured, return default
    if (locations.length === 0) {
      return [{
        name: 'Default Office',
        lat: -1.19293,
        lng: 36.93057,
        radius: 1000,
      }];
    }

    return locations;
  } catch (err) {
    logger.error('attendance.getOfficeLocations', 'Error fetching locations from settings', err);
    // Return default if error
    return [{
      name: 'Default Office',
      lat: -1.19293,
      lng: 36.93057,
      radius: 1000,
    }];
  }
};

function haversineDistance(lat1, lng1, lat2, lng2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Dummy function for remote/leave check (replace with real logic)
function isEmployeeAllowedRemote(employee) {
  // TODO: Check employee's leave/remote status from DB
  return false;
}

const manualSelfPunch = async (req, res) => {
  logger.info('attendance.manualSelfPunch', 'Entry', { userId: req.user?.id });
  const { normalized, errors } = validateAttendancePayload(req.body);

  if (errors.length > 0) {
    logger.warn('attendance.manualSelfPunch', 'Validation failed', { errors });
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { biometricDeviceId, punchState, shift } = normalized;
  const { geolocation } = req.body;

  try {
    let employee = null;

    if (req.user?.id) {
      employee = await Employee.findOne({ userId: req.user.id });
    }

    if (!employee && biometricDeviceId) {
      employee = await Employee.findOne({ biometricDeviceId });
    }

    if (!employee) {
      logger.warn('attendance.manualSelfPunch', 'Employee not found', { userId: req.user?.id });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Check if employee is allowed to self-record attendance
    if (!employee.canSelfRecordAttendance) {
      logger.warn('attendance.manualSelfPunch', 'Self-record not allowed', { employeeId: employee.id });
      return res.status(403).json({
        msg: 'You are not allowed to self-record attendance. Please contact your manager.'
      });
    }

    if (employee.biometricDeviceId && biometricDeviceId && employee.biometricDeviceId !== biometricDeviceId) {
      return res.status(400).json({
        msg: 'Biometric device mismatch for logged-in user',
        expectedBiometricDeviceId: employee.biometricDeviceId,
      });
    }

    // Fetch office locations from settings
    const officeLocations = await getOfficeLocations();

    // Geolocation validation
    const hasValidGeo =
      geolocation &&
      Number.isFinite(Number(geolocation.lat)) &&
      Number.isFinite(Number(geolocation.lng));

    let matchedLocation = null;
    if (hasValidGeo) {
      // Check against all configured locations
      for (const location of officeLocations) {
        const dist = haversineDistance(
          Number(geolocation.lat), Number(geolocation.lng),
          location.lat, location.lng
        );
        if (dist <= location.radius) {
          matchedLocation = location;
          break;
        }
      }

      if (!matchedLocation && !isEmployeeAllowedRemote(employee)) {
        return res.status(403).json({ msg: 'You are not at any allowed work location.' });
      }
    } else {
      return res.status(400).json({ msg: 'Location required to log attendance.' });
    }

    const serverNow = new Date();
    const attendance = await findOrCreateAttendance(employee.id, serverNow, shift);
    applyPunchState(attendance, punchState, serverNow, 'manual-self');

    // Store location information
    if (matchedLocation) {
      if (punchState === 'checkIn' || punchState === 'both') {
        attendance.check_in_location = matchedLocation.name;
        attendance.check_in_lat = geolocation.lat;
        attendance.check_in_lng = geolocation.lng;
      }
      if (punchState === 'checkOut' || punchState === 'both') {
        attendance.check_out_location = matchedLocation.name;
        attendance.check_out_lat = geolocation.lat;
        attendance.check_out_lng = geolocation.lng;
      }
    }

    recomputeTotalHours(attendance);
    await attendance.save();

    logger.info('attendance.manualSelfPunch', 'Recorded', { employeeId: employee.id, punchState, location: matchedLocation?.name });
    return res.status(200).json({
      msg: 'Manual attendance recorded with server time',
      recordedTime: serverNow,
      attendance,
      location: matchedLocation ? matchedLocation.name : null,
    });
  } catch (err) {
    logger.error('attendance.manualSelfPunch', 'Unhandled error', err, { userId: req.user?.id });
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const managerPunchForEmployee = async (req, res) => {
  logger.info('attendance.managerPunch', 'Entry', { managerId: req.user?.id, body: req.body });
  const { normalized, errors } = validateAttendancePayload(req.body, { requireTimestamp: true });

  if (errors.length > 0) {
    logger.warn('attendance.managerPunch', 'Validation failed', { body: req.body, normalized, errors });
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { employeeId, biometricDeviceId, punchState, timestamp, shift } = normalized;

  try {
    const employee = employeeId
      ? await Employee.findById(employeeId)
      : await Employee.findOne({ biometricDeviceId });

    if (!employee) {
      logger.warn('attendance.managerPunch', 'Employee not found', { employeeId, biometricDeviceId });
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Validate attendance date is not backdated
    const validation = await validateNoBackdatedAttendance(timestamp, employee.id);
    if (!validation.valid) {
      // Allow override if user is admin/manager/owner with reason
      const canOverride = ['admin', 'manager', 'owner'].includes(req.user?.role);
      if (validation.canOverride && canOverride && req.body.overrideReason) {
        logger.warn('attendance.managerPunch', `Backdated override by ${req.user.role}`, { reason: req.body.overrideReason, timestamp });

        // Send owner notification for backdated attendance
        try {
          await notifyBackdatedAttendance({
            employee_name: `${employee.firstName} ${employee.lastName}`,
            date: timestamp,
            backdated_reason: req.body.overrideReason,
            backdated_by: req.user.email || req.user.firstName,
          });
        } catch (notifyErr) {
          logger.error('attendance.managerPunch', 'Error sending backdated notification', notifyErr);
        }
      } else if (!validation.canOverride || !canOverride) {
        logger.warn('attendance.managerPunch', 'Backdated attendance rejected', { employeeId: employee.id, timestamp, validationError: validation.error });
        return res.status(400).json({ msg: validation.error });
      }
    }

    const attendance = await findOrCreateAttendance(employee.id, timestamp, shift);
    applyPunchState(attendance, punchState, timestamp, 'manual-manager');

    recomputeTotalHours(attendance);
    await attendance.save();

    logger.info('attendance.managerPunch', 'Recorded', { employeeId: employee.id, punchState, timestamp });
    return res.status(200).json({
      msg: 'Manager/supervisor attendance entry recorded',
      attendance,
    });
  } catch (err) {
    logger.error('attendance.managerPunch', 'Unhandled error', err, { managerId: req.user?.id });
    return res.status(500).send('Server error');
  }
};

const getAttendance = async (req, res) => {
  const requestedId = req.params.employeeId;
  logger.info('attendance.getByEmployee', 'Entry', { requestedId, role: req.user?.role });
  try {
    let requestedEmployeeId = requestedId;
    let employee = null;

    // Handle /me route (employeeId is undefined for /me, or 'me' if somehow passed)
    if (!requestedEmployeeId || requestedEmployeeId === 'me') {
      employee = await Employee.findOne({ userId: req.user?.id });
      if (!employee) {
        logger.warn('attendance.getByEmployee', 'No employee profile for user', { userId: req.user?.id });
        return res.status(404).json({ msg: 'Employee profile not found for logged in user' });
      }
      requestedEmployeeId = employee.id;
      logger.info('attendance.getByEmployee', 'Resolved /me', { employeeId: employee.id });
    }

    if (!isValidObjectId(requestedEmployeeId)) {
      logger.warn('attendance.getByEmployee', 'Invalid employee id', { id: requestedEmployeeId });
      return res.status(400).json({ msg: 'Invalid employee id' });
    }

    if (!employee) {
      if (req.user?.role === 'employee') {
        employee = await Employee.findOne({ userId: req.user?.id });
        if (!employee) {
          return res.status(404).json({ msg: 'Employee profile not found for logged in user' });
        }
      } else {
        employee = await Employee.findById(requestedEmployeeId);
      }
    }

    if (!employee || String(employee.status || '').toLowerCase() !== 'active') {
      return res.status(404).json({ msg: 'Active employee not found' });
    }

    const attendance = await Attendance.findByEmployeeId(employee.id);
    logger.info('attendance.getByEmployee', `Returning ${attendance.length} records`);
    return res.json(attendance);
  } catch (err) {
    logger.error('attendance.getByEmployee', 'Unhandled error', err);
    return res.status(500).send('Server error');
  }
};

const getAttendanceById = async (req, res) => {
  logger.info('attendance.getById', 'Entry', { id: req.params.id });
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      logger.warn('attendance.getById', 'Invalid id', { id });
      return res.status(400).json({ msg: 'Invalid attendance id' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      logger.warn('attendance.getById', 'Not found', { id });
      return res.status(404).json({ msg: 'Attendance not found' });
    }

    if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user?.id });
      if (!employee) {
        return res.status(404).json({ msg: 'Employee profile not found for logged in user' });
      }

      if (String(attendance.employeeId) !== String(employee.id)) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    }

    return res.json(attendance);
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const adjustAttendance = async (req, res) => {
  logger.info('attendance.adjust', 'Entry', { id: req.params.id, by: req.user?.id });
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('attendance.adjust', 'Invalid id', { id: req.params.id });
      return res.status(400).json({ msg: 'Invalid attendance id' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      logger.warn('attendance.adjust', 'Not found', { id: req.params.id });
      return res.status(404).json({ msg: 'Attendance not found' });
    }

    // Get employee for notification
    const employee = await Employee.findById(attendance.employeeId);

    const allowedFields = ['attendanceDate', 'status', 'shift', 'checkIn', 'breakOut', 'breakIn', 'checkOut', 'punchState'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const isDateField = ['attendanceDate', 'checkIn', 'breakOut', 'breakIn', 'checkOut'].includes(field);

        if (isDateField) {
          const dateValue = toDateValue(req.body[field]);

          // Validate attendance date is not backdated
          const validation = await validateNoBackdatedAttendance(dateValue, attendance.employeeId);
          if (!validation.valid) {
            // Allow override if user is admin/manager/owner with reason
            const canOverride = ['admin', 'manager', 'owner'].includes(req.user?.role);
            if (validation.canOverride && canOverride && req.body.overrideReason) {
              logger.warn('attendance.adjust', `Backdated override by ${req.user.role}`, { reason: req.body.overrideReason, field, dateValue });

              // Send owner notification for backdated attendance
              try {
                await notifyBackdatedAttendance({
                  employee_name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
                  date: dateValue,
                  backdated_reason: req.body.overrideReason,
                  backdated_by: req.user.email || req.user.firstName,
                });
              } catch (notifyErr) {
                logger.error('attendance.adjust', 'Error sending backdated notification', notifyErr);
              }
            } else if (!validation.canOverride || !canOverride) {
              return res.status(400).json({ msg: validation.error });
            }
          }

          attendance[field] = dateValue;
        } else {
          attendance[field] = req.body[field];
        }
      }
    }

    recomputeTotalHours(attendance);
    await attendance.save();

    logger.info('attendance.adjust', 'Adjusted', { id: req.params.id });
    return res.json(attendance);
  } catch (err) {
    logger.error('attendance.adjust', 'Unhandled error', err, { id: req.params.id });
    return res.status(500).send('Server error');
  }
};

const getTodayAttendance = async (req, res) => {
  logger.info('attendance.getToday', 'Entry', { userId: req.user?.id });
  try {
    const { rows } = await query(
      `SELECT a.*,
              e.first_name AS employee_first_name,
              e.last_name  AS employee_last_name,
              e.department AS employee_department
       FROM attendance a
       LEFT JOIN employees e ON e.id = a.employee_id
       WHERE a.attendance_date = CURRENT_DATE
       ORDER BY a.created_at DESC`
    );
    const records = rows.map((row) => ({
      ...Attendance.fromRow(row),
      employeeId: {
        _id: row.employee_id,
        firstName: row.employee_first_name,
        lastName: row.employee_last_name,
        department: row.employee_department,
      },
    }));
    return res.json(records);
  } catch (err) {
    logger.error('attendance.getToday', 'DB query failed', err);
    return res.status(500).json({ msg: 'Failed to fetch today attendance', error: err.message });
  }
};

module.exports = {
  pushBiometric,
  manualSelfPunch,
  managerPunchForEmployee,
  getAttendance,
  getAttendanceById,
  adjustAttendance,
  getTodayAttendance,
};