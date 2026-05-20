const axios = require('axios');

const SMS_API_BASE_URL = 'https://sms.blessedtexts.com/api/sms/v1';
const SMS_API_KEY = process.env.BLESSED_TEXT_API_KEY;
const SMS_SENDER_ID = process.env.BLESSED_TEXT_SENDER_ID || '23107';

/**
 * Send SMS to single or multiple recipients
 * @param {Object} options - SMS options
 * @param {string} options.message - Message content
 * @param {string|string[]} options.phone - Phone number(s) - formats: 722XXXXXX, 0722XXXXXX, or 254722XXXXXX
 * @param {string} [options.senderId] - Sender ID (defaults to env var)
 * @returns {Promise<Object>} Response with success status and details
 */
const sendSMS = async ({ message, phone, senderId }) => {
  if (!SMS_API_KEY) {
    return {
      sent: false,
      reason: 'SMS API key not configured. Set BLESSED_TEXT_API_KEY environment variable.',
    };
  }

  if (!message || !phone) {
    return {
      sent: false,
      reason: 'Message and phone number are required.',
    };
  }

  try {
    const sender = senderId || SMS_SENDER_ID;
    const phoneNumbers = Array.isArray(phone) ? phone.join(',') : phone;

    const response = await axios.post(
      `${SMS_API_BASE_URL}/sendsms`,
      {
        api_key: SMS_API_KEY,
        sender_id: sender,
        message,
        phone: phoneNumbers,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const data = response.data;

    // Check if any message failed
    if (Array.isArray(data)) {
      const failed = data.filter((item) => item.status_code !== '1000');
      if (failed.length > 0) {
        return {
          sent: false,
          reason: `Some messages failed: ${failed.map((f) => f.status_desc).join(', ')}`,
          details: data,
        };
      }
    } else if (data.status_code !== '1000') {
      return {
        sent: false,
        reason: data.status_desc || 'SMS sending failed',
        details: data,
      };
    }

    return {
      sent: true,
      details: data,
    };
  } catch (error) {
    console.error('SMS send failed:', error.message);
    return {
      sent: false,
      reason: error.message,
    };
  }
};

/**
 * Send different messages to different phone numbers in one request
 * @param {Object} options - Bulk SMS options
 * @param {Array<{phone: string, message: string}>} options.messages - Array of phone and message pairs
 * @param {string} [options.senderId] - Sender ID (defaults to env var)
 * @returns {Promise<Object>} Response with success status and details
 */
const sendBulkSMS = async ({ messages, senderId }) => {
  if (!SMS_API_KEY) {
    return {
      sent: false,
      reason: 'SMS API key not configured. Set BLESSED_TEXT_API_KEY environment variable.',
    };
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return {
      sent: false,
      reason: 'Messages array is required.',
    };
  }

  try {
    const sender = senderId || SMS_SENDER_ID;

    const response = await axios.post(
      `${SMS_API_BASE_URL}/sendsms`,
      {
        api_key: SMS_API_KEY,
        sender_id: sender,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const data = response.data;

    if (Array.isArray(data)) {
      const failed = data.filter((item) => item.status_code !== '1000');
      if (failed.length > 0) {
        return {
          sent: false,
          reason: `Some messages failed: ${failed.map((f) => f.status_desc).join(', ')}`,
          details: data,
        };
      }
    } else if (data.status_code !== '1000') {
      return {
        sent: false,
        reason: data.status_desc || 'Bulk SMS sending failed',
        details: data,
      };
    }

    return {
      sent: true,
      details: data,
    };
  } catch (error) {
    console.error('Bulk SMS send failed:', error.message);
    return {
      sent: false,
      reason: error.message,
    };
  }
};

/**
 * Get SMS account balance
 * @returns {Promise<Object>} Response with balance
 */
const getSMSBalance = async () => {
  if (!SMS_API_KEY) {
    return {
      success: false,
      reason: 'SMS API key not configured.',
    };
  }

  try {
    const response = await axios.post(
      `${SMS_API_BASE_URL}/credit-balance`,
      {
        api_key: SMS_API_KEY,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const data = response.data;

    if (data.status_code === '1000') {
      return {
        success: true,
        balance: Number(data.balance || 0),
      };
    } else {
      return {
        success: false,
        reason: data.status_desc || 'Failed to get balance',
      };
    }
  } catch (error) {
    console.error('Get SMS balance failed:', error.message);
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Normalize phone number to international format (254...)
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  const cleaned = String(phone).replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1);
  }
  
  // If already starts with 254, return as is
  if (cleaned.startsWith('254')) {
    return cleaned;
  }
  
  // If 7 digits (local format), add 254
  if (cleaned.length === 7) {
    return '254' + cleaned;
  }
  
  // Otherwise assume it's already in correct format or invalid
  return cleaned.length >= 10 ? cleaned : null;
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  getSMSBalance,
  normalizePhoneNumber,
};
