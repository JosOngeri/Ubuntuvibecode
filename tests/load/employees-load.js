/**
 * k6 Load Test: Employee Endpoints
 *
 * Tests employee listing and detail retrieval under load.
 * Run with: k6 run employees-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, getAuthToken } from './config.js';

const errorRate = new Rate('errors');
const employeeListDuration = new Trend('employee_list_duration');
const employeeDetailDuration = new Trend('employee_detail_duration');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m',  target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    employee_list_duration: ['p(95)<2000'],
    employee_detail_duration: ['p(95)<1500'],
  },
};

// Shared state - token obtained once per VU
let authToken = null;

export function setup() {
  // Login once and share token data across VUs
  const loginRes = http.post(
    `${config.backendUrl}/api/auth/login`,
    JSON.stringify({
      username: config.testAdmin.username,
      password: config.testAdmin.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Setup failed: could not login. Status: ${loginRes.status}`);
  }

  const body = JSON.parse(loginRes.body);
  return { token: body.token };
}

export default function (data) {
  const token = data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': token,
  };

  group('Employee List', () => {
    const start = Date.now();
    const res = http.get(`${config.backendUrl}/api/employees`, { headers: authHeaders });
    employeeListDuration.add(Date.now() - start);

    const ok = check(res, {
      'employees list status 200': (r) => r.status === 200,
      'employees list is array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
      'employee names are present': (r) => {
        try {
          const employees = JSON.parse(r.body);
          if (!employees.length) return true; // Empty is ok
          return employees.every(
            (e) => e.firstName !== undefined && e.lastName !== undefined
          );
        } catch {
          return false;
        }
      },
      'response time < 3s': (r) => r.timings.duration < 3000,
    });

    if (!ok) errorRate.add(1);
    sleep(0.5);
  });

  group('Employee Detail', () => {
    // First get list to get a real ID
    const listRes = http.get(`${config.backendUrl}/api/employees`, { headers: authHeaders });
    if (listRes.status !== 200) {
      sleep(1);
      return;
    }

    const employees = JSON.parse(listRes.body);
    if (!employees.length) {
      sleep(1);
      return;
    }

    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const employeeId = randomEmployee.id;

    const start = Date.now();
    const detailRes = http.get(
      `${config.backendUrl}/api/employees/${employeeId}`,
      { headers: authHeaders }
    );
    employeeDetailDuration.add(Date.now() - start);

    const ok = check(detailRes, {
      'employee detail status 200': (r) => r.status === 200,
      'employee has firstName': (r) => {
        try {
          return JSON.parse(r.body).firstName !== undefined;
        } catch {
          return false;
        }
      },
      'employee has lastName': (r) => {
        try {
          return JSON.parse(r.body).lastName !== undefined;
        } catch {
          return false;
        }
      },
      'detail response time < 1.5s': (r) => r.timings.duration < 1500,
    });

    if (!ok) errorRate.add(1);
    sleep(1);
  });
}
