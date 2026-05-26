const axios = require('axios');
const logger = require('./logger');

const SMS_BASE_URL = 'https://sms.blessedtexts.com/api/sms/v1';

const sendSMS = async (phone, message) => {
  try {
    const phones = Array.isArray(phone) ? phone.join(',') : phone;
    const resp = await axios.post(`${SMS_BASE_URL}/sendsms`, null, {
      params: {
        api_key: process.env.BLESSED_TEXT_API_KEY,
        sender_id: process.env.BLESSED_TEXT_SENDER_ID || '23107',
        message,
        phone: phones,
      },
      timeout: 10000,
    });
    const statusCode = resp.data?.status_code || resp.data?.code;
    if (statusCode === 1000) {
      logger.info('sms', `Sent to ${phones}`);
      return { success: true };
    }
    if (statusCode === 1009) {
      logger.warn('sms', 'Low SMS credits');
      return { success: false, error: 'Low SMS credits' };
    }
    logger.warn('sms', `Unexpected status code: ${statusCode}`, { data: resp.data });
    return { success: false, error: `Status: ${statusCode}` };
  } catch (err) {
    logger.error('sms', 'SMS send failed', err);
    return { success: false, error: err.message };
  }
};

const getSMSBalance = async () => {
  try {
    const resp = await axios.get(`${SMS_BASE_URL}/balance`, {
      params: { api_key: process.env.BLESSED_TEXT_API_KEY },
      timeout: 5000,
    });
    return { success: true, balance: resp.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { sendSMS, getSMSBalance };
