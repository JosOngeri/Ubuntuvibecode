import api from '../../../services/api';

export const leaveAPI = {
  getAll: () => api.get('/leaves'),
  getBalance: employeeId => api.get(`/leaves/balance/${employeeId}`),
  checkConflict: (employeeId, startDate, endDate) =>
    api.get('/leaves/check-conflict', { params: { employeeId, startDate, endDate } }),
  requestLeave: data => {
    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'attachment' && value instanceof File) {
        formData.append('attachment', value);
        return;
      }
      formData.append(key, value);
    });

    return api.post('/leaves/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateLeaveStatus: (id, approverOrPayload, statusMaybe) => {
    const payload =
      approverOrPayload &&
      typeof approverOrPayload === 'object' &&
      !Array.isArray(approverOrPayload)
        ? approverOrPayload
        : { approverId: approverOrPayload, status: statusMaybe };

    return api.put(`/leaves/${id}/status`, payload);
  },
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.put(`/leaves/${id}/upload-doc`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: data => api.post('/leaves', data),
  update: (id, data) => api.put(`/leaves/${id}`, data),
  delete: id => api.delete(`/leaves/${id}`),
};
