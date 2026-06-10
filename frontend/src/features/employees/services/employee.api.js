import api from '../../../services/api';

export const employeeAPI = {
  getAll: () => api.get('/api/employees'),
  getMe: () => api.get('/api/employees/me'),
  getById: id => api.get(`/api/employees/${id}`),
  create: data => api.post('/api/employees', data),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  delete: id => api.delete(`/api/employees/${id}`),
  getEmployeeAssets: id => api.get(`/api/employees/${id}/assets`),
  getOrientationProgress: id => api.get(`/api/employees/${id}/orientation`),
};

export default employeeAPI;
