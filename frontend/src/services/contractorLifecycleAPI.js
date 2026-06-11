import api from './api';

export const contractorLifecycleAPI = {
  // Quotes
  getQuotes: () => api.get('/contractor-lifecycle/quotes'),
  createQuote: data => api.post('/contractor-lifecycle/quotes', data),
  approveQuote: id => api.put(`/contractor-lifecycle/quotes/${id}/approve`),
  rejectQuote: (id, reason) => api.put(`/contractor-lifecycle/quotes/${id}/reject`, { reason }),
  
  // Milestones
  getMilestones: () => api.get('/contractor-lifecycle/milestones'),
  createMilestone: data => api.post('/contractor-lifecycle/milestones', data),
  updateProgress: (id, progress) => api.put(`/contractor-lifecycle/milestones/${id}/progress`, { progress }),
  verifyMilestone: (id, kpiScore) => api.put(`/contractor-lifecycle/milestones/${id}/verify`, { kpi_score: kpiScore }),
  releasePayment: (id, amount) => api.put(`/contractor-lifecycle/milestones/${id}/payment`, { payment_amount: amount }),
  addDailyWageDay: (id, days) => api.post(`/contractor-lifecycle/milestones/${id}/daily-wage`, { daily_wage_days: days }),
  
  // KPI
  getKPI: () => api.get('/contractor-lifecycle/kpi'),
  getKPIByContractor: contractorId => api.get(`/contractor-lifecycle/kpi/${contractorId}`)
};

export default contractorLifecycleAPI;
