const Job = require('../models/Job.model');
const JobApplication = require('../models/JobApplication.model');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');
const path = require('path');
const { query } = require('../config/db');
const logger = require('../utils/logger');

const parseJsonField = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const jobController = {
  // 3.4.1 Job Posting CRUD
  async createJob(req, res) {
    try {
      // Validate application deadline is not before today
      if (req.body.applicationDeadline) {
        const deadline = new Date(req.body.applicationDeadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadline < today) {
          return res.status(400).json({ msg: 'Application deadline cannot be before today' });
        }
      }

      const job = await Job.create({ ...req.body, postedBy: req.user?.id });
      res.status(201).json(job);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to create job', error: err.message });
    }
  },
  async getJobs(req, res) {
    try {
      const onlyOpen = req.query.open === 'true';
      const jobs = await Job.findAll({ onlyOpen });
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch jobs', error: err.message });
    }
  },
  async getJob(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ msg: 'Job not found' });
      res.json(job);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch job', error: err.message });
    }
  },
  async updateJob(req, res) {
    try {
      // Validate application deadline is not before today
      if (req.body.applicationDeadline) {
        const deadline = new Date(req.body.applicationDeadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadline < today) {
          return res.status(400).json({ msg: 'Application deadline cannot be before today' });
        }
      }

      const job = await Job.update(req.params.id, req.body);
      res.json(job);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update job', error: err.message });
    }
  },
  async deleteJob(req, res) {
    try {
      await Job.delete(req.params.id);
      res.json({ msg: 'Job deleted' });
    } catch (err) {
      res.status(400).json({ msg: 'Failed to delete job', error: err.message });
    }
  },

  // 3.4.4 Available Jobs Listing (public)
  async listOpenJobs(req, res) {
    try {
      const jobs = await Job.findAll({ onlyOpen: true });
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch open jobs', error: err.message });
    }
  },

  // Public job detail endpoint
  async getPublicJob(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ msg: 'Job not found' });
      res.json(job);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch job', error: err.message });
    }
  },

  // 3.4.5 Application Submission
  async applyToJob(req, res) {
    try {
      logger.info('job.applyToJob', 'Entry', { jobId: req.params.id, applicantEmail: req.body.applicantEmail });

      const userId = req.user?.id || null;
      const {
        applicantName,
        applicantEmail,
        applicantPhone,
        coverLetter,
        applicationMode,
        workHistory,
        education,
        references,
        additionalInfo,
        personal_info,
        address_info,
        position_details,
        employment_history,
        skills,
        declaration,
        disclosures,
      } = req.body;
      const jobId = req.params.id;
      const cvPath = req.files && req.files.cv && req.files.cv[0]
        ? path.relative(path.join(__dirname, '../'), req.files.cv[0].path).split(path.sep).join('/')
        : null;
      const coverLetterPath = req.files && req.files.coverLetter && req.files.coverLetter[0]
        ? path.relative(path.join(__dirname, '../'), req.files.coverLetter[0].path).split(path.sep).join('/')
        : null;

      logger.info('job.applyToJob', 'Parsed data', { jobId, applicantName, applicantEmail, cvPath: !!cvPath, coverLetterPath: !!coverLetterPath });

      // Validation
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      // Check if job is still open
      const now = new Date();
      if (job.applicationDeadline && new Date(job.applicationDeadline) < now) {
        logger.warn('job.applyToJob', 'Application deadline passed', { jobId });
        return res.status(400).json({ msg: 'Application deadline has passed' });
      }

      // Validate date of birth (must be at least 18 years ago)
      const personalInfoForValidation = parseJsonField(personal_info, {});
      if (personalInfoForValidation.dateOfBirth) {
        const dob = new Date(personalInfoForValidation.dateOfBirth);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (dob > minAgeDate) {
          logger.warn('job.applyToJob', 'Applicant under 18', { jobId });
          return res.status(400).json({ msg: 'Applicant must be at least 18 years old' });
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (applicantEmail && !emailRegex.test(applicantEmail)) {
        logger.warn('job.applyToJob', 'Invalid email format', { email: applicantEmail });
        return res.status(400).json({ msg: 'Invalid email format' });
      }

      // Validate required fields
      if (!applicantName || !applicantEmail) {
        logger.warn('job.applyToJob', 'Missing required fields');
        return res.status(400).json({ msg: 'Applicant name and email are required' });
      }

      const applicationData = {
        applicationMode: applicationMode || 'structured',
        workHistory: parseJsonField(workHistory, []),
        education: parseJsonField(education, []),
        references: parseJsonField(references, []),
        additionalInfo: additionalInfo || '',
      };

      logger.info('job.applyToJob', 'Inserting application', { jobId });
      // Parse structured fields
      const personalInfoParsed = parseJsonField(personal_info, {});
      const educationParsed = parseJsonField(education, {});
      const disclosuresParsed = parseJsonField(disclosures, {});

      // Extract flat fields from personal_info for dedicated columns
      const firstName = personalInfoParsed.firstName || applicantName?.split(' ')[0] || '';
      const lastName = personalInfoParsed.surname || applicantName?.split(' ').slice(1).join(' ') || '';
      const emailValue = personalInfoParsed.email || applicantEmail || '';
      const phoneValue = personalInfoParsed.phone || applicantPhone || '';
      const dobValue = personalInfoParsed.dateOfBirth || null;
      const genderValue = personalInfoParsed.gender || null;
      const maritalStatusValue = personalInfoParsed.maritalStatus || null;
      const nationalityValue = personalInfoParsed.nationality || null;
      const nationalIdValue = personalInfoParsed.nationalId || null;

      // Build full application data JSONB to match the model's expected schema
      const fullApplicationData = {
        ...applicationData,
        personalInfo: personalInfoParsed,
        education: educationParsed,
        employmentHistory: parseJsonField(employment_history, []),
        references: parseJsonField(references, []),
        skills: parseJsonField(skills, []),
        declaration: parseJsonField(declaration, {}),
        disclosures: disclosuresParsed,
        certifications: educationParsed.certifications || []
      };

      // Extract address fields from personal_info
      const residentialAddress = personalInfoParsed.address ? JSON.stringify(personalInfoParsed.address) : null;

      try {
        const { rows } = await query(
          `INSERT INTO job_applications
           (job_id, first_name, last_name, email, phone, resume_url, cover_letter,
            date_of_birth, gender, marital_status, nationality, national_id, residential_address,
            education_history, employment_history, skills, certifications,
            experience_years, availability_weeks, right_to_work, salary_expectation,
            status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
           RETURNING *`,
          [
            jobId,
            firstName,
            lastName,
            applicantEmail || emailValue,
            applicantPhone || phoneValue,
            cvPath || null,
            coverLetter || null,
            dobValue,
            genderValue,
            maritalStatusValue,
            nationalityValue,
            nationalIdValue,
            residentialAddress,
            toJsonb(educationParsed, null),
            toJsonb(parseJsonField(employment_history, []), null),
            toJsonb(parseJsonField(skills, []), null),
            toJsonb(educationParsed.certifications || [], null),
            disclosuresParsed.experienceYears ? parseInt(disclosuresParsed.experienceYears) : null,
            disclosuresParsed.availabilityWeeks ? parseInt(disclosuresParsed.availabilityWeeks) : null,
            disclosuresParsed.rightToWork || null,
            disclosuresParsed.salaryExpectation ? parseFloat(disclosuresParsed.salaryExpectation) : null,
            'pending'
          ]
        );
        logger.info('job.applyToJob', 'Application inserted', { id: rows[0]?.id });
        res.status(201).json(rows[0]);
      } catch (dbErr) {
        logger.error('job.applyToJob', 'Database error', dbErr, { jobId });
        throw dbErr;
      }
    } catch (err) {
      logger.error('job.applyToJob', 'Submission error', err, { jobId: req.params.id });
      res.status(400).json({ msg: 'Failed to apply', error: err.message });
    }
  },

  // 3.4.6 Application Review (manager)
  async getApplications(req, res) {
    try {
      const jobId = req.params.id;
      const applications = await JobApplication.findByJob(jobId);
      res.json(applications || []);
    } catch (err) {
      logger.error('job.getApplications', 'Failed to fetch applications', err);
      res.status(500).json({ msg: 'Failed to fetch applications', error: err.message });
    }
  },

  async getMyApplications(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

      // Get user's email from users or employees table
      const { rows: userRows } = await query(
        `SELECT u.email as user_email, e.email as employee_email
         FROM users u
         LEFT JOIN employees e ON e.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );
      const email = userRows[0]?.user_email || userRows[0]?.employee_email;

      // Fetch applications by registered email (job_applications schema uses 'email', not 'applicantEmail')
      const queryText = email
        ? `SELECT * FROM job_applications WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC`
        : `SELECT * FROM job_applications WHERE 1=0`; // return empty if no email

      const { rows } = await query(queryText, email ? [email] : []);

      res.json(rows);
    } catch (err) {
      logger.error('job.getMyApplications', err.message);
      res.status(500).json({ msg: 'Failed to fetch your applications', error: err.message });
    }
  },
  async updateApplicationStatus(req, res) {
    try {
      const { status, recruiterAnnouncement } = req.body;
      const updates = {};
      if (status !== undefined) updates.status = status;
      if (recruiterAnnouncement !== undefined) updates.recruiterAnnouncement = recruiterAnnouncement;
      const application = await JobApplication.update(req.params.appId, updates);
      res.json(application);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update application', error: err.message });
    }
  },

  async getApplicant(req, res) {
    try {
      const application = await JobApplication.findById(req.params.appId);
      if (!application || String(application.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }
      res.json(application);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch application', error: err.message });
    }
  },

  async updateApplicant(req, res) {
    try {
      const { status, recruiterAnnouncement } = req.body;
      const existing = await JobApplication.findById(req.params.appId);
      if (!existing || String(existing.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const updates = {};
      if (status) updates.status = status;
      if (recruiterAnnouncement !== undefined) updates.recruiterAnnouncement = recruiterAnnouncement;

      const updated = await JobApplication.update(req.params.appId, updates);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ msg: 'Failed to update application', error: err.message });
    }
  },

  async deleteApplicant(req, res) {
    try {
      const existing = await JobApplication.findById(req.params.appId);
      if (!existing || String(existing.jobId) !== String(req.params.jobId)) {
        return res.status(404).json({ msg: 'Application not found' });
      }
      await JobApplication.delete(req.params.appId);
      res.json({ msg: 'Application deleted' });
    } catch (err) {
      res.status(400).json({ msg: 'Failed to delete application', error: err.message });
    }
  },

  async shortlistApplication(req, res) {
    try {
      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const updated = await JobApplication.update(applicationId, {
        status: 'shortlisted',
        notes: 'Shortlisted for interview - ' + new Date().toISOString()
      });

      // Send email notification
      const { sendEmail } = require('../utils/email');
      await sendEmail({
        to: application.applicantEmail,
        subject: 'Application Shortlisted - Ubuntu HRMS',
        text: `Dear ${application.applicantName},\n\nCongratulations! Your application has been shortlisted. We will contact you soon to schedule an interview.`,
        html: `<p>Dear ${application.applicantName},</p><p>Congratulations! Your application has been shortlisted.</p><p>We will contact you soon to schedule an interview.</p>`,
      });

      // Send SMS notification
      const { sendSMS, normalizePhoneNumber } = require('../utils/sms');
      const normalizedPhone = normalizePhoneNumber(application.applicantPhone);
      logger.info('job.shortlistApplication', 'SMS attempt', { phone: normalizedPhone, original: application.applicantPhone });
      if (normalizedPhone) {
        try {
          await sendSMS({
            phone: normalizedPhone,
            message: `Dear ${application.applicantName}, your application has been shortlisted. We will contact you soon for an interview. Ubuntu HRMS`,
          });
          logger.info('job.shortlistApplication', 'SMS sent successfully', { phone: normalizedPhone });
        } catch (smsErr) {
          logger.error('job.shortlistApplication', 'SMS send failed', smsErr, { phone: normalizedPhone, response: smsErr.response?.data });
        }
      } else {
        logger.warn('job.shortlistApplication', 'No valid phone number for SMS', { applicantPhone: application.applicantPhone });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to shortlist application', error: err.message });
    }
  },

  async updateInterviewScore(req, res) {
    try {
      const { score, notes } = req.body;
      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const updated = await JobApplication.update(applicationId, {
        interview_score: score,
        interview_notes: notes,
        interview_status: 'completed',
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to update interview score', error: err.message });
    }
  },

  async validateOffer(req, res) {
    try {
      const { token } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      if (application.offer_status === 'accepted') {
        return res.status(400).json({ msg: 'Offer has already been accepted' });
      }

      // Check if offer has expired
      if (application.offerTokenExpiresAt && new Date(application.offerTokenExpiresAt) < new Date()) {
        return res.status(400).json({ msg: 'Offer has expired' });
      }

      res.json(application);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to validate offer', error: err.message });
    }
  },

  async acceptOffer(req, res) {
    try {
      const { token } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      if (!applicantPhone && !applicantNationalId) {
        return res.status(400).json({ msg: 'No phone or national ID found for verification' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_accepted',
        offer_status: 'accepted',
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to accept offer', error: err.message });
    }
  },

  async acceptOfferWithVerification(req, res) {
    try {
      const { offerToken, verificationToken, availabilityDate } = req.body;
      const application = await JobApplication.findByOfferToken(offerToken);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer link' });
      }

      // Check if offer has expired
      if (application.offerTokenExpiresAt && new Date(application.offerTokenExpiresAt) < new Date()) {
        return res.status(400).json({ msg: 'Offer has expired' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      const phoneLast4 = applicantPhone ? applicantPhone.slice(-4) : null;
      const nationalIdLast4 = applicantNationalId ? applicantNationalId.slice(-4) : null;

      if (verificationToken !== phoneLast4 && verificationToken !== nationalIdLast4) {
        return res.status(400).json({ msg: 'Invalid verification token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_accepted',
        offer_status: 'accepted',
        availability_date: availabilityDate || null,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to accept offer', error: err.message });
    }
  },

  async negotiateSalary(req, res) {
    try {
      const { token, counterOfferSalary } = req.body;
      const application = await JobApplication.findByOfferToken(token);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_sent',
        offer_status: 'negotiating',
        counter_offer_salary: counterOfferSalary,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to negotiate salary', error: err.message });
    }
  },

  async negotiateSalaryWithVerification(req, res) {
    try {
      const { offerToken, verificationToken, counterOfferSalary } = req.body;
      const application = await JobApplication.findByOfferToken(offerToken);

      if (!application) {
        return res.status(404).json({ msg: 'Invalid or expired offer link' });
      }

      // Check if offer has expired
      if (application.offerTokenExpiresAt && new Date(application.offerTokenExpiresAt) < new Date()) {
        return res.status(400).json({ msg: 'Offer has expired' });
      }

      const applicantPhone = application.applicantPhone;
      const applicantNationalId = application.personalInfo?.nationalId;

      const phoneLast4 = applicantPhone ? applicantPhone.slice(-4) : null;
      const nationalIdLast4 = applicantNationalId ? applicantNationalId.slice(-4) : null;

      if (verificationToken !== phoneLast4 && verificationToken !== nationalIdLast4) {
        return res.status(400).json({ msg: 'Invalid verification token' });
      }

      const updated = await JobApplication.update(application.id, {
        status: 'offer_sent',
        offer_status: 'negotiating',
        counter_offer_salary: counterOfferSalary,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to negotiate salary', error: err.message });
    }
  },

  async extendDeadline(req, res) {
    try {
      const { newDeadline } = req.body;
      const jobId = req.params.id;

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      const updated = await Job.update(jobId, {
        applicationDeadline: newDeadline,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to extend deadline', error: err.message });
    }
  },

  async sendOffer(req, res) {
    try {
      const {
        offerAmount,
        jobTitle,
        department,
        employmentType,
        startDate,
        reportingTo,
        workLocation,
        workingHours = '8:00 AM – 5:00 PM, Monday to Friday',
        probationPeriod = '3 months',
        offerExpiryDays = 7,
        benefits,
        additionalNotes,
      } = req.body;

      if (!offerAmount) return res.status(400).json({ msg: 'Salary offer amount is required' });

      const applicationId = req.params.appId;
      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const job = await Job.findById(application.jobId);

      const crypto = require('crypto');
      const offerToken = crypto.randomBytes(32).toString('hex');
      const offerExpiresAt = new Date();
      offerExpiresAt.setDate(offerExpiresAt.getDate() + parseInt(offerExpiryDays));
      const expiryStr = offerExpiresAt.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
      const todayStr = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

      const resolvedJobTitle = jobTitle || job?.title || 'the advertised position';
      const resolvedDept = department || job?.department || '';
      const offerLink = `${process.env.FRONTEND_URL || 'http://localhost:5177'}/offer-response?token=${offerToken}`;
      const formattedSalary = `KES ${Number(offerAmount).toLocaleString('en-KE')}`;

      const updated = await JobApplication.update(applicationId, {
        status: 'offer_sent',
        offer_token: offerToken,
        offer_token_expires_at: offerExpiresAt,
        offered_salary: parseFloat(offerAmount),
        notes: `Offer sent on ${todayStr}. Salary: ${formattedSalary}. Expires: ${expiryStr}`,
      });

      // ── Professional HTML offer letter ──────────────────────────────────────
      const benefitsList = benefits
        ? benefits.split('\n').filter(Boolean).map(b => `<li style="margin-bottom:4px;">${b.trim()}</li>`).join('')
        : '<li>As per company policy</li>';

      const offerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#CB7246 0%,#b85c30 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Offer of Employment</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Ubuntu HRMS &nbsp;·&nbsp; ${todayStr}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">

          <p style="margin:0 0 20px;font-size:15px;color:#374151;">Dear <strong>${application.applicantName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            We are delighted to offer you the position of <strong>${resolvedJobTitle}</strong>${resolvedDept ? ` within the <strong>${resolvedDept}</strong> department` : ''}.
            This letter sets out the terms and conditions of your employment.
          </p>

          <!-- Details table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9fafb;">
              <td colspan="2" style="padding:12px 18px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#9ca3af;">Position Details</td>
            </tr>
            ${resolvedJobTitle ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;width:45%;border-top:1px solid #f3f4f6;">Job Title</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${resolvedJobTitle}</td></tr>` : ''}
            ${resolvedDept ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Department</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${resolvedDept}</td></tr>` : ''}
            ${employmentType ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Employment Type</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${employmentType}</td></tr>` : ''}
            ${startDate ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Start Date</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${new Date(startDate).toLocaleDateString('en-KE', { year:'numeric',month:'long',day:'numeric' })}</td></tr>` : ''}
            ${reportingTo ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Reporting To</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${reportingTo}</td></tr>` : ''}
            ${workLocation ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Work Location</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${workLocation}</td></tr>` : ''}
            ${workingHours ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Working Hours</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${workingHours}</td></tr>` : ''}
            ${probationPeriod ? `<tr><td style="padding:10px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Probation Period</td><td style="padding:10px 18px;font-size:14px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6;">${probationPeriod}</td></tr>` : ''}
          </table>

          <!-- Compensation -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9fafb;">
              <td colspan="2" style="padding:12px 18px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#9ca3af;">Compensation</td>
            </tr>
            <tr>
              <td style="padding:12px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;width:45%;">Gross Monthly Salary</td>
              <td style="padding:12px 18px;font-size:20px;color:#CB7246;font-weight:700;border-top:1px solid #f3f4f6;">${formattedSalary}</td>
            </tr>
            ${benefits ? `<tr><td style="padding:12px 18px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Benefits &amp; Allowances</td><td style="padding:12px 18px;font-size:14px;color:#111827;border-top:1px solid #f3f4f6;"><ul style="margin:0;padding-left:18px;">${benefitsList}</ul></td></tr>` : ''}
          </table>

          ${additionalNotes ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fde68a;background:#fffbeb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#92400e;">Additional Notes</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${additionalNotes.replace(/\n/g, '<br>')}</p>
            </td></tr>
          </table>` : ''}

          <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
            Please review this offer carefully. You may <strong>accept</strong> or <strong>negotiate</strong> the salary using the link below.
            This offer expires on <strong>${expiryStr}</strong>.
          </p>

          <!-- CTA button -->
          <div style="text-align:center;margin:28px 0;">
            <a href="${offerLink}" style="display:inline-block;background:#CB7246;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
              Review &amp; Respond to Offer
            </a>
          </div>

          <p style="margin:0 0 6px;font-size:14px;color:#6b7280;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:13px;color:#CB7246;word-break:break-all;">${offerLink}</p>

          <p style="margin:0;font-size:14px;color:#374151;">Warm regards,<br><strong>Ubuntu HRMS Recruitment Team</strong></p>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This offer is confidential and intended solely for ${application.applicantName}.<br>© ${new Date().getFullYear()} Ubuntu HRMS. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const { sendEmail } = require('../utils/email');
      await sendEmail({
        to: application.applicantEmail,
        subject: `Offer of Employment — ${resolvedJobTitle} | Ubuntu HRMS`,
        html: offerHtml,
        text: `Dear ${application.applicantName},\n\nWe are pleased to offer you the position of ${resolvedJobTitle}${resolvedDept ? ` in the ${resolvedDept} department` : ''}.\n\nGross Monthly Salary: ${formattedSalary}\n${startDate ? `Start Date: ${startDate}\n` : ''}${workLocation ? `Work Location: ${workLocation}\n` : ''}${reportingTo ? `Reporting To: ${reportingTo}\n` : ''}${probationPeriod ? `Probation: ${probationPeriod}\n` : ''}${benefits ? `Benefits: ${benefits}\n` : ''}\nThis offer expires on: ${expiryStr}\n\nReview and respond at: ${offerLink}\n\nWarm regards,\nUbuntu HRMS Recruitment Team`,
      });

      // SMS notification
      const { sendSMS, normalizePhoneNumber } = require('../utils/sms');
      const normalizedPhone = normalizePhoneNumber(application.applicantPhone);
      if (normalizedPhone) {
        await sendSMS({
          phone: normalizedPhone,
          message: `Dear ${application.applicantName}, you have received a job offer for ${resolvedJobTitle} from Ubuntu HRMS. Salary: ${formattedSalary}. Offer expires ${expiryStr}. Review: ${offerLink}`,
        });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to send offer', error: err.message });
    }
  },

  async filterApplicants(req, res) {
    try {
      const { jobId } = req.params;
      const { filters } = req.body;

      const applications = await JobApplication.findByJob(jobId);
      const job = await Job.findById(jobId);

      let filtered = applications;

      if (filters && Array.isArray(filters)) {
        filtered = applications.filter(app => {
          const personalInfo = app.personalInfo || {};
          const addressInfo = app.addressInfo || {};
          const positionDetails = app.positionDetails || {};
          const education = app.education || {};
          const employmentHistory = app.employmentHistory || [];
          const skills = app.skills || {};

          return filters.every(filter => {
            const { field, operator, value } = filter;

            switch (field) {
              case 'gender':
                if (operator === 'equals') return personalInfo.gender === value;
                if (operator === 'not_equals') return personalInfo.gender !== value;
                return false;

              case 'nationality':
                if (operator === 'equals') return personalInfo.nationality === value;
                if (operator === 'not_equals') return personalInfo.nationality !== value;
                return false;

              case 'age':
                const dob = personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : null;
                if (!dob) return false;
                const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
                if (operator === 'gte') return age >= value;
                if (operator === 'lte') return age <= value;
                if (operator === 'equals') return age === value;
                return false;

              case 'location':
                const city = addressInfo.residentialAddress?.city || '';
                if (operator === 'equals') return city.toLowerCase() === value.toLowerCase();
                if (operator === 'contains') return city.toLowerCase().includes(value.toLowerCase());
                return false;

              case 'willingToRelocate':
                return positionDetails.willingToRelocate === value;

              case 'willingToTravel':
                return positionDetails.willingToTravel === value;

              case 'expectedSalary':
                const salary = parseFloat(positionDetails.expectedSalary) || 0;
                const filterSalary = parseFloat(value) || 0;
                if (operator === 'lte') return salary <= filterSalary;
                if (operator === 'gte') return salary >= filterSalary;
                return false;

              case 'qualification':
                const qualifications = education.furtherEducation || [];
                const hasQualification = qualifications.some(edu => 
                  edu.qualification?.toLowerCase() === value.toLowerCase()
                );
                return hasQualification;

              case 'yearsExperience':
                const totalYears = employmentHistory.reduce((sum, work) => {
                  if (work.startDate && work.endDate) {
                    const start = new Date(work.startDate);
                    const end = new Date(work.endDate);
                    return sum + (end.getFullYear() - start.getFullYear());
                  }
                  return sum;
                }, 0);
                if (operator === 'gte') return totalYears >= value;
                if (operator === 'lte') return totalYears <= value;
                return false;

              case 'hasCertifications':
                const certs = education.certifications || [];
                return certs.length > 0;

              case 'language':
                const languages = skills.languages || [];
                return languages.some(lang =>
                  lang.language?.toLowerCase().includes(value.toLowerCase())
                );

              case 'experienceYears':
                const expYears = disclosures?.experienceYears || 0;
                if (operator === 'gte') return expYears >= value;
                if (operator === 'lte') return expYears <= value;
                return false;

              case 'availabilityWeeks':
                const availWeeks = disclosures?.availabilityWeeks || 0;
                if (operator === 'lte') return availWeeks <= value;
                return false;

              case 'rightToWork':
                return disclosures?.rightToWork === value;

              case 'salaryExpectation':
                const disclosureSalary = disclosures?.salaryExpectation || 0;
                const disclosureFilterSalary = parseFloat(value) || 0;
                if (operator === 'lte') return disclosureSalary <= disclosureFilterSalary;
                if (operator === 'gte') return disclosureSalary >= disclosureFilterSalary;
                return false;

              default:
                return true;
            }
          });
        });
      }

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to filter applicants', error: err.message });
    }
  },

  async scoreApplicants(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ msg: 'Job not found' });

      const applications = await JobApplication.findByJob(req.params.id);
      const jobRequirements = job.requirements || '';
      const jobSkills = job.skills || [];
      const jobLocation = job.location || '';
      const jobEducation = job.education || '';
      const jobExperience = job.experience || 0;

      const scored = applications.map(app => {
        const appData = app.applicationData || {};
        const workHistory = appData.workHistory || [];
        const education = appData.education || [];
        const coverLetter = app.coverLetter || '';
        const appSkills = app.skills || [];
        const appLocation = app.addressInfo?.residentialAddress?.city || '';
        const positionDetails = app.positionDetails || {};

        // Skills matching (0-100)
        let skillsScore = 0;
        if (jobSkills.length > 0) {
          const matchedSkills = jobSkills.filter(skill => 
            appSkills.some(appSkill => 
              appSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          skillsScore = (matchedSkills.length / jobSkills.length) * 100;
        }

        // Experience matching (0-100)
        let experienceScore = 0;
        const totalYears = workHistory.reduce((sum, w) => {
          if (w.startDate && w.endDate) {
            const start = new Date(w.startDate);
            const end = new Date(w.endDate);
            return sum + (end.getFullYear() - start.getFullYear());
          }
          return sum;
        }, 0);
        if (jobExperience > 0) {
          experienceScore = Math.min(100, (totalYears / jobExperience) * 100);
        }

        // Education matching (0-100)
        let educationScore = 0;
        if (jobEducation) {
          const hasRequiredEducation = education.some(edu => 
            edu.qualification?.toLowerCase().includes(jobEducation.toLowerCase())
          );
          educationScore = hasRequiredEducation ? 100 : 0;
        }

        // Location matching (0-100)
        let locationScore = 0;
        if (jobLocation && appLocation) {
          locationScore = appLocation.toLowerCase().includes(jobLocation.toLowerCase()) ? 100 : 0;
        }

        // Final score = average of all criteria
        const finalScore = (skillsScore + experienceScore + educationScore + locationScore) / 4;

        const rankingBreakdown = {
          skills: { score: skillsScore, matched: jobSkills.filter(skill => 
            appSkills.some(appSkill => appSkill.toLowerCase().includes(skill.toLowerCase()))
          ), total: jobSkills.length },
          experience: { score: experienceScore, years: totalYears, required: jobExperience },
          education: { score: educationScore, matched: education.some(edu => 
            edu.qualification?.toLowerCase().includes(jobEducation.toLowerCase())
          ), required: jobEducation },
          location: { score: locationScore, applicantLocation: appLocation, required: jobLocation }
        };

        return {
          applicationId: app.id,
          applicantName: app.applicantName,
          applicantEmail: app.applicantEmail,
          matchScore: Math.round(finalScore),
          rankingBreakdown
        };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);

      // Save scores to DB using existing ai_ranking and ai_ranking_breakdown columns
      for (const scoredApp of scored) {
        await query(
          `UPDATE job_applications 
           SET ai_ranking = $1, ai_ranking_breakdown = $2 
           WHERE id = $3`,
          [scoredApp.matchScore, JSON.stringify(scoredApp.rankingBreakdown), scoredApp.applicationId]
        );
      }

      res.json(scored);
    } catch (err) {
      res.status(500).json({ msg: 'Scoring failed', error: err.message });
    }
  },

  async reallocateRating(req, res) {
    try {
      const { applicationId, newScore, reason } = req.body;
      
      if (!applicationId || newScore === undefined) {
        return res.status(400).json({ msg: 'applicationId and newScore are required' });
      }

      if (newScore < 0 || newScore > 100) {
        return res.status(400).json({ msg: 'newScore must be between 0 and 100' });
      }

      // Update the score using existing columns
      await query(
        `UPDATE job_applications 
         SET ai_ranking = $1, 
             ai_ranking_breakdown = jsonb_set(
               COALESCE(ai_ranking_breakdown, '{}'::jsonb),
               '{manual_override}',
               $2::jsonb
             )
         WHERE id = $3`,
        [newScore, JSON.stringify({ score: newScore, reason, overriddenBy: req.user.id, overriddenAt: new Date() }), applicationId]
      );

      res.json({ success: true, newScore });
    } catch (err) {
      res.status(500).json({ msg: 'Failed to reallocate rating', error: err.message });
    }
  },

  async reverseRating(req, res) {
    try {
      const { applicationId } = req.params;
      
      // Remove manual override and recalculate
      const { rows } = await query(
        `SELECT ai_ranking_breakdown FROM job_applications WHERE id = $1`,
        [applicationId]
      );

      if (!rows[0]) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const breakdown = rows[0].ai_ranking_breakdown;
      if (breakdown && breakdown.manual_override) {
        delete breakdown.manual_override;
        
        await query(
          `UPDATE job_applications 
           SET ai_ranking_breakdown = $1 
           WHERE id = $2`,
          [JSON.stringify(breakdown), applicationId]
        );
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ msg: 'Failed to reverse rating', error: err.message });
    }
  },

  async importApplicationToEmployee(req, res) {
    try {
      const { appId, employeeId } = req.params;

      const application = await JobApplication.findById(appId);
      if (!application) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }

      // Map application data to employee fields
      const updateData = {};

      if (application.personalInfo) {
        updateData.dateOfBirth = application.personalInfo.dateOfBirth;
        updateData.gender = application.personalInfo.gender;
        updateData.maritalStatus = application.personalInfo.maritalStatus;
        updateData.nationality = application.personalInfo.nationality;
        updateData.nationalId = application.personalInfo.nationalId;
      }

      if (application.addressInfo) {
        updateData.residentialAddress = application.addressInfo.residentialAddress;
        updateData.emergencyContact = application.addressInfo.emergencyContact;
      }

      if (application.education) {
        updateData.educationHistory = application.education;
        updateData.certifications = application.education.certifications || [];
      }

      if (application.employmentHistory) {
        updateData.employmentHistory = application.employmentHistory;
      }

      if (application.skills) {
        updateData.skills = application.skills;
      }

      if (application.disclosures) {
        updateData.experienceYears = application.disclosures.experienceYears;
        updateData.availabilityWeeks = application.disclosures.availabilityWeeks;
        updateData.rightToWork = application.disclosures.rightToWork;
        updateData.salaryExpectation = application.disclosures.salaryExpectation;
      }

      // Also update the employee_id on the job application
      await JobApplication.update(appId, { employeeId: parseInt(employeeId) });

      const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData);

      res.json({
        msg: 'Application data imported successfully',
        employee: updatedEmployee,
      });
    } catch (err) {
      res.status(500).json({ msg: 'Import failed', error: err.message });
    }
  },

  async getApplicationsByEmployee(req, res) {
    try {
      const { employeeId } = req.params;
      
      // First try to find by employee_id
      let applications = await JobApplication.findByEmployeeId(employeeId);
      
      // If no results, try to find by employee email
      if (!applications || applications.length === 0) {
        const employee = await Employee.findById(employeeId);
        if (employee && employee.email) {
          applications = await JobApplication.findByApplicantEmail(employee.email);
        }
      }
      
      res.json(applications || []);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch applications', error: err.message });
    }
  },

  async getApplicationsByApplicant(req, res) {
    try {
      const { email } = req.params;
      const applications = await JobApplication.findByApplicantEmail(email);
      res.json(applications || []);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to fetch applications', error: err.message });
    }
  },

  async createInterviewInvite(req, res) {
    console.log('=== createInterviewInvite START ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    try {
      const applicationId = req.params.appId;
      const { interviewerEmails, customMetrics } = req.body;
      logger.info('job.createInterviewInvite', 'Request received', { applicationId, interviewerEmails, customMetrics });

      console.log('Finding application with ID:', applicationId);
      const application = await JobApplication.findById(applicationId);
      console.log('Application found:', !!application);
      console.log('Application data keys:', Object.keys(application || {}));
      console.log('Applicant name:', application?.applicantName);
      console.log('Applicant email:', application?.applicantEmail);
      
      if (!application) {
        console.log('Application not found - returning 404');
        return res.status(404).json({ msg: 'Application not found' });
      }

      console.log('Finding job with ID:', application.jobId);
      const job = await Job.findById(application.jobId);
      console.log('Job found:', !!job);
      if (!job) {
        console.log('Job not found - returning 404');
        return res.status(404).json({ msg: 'Job not found' });
      }

      // Generate PDF checklist
      const { generateInterviewChecklist } = require('../utils/pdfGenerator');
      const fs = require('fs');
      const path = require('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/interviews');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const applicantName = (application.applicantName || 'unknown').replace(/\s+/g, '-');
      const filename = `interview-checklist-${applicantName}-${timestamp}.pdf`;
      const outputPath = path.join(uploadsDir, filename);
      
      // Generate the PDF
      await generateInterviewChecklist(application, job, customMetrics || [], outputPath);
      console.log('PDF generated at:', outputPath);
      
      // Update application with interview invitation info
      const interviewInvitations = application.interviewInvitations || [];
      const invitationData = {
        pdfPath: filename,
        panelists: interviewerEmails || [],
        customMetrics: customMetrics || [],
        createdAt: new Date().toISOString(),
      };
      
      interviewInvitations.push(invitationData);

      console.log('Interview invitations data:', JSON.stringify(interviewInvitations, null, 2));
      logger.info('job.createInterviewInvite', 'Updating application', { applicationId, interviewInvitationsCount: interviewInvitations.length });
      
      const updated = await JobApplication.update(applicationId, {
        interview_invitations: JSON.stringify(interviewInvitations),
      });
      logger.info('job.createInterviewInvite', 'Application updated successfully');

      // Send simple email with PDF attachment
      const { sendEmail } = require('../utils/email');
      
      if (interviewerEmails && Array.isArray(interviewerEmails)) {
        for (const email of interviewerEmails) {
          try {
            console.log(`Sending email to: ${email}`);
            const result = await sendEmail({
              to: email,
              subject: `Interview Evaluation Checklist - ${application.applicantName}`,
              text: `Please find attached the interview evaluation checklist for ${application.applicantName} applying for ${job.title}.\n\nComplete the checklist and return it to HR/Manager for score entry.`,
              html: `<p>Please find attached the interview evaluation checklist for <strong>${application.applicantName}</strong> applying for <strong>${job.title}</strong>.</p><p>Complete the checklist and return it to HR/Manager for score entry.</p>`,
              attachments: [{
                filename: filename,
                path: outputPath
              }]
            });
            
            if (result.sent) {
              console.log(`Email successfully sent to: ${email}`);
              logger.info('job.createInterviewInvite', 'PDF checklist sent', { to: email });
            } else {
              console.error(`Email failed to send to: ${email}. Reason: ${result.reason}`);
              logger.error('job.createInterviewInvite', 'Email send failed', { to: email, reason: result.reason });
            }
          } catch (emailErr) {
            console.error(`Exception sending email to ${email}:`, emailErr);
            logger.error('job.createInterviewInvite', 'Failed to send email', emailErr);
          }
        }
      }

      console.log('=== createInterviewInvite SUCCESS ===');
      res.json({ 
        message: 'Interview checklist generated and sent',
        pdfPath: filename,
        panelists: interviewerEmails,
        updated 
      });
    } catch (err) {
      console.error('=== createInterviewInvite ERROR ===', err);
      logger.error('job.createInterviewInvite', 'Failed to create interview invite', err, { stack: err.stack });
      res.status(500).json({ msg: 'Failed to create interview invite', error: err.message });
    }
  },

  async inputPanelistScores(req, res) {
    try {
      const applicationId = req.params.appId;
      const { panelistName, panelistEmail, scores, comments, overallRecommendation, interviewInvitationId } = req.body;
      
      logger.info('job.inputPanelistScores', 'Request received', { applicationId, panelistName, panelistEmail, interviewInvitationId });

      const application = await JobApplication.findById(applicationId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      // Find the specific interview invitation
      let selectedInvitation = null;
      if (interviewInvitationId && application.interviewInvitations) {
        selectedInvitation = application.interviewInvitations.find(inv => inv.createdAt === interviewInvitationId);
      }

      const interviewFeedbacks = application.interviewFeedbacks || [];
      interviewFeedbacks.push({
        panelistName,
        panelistEmail,
        scores: scores || {},
        comments: comments || '',
        overallRecommendation: overallRecommendation || '',
        interviewInvitationId: interviewInvitationId,
        interviewRound: selectedInvitation ? `Round ${application.interviewInvitations.indexOf(selectedInvitation) + 1}` : 'Unknown',
        submittedAt: new Date(),
        submittedBy: req.user.id,
      });

      // Calculate average score from all panelists
      let totalScore = 0;
      let totalMaxScore = 0;
      let scoreCount = 0;
      
      interviewFeedbacks.forEach(feedback => {
        if (feedback.scores) {
          Object.values(feedback.scores).forEach(score => {
            if (typeof score === 'number') {
              totalScore += score;
              scoreCount++;
            }
          });
        }
      });
      
      // Assuming max score of 100 per panelist for now
      totalMaxScore = scoreCount * 100;
      const averageScore = scoreCount > 0 ? Math.round((totalScore / scoreCount)) : 0;

      const updated = await JobApplication.update(applicationId, {
        interview_feedbacks: JSON.stringify(interviewFeedbacks),
        interview_score: averageScore,
        interview_status: 'interview_completed',
      });

      logger.info('job.inputPanelistScores', 'Scores input successfully', { applicationId, averageScore });
      res.json({ 
        message: 'Panelist scores recorded successfully',
        averageScore,
        totalPanelists: interviewFeedbacks.length,
        updated 
      });
    } catch (err) {
      logger.error('job.inputPanelistScores', 'Failed to input panelist scores', err);
      res.status(500).json({ msg: 'Failed to input panelist scores', error: err.message });
    }
  },

  async submitInterviewFeedback(req, res) {
    try {
      const { appId, token } = req.params;
      const { interviewerName, interviewerEmail, metrics, comments } = req.body;

      const application = await JobApplication.findById(appId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const interviewInvitations = application.interviewInvitations || [];
      const invite = interviewInvitations.find(inv => inv.mainToken === token);

      if (!invite) {
        return res.status(404).json({ msg: 'Invalid interview token' });
      }

      // Calculate overall grade (average of all metric scores)
      const metricScores = metrics.map(m => m.score || 0);
      const overallGrade = metricScores.length > 0
        ? metricScores.reduce((a, b) => a + b, 0) / metricScores.length
        : 0;

      const feedback = {
        interviewerName,
        interviewerEmail,
        metrics,
        comments,
        overallGrade,
        submittedAt: new Date(),
      };

      const interviewFeedbacks = application.interviewFeedbacks || [];
      interviewFeedbacks.push(feedback);

      const updated = await JobApplication.update(appId, {
        interview_feedbacks: JSON.stringify(interviewFeedbacks),
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to submit interview feedback', error: err.message });
    }
  },

  async getInterviewSummary(req, res) {
    try {
      const { appId } = req.params;
      const application = await JobApplication.findById(appId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const feedbacks = application.interviewFeedbacks || [];

      // Calculate average scores across all interviewers
      const summary = {
        totalInterviewers: feedbacks.length,
        averageOverallGrade: 0,
        metricAverages: {},
        feedbacks: feedbacks,
      };

      if (feedbacks.length > 0) {
        const totalGrade = feedbacks.reduce((sum, f) => sum + (f.overallGrade || 0), 0);
        summary.averageOverallGrade = totalGrade / feedbacks.length;

        // Calculate averages for each metric
        const allMetrics = feedbacks.flatMap(f => f.metrics || []);
        const metricMap = {};
        allMetrics.forEach(m => {
          if (!metricMap[m.name]) {
            metricMap[m.name] = { total: 0, count: 0 };
          }
          metricMap[m.name].total += m.score || 0;
          metricMap[m.name].count += 1;
        });

        Object.keys(metricMap).forEach(name => {
          summary.metricAverages[name] = metricMap[name].total / metricMap[name].count;
        });
      }

      res.json(summary);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to get interview summary', error: err.message });
    }
  },

  async getShortlisted(req, res) {
    try {
      const applications = await JobApplication.findShortlisted();
      logger.info('job.getShortlisted', `Found ${applications.length} shortlisted applications`);
      res.json(applications || []);
    } catch (err) {
      logger.error('job.getShortlisted', 'Failed to get shortlisted applications', err);
      res.status(500).json({ msg: 'Failed to get shortlisted applications', error: err.message });
    }
  },

  async getInterviewDetail(req, res) {
    try {
      const { appId } = req.params;
      const application = await JobApplication.findById(appId);
      if (!application) return res.status(404).json({ msg: 'Application not found' });

      const feedbacks = application.interviewFeedbacks || [];
      let averageOverallGrade = 0;
      const metricAverages = {};

      if (feedbacks.length > 0) {
        const totalGrade = feedbacks.reduce((sum, f) => sum + (f.overallGrade || 0), 0);
        averageOverallGrade = totalGrade / feedbacks.length;

        feedbacks.forEach(fb => {
          (fb.metrics || []).forEach(m => {
            if (!metricAverages[m.name]) metricAverages[m.name] = { total: 0, count: 0 };
            metricAverages[m.name].total += m.score || 0;
            metricAverages[m.name].count += 1;
          });
        });

        Object.keys(metricAverages).forEach(name => {
          metricAverages[name] = metricAverages[name].total / metricAverages[name].count;
        });
      }

      res.json({
        ...application,
        interviewSummary: {
          totalInterviewers: feedbacks.length,
          averageOverallGrade,
          metricAverages,
          feedbacks,
        }
      });
    } catch (err) {
      res.status(500).json({ msg: 'Failed to get interview detail', error: err.message });
    }
  },

  async getAllApplications(req, res) {
    try {
      const applications = await JobApplication.findAllWithJobs();
      res.json(applications);
    } catch (err) {
      logger.error('job.getAllApplications', 'Failed to get all applications', err);
      res.status(500).json({ msg: 'Failed to get all applications', error: err.message });
    }
  },
};

module.exports = jobController;
