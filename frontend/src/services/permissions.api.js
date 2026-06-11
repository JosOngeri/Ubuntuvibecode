import api from './api';

export const permissionsAPI = {
  // Get all permissions list and duration types
  getAllPermissions: () => api.get('/permissions/list'),

  // Get my effective permissions
  getMyPermissions: () => api.get('/permissions/me'),

  // Get a user's permissions (requires appropriate permissions)
  getUserPermissions: userId => api.get(`/permissions/user/${userId}`),

  // Grant a permission with duration
  grantPermission: data => api.post('/permissions/grant', data),

  // Revoke a permission override
  revokePermission: (id, reason) => api.delete(`/permissions/revoke/${id}`, { data: { reason } }),

  // Get active permissions (process expired)
  getActivePermissions: () => api.get('/permissions/active'),

  // Get permissions expiring soon
  getExpiringSoon: (minutes = 10) => api.get('/permissions/expiring', { params: { minutes } }),

  // Get role default permissions
  getRolePermissions: role => api.get(`/permissions/role/${role}`),

  // Update role default permissions (admin only)
  updateRolePermissions: (role, permissions) =>
    api.put(`/permissions/role/${role}`, { permissions }),
};

export const supervisorAPI = {
  // Get all allocations
  getAllocations: params => api.get('/supervisor-allocations', { params }),

  // Create new allocation
  createAllocation: data => api.post('/supervisor-allocations', data),

  // Get allocation by ID
  getAllocation: id => api.get(`/supervisor-allocations/${id}`),

  // Update allocation
  updateAllocation: (id, data) => api.put(`/supervisor-allocations/${id}`, data),

  // Delete allocation
  deleteAllocation: (id, reason) =>
    api.delete(`/supervisor-allocations/${id}`, { data: { reason } }),

  // Get my supervisees
  getMySupervisees: date => api.get('/supervisor-allocations/me/supervisees', { params: { date } }),

  // Get my supervisors
  getMySupervisors: date => api.get('/supervisor-allocations/me/supervisors', { params: { date } }),
};

export const departmentHeadAPI = {
  // Get all assignments
  getAssignments: params => api.get('/department-heads', { params }),

  // Create new assignment
  createAssignment: data => api.post('/department-heads', data),

  // Get assignment by ID
  getAssignment: id => api.get(`/department-heads/${id}`),

  // Update assignment
  updateAssignment: (id, data) => api.put(`/department-heads/${id}`, data),

  // Delete assignment
  deleteAssignment: (id, reason) => api.delete(`/department-heads/${id}`, { data: { reason } }),

  // Get my assignment
  getMyAssignment: () => api.get('/department-heads/me'),

  // Get department head for a department
  getDepartmentHead: departmentId => api.get(`/department-heads/department/${departmentId}`),
};

export const auditAPI = {
  // Get audit logs with filters
  getLogs: params => api.get('/audit', { params }),

  // Get logs for a specific user
  getUserLogs: (userId, params) => api.get(`/audit/user/${userId}`, { params }),

  // Get logs for a specific entity
  getEntityLogs: (entityType, entityId, params) =>
    api.get(`/audit/entity/${entityType}/${entityId}`, { params }),

  // Create a log entry (for manual logging)
  createLog: data => api.post('/audit/log', data),
};

export const messageAPI = {
  // Send a message
  sendMessage: data => api.post('/messages', data),

  // Get conversations
  getConversations: () => api.get('/messages/conversations'),

  // Get messages in a conversation
  getConversationMessages: conversationId => api.get(`/messages/conversations/${conversationId}`),

  // Get received messages
  getReceivedMessages: params => api.get('/messages/received', { params }),

  // Get sent messages
  getSentMessages: params => api.get('/messages/sent', { params }),

  // Get complaints
  getComplaints: params => api.get('/messages/complaints', { params }),

  // Resolve a complaint
  resolveComplaint: (id, notes) => api.post(`/messages/complaints/${id}/resolve`, { notes }),

  // Delete a message
  deleteMessage: id => api.delete(`/messages/${id}`),
};

export default {
  permissions: permissionsAPI,
  supervisor: supervisorAPI,
  departmentHead: departmentHeadAPI,
  audit: auditAPI,
  message: messageAPI,
};
