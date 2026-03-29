/**
 * k6 Load Test — Booking Flow (end-to-end)
 * Run:  k6 run --env BASE_URL=http://localhost:3000 load-tests/booking-flow.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate    = new Rate('errors');
const bookingRate  = new Rate('booking_success');
const latencyTrend = new Trend('booking_latency_ms');
const bookingsCreated = new Counter('bookings_created');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // ramp-up
    { duration: '5m', target: 50 },   // sustained load
    { duration: '2m', target: 100 },  // peak
    { duration: '2m', target: 0  },   // ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed':   ['rate<0.01'],
    'errors':            ['rate<0.02'],
    'booking_success':   ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const RESTAURANTS = ['rest-001', 'rest-002', 'rest-003'];
const PARTY_SIZES = [2, 4, 6];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getToken() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: `loadtest+${__VU}@example.com`,
    password: 'LoadTest@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, { 'login 200': r => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json('token');
}

export default function () {
  const token = getToken();
  if (!token) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const restaurantId = randomItem(RESTAURANTS);
  const partySize    = randomItem(PARTY_SIZES);
  const date         = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  group('Browse restaurants', () => {
    const res = http.get(`${BASE_URL}/api/restaurants?limit=10`, { headers });
    check(res, { 'restaurants 200': r => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5);

  group('Check availability', () => {
    const res = http.get(
      `${BASE_URL}/api/bookings/availability?restaurantId=${restaurantId}&date=${date}&partySize=${partySize}`,
      { headers }
    );
    check(res, { 'availability 200': r => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3);

  group('Create booking', () => {
    const before = Date.now();
    const res = http.post(`${BASE_URL}/api/bookings`, JSON.stringify({
      restaurantId,
      date,
      time: '19:00',
      partySize,
      specialRequests: 'Window seat preferred',
    }), { headers });

    const elapsed = Date.now() - before;
    latencyTrend.add(elapsed);

    const ok = res.status === 201 || res.status === 200;
    check(res, { 'booking created': r => ok });
    bookingRate.add(ok);
    errorRate.add(!ok);

    if (ok) {
      bookingsCreated.add(1);
      const bookingId = res.json('id') || res.json('_id');

      if (bookingId) {
        sleep(0.2);
        group('Cancel booking (cleanup)', () => {
          const cancel = http.del(`${BASE_URL}/api/bookings/${bookingId}`, null, { headers });
          check(cancel, { 'cancel 200/204': r => [200, 204].includes(r.status) });
        });
      }
    }
  });

  sleep(Math.random() * 2 + 1);
}
