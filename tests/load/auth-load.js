/**
 * k6 Load Test: Authentication Endpoints
 *
 * Tests login throughput and error rates under load.
 * Run with: k6 run auth-load.js
 * Run with options: k6 run --vus 50 --duration 60s auth-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from './config.js';

// Custom metrics
const loginErrorRate = new Rate('login_errors');
const loginDuration = new Trend('login_duration');
const loginSuccess = new Counter('login_success');
const loginFailed = new Counter('login_failed');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m',  target: 25 },   // Hold at 25 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m',  target: 50 },   // Hold at peak
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],        // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],           // Less than 5% error rate
    login_errors: ['rate<0.05'],              // Login error rate under 5%
    login_duration: ['p(95)<1500'],           // 95% of logins under 1.5s
  },
};

export default function () {
  group('Login Flow', () => {
    const startTime = Date.now();

    // Valid login
    const validLogin = http.post(
      `${config.backendUrl}/api/auth/login`,
      JSON.stringify({
        username: config.testAdmin.username,
        password: config.testAdmin.password,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const duration = Date.now() - startTime;
    loginDuration.add(duration);

    const loginOk = check(validLogin, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          return JSON.parse(r.body).token !== undefined;
        } catch {
          return false;
        }
      },
      'login response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (loginOk) {
      loginSuccess.add(1);
    } else {
      loginFailed.add(1);
      loginErrorRate.add(1);
    }

    sleep(1);

    // Invalid login (should be rejected)
    const invalidLogin = http.post(
      `${config.backendUrl}/api/auth/login`,
      JSON.stringify({
        username: 'nonexistentuser',
        password: 'wrongpassword',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(invalidLogin, {
      'invalid login returns 400': (r) => r.status === 400,
      'invalid login has error message': (r) => {
        try {
          return JSON.parse(r.body).msg !== undefined;
        } catch {
          return false;
        }
      },
    });

    sleep(0.5);
  });
}
