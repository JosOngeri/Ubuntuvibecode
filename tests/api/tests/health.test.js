/**
 * health.test.js
 *
 * Smoke-test for GET /api/health.
 * This is intentionally the simplest test file – it verifies that the Express
 * app loads correctly and the health endpoint responds as expected.
 *
 * DB is mocked so no real PostgreSQL connection is needed.
 */

// ── Mock DB before app is required ────────────────────────────────────────────
jest.mock('../../../backend/config/db', () => ({
  query:        jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  pool:         { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
                  connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
                  end: jest.fn() },
  connectDB:    jest.fn(),
  closeDB:      jest.fn(),
  initDatabase: jest.fn(),
}));

// ── Mock email utility (used by some middleware) ──────────────────────────────
jest.mock('../../../backend/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: false }),
}));

const request = require('supertest');
const app     = require('../../../backend/app');

// ─────────────────────────────────────────────────────────────────────────────

describe('Health Check – GET /api/health', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('returns JSON body { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('responds with Content-Type application/json', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('does NOT require an auth token', async () => {
    // Health check is public – no x-auth-token header supplied
    const res = await request(app).get('/api/health');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
