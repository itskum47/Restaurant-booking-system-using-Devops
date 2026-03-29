/**
 * k6 Load Test — AI Service NLP Parser
 * Run:  k6 run --env BASE_URL=http://localhost:8001 load-tests/ai-service-load.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate    = new Rate('errors');
const parseLatency = new Trend('nlp_parse_latency_ms');
const slotLatency  = new Trend('slot_recommendation_latency_ms');

export const options = {
  stages: [
    { duration: '1m', target: 5  },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 40 },
    { duration: '1m', target: 0  },
  ],
  thresholds: {
    'http_req_duration':      ['p(95)<3000', 'p(99)<8000'],
    'http_req_failed':        ['rate<0.02'],
    'errors':                 ['rate<0.03'],
    'nlp_parse_latency_ms':   ['p(95)<3000'],
    'slot_recommendation_latency_ms': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';

const NLP_PHRASES = [
  "Book a table for 4 tomorrow evening at 7pm",
  "I need a reservation for 2 people this Saturday",
  "Can I get a table for tonight at 8 o'clock for 6 people?",
  "Reserve a spot for 3 guests next Friday at 6:30pm",
  "Table for two, anniversary dinner Saturday night",
  "Reservation for 8 people next weekend for a birthday party",
  "I want to eat there Friday at noon, just two of us",
  "Do you have availability for 5 on December 25th?",
];

function randomPhrase() {
  return NLP_PHRASES[Math.floor(Math.random() * NLP_PHRASES.length)];
}

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  group('Health check', () => {
    const res = http.get(`${BASE_URL}/health`, { headers });
    check(res, { 'health 200': r => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(0.1);

  group('NLP parse', () => {
    const before = Date.now();
    const res = http.post(`${BASE_URL}/api/parse`, JSON.stringify({
      text: randomPhrase(),
    }), { headers });

    parseLatency.add(Date.now() - before);

    const ok = res.status === 200;
    check(res, {
      'parse 200':       () => ok,
      'has date field':  () => ok && res.json('date') !== undefined,
      'has party_size':  () => ok && res.json('party_size') !== undefined,
    });
    errorRate.add(!ok);

    if (ok) {
      const parsed = res.json();

      sleep(0.2);

      group('Slot recommendation', () => {
        const before2 = Date.now();
        const slotRes = http.post(`${BASE_URL}/api/recommend-slots`, JSON.stringify({
          restaurant_id: 'rest-001',
          date:          parsed.date || new Date().toISOString().split('T')[0],
          party_size:    parsed.party_size || 2,
          preference:    parsed.time || 'evening',
        }), { headers });

        slotLatency.add(Date.now() - before2);

        const slotOk = slotRes.status === 200;
        check(slotRes, {
          'slots 200':     () => slotOk,
          'has slots':     () => slotOk && Array.isArray(slotRes.json('slots')),
          'slots nonzero': () => slotOk && slotRes.json('slots').length > 0,
        });
        errorRate.add(!slotOk);
      });
    }
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    'load-tests/ai-service-summary.json': JSON.stringify(data, null, 2),
    stdout: `
AI Service Load Test Summary
----------------------------
NLP Parse P95:   ${data.metrics.nlp_parse_latency_ms?.values?.['p(95)']?.toFixed(0) ?? 'n/a'} ms
Slot Recom P95:  ${data.metrics.slot_recommendation_latency_ms?.values?.['p(95)']?.toFixed(0) ?? 'n/a'} ms
Error Rate:      ${((data.metrics.errors?.values?.rate ?? 0) * 100).toFixed(2)}%
Total Requests:  ${data.metrics.http_reqs?.values?.count ?? 0}
`,
  };
}
