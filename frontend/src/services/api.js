import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Ensure every protected request carries the latest JWT from storage.
api.interceptors.request.use(
  config => {
    if (
      typeof config.url === 'string' &&
      config.url.startsWith('/') &&
      !config.url.startsWith('/api')
    ) {
      config.url = `/api${config.url}`;
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    logger.info('api.request', `${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    logger.error('api.request', 'Request setup error', error);
    return Promise.reject(error);
  }
);

// Auto-clear invalid sessions so the app can redirect to login cleanly.
api.interceptors.response.use(
  response => {
    logger.info(
      'api.response',
      `${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`
    );
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Retry on network errors (max 3 retries)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        logger.warn('api.response', `Network error — retry ${originalRequest._retryCount}/3`, {
          url: originalRequest.url,
        });
        const delay = 1000 * originalRequest._retryCount;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    const status = error.response?.status;
    const url = error.config?.url;
    logger.error('api.response', `HTTP ${status ?? 'network'} error`, error, {
      url,
      method: error.config?.method?.toUpperCase(),
    });

    // Handle HTTP errors
    if (status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Users (Admin/HR)
export const userAPI = {
  getAll: () => api.get('/api/users'),
  getById: id => api.get(`/api/users/${id}`),
  register: data => api.post('/api/auth/register', data),
  approve: (id, details) => api.post(`/api/users/${id}/approve`, details),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: id => api.delete(`/api/users/${id}`),
  assignRole: (id, role) => api.post(`/api/users/${id}/role`, { role }),
  getPreferences: () => api.get('/api/users/me/preferences'),
  updatePreferences: data => api.put('/api/users/me/preferences', data),
  getNotifications: userId => api.get(`/api/notifications/${userId}`),
  markNotificationAsRead: id => api.put(`/api/notifications/${id}/read`),
};

// KPIs
export const kpiAPI = {
  getEmployeeKPIs: employeeId => api.get(`/api/kpi/employee/${employeeId}`),
  assignKPI: data => api.post('/api/kpi/assign', data),
  evaluateKPI: (id, data) => api.put(`/api/kpi/${id}/evaluate`, data),
  create: data => api.post('/api/kpis', data),
  update: (id, data) => api.put(`/api/kpis/${id}`, data),
  delete: id => api.delete(`/api/kpis/${id}`),
};

// Contracts
export const contractAPI = {
  getByEmployeeId: employeeId => api.get(`/api/contracts/${employeeId}`),
  create: data => api.post('/api/contracts', data),
  update: (id, data) => api.put(`/api/contracts/${id}`, data),
  delete: id => api.delete(`/api/contracts/${id}`),
};

// Contractors
export const contractorAPI = {
  getStats: () => api.get('/api/contractors/stats'),
  getProjects: () => api.get('/api/contractors/projects'),
  getInvoices: () => api.get('/api/contractors/invoices'),
  getRecentProjects: () => api.get('/api/contractors/projects/recent'),
  getRecentInvoices: () => api.get('/api/contractors/invoices/recent'),
  createProject: data => api.post('/api/contractors/projects', data),
  updateProject: (id, data) => api.put(`/api/contractors/projects/${id}`, data),
  deleteProject: id => api.delete(`/api/contractors/projects/${id}`),
  createInvoice: data => api.post('/api/contractors/invoices', data),
  updateInvoice: (id, data) => api.put(`/api/contractors/invoices/${id}`, data),
  deleteInvoice: id => api.delete(`/api/contractors/invoices/${id}`),
  getProfile: () => api.get('/api/contractors/profile'),
  updateProfile: data => api.put('/api/contractors/profile', data),
  getReports: type => api.get('/api/contractors/reports', { params: { type } }),
};

// Complaints
export const complaintAPI = {
  getByEmployee: employeeId => api.get(`/api/complaints/employee/${employeeId}`),
};

// Jobs (Verification)
export const jobVerificationAPI = {
  verifyApplication: (jobId, appId) => api.post(`/api/jobs/${jobId}/applications/${appId}/verify`),
  getVerificationResults: (jobId, appId) => api.get(`/api/jobs/${jobId}/applications/${appId}/verification`),
  verifyBatch: jobId => api.post(`/api/jobs/${jobId}/applications/verify-batch`),
  updateManagerRanking: (jobId, appId, ranking) => api.put(`/api/jobs/${jobId}/applications/${appId}/manager-ranking`, { manager_ranking: ranking }),
  updateOwnerApproval: (jobId, appId, approved) => api.put(`/api/jobs/${jobId}/applications/${appId}/owner-approval`, { owner_approved: approved }),
};

export default api;
