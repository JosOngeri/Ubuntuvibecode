const pool = require('./config/db').pool;

async function testSendOffer() {
  try {
    // Get shortlisted applications for job 6
    const { rows: apps } = await pool.query(
      `SELECT id, job_id, first_name, last_name, email, phone, status, salary_expectation 
       FROM job_applications 
       WHERE job_id = $1 AND status = 'shortlisted'`,
      [6]
    );
    
    console.log('Found shortlisted applicants for job 6:');
    apps.forEach(app => {
      console.log(`  ID: ${app.id}, Name: ${app.first_name} ${app.last_name}, Email: ${app.email}, Phone: ${app.phone}`);
    });
    
    if (apps.length === 0) {
      console.log('No shortlisted applicants found for job 6');
      pool.end();
      return;
    }
    
    // Test with first shortlisted applicant
    const app = apps[0];
    const offerAmount = app.salary_expectation || 50000;
    
    console.log(`\nSending offer to applicant ${app.id} (${app.first_name} ${app.last_name})...`);
    console.log(`  Email: ${app.email}`);
    console.log(`  Phone: ${app.phone}`);
    console.log(`  Offer Amount: ${offerAmount}`);
    
    // Simulate the send-offer API call
    const offerToken = require('crypto').randomBytes(32).toString('hex');
    const offerExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Update the application
    await pool.query(
      `UPDATE job_applications 
       SET status = 'offer_sent',
           notes = COALESCE(notes, '') || '\\nOffer sent: ' || $1 || '. Token: ' || $2 || '. Expires: ' || $3
       WHERE id = $4`,
      [offerAmount, offerToken, offerExpiresAt.toISOString(), app.id]
    );
    
    console.log('\nOffer updated in database');
    
    // Test email
    try {
      const { sendEmail } = require('./utils/email');
      await sendEmail({
        to: app.email,
        subject: 'Job Offer - Ubuntu HRMS',
        text: `Dear ${app.first_name} ${app.last_name},\n\nWe are pleased to offer you the position. Offer amount: ${offerAmount}.\n\nPlease respond within 7 days.`,
        html: `<p>Dear ${app.first_name} ${app.last_name},</p><p>We are pleased to offer you the position.</p><p>Offer amount: <strong>${offerAmount}</strong></p><p>Please respond within 7 days.</p>`
      });
      console.log('✓ Email sent successfully');
    } catch (emailErr) {
      console.log('✗ Email failed:', emailErr.message);
    }
    
    // Test SMS
    try {
      const { sendSMS, normalizePhoneNumber } = require('./utils/sms');
      const normalizedPhone = normalizePhoneNumber(app.phone);
      if (normalizedPhone) {
        const result = await sendSMS({
          phone: normalizedPhone,
          message: `Dear ${app.first_name}, you have received a job offer! Check your email for details. Ubuntu HRMS`
        });
        if (result.sent) {
          console.log('✓ SMS sent successfully');
        } else {
          console.log('✗ SMS failed:', result.reason);
        }
      } else {
        console.log('✗ No valid phone number for SMS');
      }
    } catch (smsErr) {
      console.log('✗ SMS error:', smsErr.message);
    }
    
    pool.end();
    
  } catch (err) {
    console.error('Test failed:', err);
    pool.end();
  }
}

testSendOffer();
