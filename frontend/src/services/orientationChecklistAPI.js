import api from './api';

export const orientationChecklistAPI = {
  getAll: () => api.get('/orientation-checklists'),
  getByRole: role => api.get(`/orientation-checklists/role/${role}`),
  getById: id => api.get(`/orientation-checklists/${id}`),
  create: data => api.post('/orientation-checklists', data),
  update: (id, data) => api.put(`/orientation-checklists/${id}`, data),
  delete: id => api.delete(`/orientation-checklists/${id}`)
};

export default orientationChecklistAPI;
