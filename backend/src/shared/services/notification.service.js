/**
 * Notification Service
 * Centralized service for sending notifications across the system
 * Supports email, in-app, and push notifications
 */

const logger = require('../../utils/logger');
const { sendEmail } = require('../../utils/email');

const notificationService = {
  /**
   * Send email notification
   * @param {Object} options - Email options
   * @returns {Promise<boolean>}
   */
  async sendEmail(options) {
    const { to, subject, text, html } = options;

    try {
      await sendEmail({ to, subject, text, html });
      logger.info('notification.service.sendEmail', 'Success', { to, subject });
      return true;
    } catch (error) {
      logger.error('notification.service.sendEmail', 'Failed', {
        to,
        subject,
        error: error.message,
      });
      return false;
    }
  },

  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @returns {Promise<boolean>}
   */
  async sendWelcomeEmail(user) {
    const { email, firstName } = user;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Ubuntu HRMS',
      text: `Hello ${firstName},\n\nWelcome to Ubuntu HRMS! Your account has been created successfully.\n\nPlease log in to get started.`,
      html: `<p>Hello ${firstName},</p><p>Welcome to Ubuntu HRMS! Your account has been created successfully.</p><p>Please log in to get started.</p>`,
    });
  },

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @returns {Promise<boolean>}
   */
  async sendPasswordResetEmail(user, resetToken) {
    const { email, firstName } = user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset - Ubuntu HRMS',
      text: `Hello ${firstName},\n\nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
      html: `<p>Hello ${firstName},</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link will expire in 1 hour.</p>`,
    });
  },

  /**
   * Send interview invitation email
   * @param {Object} application - Application object
   * @param {Date} interviewDate - Interview date
   * @returns {Promise<boolean>}
   */
  async sendInterviewInvitation(application, interviewDate) {
    const { applicantEmail, applicantName } = application;

    return await this.sendEmail({
      to: applicantEmail,
      subject: 'Interview Invitation - Ubuntu HRMS',
      text: `Hello ${applicantName},\n\nYou have been shortlisted for an interview.\n\nInterview Date: ${interviewDate}\n\nPlease confirm your attendance.`,
      html: `<p>Hello ${applicantName},</p><p>You have been shortlisted for an interview.</p><p><strong>Interview Date:</strong> ${interviewDate}</p><p>Please confirm your attendance.</p>`,
    });
  },

  /**
   * Send job offer email
   * @param {Object} application - Application object
   * @param {Object} offerData - Offer details
   * @returns {Promise<boolean>}
   */
  async sendJobOfferEmail(application, offerData) {
    const { applicantEmail, applicantName } = application;
    const { offeredSalary, offerLink } = offerData;

    return await this.sendEmail({
      to: applicantEmail,
      subject: 'Job Offer - Ubuntu HRMS',
      text: `Hello ${applicantName},\n\nCongratulations! We are pleased to offer you the position.\n\nOffer Details:\nSalary: ${offeredSalary}\n\nPlease respond to this offer using the link below:\n${offerLink}`,
      html: `<p>Hello ${applicantName},</p><p>Congratulations! We are pleased to offer you the position.</p><p><strong>Offer Details:</strong></p><p>Salary: ${offeredSalary}</p><p>Please respond to this offer using the link below:</p><p><a href="${offerLink}">Respond to Offer</a></p>`,
    });
  },

  /**
   * Send leave request notification
   * @param {Object} leaveRequest - Leave request object
   * @param {Array} recipients - Email recipients
   * @returns {Promise<boolean>}
   */
  async sendLeaveRequestNotification(leaveRequest, recipients) {
    const { employeeName, startDate, endDate, reason } = leaveRequest;

    return await this.sendEmail({
      to: recipients.join(','),
      subject: `Leave Request - ${employeeName}`,
      text: `Leave request submitted:\n\nEmployee: ${employeeName}\nFrom: ${startDate}\nTo: ${endDate}\nReason: ${reason}`,
      html: `<p><strong>Leave Request Submitted</strong></p><p>Employee: ${employeeName}</p><p>From: ${startDate}</p><p>To: ${endDate}</p><p>Reason: ${reason}</p>`,
    });
  },

  /**
   * Send payroll notification
   * @param {Object} payslip - Payslip object
   * @param {string} recipientEmail - Recipient email
   * @returns {Promise<boolean>}
   */
  async sendPayslipNotification(payslip, recipientEmail) {
    const { period, netPay } = payslip;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Payslip Available - ${period}`,
      text: `Your payslip for ${period} is now available.\n\nNet Pay: ${netPay}`,
      html: `<p>Your payslip for <strong>${period}</strong> is now available.</p><p><strong>Net Pay:</strong> ${netPay}</p>`,
    });
  },
};

module.exports = notificationService;
