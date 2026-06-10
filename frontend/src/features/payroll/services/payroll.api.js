import api from '../../../services/api';

export const payrollAPI = {
  getPayslips: (employeeId) => api.get(`/api/payroll/payslips/${employeeId}`),
  getPayments: () => api.get('/api/payroll'),
  calculate: (period) => api.get(`/api/payroll/calculate/${period}`),
  approve: (id) => api.put(`/api/payroll/approve/${id}`),
  disburse: (data) => api.post('/api/payroll/disburse', data),
  getPayslipPdf: (id) => api.get(`/api/payroll/payslip/${id}`),
  batchGenerate: (data) => api.post('/api/payroll/batch-generate', data),
};

export default { payrollAPI };
