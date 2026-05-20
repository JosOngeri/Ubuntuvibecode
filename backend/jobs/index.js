const cron = require('node-cron');
const { processQueuedNotifications } = require('../utils/notification');
const { query } = require('../config/db');

/**
 * Initialize all scheduled jobs
 */
const initScheduledJobs = () => {
  console.log('[Scheduler] Initializing scheduled jobs...');

  // Morning batch notifications (8:00 AM)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running morning notification batch...');
    try {
      const result = await processQueuedNotifications();
      console.log('[Scheduler] Morning batch complete:', result);
    } catch (error) {
      console.error('[Scheduler] Morning batch error:', error.message);
    }
  });

  // Evening batch notifications (6:00 PM)
  cron.schedule('0 18 * * *', async () => {
    console.log('[Scheduler] Running evening notification batch...');
    try {
      const result = await processQueuedNotifications();
      console.log('[Scheduler] Evening batch complete:', result);
    } catch (error) {
      console.error('[Scheduler] Evening batch error:', error.message);
    }
  });

  // Leave escalation job (9:00 AM daily)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running leave escalation check...');
    try {
      await checkLeaveEscalation();
    } catch (error) {
      console.error('[Scheduler] Leave escalation error:', error.message);
    }
  });

  // Daily labour wage urgency check (every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Running wage urgency check...');
    try {
      await checkWageUrgency();
    } catch (error) {
      console.error('[Scheduler] Wage urgency error:', error.message);
    }
  });

  // KPI reminder job (8:00 AM daily)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running KPI reminder check...');
    try {
      await checkKpiReminders();
    } catch (error) {
      console.error('[Scheduler] KPI reminder error:', error.message);
    }
  });

  // Payroll retry job (every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running payroll retry check...');
    try {
      await checkPayrollRetry();
    } catch (error) {
      console.error('[Scheduler] Payroll retry error:', error.message);
    }
  });

  // Contract expiry alert job (7:00 AM daily)
  cron.schedule('0 7 * * *', async () => {
    console.log('[Scheduler] Running contract expiry check...');
    try {
      await checkContractExpiry();
    } catch (error) {
      console.error('[Scheduler] Contract expiry error:', error.message);
    }
  });

  // Complaint escalation job (10:00 AM daily)
  cron.schedule('0 10 * * *', async () => {
    console.log('[Scheduler] Running complaint escalation check...');
    try {
      await checkComplaintEscalation();
    } catch (error) {
      console.error('[Scheduler] Complaint escalation error:', error.message);
    }
  });

  console.log('[Scheduler] All scheduled jobs initialized successfully.');
};

/**
 * Check for leave escalation and send reminders
 */
const checkLeaveEscalation = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');
  const { toDate } = require('../utils/postgres');

  // Find leave requests starting tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { rows: tomorrowLeaves } = await query(
    `SELECT lr.*, e.user_id, e.first_name, e.last_name 
     FROM leave_requests lr 
     JOIN employees e ON e.id = lr.employee_id 
     WHERE lr.status IN ('Pending', 'Pending_Approval')
       AND lr.start_date = $1`,
    [tomorrowStr]
  );

  for (const leave of tomorrowLeaves) {
    const approverId = leave.approver_id || leave.user_id; // Fallback to employee's manager
    if (approverId) {
      await sendUrgentNotification({
        userId: approverId,
        type: NOTIFICATION_TYPES.LEAVE_REMINDER,
        title: 'Urgent: Leave Starts Tomorrow',
        message: `${leave.first_name} ${leave.last_name}'s ${leave.type} leave starts tomorrow. Please approve or reject.`,
        channels: ['sms', 'in_app'],
      });
    }
  }

  // Find pending leave requests > 3 days old
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const { rows: overdueLeaves } = await query(
    `SELECT lr.*, e.user_id 
     FROM leave_requests lr 
     JOIN employees e ON e.id = lr.employee_id 
     WHERE lr.status IN ('Pending', 'Pending_Approval')
       AND lr.created_at < $1`,
    [threeDaysAgo]
  );

  for (const leave of overdueLeaves) {
    // Escalate to admin
    const { rows: admins } = await query(
      `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active' LIMIT 1`
    );
    if (admins[0]) {
      await sendUrgentNotification({
        userId: admins[0].id,
        type: NOTIFICATION_TYPES.LEAVE_ESCALATION,
        title: 'Leave Request Escalated',
        message: `Leave request pending for > 3 days. Please review.`,
        actionLink: `/leave/approvals`,
        channels: ['sms', 'in_app'],
      });
    }
  }
};

/**
 * Check for daily labour wage urgency
 */
const checkWageUrgency = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');

  const { rows: urgentWages } = await query(
    `SELECT dl.* 
     FROM daily_labourers dl 
     WHERE dl.urgency_level = 'urgent'
       AND dl.calculated_at IS NOT NULL`
  );

  if (urgentWages.length > 0) {
    // Get manager and admin
    const { rows: managers } = await query(
      `SELECT u.id FROM users u WHERE u.role IN ('manager', 'admin') AND u.status = 'active'`
    );
    
    for (const manager of managers) {
      await sendUrgentNotification({
        userId: manager.id,
        type: NOTIFICATION_TYPES.WAGE_URGENT,
        title: 'Urgent: Daily Labour Wages Pending',
        message: `${urgentWages.length} daily labour wages need approval and payment.`,
        actionLink: `/admin/daily-labour`,
        channels: ['sms', 'in_app'],
      });
    }
  }
};

/**
 * Check for KPI reminders and escalation
 */
const checkKpiReminders = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');

  // Find KPIs due within 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { rows: dueKpis } = await query(
    `SELECT ek.*, ek.evaluator_id 
     FROM employee_kpis ek 
     WHERE ek.status = 'Pending'
       AND ek.due_date <= $1
       AND ek.due_date >= NOW()`,
    [threeDaysFromNow]
  );

  for (const kpi of dueKpis) {
    await sendUrgentNotification({
      userId: kpi.evaluator_id,
      type: NOTIFICATION_TYPES.KPI_DUE,
      title: 'KPI Evaluation Due Soon',
      message: `KPI evaluation is due. Please complete the evaluation.`,
      actionLink: `/kpi/manage`,
      channels: ['sms', 'in_app'],
    });
  }

  // Find overdue KPIs
  const { rows: overdueKpis } = await query(
    `SELECT ek.*, ek.evaluator_id, emp.user_id as manager_id
     FROM employee_kpis ek 
     LEFT JOIN employees emp ON emp.id = ek.employee_id
     WHERE ek.status = 'Pending'
       AND ek.due_date < NOW()`
  );

  for (const kpi of overdueKpis) {
    if (kpi.manager_id) {
      await sendUrgentNotification({
        userId: kpi.manager_id,
        type: NOTIFICATION_TYPES.KPI_OVERDUE,
        title: 'KPI Evaluation Overdue',
        message: `KPI evaluation is overdue. Please follow up with the evaluator.`,
        actionLink: `/kpi/manage`,
        channels: ['sms', 'in_app'],
      });
    }
  }
};

/**
 * Check for payroll retry and urgency
 */
const checkPayrollRetry = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');

  try {
    // Find failed payslips with retry count < 3
    const { rows: failedPayslips } = await query(
      `SELECT * FROM payslips 
       WHERE status = 'Failed' 
       AND retry_count < 3`
    );

    for (const payslip of failedPayslips) {
      // Calculate retry delay based on retry count
      const retryDelays = [1, 5, 30]; // minutes
      const delay = retryDelays[Math.min(payslip.retry_count, 2)];
      
      const lastRetry = payslip.last_retry_at ? new Date(payslip.last_retry_at) : payslip.created_at;
      const minutesSinceRetry = (Date.now() - lastRetry.getTime()) / (1000 * 60);
      
      if (minutesSinceRetry >= delay) {
        // Trigger retry (this would call the actual disbursement function)
        console.log(`[Payroll Retry] Retrying payslip ${payslip.id}, attempt ${payslip.retry_count + 1}`);
        
        await query(
          `UPDATE payslips 
           SET retry_count = retry_count + 1, 
               last_retry_at = NOW() 
           WHERE id = $1`,
          [payslip.id]
        );
      }
    }

    // Check for payslips pending > 30 minutes (urgent)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const { rows: urgentPayslips } = await query(
      `SELECT p.*, e.user_id 
       FROM payslips p 
       JOIN employees e ON e.id = p.employee_id 
       WHERE p.status = 'Approved'
       AND p.created_at < $1
       AND p.urgency_level = 'normal'`,
      [thirtyMinutesAgo]
    );

    for (const payslip of urgentPayslips) {
      await query(
        `UPDATE payslips SET urgency_level = 'urgent' WHERE id = $1`,
        [payslip.id]
      );

      const { rows: admins } = await query(
        `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active'`
      );
      
      for (const admin of admins) {
        await sendUrgentNotification({
          userId: admin.id,
          type: NOTIFICATION_TYPES.PAYROLL_URGENT,
          title: 'Urgent: Payments Pending',
          message: `${urgentPayslips.length} payments pending for > 30 minutes. Please disburse.`,
          actionLink: `/admin/payroll`,
          channels: ['sms', 'in_app'],
        });
      }
    }

    // Check for payslips pending > 2 hours (critical)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { rows: criticalPayslips } = await query(
      `SELECT * FROM payslips 
       WHERE status = 'Approved'
       AND created_at < $1
       AND urgency_level != 'critical'`,
      [twoHoursAgo]
    );

    if (criticalPayslips.length > 0) {
      await query(
        `UPDATE payslips SET urgency_level = 'critical' WHERE status = 'Approved' AND created_at < $1`,
        [twoHoursAgo]
      );

      const { rows: superAdmins } = await query(
        `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active'`
      );
      
      for (const admin of superAdmins) {
        await sendUrgentNotification({
          userId: admin.id,
          type: NOTIFICATION_TYPES.PAYROLL_CRITICAL,
          title: 'Critical: Payments Overdue',
          message: `${criticalPayslips.length} payments pending for > 2 hours. Immediate action required.`,
          actionLink: `/admin/payroll`,
          channels: ['sms', 'in_app'],
        });
      }
    }
  } catch (error) {
    console.error('[Payroll Retry] Error:', error.message);
  }
};

/**
 * Check for contract expiry alerts
 */
const checkContractExpiry = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');

  // Find contracts expiring in 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { rows: expiringSoon } = await query(
    `SELECT c.*, e.user_id, e.first_name, e.last_name 
     FROM contracts c 
     JOIN employees e ON e.employee_id = c.employee_id 
     WHERE c.end_date <= $1
       AND c.end_date >= NOW()
       AND c.status = 'Active'`,
    [thirtyDaysFromNow]
  );

  for (const contract of expiringSoon) {
    const daysUntilExpiry = Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      // Very urgent - notify manager and admin
      const { rows: managers } = await query(
        `SELECT u.id FROM users u WHERE u.role IN ('manager', 'admin') AND u.status = 'active'`
      );
      
      for (const manager of managers) {
        await sendUrgentNotification({
          userId: manager.id,
          type: NOTIFICATION_TYPES.CONTRACT_EXPIRING,
          title: 'Contract Expiring Very Soon',
          message: `${contract.first_name} ${contract.last_name}'s contract expires in ${daysUntilExpiry} days.`,
          actionLink: `/admin/contracts`,
          channels: ['sms', 'in_app'],
        });
      }
    } else {
      // Reminder to manager
      if (contract.user_id) {
        await sendUrgentNotification({
          userId: contract.user_id,
          type: NOTIFICATION_TYPES.CONTRACT_EXPIRING,
          title: 'Contract Expiring Soon',
          message: `Contract expires in ${daysUntilExpiry} days. Consider renewal.`,
          actionLink: `/admin/contracts`,
          channels: ['in_app'],
        });
      }
    }
  }

  // Find expired contracts
  const { rows: expiredContracts } = await query(
    `SELECT c.*, e.first_name, e.last_name 
     FROM contracts c 
     JOIN employees e ON e.employee_id = c.employee_id 
     WHERE c.end_date < NOW()
       AND c.status = 'Active'`
  );

  for (const contract of expiredContracts) {
    const { rows: admins } = await query(
      `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active'`
    );
    
    for (const admin of admins) {
      await sendUrgentNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPES.CONTRACT_EXPIRED,
        title: 'Contract Expired',
        message: `${contract.first_name} ${contract.last_name}'s contract has expired.`,
        actionLink: `/admin/contracts`,
        channels: ['sms', 'in_app'],
      });
    }
  }
};

/**
 * Check for complaint escalation
 */
const checkComplaintEscalation = async () => {
  const { sendUrgentNotification, NOTIFICATION_TYPES } = require('../utils/notification');

  // Find open complaints > 3 days old
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { rows: escalatedComplaints } = await query(
    `SELECT c.*, e.user_id 
     FROM complaints c 
     JOIN employees e ON e.id = c.employee_id 
     WHERE c.status = 'Open'
       AND c.created_at < $1`,
    [threeDaysAgo]
  );

  for (const complaint of escalatedComplaints) {
    const { rows: admins } = await query(
      `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active'`
    );
    
    for (const admin of admins) {
      await sendUrgentNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPES.COMPLAINT_ESCALATION,
        title: 'Complaint Escalated',
        message: `Complaint pending for > 3 days. Please review.`,
        actionLink: `/admin/complaints`,
        channels: ['sms', 'in_app'],
      });
    }
  }

  // Find in-progress complaints > 7 days old
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { rows: longRunningComplaints } = await query(
    `SELECT c.*, e.user_id 
     FROM complaints c 
     JOIN employees e ON e.id = c.employee_id 
     WHERE c.status = 'In Progress'
       AND c.created_at < $1`,
    [sevenDaysAgo]
  );

  for (const complaint of longRunningComplaints) {
    const { rows: superAdmins } = await query(
      `SELECT u.id FROM users u WHERE u.role = 'admin' AND u.status = 'active'`
    );
    
    for (const admin of superAdmins) {
      await sendUrgentNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPES.COMPLAINT_ESCALATION,
        title: 'Complaint Taking Too Long',
        message: `Complaint in progress for > 7 days. Please follow up.`,
        actionLink: `/admin/complaints`,
        channels: ['sms', 'in_app'],
      });
    }
  }

  // Find resolved complaints not closed > 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { rows: resolvedNotClosed } = await query(
    `SELECT c.*, e.user_id 
     FROM complaints c 
     JOIN employees e ON e.id = c.employee_id 
     WHERE c.status = 'Resolved'
       AND c.updated_at < $1`,
    [fourteenDaysAgo]
  );

  for (const complaint of resolvedNotClosed) {
    if (complaint.user_id) {
      await sendUrgentNotification({
        userId: complaint.user_id,
        type: NOTIFICATION_TYPES.COMPLAINT_REMINDER,
        title: 'Complaint Closure Reminder',
        message: `Resolved complaint needs to be closed.`,
        actionLink: `/admin/complaints`,
        channels: ['in_app'],
      });
    }
  }
};

module.exports = {
  initScheduledJobs,
};
