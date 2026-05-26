const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');
const { sendSMS, normalizePhoneNumber } = require('../utils/sms');
const crypto = require('crypto');
const OrientationChecklist = require('../models/OrientationChecklist.model');
const Onboarding = require('../models/Onboarding.model');
const logger = require('../utils/logger');

const DEFAULT_STEPS = [
  { name: 'offer_letter', label: 'Generate Offer Letter' },
  { name: 'documents', label: 'Collect Documents (ID, Certificates, KRA, NSSF, NHIF)' },
  { name: 'department_assignment', label: 'Assign Department & Supervisor' },
  { name: 'asset_allocation', label: 'Allocate Assets (Uniform, Tools, PPE)' },
  { name: 'orientation', label: 'Schedule Orientation / Training' },
  { name: 'probation_review_1', label: 'First Probation Review (Mid-point)' },
  { name: 'probation_review_2', label: 'Final Probation Review' },
  { name: 'confirmation', label: 'Confirm Employment' },
];

exports.getAll = async (req, res) => {
  logger.info('onboarding.getAll', 'Entry', { status: req.query.status });
  try {
    const { status } = req.query;
    let queryText = 'SELECT * FROM onboarding';
    const params = [];
    
    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }
    
    queryText += ' ORDER BY created_at DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  logger.info('onboarding.getById', 'Entry', { id: req.params.id });
  try {
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.initiate = async (req, res) => {
  logger.info('onboarding.initiate', 'Entry', { employeeId: req.body.employeeId, by: req.user?.id });
  try {
    const { employeeId, applicationId, department, position, supervisorId, probationMonths } = req.body;

    // Check if employee exists
    const empResult = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (empResult.rows.length === 0) return res.status(404).json({ msg: 'Employee not found' });
    const employee = empResult.rows[0];

    // Check if onboarding already exists
    const existingResult = await query('SELECT * FROM onboarding WHERE employee_id = $1', [employeeId]);
    if (existingResult.rows.length > 0) return res.status(400).json({ msg: 'Onboarding already exists for this employee' });

    // If applicationId is provided, copy disclosure data to employee
    if (applicationId) {
      const appResult = await query('SELECT * FROM job_applications WHERE id = $1', [applicationId]);
      if (appResult.rows.length > 0) {
        const application = appResult.rows[0];
        const disclosures = application.disclosures;

        if (disclosures) {
          await query(
            `UPDATE employees
             SET experience_years = $1,
                 availability_weeks = $2,
                 right_to_work = $3,
                 salary_expectation = $4
             WHERE id = $5`,
            [
              disclosures.experienceYears || null,
              disclosures.availabilityWeeks || null,
              disclosures.rightToWork || null,
              disclosures.salaryExpectation || null,
              employeeId
            ]
          );
        }
      }
    }

    // Load role-based orientation checklist
    const role = position || employee.position || 'default';
    let orientationChecklist = await OrientationChecklist.findByRole(role);
    if (!orientationChecklist || orientationChecklist.length === 0) {
      const defaultChecklist = await OrientationChecklist.getDefault();
      orientationChecklist = defaultChecklist ? [defaultChecklist] : [];
    }

    const probationEnd = new Date();
    probationEnd.setMonth(probationEnd.getMonth() + (probationMonths || 3));

    const result = await query(
      `INSERT INTO onboarding (employee_id, application_id, department, position, supervisor_id, probation_end_date, steps, status, orientation_checklist, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [employeeId, applicationId, department || employee.department, position || employee.position, supervisorId, probationEnd, JSON.stringify(DEFAULT_STEPS.map(s => ({ ...s, completed: false }))), 'in_progress', JSON.stringify(orientationChecklist[0]?.checklist || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.completeStep = async (req, res) => {
  try {
    const { stepName, notes } = req.body;
    
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    const onboarding = result.rows[0];
    
    const steps = onboarding.steps || [];
    const step = steps.find(s => s.name === stepName);
    if (!step) return res.status(404).json({ msg: 'Step not found' });
    
    step.completed = true;
    step.completedAt = new Date();
    step.completedBy = req.user.id;
    if (notes) step.notes = notes;
    
    let status = onboarding.status;
    if (stepName === 'confirmation') {
      status = 'completed';
      // Update employee status
      await query('UPDATE employees SET status = $1, employment_type = $2 WHERE id = $3', ['active', 'Permanent', onboarding.employee_id]);
      
      // Create user account if not exists
      const empResult = await query('SELECT * FROM employees WHERE id = $1', [onboarding.employee_id]);
      const employee = empResult.rows[0];
      
      if (employee && !employee.user_id) {
        const username = `${employee.first_name.toLowerCase()}.${employee.last_name.toLowerCase()}`;
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Check if username exists
        const userCheck = await query('SELECT * FROM users WHERE username = $1', [username]);
        let finalUsername = username;
        if (userCheck.rows.length > 0) {
          let counter = 1;
          while (true) {
            const checkResult = await query('SELECT * FROM users WHERE username = $1', [`${username}${counter}`]);
            if (checkResult.rows.length === 0) {
              finalUsername = `${username}${counter}`;
              break;
            }
            counter++;
          }
        }
        
        const userResult = await query(
          'INSERT INTO users (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
          [finalUsername, hashedPassword, employee.email, 'employee', 'active']
        );
        
        // Update employee with user ID
        await query('UPDATE employees SET user_id = $1 WHERE id = $2', [userResult.rows[0].id, onboarding.employee_id]);
        
        // Send email with login credentials
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        try {
          await sendEmail({
            to: employee.email,
            subject: 'Welcome to Ubuntu HRMS - Your Account Credentials',
            text: `Dear ${employee.first_name} ${employee.last_name},\n\nWelcome to Ubuntu HRMS! Your onboarding has been completed successfully.\n\nYour login credentials:\nUsername: ${finalUsername}\nPassword: ${tempPassword}\n\nPlease log in at ${frontendUrl} and change your password immediately.\n\nBest regards,\nUbuntu HRMS Team`,
            html: `<p>Dear ${employee.first_name} ${employee.last_name},</p><p>Welcome to Ubuntu HRMS! Your onboarding has been completed successfully.</p><p><strong>Your login credentials:</strong></p><p>Username: ${finalUsername}<br>Password: ${tempPassword}</p><p>Please log in at <a href="${frontendUrl}">${frontendUrl}</a> and change your password immediately.</p><p>Best regards,<br>Ubuntu HRMS Team</p>`,
          });
        } catch (emailErr) {
          logger.error('onboarding.completeStep', 'Failed to send email', emailErr);
        }

        // Send SMS with login credentials
        const normalizedPhone = normalizePhoneNumber(employee.phone);
        if (normalizedPhone) {
          try {
            await sendSMS({
              phone: normalizedPhone,
              message: `Welcome to Ubuntu HRMS, ${employee.first_name}! Your onboarding is complete. Username: ${finalUsername}, Password: ${tempPassword}. Login at ${frontendUrl}`,
            });
          } catch (smsErr) {
            logger.error('onboarding.completeStep', 'Failed to send SMS', smsErr);
          }
        }
      }
    }
    
    const updateResult = await query(
      'UPDATE onboarding SET steps = $1, status = $2, confirmed_at = $3, confirmed_by = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [JSON.stringify(steps), status, stepName === 'confirmation' ? new Date() : onboarding.confirmed_at, stepName === 'confirmation' ? req.user.id : onboarding.confirmed_by, req.params.id]
    );
    
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    const onboarding = result.rows[0];
    
    const { name, type, url } = req.body;
    const documents = onboarding.documents || [];
    documents.push({ name, type, url, uploadedAt: new Date() });
    
    const updateResult = await query('UPDATE onboarding SET documents = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [JSON.stringify(documents), req.params.id]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.assignAsset = async (req, res) => {
  try {
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    const onboarding = result.rows[0];
    
    const { assetId, condition } = req.body;
    const assetsAssigned = onboarding.assets_assigned || [];
    assetsAssigned.push({ assetId, assignedAt: new Date(), condition });
    
    const updateResult = await query('UPDATE onboarding SET assets_assigned = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [JSON.stringify(assetsAssigned), req.params.id]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addProbationReview = async (req, res) => {
  try {
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    const onboarding = result.rows[0];
    
    const { score, comments, recommendation } = req.body;
    const probationReviews = onboarding.probation_reviews || [];
    probationReviews.push({
      reviewDate: new Date(),
      reviewerId: req.user.id,
      score,
      comments,
      recommendation,
    });
    
    const updateResult = await query('UPDATE onboarding SET probation_reviews = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [JSON.stringify(probationReviews), req.params.id]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.generateOfferLetter = async (req, res) => {
  try {
    const result = await query('SELECT * FROM onboarding WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Onboarding not found' });
    const onboarding = result.rows[0];
    
    const empResult = await query('SELECT * FROM employees WHERE id = $1', [onboarding.employee_id]);
    if (empResult.rows.length === 0) return res.status(404).json({ msg: 'Employee not found' });
    const employee = empResult.rows[0];
    
    const letter = {
      date: new Date().toLocaleDateString(),
      employeeName: `${employee.first_name} ${employee.last_name}`,
      position: onboarding.position || employee.department,
      department: onboarding.department || employee.department,
      startDate: new Date().toLocaleDateString(),
      probationMonths: 3,
      salary: employee.wage_rate || 'To be discussed',
    };
    
    const updateResult = await query(
      'UPDATE onboarding SET offer_letter_generated = true, offer_letter_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [`/api/onboarding/${onboarding.id}/offer-letter`, req.params.id]
    );
    
    res.json({ letter, onboarding: updateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
