import api from '../../../services/api';

export const onboardingAPI = {
  startOnboarding: applicationId => api.post(`/onboarding/start/${applicationId}`),
  saveStep: (applicationId, stepNumber, data) => api.post(`/onboarding/${applicationId}/step/${stepNumber}`, data),
  getProgress: applicationId => api.get(`/onboarding/${applicationId}/progress`),
  completeOnboarding: applicationId => api.post(`/onboarding/${applicationId}/complete`),
  getDepartments: () => api.get('/onboarding/departments'),
  createDepartment: data => api.post('/onboarding/departments', data),
  getPotentialSupervisors: () => api.get('/onboarding/supervisors'),
  getAvailableAssets: () => api.get('/onboarding/assets/available'),
  uploadDocument: data => api.post('/onboarding/documents', data),
  getApplicationDocuments: applicationId => api.get(`/onboarding/documents/application/${applicationId}`),
  getEmployeeDocuments: employeeId => api.get(`/onboarding/documents/employee/${employeeId}`),
  deleteDocument: documentId => api.delete(`/onboarding/documents/${documentId}`),
};
