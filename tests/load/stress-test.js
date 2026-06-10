/**
 * k6 Stress Test: Full System Under Extreme Load
 *
 * Simulates extreme traffic to find breaking points.
 * Run with: k6 run stress-test.js
 * WARNING: Only run against a test environment, not production.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from './config.js';

const errorRate = new Rate('stress_errors');
const requestDuration = new Trend('stress_duration');
const breakingPoint = new Counter('requests_after_degradation');

export const options = {
  stages: [
    { duration: '2m',  target: 100 },   // Ramp up gradually
    { duration: '5m',  target: 100 },   // Hold at 100 users
    { duration: '2m',  target: 200 },   // Push harder
    { duration: '5m',  target: 200 },   // Hold at 200
    { duration: '2m',  target: 300 },   // Near breaking point
    { duration: '5m',  target: 300 },   // Hold at 300
    { duration: '2m',  target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],   // More lenient under stress
    http_req_failed: ['rate<0.20'],       // Allow up to 20% errors under extreme load
    stress_errors: ['rate<0.20'],
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
    throw new Error('Setup failed: cannot login for stress test');
  }

  return { token: JSON.parse(loginRes.body).token };
}

export default function (data) {
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': data.token,
  };

  group('Concurrent Mixed Traffic', () => {
    // Simulate real user behavior - mix of read and write operations

    // Health check (should always be fast)
    group('Health', () => {
      const start = Date.now();
      const res = http.get(`${config.backendUrl}/api/health`);
      requestDuration.add(Date.now() - start);

      const ok = check(res, {
        'health check ok': (r) => r.status === 200,
      });
      if (!ok) errorRate.add(1);
    });

    sleep(0.1);

    // Employee list (read-heavy)
    group('Employee List', () => {
      const start = Date.now();
      const res = http.get(`${config.backendUrl}/api/employees`, { headers: authHeaders });
      requestDuration.add(Date.now() - start);

      const ok = check(res, {
        'employees ok under stress': (r) => r.status === 200 || r.status === 503,
      });
      if (!ok) {
        errorRate.add(1);
        if (res.timings.duration > 5000) {
          breakingPoint.add(1);
        }
      }
    });

    sleep(0.2);

    // Notifications (per-user queries)
    group('Notifications', () => {
      const res = http.get(`${config.backendUrl}/api/notifications`, { headers: authHeaders });
      check(res, {
        'notifications ok under stress': (r) => r.status === 200 || r.status === 503,
      });
    });

    sleep(0.3);
  });

  sleep(Math.random() * 2 + 1); // Random 1-3s think time
}
