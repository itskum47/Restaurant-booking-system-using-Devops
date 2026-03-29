const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Service URLs from environment variables
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3001';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:8002';

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'warn',
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Unable to reach upstream service',
      service: req.baseUrl
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info if available
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || 'anonymous');
      proxyReq.setHeader('X-User-Email', req.user.email || '');
    }
    console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  }
};

// AI Service routes
router.use(
  '/v1/ai',
  createProxyMiddleware({
    ...proxyOptions,
    target: AI_SERVICE_URL,
    pathRewrite: {
      '^/api/v1/ai': '/api/v1/ai'
    }
  })
);

// Restaurant Service routes
router.use(
  '/v1/restaurants',
  createProxyMiddleware({
    ...proxyOptions,
    target: RESTAURANT_SERVICE_URL,
    pathRewrite: {
      '^/api/v1/restaurants': '/api/v1/restaurants'
    }
  })
);

// Booking Service routes
router.use(
  '/v1/bookings',
  createProxyMiddleware({
    ...proxyOptions,
    target: BOOKING_SERVICE_URL,
    pathRewrite: {
      '^/api/v1/bookings': '/api/v1/bookings'
    }
  })
);

// Payments routes
router.use(
  '/v1/payments',
  createProxyMiddleware({
    ...proxyOptions,
    target: BOOKING_SERVICE_URL,
    pathRewrite: {
      '^/api/v1/payments': '/api/v1/payments'
    }
  })
);

// Restaurant owner dashboard routes
router.use(
  '/v1/dashboard',
  createProxyMiddleware({
    ...proxyOptions,
    target: BOOKING_SERVICE_URL,
    pathRewrite: {
      '^/api/v1/dashboard': '/api/v1/dashboard'
    }
  })
);

// Fallback for unknown API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: {
      ai: '/api/v1/ai/*',
      restaurants: '/api/v1/restaurants/*',
      bookings: '/api/v1/bookings/*',
      payments: '/api/v1/payments/*',
      dashboard: '/api/v1/dashboard/*'
    }
  });
});

module.exports = router;
