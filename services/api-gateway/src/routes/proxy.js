const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const CircuitBreaker = require('../utils/circuitBreaker');

const router = express.Router();

// Service URLs from environment variables
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3001';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:8002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

const upstreamTimeoutMs = parseInt(process.env.UPSTREAM_TIMEOUT_MS || '8000', 10);

const aiBreaker = new CircuitBreaker('ai-service', {
  failureThreshold: parseInt(process.env.CB_AI_FAILURE_THRESHOLD || '5', 10),
  recoveryTimeoutMs: parseInt(process.env.CB_AI_RECOVERY_MS || '30000', 10),
  successThreshold: parseInt(process.env.CB_AI_SUCCESS_THRESHOLD || '2', 10),
});

const bookingBreaker = new CircuitBreaker('booking-service', {
  failureThreshold: parseInt(process.env.CB_BOOKING_FAILURE_THRESHOLD || '5', 10),
  recoveryTimeoutMs: parseInt(process.env.CB_BOOKING_RECOVERY_MS || '30000', 10),
  successThreshold: parseInt(process.env.CB_BOOKING_SUCCESS_THRESHOLD || '2', 10),
});

const restaurantBreaker = new CircuitBreaker('restaurant-service', {
  failureThreshold: parseInt(process.env.CB_RESTAURANT_FAILURE_THRESHOLD || '5', 10),
  recoveryTimeoutMs: parseInt(process.env.CB_RESTAURANT_RECOVERY_MS || '30000', 10),
  successThreshold: parseInt(process.env.CB_RESTAURANT_SUCCESS_THRESHOLD || '2', 10),
});

const notificationBreaker = new CircuitBreaker('notification-service', {
  failureThreshold: parseInt(process.env.CB_NOTIFICATION_FAILURE_THRESHOLD || '5', 10),
  recoveryTimeoutMs: parseInt(process.env.CB_NOTIFICATION_RECOVERY_MS || '30000', 10),
  successThreshold: parseInt(process.env.CB_NOTIFICATION_SUCCESS_THRESHOLD || '2', 10),
});

function breakerGuard(breaker, fallbackMessage) {
  return (req, res, next) => {
    if (breaker.canRequest()) {
      return next();
    }

    return res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: fallbackMessage,
      service: breaker.name,
      state: breaker.state,
    });
  };
}

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'warn',
  proxyTimeout: upstreamTimeoutMs,
  timeout: upstreamTimeoutMs,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (req.breaker) {
      req.breaker.onFailure();
    }
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Unable to reach upstream service',
      service: req.baseUrl
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    if (!req.breaker) {
      return;
    }

    if (proxyRes.statusCode >= 500) {
      req.breaker.onFailure();
      return;
    }

    req.breaker.onSuccess();
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info if available
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || 'anonymous');
      proxyReq.setHeader('X-User-Email', req.user.email || '');
    }
    if (req.correlationId) {
      proxyReq.setHeader('X-Correlation-Id', req.correlationId);
    }
    console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  }
};

function serviceProxy(pathPrefix, target, breaker) {
  return [
    breakerGuard(breaker, `${breaker.name} is currently degraded. Please retry shortly.`),
    (req, res, next) => {
      req.breaker = breaker;
      return next();
    },
    createProxyMiddleware({
      ...proxyOptions,
      target,
      pathRewrite: {
        [`^/api/${pathPrefix}`]: `/api/${pathPrefix}`,
      },
    }),
  ];
}

// AI Service routes
router.use('/v1/ai', ...serviceProxy('v1/ai', AI_SERVICE_URL, aiBreaker));

// Restaurant Service routes
router.use('/v1/restaurants', ...serviceProxy('v1/restaurants', RESTAURANT_SERVICE_URL, restaurantBreaker));

// Booking Service routes
router.use('/v1/bookings', ...serviceProxy('v1/bookings', BOOKING_SERVICE_URL, bookingBreaker));

// Payments routes
router.use('/v1/payments', ...serviceProxy('v1/payments', BOOKING_SERVICE_URL, bookingBreaker));

// Restaurant owner dashboard routes
router.use('/v1/dashboard', ...serviceProxy('v1/dashboard', BOOKING_SERVICE_URL, bookingBreaker));

router.use('/v1/notifications', ...serviceProxy('v1/notifications', NOTIFICATION_SERVICE_URL, notificationBreaker));

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
