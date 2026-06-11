import api from './api';

export const faviconAPI = {
  getActive: () => api.get('/favicons/active'),
  getAll: () => api.get('/favicons'),
  upload: (formData) => api.post('/favicons/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  setDefault: (id) => api.post('/favicons/default', { id }),
  activate: (id) => api.put(`/favicons/${id}/activate`),
  delete: (id) => api.delete(`/favicons/${id}`)
};

export default faviconAPI;
