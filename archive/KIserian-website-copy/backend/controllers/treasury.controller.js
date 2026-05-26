const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const logger = require('../config/logging');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

class TreasuryController {
  constructor() {
    this.smsService = this.getSMSService();
  }

  getSMSService() {
    // Lazy load SMS service to avoid circular dependencies
    return {
      sendSMS: async (recipients, message, options = {}) => {
        try {
          console.log('SMS Service - Sending message:', {
            recipients,
            message,
            ...options
          });

          // Log the SMS
          for (const recipient of recipients) {
            const query = `
              INSERT INTO sms_logs (recipient_phone, message, sender_id, template_id, status)
              VALUES ($1, $2, $3, $4, 'sent')
            `;
            await pool.query(query, [recipient, message, options.sender_id, options.template_id]);
          }

          return { success: true, messageId: `SMS_${Date.now()}` };
        } catch (error) {
          logger.error('SMS sending error:', error);
          throw error;
        }
      }
    };
  }
  // ============================================
  // ACCOUNTS (Chart of Accounts)
  // ============================================

  // Get all accounts
  async getAccounts(req, res) {
    try {
      const { account_type, is_active } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (account_type) {
        whereClause += ` AND account_type = $${paramIndex++}`;
        params.push(account_type);
      }

      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        params.push(is_active === 'true');
      }

      const query = `
        SELECT a.*, 
               COALESCE(p.account_name, 'Root') as parent_account_name,
               f.fund_name
        FROM accounts a
        LEFT JOIN accounts p ON a.parent_account_id = p.id
        LEFT JOIN funds f ON a.fund_id = f.id
        ${whereClause}
        ORDER BY account_number ASC
      `;

      const result = await pool.query(query, params);
      res.json({ accounts: result.rows });
    } catch (error) {
      logger.error('Get accounts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create account
  async createAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { account_number, account_name, account_type, sub_type, parent_account_id, fund_id, description } = req.body;

      const query = `
        INSERT INTO accounts (account_number, account_name, account_type, sub_type, parent_account_id, fund_id, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await pool.query(query, [
        account_number, account_name, account_type, sub_type, parent_account_id, fund_id, description
      ]);

      res.status(201).json({ account: result.rows[0] });
    } catch (error) {
      logger.error('Create account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update account
  async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const { account_name, sub_type, parent_account_id, fund_id, is_active, description } = req.body;

      const query = `
        UPDATE accounts 
        SET account_name = COALESCE($1, account_name),
            sub_type = COALESCE($2, sub_type),
            parent_account_id = COALESCE($3, parent_account_id),
            fund_id = COALESCE($4, fund_id),
            is_active = COALESCE($5, is_active),
            description = COALESCE($6, description),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;

      const result = await pool.query(query, [
        account_name, sub_type, parent_account_id, fund_id, is_active, description, id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json({ account: result.rows[0] });
    } catch (error) {
      logger.error('Update account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // FUNDS
  // ============================================

  // Get all funds
  async getFunds(req, res) {
    try {
      const { fund_type, is_active } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (fund_type) {
        whereClause += ` AND fund_type = $${paramIndex++}`;
        params.push(fund_type);
      }

      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        params.push(is_active === 'true');
      }

      const query = `
        SELECT f.*,
               COALESCE(SUM(a.balance), 0) as total_balance
        FROM funds f
        LEFT JOIN accounts a ON f.id = a.fund_id
        ${whereClause}
        GROUP BY f.id
        ORDER BY fund_code ASC
      `;

      const result = await pool.query(query, params);
      res.json({ funds: result.rows });
    } catch (error) {
      logger.error('Get funds error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create fund
  async createFund(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { fund_code, fund_name, fund_type, description, purpose, start_date, end_date } = req.body;

      const query = `
        INSERT INTO funds (fund_code, fund_name, fund_type, description, purpose, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await pool.query(query, [
        fund_code, fund_name, fund_type, description, purpose, start_date, end_date
      ]);

      res.status(201).json({ fund: result.rows[0] });
    } catch (error) {
      logger.error('Create fund error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // JOURNAL ENTRIES
  // ============================================

  // Get journal entries
  async getJournalEntries(req, res) {
    try {
      const { page = 1, limit = 20, entry_date_from, entry_date_to, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (entry_date_from) {
        whereClause += ` AND entry_date >= $${paramIndex++}`;
        params.push(entry_date_from);
      }

      if (entry_date_to) {
        whereClause += ` AND entry_date <= $${paramIndex++}`;
        params.push(entry_date_to);
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT je.*, u.first_name, u.last_name,
               json_agg(
                 json_build_object(
                   'account_name', a.account_name,
                   'account_number', a.account_number,
                   'debit_amount', jel.debit_amount,
                   'credit_amount', jel.credit_amount,
                   'description', jel.description
                 )
               ) as lines
        FROM journal_entries je
        LEFT JOIN users u ON je.created_by = u.id
        LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        LEFT JOIN accounts a ON jel.account_id = a.id
        ${whereClause}
        GROUP BY je.id, u.first_name, u.last_name
        ORDER BY je.entry_date DESC, je.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM journal_entries ${whereClause}`;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        journal_entries: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      logger.error('Get journal entries error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create journal entry
  async createJournalEntry(req, res) {
    const client = await pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { entry_date, description, reference_type, reference_id, lines } = req.body;

      // Validate double-entry
      const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit_amount), 0);
      const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit_amount), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ 
          error: 'Double-entry validation failed', 
          details: 'Total debits must equal total credits' 
        });
      }

      await client.query('BEGIN');

      // Generate entry number
      const entryNumber = `JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create journal entry
      const entryQuery = `
        INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, total_debit, total_credit, created_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'posted')
        RETURNING *
      `;

      const entryResult = await client.query(entryQuery, [
        entryNumber, entry_date, description, reference_type, reference_id, totalDebit, totalCredit, req.user.id
      ]);

      const journalEntry = entryResult.rows[0];

      // Create journal entry lines
      for (const line of lines) {
        const lineQuery = `
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit_amount, credit_amount)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(lineQuery, [
          journalEntry.id, line.account_id, line.description, line.debit_amount, line.credit_amount
        ]);
      }

      await client.query('COMMIT');

      res.status(201).json({ journal_entry: journalEntry });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Create journal entry error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  // ============================================
  // EXPENSES
  // ============================================

  // Get expenses
  async getExpenses(req, res) {
    try {
      const { page = 1, limit = 20, status, fund_id, department_id, expense_date_from, expense_date_to } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND e.status = $${paramIndex++}`;
        params.push(status);
      }

      if (fund_id) {
        whereClause += ` AND e.fund_id = $${paramIndex++}`;
        params.push(fund_id);
      }

      if (department_id) {
        whereClause += ` AND e.department_id = $${paramIndex++}`;
        params.push(department_id);
      }

      if (expense_date_from) {
        whereClause += ` AND e.expense_date >= $${paramIndex++}`;
        params.push(expense_date_from);
      }

      if (expense_date_to) {
        whereClause += ` AND e.expense_date <= $${paramIndex++}`;
        params.push(expense_date_to);
      }

      const query = `
        SELECT e.*, 
               a.account_name,
               f.fund_name,
               d.name as department_name,
               v.vendor_name,
               req.first_name as requested_by_first,
               req.last_name as requested_by_last,
               app.first_name as approved_by_first,
               app.last_name as approved_by_last
        FROM expenses e
        LEFT JOIN accounts a ON e.account_id = a.id
        LEFT JOIN funds f ON e.fund_id = f.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        LEFT JOIN users req ON e.requested_by = req.id
        LEFT JOIN users app ON e.approved_by = app.id
        ${whereClause}
        ORDER BY e.expense_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM expenses e ${whereClause}`;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        expenses: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      logger.error('Get expenses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create expense
  async createExpense(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { expense_date, description, amount, account_id, fund_id, department_id, vendor_id, project_id, notes } = req.body;

      // Generate expense number
      const expenseNumber = `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const query = `
        INSERT INTO expenses (expense_number, expense_date, description, amount, account_id, fund_id, department_id, vendor_id, project_id, requested_by, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
        RETURNING *
      `;

      const result = await pool.query(query, [
        expenseNumber, expense_date, description, amount, account_id, fund_id, department_id, vendor_id, project_id, req.user.id, notes
      ]);

      res.status(201).json({ expense: result.rows[0] });
    } catch (error) {
      logger.error('Create expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Approve expense
  async approveExpense(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { comments } = req.body;

      await client.query('BEGIN');

      // Update expense status
      const updateQuery = `
        UPDATE expenses 
        SET status = 'approved', approved_by = $1, approval_date = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(updateQuery, [req.user.id, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Expense not found' });
      }

      const expense = result.rows[0];

      // Create journal entry for the expense
      const entryNumber = `JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const entryQuery = `
        INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, total_debit, total_credit, created_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'posted')
        RETURNING *
      `;

      const entryResult = await client.query(entryQuery, [
        entryNumber, expense.expense_date, expense.description, 'expense', expense.id, expense.amount, expense.amount, req.user.id
      ]);

      const journalEntry = entryResult.rows[0];

      // Debit expense account
      const debitLine = `
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit_amount, credit_amount)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(debitLine, [journalEntry.id, expense.account_id, expense.description, expense.amount, 0]);

      // Credit cash/bank account (assuming account 1110 is cash)
      const creditLine = `
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit_amount, credit_amount)
        VALUES ($1, (SELECT id FROM accounts WHERE account_number = '1110'), $2, $3, $4)
      `;
      await client.query(creditLine, [journalEntry.id, expense.description, 0, expense.amount]);

      await client.query('COMMIT');

      res.json({ expense, journal_entry: journalEntry });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Approve expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  // ============================================
  // BUDGETS
  // ============================================

  // Get budgets
  async getBudgets(req, res) {
    try {
      const { fiscal_year, fund_id } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (fiscal_year) {
        whereClause += ` AND fiscal_year = $${paramIndex++}`;
        params.push(fiscal_year);
      }

      if (fund_id) {
        whereClause += ` AND fund_id = $${paramIndex++}`;
        params.push(fund_id);
      }

      const query = `
        SELECT b.*, 
               a.account_name,
               a.account_number,
               f.fund_name,
               (b.budgeted_amount - b.actual_amount) as remaining_budget
        FROM budgets b
        LEFT JOIN accounts a ON b.account_id = a.id
        LEFT JOIN funds f ON b.fund_id = f.id
        ${whereClause}
        ORDER BY fiscal_year DESC, fund_name, account_name
      `;

      const result = await pool.query(query, params);
      res.json({ budgets: result.rows });
    } catch (error) {
      logger.error('Get budgets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create budget
  async createBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { budget_name, fiscal_year, fund_id, account_id, budgeted_amount, period_type } = req.body;

      const query = `
        INSERT INTO budgets (budget_name, fiscal_year, fund_id, account_id, budgeted_amount, period_type, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await pool.query(query, [
        budget_name, fiscal_year, fund_id, account_id, budgeted_amount, period_type, req.user.id
      ]);

      res.status(201).json({ budget: result.rows[0] });
    } catch (error) {
      logger.error('Create budget error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // BANK RECONCILIATION
  // ============================================

  // Get bank reconciliations
  async getBankReconciliations(req, res) {
    try {
      const { status, reconciliation_date_from, reconciliation_date_to } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND br.status = $${paramIndex++}`;
        params.push(status);
      }

      if (reconciliation_date_from) {
        whereClause += ` AND br.reconciliation_date >= $${paramIndex++}`;
        params.push(reconciliation_date_from);
      }

      if (reconciliation_date_to) {
        whereClause += ` AND br.reconciliation_date <= $${paramIndex++}`;
        params.push(reconciliation_date_to);
      }

      const query = `
        SELECT br.*, 
               a.account_name,
               a.account_number,
               u.first_name as reconciled_by_first,
               u.last_name as reconciled_by_last
        FROM bank_reconciliations br
        LEFT JOIN accounts a ON br.bank_account_id = a.id
        LEFT JOIN users u ON br.reconciled_by = u.id
        ${whereClause}
        ORDER BY br.reconciliation_date DESC
      `;

      const result = await pool.query(query, params);
      res.json({ bank_reconciliations: result.rows });
    } catch (error) {
      logger.error('Get bank reconciliations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create bank reconciliation
  async createBankReconciliation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { reconciliation_date, bank_account_id, statement_balance, book_balance, notes } = req.body;

      const difference = parseFloat(statement_balance) - parseFloat(book_balance);

      const query = `
        INSERT INTO bank_reconciliations (reconciliation_date, bank_account_id, statement_balance, book_balance, difference, reconciled_by, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        reconciliation_date, bank_account_id, statement_balance, book_balance, difference, req.user.id, 
        Math.abs(difference) < 0.01 ? 'completed' : 'discrepancy', notes
      ]);

      res.status(201).json({ bank_reconciliation: result.rows[0] });
    } catch (error) {
      logger.error('Create bank reconciliation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // FINANCIAL REPORTS
  // ============================================

  // Get trial balance
  async getTrialBalance(req, res) {
    try {
      const { as_of_date } = req.query;

      const query = `
        SELECT a.account_number, a.account_name, a.account_type,
               COALESCE(SUM(jel.debit_amount), 0) as total_debit,
               COALESCE(SUM(jel.credit_amount), 0) as total_credit,
               CASE 
                 WHEN a.account_type IN ('asset', 'expense') THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
                 ELSE COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
               END as balance
        FROM accounts a
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE a.is_active = true
          AND je.status = 'posted'
          AND (je.entry_date <= $1 OR $1 IS NULL)
        GROUP BY a.id, a.account_number, a.account_name, a.account_type
        ORDER BY a.account_number
      `;

      const result = await pool.query(query, [as_of_date || null]);

      const totalDebit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_debit), 0);
      const totalCredit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_credit), 0);

      res.json({
        trial_balance: result.rows,
        summary: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_balanced: Math.abs(totalDebit - totalCredit) < 0.01
        }
      });
    } catch (error) {
      logger.error('Get trial balance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get income statement
  async getIncomeStatement(req, res) {
    try {
      const { start_date, end_date } = req.query;

      const query = `
        SELECT a.account_number, a.account_name, a.account_type, a.sub_type,
               COALESCE(SUM(jel.debit_amount), 0) as total_debit,
               COALESCE(SUM(jel.credit_amount), 0) as total_credit,
               COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0) as net_amount
        FROM accounts a
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE a.account_type IN ('income', 'expense')
          AND a.is_active = true
          AND je.status = 'posted'
          AND je.entry_date >= $1
          AND je.entry_date <= $2
        GROUP BY a.id, a.account_number, a.account_name, a.account_type, a.sub_type
        ORDER BY a.account_type, a.account_number
      `;

      const result = await pool.query(query, [start_date, end_date]);

      const totalIncome = result.rows
        .filter(row => row.account_type === 'income')
        .reduce((sum, row) => sum + parseFloat(row.net_amount), 0);
      
      const totalExpenses = result.rows
        .filter(row => row.account_type === 'expense')
        .reduce((sum, row) => sum + parseFloat(row.net_amount), 0);

      res.json({
        income_statement: result.rows,
        summary: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_income: totalIncome - totalExpenses
        }
      });
    } catch (error) {
      logger.error('Get income statement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get balance sheet
  async getBalanceSheet(req, res) {
    try {
      const { as_of_date } = req.query;

      const query = `
        SELECT a.account_number, a.account_name, a.account_type, a.sub_type,
               COALESCE(SUM(jel.debit_amount), 0) as total_debit,
               COALESCE(SUM(jel.credit_amount), 0) as total_credit,
               CASE 
                 WHEN a.account_type IN ('asset', 'expense') THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
                 ELSE COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
               END as balance
        FROM accounts a
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE a.account_type IN ('asset', 'liability', 'equity')
          AND a.is_active = true
          AND je.status = 'posted'
          AND (je.entry_date <= $1 OR $1 IS NULL)
        GROUP BY a.id, a.account_number, a.account_name, a.account_type, a.sub_type
        ORDER BY a.account_type, a.account_number
      `;

      const result = await pool.query(query, [as_of_date || null]);

      const totalAssets = result.rows
        .filter(row => row.account_type === 'asset')
        .reduce((sum, row) => sum + parseFloat(row.balance), 0);
      
      const totalLiabilities = result.rows
        .filter(row => row.account_type === 'liability')
        .reduce((sum, row) => sum + parseFloat(row.balance), 0);

      const totalEquity = result.rows
        .filter(row => row.account_type === 'equity')
        .reduce((sum, row) => sum + parseFloat(row.balance), 0);

      res.json({
        balance_sheet: result.rows,
        summary: {
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          total_equity: totalEquity,
          is_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        }
      });
    } catch (error) {
      logger.error('Get balance sheet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get fund balances
  async getFundBalances(req, res) {
    try {
      const { as_of_date } = req.query;

      const query = `
        SELECT f.fund_code, f.fund_name, f.fund_type,
               COALESCE(SUM(
                 CASE 
                   WHEN a.account_type IN ('asset', 'expense') THEN jel.debit_amount - jel.credit_amount
                   ELSE jel.credit_amount - jel.debit_amount
                 END
               ), 0) as balance
        FROM funds f
        LEFT JOIN accounts a ON f.id = a.fund_id
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE f.is_active = true
          AND je.status = 'posted'
          AND (je.entry_date <= $1 OR $1 IS NULL)
        GROUP BY f.id, f.fund_code, f.fund_name, f.fund_type
        ORDER BY f.fund_code
      `;

      const result = await pool.query(query, [as_of_date || null]);

      const totalBalance = result.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0);

      res.json({
        fund_balances: result.rows,
        summary: {
          total_balance: totalBalance
        }
      });
    } catch (error) {
      logger.error('Get fund balances error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // MEMBER CONTRIBUTION MANAGEMENT
  // ============================================

  // Get member giving history
  async getMemberGivingHistory(req, res) {
    try {
      const { member_id, start_date, end_date, category_id } = req.query;
      
      // If no member_id specified, use current user
      const targetMemberId = member_id || req.user.id;

      let whereClause = 'WHERE p.member_id = $1 AND p.status = $2';
      const params = [targetMemberId, 'completed'];
      let paramIndex = 3;

      if (start_date) {
        whereClause += ` AND p.payment_date >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND p.payment_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      if (category_id) {
        whereClause += ` AND pi.category_id = $${paramIndex++}`;
        params.push(category_id);
      }

      const query = `
        SELECT p.*, u.first_name, u.last_name,
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        ${whereClause}
        GROUP BY p.id, u.first_name, u.last_name
        ORDER BY p.payment_date DESC
      `;

      const result = await pool.query(query, params);

      // Calculate totals
      const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
      const tithes = result.rows.reduce((sum, row) => {
        const titheItem = row.payment_items?.find(item => item.category_name === 'Tithe');
        return sum + (titheItem ? parseFloat(titheItem.amount) : 0);
      }, 0);
      const offerings = result.rows.reduce((sum, row) => {
        const offeringItems = row.payment_items?.filter(item => item.category_name !== 'Tithe');
        return sum + offeringItems.reduce((s, i) => s + parseFloat(i.amount), 0);
      }, 0);

      res.json({
        member_id: targetMemberId,
        member_name: result.rows[0] ? `${result.rows[0].first_name} ${result.rows[0].last_name}` : null,
        period: { start: start_date, end: end_date },
        payments: result.rows,
        summary: {
          total_amount: totalAmount,
          tithes: tithes,
          offerings: offerings,
          payment_count: result.rows.length
        }
      });
    } catch (error) {
      logger.error('Get member giving history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate contribution statement for a member
  async generateContributionStatement(req, res) {
    try {
      const { member_id, year } = req.query;
      
      const targetMemberId = member_id || req.user.id;
      const statementYear = year || new Date().getFullYear();

      // Get member info
      const memberQuery = 'SELECT * FROM users WHERE id = $1';
      const memberResult = await pool.query(memberQuery, [targetMemberId]);

      if (memberResult.rows.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      const member = memberResult.rows[0];

      // Get all payments for the year
      const paymentsQuery = `
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM payments p
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        WHERE p.member_id = $1 
          AND p.status = 'completed'
          AND EXTRACT(YEAR FROM p.payment_date) = $2
        GROUP BY p.id
        ORDER BY p.payment_date ASC
      `;

      const paymentsResult = await pool.query(paymentsQuery, [targetMemberId, statementYear]);
      const payments = paymentsResult.rows;

      // Calculate totals
      const totalContributions = payments.reduce((sum, row) => sum + parseFloat(row.amount), 0);
      const totalTithes = payments.reduce((sum, row) => {
        const titheItem = row.payment_items?.find(item => item.category_name === 'Tithe');
        return sum + (titheItem ? parseFloat(titheItem.amount) : 0);
      }, 0);
      const totalOfferings = totalContributions - totalTithes;

      // Generate statement number
      const statementNumber = `CS-${statementYear}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Save statement record
      const statementQuery = `
        INSERT INTO contribution_statements (statement_number, member_id, year, total_contributions, tithes, offerings, generated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const statementResult = await pool.query(statementQuery, [
        statementNumber,
        targetMemberId,
        statementYear,
        totalContributions,
        totalTithes,
        totalOfferings,
        req.user.id
      ]);

      res.json({
        statement: statementResult.rows[0],
        member: {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          email: member.email,
          phone_number: member.phone_number
        },
        year: statementYear,
        payments: payments,
        summary: {
          total_contributions: totalContributions,
          tithes: totalTithes,
          offerings: totalOfferings,
          payment_count: payments.length
        }
      });
    } catch (error) {
      logger.error('Generate contribution statement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get contribution statements
  async getContributionStatements(req, res) {
    try {
      const { member_id, year } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (member_id) {
        whereClause += ` AND member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      if (year) {
        whereClause += ` AND year = $${paramIndex++}`;
        params.push(year);
      }

      const query = `
        SELECT cs.*, u.first_name, u.last_name, u.email
        FROM contribution_statements cs
        LEFT JOIN users u ON cs.member_id = u.id
        ${whereClause}
        ORDER BY cs.year DESC, cs.generated_at DESC
      `;

      const result = await pool.query(query, params);
      res.json({ statements: result.rows });
    } catch (error) {
      logger.error('Get contribution statements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get giving analytics
  async getGivingAnalytics(req, res) {
    try {
      const { start_date, end_date, group_by } = req.query;

      const startDate = start_date || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = end_date || new Date().toISOString().split('T')[0];

      let query, result;

      if (group_by === 'category') {
        // Group by payment category
        query = `
          SELECT pc.name as category, COALESCE(SUM(pi.amount), 0) as total, COUNT(DISTINCT p.member_id) as donor_count
          FROM payment_categories pc
          LEFT JOIN payment_items pi ON pc.id = pi.category_id
          LEFT JOIN payments p ON pi.payment_id = p.id AND p.status = 'completed' 
            AND p.payment_date >= $1 AND p.payment_date <= $2
          WHERE pc.is_active = true
          GROUP BY pc.id, pc.name
          ORDER BY total DESC
        `;
        result = await pool.query(query, [startDate, endDate]);
        res.json({ analytics: { by_category: result.rows, period: { start: startDate, end: endDate } } });
      } else if (group_by === 'month') {
        // Group by month
        query = `
          SELECT EXTRACT(MONTH FROM p.payment_date) as month, 
                 EXTRACT(YEAR FROM p.payment_date) as year,
                 COALESCE(SUM(p.amount), 0) as total, COUNT(*) as payment_count
          FROM payments p
          WHERE p.status = 'completed' 
            AND p.payment_date >= $1 AND p.payment_date <= $2
          GROUP BY EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date)
          ORDER BY year, month
        `;
        result = await pool.query(query, [startDate, endDate]);
        res.json({ analytics: { by_month: result.rows, period: { start: startDate, end: endDate } } });
      } else {
        // Overall summary
        query = `
          SELECT 
            COALESCE(SUM(p.amount), 0) as total_contributions,
            COUNT(DISTINCT p.member_id) as total_donors,
            COUNT(*) as total_payments,
            AVG(p.amount) as average_donation
          FROM payments p
          WHERE p.status = 'completed' 
            AND p.payment_date >= $1 AND p.payment_date <= $2
        `;
        result = await pool.query(query, [startDate, endDate]);
        res.json({ analytics: { overall: result.rows[0], period: { start: startDate, end: endDate } } });
      }
    } catch (error) {
      logger.error('Get giving analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // VENDOR MANAGEMENT
  // ============================================

  // Get all vendors
  async getVendors(req, res) {
    try {
      const { is_active } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        params.push(is_active === 'true');
      }

      const query = `
        SELECT v.*,
               COALESCE(SUM(e.amount), 0) as total_payments,
               COUNT(e.id) as payment_count
        FROM vendors v
        LEFT JOIN expenses e ON v.id = e.vendor_id AND e.status = 'approved'
        ${whereClause}
        GROUP BY v.id
        ORDER BY v.vendor_name ASC
      `;

      const result = await pool.query(query, params);
      res.json({ vendors: result.rows });
    } catch (error) {
      logger.error('Get vendors error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create vendor
  async createVendor(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { vendor_name, contact_person, phone_number, email, address, tax_id, payment_terms, notes } = req.body;

      // Generate vendor number
      const vendorNumber = `VND-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const query = `
        INSERT INTO vendors (vendor_number, vendor_name, contact_person, phone_number, email, address, tax_id, payment_terms, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await pool.query(query, [
        vendorNumber, vendor_name, contact_person, phone_number, email, address, tax_id, payment_terms, notes
      ]);

      res.status(201).json({ vendor: result.rows[0] });
    } catch (error) {
      logger.error('Create vendor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update vendor
  async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const { vendor_name, contact_person, phone_number, email, address, tax_id, payment_terms, is_active, notes } = req.body;

      const query = `
        UPDATE vendors 
        SET vendor_name = COALESCE($1, vendor_name),
            contact_person = COALESCE($2, contact_person),
            phone_number = COALESCE($3, phone_number),
            email = COALESCE($4, email),
            address = COALESCE($5, address),
            tax_id = COALESCE($6, tax_id),
            payment_terms = COALESCE($7, payment_terms),
            is_active = COALESCE($8, is_active),
            notes = COALESCE($9, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;

      const result = await pool.query(query, [
        vendor_name, contact_person, phone_number, email, address, tax_id, payment_terms, is_active, notes, id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ vendor: result.rows[0] });
    } catch (error) {
      logger.error('Update vendor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  // Get all projects
  async getProjects(req, res) {
    try {
      const { status, fund_id } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND p.status = $${paramIndex++}`;
        params.push(status);
      }

      if (fund_id) {
        whereClause += ` AND p.fund_id = $${paramIndex++}`;
        params.push(fund_id);
      }

      const query = `
        SELECT p.*, 
               f.fund_name,
               u.first_name as managed_by_first,
               u.last_name as managed_by_last
        FROM projects p
        LEFT JOIN funds f ON p.fund_id = f.id
        LEFT JOIN users u ON p.managed_by = u.id
        ${whereClause}
        ORDER BY p.start_date DESC
      `;

      const result = await pool.query(query, params);
      res.json({ projects: result.rows });
    } catch (error) {
      logger.error('Get projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create project
  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { project_code, project_name, description, start_date, end_date, budgeted_amount, fund_id, managed_by, notes } = req.body;

      const query = `
        INSERT INTO projects (project_code, project_name, description, start_date, end_date, budgeted_amount, fund_id, managed_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await pool.query(query, [
        project_code, project_name, description, start_date, end_date, budgeted_amount, fund_id, managed_by, notes
      ]);

      res.status(201).json({ project: result.rows[0] });
    } catch (error) {
      logger.error('Create project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // FIXED ASSETS MANAGEMENT
  // ============================================

  // Get all fixed assets
  async getFixedAssets(req, res) {
    try {
      const { asset_type, status } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (asset_type) {
        whereClause += ` AND asset_type = $${paramIndex++}`;
        params.push(asset_type);
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT fa.*
        FROM fixed_assets fa
        ${whereClause}
        ORDER BY fa.purchase_date DESC
      `;

      const result = await pool.query(query, params);
      res.json({ fixed_assets: result.rows });
    } catch (error) {
      logger.error('Get fixed assets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create fixed asset
  async createFixedAsset(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { asset_number, asset_name, asset_type, description, purchase_date, purchase_price, depreciation_method, useful_life_years, location, condition, notes } = req.body;

      // Calculate initial net book value
      const netBookValue = purchase_price;

      const query = `
        INSERT INTO fixed_assets (asset_number, asset_name, asset_type, description, purchase_date, purchase_price, depreciation_method, useful_life_years, location, condition, net_book_value, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await pool.query(query, [
        asset_number, asset_name, asset_type, description, purchase_date, purchase_price, depreciation_method, useful_life_years, location, condition, netBookValue, notes
      ]);

      res.status(201).json({ fixed_asset: result.rows[0] });
    } catch (error) {
      logger.error('Create fixed asset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // PLEDGE MANAGEMENT
  // ============================================

  // Get pledges
  async getPledges(req, res) {
    try {
      const { member_id, campaign_id, status } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (member_id) {
        whereClause += ` AND pl.member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      if (campaign_id) {
        whereClause += ` AND pl.campaign_id = $${paramIndex++}`;
        params.push(campaign_id);
      }

      if (status) {
        whereClause += ` AND pl.status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT pl.*, 
               u.first_name, u.last_name,
               c.campaign_name,
               COALESCE(SUM(pp.amount), 0) as amount_paid
        FROM pledges pl
        LEFT JOIN users u ON pl.member_id = u.id
        LEFT JOIN campaigns c ON pl.campaign_id = c.id
        LEFT JOIN pledge_payments pp ON pl.id = pp.pledge_id
        ${whereClause}
        GROUP BY pl.id, u.first_name, u.last_name, c.campaign_name
        ORDER BY pl.pledge_date DESC
      `;

      const result = await pool.query(query, params);
      res.json({ pledges: result.rows });
    } catch (error) {
      logger.error('Get pledges error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create pledge
  async createPledge(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { member_id, campaign_id, pledge_amount, pledge_date, start_date, end_date, payment_frequency, notes } = req.body;

      // Generate pledge number
      const pledgeNumber = `PLG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const query = `
        INSERT INTO pledges (pledge_number, member_id, campaign_id, pledge_amount, balance_due, pledge_date, start_date, end_date, payment_frequency, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        pledgeNumber, member_id, campaign_id, pledge_amount, pledge_amount, pledge_date, start_date, end_date, payment_frequency, notes
      ]);

      res.status(201).json({ pledge: result.rows[0] });
    } catch (error) {
      logger.error('Create pledge error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add pledge payment
  async addPledgePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { pledge_id, payment_id, amount, payment_date, notes } = req.body;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create pledge payment record
        const paymentQuery = `
          INSERT INTO pledge_payments (pledge_id, payment_id, amount, payment_date, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const paymentResult = await client.query(paymentQuery, [pledge_id, payment_id, amount, payment_date, notes]);

        // Update pledge amounts
        const updateQuery = `
          UPDATE pledges 
          SET amount_paid = amount_paid + $1,
              balance_due = balance_due - $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [amount, pledge_id]);

        // Check if pledge is fully paid
        if (updateResult.rows[0].balance_due <= 0) {
          await client.query(
            'UPDATE pledges SET status = $1 WHERE id = $2',
            ['completed', pledge_id]
          );
        }

        await client.query('COMMIT');

        res.status(201).json({ 
          pledge_payment: paymentResult.rows[0],
          pledge: updateResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Add pledge payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // RECURRING PAYMENTS
  // ============================================

  // Get recurring payments
  async getRecurringPayments(req, res) {
    try {
      const { member_id, status } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (member_id) {
        whereClause += ` AND rp.member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      if (status) {
        whereClause += ` AND rp.status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT rp.*, 
               u.first_name, u.last_name,
               pc.name as category_name,
               f.fund_name
        FROM recurring_payments rp
        LEFT JOIN users u ON rp.member_id = u.id
        LEFT JOIN payment_categories pc ON rp.category_id = pc.id
        LEFT JOIN funds f ON rp.fund_id = f.id
        ${whereClause}
        ORDER BY rp.next_payment_date ASC
      `;

      const result = await pool.query(query, params);
      res.json({ recurring_payments: result.rows });
    } catch (error) {
      logger.error('Get recurring payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create recurring payment
  async createRecurringPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { member_id, category_id, fund_id, amount, frequency, account_reference, description, next_payment_date } = req.body;

      const query = `
        INSERT INTO recurring_payments (member_id, category_id, fund_id, amount, frequency, account_reference, description, next_payment_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        member_id, category_id, fund_id, amount, frequency, account_reference, description, next_payment_date
      ]);

      res.status(201).json({ recurring_payment: result.rows[0] });
    } catch (error) {
      logger.error('Create recurring payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // SMS NOTIFICATIONS
  // ============================================

  // Send payment confirmation SMS
  async sendPaymentConfirmation(paymentId, userId) {
    try {
      // Get payment details
      const paymentQuery = `
        SELECT p.*, u.phone_number, u.first_name, u.last_name
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        WHERE p.id = $1
      `;
      const paymentResult = await pool.query(paymentQuery, [paymentId]);

      if (paymentResult.rows.length === 0 || !paymentResult.rows[0].phone_number) {
        return { success: false, message: 'Payment or phone number not found' };
      }

      const payment = paymentResult.rows[0];

      // Format message
      const message = `Thank you ${payment.first_name}! Your payment of KES ${payment.amount} has been received. Receipt: ${payment.mpesa_receipt_number || payment.transaction_id}. - Kiserian Main SDA Church`;

      // Send SMS
      await this.smsService.sendSMS([payment.phone_number], message, {
        sender_id: userId,
        template_id: null
      });

      return { success: true };
    } catch (error) {
      logger.error('Send payment confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send expense approval notification
  async sendExpenseApprovalNotification(expenseId, userId) {
    try {
      // Get expense details
      const expenseQuery = `
        SELECT e.*, u.phone_number, u.first_name, u.last_name
        FROM expenses e
        LEFT JOIN users u ON e.requested_by = u.id
        WHERE e.id = $1
      `;
      const expenseResult = await pool.query(expenseQuery, [expenseId]);

      if (expenseResult.rows.length === 0 || !expenseResult.rows[0].phone_number) {
        return { success: false, message: 'Expense or phone number not found' };
      }

      const expense = expenseResult.rows[0];

      // Format message
      const message = `Your expense request of KES ${expense.amount} for "${expense.description}" has been ${expense.status}. - Kiserian Main SDA Church`;

      // Send SMS
      await this.smsService.sendSMS([expense.phone_number], message, {
        sender_id: userId,
        template_id: null
      });

      return { success: true };
    } catch (error) {
      logger.error('Send expense approval notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send budget alert
  async sendBudgetAlert(budgetId, userId) {
    try {
      // Get budget details
      const budgetQuery = `
        SELECT b.*, a.account_name, u.phone_number, u.first_name
        FROM budgets b
        LEFT JOIN accounts a ON b.account_id = a.id
        LEFT JOIN users u ON b.created_by = u.id
        WHERE b.id = $1
      `;
      const budgetResult = await pool.query(budgetQuery, [budgetId]);

      if (budgetResult.rows.length === 0) {
        return { success: false, message: 'Budget not found' };
      }

      const budget = budgetResult.rows[0];
      const percentageUsed = (budget.actual_amount / budget.budgeted_amount) * 100;

      // Format message
      const message = `Budget Alert: Account "${budget.account_name}" has used ${percentageUsed.toFixed(1)}% of its budget (${budget.actual_amount} of ${budget.budgeted_amount}). - Kiserian Main SDA Church`;

      // Send to treasury team
      const treasuryQuery = `
        SELECT DISTINCT u.phone_number
        FROM users u
        CROSS JOIN UNNEST(u.roles) AS role
        WHERE role IN ('Super Admin', 'Pastor', 'First Elder', 'Treasurer')
          AND u.phone_number IS NOT NULL
          AND u.is_active = true
      `;
      const treasuryResult = await pool.query(treasuryQuery);
      const phoneNumbers = treasuryResult.rows.map(row => row.phone_number);

      if (phoneNumbers.length > 0) {
        await this.smsService.sendSMS(phoneNumbers, message, {
          sender_id: userId,
          template_id: null
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Send budget alert error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send monthly contribution summary
  async sendMonthlyContributionSummary(memberId, month, year, userId) {
    try {
      // Get member details and monthly contributions
      const memberQuery = `
        SELECT u.phone_number, u.first_name, u.last_name
        FROM users u
        WHERE u.id = $1
      `;
      const memberResult = await pool.query(memberQuery, [memberId]);

      if (memberResult.rows.length === 0 || !memberResult.rows[0].phone_number) {
        return { success: false, message: 'Member or phone number not found' };
      }

      const member = memberResult.rows[0];

      // Get monthly contribution total
      const contributionQuery = `
        SELECT COALESCE(SUM(p.amount), 0) as total, COUNT(*) as count
        FROM payments p
        WHERE p.member_id = $1
          AND p.status = 'completed'
          AND EXTRACT(YEAR FROM p.payment_date) = $2
          AND EXTRACT(MONTH FROM p.payment_date) = $3
      `;
      const contributionResult = await pool.query(contributionQuery, [memberId, year, month]);

      const { total, count } = contributionResult.rows[0];

      // Format message
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const message = `Dear ${member.first_name}, your contributions for ${monthNames[month - 1]} ${year}: ${count} payments totaling KES ${total}. Thank you for your faithfulness! - Kiserian Main SDA Church`;

      // Send SMS
      await this.smsService.sendSMS([member.phone_number], message, {
        sender_id: userId,
        template_id: null
      });

      return { success: true };
    } catch (error) {
      logger.error('Send monthly contribution summary error:', error);
      return { success: false, error: error.message };
    }
  }

  // Manual SMS trigger endpoint
  async sendTreasurySMS(req, res) {
    try {
      const { notification_type, reference_id, recipient_id } = req.body;

      let result;
      switch (notification_type) {
        case 'payment_confirmation':
          result = await this.sendPaymentConfirmation(reference_id, req.user.id);
          break;
        case 'expense_approval':
          result = await this.sendExpenseApprovalNotification(reference_id, req.user.id);
          break;
        case 'budget_alert':
          result = await this.sendBudgetAlert(reference_id, req.user.id);
          break;
        case 'monthly_summary':
          const now = new Date();
          result = await this.sendMonthlyContributionSummary(recipient_id, now.getMonth() + 1, now.getFullYear(), req.user.id);
          break;
        default:
          return res.status(400).json({ error: 'Invalid notification type' });
      }

      if (result.success) {
        res.json({ message: 'SMS sent successfully' });
      } else {
        res.status(500).json({ error: result.message || 'Failed to send SMS' });
      }
    } catch (error) {
      logger.error('Send treasury SMS error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  // Export journal entries to CSV
  async exportJournalEntries(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let whereClause = 'WHERE je.status = $1';
      const params = ['posted'];
      let paramIndex = 2;

      if (start_date) {
        whereClause += ` AND je.entry_date >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND je.entry_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      const query = `
        SELECT je.entry_number, je.entry_date, je.description, je.total_debit, je.total_credit, je.status,
               a.account_name, a.account_number,
               jel.debit_amount, jel.credit_amount
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        LEFT JOIN accounts a ON jel.account_id = a.id
        ${whereClause}
        ORDER BY je.entry_date ASC, je.entry_number ASC
      `;

      const result = await pool.query(query, params);

      // Format data for CSV
      const csvData = result.rows.map(row => ({
        'Entry Number': row.entry_number,
        'Entry Date': row.entry_date,
        'Description': row.description,
        'Account Number': row.account_number,
        'Account Name': row.account_name,
        'Debit': row.debit_amount || 0,
        'Credit': row.credit_amount || 0,
        'Status': row.status
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=journal_entries_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      logger.error('Export journal entries error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Export payments to CSV
  async exportPayments(req, res) {
    try {
      const { start_date, end_date, status } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (start_date) {
        whereClause += ` AND p.payment_date >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND p.payment_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      if (status) {
        whereClause += ` AND p.status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT p.*, u.first_name, u.last_name, u.phone_number,
               pc.name as category_name
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        ${whereClause}
        ORDER BY p.payment_date DESC
      `;

      const result = await pool.query(query, params);

      // Format data for CSV
      const csvData = result.rows.map(row => ({
        'Payment ID': row.id,
        'Member Name': `${row.first_name} ${row.last_name}`,
        'Phone': row.phone_number,
        'Amount': row.amount,
        'Payment Date': row.payment_date,
        'Category': row.category_name,
        'Status': row.status,
        'Payment Method': row.payment_method,
        'M-Pesa Receipt': row.mpesa_receipt_number,
        'Transaction ID': row.transaction_id
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payments_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      logger.error('Export payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Export expenses to CSV
  async exportExpenses(req, res) {
    try {
      const { start_date, end_date, status, fund_id } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (start_date) {
        whereClause += ` AND e.expense_date >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND e.expense_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      if (status) {
        whereClause += ` AND e.status = $${paramIndex++}`;
        params.push(status);
      }

      if (fund_id) {
        whereClause += ` AND e.fund_id = $${paramIndex++}`;
        params.push(fund_id);
      }

      const query = `
        SELECT e.*, a.account_name, f.fund_name, v.vendor_name,
               req.first_name as requested_by_first, req.last_name as requested_by_last,
               app.first_name as approved_by_first, app.last_name as approved_by_last
        FROM expenses e
        LEFT JOIN accounts a ON e.account_id = a.id
        LEFT JOIN funds f ON e.fund_id = f.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        LEFT JOIN users req ON e.requested_by = req.id
        LEFT JOIN users app ON e.approved_by = app.id
        ${whereClause}
        ORDER BY e.expense_date DESC
      `;

      const result = await pool.query(query, params);

      // Format data for CSV
      const csvData = result.rows.map(row => ({
        'Expense Number': row.expense_number,
        'Expense Date': row.expense_date,
        'Description': row.description,
        'Amount': row.amount,
        'Account': row.account_name,
        'Fund': row.fund_name,
        'Vendor': row.vendor_name,
        'Requested By': `${row.requested_by_first} ${row.requested_by_last}`,
        'Approved By': `${row.approved_by_first} ${row.approved_by_last}`,
        'Status': row.status,
        'Approval Date': row.approval_date
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=expenses_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      logger.error('Export expenses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Export contribution statements to CSV
  async exportContributionStatements(req, res) {
    try {
      const { year, member_id } = req.query;

      const targetYear = year || new Date().getFullYear();

      let whereClause = 'WHERE EXTRACT(YEAR FROM p.payment_date) = $1';
      const params = [targetYear];
      let paramIndex = 2;

      if (member_id) {
        whereClause += ` AND p.member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      const query = `
        SELECT p.*, u.first_name, u.last_name, u.email, u.phone_number,
               pc.name as category_name
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        ${whereClause}
        ORDER BY u.last_name, u.first_name, p.payment_date ASC
      `;

      const result = await pool.query(query, params);

      // Format data for CSV
      const csvData = result.rows.map(row => ({
        'Member Name': `${row.first_name} ${row.last_name}`,
        'Email': row.email,
        'Phone': row.phone_number,
        'Payment Date': row.payment_date,
        'Category': row.category_name,
        'Amount': row.amount,
        'Status': row.status,
        'Payment Method': row.payment_method
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=contributions_${targetYear}.csv`);
      res.send(csv);
    } catch (error) {
      logger.error('Export contribution statements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================
  // RECEIPT MANAGEMENT
  // ============================================

  // Generate receipt for payment
  async generateReceipt(req, res) {
    try {
      const { payment_id } = req.params;

      // Get payment details
      const paymentQuery = `
        SELECT p.*, u.first_name, u.last_name, u.email, u.phone_number, u.address,
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        WHERE p.id = $1
        GROUP BY p.id, u.first_name, u.last_name, u.email, u.phone_number, u.address
      `;

      const paymentResult = await pool.query(paymentQuery, [payment_id]);

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentResult.rows[0];

      // Check if receipt already exists
      const existingQuery = 'SELECT * FROM receipts WHERE payment_id = $1';
      const existingResult = await pool.query(existingQuery, [payment_id]);

      if (existingResult.rows.length > 0) {
        return res.json({ receipt: existingResult.rows[0] });
      }

      // Generate receipt number
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create receipt record
      const receiptQuery = `
        INSERT INTO receipts (receipt_number, payment_id, receipt_date, issued_by)
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
        RETURNING *
      `;

      const receiptResult = await pool.query(receiptQuery, [receiptNumber, payment_id, req.user.id]);

      res.status(201).json({ 
        receipt: receiptResult.rows[0],
        payment: payment
      });
    } catch (error) {
      logger.error('Generate receipt error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get receipts
  async getReceipts(req, res) {
    try {
      const { payment_id, member_id, receipt_date_from, receipt_date_to } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (payment_id) {
        whereClause += ` AND r.payment_id = $${paramIndex++}`;
        params.push(payment_id);
      }

      if (member_id) {
        whereClause += ` AND p.member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      if (receipt_date_from) {
        whereClause += ` AND r.receipt_date >= $${paramIndex++}`;
        params.push(receipt_date_from);
      }

      if (receipt_date_to) {
        whereClause += ` AND r.receipt_date <= $${paramIndex++}`;
        params.push(receipt_date_to);
      }

      const query = `
        SELECT r.*, p.amount, p.payment_date, p.payment_method, p.mpesa_receipt_number,
               u.first_name, u.last_name, u.email,
               iss.first_name as issued_by_first, iss.last_name as issued_by_last
        FROM receipts r
        LEFT JOIN payments p ON r.payment_id = p.id
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN users iss ON r.issued_by = iss.id
        ${whereClause}
        ORDER BY r.receipt_date DESC
      `;

      const result = await pool.query(query, params);
      res.json({ receipts: result.rows });
    } catch (error) {
      logger.error('Get receipts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate PDF receipt
  async generatePDFReceipt(req, res) {
    try {
      const { receipt_id } = req.params;

      // Get receipt details
      const receiptQuery = `
        SELECT r.*, p.amount, p.payment_date, p.payment_method, p.mpesa_receipt_number, p.notes,
               u.first_name, u.last_name, u.email, u.phone_number, u.address,
               iss.first_name as issued_by_first, iss.last_name as issued_by_last,
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM receipts r
        LEFT JOIN payments p ON r.payment_id = p.id
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN users iss ON r.issued_by = iss.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        WHERE r.id = $1
        GROUP BY r.id, p.amount, p.payment_date, p.payment_method, p.mpesa_receipt_number, p.notes,
                 u.first_name, u.last_name, u.email, u.phone_number, u.address,
                 iss.first_name, iss.last_name
      `;

      const receiptResult = await pool.query(receiptQuery, [receipt_id]);

      if (receiptResult.rows.length === 0) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      const receipt = receiptResult.rows[0];

      // Create PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt_${receipt.receipt_number}.pdf`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add receipt content
      doc.fontSize(20).text('Kiserian Main SDA Church', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('Official Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Receipt Number: ${receipt.receipt_number}`, { align: 'right' });
      doc.text(`Receipt Date: ${receipt.receipt_date.toISOString().split('T')[0]}`, { align: 'right' });
      doc.moveDown();
      
      doc.fontSize(12).text('Received from:');
      doc.fontSize(11).text(`${receipt.first_name} ${receipt.last_name}`);
      doc.text(`Email: ${receipt.email || 'N/A'}`);
      doc.text(`Phone: ${receipt.phone_number || 'N/A'}`);
      doc.moveDown();
      
      doc.fontSize(12).text('Payment Details:');
      doc.fontSize(11).text(`Amount: KES ${parseFloat(receipt.amount).toLocaleString()}`);
      doc.text(`Payment Date: ${receipt.payment_date.toISOString().split('T')[0]}`);
      doc.text(`Payment Method: ${receipt.payment_method}`);
      if (receipt.mpesa_receipt_number) {
        doc.text(`M-Pesa Receipt: ${receipt.mpesa_receipt_number}`);
      }
      doc.moveDown();

      if (receipt.payment_items && receipt.payment_items.length > 0) {
        doc.fontSize(12).text('Payment Breakdown:');
        receipt.payment_items.forEach(item => {
          doc.fontSize(11).text(`${item.category_name}: KES ${parseFloat(item.amount).toLocaleString()}`);
        });
        doc.moveDown();
      }

      if (receipt.notes) {
        doc.fontSize(12).text('Notes:');
        doc.fontSize(11).text(receipt.notes);
        doc.moveDown();
      }

      doc.fontSize(10).text(`Issued by: ${receipt.issued_by_first} ${receipt.issued_by_last}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(8).text('Thank you for your generous contribution!', { align: 'center' });

      doc.end();
    } catch (error) {
      logger.error('Generate PDF receipt error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new TreasuryController();
