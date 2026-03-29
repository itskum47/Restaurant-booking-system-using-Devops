/**
 * api-gateway Jest integration tests.
 * Tests authentication middleware, rate limiting, and routing.
 */
const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

const TEST_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';

function makeToken(payload = {}) {
  return jwt.sign(
    { sub: 'user-test-001', email: 'test@example.com', ...payload },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Authentication Middleware', () => {
  it('rejects requests without Authorization header', async () => {
    const res = await request(app).get('/api/v1/bookings');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects expired token', async () => {
    const token = jwt.sign(
      { sub: 'user-001' },
      TEST_SECRET,
      { expiresIn: -1 }      // already expired
    );
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('accepts valid JWT and forwards request', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`);
    // 200 or proxy response — not a 401
    expect(res.status).not.toBe(401);
  });

  it('adds X-User-ID header when forwarding', async () => {
    const token = makeToken({ sub: 'user-42' });
    // Spy on the proxy call to confirm header is set
    const { proxyHeaders } = require('../src/middleware/auth');
    const headers = proxyHeaders(token);
    expect(headers['X-User-ID']).toBe('user-42');
  });
});

describe('Rate Limiting', () => {
  it('allows requests under the limit', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/health')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks requests over the limit', async () => {
    const token = makeToken({ sub: 'rate-limit-test-user' });
    // Exhaust the rate limit (configured to 5 req/min in tests)
    const requests = Array.from({ length: 6 }, () =>
      request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${token}`)
    );
    const responses = await Promise.all(requests);
    const blocked = responses.filter((r) => r.status === 429);
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('returns Retry-After header when rate limited', async () => {
    const token = makeToken({ sub: 'retry-after-test-user' });
    const requests = Array.from({ length: 10 }, () =>
      request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${token}`)
    );
    const responses = await Promise.all(requests);
    const limited = responses.find((r) => r.status === 429);
    if (limited) {
      expect(limited.headers).toHaveProperty('retry-after');
    }
  });
});

describe('Health Check', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes version in health response', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('version');
  });
});

describe('Security Headers', () => {
  it('sets X-Content-Type-Options nosniff', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options deny', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('does not expose internal headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['server']).toBeUndefined();
  });
});
