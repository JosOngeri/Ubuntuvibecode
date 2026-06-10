/**
 * Employee Controller
 * Request handling layer for employee endpoints
 * Uses employee service for business logic
 */

// Temporary delegation to old controller until service layer is properly refactored
const oldEmployeeController = require('../../../../controllers/employee.controller');
const onboardingRepository = require('../../onboarding/repositories/onboarding.repository');

const getEmployees = (req, res) => oldEmployeeController.getEmployees(req, res);
const getMyEmployee = (req, res) => oldEmployeeController.getMyEmployee(req, res);
const getEmployeeById = (req, res) => oldEmployeeController.getEmployeeById(req, res);
const addEmployee = (req, res) => oldEmployeeController.addEmployee(req, res);
const updateEmployee = (req, res) => oldEmployeeController.updateEmployee(req, res);
const deleteEmployee = (req, res) => oldEmployeeController.deleteEmployee(req, res);

const getEmployeeAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const assets = await onboardingRepository.getEmployeeAssets(id);
    res.json(assets);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch employee assets' });
  }
};

const getOrientationProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const orientation = await onboardingRepository.findOrientationProgress(id);
    res.json(orientation);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch orientation progress' });
  }
};

module.exports = {
  getEmployees,
  getMyEmployee,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAssets,
  getOrientationProgress,
};
