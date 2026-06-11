import api from '../../../services/api';

export const attendanceAPI = {
  getAll: () => api.get('/api/attendance/all'),
  getMyAttendance: () => api.get('/api/attendance/me'),
  getByEmployee: (employeeId) => api.get(`/api/attendance/${employeeId}`),
  getById: (id) => api.get(`/api/attendance/record/${id}`),
  punch: (data) => api.post('/api/attendance/manual/self', data),
  biometricPunch: (data) => api.post('/api/attendance/biometrics/push', data),
  update: (id, data) => api.put(`/api/attendance/${id}`, data),
  getToday: () => api.get('/api/attendance/today'),
};

export default { attendanceAPI };
