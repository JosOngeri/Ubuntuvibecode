const kopokopoService = require('../services/kopokopo');
const { pool } = require('../config/database');

class PaymentController {
  // Initiate M-Pesa payment via KopoKopo STK Push
  async initiatePayment(req, res) {
    try {
      const { amount, phoneNumber, category, memberId, description } = req.body;

      // Validate input
      if (!amount || !phoneNumber || !category) {
        return res.status(400).json({
          success: false,
          error: 'Amount, phone number, and category are required',
        });
      }

      // Validate phone number format
      if (!/^2547\d{8}$/.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use 2547XXXXXXXX',
        });
      }

      // Create payment record using SQL
      const paymentQuery = `
        INSERT INTO payments (member_id, phone_number, amount, category, description, method, status, initiated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const paymentResult = await pool.query(paymentQuery, [
        memberId,
        phoneNumber,
        amount,
        category,
        description || `${category} payment`,
        'M-Pesa',
        'pending',
        req.user.id
      ]);
      const paymentId = paymentResult.rows[0].id;

      // Initiate STK Push
      const paymentResultData = await kopokopoService.initiateSTKPush({
        phoneNumber,
        amount,
        reference: `SDA-${paymentId}`,
        description: description || `${category} payment`,
      });

      if (!paymentResultData.success) {
        await pool.query('UPDATE payments SET status = $1, failure_reason = $2 WHERE id = $3', [
          'failed',
          paymentResultData.error,
          paymentId
        ]);

        return res.status(400).json({
          success: false,
          error: paymentResultData.error,
        });
      }

      // Update payment with transaction details
      await pool.query(
        'UPDATE payments SET transaction_id = $1, checkout_request_id = $2, merchant_request_id = $3 WHERE id = $4',
        [
          paymentResultData.transactionId,
          paymentResultData.checkoutRequestID,
          paymentResultData.merchantRequestID,
          paymentId
        ]
      );

      res.json({
        success: true,
        message: 'Payment initiated. Please check your phone for M-Pesa prompt.',
        data: {
          paymentId,
          transactionId: paymentResultData.transactionId,
          checkoutRequestID: paymentResultData.checkoutRequestID,
        },
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment initiation failed',
      });
    }
  }

  // Generate payment link
  async generatePaymentLink(req, res) {
    try {
      const { amount, category, memberId, description, eventId } = req.body;

      const paymentQuery = `
        INSERT INTO payments (member_id, amount, category, description, method, status, initiated_by, event_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const paymentResult = await pool.query(paymentQuery, [
        memberId,
        amount,
        category,
        description || `${category} payment`,
        'M-Pesa',
        'pending',
        req.user.id,
        eventId
      ]);
      const paymentId = paymentResult.rows[0].id;

      const linkResult = await kopokopoService.generatePaymentLink({
        amount,
        description: description || `${category} payment`,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/success/${paymentId}`,
        memberId,
        category,
        eventId,
      });

      if (!linkResult.success) {
        await pool.query('UPDATE payments SET status = $1, failure_reason = $2 WHERE id = $3', [
          'failed',
          linkResult.error,
          paymentId
        ]);

        return res.status(400).json({
          success: false,
          error: linkResult.error,
        });
      }

      await pool.query(
        'UPDATE payments SET payment_url = $1, link_id = $2 WHERE id = $3',
        [linkResult.paymentUrl, linkResult.linkId, paymentId]
      );

      res.json({
        success: true,
        data: {
          paymentId,
          paymentUrl: linkResult.paymentUrl,
          expiresAt: linkResult.expiresAt,
        },
      });
    } catch (error) {
      console.error('Payment link generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment link generation failed',
      });
    }
  }

  // Generate QR code for payments
  async generateQRCode(req, res) {
    try {
      const { amount, category, memberId, description, eventId } = req.body;

      const paymentQuery = `
        INSERT INTO payments (member_id, amount, category, description, method, status, initiated_by, event_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const paymentResult = await pool.query(paymentQuery, [
        memberId,
        amount,
        category,
        description || `${category} payment`,
        'M-Pesa',
        'pending',
        req.user.id,
        eventId
      ]);
      const paymentId = paymentResult.rows[0].id;

      const qrResult = await kopokopoService.generateQRCode({
        amount,
        description: description || `${category} payment`,
        memberId,
        category,
      });

      if (!qrResult.success) {
        await pool.query('UPDATE payments SET status = $1, failure_reason = $2 WHERE id = $3', [
          'failed',
          qrResult.error,
          paymentId
        ]);

        return res.status(400).json({
          success: false,
          error: qrResult.error,
        });
      }

      await pool.query(
        'UPDATE payments SET qr_code_data = $1, qr_id = $2 WHERE id = $3',
        [qrResult.qrCodeData, qrResult.qrId, paymentId]
      );

      res.json({
        success: true,
        data: {
          paymentId,
          qrCodeData: qrResult.qrCodeData,
          qrCodeImage: qrResult.qrCodeImage,
          qrId: qrResult.qrId,
        },
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      res.status(500).json({
        success: false,
        error: 'QR code generation failed',
      });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      const payment = paymentResult.rows[0];

      // If payment is still pending, check with KopoKopo
      if (payment.status === 'pending' && payment.transaction_id) {
        const statusResult = await kopokopoService.checkTransactionStatus(
          payment.transaction_id
        );

        if (statusResult.success && statusResult.status !== 'pending') {
          await pool.query(
            'UPDATE payments SET status = $1, completed_at = $2 WHERE id = $3',
            [statusResult.status, new Date(), paymentId]
          );
          payment.status = statusResult.status;
          payment.completed_at = new Date();
        }
      }

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          category: payment.category,
          phoneNumber: payment.phone_number,
          createdAt: payment.created_at,
          completedAt: payment.completed_at,
          mpesaReceipt: payment.mpesa_receipt,
          failureReason: payment.failure_reason,
        },
      });
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment status check failed',
      });
    }
  }

  // Get payment history for a member
  async getPaymentHistory(req, res) {
    try {
      const { memberId } = req.params;
      const { page = 1, limit = 20, category, startDate, endDate } = req.query;

      let query = 'SELECT * FROM payments WHERE member_id = $1';
      const params = [memberId];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (startDate || endDate) {
        if (startDate) {
          paramCount++;
          query += ` AND created_at >= $${paramCount}`;
          params.push(new Date(startDate));
        }
        if (endDate) {
          paramCount++;
          query += ` AND created_at <= $${paramCount}`;
          params.push(new Date(endDate));
        }
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
      params.push(limit, (page - 1) * limit);

      const paymentsResult = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          payments: paymentsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history',
      });
    }
  }

  // Get all payments (admin)
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 20, category, status, startDate, endDate } = req.query;

      let query = 'SELECT * FROM payments WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(new Date(startDate));
      }

      if (endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(new Date(endDate));
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
      params.push(limit, (page - 1) * limit);

      const paymentsResult = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          payments: paymentsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payments',
      });
    }
  }

  // Process KopoKopo webhook
  async processWebhook(req, res) {
    try {
      const signature = req.headers['x-k2-signature'];
      const payload = req.body;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing signature',
        });
      }

      await kopokopoService.processWebhook(payload, signature);

      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Get analytics from KopoKopo
      const kopokopoAnalytics = await kopokopoService.getPaymentAnalytics(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate || new Date()
      );

      // Get local analytics using SQL
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const localAnalyticsQuery = `
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as count,
          AVG(amount) as average_amount
        FROM payments
        WHERE status = 'completed'
          AND created_at >= $1
          AND created_at <= $2
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      const localAnalyticsResult = await pool.query(localAnalyticsQuery, [start, end]);
      const localAnalytics = localAnalyticsResult.rows.map(row => ({
        _id: row.category,
        totalAmount: parseFloat(row.total_amount),
        count: parseInt(row.count),
        averageAmount: parseFloat(row.average_amount),
      }));

      res.json({
        success: true,
        data: {
          kopokopo: kopokopoAnalytics.analytics || {},
          local: localAnalytics,
        },
      });
    } catch (error) {
      console.error('Payment analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment analytics',
      });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;

      const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Only completed payments can be refunded',
        });
      }

      const refundResult = await kopokopoService.refundPayment(
        payment.transaction_id,
        { amount: amount || payment.amount, reason }
      );

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          error: refundResult.error,
        });
      }

      // Create refund record using SQL
      const refundQuery = `
        INSERT INTO refunds (payment_id, amount, reason, refund_id, status, initiated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const refundResultData = await pool.query(refundQuery, [
        paymentId,
        amount || payment.amount,
        reason,
        refundResult.refundId,
        refundResult.status,
        req.user.id
      ]);

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: refundResultData.rows[0],
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Refund initiation failed',
      });
    }
  }
}

module.exports = new PaymentController();
