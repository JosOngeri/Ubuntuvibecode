import api from '../../../services/api';

export const jobAPI = {
  getAll: (params = {}) => api.get('/api/jobs', { params }),
  getById: id => api.get(`/api/jobs/${id}`),
  getPublicList: () => api.get('/api/jobs/public/list'),
  getPublicJob: id => api.get(`/api/jobs/public/${id}`),
  create: data => api.post('/api/jobs', data),
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  delete: id => api.delete(`/api/jobs/${id}`),
  extendDeadline: (id, data) => api.put(`/api/jobs/${id}/extend-deadline`, data),
  getMyApplications: () => api.get('/api/jobs/my-applications'),
  getApplications: jobId => api.get(`/api/jobs/${jobId}/applications`),
  getApplicationById: appId => api.get(`/api/jobs/applications/${appId}`),
  getAllApplications: () => api.get('/api/jobs/applications/all'),
  getShortlisted: () => api.get('/api/jobs/applications/shortlisted/all'),
  getApplicationsByEmployee: employeeId => api.get(`/api/jobs/applications/employee/${employeeId}`),
  getApplicationsByApplicant: email => api.get(`/api/jobs/applications/applicant/${email}`),
  getApplicant: (jobId, appId) => api.get(`/api/jobs/${jobId}/applicants/${appId}`),
  updateApplicant: (jobId, appId, data) => api.put(`/api/jobs/${jobId}/applicants/${appId}`, data),
  deleteApplicant: (jobId, appId) => api.delete(`/api/jobs/${jobId}/applicants/${appId}`),
  updateApplicationStatus: (appId, data) => api.put(`/api/jobs/applications/${appId}/status`, data),
  applyToJob: (jobId, formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (typeof formData[key] === 'object') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });
    return api.post(`/api/jobs/${jobId}/apply`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  scoreApplicants: (jobId, data) => api.post(`/api/jobs/${jobId}/score-applicants`, data),
  filterApplicants: (jobId, data) => api.post(`/api/jobs/${jobId}/filter-applicants`, data),
  reallocateRating: data => api.post('/api/jobs/applications/reallocate-rating', data),
  reverseRating: appId => api.post(`/api/jobs/applications/${appId}/reverse-rating`),
  shortlistApplication: appId => api.post(`/api/jobs/applications/${appId}/shortlist`),
  updateInterviewScore: (appId, data) => api.put(`/api/jobs/applications/${appId}/interview-score`, data),
  sendOffer: (appId, data) => api.post(`/api/jobs/applications/${appId}/send-offer`, data),
  createInterviewInvite: (appId, data) => api.post(`/api/jobs/applications/${appId}/interview-invite`, data),
  inputPanelistScores: (appId, data) => api.post(`/api/jobs/applications/${appId}/input-scores`, data),
  submitInterviewFeedback: (appId, token, data) => api.post(`/api/jobs/applications/${appId}/interview-feedback/${token}`, data),
  getInterviewSummary: appId => api.get(`/api/jobs/applications/${appId}/interview-summary`),
  getInterviewDetail: appId => api.get(`/api/jobs/applications/${appId}/interview-detail`),
  importApplicationToEmployee: (appId, employeeId) => api.post(`/api/jobs/applications/${appId}/import-to-employee/${employeeId}`),
  validateOffer: data => api.post('/api/jobs/offers/validate', data),
  acceptOffer: data => api.post('/api/jobs/offers/accept', data),
  negotiateSalary: data => api.post('/api/jobs/offers/negotiate', data),
};

export const jobApplicationAPI = {
  getByEmployeeId: employeeId => api.get(`/api/jobs/applications/employee/${employeeId}`),
  getByApplicantEmail: email => api.get(`/api/jobs/applications/applicant/${email}`),
};

export const verificationAPI = {
  verifyApplication: (jobId, appId) => api.post(`/api/jobs/${jobId}/applications/${appId}/verify`),
  getVerificationResults: (jobId, appId) =>
    api.get(`/api/jobs/${jobId}/applications/${appId}/verification`),
  verifyAllApplications: jobId => api.post(`/api/jobs/${jobId}/applications/verify-batch`),
  updateManagerRanking: (jobId, appId, ranking, notes) =>
    api.put(`/api/jobs/${jobId}/applications/${appId}/manager-ranking`, { ranking, notes }),
  updateOwnerApproval: (jobId, appId, status, notes) =>
    api.put(`/api/jobs/${jobId}/applications/${appId}/owner-approval`, { status, notes }),
};

export default { jobAPI, jobApplicationAPI, verificationAPI };
