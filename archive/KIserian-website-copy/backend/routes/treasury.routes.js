const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const treasuryController = require('../controllers/treasury.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const TreasurySecurityMiddleware = require('../middleware/treasurySecurity');

// Apply security middleware to all treasury routes
router.use(TreasurySecurityMiddleware.logTreasuryAction);
router.use(TreasurySecurityMiddleware.validateSensitiveDataAccess);

// ============================================
// ACCOUNTS (Chart of Accounts)
// ============================================

// Get all accounts
router.get('/accounts', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getAccounts);

// Create account
router.post('/accounts',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('account_number').trim().notEmpty().withMessage('Account number is required'),
    body('account_name').trim().notEmpty().withMessage('Account name is required'),
    body('account_type').isIn(['asset', 'liability', 'equity', 'income', 'expense']).withMessage('Valid account type required'),
    body('sub_type').optional().isString(),
    body('parent_account_id').optional().isUUID(),
    body('fund_id').optional().isUUID(),
    body('description').optional().isString()
  ],
  treasuryController.createAccount
);

// Update account
router.put('/accounts/:id',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  treasuryController.updateAccount
);

// ============================================
// FUNDS
// ============================================

// Get all funds
router.get('/funds', authenticateToken, treasuryController.getFunds);

// Create fund
router.post('/funds',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('fund_code').trim().notEmpty().withMessage('Fund code is required'),
    body('fund_name').trim().notEmpty().withMessage('Fund name is required'),
    body('fund_type').isIn(['unrestricted', 'restricted', 'temporarily_restricted']).withMessage('Valid fund type required'),
    body('description').optional().isString(),
    body('purpose').optional().isString(),
    body('start_date').optional().isISO8601().withMessage('Valid start date required'),
    body('end_date').optional().isISO8601().withMessage('Valid end date required')
  ],
  treasuryController.createFund
);

// ============================================
// JOURNAL ENTRIES
// ============================================

// Get journal entries
router.get('/journal-entries', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getJournalEntries);

// Create journal entry
router.post('/journal-entries',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('entry_date').isISO8601().withMessage('Valid entry date is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('reference_type').optional().isString(),
    body('reference_id').optional().isUUID(),
    body('lines').isArray({ min: 2 }).withMessage('At least 2 journal entry lines required'),
    body('lines.*.account_id').isUUID().withMessage('Valid account ID required'),
    body('lines.*.debit_amount').isFloat({ min: 0 }).withMessage('Valid debit amount required'),
    body('lines.*.credit_amount').isFloat({ min: 0 }).withMessage('Valid credit amount required')
  ],
  treasuryController.createJournalEntry
);

// ============================================
// EXPENSES
// ============================================

// Get expenses
router.get('/expenses', authenticateToken, treasuryController.getExpenses);

// Create expense
router.post('/expenses',
  authenticateToken,
  [
    body('expense_date').isISO8601().withMessage('Valid expense date is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('account_id').isUUID().withMessage('Valid account ID required'),
    body('fund_id').optional().isUUID(),
    body('department_id').optional().isUUID(),
    body('vendor_id').optional().isUUID(),
    body('project_id').optional().isUUID(),
    body('notes').optional().isString()
  ],
  treasuryController.createExpense
);

// Approve expense
router.post('/expenses/:id/approve',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  treasuryController.approveExpense
);

// ============================================
// BUDGETS
// ============================================

// Get budgets
router.get('/budgets', authenticateToken, treasuryController.getBudgets);

// Create budget
router.post('/budgets',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('budget_name').trim().notEmpty().withMessage('Budget name is required'),
    body('fiscal_year').isInt({ min: 2020, max: 2100 }).withMessage('Valid fiscal year required'),
    body('fund_id').optional().isUUID(),
    body('account_id').optional().isUUID(),
    body('budgeted_amount').isFloat({ min: 0 }).withMessage('Valid budgeted amount required'),
    body('period_type').isIn(['annual', 'monthly', 'quarterly']).withMessage('Valid period type required')
  ],
  treasuryController.createBudget
);

// ============================================
// BANK RECONCILIATION
// ============================================

// Get bank reconciliations
router.get('/bank-reconciliations', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getBankReconciliations);

// Create bank reconciliation
router.post('/bank-reconciliations',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('reconciliation_date').isISO8601().withMessage('Valid reconciliation date is required'),
    body('bank_account_id').isUUID().withMessage('Valid bank account ID required'),
    body('statement_balance').isFloat().withMessage('Valid statement balance required'),
    body('book_balance').isFloat().withMessage('Valid book balance required'),
    body('notes').optional().isString()
  ],
  treasuryController.createBankReconciliation
);

// ============================================
// FINANCIAL REPORTS
// ============================================

// Get trial balance
router.get('/reports/trial-balance', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getTrialBalance);

// Get income statement
router.get('/reports/income-statement', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getIncomeStatement);

// Get balance sheet
router.get('/reports/balance-sheet', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getBalanceSheet);

// Get fund balances
router.get('/reports/fund-balances', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getFundBalances);

// ============================================
// MEMBER CONTRIBUTION MANAGEMENT
// ============================================

// Get member giving history
router.get('/contributions/giving-history', authenticateToken, treasuryController.getMemberGivingHistory);

// Generate contribution statement
router.get('/contributions/statements/generate', authenticateToken, treasuryController.generateContributionStatement);

// Get contribution statements
router.get('/contributions/statements', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getContributionStatements);

// Get giving analytics
router.get('/contributions/analytics', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getGivingAnalytics);

// ============================================
// VENDOR MANAGEMENT
// ============================================

// Get vendors
router.get('/vendors', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getVendors);

// Create vendor
router.post('/vendors',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('vendor_name').trim().notEmpty().withMessage('Vendor name is required'),
    body('contact_person').optional().isString(),
    body('phone_number').optional().isString(),
    body('email').optional().isEmail(),
    body('address').optional().isString(),
    body('tax_id').optional().isString(),
    body('payment_terms').optional().isString(),
    body('notes').optional().isString()
  ],
  treasuryController.createVendor
);

// Update vendor
router.put('/vendors/:id',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  treasuryController.updateVendor
);

// ============================================
// PROJECT MANAGEMENT
// ============================================

// Get projects
router.get('/projects', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getProjects);

// Create project
router.post('/projects',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('project_code').trim().notEmpty().withMessage('Project code is required'),
    body('project_name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().isString(),
    body('start_date').isISO8601().withMessage('Valid start date required'),
    body('end_date').optional().isISO8601(),
    body('budgeted_amount').isFloat({ min: 0 }).withMessage('Valid budgeted amount required'),
    body('fund_id').optional().isUUID(),
    body('managed_by').optional().isUUID(),
    body('notes').optional().isString()
  ],
  treasuryController.createProject
);

// ============================================
// FIXED ASSETS MANAGEMENT
// ============================================

// Get fixed assets
router.get('/fixed-assets', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getFixedAssets);

// Create fixed asset
router.post('/fixed-assets',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('asset_number').trim().notEmpty().withMessage('Asset number is required'),
    body('asset_name').trim().notEmpty().withMessage('Asset name is required'),
    body('asset_type').isIn(['furniture', 'equipment', 'vehicle', 'building', 'land']).withMessage('Valid asset type required'),
    body('description').optional().isString(),
    body('purchase_date').isISO8601().withMessage('Valid purchase date required'),
    body('purchase_price').isFloat({ min: 0 }).withMessage('Valid purchase price required'),
    body('depreciation_method').isIn(['straight_line', 'declining_balance']).withMessage('Valid depreciation method required'),
    body('useful_life_years').isInt({ min: 1 }).withMessage('Valid useful life years required'),
    body('location').optional().isString(),
    body('condition').isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Valid condition required'),
    body('notes').optional().isString()
  ],
  treasuryController.createFixedAsset
);

// ============================================
// PLEDGE MANAGEMENT
// ============================================

// Get pledges
router.get('/pledges', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getPledges);

// Create pledge
router.post('/pledges',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('member_id').isUUID().withMessage('Valid member ID required'),
    body('campaign_id').optional().isUUID(),
    body('pledge_amount').isFloat({ min: 1 }).withMessage('Valid pledge amount required'),
    body('pledge_date').isISO8601().withMessage('Valid pledge date required'),
    body('start_date').isISO8601().withMessage('Valid start date required'),
    body('end_date').isISO8601().withMessage('Valid end date required'),
    body('payment_frequency').isIn(['weekly', 'monthly', 'quarterly', 'one_time']).withMessage('Valid payment frequency required'),
    body('notes').optional().isString()
  ],
  treasuryController.createPledge
);

// Add pledge payment
router.post('/pledges/:id/payments',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('payment_id').optional().isUUID(),
    body('amount').isFloat({ min: 1 }).withMessage('Valid amount required'),
    body('payment_date').isISO8601().withMessage('Valid payment date required'),
    body('notes').optional().isString()
  ],
  treasuryController.addPledgePayment
);

// ============================================
// RECURRING PAYMENTS
// ============================================

// Get recurring payments
router.get('/recurring-payments', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.getRecurringPayments);

// Create recurring payment
router.post('/recurring-payments',
  authenticateToken,
  [
    body('member_id').isUUID().withMessage('Valid member ID required'),
    body('category_id').optional().isUUID(),
    body('fund_id').optional().isUUID(),
    body('amount').isFloat({ min: 1 }).withMessage('Valid amount required'),
    body('frequency').isIn(['weekly', 'monthly', 'quarterly']).withMessage('Valid frequency required'),
    body('account_reference').optional().isString(),
    body('description').optional().isString(),
    body('next_payment_date').isISO8601().withMessage('Valid next payment date required')
  ],
  treasuryController.createRecurringPayment
);

// ============================================
// SMS NOTIFICATIONS
// ============================================

// Send treasury SMS notification
router.post('/notifications/sms',
  authenticateToken,
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']),
  [
    body('notification_type').isIn(['payment_confirmation', 'expense_approval', 'budget_alert', 'monthly_summary']).withMessage('Valid notification type required'),
    body('reference_id').optional().isString(),
    body('recipient_id').optional().isUUID()
  ],
  treasuryController.sendTreasurySMS
);

// ============================================
// DATA EXPORT
// ============================================

// Export journal entries to CSV
router.get('/export/journal-entries', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.exportJournalEntries);

// Export payments to CSV
router.get('/export/payments', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.exportPayments);

// Export expenses to CSV
router.get('/export/expenses', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.exportExpenses);

// Export contribution statements to CSV
router.get('/export/contributions', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder', 'Treasurer']), treasuryController.exportContributionStatements);

// ============================================
// RECEIPT MANAGEMENT
// ============================================

// Generate receipt for payment
router.post('/receipts/payments/:payment_id', authenticateToken, treasuryController.generateReceipt);

// Get receipts
router.get('/receipts', authenticateToken, treasuryController.getReceipts);

// Generate PDF receipt
router.get('/receipts/:receipt_id/pdf', authenticateToken, treasuryController.generatePDFReceipt);

module.exports = router;
