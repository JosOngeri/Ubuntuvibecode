/**
 * Employee Service
 * Business logic layer for employee operations
 * TODO: Refactor to extract business logic from controller
 */

const oldEmployeeController = require('../../../../controllers/employee.controller');

// Temporary delegation to old controller until refactoring is complete
const getEmployees = async (query) => {
  return oldEmployeeController.getEmployees({ query }, { json: (data) => data });
};

const getMyEmployee = async (userId) => {
  return oldEmployeeController.getMyEmployee({ user: { id: userId } }, { json: (data) => data });
};

const getEmployeeById = async (id) => {
  return oldEmployeeController.getEmployeeById({ params: { id } }, { json: (data) => data });
};

const addEmployee = async (body) => {
  return oldEmployeeController.addEmployee({ body }, { json: (data) => data });
};

const updateEmployee = async (id, body) => {
  return oldEmployeeController.updateEmployee({ params: { id }, body }, { json: (data) => data });
};

const deleteEmployee = async (id) => {
  return oldEmployeeController.deleteEmployee({ params: { id } }, { json: (data) => data });
};

module.exports = {
  getEmployees,
  getMyEmployee,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};
