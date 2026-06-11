/**
 * Shared configuration for all k6 load tests
 */

export const config = {
  backendUrl: __ENV.BACKEND_URL || 'http://localhost:5000',
  frontendUrl: __ENV.FRONTEND_URL || 'http://localhost:5173',

  testAdmin: {
    username: __ENV.TEST_ADMIN_USER || 'testadmin',
    password: __ENV.TEST_ADMIN_PASS || 'testpass123',
  },

  testEmployee: {
    username: __ENV.TEST_EMPLOYEE_USER || 'testemployee',
    password: __ENV.TEST_EMPLOYEE_PASS || 'testpass123',
  },

  testManager: {
    username: __ENV.TEST_MANAGER_USER || 'testmanager',
    password: __ENV.TEST_MANAGER_PASS || 'testpass123',
  },
};

/**
 * Helper: Login and return auth token
 */
export function getAuthToken(username, password) {
  const http = require('k6/http');
  const res = http.post(
    `${config.backendUrl}/api/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    return null;
  }

  try {
    return JSON.parse(res.body).token;
  } catch {
    return null;
  }
}
