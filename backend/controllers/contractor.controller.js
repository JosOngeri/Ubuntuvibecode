const pool = require('../config/db');
const logger = require('../utils/logger');

const getContractorStats = async (req, res) => {
  try {
    const contractorId = req.user.id; // Assuming user is authenticated

    // Fetch active projects count
    const activeProjectsQuery = `
      SELECT COUNT(*) as count
      FROM projects
      WHERE contractor_id = $1 AND status = 'active'
    `;
    const activeProjectsResult = await pool.query(activeProjectsQuery, [contractorId]);
    const activeProjects = parseInt(activeProjectsResult.rows[0].count);

    // Fetch pending invoices count
    const pendingInvoicesQuery = `
      SELECT COUNT(*) as count
      FROM invoices
      WHERE contractor_id = $1 AND status = 'pending'
    `;
    const pendingInvoicesResult = await pool.query(pendingInvoicesQuery, [contractorId]);
    const pendingInvoices = parseInt(pendingInvoicesResult.rows[0].count);

    // Fetch delivery rate (assuming a delivery_rate table or calculation)
    const deliveryRateQuery = `
      SELECT AVG(delivery_rate) as rate
      FROM contractor_performance
      WHERE contractor_id = $1
    `;
    const deliveryRateResult = await pool.query(deliveryRateQuery, [contractorId]);
    const deliveryRate = Math.round(parseFloat(deliveryRateResult.rows[0].rate) || 0);

    res.json({
      activeProjects,
      pendingInvoices,
      deliveryRate,
    });
  } catch (error) {
    logger.error('contractor.getStats', 'Error fetching stats', error, { contractorId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

const getContractorProjects = async (req, res) => {
  try {
    const contractorId = req.user.id;

    const query = `
      SELECT id, name, status, due_date as due
      FROM projects
      WHERE contractor_id = $1
      ORDER BY due_date ASC
    `;
    const result = await pool.query(query, [contractorId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('contractor.getProjects', 'Error fetching projects', error, { contractorId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

const getContractorInvoices = async (req, res) => {
  try {
    const contractorId = req.user.id;

    const query = `
      SELECT id, amount, status, due_date as due
      FROM invoices
      WHERE contractor_id = $1
      ORDER BY due_date ASC
    `;
    const result = await pool.query(query, [contractorId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('contractor.getInvoices', 'Error fetching invoices', error, { contractorId: req.user?.id });
    res.status(500).json({ msg: 'Server error' });
  }
};

const getRecentProjects = async (req, res) => {
  res.json([]);
};

const getRecentInvoices = async (req, res) => {
  res.json([]);
};

const createProject = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const updateProject = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const deleteProject = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const createInvoice = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const updateInvoice = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const deleteInvoice = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const getProfile = async (req, res) => {
  res.json({});
};

const updateProfile = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

const getReports = async (req, res) => {
  res.json([]);
};

module.exports = {
  getContractorStats,
  getContractorProjects,
  getContractorInvoices,
  getRecentProjects,
  getRecentInvoices,
  createProject,
  updateProject,
  deleteProject,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getProfile,
  updateProfile,
  getReports,
};