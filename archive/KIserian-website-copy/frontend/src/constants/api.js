/**
 * API endpoint constants
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    PROFILE: '/api/auth/profile',
    REQUEST_PASSWORD_RESET: '/api/auth/request-password-reset',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    ACTIVITY_HISTORY: '/api/users/activity-history',
    CHANGE_PASSWORD: '/api/users/change-password',
  },

  // Announcements
  ANNOUNCEMENTS: {
    BASE: '/api/announcements',
    PUBLIC: '/api/announcements/public',
    PUBLIC_BY_ID: (id) => `/api/announcements/public/${id}`,
    BY_ID: (id) => `/api/announcements/${id}`,
  },

  // Departments
  DEPARTMENTS: {
    BASE: '/api/departments',
    BY_ID: (id) => `/api/departments/${id}`,
    USER_DEPARTMENTS: '/api/department/user',
    DEPARTMENT: {
      BASE: '/api/department',
      DASHBOARD: (id) => `/api/department/${id}/dashboard`,
      COMMUNICATIONS: (id) => `/api/department/${id}/communications`,
      MEMBERS: (id) => `/api/department/${id}/members`,
      MEETINGS: (id) => `/api/department/${id}/meetings`,
    },
  },

  // Payments
  PAYMENTS: {
    BASE: '/api/payments',
    MY_PAYMENTS: '/api/payments/my-payments',
    STATUS: (transaction_id) => `/api/payments/status/${transaction_id}`,
    CATEGORIES: '/api/payments/categories',
    CALLBACK: '/api/payments/mpesa/callback',
  },

  // Events
  EVENTS: {
    BASE: '/api/events',
    BY_ID: (id) => `/api/events/${id}`,
  },

  // SMS
  SMS: {
    BASE: '/api/sms',
    HISTORY: '/api/sms/history',
    BALANCE: '/api/sms/balance',
    SEND: '/api/sms/send-blessed',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITY: '/api/dashboard/activity',
  },

  // Health
  HEALTH: '/api/health',
}

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}
