const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Ubuntu Eco Lodge HRMS" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info('email', `Sent to ${to}: ${subject}`, { messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('email', `Failed to send to ${to}`, err);
    return { success: false, error: err.message };
  }
};

const pingSmtp = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

module.exports = { sendEmail, pingSmtp };
