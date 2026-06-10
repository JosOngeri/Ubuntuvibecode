import api from './api';

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: conversationId => api.get(`/messages/conversations/${conversationId}`),
  getReceived: (params = {}) => api.get('/messages/received', { params }),
  getSent: (params = {}) => api.get('/messages/sent', { params }),
  sendMessage: data => api.post('/messages', data),
  getComplaints: (params = {}) => api.get('/messages/complaints', { params }),
  resolveComplaint: (id, notes) => api.post(`/messages/complaints/${id}/resolve`, { notes }),
  deleteMessage: id => api.delete(`/messages/${id}`),
};

export default messagesAPI;
