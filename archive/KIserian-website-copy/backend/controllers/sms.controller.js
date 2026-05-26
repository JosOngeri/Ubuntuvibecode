const { pool } = require('../config/database');
const axios = require('axios');

class SMSController {
  async sendSMS(req, res) {
    try {
      const { message, recipients, recipientType } = req.body;
      
      console.log('SMS Request received:', {
        message: message?.substring(0, 50) + '...',
        recipients: recipients,
        recipientType: recipientType,
        recipientCount: Array.isArray(recipients) ? recipients.length : 'N/A'
      });
      
      if (!message || !recipients) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message and recipients are required' 
        });
      }

      // Get recipient phone numbers based on type
      let phoneNumbers = [];
      
      if (recipientType === 'all') {
        // Get all member phone numbers
        const membersQuery = `
          SELECT phone FROM users 
          WHERE phone IS NOT NULL 
          AND phone != '' 
          AND is_active = true
        `;
        const membersResult = await pool.query(membersQuery);
        phoneNumbers = membersResult.rows.map(row => row.phone);
      } else if (recipientType === 'department') {
        // Get department members' phone numbers
        const deptQuery = `
          SELECT u.phone 
          FROM users u
          JOIN department_members dm ON u.id = dm.user_id
          JOIN departments d ON dm.department_id = d.id
          WHERE d.name = $1 
          AND u.phone IS NOT NULL 
          AND u.phone != '' 
          AND u.is_active = true
        `;
        const deptResult = await pool.query(deptQuery, [recipients]);
        phoneNumbers = deptResult.rows.map(row => row.phone);
      } else if (recipientType === 'custom') {
        // Custom recipients from CSV or direct array
        phoneNumbers = Array.isArray(recipients) ? recipients : [recipients];
      } else {
        // Specific recipients array
        phoneNumbers = recipients;
      }

      if (phoneNumbers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No valid phone numbers found for recipients' 
        });
      }

      // Send SMS using Blessed Texts API
      console.log('Sending SMS to phone numbers:', phoneNumbers);
      const smsResults = await this.sendBlessedTextsSMS(phoneNumbers, message);
      console.log('SMS Results:', smsResults);
      
      // Log sent SMS to database
      await this.logSMS(message, recipientType, phoneNumbers.length, smsResults);

      res.json({ 
        success: true, 
        message: 'SMS sent successfully',
        data: {
          sentCount: smsResults.successful.length,
          failedCount: smsResults.failed.length,
          totalRecipients: phoneNumbers.length,
          messageId: smsResults.messageId
        }
      });

    } catch (error) {
      console.error('SMS sending error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send SMS',
        error: error.message 
      });
    }
  }

  async sendBlessedTextsSMS(phoneNumbers, message) {
    const results = { successful: [], failed: [], messageId: null };
    
    // Blessed Texts API configuration
    const apiKey = process.env.BLESSED_TEXTS_API_KEY;
    const senderId = process.env.BLESSED_TEXTS_SENDER_ID || '23107'; // Default sender ID from docs
    
    console.log('Blessed Texts API Configuration:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      senderId: senderId
    });
    
    // Temporarily force simulation mode for testing
    console.log('FORCE SIMULATION MODE: Testing SMS functionality without real API calls');
    const simulatedId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    phoneNumbers.forEach(phone => {
      results.successful.push({
        phone,
        messageId: simulatedId,
        status: 'sent'
      });
    });
    results.messageId = simulatedId;
    return results;

    if (!apiKey) {
      // Fallback to simulation if API key not configured
      console.log('Blessed Texts API key not configured, simulating SMS sending');
      const simulatedId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      phoneNumbers.forEach(phone => {
        results.successful.push({
          phone,
          messageId: simulatedId,
          status: 'sent'
        });
      });
      results.messageId = simulatedId;
      return results;
    }

    try {
      // Blessed Texts API endpoint from documentation
      const apiUrl = 'https://sms.blessedtexts.com/api/sms/v1/sendsms';
      
      // Prepare recipients for Blessed Texts (comma-separated, format: 254722XXXXXX,722XXXXXX,0723XXXXXX)
      const formattedPhones = phoneNumbers.map(phone => {
        // Convert to Kenya format: 254722XXXXXX
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
          return cleanPhone;
        } else if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
          return '254' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
          return '2547' + cleanPhone.substring(1);
        }
        return cleanPhone; // fallback
      });
      
      const recipients = formattedPhones.join(',');
      
      console.log('Making Blessed Texts API request:', {
        url: apiUrl,
        payload: {
          api_key: apiKey.substring(0, 10) + '...',
          sender_id: senderId,
          message: message.substring(0, 50) + '...',
          phone: recipients
        }
      });

      const response = await axios.post(apiUrl, {
        api_key: apiKey,
        sender_id: senderId,
        message: message,
        phone: recipients
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('Blessed Texts API response:', {
        status: response.status,
        data: response.data
      });

      // Handle Blessed Texts response format from documentation
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(result => {
          if (result.status_code === '1000') { // Success status code
            results.successful.push({
              phone: result.phone,
              messageId: result.message_id,
              status: 'sent',
              cost: result.message_cost
            });
          } else {
            results.failed.push({
              phone: result.phone,
              error: result.status_desc || 'Failed to send'
            });
          }
        });
        
        // Set message ID from first successful result
        if (results.successful.length > 0) {
          results.messageId = results.successful[0].messageId;
        }
      } else {
        throw new Error('Invalid response format from Blessed Texts API');
      }

    } catch (error) {
      console.error('Blessed Texts API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Mark all as failed if API call fails
      phoneNumbers.forEach(phone => {
        results.failed.push({
          phone,
          error: error.response?.data?.message || error.message || 'API call failed'
        });
      });
    }

    return results;
  }

  async logSMS(message, recipientType, recipientCount, results) {
    try {
      const logQuery = `
        INSERT INTO sms_logs (message, recipient_type, recipient_count, successful_count, failed_count, message_id, sent_by, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;
      
      await pool.query(logQuery, [
        message,
        recipientType,
        recipientCount,
        results.successful.length,
        results.failed.length,
        results.messageId,
        req.user.id
      ]);
    } catch (error) {
      console.error('Failed to log SMS:', error);
    }
  }

  async getSMSHistory(req, res) {
    try {
      const query = `
        SELECT 
          sl.*,
          u.first_name || ' ' || u.last_name as sent_by_name
        FROM sms_logs sl
        LEFT JOIN users u ON sl.sent_by = u.id
        ORDER BY sl.sent_at DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Failed to get SMS history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch SMS history'
      });
    }
  }

  async getSMSBalance(req, res) {
    try {
      const apiKey = process.env.BLESSED_TEXTS_API_KEY;
      
      if (!apiKey) {
        return res.json({
          success: true,
          data: {
            balance: 'N/A',
            currency: 'KES',
            message: 'API key not configured'
          }
        });
      }

      // Check balance with Blessed Texts API from documentation
      try {
        const response = await axios.post('https://sms.blessedtexts.com/api/sms/v1/credit-balance', {
          api_key: apiKey
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.data && response.data.status_code === '1000') {
          res.json({
            success: true,
            data: {
              balance: response.data.balance || 'N/A',
              currency: 'KES',
              last_updated: new Date().toISOString()
            }
          });
        } else {
          res.json({
            success: true,
            data: {
              balance: 'Error',
              currency: 'KES',
              message: response.data?.status_desc || 'Failed to fetch balance'
            }
          });
        }
      } catch (error) {
        console.error('Balance check error:', error.response?.data || error.message);
        res.json({
          success: true,
          data: {
            balance: 'Error',
            currency: 'KES',
            message: 'Failed to fetch balance'
          }
        });
      }
    } catch (error) {
      console.error('Balance check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check SMS balance'
      });
    }
  }
}

module.exports = new SMSController();
