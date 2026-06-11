/**
 * Email Utility
 * Simple email utility for the application
 */

const sendEmail = async options => {
  const { to, subject } = options;
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  // In production, this would use a real email service like nodemailer
  // eslint-disable-next-line no-unused-vars
  const { text, html } = options;
  return Promise.resolve({ sent: true });
};

module.exports = { sendEmail };
