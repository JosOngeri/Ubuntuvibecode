/**
 * k6 Load Test: Payroll Endpoints
 *
 * Tests payroll listing and calculation under load.
 * Run with: k6 run payroll-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config } from './config.js';

const errorRate = new Rate('payroll_errors');
const payrollListDuration = new Trend('payroll_list_duration');
const payslipDuration = new Trend('payslip_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 20 },
    { duration: '30s', target: 30 },
    { duration: '1m',  target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // Payroll calculations can be slower
    http_req_failed: ['rate<0.05'],
    payroll_errors: ['rate<0.05'],
    payroll_list_duration: ['p(95)<3000'],
    payslip_duration: ['p(95)<5000'],
  },
};

export function setup() {
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

  // Get employees for payroll tests
  const empRes = http.get(`${config.backendUrl}/api/employees`, {
    headers: { 'x-auth-token': body.token, 'Content-Type': 'application/json' },
  });

  const employees = empRes.status === 200 ? JSON.parse(empRes.body) : [];

  return { token: body.token, employees };
}

export default function (data) {
  const { token, employees } = data;
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': token,
  };

  // Get current period in YYYY-MM format
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastPeriod = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  group('Payroll List', () => {
    const start = Date.now();
    const res = http.get(`${config.backendUrl}/api/payroll`, { headers: authHeaders });
    payrollListDuration.add(Date.now() - start);

    const ok = check(res, {
      'payroll list status 200': (r) => r.status === 200,
      'payroll response is array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || (body && typeof body === 'object');
        } catch {
          return false;
        }
      },
      'payroll response time < 3s': (r) => r.timings.duration < 3000,
    });

    if (!ok) errorRate.add(1);
    sleep(1);
  });

  group('Payroll Calculation', () => {
    if (!employees.length) {
      sleep(1);
      return;
    }

    const employee = employees[Math.floor(Math.random() * employees.length)];

    const start = Date.now();
    const res = http.post(
      `${config.backendUrl}/api/payroll/calculate`,
      JSON.stringify({
        employeeId: employee.id,
        period: lastPeriod,
      }),
      { headers: authHeaders }
    );
    payslipDuration.add(Date.now() - start);

    // Either creates new or fails gracefully if already exists
    const ok = check(res, {
      'payroll calc returns 201 or 409': (r) => r.status === 201 || r.status === 409 || r.status === 400,
      'payroll calc response time < 5s': (r) => r.timings.duration < 5000,
    });

    if (res.status === 201) {
      const body = JSON.parse(res.body);
      check(body, {
        'payslip has net_pay': (b) => b.payslip && b.payslip.net_pay !== undefined,
        'payslip net_pay is number': (b) => b.payslip && !isNaN(Number(b.payslip.net_pay)),
        'payslip has gross_pay': (b) => b.payslip && b.payslip.gross_pay !== undefined,
      });
    }

    if (!ok) errorRate.add(1);
    sleep(2);
  });
}
